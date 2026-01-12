import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = Number(process.env.PORT || 3000);

// -----------------------------
// Helpers
// -----------------------------
const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "");

// -----------------------------
// Diagnostics (NO KEY LEAKS)
// -----------------------------
app.get("/api/openrouter/ping", (req, res) => {
  const envKey = cleanKey(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
  const headerKey = cleanKey(req.headers["x-openrouter-key"]);
  res.json({
    ok: true,
    using: envKey ? "env" : headerKey ? "header" : "none",
    hasEnvKey: !!envKey,
    hasHeaderKey: !!headerKey
  });
});

/**
 * Verifies that OpenRouter accepts the server key.
 * If this returns ok:false with 401, the key is wrong OR not being accepted by OpenRouter.
 */
app.get("/api/openrouter/verify", async (req, res) => {
  try {
    const envKey = cleanKey(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
    const headerKey = cleanKey(req.headers["x-openrouter-key"]);
    const key = envKey || headerKey;

    if (!key) {
      return res.status(401).json({ ok: false, error: { message: "Missing server key", code: 401 } });
    }

    const upstream = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://prospector.local",
        "X-Title": process.env.OPENROUTER_APP_NAME || "ProspectorOS",
        "User-Agent": "ProspectorOS/railway"
      }
    });

    const text = await upstream.text();
    res.status(upstream.status);

    try {
      res.json({ ok: upstream.ok, upstreamStatus: upstream.status, upstream: JSON.parse(text) });
    } catch {
      res.type("text/plain").send(text);
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: { message: err?.message || String(err), code: 500 } });
  }
});

// -----------------------------
// OpenRouter Proxy (SERVER-SIDE)
// -----------------------------
app.post("/api/openrouter/chat", async (req, res) => {
  try {
    const envKey = cleanKey(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
    const headerKey = cleanKey(req.headers["x-openrouter-key"]);
    const key = envKey || headerKey;

    if (!key) {
      return res.status(401).json({
        ok: false,
        error: { message: "Missing OPENROUTER_API_KEY on server", code: 401 }
      });
    }

    const { prompt, systemInstruction, model } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ ok: false, error: { message: "Missing prompt", code: 400 } });
    }

    const payload = {
      model: model || "google/gemini-2.0-flash-001",
      messages: [
        ...(systemInstruction ? [{ role: "system", content: String(systemInstruction) }] : []),
        { role: "user", content: prompt }
      ]
    };

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://prospector.local",
        "X-Title": process.env.OPENROUTER_APP_NAME || "ProspectorOS",
        "User-Agent": "ProspectorOS/railway"
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    res.status(upstream.status);

    try {
      res.json(JSON.parse(text));
    } catch {
      res.type("text/plain").send(text);
    }
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: { message: err?.message || String(err), code: 500 }
    });
  }
});

// -----------------------------
// Serve Vite build (dist)
// -----------------------------
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
