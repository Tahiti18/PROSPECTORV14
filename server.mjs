import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "20mb" }));

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function pickKey(req) {
  // Prefer Railway env var (correct way)
  const envKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (envKey) return envKey;

  // Optional fallback (if your UI is sending a key in the body)
  const bodyKey =
    (req.body?.openRouterKey || req.body?.apiKey || req.body?.key || "").trim();
  if (bodyKey) return bodyKey;

  return "";
}

// Backwards compatible: support BOTH routes
app.post(["/api/openrouter/chat", "/api/proxy/openrouter"], async (req, res) => {
  try {
    const key = pickKey(req);
    if (!key) {
      return res.status(401).json({
        error: {
          message:
            "OPENROUTER_API_KEY missing on server. Set it in Railway Variables.",
          code: 401,
        },
      });
    }

    const {
      prompt = "",
      systemInstruction = "",
      model = "google/gemini-2.0-flash-001",
      // allow advanced callers to send messages directly:
      messages,
      temperature,
      max_tokens,
    } = req.body || {};

    const finalMessages =
      Array.isArray(messages) && messages.length
        ? messages
        : [
            ...(systemInstruction
              ? [{ role: "system", content: systemInstruction }]
              : []),
            { role: "user", content: String(prompt) },
          ];

    const payload = {
      model,
      messages: finalMessages,
      ...(typeof temperature === "number" ? { temperature } : {}),
      ...(typeof max_tokens === "number" ? { max_tokens } : {}),
    };

    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        // optional but recommended by OpenRouter:
        "HTTP-Referer": process.env.OR_REFERER || "https://prospector.local",
        "X-Title": process.env.OR_TITLE || "ProspectorV14",
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    res.status(upstream.status);

    // pass through JSON if possible
    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (err) {
    res.status(500).json({
      error: { message: String(err?.message || err), code: 500 },
    });
  }
});

// Serve the built frontend (dist)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
