
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import { Buffer } from 'node:buffer';

// Mock browser globals
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

// --- ROBUST KIE PROXY MIDDLEWARE ---
const createKieProxyMiddleware = () => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '';
    if (!url.startsWith('/api/kie')) return next();

    // STRICT CONFIG
    const KIE_KEY = process.env.KIE_KEY || '302d700cb3e9e3dcc2ad9d94d5059279';
    const KIE_BASE = 'https://api.kie.ai/api/v1/suno';

    // Body Parser
    const chunks: any[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
        try {
            const body = Buffer.concat(chunks).toString();
            let upstreamUrl = '';
            
            const options: RequestInit = {
                method: req.method,
                headers: {
                    'Authorization': `Bearer ${KIE_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            if (url.includes('/submit') && req.method === 'POST') {
                upstreamUrl = `${KIE_BASE}/submit`;
                options.body = body; // Forward raw body string
            } else if (url.includes('/record-info')) {
                const query = url.split('?')[1] || '';
                upstreamUrl = `${KIE_BASE}/record-info?${query}`;
            } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Route not found' }));
                return;
            }

            console.log(`[PROXY] ${req.method} -> ${upstreamUrl}`);
            
            // AbortController for timeout safety
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

            const upstreamRes = await fetch(upstreamUrl, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const text = await upstreamRes.text();
            
            res.statusCode = upstreamRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);

        } catch (e: any) {
            console.error('[PROXY ERROR]', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message || 'Proxy Error' }));
        }
    });
  };
};

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      {
        name: 'kie-proxy-server',
        configureServer(server) {
          server.middlewares.use(createKieProxyMiddleware());
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
