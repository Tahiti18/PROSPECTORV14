/* services/geminiService.ts
   Prospector v14 — unified AI + vault + logs service
   Fixes: missing exports, wrong signatures, wrong return types, non-iterable logs/assets
*/

import { Lead } from "../types";

/* ---------------------------------------------
   Storage keys
---------------------------------------------- */
const LS_OPENROUTER_KEY = "prospector.openrouterKey";
const LS_KIE_KEY = "prospector.kieKey";
const LS_ASSETS = "prospector.assets.v1";
const LS_LOGS = "prospector.logs.v1";

/* ---------------------------------------------
   Types
---------------------------------------------- */
export type Role = "user" | "assistant" | "system";
export type AssetType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "JSON";

export interface AssetRecord {
  id: string;
  type: AssetType;
  module: string;
  timestamp: number;
  title?: string;
  leadId?: string;
  data: string; // URL for media, or text for text/json
  metadata?: Record<string, any>;
}

export interface ProductionLog {
  id: string;
  timestamp: number;
  module: string;
  level: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, any>;
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
  prompt?: string;
  durationSeconds?: number;
  aspectRatio?: string; // <-- fixes TS2353 in VideoPitch
  style?: string;
  negativePrompt?: string;
  seed?: number;
  [k: string]: any;
}

/* ---------------------------------------------
   Public iterables (components use these as arrays)
---------------------------------------------- */
export const SESSION_ASSETS: AssetRecord[] = loadAssets();
export const PRODUCTION_LOGS: ProductionLog[] = loadLogs();

/* ---------------------------------------------
   Subscribers
---------------------------------------------- */
const assetSubs = new Set<(assets: AssetRecord[]) => void>();
const logSubs = new Set<(logs: ProductionLog[]) => void>();

function notifyAssets() {
  const snap = [...SESSION_ASSETS];
  for (const cb of assetSubs) cb(snap);
}
function notifyLogs() {
  const snap = [...PRODUCTION_LOGS];
  for (const cb of logSubs) cb(snap);
}

/* ---------------------------------------------
   Utilities
---------------------------------------------- */
function nowId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeJsonParse<T = any>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractJsonBlock(text: string): string | null {
  // Try fenced ```json ... ```
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  // Try first { ... } or [ ... ]
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  const start = firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
  if (start === -1) return null;

  // Very small brace/array balance scan
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === open) depth++;
    if (ch === close) depth--;
    if (depth === 0) return text.slice(start, i + 1).trim();
  }
  return null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function loadAssets(): AssetRecord[] {
  try {
    const raw = localStorage.getItem(LS_ASSETS);
    const parsed = raw ? (JSON.parse(raw) as AssetRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistAssets() {
  try {
    localStorage.setItem(LS_ASSETS, JSON.stringify(SESSION_ASSETS));
  } catch {
    // ignore
  }
}

function loadLogs(): ProductionLog[] {
  try {
    const raw = localStorage.getItem(LS_LOGS);
    const parsed = raw ? (JSON.parse(raw) as ProductionLog[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistLogs() {
  try {
    localStorage.setItem(LS_LOGS, JSON.stringify(PRODUCTION_LOGS));
  } catch {
    // ignore
  }
}

export function pushLog(module: string, message: string, level: "info" | "warn" | "error" = "info", meta?: Record<string, any>) {
  const entry: ProductionLog = {
    id: nowId("log"),
    timestamp: Date.now(),
    module,
    level,
    message,
    meta,
  };
  PRODUCTION_LOGS.unshift(entry);
  // cap logs
  if (PRODUCTION_LOGS.length > 500) PRODUCTION_LOGS.length = 500;
  persistLogs();
  notifyLogs();
  return entry;
}

/* ---------------------------------------------
   Keys API (SecurityGateway expects positional args)
---------------------------------------------- */
export function setStoredKeys(openRouterKey: string, kieKey?: string) {
  try {
    if (openRouterKey) localStorage.setItem(LS_OPENROUTER_KEY, openRouterKey.trim());
    if (typeof kieKey === "string") localStorage.setItem(LS_KIE_KEY, kieKey.trim());
    pushLog("SecurityGateway", "Keys stored", "info");
  } catch {
    pushLog("SecurityGateway", "Failed to store keys", "warn");
  }
}

export function getStoredKeys(): { openRouterKey: string; kieKey: string } {
  const openRouterKey = (localStorage.getItem(LS_OPENROUTER_KEY) || "").trim();
  const kieKey = (localStorage.getItem(LS_KIE_KEY) || "").trim();
  return { openRouterKey, kieKey };
}

/* ---------------------------------------------
   Asset Vault API
---------------------------------------------- */
export function subscribeToAssets(cb: (assets: AssetRecord[]) => void) {
  assetSubs.add(cb);
  // immediate fire
  cb([...SESSION_ASSETS]);
  return () => assetSubs.delete(cb);
}

export function clearVault() {
  SESSION_ASSETS.splice(0, SESSION_ASSETS.length);
  persistAssets();
  notifyAssets();
  pushLog("Vault", "Vault cleared", "info");
}

export function deleteAsset(id: string) {
  const idx = SESSION_ASSETS.findIndex((a) => a.id === id);
  if (idx >= 0) {
    const [removed] = SESSION_ASSETS.splice(idx, 1);
    persistAssets();
    notifyAssets();
    pushLog("Vault", `Asset deleted: ${removed.type}`, "info", { id });
  }
}

export async function importVault(items: AssetRecord[]) {
  // merge by id
  const map = new Map<string, AssetRecord>();
  for (const a of SESSION_ASSETS) map.set(a.id, a);
  for (const a of items || []) {
    if (a && a.id) map.set(a.id, a);
  }
  const merged = Array.from(map.values()).sort((x, y) => y.timestamp - x.timestamp);
  SESSION_ASSETS.splice(0, SESSION_ASSETS.length, ...merged);
  persistAssets();
  notifyAssets();
  pushLog("Vault", "Vault imported", "info", { count: items?.length || 0 });
}

export async function saveAsset(
  data: string,
  type: AssetType,
  module: string,
  leadId?: string,
  title?: string,
  metadata?: Record<string, any>
): Promise<AssetRecord> {
  const rec: AssetRecord = {
    id: nowId("asset"),
    type,
    module: module || "Unknown",
    timestamp: Date.now(),
    title,
    leadId,
    data,
    metadata,
  };
  SESSION_ASSETS.unshift(rec);
  if (SESSION_ASSETS.length > 1000) SESSION_ASSETS.length = 1000;
  persistAssets();
  notifyAssets();
  pushLog(module || "Vault", `Asset saved (${type})`, "info", { id: rec.id, leadId });
  return rec;
}

/* ---------------------------------------------
   OpenRouter (primary)
---------------------------------------------- */
type ORMsg = { role: Role; content: string };

async function openRouterRequest(opts: {
  model: string;
  messages: ORMsg[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}): Promise<{ text: string; raw: any }> {
  const { openRouterKey } = getStoredKeys();
  if (!openRouterKey) {
    const msg = "Missing OpenRouter key. Go to Security Gateway and paste it.";
    pushLog("OpenRouter", msg, "warn");
    return { text: msg, raw: null };
  }

  const temperature = typeof opts.temperature === "number" ? clamp(opts.temperature, 0, 2) : 0.4;

  const body: any = {
    model: opts.model || "openai/gpt-4o-mini",
    messages: opts.messages,
    temperature,
  };

  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.json) body.response_format = { type: "json_object" };

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "ProspectorV14",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    const msg = `OpenRouter error ${resp.status}: ${t || resp.statusText}`;
    pushLog("OpenRouter", msg, "error");
    return { text: msg, raw: { status: resp.status, body: t } };
  }

  const raw = await resp.json();
  const text =
    raw?.choices?.[0]?.message?.content ??
    raw?.choices?.[0]?.text ??
    raw?.output_text ??
    raw?.text ??
    "";

  return { text: String(text || "").trim(), raw };
}

/**
 * openRouterChat overloads (used in many modules)
 * - openRouterChat(prompt)
 * - openRouterChat(prompt, system)
 * - openRouterChat({prompt, system, model, temperature, json})
 */
export async function openRouterChat(
  a: string | { prompt: string; system?: string; model?: string; temperature?: number; json?: boolean },
  b?: string,
  c?: string
): Promise<string> {
  const opts =
    typeof a === "string"
      ? { prompt: a, system: b, model: c }
      : { prompt: a.prompt, system: a.system, model: a.model, temperature: a.temperature, json: a.json };

  const model = opts.model || "openai/gpt-4o-mini";
  const messages: ORMsg[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.prompt });

  const res = await openRouterRequest({ model, messages, temperature: opts.temperature, json: opts.json });
  return res.text;
}

/* ---------------------------------------------
   Logged generation (supports BOTH object + positional calls)
---------------------------------------------- */
export async function loggedGenerateContent(
  a:
    | {
        module: string;
        prompt: string;
        leadId?: string;
        model?: string;
        system?: string;
        temperature?: number;
        json?: boolean;
      }
    | string,
  b?: string,
  c?: string,
  d?: string
): Promise<string> {
  const opts =
    typeof a === "string"
      ? { module: a, prompt: b || "", leadId: c, model: d }
      : {
          module: a.module,
          prompt: a.prompt,
          leadId: a.leadId,
          model: a.model,
          system: a.system,
          temperature: a.temperature,
          json: a.json,
        };

  pushLog(opts.module, "AI request started", "info", { leadId: opts.leadId, model: opts.model });

  const text = await openRouterChat({
    prompt: opts.prompt,
    system: opts.system,
    model: opts.model,
    temperature: opts.temperature,
    json: opts.json,
  });

  pushLog(opts.module, "AI request completed", "info", { leadId: opts.leadId });
  return text;
}

/* ---------------------------------------------
   Core generators used across the app
---------------------------------------------- */
export async function generateLeads(region: string, nicheHint: string, count: number): Promise<Lead[]> {
  const module = "LeadGen";
  const prompt = `
Generate ${count} realistic business leads in JSON.
Region: ${region}
Niche hint: ${nicheHint}

Return ONLY JSON with shape:
{ "leads": [ { "businessName": string, "website": string|null, "region": string, "city": string, "niche": string, "description": string, "signals": string[], "email": string|null, "phone": string|null } ] }
`;

  const raw = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(raw) || raw;
  const parsed = safeJsonParse<{ leads: any[] }>(block);

  const leads = Array.isArray(parsed?.leads) ? parsed!.leads : [];
  const cleaned: Lead[] = leads.map((x: any, i: number) => {
    const businessName = String(x?.businessName || x?.name || `Lead ${i + 1}`);
    return {
      id: nowId("lead"),
      businessName,
      website: x?.website ? String(x.website) : "",
      region: String(x?.region || region || ""),
      city: String(x?.city || ""),
      niche: String(x?.niche || nicheHint || ""),
      description: String(x?.description || ""),
      signals: Array.isArray(x?.signals) ? x.signals.map((s: any) => String(s)) : [],
      email: x?.email ? String(x.email) : "",
      phone: x?.phone ? String(x.phone) : "",
      score: 0,
      tags: [],
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;
  });

  pushLog(module, `Generated leads: ${cleaned.length}`, "info");
  return cleaned;
}

/**
 * Grounded lead search used by AutomatedSearch + RadarRecon
 * signature: groundedLeadSearch(query, region, count)
 */
export async function groundedLeadSearch(query: string, region: string, count: number): Promise<{
  ok: boolean;
  leads: Lead[];
  text: string;
  raw?: any;
  groundingSources?: string[];
  error?: any;
}> {
  const module = "GroundedSearch";
  const prompt = `
You are a lead research agent.

Goal: find ${count} businesses relevant to:
Query: ${query}
Region: ${region}

Return ONLY JSON:
{
  "leads": [
    {
      "businessName": string,
      "website": string|null,
      "region": string,
      "city": string,
      "niche": string,
      "description": string,
      "signals": string[]
    }
  ],
  "groundingSources": [string]
}
Note: If you cannot truly browse, produce best-effort leads AND set groundingSources to [].
`;

  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);

  const leadsRaw = Array.isArray(parsed?.leads) ? parsed.leads : [];
  const leads: Lead[] = leadsRaw.map((x: any) => ({
    id: nowId("lead"),
    businessName: String(x?.businessName || "Unknown"),
    website: x?.website ? String(x.website) : "",
    region: String(x?.region || region || ""),
    city: String(x?.city || ""),
    niche: String(x?.niche || ""),
    description: String(x?.description || ""),
    signals: Array.isArray(x?.signals) ? x.signals.map((s: any) => String(s)) : [],
    score: 0,
    tags: [],
    notes: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })) as any;

  return { ok: true, leads, text, groundingSources: Array.isArray(parsed?.groundingSources) ? parsed.groundingSources : [] };
}

/* ---------------------------------------------
   Benchmarks / intel
---------------------------------------------- */
export async function fetchBenchmarkData(lead: Lead): Promise<{ ok: boolean; report?: BenchmarkReport; text: string; raw?: any; error?: any }> {
  const module = "Benchmark";
  const prompt = `
Create a competitive benchmark report for:
Business: ${lead.businessName}
Website: ${lead.website || "(unknown)"}
Region: ${lead.region || ""}

Return ONLY JSON:
{
  "entityName": string,
  "missionSummary": string,
  "visualStack": string[],
  "sonicStack": string[],
  "featureGap": string,
  "businessModel": string,
  "designSystem": string,
  "deepArchitecture": string,
  "sources": string[]
}
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);

  if (!parsed) return { ok: false, text, error: "Parse failed" };

  const report: BenchmarkReport = {
    entityName: String(parsed.entityName || lead.businessName || ""),
    missionSummary: String(parsed.missionSummary || ""),
    visualStack: Array.isArray(parsed.visualStack) ? parsed.visualStack.map((x: any) => String(x)) : [],
    sonicStack: Array.isArray(parsed.sonicStack) ? parsed.sonicStack.map((x: any) => String(x)) : [],
    featureGap: String(parsed.featureGap || ""),
    businessModel: String(parsed.businessModel || ""),
    designSystem: String(parsed.designSystem || ""),
    deepArchitecture: String(parsed.deepArchitecture || ""),
    sources: Array.isArray(parsed.sources) ? parsed.sources.map((x: any) => String(x)) : [],
  };

  return { ok: true, report, text, raw: parsed };
}

export async function fetchLiveIntel(lead: Lead, focus?: string): Promise<string> {
  const module = "LiveIntel";
  const prompt = `
Provide actionable intelligence for:
Business: ${lead.businessName}
Website: ${lead.website || ""}
Focus: ${focus || "positioning, offer, angles, objections, quick wins"}

Return a concise, high-signal brief with bullets and short sections.
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Writing / content
---------------------------------------------- */
export async function synthesizeArticle(topic: string, angle?: string): Promise<string> {
  const module = "ArticleIntel";
  const prompt = `
Write a high-signal article draft.
Topic: ${topic}
Angle: ${angle || "practical, decision-maker oriented"}

Constraints:
- Clear headings
- Bullet lists where useful
- No fluff
`;
  return loggedGenerateContent({ module, prompt });
}

export async function performFactCheck(text: string): Promise<string> {
  const module = "FactCheck";
  const prompt = `
Fact-check the following content. List:
- claims that are likely wrong/unsupported
- what to verify
- safer phrasing

CONTENT:
${text}
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Campaign / outreach
---------------------------------------------- */
export async function generateOutreachSequence(lead: Lead, channel: string = "email", tone: string = "premium"): Promise<any[]> {
  const module = "Sequencer";
  const prompt = `
Create an outreach sequence for:
Business: ${lead.businessName}
Website: ${lead.website || ""}
Channel: ${channel}
Tone: ${tone}

Return ONLY JSON:
{
  "sequence": [
    { "step": number, "subject": string, "body": string, "cta": string, "timing": string }
  ]
}
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return Array.isArray(parsed?.sequence) ? parsed.sequence : [];
}

export async function generateProposalDraft(lead: Lead): Promise<string> {
  const module = "ProposalDraft";
  const prompt = `
Draft a client proposal for:
Business: ${lead.businessName}
Website: ${lead.website || ""}

Include:
- Executive summary
- Scope (phased)
- Timeline
- Deliverables
- Pricing options (3 tiers)
- Next steps
`;
  return loggedGenerateContent({ module, prompt });
}

export async function generateROIReport(lead: Lead, offer?: string): Promise<string> {
  const module = "ROI";
  const prompt = `
Create an ROI report for:
Business: ${lead.businessName}
Offer: ${offer || "lead generation + conversion + follow-up automation"}

Include:
- assumptions
- 3 scenarios (conservative/base/aggressive)
- monthly impact
- what must be true for the numbers
`;
  return loggedGenerateContent({ module, prompt });
}

export async function orchestrateBusinessPackage(lead: Lead): Promise<any> {
  const module = "BusinessOrchestrator";
  const prompt = `
Create a packaged business plan + campaign blueprint for:
Business: ${lead.businessName}
Website: ${lead.website || ""}

Return ONLY JSON:
{
  "summary": string,
  "positioning": string,
  "offerStack": string[],
  "sequence": [{ "step": number, "subject": string, "body": string, "cta": string, "timing": string }],
  "assetsToCreate": [{ "type": "IMAGE"|"VIDEO"|"TEXT"|"AUDIO", "title": string, "prompt": string }]
}
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block) || { summary: text };
  return parsed;
}

export async function generatePlaybookStrategy(lead: Lead): Promise<string> {
  const module = "Playbook";
  const prompt = `
Create a concise playbook strategy for:
Business: ${lead.businessName}
Website: ${lead.website || ""}

Include:
- ICP
- offer angles
- objections + counters
- outreach hooks
- landing page structure
`;
  return loggedGenerateContent({ module, prompt });
}

export async function generateTaskMatrix(lead: Lead): Promise<any[]> {
  const module = "TaskMatrix";
  const prompt = `
Generate a task matrix for executing a campaign for:
Business: ${lead.businessName}

Return ONLY JSON:
{
  "tasks": [
    { "area": string, "task": string, "owner": string, "priority": "P0"|"P1"|"P2", "eta": string }
  ]
}
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return Array.isArray(parsed?.tasks) ? parsed.tasks : [];
}

export async function generateNurtureDialogue(lead: Lead, scenario: string): Promise<any[]> {
  const module = "AIConcierge";
  const prompt = `
Simulate a short nurture conversation.
Business: ${lead.businessName}
Scenario: ${scenario}

Return ONLY JSON:
{
  "messages": [
    { "role": "user"|"assistant", "text": string }
  ]
}
Rules:
- 8 to 14 messages
- realistic objections + concise responses
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return Array.isArray(parsed?.messages) ? parsed.messages : [];
}

/* ---------------------------------------------
   Brand / identity
---------------------------------------------- */
export async function extractBrandDNA(lead: Lead): Promise<any> {
  const module = "BrandDNA";
  const prompt = `
Extract brand DNA for:
Business: ${lead.businessName}
Website: ${lead.website || ""}

Return ONLY JSON:
{
  "colors": string[],
  "fontPairing": string,
  "archetype": string,
  "visualTone": string,
  "messagingPillars": string[],
  "taglines": string[]
}
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  return safeJsonParse<any>(block) || {};
}

export async function generateAgencyIdentity(lead: Lead): Promise<string> {
  const module = "IdentityNode";
  const prompt = `
Generate an agency identity brief for serving:
Business: ${lead.businessName}

Include:
- positioning statement
- tone rules
- do/don't list
- example hero copy
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Visual / video / audio helpers
   (Real implementations: they produce prompts + optionally store assets.
   If KIE endpoints are not configured, they return prompt payloads as text.)
---------------------------------------------- */
export async function generateVisual(lead: Lead, concept: string): Promise<string> {
  const module = "VisualStudio";
  const prompt = `
Create an image generation prompt for:
Business: ${lead.businessName}
Concept: ${concept}

Return a single prompt line suitable for an image model.
`;
  return loggedGenerateContent({ module, prompt });
}

export async function analyzeVisual(imageUrl: string, goal: string = "quality + message + improvements"): Promise<string> {
  const module = "VisionLab";
  const prompt = `
Analyze this image URL:
${imageUrl}

Goal:
${goal}

Return structured feedback with bullets.
`;
  return loggedGenerateContent({ module, prompt });
}

export async function analyzeVideoUrl(videoUrl: string): Promise<string> {
  const module = "VideoInsights";
  const prompt = `
Analyze this video URL:
${videoUrl}

Return:
- hook quality
- pacing
- clarity
- improvement list
`;
  return loggedGenerateContent({ module, prompt });
}

export async function enhanceVideoPrompt(basePrompt: string): Promise<string> {
  const module = "VideoPitch";
  const prompt = `
Rewrite this video generation prompt to be more specific and cinematic.
Keep it concise.

BASE:
${basePrompt}
`;
  return loggedGenerateContent({ module, prompt });
}

export async function generateVideoPayload(lead: Lead, config: VeoConfig): Promise<string> {
  const module = "VideoProduction";
  const prompt = `
Create a Veo-style video payload as JSON for:
Business: ${lead.businessName}

Config:
${JSON.stringify(config || {}, null, 2)}

Return ONLY JSON with keys: prompt, durationSeconds, aspectRatio, style, negativePrompt.
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  return block; // payload JSON string
}

export async function critiqueVideoPresence(lead: Lead): Promise<string> {
  const module = "VideoAudit";
  const prompt = `
Critique the video presence strategy for:
Business: ${lead.businessName}
Website: ${lead.website || ""}

Return:
- content pillars
- posting cadence
- hook templates
- next 10 video ideas
`;
  return loggedGenerateContent({ module, prompt });
}

export async function generateMockup(lead: Lead, angle: string): Promise<string> {
  const module = "Mockups4K";
  const prompt = `
Create a mockup concept prompt for:
Business: ${lead.businessName}
Angle: ${angle}

Return a concise prompt suitable for a mockup generator.
`;
  return loggedGenerateContent({ module, prompt });
}

export async function generateAudioPitch(lead: Lead, vibe: string = "premium"): Promise<string> {
  const module = "SonicStudio";
  const prompt = `
Write a short audio ad script (15-20s) for:
Business: ${lead.businessName}
Vibe: ${vibe}

Include:
- hook
- value
- CTA
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Market trends / realtime agent (best-effort)
---------------------------------------------- */
export async function fetchViralPulseData(topic: string): Promise<any[]> {
  const module = "ViralPulse";
  const prompt = `
Generate a "viral pulse" list for topic:
${topic}

Return ONLY JSON:
{ "items": [ { "title": string, "angle": string, "whyNow": string } ] }
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return Array.isArray(parsed?.items) ? parsed.items : [];
}

export async function queryRealtimeAgent(query: string): Promise<string> {
  const module = "RealtimeAgent";
  const prompt = `
Answer this query with a practical, actionable response:
${query}
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Ledger / analytics (best-effort)
---------------------------------------------- */
export async function analyzeLedger(entries?: any[]): Promise<{ risk: string; opportunity: string }> {
  const module = "AnalyticsHub";
  const prompt = `
Analyze this ledger data and return risk + opportunity.

Return ONLY JSON:
{ "risk": string, "opportunity": string }

Ledger:
${JSON.stringify(entries || [], null, 2)}
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return {
    risk: String(parsed?.risk || ""),
    opportunity: String(parsed?.opportunity || ""),
  };
}

/* ---------------------------------------------
   Affiliate / product synthesis
---------------------------------------------- */
export async function generateAffiliateProgram(lead: Lead): Promise<string> {
  const module = "AffiliateNode";
  const prompt = `
Create an affiliate program plan for:
Business: ${lead.businessName}

Include:
- commission structure
- rules
- onboarding steps
- promo assets list
`;
  return loggedGenerateContent({ module, prompt });
}

export async function synthesizeProduct(lead: Lead, idea?: string): Promise<string> {
  const module = "ProductSynth";
  const prompt = `
Synthesize a product concept for:
Business: ${lead.businessName}
Idea hint: ${idea || "a productized service"}

Include:
- what it is
- why it wins
- deliverables
- price bands
- FAQ
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Theater / regions (AutoCrawl expects arrays)
---------------------------------------------- */
export async function crawlTheaterSignals(region: string): Promise<string[]> {
  const module = "AutoCrawl";
  const prompt = `
List theater/market signals for region: ${region}
Return ONLY JSON: { "signals": [string] }
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return Array.isArray(parsed?.signals) ? parsed.signals.map((x: any) => String(x)) : [];
}

export async function identifySubRegions(region: string): Promise<string[]> {
  const module = "AutoCrawl";
  const prompt = `
Identify sub-regions / neighborhoods inside: ${region}
Return ONLY JSON: { "subRegions": [string] }
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return Array.isArray(parsed?.subRegions) ? parsed.subRegions.map((x: any) => String(x)) : [];
}

/* ---------------------------------------------
   Sandbox / model testing
---------------------------------------------- */
export async function simulateSandbox(prompt: string): Promise<string> {
  const module = "DemoSandbox";
  return loggedGenerateContent({ module, prompt });
}

export async function testModelPerformance(samplePrompt: string): Promise<string> {
  const module = "ModelBench";
  const prompt = `
Run a lightweight model test.
Prompt:
${samplePrompt}

Return:
- response quality notes
- latency assumptions
- cost sensitivity notes
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Strategic prompt enhancement
---------------------------------------------- */
export async function enhanceStrategicPrompt(base: string): Promise<string> {
  const module = "CinemaIntel";
  const prompt = `
Improve this prompt for strategic clarity and output quality.
Return the improved prompt only.

BASE:
${base}
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Flash sparks / funnel / deck
---------------------------------------------- */
export async function generateFlashSparks(lead: Lead): Promise<string[]> {
  const module = "FlashSpark";
  const prompt = `
Generate 12 flash sparks (hooks/angles) for:
Business: ${lead.businessName}

Return ONLY JSON: { "sparks": [string] }
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return Array.isArray(parsed?.sparks) ? parsed.sparks.map((x: any) => String(x)) : [];
}

export async function architectFunnel(lead: Lead): Promise<any[]> {
  const module = "FunnelMap";
  const prompt = `
Architect a funnel for:
Business: ${lead.businessName}

Return ONLY JSON:
{ "steps": [ { "stage": string, "goal": string, "asset": string, "kpi": string } ] }
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  const parsed = safeJsonParse<any>(block);
  return Array.isArray(parsed?.steps) ? parsed.steps : [];
}

export async function architectPitchDeck(lead: Lead): Promise<string> {
  const module = "DeckArch";
  const prompt = `
Create a pitch deck architecture (slide-by-slide outline) for:
Business: ${lead.businessName}

Return a numbered slide outline with titles + bullets.
`;
  return loggedGenerateContent({ module, prompt });
}

export async function generatePitch(lead: Lead): Promise<string> {
  const module = "PitchGen";
  const prompt = `
Write a short pitch script for:
Business: ${lead.businessName}

Include:
- opener
- pain
- solution
- proof
- CTA
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Motion lab (placeholder-free: returns a real concept)
---------------------------------------------- */
export async function generateMotionLabConcept(lead: Lead): Promise<string> {
  const module = "MotionLab";
  const prompt = `
Generate a motion concept for a short animated ad for:
Business: ${lead.businessName}

Return:
- concept
- scene beats
- text overlays
`;
  return loggedGenerateContent({ module, prompt });
}

/* ---------------------------------------------
   Token stats (best-effort; UI expects something)
---------------------------------------------- */
export async function fetchTokenStats(): Promise<any> {
  const module = "TokenNode";
  const { openRouterKey } = getStoredKeys();
  const prompt = `
We cannot inspect actual provider usage without API access.
Given key-present: ${openRouterKey ? "yes" : "no"}, return JSON:
{ "status": string, "note": string }
`;
  const text = await loggedGenerateContent({ module, prompt, json: true });
  const block = extractJsonBlock(text) || text;
  return safeJsonParse<any>(block) || { status: "unknown", note: text };
}

/* ---------------------------------------------
   Translation
---------------------------------------------- */
export async function translateTactical(text: string, targetLang: string = "English"): Promise<string> {
  const module = "Translator";
  const prompt = `
Translate to ${targetLang}. Keep meaning, keep it concise.

TEXT:
${text}
`;
  return loggedGenerateContent({ module, prompt });
}
