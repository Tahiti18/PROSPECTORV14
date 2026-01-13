import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

const readBody = async (req: IncomingMessage) => {
  const buffers: Buffer[] = [];
  for await (const chunk of req) buffers.push(chunk as Buffer);
  return Buffer.concat(buffers).toString('utf8');
};

const sendJson = (res: ServerResponse, status: number, data: any) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

const safeParseJson = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const createKieProxyMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/kie')) return next();

      const KIE_KEY = env.KIE_API_KEY || env.KIE_KEY || process.env.KIE_API_KEY;
      if (!KIE_KEY) return sendJson(res, 500, { error: 'Server configuration error: Missing KIE_API_KEY' });

      const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

      if (req.method === 'POST') {
        const bodyStr = await readBody(req);
        const upstreamRes = await fetch(KIE_GENERATE_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_KEY}`
          },
          body: bodyStr
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(res, upstreamRes.status, parsed);
      }

      if (req.method === 'GET') {
        const u = new URL(req.url!, `http://${req.headers.host}`);
        const taskId = u.searchParams.get('taskId') || u.pathname.split('/').pop() || '';
        const upstreamUrl = `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`;
        const upstreamRes = await fetch(upstreamUrl, {
          headers: { Authorization: `Bearer ${KIE_KEY}` }
        });
        const parsed = await upstreamRes.json().catch(() => ({}));
        return sendJson(res, upstreamRes.status, parsed);
      }

      return sendJson(res, 404, { error: 'KIE Route Invalid' });
    } catch (e: any) {
      return sendJson(res, 500, { error: e?.message || 'Internal Proxy Error' });
    }
  };
};

const createOpenRouterMiddleware = (env: Record<string, string>) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    try {
      const url = req.url || '';
      if (!url.startsWith('/api/openrouter')) return next();

      // Accept /api/openrouter/chat with or without query string
      if (!(req.method === 'POST' && url.startsWith('/api/openrouter/chat'))) {
        return sendJson(res, 404, { error: 'OpenRouter Route Invalid' });
      }

      const headerKey = (req.headers['x-openrouter-key'] as string | undefined)?.trim() || '';
      const OPENROUTER_KEY =
        env.OPENROUTER_API_KEY || env.API_KEY || process.env.OPENROUTER_API_KEY || headerKey;

      if (!OPENROUTER_KEY) {
        return sendJson(res, 500, { error: 'Server configuration error: Missing OPENROUTER_API_KEY' });
      }

      const raw = await readBody(req);
      const incoming = safeParseJson(raw) || {};

      /**
       * NORMALIZE ANY CLIENT SHAPE INTO OPENROUTER CHAT/COMPLETIONS SHAPE
       *
       * Supported incoming shapes:
       * A) { model, messages:[...] }                               (correct)
       * B) { model, prompt, systemInstruction }                   (older custom)
       * C) { prompt }                                             (fallback)
       */
      const model =
        incoming.model ||
        incoming.modelStr ||
        'google/gemini-3-flash-preview';

      const system =
        incoming.systemInstruction ||
        incoming.system ||
        '';

      const prompt =
        typeof incoming.prompt === 'string' ? incoming.prompt :
        typeof incoming.input === 'string' ? incoming.input :
        '';

      let messages = Array.isArray(incoming.messages) ? incoming.messages : null;

      // If no messages provided, build them from system+prompt
      if (!messages) {
        const built: any[] = [];
        if (system && system.trim()) built.push({ role: 'system', content: system });
        if (prompt && prompt.trim()) built.push({ role: 'user', content: prompt });
        messages = built;
      }

      // Final guard: MUST have at least one message with content
      const hasContent = Array.isArray(messages) && messages.some((m) => (m?.content || '').toString().trim().length > 0);
      if (!hasContent) {
        return sendJson(res, 400, {
          error: 'Client payload missing prompt/messages',
          receivedKeys: Object.keys(incoming),
          hint: 'Send {model, messages:[{role:"user",content:"..."}]} or {prompt:"..."}'
        });
      }

      const payload = { model, messages };

      const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://prospectorv14-production.up.railway.app',
          'X-Title': 'ProspectorV14'
        },
        body: JSON.stringify(payload)
      });

      const parsed = await upstreamRes.json().catch(() => ({}));
      return sendJson(res, upstreamRes.status, parsed);
    } catch (e: any) {
      return sendJson(res, 500, { error: e?.message || 'Internal OpenRouter Proxy Error' });
    }
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Make env visible to middleware at runtime
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
        }
      }
    ],
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
