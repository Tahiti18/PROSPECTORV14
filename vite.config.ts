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

      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      const readBody = async () => {
        const buffers: any[] = [];
        for await (const chunk of req) buffers.push(chunk);
        return (globalThis as any).Buffer.concat(buffers).toString();
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

      if (
        req.method === 'POST' &&
        (url.includes('/suno_submit') || url.endsWith('/submit') || url.includes('/submit?'))
      ) {
        const bodyStr = await readBody();
        const upstreamUrl = `${KIE_GENERATE_BASE}`;

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_KEY}`
          },
          body: bodyStr
        });

        const rawText = await upstreamRes.text();
        const parsed = safeJson(rawText);
        return sendJson(upstreamRes.status, {
          _debug_upstreamStatus: upstreamRes.status,
          _debug_upstreamUrl: upstreamUrl,
          _debug_raw: rawText,
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

        if (!taskId) return sendJson(400, { error: 'Missing taskId' });

        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${KIE_KEY}` }
        });

        const rawText = await upstreamRes.text();
        return sendJson(upstreamRes.status, safeJson(rawText));
      }

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
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
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