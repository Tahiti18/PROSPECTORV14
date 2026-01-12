import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/kie')) return next();

      const KIE_KEY = env.KIE_API_KEY || env.KIE_KEY || process.env.KIE_API_KEY;

      if (!KIE_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Server configuration error: Missing KIE_API_KEY' }));
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

      if (req.method === 'POST' && (url.includes('/submit') || url.includes('/suno_submit') || url.includes('/video_submit'))) {
        const bodyStr = await readBody();
        const upstreamRes = await fetch(KIE_GENERATE_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_KEY}`
          },
          body: bodyStr
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(upstreamRes.status, parsed);
      }

      if (req.method === 'GET' && (url.includes('/status/') || url.includes('/record-info') || url.includes('/suno/record-info'))) {
        const u = new URL(req.url!, `http://${req.headers.host}`);
        const taskId = u.pathname.split('/').pop() || u.searchParams.get('taskId');
        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId || '')}`;
        const upstreamRes = await fetch(upstreamUrl, {
          headers: { 'Authorization': `Bearer ${KIE_KEY}` }
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(upstreamRes.status, parsed);
      }

      return sendJson(404, { error: 'KIE Route Invalid' });
    } catch (e: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e?.message || 'Internal Proxy Error' }));
    }
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'kie-proxy-server',
        configureServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env));
        }
      }
    ],
    define: {
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || env.API_KEY || ""),
      'process.env.KIE_API_KEY': JSON.stringify(env.KIE_API_KEY || ""),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
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