import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';

/**
 * LOCKED RULES:
 * - Browser NEVER calls OpenRouter directly.
 * - Browser calls backend proxy: POST /api/openrouter/chat
 * - Backend attaches: Authorization: Bearer $OPENROUTER_API_KEY
 *
 * No Google Gemini SDK.
 * No @google/genai.
 * No Google API keys.
 */

// ================== OPENROUTER HARD-LOCK ==================
export const OPENROUTER_PROXY_PATH = '/api/openrouter/chat';
export const PRIMARY_MODEL = 'google/gemini-2.0-flash-001';

export const SYSTEM_INSTRUCTION = `
You are Prospector OS.
Return concise, production-usable output.
If JSON is requested, return STRICT valid JSON only (no markdown).
If plain text is requested, return plain text only.
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
  modelClass?: 'FLASH' | 'PRO';
  reasoningDepth?: 'LOW' | 'MEDIUM' | 'HIGH';
  isClientFacing?: boolean;
  contents: any;
  config?: any; // IMPORTANT: required by BrandDNA + automation/steps.ts
}

// ================== STATE ==================
export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];
const assetListeners = new Set<(assets: AssetRecord[]) => void>();

const uuidLike = () => Math.random().toString(36).substring(2, 15);

// ================== LOGGING ==================
export const pushLog = (msg: string) => {
  PRODUCTION_LOGS.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 300) PRODUCTION_LOGS.pop();
};

// ================== ASSET VAULT ==================
export const subscribeToAssets = (listener: (assets: AssetRecord[]) => void) => {
  assetListeners.add(listener);
  listener(SESSION_ASSETS);

  // IMPORTANT: return a cleanup function that returns void (NOT boolean)
  return () => {
    assetListeners.delete(listener);
  };
};

export const saveAsset = (
  type: AssetRecord['type'],
  title: string,
  data: string,
  module?: string,
  leadId?: string,
  metadata?: any
) => {
  const asset: AssetRecord = {
    id: uuidLike(),
    type,
    title,
    data,
    module,
    leadId,
    timestamp: Date.now(),
    metadata
  };

  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach((l) => l([...SESSION_ASSETS]));
  return asset;
};

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex((a) => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach((l) => l([...SESSION_ASSETS]));
  }
};

export const clearVault = () => {
  SESSION_ASSETS.length = 0;
  assetListeners.forEach((l) => l([]));
};

export const importVault = (assets: AssetRecord[]) => {
  SESSION_ASSETS.length = 0;
  SESSION_ASSETS.push(...assets);
  assetListeners.forEach((l) => l([...SESSION_ASSETS]));
  return SESSION_ASSETS.length;
};

// ================== HELPERS ==================
const extractJson = (text: string) => {
  if (!text) return '';
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');

  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart) && objEnd > objStart) {
    return cleaned.substring(objStart, objEnd + 1);
  }
  if (arrStart !== -1 && arrEnd > arrStart) {
    return cleaned.substring(arrStart, arrEnd + 1);
  }
  return cleaned;
};

const safeJsonParse = <T = any>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

// ================== OPENROUTER PROXY CALL ==================
export const openRouterChat = async (
  prompt: string,
  system?: string,
  model: string = PRIMARY_MODEL
): Promise<string> => {
  const body = {
    prompt,
    systemInstruction: system || SYSTEM_INSTRUCTION,
    model
  };

  const res = await fetch(OPENROUTER_PROXY_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const rawText = await res.text();

  if (!res.ok) {
    pushLog(`OpenRouter Proxy Error (${res.status}): ${rawText}`);
    const statusText = res.status === 401 ? 'Unauthorized (Check Key)' : `Error ${res.status}`;
    throw new Error(`OpenRouter Error (${statusText}): ${rawText}`);
  }

  const data = safeJsonParse<any>(rawText, null);
  if (data && typeof data === 'object') {
    return data?.choices?.[0]?.message?.content ?? data?.text ?? '';
  }
  return rawText;
};

export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const raw = await openRouterChat(prompt, system);
  return extractJson(raw);
};

export const loggedGenerateContent = async (params: LoggedGenerateParams): Promise<string> => {
  const model = params.model || PRIMARY_MODEL;
  const contentStr =
    typeof params.contents === 'string' ? params.contents : JSON.stringify(params.contents ?? {});

  const started = Date.now();
  try {
    const text = await openRouterChat(contentStr, params.config?.systemInstruction || SYSTEM_INSTRUCTION, model);
    deductCost(model, contentStr.length + text.length);
    pushLog(`GEN_OK ${params.module} (${Date.now() - started}ms) model=${model}`);
    return text;
  } catch (e: any) {
    pushLog(`GENERATION_ERROR in ${params.module}: ${e?.message || String(e)}`);
    throw e;
  }
};

/**
 * Compatibility shim: some older code imports getAI().
 * We keep it to satisfy TS/build. It is intentionally non-functional.
 */
export const getAI = () => null;

// ================== CORE FEATURES ==================
export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: ${region} / ${niche} (count=${count})`);
  const prompt = `
Find ${count} high-ticket B2B leads in ${region} for ${niche}.
Return VALID JSON ONLY in this shape:
{
  "leads": [
    {
      "businessName": "",
      "websiteUrl": "",
      "city": "",
      "niche": "",
      "leadScore": 0,
      "assetGrade": "A",
      "socialGap": ""
    }
  ]
}
`.trim();

  const jsonStr = await executeIntelligenceTask(prompt);
  const parsed = safeJsonParse<any>(jsonStr, { leads: [] });
  return { leads: parsed.leads || [], groundingSources: [] };
};

export const generateOutreachSequence = async (lead: Lead) => {
  const prompt = `
Create a 5-day multi-channel outreach sequence for:
Business: ${lead.businessName}
Niche: ${lead.niche}
Website: ${lead.websiteUrl}

Return VALID JSON ONLY:
[
  { "day": 1, "channel": "Email", "content": "...", "purpose": "..." }
]
`.trim();
  const jsonStr = await executeIntelligenceTask(prompt);
  return safeJsonParse<any[]>(jsonStr, []);
};

export const generateProposalDraft = async (lead: Lead) => {
  return await executeIntelligenceTask(
    `Write a proposal draft for ${lead.businessName}. Focus on AI ROI, measurable outcomes. Return plain text.`
  );
};

export const orchestrateBusinessPackage = async (lead: Lead, _assets: any[]) => {
  const json = await executeIntelligenceTask(
    `Create a full business package for ${lead.businessName}. Return VALID JSON with outreach, offer, angles, and assets.`
  );
  return safeJsonParse<any>(json, {});
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const json = await executeIntelligenceTask(
    `Technical audit for ${lead.websiteUrl}. Focus module="${module}". Return VALID JSON BenchmarkReport.`
  );
  return safeJsonParse<BenchmarkReport>(json, {
    entityName: lead.businessName,
    missionSummary: '',
    visualStack: [],
    sonicStack: [],
    featureGap: '',
    businessModel: '',
    designSystem: '',
    deepArchitecture: '',
    sources: []
  });
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, 'benchmark');
};

export const analyzeLedger = async (leads: Lead[]) => {
  const json = await executeIntelligenceTask(
    `Analyze ${leads.length} leads. Return VALID JSON: { "risk": "", "opportunity": "" }`
  );

  // IMPORTANT: fallback matches AnalyticsHub expected shape
  return safeJsonParse<{ risk: string; opportunity: string }>(json, {
    risk: '',
    opportunity: ''
  });
};

export const synthesizeArticle = async (source: string, mode: string) => {
  return await executeIntelligenceTask(`Synthesize article into mode=${mode}: ${source}. Return plain text.`);
};

export const synthesizeProduct = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Architect AI product for ${lead.businessName}. Return VALID JSON.`);
  return safeJsonParse<any>(json, {});
};

export const generatePitch = async (lead: Lead) => {
  return await executeIntelligenceTask(`Write a 30-second pitch for ${lead.businessName}. Return plain text only.`);
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const json = await executeIntelligenceTask(
    `Generate nurture dialogue for ${lead.businessName} in scenario: ${scenario}. Return VALID JSON array.`
  );
  return safeJsonParse<any[]>(json, []);
};

export const generateAffiliateProgram = async (niche: string) => {
  const json = await executeIntelligenceTask(`Generate an affiliate program matrix for ${niche}. Return VALID JSON.`);
  return safeJsonParse<any>(json, {});
};

export const generateTaskMatrix = async (lead: Lead) => {
  const json = await executeIntelligenceTask(
    `Generate a task checklist for ${lead.businessName}. Return VALID JSON array of tasks.`
  );
  return safeJsonParse<any[]>(json, []);
};

export const generateROIReport = async (ltv: number, leads: number, conv: number) => {
  return await executeIntelligenceTask(
    `Generate an AI ROI report using: LTV=${ltv}, Leads=${leads}, ConversionLift=${conv}. Return plain text.`
  );
};

export const generatePlaybookStrategy = async (niche: string) => {
  const json = await executeIntelligenceTask(
    `Generate a high-ticket agency playbook strategy for ${niche}. Return VALID JSON: { "strategyName": "", "steps": [{ "title": "", "tactic": "" }] }`
  );
  return safeJsonParse<any>(json, {});
};

export const architectFunnel = async (lead: Lead) => {
  const json = await executeIntelligenceTask(
    `Architect a sales funnel for ${lead.businessName}. Return VALID JSON array.`
  );
  return safeJsonParse<any[]>(json, []);
};

export const architectPitchDeck = async (lead: Lead) => {
  const json = await executeIntelligenceTask(
    `Architect a 5-slide pitch deck for ${lead.businessName}. Return VALID JSON with slides.`
  );
  return safeJsonParse<any>(json, {});
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await executeIntelligenceTask(
    `Simulate business growth for ${lead.businessName}. LTV=${ltv}, Volume=${volume}. Return plain text.`
  );
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await executeIntelligenceTask(`Critique the video presence of ${lead.businessName}. Return plain text.`);
};

export const translateTactical = async (text: string, lang: string) => {
  return await executeIntelligenceTask(`Translate into ${lang} with tactical tone: ${text}. Return plain text.`);
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Create a storyboard concept for ${lead.businessName}. Return VALID JSON.`);
  return safeJsonParse<any>(json, {});
};

export const generateFlashSparks = async (lead: Lead) => {
  const json = await executeIntelligenceTask(
    `Generate 6 viral sparks for ${lead.businessName}. Return VALID JSON array.`
  );
  return safeJsonParse<any[]>(json, []);
};

export const identifySubRegions = async (theater: string) => {
  const json = await executeIntelligenceTask(`Break ${theater} into 5 sub-regions. Return VALID JSON array.`);
  return safeJsonParse<string[]>(json, []);
};

export const crawlTheaterSignals = async (sector: string, signal: string) => {
  const json = await executeIntelligenceTask(
    `Identify 3 businesses in ${sector} showing signal="${signal}". Return VALID JSON: { "leads": [ ... ] }`
  );
  const parsed = safeJsonParse<any>(json, { leads: [] });
  return (parsed.leads || []).map((l: any) => ({ ...l, id: uuidLike() }));
};

export const fetchViralPulseData = async (niche: string) => {
  const json = await executeIntelligenceTask(
    `Identify 4 viral trends for ${niche}. Return VALID JSON array with title + note.`
  );
  return safeJsonParse<any[]>(json, []);
};

export const queryRealtimeAgent = async (query: string) => {
  const text = await executeIntelligenceTask(`Answer this query: ${query}. Return plain text.`);
  return { text, sources: [] as any[] };
};

export const fetchTokenStats = async () => {
  return {
    recentOps: []
  };
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const json = await executeIntelligenceTask(`Generate agency identity for ${niche} in ${region}. Return VALID JSON.`);
  return safeJsonParse<any>(json, {});
};

export const enhanceStrategicPrompt = async (prompt: string) => {
  return await executeIntelligenceTask(`Enhance strategic prompt: ${prompt}. Return plain text.`);
};

// ================== MEDIA (KEPT FOR SIGNATURE COMPATIBILITY) ==================
// NOTE: These are placeholders until you wire KIE image/video endpoints.
// They accept the same parameters your UI passes, so TS stops erroring.

export const generateVisual = async (_prompt: string, _lead: Lead, _base64Image?: string) => {
  return null as any;
};

export const analyzeVisual = async (_base64: string, _mimeType: string, prompt: string) => {
  return await executeIntelligenceTask(`Analyze image task: ${prompt}. Return plain text.`);
};

export const generateMockup = async (businessName: string, niche: string, leadId?: string) => {
  const prompt = `Mockup concept for ${businessName} in ${niche}.`;
  saveAsset('TEXT', 'Mockup Prompt', prompt, 'MOCKUPS_4K', leadId);
  return null as any;
};

export const enhanceVideoPrompt = async (prompt: string) => {
  return await executeIntelligenceTask(`Enhance this video prompt: ${prompt}. Return plain text.`);
};

// IMPORTANT: must accept 7 args (VideoPitch passes 7)
export const generateVideoPayload = async (
  prompt: string,
  leadId?: string,
  startImageBase64?: string,
  endImageBase64?: string,
  config: VeoConfig = { aspectRatio: '16:9', resolution: '720p' },
  referenceImages: string[] = [],
  inputVideoBase64?: string
) => {
  const payload = {
    provider: 'KIE',
    prompt,
    leadId,
    startImageBase64: !!startImageBase64,
    endImageBase64: !!endImageBase64,
    referenceImagesCount: referenceImages?.length || 0,
    hasInputVideo: !!inputVideoBase64,
    config
  };
  saveAsset('TEXT', 'Video Payload', JSON.stringify(payload, null, 2), 'VIDEO_STUDIO', leadId);
  return null as any;
};

// IMPORTANT: CinemaIntel expected 3 args in one call-site
export const analyzeVideoUrl = async (url: string, prompt: string, _leadId?: string) => {
  return await executeIntelligenceTask(`Analyze this video URL: ${url}. Mission: ${prompt}. Return plain text.`);
};

// AUDIO: kept for signature compatibility
export const generateAudioPitch = async (_text: string, _voiceName: string = 'Kore', _leadId?: string) => {
  return null as any;
};

export const generateLyrics = async (lead: Lead, theme: string, type: string) => {
  return await executeIntelligenceTask(
    `Write ${type} lyrics for ${lead.businessName}. Theme: ${theme}. Return plain text only.`
  );
};

export const generateSonicPrompt = async (lead: Lead) => {
  return await executeIntelligenceTask(
    `Generate a detailed Suno music prompt for ${lead.businessName}. Return ONLY the prompt string.`
  );
};

// FACT CHECK (kept for import compatibility)
export const performFactCheck = async (_lead: Lead, claim: string) => {
  const evidence = await executeIntelligenceTask(`Fact-check this claim: "${claim}". Return plain text.`);
  return { status: 'Review', evidence, sources: [] as any[] };
};

// BRAND DNA
export const extractBrandDNA = async (_lead: Partial<Lead>, websiteUrl: string): Promise<BrandIdentity> => {
  const json = await executeIntelligenceTask(
    `Research ${websiteUrl} and extract brand DNA. Return VALID JSON: { "colors": ["#hex"], "fontPairing": "", "archetype": "", "visualTone": "", "extractedImages": ["url"] }`
  );
  return safeJsonParse<BrandIdentity>(json, {} as BrandIdentity);
};

// MODEL TEST
export const testModelPerformance = async (model: string, prompt: string) => {
  return await loggedGenerateContent({ module: 'TEST', model, contents: prompt });
};
