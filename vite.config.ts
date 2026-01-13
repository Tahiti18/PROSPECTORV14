import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

const PROXY_VERSION = 'openrouter-normalize-v3-2026-01-13';

const readBody = async (req: IncomingMessage) => {
  const buffers: any[] = [];
  for await (const chunk of req) buffers.push(chunk);
  return (globalThis as any).Buffer.concat(buffers).toString('utf8');
};

const sendJson = (res: ServerResponse, status: number, data: any) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Prospector-Proxy', PROXY_VERSION);
  res.end(JSON.stringify(data));
};

const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/kie')) return next();

      const KIE_KEY = env.KIE_API_KEY || env.KIE_KEY || process.env.KIE_API_KEY;

      if (!KIE_KEY) {
        return sendJson(res, 500, { ok: false, error: { message: 'Missing KIE_API_KEY', code: 500 }, debug: { proxyVersion: PROXY_VERSION } });
      }

      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      if (req.method === 'POST' && (url.includes('/submit') || url.includes('/suno_submit') || url.includes('/video_submit'))) {
        const bodyStr = await readBody(req);
        const upstreamRes = await fetch(KIE_GENERATE_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_KEY}`,
          },
          body: bodyStr,
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(res, upstreamRes.status, parsed);
      }

      if (req.method === 'GET' && (url.includes('/status/') || url.includes('/record-info') || url.includes('/suno/record-info'))) {
        const u = new URL(req.url!, `http://${req.headers.host}`);
        const taskId = u.pathname.split('/').pop() || u.searchParams.get('taskId') || '';
        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;
        const upstreamRes = await fetch(upstreamUrl, {
          headers: { 'Authorization': `Bearer ${KIE_KEY}` },
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(res, upstreamRes.status, parsed);
      }

      return sendJson(res, 404, { ok: false, error: { message: 'KIE Route Invalid', code: 404 }, debug: { proxyVersion: PROXY_VERSION } });
    } catch (e: any) {
      return sendJson(res, 500, { ok: false, error: { message: e?.message || 'Internal Proxy Error', code: 500 }, debug: { proxyVersion: PROXY_VERSION } });
    }
  };
};

const normalizeOpenRouterPayload = (raw: any) => {
  const receivedKeys = raw && typeof raw === 'object' ? Object.keys(raw) : [];
  const model = raw?.model || raw?.modelId || raw?.modelStr || 'google/gemini-2.0-flash-001';

  // Accept legacy shapes: {prompt}, {input}, {text}, {messages}
  const prompt =
    (typeof raw?.prompt === 'string' && raw.prompt.trim()) ? raw.prompt :
    (typeof raw?.input === 'string' && raw.input.trim()) ? raw.input :
    (typeof raw?.text === 'string' && raw.text.trim()) ? raw.text :
    '';

  const system =
    (typeof raw?.systemInstruction === 'string' && raw.systemInstruction.trim()) ? raw.systemInstruction :
    (typeof raw?.system === 'string' && raw.system.trim()) ? raw.system :
    '';

  let messages = Array.isArray(raw?.messages) ? raw.messages : null;

  if (!messages) {
    if (!prompt) return { ok: false, error: { message: 'Client payload missing prompt/messages', code: 400 }, debug: { proxyVersion: PROXY_VERSION, receivedKeys } };
    messages = system
      ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
      : [{ role: 'user', content: prompt }];
  }

  const hasAnyContent = messages.some((m: any) => typeof m?.content === 'string' && m.content.trim().length > 0);
  if (!hasAnyContent) return { ok: false, error: { message: 'messages[] content empty', code: 400 }, debug: { proxyVersion: PROXY_VERSION, receivedKeys } };

  return {
    ok: true,
    body: {
      model,
      messages,
      temperature: raw?.temperature ?? 0.4,
      max_tokens: raw?.max_tokens ?? raw?.maxTokens ?? 1200
    }
  };
};

const createOpenRouterMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/openrouter')) return next();

      if (!(req.method === 'POST' && url.startsWith('/api/openrouter/chat'))) {
        return sendJson(res, 404, { ok: false, error: { message: 'OpenRouter Route Invalid', code: 404 }, debug: { proxyVersion: PROXY_VERSION } });
      }

      const OPENROUTER_KEY =
        env.OPENROUTER_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        // allow local fallback from client header (optional)
        (req.headers['x-openrouter-key'] as string | undefined) ||
        '';

      if (!OPENROUTER_KEY) {
        return sendJson(res, 500, { ok: false, error: { message: 'Missing OPENROUTER_API_KEY', code: 500 }, debug: { proxyVersion: PROXY_VERSION } });
      }

      const bodyStr = await readBody(req);
      const raw = bodyStr ? JSON.parse(bodyStr) : {};
      const normalized = normalizeOpenRouterPayload(raw);

      if (!normalized.ok) {
        return sendJson(res, 400, normalized);
      }

      const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://prospectorv14-production.up.railway.app',
          'X-Title': 'ProspectorV14',
        },
        body: JSON.stringify((normalized as any).body),
      });

      const parsed = await upstreamRes.json().catch(() => ({}));
      return sendJson(res, upstreamRes.status, parsed);
    } catch (e: any) {
      return sendJson(res, 500, { ok: false, error: { message: e?.message || 'Internal OpenRouter Proxy Error', code: 500 }, debug: { proxyVersion: PROXY_VERSION } });
    }
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Ensure middleware can see env at runtime (Railway)
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === 'string' && v.length > 0 && !process.env[k]) {
      process.env[k] = v;
    }
  }

  return {
    plugins: [
      react(),
      {
        name: 'api-proxy-server',
        configureServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env));
          server.middlewares.use(createOpenRouterMiddleware(env));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createKieProxyMiddleware(env));
          server.middlewares.use(createOpenRouterMiddleware(env));
        },
      },
    ],
    // IMPORTANT: do NOT inject server keys into the client bundle
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 5173,
      allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost'],
    },
    preview: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 4173,
      allowedHosts: ['prospectorv14-production.up.railway.app', '.railway.app', 'localhost'],
    },
  };
});
