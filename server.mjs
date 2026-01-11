import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "2mb" }));

// --- OpenRouter proxy (server-side only) ---
app.post("/api/openrouter/chat", async (req, res) => {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY on server" });
    }

    const { prompt, systemInstruction } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const defaultSystem = `You are a Senior B2B Sales Strategist for a high-end AI Transformation Agency.
Your goal is to help your agency close specific business targets.
NEVER mention "Prospector OS", "The Engine", or your own internal software in your outreach.
You work for the user. Always output raw valid JSON. No conversational filler.`;

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.referer || "https://prospector-os.app",
        "X-Title": "Prospector OS V14",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          { role: "system", content: systemInstruction || defaultSystem },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const raw = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).send(raw);
    }

    // Return OpenRouter response JSON as-is
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(raw);
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// --- Serve Vite build (dist) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));
app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

const port = Number(process.env.PORT) || 4173;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on ${port}`);
});
