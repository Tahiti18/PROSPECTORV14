import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- CONFIG ----------
const PROXY_VERSION = "express-proxy-v1-2026-01-13";
const PORT = Number(process.env.PORT) || 3000;

const SERVER_OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY ||
  process.env.API_KEY ||
  "";

const SERVER_KIE_KEY =
  process.env.KIE_API_KEY ||
  process.env.KIE_KEY ||
  "";

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));

const sendJson = (res, status, data) => {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Prospector-Proxy", PROXY_VERSION);
  res.send(JSON.stringify(data));
};

// ---------- OPENROUTER ----------
app.get("/api/openrouter/version", (req, res) => {
  return sendJson(res, 200, { ok: true, proxyVersion: PROXY_VERSION });
});

app.post("/api/openrouter/chat", async (req, res) => {
  try {
    const headerKey = (req.headers["x-openrouter-key"] || "").toString().trim();
    const key = SERVER_OPENROUTER_KEY || headerKey;

    if (!key) {
      return sendJson(res, 500, { ok: false, error: { message: "Missing OPENROUTER_API_KEY" } });
    }

    const incoming = req.body || {};

    // Normalize model
    const model = incoming.model || incoming.modelStr || "google/gemini-3-flash-preview";

    // Normalize system/prompt (supports legacy shapes)
    const system =
      (typeof incoming.systemInstruction === "string" ? incoming.systemInstruction : "") ||
      (typeof incoming.system === "string" ? incoming.system : "") ||
      "";

    const prompt =
      (typeof incoming.prompt === "string" ? incoming.prompt : "") ||
      (typeof incoming.input === "string" ? incoming.input : "") ||
      (typeof incoming.text === "string" ? incoming.text : "") ||
      "";

    // Normalize messages
    let messages = Array.isArray(incoming.messages) ? incoming.messages : null;

    if (!messages) {
      const built = [];
      if (system.trim()) built.push({ role: "system", content: system });
      if (prompt.trim()) built.push({ role: "user", content: prompt });
      messages = built;
    }

    const hasContent =
      Array.isArray(messages) &&
      messages.some((m) => (m?.content || "").toString().trim().length > 0);

    if (!hasContent) {
      return sendJson(res, 400, {
        ok: false,
        error: { message: "Client payload missing prompt/messages", code: 400 },
        debug: {
          proxyVersion: PROXY_VERSION,
          receivedKeys: Object.keys(incoming || {}),
          receivedHasMessages: Array.isArray(incoming.messages),
          receivedPromptType: typeof incoming.prompt
        }
      });
    }

    const payload = { model, messages };

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://prospectorv14-production.up.railway.app",
        "X-Title": "ProspectorV14"
      },
      body: JSON.stringify(payload)
    });

    const json = await upstream.json().catch(() => ({}));
    return sendJson(res, upstream.status, json);
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: { message: e?.message || "OpenRouter proxy error" } });
  }
});

// ---------- KIE ----------
app.post("/api/kie/:any(*)", async (req, res) => {
  try {
    const key = SERVER_KIE_KEY;

    if (!key) {
      return sendJson(res, 500, { ok: false, error: { message: "Missing KIE_API_KEY" } });
    }

    // KIE generate endpoint (submit endpoints are typically POST here)
    const upstream = await fetch("https://api.kie.ai/api/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(req.body || {})
    });

    const json = await upstream.json().catch(() => ({}));
    return sendJson(res, upstream.status, json);
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: { message: e?.message || "KIE proxy error" } });
  }
});

app.get("/api/kie/record-info", async (req, res) => {
  try {
    const key = SERVER_KIE_KEY;

    if (!key) {
      return sendJson(res, 500, { ok: false, error: { message: "Missing KIE_API_KEY" } });
    }

    const taskId = (req.query.taskId || "").toString().trim();
    const upstreamUrl = `https://api.kie.ai/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`;

    const upstream = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${key}` }
    });

    const json = await upstream.json().catch(() => ({}));
    return sendJson(res, upstream.status, json);
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: { message: e?.message || "KIE record-info proxy error" } });
  }
});

// ---------- STATIC FRONTEND ----------
const distDir = path.join(__dirname, "dist");

// Serve built assets
app.use(express.static(distDir));

// SPA fallback: serve index.html for all NON-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return sendJson(res, 404, { ok: false, error: { message: "API route not found" } });
  }
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[server] running on :${PORT} (${PROXY_VERSION})`);
});
