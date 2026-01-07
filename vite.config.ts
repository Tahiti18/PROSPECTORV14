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

      // Namespace: EVERYTHING under /api/kie
      if (!url.startsWith('/api/kie')) return next();

      // IMPORTANT: Never ship a hardcoded API key.
      const KIE_KEY = process.env.KIE_KEY || env.KIE_KEY;
      if (!KIE_KEY) {
        console.error('[KIE PROXY] CRITICAL: Missing KIE_KEY environment variable.');
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Server configuration error: Missing KIE_KEY' }));
        return;
      }

      // Official Suno API endpoints (KIE docs)
      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      const readBody = async () => {
        const buffers: Buffer[] = [];
        for await (const chunk of req) buffers.push(chunk as Buffer);
        return Buffer.concat(buffers).toString();
      };

      const writeJson = (status: number, data: any) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      const safeJsonParse = (rawText: string) => {
        try {
          return JSON.parse(rawText);
        } catch {
          return { error: 'Upstream returned non-JSON response', raw: rawText };
        }
      };

      // 1) Callback sink (KIE calls this when generation completes)
      // NOTE: KIE needs a publicly reachable URL; your client sets it to your Railway origin.
      if (req.method === 'POST' && url.startsWith('/api/kie/callback')) {
        const bodyStr = await readBody();
        console.log('[KIE CALLBACK] Received:', bodyStr.slice(0, 2000));
        writeJson(200, { ok: true });
        return;
      }

      // 2) Submit generation: POST /api/kie/submit
      // Keep old alias: POST /api/kie/suno/suno_submit
      if (
        req.method === 'POST' &&
        (url === '/api/kie/submit' || url.startsWith('/api/kie/submit?') || url.includes('/api/kie/suno/suno_submit'))
      ) {
        const bodyStr = await readBody();
        const upstreamUrl = `${KIE_GENERATE_BASE}`;

        console.log(`[KIE PROXY] POST -> ${upstreamUrl}`);

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_KEY}`
          },
          body: bodyStr
        });

        const rawText = await upstreamRes.text();
        const data = safeJsonParse(rawText);

        writeJson(upstreamRes.status, data);
        return;
      }

      // 3) Poll status: GET /api/kie/record-info?taskId=...
      // Keep old alias: GET /api/kie/suno/status/:id
      if (
        req.method === 'GET' &&
        (url.startsWith('/api/kie/record-info') || url.includes('/api/kie/suno/status/'))
      ) {
        let taskId = '';

        if (url.startsWith('/api/kie/record-info')) {
          // /api/kie/record-info?taskId=xxx
          const u = new URL(`http://local${url}`);
          taskId = u.searchParams.get('taskId') || '';
        } else {
          // /api/kie/suno/status/:id
          const parts = url.split('/');
          taskId = parts[parts.length - 1] || '';
        }

        if (!taskId) {
          writeJson(400, { error: 'Missing taskId' });
          return;
        }

        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;
        console.log(`[KIE PROXY] GET -> ${upstreamUrl}`);

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${KIE_KEY}` }
        });

        const rawText = await upstreamRes.text();
        const data = safeJsonParse(rawText);

        writeJson(upstreamRes.status, data);
        return;
      }

      // 404 within /api/kie namespace
      writeJson(404, { error: 'Route not found in KIE Proxy', path: url });
    } catch (e: any) {
      console.error('[KIE Proxy Error]', e);
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
