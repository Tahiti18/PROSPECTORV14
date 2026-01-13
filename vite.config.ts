import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

const readBody = async (req: IncomingMessage) => {
  const buffers: any[] = [];
  for await (const chunk of req) buffers.push(chunk);
  return (globalThis as any).Buffer.concat(buffers).toString('utf8');
};

const sendJson = (res: ServerResponse, status: number, data: any) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/kie')) return next();

      const KIE_KEY = env.KIE_API_KEY || env.KIE_KEY || process.env.KIE_API_KEY;

      if (!KIE_KEY) {
        return sendJson(res, 500, { error: 'Server configuration error: Missing KIE_API_KEY' });
      }

      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      if (req.method === 'POST' && (url.includes('/submit') || url.includes('/suno_submit') || url.includes('/video_submit'))) {
        const bodyStr = await readBody(req);
        const upstreamRes = await fetch(KIE_GENERATE_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_KEY}`,
          },
          body: bodyStr,
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(res, upstreamRes.status, parsed);
      }

      if (req.method === 'GET' && (url.includes('/status/') || url.includes('/record-info') || url.includes('/suno/record-info'))) {
        const u = new URL(req.url!, `http://${req.headers.host}`);
        const taskId = u.pathname.split('/').pop() || u.searchParams.get('taskId') || '';
        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;
        const upstreamRes = await fetch(upstreamUrl, {
          headers: { 'Authorization': `Bearer ${KIE_KEY}` },
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

      // Only one supported route
      if (!(req.method === 'POST' && url.startsWith('/api/openrouter/chat'))) {
        return sendJson(res, 404, { error: 'OpenRouter Route Invalid' });
      }

      const OPENROUTER_KEY = env.OPENROUTER_API_KEY || env.API_KEY || process.env.OPENROUTER_API_KEY;

      if (!OPENROUTER_KEY) {
        return sendJson(res, 500, { error: 'Server configuration error: Missing OPENROUTER_API_KEY' });
      }

      const bodyStr = await readBody(req);

      const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          // Optional but recommended by OpenRouter:
          'HTTP-Referer': 'https://prospectorv14-production.up.railway.app',
          'X-Title': 'ProspectorV14',
        },
        body: bodyStr,
      });

      const parsed = await upstreamRes.json().catch(() => ({}));
      return sendJson(res, upstreamRes.status, parsed);
    } catch (e: any) {
      return sendJson(res, 500, { error: e?.message || 'Internal OpenRouter Proxy Error' });
    }
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Ensure middleware can see env at runtime (Railway)
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
        },
      },
    ],
    // IMPORTANT: do NOT inject server keys into the client bundle
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 5173,
      allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost'],
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 4173,
      allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost'],
    },
  };
});
