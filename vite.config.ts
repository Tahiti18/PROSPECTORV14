
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
          console.log('[SMOKE_TEST] Received request for Phase 1 Smoke Test');
          
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

          try {
            const start = Date.now();
            // @ts-ignore
            const result = await orchestratePhase1BusinessPackage(testInput);
            const duration = Date.now() - start;

            const isSuccess = result.status === 'SUCCESS';
            const logMsg = `[SMOKE_TEST] ${isSuccess ? 'PASS' : 'FAIL'} | RunID: ${result.runId} | Assets: ${result.assets.length} | Steps: ${result.timeline.length} | ${duration}ms`;
            
            console.log(logMsg);
            if (!isSuccess) {
              console.error('[SMOKE_TEST] Failure Details:', result.error);
            }

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = isSuccess ? 200 : 500;
            res.end(JSON.stringify({
              status: isSuccess ? 'PASS' : 'FAIL',
              timestamp: new Date().toISOString(),
              runId: result.runId,
              durationMs: duration,
              totalSteps: result.timeline.length,
              totalAssets: result.assets.length,
              failedStep: result.timeline.find((s: any) => s.status === 'FAILED')?.actionName || null,
              replayLogPersisted: 'InMemory (Node Process)',
              details: {
                error: result.error,
                assets: result.assets.map((a: any) => ({ type: a.type, module: a.module }))
              }
            }, null, 2));
          } catch (error: any) {
            console.error('[SMOKE_TEST] CRITICAL ERROR:', error);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({
              status: 'CRITICAL_FAIL',
              error: error.message,
              stack: error.stack
            }));
          }
        });
      }
    }
  };
});
