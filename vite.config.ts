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

// --- BACKEND ROUTER: KIE PROXY MIDDLEWARE ---
const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';

      // Only proxy routes under /api/kie/suno
      if (!url.startsWith('/api/kie/suno')) return next();

      // Read API key from env (support both names)
      const KIE_KEY =
        process.env.KIE_KEY ||
        env.KIE_KEY ||
        process.env.KIE_API_KEY ||
        env.KIE_API_KEY;

      if (!KIE_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Server configuration error: Missing KIE_KEY' }));
        return;
      }

      // Legacy upstream base (matches your existing proxy handlers)
      const KIE_BASE = 'https://api.kie.ai/api/v1/suno';

      // Helpers
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

      const safeJson = (rawText: string) => {
        try {
          return JSON.parse(rawText);
        } catch {
          return { error: 'Upstream returned non-JSON response', raw: rawText };
        }
      };

      // ✅ ROUTE ALIASES — accept both submit styles:
      // - POST /api/kie/suno/suno_submit   (old)
      // - POST /api/kie/suno/submit        (new)
      if (
        req.method === 'POST' &&
        (url.includes('/suno_submit') || url.endsWith('/submit') || url.includes('/submit?'))
      ) {
        const bodyStr = await readBody();
        const upstreamUrl = `${KIE_BASE}/suno_submit`;

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_KEY}`
          },
          body: bodyStr
        });

        const rawText = await upstreamRes.text();
        return sendJson(upstreamRes.status, safeJson(rawText));
      }

      // ✅ ROUTE ALIASES — accept both status styles:
      // - GET /api/kie/suno/status/:id                 (old)
      // - GET /api/kie/suno/record-info?taskId=...     (new)
      if (req.method === 'GET' && (url.includes('/status/') || url.startsWith('/api/kie/suno/record-info'))) {
        let taskId = '';

        if (url.includes('/status/')) {
          const parts = url.split('/');
          taskId = parts[parts.length - 1] || '';
        } else {
          // record-info?taskId=...
          const u = new URL(`http://local${url}`);
          taskId = u.searchParams.get('taskId') || '';
        }

        if (!taskId) return sendJson(400, { error: 'Missing taskId' });

        const upstreamUrl = `${KIE_BASE}/status/${encodeURIComponent(taskId)}`;

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${KIE_KEY}` }
        });

        const rawText = await upstreamRes.text();
        return sendJson(upstreamRes.status, safeJson(rawText));
      }

      // 404 for unknown API routes within this namespace
      return sendJson(404, { error: 'Route not found in KIE Proxy', path: url });
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: e?.message || 'Internal Proxy Error' }));
    }
  };
};

export default defineConfig(() => {
  const env = process.env;

  return {
    plugins: [
      react(),
      {
        name: 'kie-proxy-server',
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
      allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost']
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 4173,
      allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost']
    }
  };
});
