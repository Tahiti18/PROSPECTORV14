import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

const PROXY_VERSION = 'openrouter-normalize-v3-2026-01-13';

const readBody = async (req: IncomingMessage) => {
  const buffers: Buffer[] = [];
  for await (const chunk of req) buffers.push(chunk as Buffer);
  return Buffer.concat(buffers).toString('utf8');
};

const sendJson = (res: ServerResponse, status: number, data: any, extraHeaders?: Record<string, string>) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Prospector-Proxy', PROXY_VERSION);
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  }
  res.end(JSON.stringify(data));
};

const safeParseJson = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/kie')) return next();

      const KIE_KEY = env.KIE_API_KEY || env.KIE_KEY || process.env.KIE_API_KEY;
      if (!KIE_KEY) return sendJson(res, 500, { error: 'Missing KIE_API_KEY' });

      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      if (req.method === 'POST') {
        const bodyStr = await readBody(req);
        const upstreamRes = await fetch(KIE_GENERATE_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_KEY}`
          },
          body: bodyStr
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(res, upstreamRes.status, parsed);
      }

      if (req.method === 'GET') {
        const u = new URL(req.url!, `http://${req.headers.host}`);
        const taskId = u.searchParams.get('taskId') || u.pathname.split('/').pop() || '';
        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;
        const upstreamRes = await fetch(upstreamUrl, {
          headers: { Authorization: `Bearer ${KIE_KEY}` }
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(res, upstreamRes.status, parsed);
      }

      return sendJson(res, 404, { error: 'KIE Route Invalid' });
    } catch (e: any) {
      return sendJson(res, 500, { error: e?.message || 'Internal Proxy Error' });
    }
  };
};

const createOpenRouterMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/openrouter')) return next();

      // Allow /api/openrouter/chat and /api/openrouter/chat?...
      if (!(req.method === 'POST' && url.startsWith('/api/openrouter/chat'))) {
        return sendJson(res, 404, { error: 'OpenRouter Route Invalid' });
      }

      const headerKey = (req.headers['x-openrouter-key'] as string | undefined)?.trim() || '';
      const OPENROUTER_KEY =
        env.OPENROUTER_API_KEY || env.API_KEY || process.env.OPENROUTER_API_KEY || headerKey;

      if (!OPENROUTER_KEY) {
        return sendJson(res, 500, { error: 'Missing OPENROUTER_API_KEY' });
      }

      // Read & parse body (this is where empty bodies can happen)
      const raw = await readBody(req);
      const incoming = safeParseJson(raw) || {};

      // Normalize model
      const model =
        incoming.model ||
        incoming.modelStr ||
        'google/gemini-3-flash-preview';

      // Normalize prompt/system from multiple legacy shapes
      const system =
        (typeof incoming.systemInstruction === 'string' ? incoming.systemInstruction : '') ||
        (typeof incoming.system === 'string' ? incoming.system : '') ||
        '';

      const prompt =
        (typeof incoming.prompt === 'string' ? incoming.prompt : '') ||
        (typeof incoming.input === 'string' ? incoming.input : '') ||
        (typeof incoming.text === 'string' ? incoming.text : '') ||
        '';

      // Normalize messages
      let messages: any[] | null = Array.isArray(incoming.messages) ? incoming.messages : null;

      // If messages missing, build from system+prompt
      if (!messages) {
        const built: any[] = [];
        if (system.trim()) built.push({ role: 'system', content: system });
        if (prompt.trim()) built.push({ role: 'user', content: prompt });
        messages = built;
      }

      // Final guard: must have at least one non-empty content
      const hasContent =
        Array.isArray(messages) &&
        messages.some((m) => (m?.content || '').toString().trim().length > 0);

      if (!hasContent) {
        // DO NOT call OpenRouter with garbage. Return a useful debug error.
        return sendJson(
          res,
          400,
          {
            ok: false,
            error: {
              message: 'Client payload missing prompt/messages',
              code: 400
            },
            debug: {
              proxyVersion: PROXY_VERSION,
              rawBodyLength: (raw || '').length,
              receivedKeys: Object.keys(incoming || {}),
              receivedHasMessages: Array.isArray(incoming.messages),
              receivedPromptType: typeof incoming.prompt
            }
          },
          {
            'X-Prospector-Debug': 'missing-prompt'
          }
        );
      }

      const payload = { model, messages };

      const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://prospectorv14-production.up.railway.app',
          'X-Title': 'ProspectorV14'
        },
        body: JSON.stringify(payload)
      });

      const parsed = await upstreamRes.json().catch(() => ({}));

      // Include proxy version header on ALL responses to prove you’re on the new build
      res.setHeader('X-Prospector-Proxy', PROXY_VERSION);
      return sendJson(res, upstreamRes.status, parsed);
    } catch (e: any) {
      return sendJson(res, 500, { error: e?.message || 'Internal OpenRouter Proxy Error' });
    }
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Make env visible to middleware at runtime (Railway)
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === 'string' && v.length > 0 && !process.env[k]) {
      process.env[k] = v;
    }
  }

  return {
    plugins: [
      react(),
      {
        name: 'api-proxy-server',
        configureServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env));
          server.middlewares.use(createOpenRouterMiddleware(env));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env));
          server.middlewares.use(createOpenRouterMiddleware(env));
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
