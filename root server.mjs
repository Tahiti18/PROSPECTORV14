import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "2mb" }));

// ---- OpenRouter proxy (server-side only) ----
app.post("/api/openrouter/chat", async (req, res) => {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing OPENROUTER_API_KEY on server" });

    const { prompt, systemInstruction, model } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.referer || "https://prospector-os.app",
        "X-Title": "Prospector OS V14"
      },
      body: JSON.stringify({
        model: model || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemInstruction || "You are a B2B strategist. Output JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    const raw = await upstream.text();
    res.status(upstream.status).type("application/json").send(raw);
  } catch (e) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

// ---- Serve Vite dist ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));
app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

const port = Number(process.env.PORT) || 4173;
app.listen(port, "0.0.0.0", () => console.log(`Server listening on ${port}`));
