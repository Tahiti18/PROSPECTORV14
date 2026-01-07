
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
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers.host || 'localhost';
    const urlObj = new URL(req.url || '', `${protocol}://${host}`);
    
    // 1. ROUTER MATCHING
    if (!urlObj.pathname.startsWith('/api/kie/suno')) {
      return next();
    }

    // Secure Key Management (Server-Side Only)
    // RESTORED FALLBACK FOR PREVIEW ENVIRONMENTS TO FIX 500 ERROR
    const KIE_KEY = process.env.KIE_KEY || env.KIE_KEY || '302d700cb3e9e3dcc2ad9d94d5059279';
    
    if (!KIE_KEY) {
        console.error('[KIE PROXY] CRITICAL: Missing KIE_KEY environment variable.');
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Server configuration error: Missing KIE_KEY' }));
        return;
    }
    
    // Upstream KIE API path base
    const KIE_BASE = 'https://api.kie.ai/api/v1/suno';

    // Helper to read request body
    const readBody = async () => {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      return Buffer.concat(buffers).toString();
    };

    try {
      // 2. ROUTE: POST /api/kie/suno/suno_submit
      if (req.method === 'POST' && urlObj.pathname.endsWith('/suno_submit')) {
        const bodyStr = await readBody();
        const upstreamUrl = `${KIE_BASE}/suno_submit`;
        
        console.log(`[KIE PROXY] POST Request -> ${upstreamUrl}`);

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_KEY}`
          },
          body: bodyStr
        });

        const rawText = await upstreamRes.text();
        console.log(`[KIE PROXY] Upstream Status: ${upstreamRes.status}`);

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.error(`[KIE PROXY] Non-JSON Response: ${rawText.substring(0, 100)}...`);
            data = { error: "Upstream returned non-JSON response", raw: rawText };
        }

        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return;
      }

      // 3. ROUTE: GET /api/kie/suno/status/:id
      if (req.method === 'GET' && urlObj.pathname.includes('/status/')) {
        const parts = urlObj.pathname.split('/');
        const taskId = parts[parts.length - 1]; // Extract ID from URL path
        const upstreamUrl = `${KIE_BASE}/status/${taskId}`;

        console.log(`[KIE PROXY] GET Request -> ${upstreamUrl}`);

        const upstreamRes = await fetch(upstreamUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${KIE_KEY}`
          }
        });

        const rawText = await upstreamRes.text();
        console.log(`[KIE PROXY] Upstream Status: ${upstreamRes.status}`);

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.error(`[KIE PROXY] Non-JSON Response: ${rawText.substring(0, 100)}...`);
            data = { error: "Upstream returned non-JSON response", raw: rawText };
        }

        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return;
      }

