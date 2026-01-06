
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

// Global Lock for Concurrency Control
let isSmokeTestRunning = false;

const smokeTestMiddleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
  // Normalize URL and Path
  const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
  const host = req.headers.host || 'localhost';
  const urlObj = new URL(req.url || '', `${protocol}://${host}`);
  const pathname = urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1 ? urlObj.pathname.slice(0, -1) : urlObj.pathname;

  if (pathname === '/__smoketest_phase1') {
    const mode = urlObj.searchParams.get('mode');

    // Strict Headers for Browser/iPad compatibility
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // MODE: ACK (Immediate Liveness Check)
    if (mode === 'ack') {
        res.statusCode = 200;
        res.end(JSON.stringify({ status: 'READY', ts: new Date().toISOString() }));
        return;
    }

    // MODE: RUN (Orchestration)
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

    // Single exit point for the HTTP response
    const finalize = (code: number, body: any) => {
        if (responseSent) return;
        responseSent = true;
        // Release lock before sending response
        isSmokeTestRunning = false;
        try {
            res.statusCode = code;
            res.end(JSON.stringify(body));
        } catch(e) {
            console.error('[SMOKE_TEST] Failed to send response', e);
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
        
        // 180s Hard Timeout
        const timeoutMs = 180000;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
        });

        const executionPromise = (async () => {
            // @ts-ignore
            return await orchestratePhase1BusinessPackage(testInput);
        })();

        // Race orchestrator vs timeout
        // @ts-ignore
        const result: any = await Promise.race([executionPromise, timeoutPromise]);
        
        const isSuccess = result.status === 'SUCCESS';
        console.log(`PHASE1_SMOKETEST ${isSuccess ? 'PASS' : 'FAIL'}`);

        finalize(isSuccess ? 200 : 500, {
            status: isSuccess ? 'PASS' : 'FAIL',
            runId: result.runId,
            stepsExecuted: result.timeline?.length || 0,
            assetsCommitted: result.assets?.length || 0,
            failedStep: result.timeline?.find((s: any) => s.status === 'FAILED')?.actionName,
            error: result.error,
            completedAt: new Date().toISOString()
        });

    } catch (error: any) {
        const isTimeout = error.message === 'TIMEOUT';
        const label = isTimeout ? 'TIMEOUT' : 'FAIL';
        console.log(`PHASE1_SMOKETEST ${label}`);
        
        finalize(isTimeout ? 504 : 500, {
            status: label,
            error: error.message,
            stepsExecuted: 0,
            assetsCommitted: 0,
            completedAt: new Date().toISOString()
        });
    } finally {
        if (!responseSent) {
             finalize(500, { 
                 status: 'FAIL', 
                 error: 'CRITICAL_HANDLER_ERROR',
                 stepsExecuted: 0,
                 assetsCommitted: 0,
                 completedAt: new Date().toISOString() 
             });
        }
        // Ensure lock is released even if finalize failed
        isSmokeTestRunning = false;
    }
    return;
  }

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
