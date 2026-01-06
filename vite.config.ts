
import { defineConfig, loadEnv, PreviewServer, ViteDevServer, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { orchestratePhase1BusinessPackage } from './services/orchestratorPhase1';
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

const smokeTestMiddleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
  // Normalize path: separate query string
  const [urlPath, queryString] = (req.url || '').split('?');
  const normalizedPath = urlPath.endsWith('/') && urlPath.length > 1 ? urlPath.slice(0, -1) : urlPath;

  // 1. PING ENDPOINT (Diagnostics)
  if (normalizedPath === '/__smoketest_phase1_ping') {
    console.log('PHASE1_SMOKETEST PING');
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }));
    return;
  }

  // 2. SMOKETEST ENDPOINT (Orchestration & Diagnostics)
  if (normalizedPath === '/__smoketest_phase1') {
    console.log(`PHASE1_SMOKETEST HIT ${req.url}`);
    
    const params = new URLSearchParams(queryString || '');
    const mode = params.get('mode') || 'run'; // 'ack' | 'run'

    // Mode: ACK
    if (mode === 'ack') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        ok: true, 
        mode: 'ack', 
        ts: new Date().toISOString(),
        message: 'Middleware active. Ready to run.'
      }));
      return;
    }

    // Mode: RUN
    let responded = false;
    let watchdog: any;

    const respond = (payload: any) => {
      if (responded || res.writableEnded) return;
      responded = true;
      clearTimeout(watchdog);
      
      try {
        console.log(`PHASE1_SMOKETEST ${payload.status}`);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = 200;
        res.end(JSON.stringify(payload, null, 2));
      } catch (e) {
        console.error('PHASE1_SMOKETEST RESPOND ERROR', e);
      }
    };

    // Hard Watchdog (60s)
    watchdog = setTimeout(() => {
        respond({
            status: 'TIMEOUT',
            stepsExecuted: 0,
            assetsCommitted: 0,
            error: 'Hard watchdog triggered (60s)',
            completedAt: new Date().toISOString()
        });
    }, 60000);

    // Async Execution IIFE
    (async () => {
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

            // @ts-ignore
            const result = await orchestratePhase1BusinessPackage(testInput);
            const isSuccess = result.status === 'SUCCESS';
            
            respond({
                status: isSuccess ? 'PASS' : 'FAIL',
                runId: result.runId,
                stepsExecuted: result.timeline?.length || 0,
                assetsCommitted: result.assets?.length || 0,
                failedStep: result.timeline?.find((s: any) => s.status === 'FAILED')?.actionName,
                error: result.error,
                completedAt: new Date().toISOString()
            });

        } catch (error: any) {
            respond({
                status: 'FAIL',
                stepsExecuted: 0,
                assetsCommitted: 0,
                error: error.message || 'Unknown orchestration error',
                completedAt: new Date().toISOString()
            });
        }
    })();

    return; // Stop middleware chain
  }

  // Continue to next middleware if not matched
  next();
};

const phase1SmoketestPlugin = (): Plugin => ({
  name: 'phase1-smoketest',
  configurePreviewServer(server: PreviewServer) {
    server.middlewares.use(smokeTestMiddleware);
  },
  configureServer(server: ViteDevServer) {
    server.middlewares.use(smokeTestMiddleware);
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Ensure Node process env is populated for server-side logic
  process.env.API_KEY = env.API_KEY || process.env.API_KEY || '2f30b2e5cdf012a40e82f10d7c30cb7f';

  return {
    plugins: [react(), phase1SmoketestPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
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
