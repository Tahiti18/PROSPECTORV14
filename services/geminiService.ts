/* eslint-disable @typescript-eslint/no-explicit-any */

// services/geminiService.ts
// Prospector v14 "single source of truth" Gemini/OpenRouter service layer.
// This file is intentionally broad: many UI modules import legacy exports from here.
// Keep exports stable to avoid TS2305 "no exported member" breakages.

import type { BrandIdentity, Lead } from "../types";

export type GeminiModel =
  | "gemini-1.5-flash"
  | "gemini-1.5-pro"
  | "gemini-2.0-flash-exp"
  | "gemini-2.0-pro-exp"
  | string;

export interface AssetRecord {
  id: string;
  type:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "json"
    | "html"
    | "markdown"
    | "csv"
    | "unknown";
  module: string;
  timestamp: number;
  title?: string;
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
  leadId?: string;
}

export interface ProductionLog {
  ts: number;
  module: string;
  message: string;
  level?: "info" | "warn" | "error";
  leadId?: string;
  meta?: any;
}

export interface BenchmarkReport {
  entityName: string;
  missionSummary: string;
  visualStack: string[];
  sonicStack: string[];
  featureGap: string;
  businessModel: string;
  designSystem: string;
  deepArchitecture: string;
  sources: string[];
}

export interface VeoConfig {
  aspectRatio?: "16:9" | "9:16" | "1:1" | string;
  resolution?: "720p" | "1080p" | "4k" | string;
  durationSeconds?: number;
  style?: string;
  negative?: string;
  seed?: number;
  fps?: number;
  motion?: "low" | "medium" | "high" | string;
}

export const PRODUCTION_LOGS: ProductionLog[] = [];
export const SESSION_ASSETS: AssetRecord[] = [];

// Backward-compat persistent-ish storage (localStorage in browser)
const KEY_STORAGE_KEY = "prospector_keys_v14";

export type StoredKeys = {
  geminiApiKey?: string;
  openRouterApiKey?: string;
  kieApiKey?: string;
  sunoApiKey?: string;
};

export function getStoredKeys(): StoredKeys {
  try {
    const raw =
      typeof window !== "undefined" ? window.localStorage.getItem(KEY_STORAGE_KEY) : null;
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function setStoredKeys(keys: StoredKeys): void {
  try {
    if (typeof window === "undefined") return;
    const prev = getStoredKeys();
    window.localStorage.setItem(KEY_STORAGE_KEY, JSON.stringify({ ...prev, ...keys }));
  } catch {
    // ignore
  }
}

export function setStoredKeysLegacy(geminiApiKey: string, openRouterApiKey?: string): void {
  setStoredKeys({ geminiApiKey, openRouterApiKey });
}

// Legacy export name used by some modules
export const setStoredKeysCompat = setStoredKeysLegacy;

// Logs
export function pushLog(message: string, module: string = "system", level: "info" | "warn" | "error" = "info", meta?: any, leadId?: string) {
  PRODUCTION_LOGS.push({
    ts: Date.now(),
    module,
    message,
    level,
    meta,
    leadId,
  });
}

export function clearLogs() {
  PRODUCTION_LOGS.length = 0;
}

export function clearVault() {
  SESSION_ASSETS.length = 0;
}

export function subscribeToAssets(cb: (assets: AssetRecord[]) => void): () => void {
  // Simple polling subscription — lightweight and works without external infra.
  let alive = true;
  let lastLen = SESSION_ASSETS.length;

  const tick = () => {
    if (!alive) return;
    if (SESSION_ASSETS.length !== lastLen) {
      lastLen = SESSION_ASSETS.length;
      cb([...SESSION_ASSETS]);
    }
    setTimeout(tick, 500);
  };

  setTimeout(tick, 500);

  return () => {
    alive = false;
  };
}

export function deleteAsset(id: string): void {
  const idx = SESSION_ASSETS.findIndex((a) => a.id === id);
  if (idx >= 0) SESSION_ASSETS.splice(idx, 1);
}

export function importVault(items: AssetRecord[]): void {
  for (const it of items) {
    if (!it?.id) continue;
    SESSION_ASSETS.push(it);
  }
}

export function saveAsset(
  type: AssetRecord["type"],
  module: string,
  contentOrUrl: string,
  title?: string,
  metadata?: Record<string, any>,
  leadId?: string
): AssetRecord {
  const isUrl = /^https?:\/\//i.test(contentOrUrl) || contentOrUrl.startsWith("data:");
  const rec: AssetRecord = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type,
    module,
    timestamp: Date.now(),
    title,
    content: isUrl ? undefined : contentOrUrl,
    url: isUrl ? contentOrUrl : undefined,
    metadata,
    leadId,
  };
  SESSION_ASSETS.push(rec);
  return rec;
}

// ---------- Core request helpers ----------

type GeminiResponse = {
  ok: boolean;
  text: string;
  raw?: any;
  error?: { message: any; code?: number };
};

async function fetchJson(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text, _status: res.status, _ok: res.ok };
  }
}

function pickGeminiKey(): string | undefined {
  const keys = getStoredKeys();
  return keys.geminiApiKey || (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
}

function pickOpenRouterKey(): string | undefined {
  const keys = getStoredKeys();
  return keys.openRouterApiKey || (import.meta as any)?.env?.VITE_OPENROUTER_API_KEY;
}

function safeTextFromGeminiRaw(raw: any): string {
  const candidates = raw?.candidates;
  const parts = candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((p: any) => p?.text || "").join("").trim();
  }
  const t = raw?.text || raw?.output || raw?.completion;
  if (typeof t === "string") return t.trim();
  return "";
}

export async function loggedGenerateContent(
  prompt: string,
  module: string = "generic",
  model: GeminiModel = "gemini-1.5-flash"
): Promise<string> {
  pushLog(`Generating content via Gemini model=${model}`, module, "info");
  const out = await generateContent(prompt, model);
  if (!out.ok) {
    pushLog(`Gemini error: ${out.error?.message}`, module, "error", out.error);
    return "";
  }
  pushLog(`Generation complete (${out.text.length} chars)`, module, "info");
  return out.text;
}

export async function generateContent(prompt: string, model: GeminiModel = "gemini-1.5-flash"): Promise<GeminiResponse> {
  const apiKey = pickGeminiKey();
  if (!apiKey) {
    return { ok: false, text: "", raw: null, error: { message: "Missing Gemini API key" } };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, topP: 0.95, maxOutputTokens: 2048 },
    };

    const raw = await fetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = safeTextFromGeminiRaw(raw);
    return { ok: true, text, raw };
  } catch (e: any) {
    return { ok: false, text: "", raw: null, error: { message: e?.message ?? e } };
  }
}

// ---------- OpenRouter chat (used by many modules) ----------

export async function openRouterChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model: string = "openai/gpt-4o-mini"
): Promise<string> {
  const apiKey = pickOpenRouterKey();
  if (!apiKey) return "";

  try {
    const raw = await fetchJson("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://prospector.local",
        "X-Title": "Prospector v14",
      },
      body: JSON.stringify({ model, messages, temperature: 0.6 }),
    });

    const content = raw?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  } catch {
    return "";
  }
}

// ---------- Lead generation ----------

export const generateLeads = async (
  region: string,
  nicheHint: string,
  limit: number = 10
): Promise<{ leads: Lead[]; groundingSources: any[] }> => {
  const prompt = `
You are a B2B lead generation agent.
Return ${limit} leads for: region="${region}", niche="${nicheHint}"

Rules:
- Respond as JSON ONLY.
- Schema:
{
  "leads": [
    {
      "businessName": "...",
      "website": "...",
      "email": "...",
      "phone": "...",
      "location": "...",
      "notes": "...",
      "confidence": 0-100,
      "groundingSources": ["...optional..."]
    }
  ],
  "groundingSources": ["...optional..."]
}
`.trim();

  const res = await generateContent(prompt, "gemini-1.5-flash");
  if (!res.ok) return { leads: [], groundingSources: [] };

  try {
    const parsed = JSON.parse(res.text);
    const leads: Lead[] = Array.isArray(parsed?.leads) ? parsed.leads : [];
    const groundingSources: any[] = Array.isArray(parsed?.groundingSources)
      ? parsed.groundingSources
      : [];
    return { leads, groundingSources };
  } catch {
    return { leads: [], groundingSources: [] };
  }
};

// ✅ Missing legacy export used by AutomatedSearch workspace
export async function groundedLeadSearch(
  region: string,
  nicheHint: string,
  limit: number = 10
): Promise<{ leads: Lead[]; groundingSources: any[] }> {
  return generateLeads(region, nicheHint, limit);
}

// ---------- Core business modules (legacy exports) ----------

export async function generateOutreachSequence(lead: Partial<Lead>): Promise<string[]> {
  const prompt = `
Create a multi-step outreach sequence for:
Business: ${lead.businessName ?? ""}
Website: ${lead.website ?? ""}
Niche: ${lead.niche ?? ""}
Region: ${lead.location ?? ""}

Return JSON array of strings only.
`.trim();
  const txt = await loggedGenerateContent(prompt, "Sequencer");
  try {
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s));
  } catch {
    // fallthrough
  }
  return txt ? txt.split("\n").map((l) => l.trim()).filter(Boolean) : [];
}

export async function generateProposalDraft(lead: Partial<Lead>): Promise<string> {
  const prompt = `
Draft a professional proposal for the following lead.
Business: ${lead.businessName ?? ""}
Website: ${lead.website ?? ""}
Needs/Notes: ${lead.notes ?? ""}

Return the proposal as plain text.
`.trim();
  return loggedGenerateContent(prompt, "ProposalDrafting");
}

export async function generateNurtureDialogue(lead: Partial<Lead>): Promise<string[]> {
  const prompt = `
Create a short nurture dialogue flow (like SMS/DM) for:
Business: ${lead.businessName ?? ""}
Return JSON array of messages.
`.trim();
  const txt = await loggedGenerateContent(prompt, "AIConcierge");
  try {
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s));
  } catch {
    // ignore
  }
  return txt ? txt.split("\n").map((l) => l.trim()).filter(Boolean) : [];
}

export async function extractBrandDNA(lead: Partial<Lead>): Promise<BrandIdentity | undefined> {
  const prompt = `
Analyze brand identity for:
Business: ${lead.businessName ?? ""}
Website: ${lead.website ?? ""}
Industry: ${lead.niche ?? ""}

Return JSON:
{
  "colors": ["#..."],
  "fontPairing": ["...","..."],
  "archetype": "...",
  "visualTone": "..."
}
`.trim();
  const txt = await loggedGenerateContent(prompt, "BrandDNA");
  try {
    const parsed = JSON.parse(txt);
    return parsed;
  } catch {
    return undefined;
  }
}

export async function generateVisual(prompt: string): Promise<string> {
  // This is a text-only placeholder generator that returns a "prompt pack" for image tools.
  // Real image generation is handled elsewhere; UI expects a string.
  const p = `Create an ultra-detailed image prompt for: ${prompt}`;
  return loggedGenerateContent(p, "VisualStudio");
}

export async function generateMockup(prompt: string, angle: string, leadId?: string): Promise<string> {
  const p = `
Generate a 4K mockup prompt.
Angle: ${angle}
Prompt: ${prompt}
Return a single prompt line.
`.trim();
  const out = await loggedGenerateContent(p, "Mockups4K");
  if (leadId) saveAsset("text", "Mockups4K", out, "Mockup prompt", { angle }, leadId);
  return out;
}

export async function generateROIReport(lead: Partial<Lead>, packageName: string, price: number): Promise<string> {
  const prompt = `
Create an ROI report for:
Business: ${lead.businessName ?? ""}
Package: ${packageName}
Price: ${price}

Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "ROICalc");
}

export async function architectFunnel(lead: Partial<Lead>): Promise<any[]> {
  const prompt = `
Design a funnel architecture for:
Business: ${lead.businessName ?? ""}
Website: ${lead.website ?? ""}

Return JSON array of funnel steps with fields:
{ "step": "...", "goal": "...", "asset": "...", "kpi": "..." }
`.trim();
  const txt = await loggedGenerateContent(prompt, "FunnelMap");
  try {
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function generatePitch(lead: Partial<Lead>): Promise<string> {
  const prompt = `
Write a concise pitch for:
Business: ${lead.businessName ?? ""}
Website: ${lead.website ?? ""}
Keep it persuasive and specific.
`.trim();
  return loggedGenerateContent(prompt, "PitchGen");
}

export async function architectPitchDeck(lead: Partial<Lead>): Promise<string> {
  const prompt = `
Create a pitch deck outline for:
Business: ${lead.businessName ?? ""}
Return as plain text with slide titles and bullet points.
`.trim();
  return loggedGenerateContent(prompt, "DeckArch");
}

export async function generateTaskMatrix(lead: Partial<Lead>): Promise<any[]> {
  const prompt = `
Create a task matrix for onboarding:
Business: ${lead.businessName ?? ""}

Return JSON array:
{ "task": "...", "owner": "...", "etaDays": number, "dependencies": ["..."] }
`.trim();
  const txt = await loggedGenerateContent(prompt, "TasksNode");
  try {
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function generateAgencyIdentity(lead: Partial<Lead>): Promise<string> {
  const prompt = `
Generate an agency identity statement (positioning, voice, promise) for:
Business: ${lead.businessName ?? ""}
`.trim();
  return loggedGenerateContent(prompt, "IdentityNode");
}

export async function synthesizeArticle(topic: string, tone: string = "professional"): Promise<string> {
  const prompt = `
Write a high-quality article.
Topic: ${topic}
Tone: ${tone}
Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "ArticleIntel");
}

export async function synthesizeProduct(productName: string, audience: string): Promise<string> {
  const prompt = `
Synthesize a product spec + marketing summary.
Product: ${productName}
Audience: ${audience}
Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "ProductSynth");
}

export async function performFactCheck(claim: string): Promise<string> {
  const prompt = `
Fact check the claim and provide a cautious answer:
"${claim}"
Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "FactCheck");
}

export async function simulateSandbox(prompt: string): Promise<string> {
  return loggedGenerateContent(prompt, "DemoSandbox");
}

export async function translateTactical(text: string, targetLang: string = "en"): Promise<string> {
  const prompt = `
Translate to ${targetLang} preserving meaning and intent:
${text}
`.trim();
  return loggedGenerateContent(prompt, "TranslatorNode");
}

export async function analyzeVisual(prompt: string): Promise<string> {
  const p = `
Analyze the described visual and provide actionable notes:
${prompt}
`.trim();
  return loggedGenerateContent(p, "VisionLab");
}

export async function critiqueVideoPresence(prompt: string): Promise<string> {
  const p = `
Critique video presence based on description; give improvements:
${prompt}
`.trim();
  return loggedGenerateContent(p, "VideoAudit");
}

export async function analyzeVideoUrl(videoUrl: string): Promise<string> {
  const p = `
Analyze the video at URL (assume you can't fetch it; infer likely issues) and give a checklist:
${videoUrl}
`.trim();
  return loggedGenerateContent(p, "VideoInsights");
}

export async function enhanceStrategicPrompt(prompt: string): Promise<string> {
  const p = `
Rewrite this prompt to be clearer, more constrained, and more effective:
${prompt}
`.trim();
  return loggedGenerateContent(p, "CinemaIntel");
}

export async function generateVideoPayload(prompt: string, cfg?: VeoConfig, leadId?: string): Promise<string> {
  const p = `
Generate a Veo-style JSON payload for video generation.
Prompt: ${prompt}
Config: ${JSON.stringify(cfg || {}, null, 2)}
Return JSON only.
`.trim();
  const out = await loggedGenerateContent(p, "VideoPitch");
  if (leadId) saveAsset("json", "VideoPitch", out, "Video payload", cfg || {}, leadId);
  return out;
}

export async function enhanceVideoPrompt(prompt: string): Promise<string> {
  const p = `Improve this video prompt with camera, lighting, motion and composition:\n${prompt}`;
  return loggedGenerateContent(p, "VideoPitch");
}

export async function fetchViralPulseData(topic: string): Promise<any[]> {
  const prompt = `
Generate a "viral pulse" dataset for topic: ${topic}
Return JSON array of { "trend": "...", "angle": "...", "hook": "...", "platform": "...", "whyNow": "..." }
`.trim();
  const txt = await loggedGenerateContent(prompt, "ViralPulse");
  try {
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function queryRealtimeAgent(question: string): Promise<string> {
  // “Realtime” is simulated; keeps UI working without breaking builds.
  const prompt = `Answer concisely with a real-time style update (no claims of live browsing):\n${question}`;
  return loggedGenerateContent(prompt, "MarketTrends");
}

export async function fetchTokenStats(): Promise<{ used: number; remaining: number }> {
  // Lightweight estimate (no billing API here).
  return { used: 0, remaining: 0 };
}

export async function fetchLiveIntel(entity: string): Promise<string> {
  const prompt = `
Produce a concise intelligence brief for:
${entity}
Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "IntelNode");
}

export async function fetchBenchmarkData(entity: string): Promise<{ ok: boolean; report?: BenchmarkReport; text: string; raw?: any; error?: any }> {
  const prompt = `
Create a benchmark report for: ${entity}
Return JSON:
{
  "entityName": "...",
  "missionSummary": "...",
  "visualStack": ["..."],
  "sonicStack": ["..."],
  "featureGap": "...",
  "businessModel": "...",
  "designSystem": "...",
  "deepArchitecture": "...",
  "sources": ["..."]
}
`.trim();
  const txt = await loggedGenerateContent(prompt, "BenchmarkNode");
  try {
    const report = JSON.parse(txt) as BenchmarkReport;
    return { ok: true, report, text: txt, raw: report };
  } catch (e) {
    return { ok: false, text: txt, raw: null, error: e };
  }
}

export async function analyzeLedger(lead: Partial<Lead>): Promise<{ risk: string; opportunity: string }> {
  const prompt = `
Analyze risks and opportunities for:
Business: ${lead.businessName ?? ""}
Website: ${lead.website ?? ""}
Return JSON: { "risk": "...", "opportunity": "..." }
`.trim();
  const txt = await loggedGenerateContent(prompt, "AnalyticsHub");
  try {
    const parsed = JSON.parse(txt);
    return {
      risk: String(parsed?.risk ?? ""),
      opportunity: String(parsed?.opportunity ?? ""),
    };
  } catch {
    return { risk: "", opportunity: "" };
  }
}

export async function analyzeVideoPresence(prompt: string): Promise<string> {
  return critiqueVideoPresence(prompt);
}

export async function crawlTheaterSignals(region: string): Promise<string[]> {
  const prompt = `
Generate a list of "theater signals" / market signals for region: ${region}
Return JSON array of strings.
`.trim();
  const txt = await loggedGenerateContent(prompt, "AutoCrawl");
  try {
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed.map((s) => String(s)) : [];
  } catch {
    return [];
  }
}

export async function identifySubRegions(region: string): Promise<string[]> {
  const prompt = `
List sub-regions / neighborhoods for: ${region}
Return JSON array of strings.
`.trim();
  const txt = await loggedGenerateContent(prompt, "AutoCrawl");
  try {
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed.map((s) => String(s)) : [];
  } catch {
    return [];
  }
}

export async function generateAffiliateProgram(lead: Partial<Lead>): Promise<string> {
  const prompt = `
Create an affiliate program outline for:
Business: ${lead.businessName ?? ""}
Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "AffiliateNode");
}

export async function generatePlaybookStrategy(lead: Partial<Lead>): Promise<string> {
  const prompt = `
Generate a strategic playbook for:
Business: ${lead.businessName ?? ""}
Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "ScoringRubricView");
}

export async function orchestrateBusinessPackage(lead: Partial<Lead>): Promise<string> {
  const prompt = `
Orchestrate a complete business package:
Business: ${lead.businessName ?? ""}
Include: positioning, offer, funnel, outreach, KPIs.
Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "BusinessOrchestrator");
}

export async function generateFlashSparks(topic: string): Promise<string[]> {
  const prompt = `
Generate 10 flash-spark content ideas for: ${topic}
Return JSON array of strings.
`.trim();
  const txt = await loggedGenerateContent(prompt, "FlashSpark");
  try {
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed.map((s) => String(s)) : [];
  } catch {
    return txt ? txt.split("\n").map((l) => l.trim()).filter(Boolean) : [];
  }
}

export async function generateAudioPitch(lead: Partial<Lead>): Promise<string> {
  const prompt = `
Write a short voice-over script (audio pitch) for:
Business: ${lead.businessName ?? ""}
Return plain text.
`.trim();
  return loggedGenerateContent(prompt, "SonicStudio");
}

export async function testModelPerformance(prompt: string, model: GeminiModel = "gemini-1.5-flash"): Promise<string> {
  const out = await generateContent(prompt, model);
  return out.ok ? out.text : "";
}
