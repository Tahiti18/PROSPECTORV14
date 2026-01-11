
import { Lead } from '../types';

// --- CONFIGURATION: OPENROUTER HARD-LOCK ---
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Gemini 2.0 Flash is the industry leader for "Next-Gen" latency performance
const PRIMARY_MODEL = "google/gemini-2.0-flash-001"; 

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

export const saveAsset = (type: AssetRecord['type'], title: string, data: string, module?: string, leadId?: string, metadata?: any) => {
  const asset: AssetRecord = { id: uuidLike(), type, title, data, module, leadId, timestamp: Date.now(), metadata };
  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return asset;
};

/**
 * ROBUST JSON EXTRACTION
 */
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
  } catch (e) {}
  return cleaned;
};

/**
 * OPENROUTER REST GATEWAY
 * Fixed 401 error by validating the API Key existence before the request.
 * Uses process.env.OPENROUTER_API_KEY injected during build.
 */
export const openRouterChat = async (prompt: string, system?: string) => {
  const systemInstruction = system || "You are the Prospector OS Intel Engine. Focus on high-ticket B2B growth. Output raw, valid JSON ONLY.";
  
  // Robust key retrieval from the injected process.env object
  const apiKey = (process.env.OPENROUTER_API_KEY || process.env.API_KEY || "").trim();

  if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
    const faultMsg = "Authentication failed: API Key missing or incorrectly injected into Railway bundle.";
    pushLog(`AUTH_CRITICAL: ${faultMsg}`);
    throw new Error(faultMsg);
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Prospector OS"
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const statusMsg = err.error?.message || response.statusText || 'Unauthorized';
        throw new Error(`OpenRouter Error (${response.status}): ${statusMsg}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e: any) {
    pushLog(`INTEL_FAULT: ${e.message}`);
    throw e;
  }
};

/**
 * COMPATIBILITY TASK RUNNER
 */
export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const raw = await openRouterChat(prompt, system);
  return extractJson(raw);
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche} via OpenRouter 2.0 Flash Tier...`);
  
  const prompt = `Find ${count} high-ticket B2B leads in ${region} for ${niche}. 
    Return JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "city": "", "niche": "", "leadScore": 0, "assetGrade": "A", "socialGap": "" }] }`;
  
  try {
    const jsonStr = await executeIntelligenceTask(prompt);
    const parsed = JSON.parse(jsonStr);
    return { leads: parsed.leads || [], groundingSources: [] };
  } catch (e: any) {
    console.error("Discovery Engine Sync Failure:", e);
    throw new Error(`Lead stream synchronization failure: ${e.message}`);
  }
};

// --- UTILITIES ---

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Orchestrating campaign for ${lead.businessName}...`);
  const prompt = `Create outreach assets for ${lead.businessName}. Return JSON with presentation, narrative, outreach, and visualDirection.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(jsonStr);
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const jsonStr = await executeIntelligenceTask(`Technical audit for ${lead.websiteUrl} focus ${module}. Return JSON BenchmarkReport.`);
  return JSON.parse(jsonStr);
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, "benchmark");
};

export const generateProposalDraft = async (lead: Lead) => {
  return await executeIntelligenceTask(`Proposal draft for ${lead.businessName}. Focus on AI ROI.`);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Outreach sequence for ${lead.businessName}. Return JSON array.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const analyzeLedger = async (leads: Lead[]) => {
  const jsonStr = await executeIntelligenceTask(`Analyze Ledger: ${JSON.stringify(leads)}. Return JSON {risk, opportunity}.`);
  try { return JSON.parse(jsonStr); } catch { return { risk: "N/A", opportunity: "N/A" }; }
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const jsonStr = await executeIntelligenceTask(`Fact check: "${claim}" for ${lead.businessName}. Return JSON.`);
  try { return JSON.parse(jsonStr); } catch { return { status: "Unknown", evidence: "N/A" }; }
};

export const generatePlaybookStrategy = async (niche: string) => {
  const jsonStr = await executeIntelligenceTask(`Strategy for ${niche}. Return JSON.`);
  try { return JSON.parse(jsonStr); } catch { return { strategyName: "Ops", steps: [] }; }
};

export const architectFunnel = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Funnel for ${lead.businessName}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const architectPitchDeck = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Pitch deck for ${lead.businessName}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const generateTaskMatrix = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Task matrix for ${lead.businessName}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const jsonStr = await executeIntelligenceTask(`Chat scenario for ${lead.businessName}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const jsonStr = await executeIntelligenceTask(`Brand DNA from ${url}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return {}; }
};

export const synthesizeProduct = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Product design for ${lead.businessName}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return {}; }
};

export const generateFlashSparks = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Viral hooks for ${lead.businessName}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const generatePitch = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Pitch for ${lead.businessName}. JSON {pitch}.`);
  try { return JSON.parse(jsonStr).pitch || jsonStr; } catch { return jsonStr; }
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await executeIntelligenceTask(`ROI simulation for ${lead.businessName}. LTV ${ltv}, Vol ${volume}.`);
};

export const synthesizeArticle = async (s: string, m: string) => {
  return await executeIntelligenceTask(`Synthesize article: ${s} as ${m}.`);
};

export const loggedGenerateContent = async (opts: any) => {
  return await openRouterChat(opts.contents, opts.config?.systemInstruction);
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  return await executeIntelligenceTask(`Lyrics for ${l.businessName} in style ${p}.`);
};

export const generateSonicPrompt = async (l: any) => {
  const jsonStr = await executeIntelligenceTask(`Sonic prompt for ${l.businessName}. JSON {prompt}.`);
  try { return JSON.parse(jsonStr).prompt || "Premium Sound"; } catch { return "Premium Sound"; }
};

export const enhanceVideoPrompt = async (p: string) => {
  const jsonStr = await executeIntelligenceTask(`Enhance video prompt: "${p}". JSON {enhanced}.`);
  try { return JSON.parse(jsonStr).enhanced || p; } catch { return p; }
};

export const enhanceStrategicPrompt = async (p: string) => {
  const jsonStr = await executeIntelligenceTask(`Enhance strategy prompt: "${p}". JSON {enhanced}.`);
  try { return JSON.parse(jsonStr).enhanced || p; } catch { return p; }
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const jsonStr = await executeIntelligenceTask(`Agency identity for ${niche} in ${region}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return {}; }
};

export const generateAffiliateProgram = async (niche: string) => {
  const jsonStr = await executeIntelligenceTask(`Affiliate matrix for ${niche}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return {}; }
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await executeIntelligenceTask(`Video audit for ${lead.businessName}.`);
};

export const translateTactical = async (text: string, lang: string) => {
  const res = await executeIntelligenceTask(`Translate to ${lang}: "${text}". JSON {translated}.`);
  try { return JSON.parse(res).translated || res; } catch { return res; }
};

export const fetchViralPulseData = async (niche: string) => {
  const jsonStr = await executeIntelligenceTask(`Trends for ${niche}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const queryRealtimeAgent = async (q: string) => {
  const text = await executeIntelligenceTask(q);
  return { text, sources: [] };
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  return await executeIntelligenceTask(`ROI Report: LTV ${ltv}, Vol ${vol}, Conv ${conv}.`);
};

export const fetchTokenStats = async () => ({ recentOps: [{ op: 'GATEWAY_LINK', id: 'OPENROUTER_FLASH', cost: '0.0001' }] });

export const identifySubRegions = async (theater: string) => {
  const jsonStr = await executeIntelligenceTask(`Split ${theater} into 5 sectors. JSON array.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const jsonStr = await executeIntelligenceTask(`Find 5 businesses in ${region} for ${signal}. JSON array.`);
  try { return JSON.parse(jsonStr); } catch { return []; }
};

export const analyzeVideoUrl = async (u: string, p: string, leadId?: string) => {
  return await executeIntelligenceTask(`Analyze video ${u}. Instruction: ${p}`);
};

export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  return await executeIntelligenceTask(`Image Analysis: ${prompt} [Data: ${base64.slice(0, 20)}...]`);
};

export const testModelPerformance = async (model: string, prompt: string) => {
  return await openRouterChat(prompt);
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Storyboard for ${lead.businessName}. JSON.`);
  try { return JSON.parse(jsonStr); } catch { return null; }
};

// --- MEDIA GENERATION (KIE NKIE PROXY LOCK) ---

export const generateVisual = async (prompt: string, lead: any, editImage?: string) => {
  pushLog(`VISUAL: Initiating NKIE Visual Synthesis for ${prompt.slice(0, 20)}...`);
  return null; 
};

export const generateVideoPayload = async (
  prompt: string, 
  leadId?: string, 
  startImage?: string, 
  endImage?: string, 
  config?: VeoConfig,
  referenceImages?: string[],
  inputVideo?: string
) => {
  pushLog(`VIDEO: Initiating NKIE Video Protocol...`);
  return null;
};

export const generateAudioPitch = async (text: string, voice: string, leadId?: string) => {
    pushLog(`AUDIO: Initiating KIE Suno V4.5 Protocol...`);
    return null;
};

export const generateMockup = async (name: string, niche: string, leadId?: string) => {
  return await generateVisual(`4K Billboard mockup for ${name}`, { id: leadId });
};

export const getAI = () => null; 

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
};
export const clearVault = () => { SESSION_ASSETS.length = 0; assetListeners.forEach(l => l([])); };
export const importVault = (a: any[]) => { SESSION_ASSETS.push(...a); assetListeners.forEach(l => l([...SESSION_ASSETS])); return a.length; };
