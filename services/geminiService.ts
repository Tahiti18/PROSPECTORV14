import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';

/**
 * LOCKED ARCHITECTURE (DO NOT BREAK):
 * - Browser NEVER talks to OpenRouter directly
 * - Browser ONLY calls backend proxy: POST /api/openrouter/chat
 * - Backend attaches Authorization: Bearer OPENROUTER_API_KEY
 *
 * No Google Gemini SDK
 * No @google/genai
 * No Gemini API keys
 */

// ================== CONSTANTS ==================
export const OPENROUTER_PROXY_PATH = '/api/openrouter/chat';
export const PRIMARY_MODEL = 'google/gemini-2.0-flash-001';

export const SYSTEM_INSTRUCTION = `
You are Prospector OS.
Return concise, production-ready output.
If JSON is requested, return STRICT JSON only.
Never include markdown.
`.trim();

// ================== TYPES ==================
export interface AssetRecord {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  title: string;
  data: string;
  module?: string;
  leadId?: string;
  timestamp: number;
  metadata?: any;
}

export interface BenchmarkReport {
  entityName: string;
  missionSummary: string;
  visualStack: Array<{ label: string; description: string }>;
  sonicStack: Array<{ label: string; description: string }>;
  featureGap: string;
  businessModel: string;
  designSystem: string;
  deepArchitecture: string;
  sources: Array<{ title: string; uri: string }>;
}

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  modelStr?: string;
}

export interface LoggedGenerateParams {
  module: string;
  model?: string;
  contents: any;
}

// ================== STATE ==================
export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];
const assetListeners = new Set<(a: AssetRecord[]) => void>();

const uuid = () => Math.random().toString(36).slice(2);

export const pushLog = (msg: string) => {
  PRODUCTION_LOGS.unshift(`[${new Date().toISOString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 300) PRODUCTION_LOGS.pop();
};

export const subscribeToAssets = (fn: (a: AssetRecord[]) => void) => {
  assetListeners.add(fn);
  fn([...SESSION_ASSETS]);
  return () => assetListeners.delete(fn);
};

export const saveAsset = (
  type: AssetRecord['type'],
  title: string,
  data: string,
  module?: string,
  leadId?: string,
  metadata?: any
) => {
  const rec: AssetRecord = {
    id: uuid(),
    type,
    title,
    data,
    module,
    leadId,
    timestamp: Date.now(),
    metadata
  };
  SESSION_ASSETS.unshift(rec);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return rec;
};

export const deleteAsset = (id: string) => {
  const i = SESSION_ASSETS.findIndex(a => a.id === id);
  if (i !== -1) {
    SESSION_ASSETS.splice(i, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
};

export const clearVault = () => {
  SESSION_ASSETS.length = 0;
  assetListeners.forEach(l => l([]));
};

export const importVault = (assets: AssetRecord[]) => {
  SESSION_ASSETS.length = 0;
  SESSION_ASSETS.push(...assets);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
};

// ================== HELPERS ==================
const extractJson = (txt: string) => {
  if (!txt) return '';
  const clean = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
  const o1 = clean.indexOf('{');
  const o2 = clean.lastIndexOf('}');
  const a1 = clean.indexOf('[');
  const a2 = clean.lastIndexOf(']');
  if (o1 !== -1 && o2 > o1) return clean.slice(o1, o2 + 1);
  if (a1 !== -1 && a2 > a1) return clean.slice(a1, a2 + 1);
  return clean;
};

const safeParse = <T>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

// ================== OPENROUTER ==================
export const openRouterChat = async (
  prompt: string,
  system = SYSTEM_INSTRUCTION,
  model = PRIMARY_MODEL
): Promise<string> => {
  const res = await fetch(OPENROUTER_PROXY_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction: system, model })
  });

  const raw = await res.text();

  if (!res.ok) {
    pushLog(`OPENROUTER_ERROR ${res.status}: ${raw}`);
    throw new Error(raw);
  }

  const parsed = safeParse<any>(raw, null);
  return parsed?.choices?.[0]?.message?.content ?? parsed?.text ?? raw;
};

export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const raw = await openRouterChat(prompt, system);
  return extractJson(raw);
};

export const loggedGenerateContent = async (p: LoggedGenerateParams) => {
  const body =
    typeof p.contents === 'string' ? p.contents : JSON.stringify(p.contents ?? {});
  const text = await openRouterChat(body, SYSTEM_INSTRUCTION, p.model);
  deductCost(p.model || PRIMARY_MODEL, body.length + text.length);
  return text;
};

// ================== CORE FUNCTIONS ==================
export const generateLeads = async (region: string, niche: string, count: number) => {
  const json = await executeIntelligenceTask(
    `Find ${count} B2B leads in ${region} for ${niche}. Return JSON { leads:[...] }`
  );
  const parsed = safeParse<any>(json, { leads: [] });
  return { leads: parsed.leads, groundingSources: [] };
};

export const generateOutreachSequence = async (lead: Lead) =>
  safeParse(await executeIntelligenceTask(
    `Create 5-day outreach for ${lead.businessName}. Return JSON array.`
  ), []);

export const generateProposalDraft = async (lead: Lead) =>
  executeIntelligenceTask(`Write proposal for ${lead.businessName}.`);

export const generatePitch = async (lead: Lead) =>
  executeIntelligenceTask(`30s pitch for ${lead.businessName}.`);

export const generateNurtureDialogue = async (lead: Lead, scenario: string) =>
  safeParse(await executeIntelligenceTask(
    `Nurture dialogue for ${lead.businessName} in ${scenario}. Return JSON.`
  ), []);

export const generateAffiliateProgram = async (niche: string) =>
  safeParse(await executeIntelligenceTask(
    `Affiliate program for ${niche}. Return JSON.`
  ), {});

export const generateTaskMatrix = async (lead: Lead) =>
  safeParse(await executeIntelligenceTask(
    `Task checklist for ${lead.businessName}. Return JSON.`
  ), []);

export const generateROIReport = async (ltv: number, leads: number, conv: number) =>
  executeIntelligenceTask(`ROI report LTV ${ltv} Leads ${leads} Conv ${conv}.`);

export const generatePlaybookStrategy = async (niche: string) =>
  safeParse(await executeIntelligenceTask(
    `Playbook strategy for ${niche}. Return JSON.`
  ), {});

export const analyzeLedger = async (leads: Lead[]) =>
  safeParse(await executeIntelligenceTask(
    `Analyze ${leads.length} leads. Return JSON.`
  ), {});

export const identifySubRegions = async (theater: string) =>
  safeParse(await executeIntelligenceTask(
    `Subregions of ${theater}. Return JSON array.`
  ), []);

export const crawlTheaterSignals = async (sector: string, signal: string) =>
  safeParse(await executeIntelligenceTask(
    `Signals ${signal} in ${sector}. Return JSON.`
  ), { leads: [] }).leads;

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> =>
  safeParse(await executeIntelligenceTask(
    `Benchmark ${lead.websiteUrl} module ${module}. Return JSON.`
  ), {} as BenchmarkReport);

export const fetchBenchmarkData = async (lead: Lead) =>
  fetchLiveIntel(lead, 'benchmark');

// ================== STUBS (INTENTIONAL) ==================
export const getAI = () => null;
export const generateVisual = async () => null;
export const generateMockup = async () => null;
export const generateVideoPayload = async () => null;
export const generateAudioPitch = async () => null;
export const analyzeVisual = async () => '';
export const enhanceVideoPrompt = async (p: string) => executeIntelligenceTask(p);
export const analyzeVideoUrl = async (u: string, p: string) => executeIntelligenceTask(p);

// ================== BRAND ==================
export const extractBrandDNA = async (
  _lead: Partial<Lead>,
  websiteUrl: string
): Promise<BrandIdentity> =>
  safeParse(await executeIntelligenceTask(
    `Extract brand DNA from ${websiteUrl}. Return JSON.`
  ), {} as BrandIdentity);
