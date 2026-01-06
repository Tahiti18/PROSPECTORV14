
import { defineConfig, loadEnv, PreviewServer } from 'vite';
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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || '2f30b2e5cdf012a40e82f10d7c30cb7f'),
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
      configurePreviewServer(server: PreviewServer) {
        server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          // Normalize path: remove query params and trailing slash
          const urlPath = req.url?.split('?')[0] || '';
          const normalizedPath = urlPath.endsWith('/') && urlPath.length > 1 ? urlPath.slice(0, -1) : urlPath;

          // 1. PING ENDPOINT (Diagnostics)
          if (normalizedPath === '/__smoketest_phase1_ping') {
            console.log('PHASE1_SMOKETEST PING');
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }));
            return;
          }

          // 2. SMOKETEST ENDPOINT (Orchestration)
          if (normalizedPath === '/__smoketest_phase1') {
            console.log(`PHASE1_SMOKETEST HIT ${req.url}`);
            
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

            let responded = false;
            const send = (code: number, body: any) => {
              if (responded) return;
              responded = true;
              try {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = code;
                res.end(JSON.stringify(body, null, 2));
              } catch(e) {
                console.error('[SMOKE_TEST] Response send failed', e);
              }
            };

            try {
              // 60s hard timeout
              const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('TIMEOUT')), 60000);
              });

              const executionPromise = (async () => {
                  // @ts-ignore
                  return await orchestratePhase1BusinessPackage(testInput);
              })();

              // @ts-ignore
              const result: any = await Promise.race([executionPromise, timeoutPromise]);

              const isSuccess = result.status === 'SUCCESS';
              console.log(`PHASE1_SMOKETEST ${isSuccess ? 'PASS' : 'FAIL'}`);
              
              send(isSuccess ? 200 : 500, {
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
              
              send(isTimeout ? 504 : 500, {
                  status: label,
                  stepsExecuted: 0,
                  assetsCommitted: 0,
                  error: error.message,
                  completedAt: new Date().toISOString()
              });
            } finally {
              if (!responded) {
                 console.log('PHASE1_SMOKETEST FAIL (FALLBACK)');
                 send(500, {
                   status: 'FAIL',
                   stepsExecuted: 0,
                   assetsCommitted: 0,
                   error: 'Unhandled critical failure',
                   completedAt: new Date().toISOString()
                 });
              }
            }
            return;
          }

          // Continue to next middleware if not matched
          next();
        });
      }
    }
  };
});
