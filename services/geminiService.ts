// services/geminiService.ts
// Legacy-compatible Gemini/OpenRouter service layer for Prospector V14
// IMPORTANT: This file preserves ALL legacy exports used across the app.

import type { Lead } from '../types';

/* =========================
   Key storage (client-side)
========================= */

const STORAGE_KEY = 'prospector_keys_v1';

export type StoredKeys = {
  openRouterApiKey?: string; // not sent from client; kept for legacy UI
  kieApiKey?: string;        // not sent from client; kept for legacy UI
  openRouterModel?: string;
};

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-exp:free';

export const setStoredKeys = (keys: Partial<StoredKeys>) => {
  const prev = getStoredKeys();
  const next = { ...prev, ...keys };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const getStoredKeys = (): StoredKeys => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredKeys) : {};
  } catch {
    return {};
  }
};

/* =========================
   Production logs (legacy)
========================= */

export type ProductionLog = {
  ts: number;
  level: 'info' | 'warn' | 'error';
  scope: string;
  message: string;
  meta?: any;
};

const LOG_STORAGE_KEY = 'prospector_prod_logs_v1';

export const PRODUCTION_LOGS = {
  read(): ProductionLog[] {
    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ProductionLog[]) : [];
    } catch {
      return [];
    }
  },
  write(logs: ProductionLog[]) {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(-500)));
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

export const pushLog = (scope: string, message: string, meta?: any, level: ProductionLog['level'] = 'info') => {
  const logs = PRODUCTION_LOGS.read();
  logs.push({ ts: Date.now(), level, scope, message, meta });
  PRODUCTION_LOGS.write(logs);
};

/* =========================
   Assets (legacy vault API)
========================= */

export type AssetRecord = {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'json' | 'unknown';
  module: string;
  timestamp: number;
  title?: string;
  content?: string;
  url?: string;
  metadata?: any;
};

const ASSET_STORAGE_KEY = 'prospector_assets_v1';

export const SESSION_ASSETS = {
  read(): AssetRecord[] {
    try {
      const raw = localStorage.getItem(ASSET_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AssetRecord[]) : [];
    } catch {
      return [];
    }
  },
  write(items: AssetRecord[]) {
    try {
      localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(items.slice(-2000)));
    } catch {
      // ignore
    }
  },
};

export const subscribeToAssets = (cb: (items: AssetRecord[]) => void) => {
  const handler = () => cb(SESSION_ASSETS.read());
  window.addEventListener('storage', handler);
  const interval = window.setInterval(handler, 1500);
  handler();
  return () => {
    window.removeEventListener('storage', handler);
    window.clearInterval(interval);
  };
};

export const clearVault = () => {
  SESSION_ASSETS.write([]);
};

export const deleteAsset = (id: string) => {
  const items = SESSION_ASSETS.read().filter(a => a.id !== id);
  SESSION_ASSETS.write(items);
};

export const importVault = async (records: AssetRecord[]) => {
  const existing = SESSION_ASSETS.read();
  const merged = [...existing, ...(records || [])];
  SESSION_ASSETS.write(merged);
  return merged;
};

const uid = () => Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);

export const saveAsset = async (record: Partial<AssetRecord>): Promise<AssetRecord> => {
  const item: AssetRecord = {
    id: record.id || uid(),
    type: record.type || 'unknown',
    module: record.module || 'UNKNOWN_MODULE',
    timestamp: record.timestamp || Date.now(),
    title: record.title,
    content: record.content,
    url: record.url,
    metadata: record.metadata,
  };
  const items = SESSION_ASSETS.read();
  items.push(item);
  SESSION_ASSETS.write(items);
  return item;
};

/* =========================
   OpenRouter chat (FIXED)
   - Uses messages[] format
   - Preserves legacy signature
========================= */

export const DEFAULT_SYSTEM_INSTRUCTION =
  'You are Prospector OS. Always respond with strictly valid JSON when asked for JSON. Never wrap JSON in markdown.';

export const openRouterChat = async (
  prompt: string,
  systemInstruction?: string,
  modelOverride?: string
): Promise<string> => {
  const keys = getStoredKeys();
  const model = modelOverride || keys.openRouterModel || DEFAULT_OPENROUTER_MODEL;

  const userContent = (prompt ?? '').toString();
  if (!userContent.trim()) {
    throw new Error('Client payload missing prompt/messages');
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  const sys = (systemInstruction ?? '').toString().trim();
  if (sys) messages.push({ role: 'system', content: sys });
  messages.push({ role: 'user', content: userContent });

  const res = await fetch('/api/openrouter/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Server-side proxy injects Authorization; client MUST NOT send keys.
      'X-Prospector-Client': 'openrouterChat-v4',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
    }),
  });

  const json: any = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      (typeof json === 'string' ? json : '') ||
      `OpenRouter error (${res.status})`;
    throw new Error(msg);
  }

  const content =
    json?.choices?.[0]?.message?.content ??
    json?.choices?.[0]?.delta?.content ??
    json?.output_text ??
    json?.output ??
    json?.completion ??
    json?.text;

  if (typeof content !== 'string') return JSON.stringify(json);
  return content;
};

/* =========================
   Helpers
========================= */

const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract first JSON object/array from mixed output
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');
    if (s !== -1 && e !== -1 && e > s) {
      try {
        return JSON.parse(text.slice(s, e + 1));
      } catch {
        // ignore
      }
    }
    const aS = text.indexOf('[');
    const aE = text.lastIndexOf(']');
    if (aS !== -1 && aE !== -1 && aE > aS) {
      try {
        return JSON.parse(text.slice(aS, aE + 1));
      } catch {
        // ignore
      }
    }
    return null;
  }
};

const normalizeLead = (l: any): Lead | null => {
  if (!l || typeof l !== 'object') return null;

  const businessName = (l.businessName ?? l.name ?? '').toString().trim();
  if (!businessName) return null;

  const website = (l.website ?? l.domain ?? '').toString().trim();
  const city = (l.city ?? '').toString().trim();
  const country = (l.country ?? '').toString().trim();
  const category = (l.category ?? l.niche ?? '').toString().trim();
  const notes = (l.notes ?? l.summary ?? '').toString();

  const confidenceRaw = l.confidence ?? l.score ?? 0;
  const confidence = Math.max(0, Math.min(100, Number(confidenceRaw) || 0));

  const contact = l.contact && typeof l.contact === 'object' ? l.contact : {};
  const email = (contact.email ?? l.email ?? '').toString().trim();
  const phone = (contact.phone ?? l.phone ?? '').toString().trim();
  const name = (contact.name ?? '').toString().trim();

  return {
    id: (l.id ?? uid()).toString(),
    businessName,
    website,
    city,
    country,
    category,
    confidence,
    notes,
    contact: { email, phone, name },
  } as Lead;
};

const jsonOnlyGuard = (raw: string) =>
  `Return ONLY valid JSON. Do not include markdown. Do not include backticks.\n\n${raw}`;

/* =========================
   Core generation exports
   (LEGACY signatures preserved)
========================= */

export const loggedGenerateContent = async (
  scope: string,
  prompt: string,
  systemInstruction?: string,
  modelOverride?: string
): Promise<string> => {
  pushLog(scope, 'LLM_REQUEST', { modelOverride });
  const t0 = Date.now();
  try {
    const out = await openRouterChat(prompt, systemInstruction || DEFAULT_SYSTEM_INSTRUCTION, modelOverride);
    pushLog(scope, 'LLM_OK', { ms: Date.now() - t0, chars: out?.length || 0 });
    return out;
  } catch (e: any) {
    pushLog(scope, 'LLM_ERR', { ms: Date.now() - t0, error: e?.message || e }, 'error');
    throw e;
  }
};

export const generateLeads = async (
  market: string,
  niche: string,
  count: number
): Promise<{ ok: boolean; leads: Lead[]; text: string; raw?: any; error?: any }> => {
  const prompt = jsonOnlyGuard(
    `Generate ${count} high-quality B2B leads in "${market}" for niche "${niche}".
Return JSON exactly in this shape:
{
  "leads": [
    {
      "businessName": "string",
      "website": "string",
      "city": "string",
      "country": "string",
      "category": "string",
      "confidence": 0-100,
      "notes": "string",
      "contact": { "email": "string", "phone": "string", "name": "string" }
    }
  ]
}`
  );

  try {
    const text = await loggedGenerateContent('generateLeads', prompt, DEFAULT_SYSTEM_INSTRUCTION);
    const raw = safeJsonParse(text);
    const leads = Array.isArray(raw?.leads) ? raw.leads : [];
    const normalized = leads.map(normalizeLead).filter(Boolean) as Lead[];
    return { ok: true, leads: normalized, text, raw };
  } catch (e: any) {
    return { ok: false, leads: [], text: '', raw: null, error: e?.message || e };
  }
};

// NEW: required by AutomatedSearch.tsx (preserves app build)
export const groundedLeadSearch = async (
  query: string,
  market: string,
  count: number = 10
): Promise<{ ok: boolean; leads: Lead[]; groundingSources: string[]; text: string; raw?: any; error?: any }> => {
  const prompt = jsonOnlyGuard(
    `You are a lead-intelligence agent.
Find ${count} real, relevant businesses matching query: "${query}" in market/theater "${market}".
Return JSON only:
{
  "leads": [
    {
      "businessName": "string",
      "website": "string",
      "city": "string",
      "country": "string",
      "category": "string",
      "confidence": 0-100,
      "notes": "string",
      "contact": { "email": "string", "phone": "string", "name": "string" }
    }
  ],
  "groundingSources": ["https://...","https://..."]
}
If you cannot verify a fact, set it to "" and reduce confidence.`
  );

  try {
    const text = await loggedGenerateContent('groundedLeadSearch', prompt, DEFAULT_SYSTEM_INSTRUCTION);
    const raw = safeJsonParse(text);
    const leads = Array.isArray(raw?.leads) ? raw.leads : [];
    const normalized = leads.map(normalizeLead).filter(Boolean) as Lead[];
    const groundingSources = Array.isArray(raw?.groundingSources)
      ? raw.groundingSources.filter((s: any) => typeof s === 'string')
      : [];
    return { ok: true, leads: normalized, groundingSources, text, raw };
  } catch (e: any) {
    return { ok: false, leads: [], groundingSources: [], text: '', raw: null, error: e?.message || e };
  }
};

export type BenchmarkReport = {
  entityName?: string;
  missionSummary?: string;
  visualStack?: any[];
  sonicStack?: any[];
  featureGap?: string;
  businessModel?: string;
  designSystem?: string;
  deepArchitecture?: string;
  sources?: any[];
};

export const fetchBenchmarkData = async (companyName: string): Promise<{ ok: boolean; report?: BenchmarkReport; text: string; raw?: any; error?: any }> => {
  const prompt = jsonOnlyGuard(
    `Benchmark "${companyName}" against top competitors.
Return JSON:
{
  "entityName": "...",
  "missionSummary": "...",
  "visualStack": [],
  "sonicStack": [],
  "featureGap": "...",
  "businessModel": "...",
  "designSystem": "...",
  "deepArchitecture": "...",
  "sources": []
}`
  );

  try {
    const text = await loggedGenerateContent('fetchBenchmarkData', prompt);
    const raw = safeJsonParse(text);
    return { ok: true, report: (raw || {}) as BenchmarkReport, text, raw };
  } catch (e: any) {
    return { ok: false, text: '', raw: null, error: e?.message || e };
  }
};

export const fetchLiveIntel = async (topic: string): Promise<{ ok: boolean; report?: BenchmarkReport; text: string; raw?: any; error?: any }> => {
  // Legacy-compatible: returns BenchmarkReport-ish object
  return fetchBenchmarkData(topic);
};

export const fetchViralPulseData = async (topic: string): Promise<string> => {
  const prompt = `Create a short viral pulse briefing for: ${topic}.`;
  return loggedGenerateContent('fetchViralPulseData', prompt);
};

export const queryRealtimeAgent = async (topic: string): Promise<string> => {
  const prompt = `Provide realtime-style intel for: ${topic}. If uncertain, say so.`;
  return loggedGenerateContent('queryRealtimeAgent', prompt);
};

export const analyzeLedger = async (ledgerText?: string): Promise<string> => {
  const prompt = `Analyze this ledger and provide risk + opportunity:\n${ledgerText || ''}`;
  return loggedGenerateContent('analyzeLedger', prompt);
};

export const synthesizeArticle = async (urlOrText: string): Promise<string> => {
  const prompt = `Synthesize the key insights, angles, and content opportunities from:\n${urlOrText}`;
  return loggedGenerateContent('synthesizeArticle', prompt);
};

export const performFactCheck = async (claim: string, context?: string): Promise<string> => {
  const prompt = `Fact-check this claim:\n${claim}\n\nContext:\n${context || ''}\nReturn a concise verdict and reasoning.`;
  return loggedGenerateContent('performFactCheck', prompt);
};

export const translateTactical = async (text: string, targetLang: string = 'en'): Promise<string> => {
  const prompt = `Translate to ${targetLang}:\n${text}`;
  return loggedGenerateContent('translateTactical', prompt);
};

export const enhanceStrategicPrompt = async (prompt: string): Promise<string> => {
  const p = `Rewrite this prompt to be clearer, more specific, and results-driven:\n${prompt}`;
  return loggedGenerateContent('enhanceStrategicPrompt', p);
};

export const generateFlashSparks = async (leadOrTopic: any): Promise<string[]> => {
  const prompt = jsonOnlyGuard(
    `Generate 12 punchy content spark ideas based on:\n${JSON.stringify(leadOrTopic)}\nReturn JSON: { "sparks": ["..."] }`
  );
  const text = await loggedGenerateContent('generateFlashSparks', prompt);
  const raw = safeJsonParse(text);
  const sparks = Array.isArray(raw?.sparks) ? raw.sparks : [];
  return sparks.map((s: any) => (s ?? '').toString()).filter(Boolean);
};

export const generateProposalDraft = async (lead: any, offer?: any): Promise<string> => {
  const prompt = `Write a persuasive proposal draft for this lead:\n${JSON.stringify(lead)}\nOffer:\n${JSON.stringify(offer || {})}`;
  return loggedGenerateContent('generateProposalDraft', prompt);
};

export const generateOutreachSequence = async (lead: any, tone?: string): Promise<any[]> => {
  const prompt = jsonOnlyGuard(
    `Create a multi-step outreach sequence (email + linkedin) for:\n${JSON.stringify(lead)}\nTone: ${tone || 'professional'}\nReturn JSON: { "steps": [ { "channel": "email|linkedin", "subject": "...", "body": "..." } ] }`
  );
  const text = await loggedGenerateContent('generateOutreachSequence', prompt);
  const raw = safeJsonParse(text);
  const steps = Array.isArray(raw?.steps) ? raw.steps : [];
  return steps;
};

export const generateNurtureDialogue = async (lead: any, goal?: string): Promise<any[]> => {
  const prompt = jsonOnlyGuard(
    `Generate a nurture dialogue script for:\n${JSON.stringify(lead)}\nGoal: ${goal || 'book a call'}\nReturn JSON: { "turns": [ { "speaker": "agent|prospect", "text": "..." } ] }`
  );
  const text = await loggedGenerateContent('generateNurtureDialogue', prompt);
  const raw = safeJsonParse(text);
  return Array.isArray(raw?.turns) ? raw.turns : [];
};

export const generateROIReport = async (lead: any, inputs?: any): Promise<string> => {
  const prompt = `Generate an ROI narrative + assumptions for:\n${JSON.stringify(lead)}\nInputs:\n${JSON.stringify(inputs || {})}`;
  return loggedGenerateContent('generateROIReport', prompt);
};

export const architectFunnel = async (lead: any): Promise<string> => {
  const prompt = `Design a funnel map for:\n${JSON.stringify(lead)}\nInclude stages, offers, messages, and KPIs.`;
  return loggedGenerateContent('architectFunnel', prompt);
};

export const architectPitchDeck = async (lead: any): Promise<string> => {
  const prompt = `Create a pitch deck outline for:\n${JSON.stringify(lead)}\nProvide slide-by-slide bullets.`;
  return loggedGenerateContent('architectPitchDeck', prompt);
};

export const generatePitch = async (lead: any): Promise<string> => {
  const prompt = `Write an elevator pitch + close for:\n${JSON.stringify(lead)}`;
  return loggedGenerateContent('generatePitch', prompt);
};

export const generateTaskMatrix = async (lead: any, horizonDays: number = 30): Promise<any[]> => {
  const prompt = jsonOnlyGuard(
    `Create a task matrix for the next ${horizonDays} days for:\n${JSON.stringify(lead)}\nReturn JSON: { "tasks": [ { "title":"...", "owner":"...", "due":"YYYY-MM-DD", "impact":"low|med|high" } ] }`
  );
  const text = await loggedGenerateContent('generateTaskMatrix', prompt);
  const raw = safeJsonParse(text);
  return Array.isArray(raw?.tasks) ? raw.tasks : [];
};

export const simulateSandbox = async (scenario: any): Promise<string> => {
  const prompt = `Simulate a sandbox scenario:\n${JSON.stringify(scenario)}\nReturn a clear step-by-step outcome.`;
  return loggedGenerateContent('simulateSandbox', prompt);
};

export const extractBrandDNA = async (lead: any): Promise<any> => {
  const prompt = jsonOnlyGuard(
    `Extract brand DNA for:\n${JSON.stringify(lead)}\nReturn JSON with keys: colors, fontPairing, archetype, visualTone.`
  );
  const text = await loggedGenerateContent('extractBrandDNA', prompt);
  return safeJsonParse(text) || {};
};

export const generateAgencyIdentity = async (lead: any, style?: string): Promise<string> => {
  const prompt = `Generate an agency identity system for:\n${JSON.stringify(lead)}\nStyle: ${style || 'premium'}\nProvide brand voice + messaging pillars.`;
  return loggedGenerateContent('generateAgencyIdentity', prompt);
};

/* =========================
   Visual / Video (legacy)
   (kept minimal but real)
========================= */

export type VeoConfig = {
  prompt: string;
  durationSeconds?: number;
  resolution?: string;
  fps?: number;
  // Keep legacy flexible
  [k: string]: any;
};

export const analyzeVisual = async (imageUrl: string): Promise<string> => {
  const prompt = `Analyze this visual for marketing insights:\n${imageUrl}`;
  return loggedGenerateContent('analyzeVisual', prompt);
};

export const generateVisual = async (prompt: string): Promise<string> => {
  // This returns a text description (legacy UI expects a string URL sometimes; caller may pass to image generator service)
  const p = `Generate a detailed image prompt for:\n${prompt}\nReturn ONLY the prompt text.`;
  return loggedGenerateContent('generateVisual', p);
};

export const generateMockup = async (lead: any, concept?: string): Promise<string> => {
  const prompt = `Create a 4K mockup concept prompt for:\n${JSON.stringify(lead)}\nConcept:\n${concept || ''}\nReturn prompt text only.`;
  return loggedGenerateContent('generateMockup', prompt);
};

export const generateVideoPayload = async (lead: any, config?: VeoConfig): Promise<string> => {
  const prompt = jsonOnlyGuard(
    `Create a video generation payload for:\n${JSON.stringify(lead)}\nConfig:\n${JSON.stringify(config || {})}\nReturn JSON: { "prompt":"...", "durationSeconds":15, "resolution":"1080p" }`
  );
  return loggedGenerateContent('generateVideoPayload', prompt);
};

export const enhanceVideoPrompt = async (prompt: string): Promise<string> => {
  const p = `Improve this video prompt for clarity, cinematic detail, and brand alignment:\n${prompt}`;
  return loggedGenerateContent('enhanceVideoPrompt', p);
};

export const analyzeVideoUrl = async (url: string): Promise<string> => {
  const p = `Critique this video URL content for marketing performance:\n${url}`;
  return loggedGenerateContent('analyzeVideoUrl', p);
};

export const critiqueVideoPresence = async (lead: any): Promise<string> => {
  const p = `Critique video presence and on-camera strategy for:\n${JSON.stringify(lead)}`;
  return loggedGenerateContent('critiqueVideoPresence', p);
};

export const generateMotionLabConcept = async (lead: any): Promise<string> => {
  const p = `Generate motion lab concept ideas for:\n${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateMotionLabConcept', p);
};

/* =========================
   Business orchestration
========================= */

export const orchestrateBusinessPackage = async (lead: any): Promise<any> => {
  const prompt = jsonOnlyGuard(
    `Orchestrate a complete business marketing package for:\n${JSON.stringify(lead)}\nReturn JSON: { "strategy": "...", "narrative": "...", "content": "...", "funnel": "...", "outreach": "...", "visuals": "..." }`
  );
  const text = await loggedGenerateContent('orchestrateBusinessPackage', prompt);
  return safeJsonParse(text) || {};
};

/* =========================
   KIE/Suno (legacy placeholder-free shape)
   NOTE: actual KIE API calls live in kieSunoService; this keeps expected exports.
========================= */

export const generateAudioPitch = async (lead: any): Promise<string> => {
  const prompt = `Write a short voiceover script + sonic direction for:\n${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateAudioPitch', prompt);
};
