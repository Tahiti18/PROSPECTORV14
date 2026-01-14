/* eslint-disable @typescript-eslint/no-explicit-any */
import { Lead } from '../types';

// -------------------- Models / Defaults --------------------

export const PRIMARY_MODEL = 'google/gemini-2.0-flash-001';
export const VISION_MODEL = 'google/gemini-2.0-flash-001';

export const SYSTEM_INSTRUCTION = `
You are Prospector OS. You produce structured, high-signal outputs for marketing and business intelligence.
Be concise, actionable, and avoid fluff.
`;

// -------------------- Logging --------------------

export type ProductionLog = {
  ts: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  meta?: any;
};

const LOG_KEY = 'prospector_production_logs_v1';

export const PRODUCTION_LOGS = {
  read(): ProductionLog[] {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  write(logs: ProductionLog[]) {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-500)));
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      localStorage.removeItem(LOG_KEY);
    } catch {
      // ignore
    }
  }
};

export function pushLog(message: string, level: ProductionLog['level'] = 'INFO', meta?: any) {
  const logs = PRODUCTION_LOGS.read();
  logs.push({ ts: Date.now(), level, message, meta });
  PRODUCTION_LOGS.write(logs);
}

// -------------------- Key Storage --------------------

export type StoredKeys = {
  openRouter?: string;
  kie?: string;
};

const KEYS_STORAGE = 'prospector_os_keys_v1';

export function getStoredKeys(): StoredKeys {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed || {};
  } catch {
    return {};
  }
}

export function setStoredKeys(keys: StoredKeys) {
  try {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys || {}));
  } catch {
    // ignore
  }
}

// -------------------- Assets Vault (LocalStorage) --------------------

export type AssetRecord = {
  id: string;
  ts: number;
  kind: 'text' | 'image' | 'video' | 'audio' | 'file';
  title?: string;
  leadId?: string | null;
  data: any;
};

const ASSET_KEY = 'prospector_session_assets_v1';

export const SESSION_ASSETS = {
  read(): AssetRecord[] {
    try {
      const raw = localStorage.getItem(ASSET_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  write(items: AssetRecord[]) {
    try {
      localStorage.setItem(ASSET_KEY, JSON.stringify(items.slice(-2000)));
    } catch {
      // ignore
    }
  }
};

type AssetSubscriber = (assets: AssetRecord[]) => void;
const assetSubs = new Set<AssetSubscriber>();

function notifyAssets() {
  const assets = SESSION_ASSETS.read();
  assetSubs.forEach((fn) => fn(assets));
}

export function subscribeToAssets(fn: AssetSubscriber) {
  assetSubs.add(fn);
  fn(SESSION_ASSETS.read());
  return () => assetSubs.delete(fn);
}

export async function saveAsset(asset: Omit<AssetRecord, 'id' | 'ts'> & { id?: string; ts?: number }) {
  const current = SESSION_ASSETS.read();
  const id = asset.id || `asset_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  const rec: AssetRecord = {
    id,
    ts: asset.ts || Date.now(),
    kind: asset.kind,
    title: asset.title,
    leadId: asset.leadId ?? null,
    data: asset.data
  };
  current.unshift(rec);
  SESSION_ASSETS.write(current);
  notifyAssets();
  return rec;
}

export async function deleteAsset(id: string) {
  const current = SESSION_ASSETS.read().filter((a) => a.id !== id);
  SESSION_ASSETS.write(current);
  notifyAssets();
  return true;
}

export async function clearVault() {
  SESSION_ASSETS.write([]);
  notifyAssets();
  return true;
}

export async function importVault(items: AssetRecord[]) {
  const current = SESSION_ASSETS.read();
  const merged = [...(items || []), ...current];
  SESSION_ASSETS.write(merged);
  notifyAssets();
  return true;
}

// -------------------- Core Chat (OpenRouter) --------------------

// IMPORTANT: Do not remove exports; many UI modules import these names.

export const openRouterChat = async (
  prompt: string,
  system: string = SYSTEM_INSTRUCTION,
  model: string = PRIMARY_MODEL
): Promise<string> => {
  const keys = getStoredKeys();
  const cleanPrompt = (prompt ?? '').toString();

  // Guard: do not send empty prompts (OpenRouter will often hard-fail these requests)
  if (!cleanPrompt.trim()) {
    pushLog('openRouterChat called with empty prompt; returning empty string.');
    return '';
  }

  const messages = [
    { role: 'system', content: system || SYSTEM_INSTRUCTION },
    { role: 'user', content: cleanPrompt }
  ];

  const res = await fetch('/api/openrouter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-openrouter-key': keys.openRouter || '' },
    body: JSON.stringify({
      model,
      // New format (preferred by most proxy implementations)
      messages,
      // Legacy fields (kept for backward compatibility with older proxies)
      prompt: cleanPrompt,
      systemInstruction: system || SYSTEM_INSTRUCTION
    })
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message || json.text || 'OpenRouter failed');
  return json.text;
};

// -------------------- Helper: Safe JSON parse --------------------

function safeJsonParse<T = any>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

function stripCodeFences(text: string) {
  return (text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

// -------------------- Logged generation wrapper --------------------

export async function loggedGenerateContent(taskName: string, prompt: string, system?: string) {
  try {
    pushLog(`TASK_START: ${taskName}`, 'INFO');
    const text = await openRouterChat(prompt, system || SYSTEM_INSTRUCTION, PRIMARY_MODEL);
    pushLog(`TASK_OK: ${taskName}`, 'INFO', { chars: text.length });
    return { ok: true, text, raw: text } as const;
  } catch (e: any) {
    pushLog(`TASK_FAIL: ${taskName}`, 'ERROR', { message: e?.message || String(e) });
    return { ok: false, text: '', raw: null, error: { message: e?.message || String(e) } } as const;
  }
}

// -------------------- Domain Functions (expected exports) --------------------

export async function generateLeads(market: string): Promise<{ ok: boolean; leads: Lead[]; text: string; raw?: any; error?: any }> {
  const prompt = `
Generate 8 high-intent B2B leads for this market: ${market}
Return JSON: { "leads": [ { "businessName": "...", "domain": "...", "category": "...", "city": "...", "notes": "..."} ] }
No markdown.`;
  const r = await loggedGenerateContent('generateLeads', prompt);
  if (!r.ok) return { ok: false, leads: [], text: r.text, raw: r.raw, error: r.error };

  const parsed = safeJsonParse<any>(stripCodeFences(r.text), {});
  const leads = Array.isArray(parsed?.leads) ? parsed.leads : [];

  const normalized: Lead[] = leads.map((l: any, idx: number) => ({
    id: l.id || `lead_${Date.now()}_${idx}`,
    businessName: String(l.businessName || l.name || 'Unknown').trim(),
    domain: String(l.domain || '').trim(),
    category: String(l.category || '').trim(),
    city: String(l.city || '').trim(),
    notes: String(l.notes || '').trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    outreachStatus: 'NEW'
  })) as any;

  return { ok: true, leads: normalized, text: r.text, raw: parsed };
}

export async function generateOutreachSequence(lead: any) {
  const prompt = `
Create a 7-step outreach sequence for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "steps": [ { "channel":"email|linkedin|call", "day":1, "subject":"", "message":"" } ] }`;
  return loggedGenerateContent('generateOutreachSequence', prompt);
}

export async function generateProposalDraft(lead: any) {
  const prompt = `
Draft a concise proposal for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return plain text. No markdown.`;
  return loggedGenerateContent('generateProposalDraft', prompt);
}

export async function generateNurtureDialogue(lead: any) {
  const prompt = `
Create a nurture dialogue script (Q&A) for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "dialogue": [ { "role":"agent|lead", "text":"" } ] }`;
  return loggedGenerateContent('generateNurtureDialogue', prompt);
}

export async function generateAffiliateProgram() {
  const prompt = `
Design an affiliate program (tiers, payouts, rules, fraud checks).
Return JSON with keys: tiers, payouts, rules, tracking, messaging.`;
  return loggedGenerateContent('generateAffiliateProgram', prompt);
}

export async function analyzeLedger() {
  const prompt = `
Analyze the current system ledger from production logs and assets metadata.
Return JSON: { "summary":"", "alerts":[...], "recommendations":[...] }`;
  return loggedGenerateContent('analyzeLedger', prompt);
}

export async function synthesizeArticle(urlOrText: string) {
  const prompt = `
Synthesize this article into a strategic brief:
${urlOrText}
Return JSON: { "headline":"", "thesis":"", "keyPoints":[...], "actions":[...] }`;
  return loggedGenerateContent('synthesizeArticle', prompt);
}

export async function crawlTheaterSignals(theater: string) {
  const prompt = `
For this market/theater: ${theater}
List top signals (industry shifts, demand, competitors).
Return JSON { "signals":[...] }`;
  return loggedGenerateContent('crawlTheaterSignals', prompt);
}

export async function identifySubRegions(theater: string) {
  const prompt = `
Given theater: ${theater}
Return JSON { "subRegions":[ "..." ] }`;
  return loggedGenerateContent('identifySubRegions', prompt);
}

// -------------------- Benchmark --------------------

export type BenchmarkReport = {
  model: string;
  score: number;
  notes: string;
  items?: any[];
};

export async function fetchBenchmarkData(): Promise<{ ok: boolean; report?: BenchmarkReport; text: string; raw?: any; error?: any }> {
  const prompt = `
Create a benchmark report for the current model usage quality.
Return JSON: { "model":"", "score":0-100, "notes":"", "items":[...] }`;
  const r = await loggedGenerateContent('fetchBenchmarkData', prompt);
  if (!r.ok) return { ok: false, text: r.text, raw: r.raw, error: r.error };
  const parsed = safeJsonParse<BenchmarkReport>(stripCodeFences(r.text), { model: PRIMARY_MODEL, score: 0, notes: '' });
  return { ok: true, report: parsed, text: r.text, raw: parsed };
}

// -------------------- Brand / Visual / Video --------------------

export async function extractBrandDNA(lead: any) {
  const prompt = `
Extract brand DNA for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON with keys: positioning, voice, archetype, keywords, offers, objections.`;
  return loggedGenerateContent('extractBrandDNA', prompt);
}

export async function generateFlashSparks(lead: any) {
  const prompt = `
Generate 20 content sparks for this lead (hooks + angles).
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "sparks":[ { "hook":"", "angle":"", "channel":"", "cta":"" } ] }`;
  return loggedGenerateContent('generateFlashSparks', prompt);
}

export async function generateVisual(prompt: string) {
  const r = await loggedGenerateContent('generateVisual', `Create an image prompt + composition notes for: ${prompt}
Return JSON: { "prompt":"", "style":"", "composition":"", "negative":"", "size": "1024x1024" }`);
  return r;
}

export type VeoConfig = {
  aspect?: string;
  seconds?: number;
  style?: string;
};

export async function generateVideoPayload(lead: any, config?: VeoConfig) {
  const prompt = `
Create a video generation payload for Veo-like tools.
Lead JSON: ${JSON.stringify(lead)}
Config: ${JSON.stringify(config || {})}
Return JSON: { "prompt":"", "negative":"", "shotlist":[...], "style":"", "durationSeconds":0, "aspect":"" }`;
  return loggedGenerateContent('generateVideoPayload', prompt);
}

export async function analyzeVideoUrl(url: string) {
  const prompt = `
Analyze this video URL for messaging, hook quality, and improvement plan:
${url}
Return JSON: { "summary":"", "strengths":[...], "weaknesses":[...], "fixes":[...] }`;
  return loggedGenerateContent('analyzeVideoUrl', prompt);
}

export async function enhanceStrategicPrompt(promptText: string) {
  const prompt = `
Rewrite this prompt into a stronger strategic prompt, preserving intent:
${promptText}
Return plain text. No markdown.`;
  return loggedGenerateContent('enhanceStrategicPrompt', prompt);
}

export async function analyzeVisual(promptOrUrl: string) {
  const prompt = `
Analyze a visual concept or URL:
${promptOrUrl}
Return JSON: { "composition":"", "palette":"", "typography":"", "improvements":[...] }`;
  return loggedGenerateContent('analyzeVisual', prompt);
}

export async function generateMockup(lead: any) {
  const prompt = `
Generate a 4K mockup specification for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "mockups":[ { "title":"", "description":"", "prompt":"" } ] }`;
  return loggedGenerateContent('generateMockup', prompt);
}

export async function generateMotionLabConcept(lead: any) {
  const prompt = `
Generate motion concepts for this lead (ads + reels).
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "concepts":[ { "title":"", "beats":[...], "prompt":"" } ] }`;
  return loggedGenerateContent('generateMotionLabConcept', prompt);
}

export async function critiqueVideoPresence(lead: any) {
  const prompt = `
Critique video presence for this lead's brand and recommend improvements.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "score":0-100, "diagnosis":[...], "actions":[...] }`;
  return loggedGenerateContent('critiqueVideoPresence', prompt);
}

export async function enhanceVideoPrompt(promptText: string) {
  const prompt = `
Improve this video prompt to be more cinematic and specific:
${promptText}
Return plain text. No markdown.`;
  return loggedGenerateContent('enhanceVideoPrompt', prompt);
}

// -------------------- Sales / Funnel / Pitch / ROI / Tasks --------------------

export async function architectFunnel(lead: any) {
  const prompt = `
Architect a funnel for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "stages":[ { "name":"", "goal":"", "assets":[...] } ] }`;
  return loggedGenerateContent('architectFunnel', prompt);
}

export async function architectPitchDeck(lead: any) {
  const prompt = `
Architect a pitch deck outline for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "slides":[ { "title":"", "bullets":[...], "visual":"", "speakerNotes":"" } ] }`;
  return loggedGenerateContent('architectPitchDeck', prompt);
}

export async function generatePitch(lead: any) {
  const prompt = `
Generate a pitch for this lead (short + medium).
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "elevator":"", "onePager":"", "objections":[...], "rebuttals":[...] }`;
  return loggedGenerateContent('generatePitch', prompt);
}

export async function generateROIReport(lead: any) {
  const prompt = `
Create an ROI report for this lead with assumptions.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "assumptions":{...}, "roiSummary":"", "table":[...], "nextSteps":[...] }`;
  return loggedGenerateContent('generateROIReport', prompt);
}

export async function generateTaskMatrix(lead: any) {
  const prompt = `
Generate a task matrix for executing a campaign for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "tasks":[ { "area":"", "task":"", "owner":"", "etaDays":0 } ] }`;
  return loggedGenerateContent('generateTaskMatrix', prompt);
}

export async function generatePlaybookStrategy(lead: any) {
  const prompt = `
Generate a sales playbook strategy for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "positioning":"", "sequence":[...], "scripts":{...}, "offers":[...] }`;
  return loggedGenerateContent('generatePlaybookStrategy', prompt);
}

export async function translateTactical(text: string, targetLang: string = 'en') {
  const prompt = `
Translate this text to ${targetLang}, preserving tone and meaning:
${text}
Return plain text.`;
  return loggedGenerateContent('translateTactical', prompt);
}

export async function fetchTokenStats() {
  const prompt = `
Summarize token usage behavior and recommendations from recent logs.
Return JSON: { "summary":"", "recommendations":[...] }`;
  return loggedGenerateContent('fetchTokenStats', prompt);
}

// -------------------- Orchestration --------------------

export async function orchestrateBusinessPackage(lead: any) {
  const prompt = `
Orchestrate a full business package for this lead: strategy, narrative, content, funnel, outreach, visuals.
Lead JSON: ${JSON.stringify(lead)}
Return JSON with keys: strategy, narrative, content, funnel, outreach, visuals.`;
  return loggedGenerateContent('orchestrateBusinessPackage', prompt);
}

export async function simulateSandbox(lead: any) {
  const prompt = `
Simulate a sandbox conversation flow for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "steps":[...], "notes":[...] }`;
  return loggedGenerateContent('simulateSandbox', prompt);
}

export async function performFactCheck(text: string) {
  const prompt = `
Fact-check the following content. Flag claims needing sources and likely errors:
${text}
Return JSON: { "risk":"low|med|high", "issues":[...], "fixes":[...] }`;
  return loggedGenerateContent('performFactCheck', prompt);
}

export async function fetchLiveIntel(lead: any) {
  const prompt = `
Generate live intel hypotheses for this lead (no browsing). Use best-effort reasoning.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "intel":[ { "topic":"", "summary":"", "actions":[...] } ] }`;
  return loggedGenerateContent('fetchLiveIntel', prompt);
}

export async function queryRealtimeAgent(query: string) {
  const prompt = `
Answer this realtime-like query using best-effort reasoning without browsing:
${query}
Return JSON: { "answer":"", "caveats":[...], "nextSteps":[...] }`;
  return loggedGenerateContent('queryRealtimeAgent', prompt);
}

export async function fetchViralPulseData(lead: any) {
  const prompt = `
Generate viral pulse insights for this lead's niche (no browsing).
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "angles":[...], "hooks":[...], "formats":[...] }`;
  return loggedGenerateContent('fetchViralPulseData', prompt);
}

export async function generateAgencyIdentity() {
  const prompt = `
Generate an agency identity package for Prospector OS.
Return JSON: { "name":"", "tagline":"", "positioning":"", "values":[...], "voice":"", "offers":[...] }`;
  return loggedGenerateContent('generateAgencyIdentity', prompt);
}

export async function generateAudioPitch(lead: any) {
  const prompt = `
Generate an audio ad script and music direction for this lead.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: { "script":"", "musicDirection":"", "sfx":[...], "timing":[...] }`;
  return loggedGenerateContent('generateAudioPitch', prompt);
}
