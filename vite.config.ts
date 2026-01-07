
import { defineConfig, loadEnv, PreviewServer, ViteDevServer, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { orchestratePhase1BusinessPackage } from './services/orchestratorPhase1';
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

// Global Lock for Concurrency Control
let isSmokeTestRunning = false;

// --- KIE PROXY MIDDLEWARE (BACKEND ROUTER) ---
const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers.host || 'localhost';
    const urlObj = new URL(req.url || '', `${protocol}://${host}`);
    
    // 1. ROUTER ENTRY POINT
    // Matches: /api/kie/suno/*
    if (!urlObj.pathname.startsWith('/api/kie/suno')) {
      return next();
    }

    // Secure Key Management (Server-Side Only)
    // Checks process.env first (Railway), then .env file
    const KIE_KEY = process.env.KIE_KEY || env.KIE_KEY || '302d700cb3e9e3dcc2ad9d94d5059279';
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
      // 2. POST ROUTE: /submit
      if (urlObj.pathname === '/api/kie/suno/submit' && req.method === 'POST') {
        const bodyStr = await readBody();
        console.log('[BACKEND_PROXY] Forwarding SUBMIT to KIE...');

        const kieRes = await fetch(`${KIE_BASE}/submit`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${KIE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: bodyStr
        });

        // Proxy Response Back to Client
        const data = await kieRes.text();
        res.statusCode = kieRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
        return;
      }

      // 3. GET ROUTE: /status/:taskId
      const statusMatch = urlObj.pathname.match(/\/api\/kie\/suno\/status\/([^/]+)/);
      if (statusMatch && req.method === 'GET') {
        const taskId = statusMatch[1];
        console.log(`[BACKEND_PROXY] Forwarding STATUS check for ${taskId}...`);

        const kieRes = await fetch(`${KIE_BASE}/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${KIE_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        // Proxy Response Back to Client
        const data = await kieRes.text();
        res.statusCode = kieRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
        return;
      }

      // 404 Handler for /api/kie/suno namespace
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Proxy route not found' }));

    } catch (e: any) {
      console.error('[BACKEND_PROXY] Error:', e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
  };
};

const createSmokeTestMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers.host || 'localhost';
    const urlObj = new URL(req.url || '', `${protocol}://${host}`);
    
    const pathname = urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1 ? urlObj.pathname.slice(0, -1) : urlObj.pathname;
    if (pathname !== '/__smoketest_phase1') {
      return next();
    }

    const ENABLED = process.env.SMOKE_TEST_PHASE1 === '1' || env.SMOKE_TEST_PHASE1 === '1';
    const REQUIRED_TOKEN = process.env.SMOKE_TEST_TOKEN || env.SMOKE_TEST_TOKEN;
    const providedToken = urlObj.searchParams.get('token');

    if (!ENABLED || !REQUIRED_TOKEN || providedToken !== REQUIRED_TOKEN) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not Found' }));
      return;
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache');

    const mode = urlObj.searchParams.get('mode');

    if (mode === 'ack') {
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'READY', ts: new Date().toISOString() }));
      return;
    }

    if (isSmokeTestRunning) {
      console.log('PHASE1_SMOKETEST BUSY');
      res.statusCode = 429;
      res.end(JSON.stringify({
        status: 'FAIL',
        error: 'SMOKETEST_BUSY',
        stepsExecuted: 0,
        assetsCommitted: 0,
        completedAt: new Date().toISOString()
      }));
      return;
    }

    isSmokeTestRunning = true;
    let responseSent = false;

    const sendResponse = (code: number, body: any) => {
      if (responseSent) return;
      responseSent = true;
      try {
        res.statusCode = code;
        res.end(JSON.stringify(body));
      } catch (e) {
        console.error('[SMOKE_TEST] Failed to write response', e);
      }
    };

    try {
      const testInput = {
        id: 'smoke-test-lead-backend',
        businessName: "Reflections MedSpa (Smoke Test)",
        websiteUrl: "https://example.com",
        city: "Houston, TX",
        niche: "MedSpa",
        rank: 1,
        phone: "555-0123",
        email: "test@example.com",
        leadScore: 85,
        assetGrade: "A",
        socialGap: "Test Gap",
        visualProof: "Test Visuals",
        bestAngle: "Test Angle",
        personalizedHook: "Test Hook",
        status: "cold",
        outreachStatus: "cold"
      };

      const enableMedia = urlObj.searchParams.get('media') === '1';
      const TIMEOUT_MS = 180000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS);
      });

      const runnerPromise = (async () => {
        // @ts-ignore
        return await orchestratePhase1BusinessPackage(testInput, { mediaPolicy: enableMedia ? 'on' : 'off' });
      })();

      runnerPromise.then((res: any) => {
        if (responseSent) {
           const status = res.status === 'SUCCESS' ? 'LATE_PASS' : 'LATE_FAIL';
           console.log(`PHASE1_SMOKETEST ${status} RunID:${res.runId}`);
        }
      }).catch((err: any) => {
        if (responseSent) {
           console.log(`PHASE1_SMOKETEST LATE_FAIL Error:${err.message}`);
        }
      });

      // @ts-ignore
      const result: any = await Promise.race([runnerPromise, timeoutPromise]);
      const isSuccess = result.status === 'SUCCESS';
      console.log(`PHASE1_SMOKETEST ${isSuccess ? 'PASS' : 'FAIL'}`);
      
      isSmokeTestRunning = false;

      sendResponse(isSuccess ? 200 : 500, {
        status: isSuccess ? 'PASS' : 'FAIL',
        runId: result.runId,
        stepsExecuted: result.timeline?.length || 0,
        assetsCommitted: result.assets?.length || 0,
        failedStep: result.timeline?.find((s: any) => s.status === 'FAILED')?.actionName,
        error: result.error,
        completedAt: new Date().toISOString()
      });

    } catch (error: any) {
      isSmokeTestRunning = false;
      const isTimeout = error.message === 'TIMEOUT';
      const statusLabel = isTimeout ? 'TIMEOUT' : 'FAIL';
      
      console.log(`PHASE1_SMOKETEST ${statusLabel}`);

      sendResponse(isTimeout ? 504 : 500, {
        status: statusLabel,
        error: error.message,
        stepsExecuted: 0,
        assetsCommitted: 0,
        completedAt: new Date().toISOString()
      });
    }
  };
};

const phase1SmoketestPlugin = (env: Record<string, string>): Plugin => ({
  name: 'phase1-smoketest',
  configurePreviewServer(server: PreviewServer) {
    server.middlewares.use(createSmokeTestMiddleware(env));
    server.middlewares.use(createKieProxyMiddleware(env)); // MOUNT ROUTER
  },
  configureServer(server: ViteDevServer) {
    server.middlewares.use(createSmokeTestMiddleware(env));
    server.middlewares.use(createKieProxyMiddleware(env)); // MOUNT ROUTER
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  if (env.API_KEY) {
    process.env.API_KEY = env.API_KEY;
  }
  if (env.KIE_KEY) {
    process.env.KIE_KEY = env.KIE_KEY;
  }

  return {
    plugins: [react(), phase1SmoketestPlugin(env)],
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
    },
    server: {
      host: '0.0.0.0',
      port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
      strictPort: true,
      allowedHosts: true,
    }
  };
});
