import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Mock browser globals for Node environment compatibility if needed
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0
  };
}

const readReqBody = async (req: IncomingMessage) => {
  const buffers: any[] = [];
  for await (const chunk of req) buffers.push(chunk);
  return (globalThis as any).Buffer.concat(buffers).toString();
};

const sendJson = (res: ServerResponse, status: number, data: any) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

const safeJson = (rawText: string) => {
  try {
    return JSON.parse(rawText);
  } catch {
    return { error: 'Upstream returned non-JSON response', raw: rawText };
  }
};

/**
 * OPENROUTER PROXY
 * Browser calls: POST /api/openrouter/chat
 * Server attaches Authorization: Bearer <OPENROUTER_API_KEY>
 *
 * Priority:
 * 1) process.env.OPENROUTER_API_KEY
 * 2) request header x-openrouter-key (optional fallback)
 */
const createOpenRouterProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/openrouter/chat')) return next();

      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }

      const envKey = (process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || '').trim();
      const headerKey = String(req.headers['x-openrouter-key'] || '').trim();
      const OPENROUTER_API_KEY = envKey || headerKey;

      if (!OPENROUTER_API_KEY) {
        return sendJson(res, 401, {
          error: 'Authorization required: Missing OPENROUTER_API_KEY (set Railway env var) or x-openrouter-key header.'
        });
      }

      const bodyStr = await readReqBody(req);
      const body = safeJson(bodyStr);

      // Accept either:
      // A) { prompt, systemInstruction, model }
      // B) { messages, model }
      const model = body?.model || 'google/gemini-2.0-flash-001';

      const messages =
        Array.isArray(body?.messages)
          ? body.messages
          : [
              ...(body?.systemInstruction
                ? [{ role: 'system', content: String(body.systemInstruction) }]
                : []),
              { role: 'user', content: String(body?.prompt || '') }
            ];

      const upstreamPayload = {
        model,
        messages
      };

      const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify(upstreamPayload)
      });

      const rawText = await upstreamRes.text();
      const parsed = safeJson(rawText);

      return sendJson(res, upstreamRes.status, parsed);
    } catch (e: any) {
      return sendJson(res, 500, { error: e?.message || 'OpenRouter Proxy Error' });
    }
  };
};

const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';

      // Only proxy routes under /api/kie/suno
      if (!url.startsWith('/api/kie/suno')) return next();

      // Priority:
      // 1) process.env.KIE_API_KEY
      // 2) env.KIE_API_KEY
      // 3) request header x-kie-key (optional fallback)
      const envKey = (process.env.KIE_API_KEY || env.KIE_API_KEY || '').trim();
      const headerKey = String(req.headers['x-kie-key'] || '').trim();
      const KIE_API_KEY = envKey || headerKey;

      if (!KIE_API_KEY) {
        return sendJson(res, 401, {
          error: 'Authorization required: Missing KIE_API_KEY (set Railway env var) or x-kie-key header.'
        });
      }

      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      if (
        req.method === 'POST' &&
        (url.includes('/suno_submit') || url.endsWith('/submit') || url.includes('/submit?'))
      ) {
        const bodyStr = await readReqBody(req);
        const upstreamUrl = `${KIE_GENERATE_BASE}`;

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_API_KEY}`
          },
          body: bodyStr
        });

        const rawText = await upstreamRes.text();
        const parsed = safeJson(rawText);

        return sendJson(res, upstreamRes.status, {
          _debug_upstreamStatus: upstreamRes.status,
          _debug_upstreamUrl: upstreamUrl,
          ...parsed
        });
      }

      if (
        req.method === 'GET' &&
        (url.includes('/status/') || url.startsWith('/api/kie/suno/record-info'))
      ) {
        let taskId = '';

        if (url.includes('/status/')) {
          const parts = url.split('/');
          taskId = parts[parts.length - 1] || '';
        } else {
          const u = new URL(`http://local${url}`);
          taskId = u.searchParams.get('taskId') || '';
        }

        if (!taskId) return sendJson(res, 400, { error: 'Missing taskId' });

        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'GET',
          headers: { Authorization: `Bearer ${KIE_API_KEY}` }
        });

        const rawText = await upstreamRes.text();
        return sendJson(res, upstreamRes.status, safeJson(rawText));
      }

      return sendJson(res, 404, { error: 'Route not found in KIE Proxy', path: url });
    } catch (e: any) {
      return sendJson(res, 500, { error: e?.message || 'Internal Proxy Error' });
    }
  };
};

export default defineConfig(() => {
  const env = process.env as Record<string, string>;

  const openRouterMw = createOpenRouterProxyMiddleware(env);
  const kieMw = createKieProxyMiddleware(env);

  return {
    plugins: [
      react(),
      {
        name: 'prospector-proxy-server',
        configureServer(server) {
          server.middlewares.use(openRouterMw);
          server.middlewares.use(kieMw);
        },
        configurePreviewServer(server) {
          server.middlewares.use(openRouterMw);
          server.middlewares.use(kieMw);
        }
      }
    ],
    define: {
      'process.env.OPENROUTER_API_KEY': JSON.stringify(process.env.OPENROUTER_API_KEY),
      'process.env.KIE_API_KEY': JSON.stringify(process.env.KIE_API_KEY)
    },
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 5173,
      allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost']
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 4173,
      allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost']
    }
  };
});
