import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = Number(process.env.PORT || 3000);

// -----------------------------
// OpenRouter Proxy (SERVER-SIDE)
// -----------------------------
const cleanKey = (k) => {
  let s = String(k || "").trim();

  // strip accidental wrapping quotes
  s = s.replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");

  // if user pasted "Bearer xxx" into the env var, normalize it
  s = s.replace(/^Bearer\s+/i, "").trim();

  // remove invisible whitespace that can break headers (newlines, tabs)
  s = s.replace(/[\r\n\t]/g, "").trim();

  return s;
};

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

// This endpoint performs a REAL upstream call to confirm auth works.
app.get("/api/openrouter/selftest", async (req, res) => {
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

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://prospector.local",
        "X-Title": process.env.OPENROUTER_APP_NAME || "ProspectorOS"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: "Say OK" }]
      })
    });

    const text = await upstream.text();
    res.status(upstream.status);

    try {
      const json = JSON.parse(text);
      // keep response small but useful
      return res.json({
        ok: upstream.ok,
        upstreamStatus: upstream.status,
        sample: json?.choices?.[0]?.message?.content ?? json
      });
    } catch {
      return res.type("text/plain").send(text);
    }
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: { message: err?.message || String(err), code: 500 }
    });
  }
});

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
      return res.status(400).json({
        ok: false,
        error: { message: "Missing prompt", code: 400 }
      });
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
        "X-Title": process.env.OPENROUTER_APP_NAME || "ProspectorOS"
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    res.status(upstream.status);

    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.type("text/plain").send(text);
    }
  } catch (err) {
    return res.status(500).json({
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
