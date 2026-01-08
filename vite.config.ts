
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Strict KIE Key
const KIE_KEY = '302d700cb3e9e3dcc2ad9d94d5059279';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost'],
    proxy: {
      '/api/kie': {
        target: 'https://api.kie.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/kie/, '/api/v1/suno'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Authorization', `Bearer ${KIE_KEY}`);
            // Ensure content-type is passed if present (fetch adds it automatically usually)
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
          });
          proxy.on('error', (err, _req, res) => {
            console.error('[PROXY ERROR]', err);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ error: 'Proxy Error', details: err.message }));
          });
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost']
  }
});
