import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Mock browser globals for Node compatibility (Railway / SSR safety)
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

const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';

      // Only proxy Suno/KIE routes
      if (!url.startsWith('/api/kie/suno')) return next();

      const KIE_KEY =
        process.env.KIE_KEY ||
        env.KIE_KEY ||
        process.env.KIE_API_KEY ||
        env.KIE_API_KEY;

      if (!KIE_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing KIE API Key' }));
        return;
      }

      // ✅ CORRECT upstream base (this fixed the 404s)
      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      const readBody = async () => {
        const buffers: Buffer[] = [];
        for await (const chunk of req) buffers.push(chunk as Buffer);
        return Buffer.concat(buffers).toString();
      };

      const sendJson = (status: number, data: any) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      const safeJson = (raw: string) => {
        try {
          return JSON.parse(raw);
        } catch {
          return { error: 'Non-JSON upstream response', raw };
        }
      };

      // ---- SUBMIT ----
      if (
        req.method === 'POST' &&
        (url.includes('/suno_submit') || url.endsWith('/submit'))
      ) {
        const body = await readBody();

        const upstreamRes = await fetch(KIE_GENERATE_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_KEY}`
          },
          body
        });

        const raw = await upstreamRes.text();
        return sendJson(upstreamRes.status, safeJson(raw));
      }

      // ---- STATUS / RECORD INFO ----
      if (
        req.method === 'GET' &&
        (url.includes('/status/') || url.includes('/record-info'))
      ) {
        let taskId = '';

        if (url.includes('/status/')) {
          taskId = url.split('/').pop() || '';
        } else {
          const u = new URL(`http://local${url}`);
          taskId = u.searchParams.get('taskId') || '';
        }

        if (!taskId) {
          return sendJson(400, { error: 'Missing taskId' });
        }

        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;

        const upstreamRes = await fetch(upstreamUrl, {
          headers: { Authorization: `Bearer ${KIE_KEY}` }
        });

        const raw = await upstreamRes.text();
        return sendJson(upstreamRes.status, safeJson(raw));
      }

      return sendJson(404, { error: 'KIE proxy route not found' });
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err?.message || 'Proxy error' }));
    }
  };
};

export default defineConfig(() => {
  const env = process.env;

  return {
    plugins: [
      react(),
      {
        name: 'kie-proxy',
        configureServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env as Record<string, string>));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env as Record<string, string>));
        }
      }
    ],
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 5173,
      allowedHosts: ['.railway.app', 'localhost']
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 4173,
      allowedHosts: ['.railway.app', 'localhost']
    }
  };
});
