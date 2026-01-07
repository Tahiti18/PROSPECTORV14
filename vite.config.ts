
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import { Buffer } from 'node:buffer';

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
// This middleware acts as the backend router for /api/kie/suno endpoints
const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers.host || 'localhost';
    const urlObj = new URL(req.url || '', `${protocol}://${host}`);
    
    // 1. ROUTER MATCHING
    if (!urlObj.pathname.startsWith('/api/kie/suno')) {
      return next();
    }

    // Secure Key Management (Server-Side Only)
    // In production, this pulls from process.env. In dev, it falls back or uses .env
    const KIE_KEY = process.env.KIE_KEY || env.KIE_KEY || '302d700cb3e9e3dcc2ad9d94d5059279';
    // FIXED: Standard KIE API path usually does not have double /api/ prefix
    const KIE_BASE = 'https://api.kie.ai/v1/suno';

    // Helper to read request body
    const readBody = async () => {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      return Buffer.concat(buffers).toString();
    };

    try {
      // 2. ROUTE: POST /api/kie/suno/submit
      if (req.method === 'POST' && urlObj.pathname.endsWith('/submit')) {
        const bodyStr = await readBody();
        const upstreamRes = await fetch(`${KIE_BASE}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_KEY}`
          },
          body: bodyStr
        });

        const data = await upstreamRes.json();
        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return;
      }

      // 3. ROUTE: GET /api/kie/suno/status/:id
      if (req.method === 'GET' && urlObj.pathname.includes('/status/')) {
        const parts = urlObj.pathname.split('/');
        const taskId = parts[parts.length - 1]; // Extract ID from URL path

        const upstreamRes = await fetch(`${KIE_BASE}/status/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${KIE_KEY}`
          }
        });

        const data = await upstreamRes.json();
        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return;
      }

      // 404 for unknown API routes within this namespace
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Route not found in KIE Proxy' }));

    } catch (e: any) {
      console.error('[KIE Proxy Error]', e);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: e.message || 'Internal Proxy Error' }));
    }
  };
};

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = process.env;

  return {
    plugins: [
      react(),
      {
        name: 'kie-proxy-server',
        // 1. Mounts middleware in `vite dev`
        configureServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env as Record<string, string>));
        },
        // 2. Mounts middleware in `vite preview` (Railway/Production) - THIS FIXES THE 404
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
