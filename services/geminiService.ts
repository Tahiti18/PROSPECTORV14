import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';

// ======================================================
// HARD LOCK: NO GOOGLE GEMINI SDK / NO @google/genai
// ======================================================
// All AI text intelligence goes through your server proxy:
// POST /api/openrouter/chat
//
// Audio/Video/Image generation should be handled by KIE services
// (e.g., kieSunoService.ts) or other provider modules.
// ======================================================

// --- CONFIGURATION: OPENROUTER HARD-LOCK ---
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"; // kept for reference
const PRIMARY_MODEL = "google/gemini-2.0-flash-001";

// Fix for your Railway build error:
const SYSTEM_INSTRUCTION = `
You are a high-performance B2B intelligence engine.
Return structured, concise, actionable outputs.
When asked for JSON, return STRICT JSON only, no markdown.
`.trim();

// --- TYPES ---
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

// --- STATE ---
export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];
const assetListeners = new Set<(assets: AssetRecord[]) => void>();

export const pushLog = (msg: string) => {
  PRODUCTION_LOGS.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 200) PRODUCTION_LOGS.pop();
};

export const subscribeToAssets = (listener: (assets: AssetRecord[]) => void) => {
  assetListeners.add(listener);
  listener(SESSION_ASSETS);
  return () => { assetListeners.delete(listener); };
};

const uuidLike = () => Math.random().toString(36).substring(2, 15);

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
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return asset;
};

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
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
  return SESSION_ASSETS.length;
};

// --- JSON EXTRACTION ---
const extractJson = (text: string) => {
  if (!text) return "";
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    if (start !== -1 && (arrayStart === -1 || start < arrayStart)) {
      return cleaned.substring(start, end + 1);
    } else if (arrayStart !== -1) {
      return cleaned.substring(arrayStart, arrayEnd + 1);
    }
  } catch {}
  return cleaned;
};

// ======================================================
// LOGGED GENERATION: NOW USING OPENROUTER PROXY (TEXT ONLY)
// ======================================================
export interface LoggedGenerateParams {
  module: string;
  model?: string;
  modelClass?: 'FLASH' | 'PRO';
  reasoningDepth?: 'LOW' | 'MEDIUM' | 'HIGH';
  isClientFacing?: boolean;
  contents: any;
  config?: any;
}

export const loggedGenerateContent = async (params: LoggedGenerateParams): Promise<string> => {
  const model = params.model || PRIMARY_MODEL;

  // Normalize contents to a prompt string
  const prompt =
    typeof params.contents === 'string'
      ? params.contents
      : JSON.stringify(params.contents ?? {}, null, 2);

  const start = Date.now();
  try {
    const text = await openRouterChat(prompt, SYSTEM_INSTRUCTION, model);

    // Keep your tracker, but avoid type issues:
    // If deductCost expects (reason: string, tokens: number) or similar, keep it safe.
    try {
      deductCost(String(model), prompt.length + (text?.length || 0));
    } catch {
      // ignore cost tracking errors
    }

    pushLog(`GEN_OK ${params.module} (${model}) ${Date.now() - start}ms`);
    return text || '';
  } catch (e: any) {
    pushLog(`GENERATION_ERROR in ${params.module}: ${e?.message || String(e)}`);
    throw e;
  }
};

// ======================================================
// OPENROUTER PROXY CALL (SERVER MUST ATTACH BEARER KEY)
// ======================================================
export const openRouterChat = async (prompt: string, system?: string, model?: string) => {
  try {
    const response = await fetch('/api/openrouter/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction: system || SYSTEM_INSTRUCTION,
        model: model || PRIMARY_MODEL
      })
    });

    const rawText = await response.text();

    if (!response.ok) {
      const statusText = response.status === 401 ? 'Unauthorized (Check Key)' : `Error ${response.status}`;
      pushLog(`OpenRouter API Error (${response.status}): ${rawText}`);
      throw new Error(`OpenRouter API Error (${statusText}): ${rawText}`);
    }

    // Expect JSON from server proxy, but tolerate plain text
    try {
      const data = JSON.parse(rawText);
      return data?.choices?.[0]?.message?.content ?? '';
    } catch {
      return rawText;
    }
  } catch (e: any) {
    pushLog(`INTEL_FAULT [OpenRouter Proxy]: ${e?.message || String(e)}`);
    throw e;
  }
};

export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const raw = await openRouterChat(prompt, system);
  return extractJson(raw);
};

// ======================================================
// CORE FEATURES (LEADS / OUTREACH / STRATEGY) — TEXT ONLY
// ======================================================
export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} via OpenRouter (${PRIMARY_MODEL})...`);
  const prompt = `Find ${count} high-ticket B2B leads in ${region} for ${niche}.
Return STRICT JSON:
{ "leads": [{ "businessName": "", "websiteUrl": "", "city": "", "niche": "", "leadScore": 0, "assetGrade": "A", "socialGap": "" }] }`;

  try {
    const jsonStr = await executeIntelligenceTask(prompt);
    const parsed = JSON.parse(jsonStr);
    return { leads: parsed.leads || [], groundingSources: [] };
  } catch (e: any) {
    console.error("Discovery Engine Sync Failure:", e);
    throw new Error(`Lead stream synchronization failure: ${e.message}`);
  }
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Orchestrating campaign for ${lead.businessName}...`);
  const prompt = `Create outreach assets for ${lead.businessName}. Return JSON with presentation, narrative, outreach, and visual direction.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(jsonStr);
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const jsonStr = await executeIntelligenceTask(
    `Technical audit for ${lead.websiteUrl} focus ${module}. Return STRICT JSON BenchmarkReport.`
  );
  return JSON.parse(jsonStr);
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, "benchmark");
};

export const generateProposalDraft = async (lead: Lead) => {
  return await executeIntelligenceTask(`Proposal draft for ${lead.businessName}. Focus on AI ROI.`);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const prompt = `Create a 5-day multi-channel outreach sequence for ${lead.businessName} (${lead.niche}).
Return STRICT JSON:
[{ "day": 1, "channel": "Email", "content": "...", "purpose": "..." }]`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(jsonStr);
};

export const generatePlaybookStrategy = async (niche: string) => {
  const prompt = `Generate a high-ticket agency playbook strategy for ${niche}.
Return STRICT JSON:
{ "strategyName": "", "steps": [{ "title": "", "tactic": "" }] }`;
  const json = await executeIntelligenceTask(prompt);
  return JSON.parse(json);
};

// ======================================================
// MEDIA FUNCTIONS — NO GEMINI. RETURN PROMPTS / PLACEHOLDERS
// (Audio/Video/Image should be done via KIE modules)
// ======================================================
export const generateAudioPitch = async (_text: string, _voiceName: string = 'Kore', _leadId?: string) => {
  pushLog(`AUDIO_DISABLED: Gemini audio generation is disabled. Use KIE/Suno flow.`);
  return null;
};

export const generateLyrics = async (lead: Lead, theme: string, type: string) => {
  return await executeIntelligenceTask(
    `Write ${type} lyrics for ${lead.businessName} theme ${theme}. Return raw text.`
  );
};

export const generateVisual = async (prompt: string, lead: Lead) => {
  // Generate an image prompt only (actual image generation should be handled elsewhere)
  const out = await executeIntelligenceTask(
    `Convert this into a premium image-generation prompt for ${lead.businessName}:
${prompt}
Return plain text prompt only.`
  );
  saveAsset('TEXT', `Visual Prompt: ${prompt.slice(0, 30)}`, out, 'CREATIVE_STUDIO', lead.id);
  return null;
};

export const generateSonicPrompt = async (lead: Lead) => {
  return await executeIntelligenceTask(
    `Generate a detailed music generation prompt for ${lead.businessName} brand identity. Return only the prompt string.`
  );
};

export const analyzeVisual = async (_base64: string, _mimeType: string, prompt: string) => {
  // Text-only analysis instruction (no image ingestion)
  return await executeIntelligenceTask(
    `Provide a visual analysis plan and key checks for this request (no image provided): ${prompt}. Return plain text.`
  );
};

export const identifySubRegions = async (theater: string) => {
  const json = await executeIntelligenceTask(`Break ${theater} into 5 strategic sub-regions. Return JSON array.`);
  return JSON.parse(json);
};

export const crawlTheaterSignals = async (sector: string, signal: string) => {
  const json = await executeIntelligenceTask(`Identify 3 businesses in ${sector} showing ${signal}. Return JSON { "leads": [...] }`);
  const parsed = JSON.parse(json);
  return (parsed.leads || []).map((l: any) => ({ ...l, id: uuidLike() }));
};

export const analyzeLedger = async (leads: Lead[]) => {
  const json = await executeIntelligenceTask(
    `Analyze these ${leads.length} leads. Identify top risk and top opportunity. Return JSON: { "risk": "", "opportunity": "" }`
  );
  return JSON.parse(json);
};

export const generateVideoPayload = async (
  prompt: string,
  leadId?: string,
  _startImageBase64?: string,
  _endImageBase64?: string,
  _config: VeoConfig = { aspectRatio: '16:9', resolution: '720p' },
  _referenceImages: string[] = [],
  _inputVideoBase64?: string
) => {
  // Produce a video prompt only; actual generation should be done via KIE or another service
  const out = await executeIntelligenceTask(
    `Convert this into a cinematic, production-ready video generation prompt:
${prompt}
Return plain text prompt only.`
  );
  saveAsset('TEXT', `Video Prompt: ${prompt.slice(0, 30)}`, out, 'VIDEO_STUDIO', leadId);
  return null;
};

export const enhanceVideoPrompt = async (prompt: string) => {
  return await executeIntelligenceTask(`Enhance this video prompt for cinematic 4k: ${prompt}`);
};

export const generateMockup = async (businessName: string, niche: string, leadId?: string) => {
  const prompt = `Hyper-realistic 4K mockup concept for ${businessName} in ${niche}. Return a single image prompt.`;
  const out = await executeIntelligenceTask(prompt);
  saveAsset('TEXT', `Mockup Prompt: ${businessName}`, out, 'CREATIVE_STUDIO', leadId);
  return null;
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const json = await executeIntelligenceTask(
    `Fact-check this claim about ${lead.businessName}:
"${claim}"
Return STRICT JSON:
{ "status": "Verified|Disputed|Unclear", "evidence": "...", "sources": [{ "title": "...", "uri": "..." }] }`
  );
  return JSON.parse(json);
};

export const synthesizeProduct = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Architect AI product for ${lead.businessName}. Return JSON.`);
  return JSON.parse(json);
};

export const generatePitch = async (lead: Lead) => {
  return await executeIntelligenceTask(`Write 30s pitch for ${lead.businessName}.`);
};

export const architectFunnel = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Architect sales funnel for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(json);
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const json = await executeIntelligenceTask(`Generate agency identity for ${niche} in ${region}. Return JSON.`);
  return JSON.parse(json);
};

export const testModelPerformance = async (model: string, prompt: string) => {
  return await loggedGenerateContent({ module: 'TEST', model, contents: prompt });
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Create storyboard for ${lead.businessName}. Return JSON.`);
  return JSON.parse(json);
};

export const generateFlashSparks = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Generate 6 viral sparks for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(json);
};

export const architectPitchDeck = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Architect 5-slide pitch deck for ${lead.businessName}. Return JSON.`);
  return JSON.parse(json);
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await executeIntelligenceTask(`Simulate business growth for ${lead.businessName} LTV ${ltv} Volume ${volume}.`);
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await executeIntelligenceTask(`Critique video presence of ${lead.businessName}.`);
};

export const translateTactical = async (text: string, lang: string) => {
  return await executeIntelligenceTask(`Translate to tactical ${lang}: ${text}`);
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const json = await executeIntelligenceTask(`Generate nurture chat for ${lead.businessName} in: ${scenario}. Return JSON array.`);
  return JSON.parse(json);
};

export const generateAffiliateProgram = async (niche: string) => {
  const json = await executeIntelligenceTask(`Generate affiliate matrix for ${niche}. Return JSON.`);
  return JSON.parse(json);
};

export const generateTaskMatrix = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Generate task checklist for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(json);
};

export const fetchViralPulseData = async (niche: string) => {
  const json = await executeIntelligenceTask(`Identify 4 viral trends for ${niche}. Return JSON array.`);
  return JSON.parse(json);
};

export const queryRealtimeAgent = async (query: string) => {
  const json = await executeIntelligenceTask(
    `Answer this query with sources.
Return STRICT JSON:
{ "text": "...", "sources": [{ "title": "...", "uri": "..." }] }
Query: ${query}`
  );
  return JSON.parse(json);
};

export const fetchTokenStats = async () => {
  return {
    recentOps: [
      { op: 'LEAD_RECON', id: '0x88FF', cost: 1200 },
      { op: 'VIDEO_SYNTH', id: '0x12A4', cost: 45000 }
    ]
  };
};

export const synthesizeArticle = async (source: string, mode: string) => {
  return await executeIntelligenceTask(`Synthesize article into mode ${mode}: ${source}`);
};

export const analyzeVideoUrl = async (url: string, prompt: string) => {
  return await executeIntelligenceTask(
    `Analyze this video by URL only (no direct video ingestion):
URL: ${url}
Mission: ${prompt}
Return plain text analysis.`
  );
};

export const enhanceStrategicPrompt = async (prompt: string) => {
  return await executeIntelligenceTask(`Enhance strategic prompt: ${prompt}`);
};

export const generateROIReport = async (ltv: number, leads: number, conv: number) => {
  return await executeIntelligenceTask(`Generate AI ROI report: LTV ${ltv} Leads ${leads} Conv lift ${conv}.`);
};

export const extractBrandDNA = async (_lead: Partial<Lead>, websiteUrl: string): Promise<BrandIdentity> => {
  const json = await executeIntelligenceTask(
    `Research ${websiteUrl} and extract brand DNA.
Return STRICT JSON:
{ "colors": ["#hex"], "fontPairing": "", "archetype": "", "visualTone": "", "extractedImages": ["url"] }`
  );
  return JSON.parse(json || '{}');
};
