import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

const readBody = async (req: IncomingMessage) => {
  const buffers: Buffer[] = [];
  for await (const chunk of req) buffers.push(chunk as Buffer);
  return Buffer.concat(buffers).toString('utf8');
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

      const KIE_KEY = env.KIE_API_KEY || process.env.KIE_API_KEY;
      if (!KIE_KEY) {
        return sendJson(res, 500, { error: 'Missing KIE_API_KEY' });
      }

      const base = 'https://api.kie.ai/api/v1/generate';

      if (req.method === 'POST') {
        const body = await readBody(req);
        const upstream = await fetch(base, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_KEY}`
          },
          body
        });
        const json = await upstream.json().catch(() => ({}));
        return sendJson(res, upstream.status, json);
      }

      if (req.method === 'GET') {
        const u = new URL(req.url!, `http://${req.headers.host}`);
        const taskId = u.searchParams.get('taskId') || '';
        const upstream = await fetch(`${base}/record-info?taskId=${taskId}`, {
          headers: { Authorization: `Bearer ${KIE_KEY}` }
        });
        const json = await upstream.json().catch(() => ({}));
        return sendJson(res, upstream.status, json);
      }

      return sendJson(res, 404, { error: 'KIE route invalid' });
    } catch (e: any) {
      return sendJson(res, 500, { error: e.message });
    }
  };
};

const createOpenRouterMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      if (!(req.method === 'POST' && req.url === '/api/openrouter/chat')) {
        return next();
      }

      const headerKey = (req.headers['x-openrouter-key'] as string | undefined)?.trim();
      const OPENROUTER_KEY =
        env.OPENROUTER_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        headerKey;

      if (!OPENROUTER_KEY) {
        return sendJson(res, 500, { error: 'Missing OPENROUTER_API_KEY' });
      }

      const raw = await readBody(req);
      const parsed = JSON.parse(raw || '{}');

      // 🔒 ENFORCE VALID OPENROUTER CHAT PAYLOAD
      const payload = {
        model: parsed.model,
        messages: parsed.messages ?? [
          { role: 'user', content: parsed.prompt ?? '' }
        ]
      };

      if (!payload.messages[0]?.content) {
        return sendJson(res, 400, { error: 'Empty prompt payload' });
      }

      const upstream = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENROUTER_KEY}`,
            'HTTP-Referer': 'https://prospectorv14-production.up.railway.app',
            'X-Title': 'ProspectorV14'
          },
          body: JSON.stringify(payload)
        }
      );

      const json = await upstream.json().catch(() => ({}));
      return sendJson(res, upstream.status, json);
    } catch (e: any) {
      return sendJson(res, 500, { error: e.message });
    }
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  for (const [k, v] of Object.entries(env)) {
    if (!process.env[k]) process.env[k] = v;
  }

  return {
    plugins: [
      react(),
      {
        name: 'api-proxy',
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
      port: Number(process.env.PORT) || 5173
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 4173
    }
  };
});
