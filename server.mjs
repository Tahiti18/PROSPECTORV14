import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const json = (res, status, data) => res.status(status).json(data);

const requireEnv = (names) => {
  for (const n of names) {
    const v = (process.env[n] || '').trim();
    if (v) return v;
  }
  return '';
};

/**
 * OpenRouter proxy
 * Browser calls: POST /api/openrouter/chat
 * Server forwards: https://openrouter.ai/api/v1/chat/completions with Authorization header
 */
app.post('/api/openrouter/chat', async (req, res) => {
  try {
    const OPENROUTER_API_KEY = requireEnv(['OPENROUTER_API_KEY']);

    if (!OPENROUTER_API_KEY) {
      return json(res, 500, { error: 'Missing OPENROUTER_API_KEY (Railway Variables)' });
    }

    const prompt = req.body?.prompt ?? '';
    const systemInstruction = req.body?.systemInstruction ?? '';
    const model = req.body?.model ?? 'google/gemini-2.0-flash-001';

    const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Prospector OS'
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: String(prompt) }
        ]
      })
    });

    const rawText = await upstreamRes.text();
    // return OpenRouter JSON as-is (best effort)
    try {
      return res.status(upstreamRes.status).json(JSON.parse(rawText));
    } catch {
      return res.status(upstreamRes.status).send(rawText);
    }
  } catch (e) {
    return json(res, 500, { error: e?.message || 'OpenRouter proxy error' });
  }
});

/**
 * KIE Suno proxy
 * Browser calls: /api/kie/suno/...
 * Server forwards to: https://api.kie.ai/api/v1/generate...
 */
app.all('/api/kie/suno/*', async (req, res) => {
  try {
    const KIE_API_KEY = requireEnv(['KIE_API_KEY', 'KIE_KEY']); // allow legacy name

    if (!KIE_API_KEY) {
      return json(res, 500, { error: 'Missing KIE_API_KEY (or KIE_KEY) in Railway Variables' });
    }

    const url = req.originalUrl || '';
    const KIE_GENERATE_BASE = 'https://api.kie.ai/api/v1/generate';

    if (
      req.method === 'POST' &&
      (url.includes('/suno_submit') || url.endsWith('/submit') || url.includes('/submit?'))
    ) {
      const upstreamRes = await fetch(`${KIE_GENERATE_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify(req.body ?? {})
      });

      const rawText = await upstreamRes.text();
      try {
        return res.status(upstreamRes.status).json(JSON.parse(rawText));
      } catch {
        return res.status(upstreamRes.status).send(rawText);
      }
    }

    if (
      req.method === 'GET' &&
      (url.includes('/status/') || url.startsWith('/api/kie/suno/record-info'))
    ) {
      let taskId = '';

      if (url.includes('/status/')) {
        const parts = url.split('/');
        taskId = parts[parts.length - 1] || '';
      } else {
        const u = new URL(`http://local${url}`);
        taskId = u.searchParams.get('taskId') || '';
      }

      if (!taskId) return json(res, 400, { error: 'Missing taskId' });

      const upstreamRes = await fetch(
        `${KIE_GENERATE_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
        }
      );

      const rawText = await upstreamRes.text();
      try {
        return res.status(upstreamRes.status).json(JSON.parse(rawText));
      } catch {
        return res.status(upstreamRes.status).send(rawText);
      }
    }

    return json(res, 404, { error: 'Route not found in KIE proxy', path: url });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'KIE proxy error' });
  }
});

// Serve the built frontend
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
