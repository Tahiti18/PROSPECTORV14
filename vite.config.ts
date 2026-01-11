import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * DEV/PREVIEW ONLY:
 * Vite middleware proxies so the browser never calls OpenRouter/KIE directly.
 * Production uses server.mjs (Express) for the same routes.
 */

const json = (res: ServerResponse, status: number, data: any) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

const readBody = async (req: IncomingMessage) => {
  const buffers: any[] = [];
  for await (const chunk of req) buffers.push(chunk);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).Buffer.concat(buffers).toString('utf-8');
};

const safeJson = (rawText: string) => {
  try { return JSON.parse(rawText); } catch { return { error: 'Upstream returned non-JSON response', raw: rawText }; }
};

const createOpenRouterProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/openrouter/chat')) return next();
      if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' });

      const OPENROUTER_API_KEY =
        process.env.OPENROUTER_API_KEY ||
        env.OPENROUTER_API_KEY;

      if (!OPENROUTER_API_KEY) {
        return json(res, 500, { error: 'Server configuration error: Missing OPENROUTER_API_KEY' });
      }

      const bodyStr = await readBody(req);
      const body = safeJson(bodyStr);

      const prompt = body?.prompt ?? '';
      const systemInstruction = body?.systemInstruction ?? '';
      const model = body?.model ?? 'google/gemini-2.0-flash-001';

      const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'Prospector OS'
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: String(prompt) }
          ]
        })
      });

      const rawText = await upstreamRes.text();
      // return raw JSON (OpenRouter format) so geminiService can parse choices[0].message.content
      return json(res, upstreamRes.status, safeJson(rawText));
    } catch (e: any) {
      return json(res, 500, { error: e?.message || 'Internal OpenRouter Proxy Error' });
    }
  };
};

const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';

      // Only proxy routes under /api/kie/suno
      if (!url.startsWith('/api/kie/suno')) return next();

      const KIE_API_KEY =
        process.env.KIE_API_KEY ||
        process.env.KIE_KEY || // backwards-compat
        env.KIE_API_KEY ||
        env.KIE_KEY;

      if (!KIE_API_KEY) {
        return json(res, 500, { error: 'Server configuration error: Missing KIE_API_KEY (or KIE_KEY)' });
      }

      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      if (
        req.method === 'POST' &&
        (url.includes('/suno_submit') || url.endsWith('/submit') || url.includes('/submit?'))
      ) {
        const bodyStr = await readBody(req);
        const upstreamUrl = `${KIE_GENERATE_BASE}`;

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_API_KEY}`
          },
          body: bodyStr
        });

        const rawText = await upstreamRes.text();
        const parsed = safeJson(rawText);
        return json(res, upstreamRes.status, {
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

        if (!taskId) return json(res, 400, { error: 'Missing taskId' });

        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
        });

        const rawText = await upstreamRes.text();
        return json(res, upstreamRes.status, safeJson(rawText));
      }

      return json(res, 404, { error: 'Route not found in KIE Proxy', path: url });
    } catch (e: any) {
      return json(res, 500, { error: e?.message || 'Internal KIE Proxy Error' });
    }
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-proxy-server',
        configureServer(server) {
          server.middlewares.use(createOpenRouterProxyMiddleware(env as Record<string, string>));
          server.middlewares.use(createKieProxyMiddleware(env as Record<string, string>));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createOpenRouterProxyMiddleware(env as Record<string, string>));
          server.middlewares.use(createKieProxyMiddleware(env as Record<string, string>));
        }
      }
    ],
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
