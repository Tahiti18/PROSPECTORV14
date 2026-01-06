
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
        server.middlewares.use('/__smoketest_phase1', async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          console.log('[SMOKE_TEST] START Phase 1 Backend Test');
          
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

          let responseSent = false;
          const finalize = (statusCode: number, body: any) => {
             if (responseSent) return;
             responseSent = true;
             try {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = statusCode;
                res.end(JSON.stringify(body, null, 2));
             } catch(e) {
                console.error('[SMOKE_TEST] Failed to send response', e);
             }
          };

          try {
            // 60s hard timeout
            const timeoutMs = 60000;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
            });

            const executionPromise = (async () => {
                // @ts-ignore
                return await orchestratePhase1BusinessPackage(testInput);
            })();

            // @ts-ignore
            const result: any = await Promise.race([executionPromise, timeoutPromise]);

            // If we are here, execution finished successfully or threw
            const isSuccess = result.status === 'SUCCESS';
            console.log(`[SMOKE_TEST] ${isSuccess ? 'PASS' : 'FAIL'} | RunID: ${result.runId}`);
            
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
            console.log(`[SMOKE_TEST] ${isTimeout ? 'TIMEOUT' : 'FAIL'} | ${error.message}`);
            
            finalize(isTimeout ? 504 : 500, {
                status: isTimeout ? 'TIMEOUT' : 'FAIL',
                stepsExecuted: 0,
                assetsCommitted: 0,
                error: error.message,
                completedAt: new Date().toISOString()
            });
          }
        });
      }
    }
  };
});
