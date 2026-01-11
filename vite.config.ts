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

      const KIE_API_KEY = process.env.KIE_API_KEY || env.KIE_API_KEY;

      if (!KIE_API_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Server configuration error: Missing KIE_API_KEY in .env file'
          })
        );
        return;
      }

      // IMPORTANT: Must include `/api/` in KIE base URL
      const KIE_API_BASE = 'https://api.kie.ai/api/v1';

      const readBody = async () => {
        const buffers: any[] = [];
        for await (const chunk of req) buffers.push(chunk);
        // Buffer exists in Node; no import needed
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

      const doFetch = async (upstreamUrl: string, init: RequestInit) => {
        const upstreamRes = await fetch(upstreamUrl, init);
        const rawText = await upstreamRes.text();
        return {
          status: upstreamRes.status,
          rawText,
          parsed: safeJson(rawText),
          upstreamUrl
        };
      };

      // -------------------------
      // SUBMIT (POST)
      // -------------------------
      if (
        req.method === 'POST' &&
        (url.includes('/suno_submit') || url.endsWith('/submit') || url.includes('/submit?'))
      ) {
        const bodyStr = await readBody();

        // Primary (some KIE setups use /generate)
        const primaryUrl = `${KIE_API_BASE}/generate`;
        // Fallback (some KIE setups use /suno/submit)
        const fallbackUrl = `${KIE_API_BASE}/suno/submit`;

        const init: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_API_KEY}`
          },
          body: bodyStr
        };

        let r = await doFetch(primaryUrl, init);

        // If KIE responds 404, retry the alternate endpoint (prevents “wrong base path” dead-ends)
        if (r.status === 404) {
          r = await doFetch(fallbackUrl, init);
        }

        return sendJson(r.status, {
          _debug_upstreamStatus: r.status,
          _debug_upstreamUrl: r.upstreamUrl,
          _debug_raw: r.rawText,
          ...r.parsed
        });
      }

      // -------------------------
      // STATUS / RECORD-INFO (GET)
      // -------------------------
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

        const primaryUrl = `${KIE_API_BASE}/generate/record-info?taskId=${encodeURIComponent(taskId)}`;
        const fallbackUrl = `${KIE_API_BASE}/suno/record-info?taskId=${encodeURIComponent(taskId)}`;

        const init: RequestInit = {
          method: 'GET',
          headers: { Authorization: `Bearer ${KIE_API_KEY}` }
        };

        let r = await doFetch(primaryUrl, init);
        if (r.status === 404) {
          r = await doFetch(fallbackUrl, init);
        }

        return sendJson(r.status, {
          _debug_upstreamStatus: r.status,
          _debug_upstreamUrl: r.upstreamUrl,
          ...r.parsed
        });
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
