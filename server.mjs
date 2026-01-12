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
// Helpers
// -----------------------------
const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/^"+|"+$/g, "")          // strip accidental quotes
    .replace(/^'+|'+$/g, "")          // strip accidental quotes
    .replace(/[\r\n\t ]+/g, "");      // strip ALL whitespace chars (common Railway paste issue)

const keyMeta = (k) => {
  const s = cleanKey(k);
  return {
    present: !!s,
    length: s.length,
    prefix: s.slice(0, 10), // safe preview only
    looksLike: s.startsWith("sk-or-") ? "sk-or-*" : "unknown"
  };
};

// -----------------------------
// OpenRouter Proxy (SERVER-SIDE)
// -----------------------------
app.get("/api/openrouter/ping", (req, res) => {
  const envKey = cleanKey(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
  const headerKey = cleanKey(req.headers["x-openrouter-key"]);
  res.json({
    ok: true,
    using: envKey ? "env" : headerKey ? "header" : "none",
    hasEnvKey: !!envKey,
    hasHeaderKey: !!headerKey,
    envKeyMeta: keyMeta(envKey),
    headerKeyMeta: keyMeta(headerKey)
  });
});

// This endpoint PROVES whether OpenRouter accepts the key.
// If this fails with 401, the key is invalid OR Authorization is not being sent cleanly.
app.get("/api/openrouter/verify", async (req, res) => {
  try {
    const envKey = cleanKey(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
    const headerKey = cleanKey(req.headers["x-openrouter-key"]);
    const
