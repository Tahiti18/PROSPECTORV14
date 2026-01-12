import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = Number(process.env.PORT || 3000);

// -----------------------------
// OpenRouter Proxy (SERVER-SIDE)
// -----------------------------
app.post("/api/openrouter/chat", async (req, res) => {
  try {
    const key =
      (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || "").trim();

    if (!key) {
      return res.status(401).json({
        error: {
          message: "Missing OPENROUTER_API_KEY on server",
          code: 401
        }
      });
    }

    const { prompt, systemInstruction, model } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: { message: "Missing prompt", code: 400 }
      });
    }

    const payload = {
      model: model || "google/gemini-2.0-flash-001",
      messages: [
        ...(systemInstruction
          ? [{ role: "system", content: String(systemInstruction) }]
          : []),
        { role: "user", content: prompt }
      ]
    };

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        // Optional but recommended by OpenRouter:
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://prospector.local",
        "X-Title": process.env.OPENROUTER_APP_NAME || "ProspectorOS"
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    res.status(upstream.status);

    // Pass through JSON if possible, otherwise raw text
    try {
      res.json(JSON.parse(text));
    } catch {
      res.type("text/plain").send(text);
    }
  } catch (err) {
    res.status(500).json({
      error: {
        message: err?.message || String(err),
        code: 500
      }
    });
  }
});

// -----------------------------
// Serve Vite build (dist)
// -----------------------------
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
