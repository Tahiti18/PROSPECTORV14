
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EngineResult, Lead, SubModule } from "../types";
import { trackCall } from "./computeTracker";
import { getModuleWeight } from "./creditWeights";
import {
  logAiOperation,
  uuidLike,
  UserRole,
  ModelClass,
  ReasoningDepth,
  isFounderMode,
  getAvailableCredits,
} from "./usageLogger";

export const getAI = () => {
  const apiKey =
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error(
      "SYSTEM CRITICAL: Missing API key env var. Set API_KEY (preferred) or GOOGLE_API_KEY / GEMINI_API_KEY."
    );
  }

  return new GoogleGenAI({ apiKey: apiKey || "" });
};

// --- GLOBAL SESSION STATE & VAULT ---
export interface AssetRecord {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT'; 
  module?: SubModule;
  title: string;
  data: string; // Base64 or URL
  timestamp: string | number;
  content?: string; 
  leadId?: string; // NEW: Precise Asset Linking
}

const STORAGE_KEY_VAULT = 'pomelli_media_vault_v1';

// Initialize from LocalStorage or empty
let persistedAssets: AssetRecord[] = [];
try {
  const raw = localStorage.getItem(STORAGE_KEY_VAULT);
  if (raw) persistedAssets = JSON.parse(raw);
} catch (e) {
  console.error("Failed to load vault", e);
}

export const SESSION_ASSETS: AssetRecord[] = persistedAssets;

// Core Auto-Save Function
export const saveAsset = (type: AssetRecord['type'], title: string, data: string, module: SubModule = 'MEDIA_VAULT', leadId?: string): AssetRecord => {
  // Guardrail B: Collision-resistant ID
  let uniqueId: string;
  // @ts-ignore
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // @ts-ignore
    uniqueId = `ASSET-${crypto.randomUUID()}`;
  } else {
    uniqueId = `ASSET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  const asset: AssetRecord = {
    id: uniqueId,
    type,
    title,
    data, // For text, this is the content. For media, this is base64/url.
    timestamp: new Date().toLocaleTimeString(),
    content: data, // Compatibility
    module,
    leadId
  };

  // Add to beginning
  SESSION_ASSETS.unshift(asset); 
  
  // Rolling Buffer: Keep max 100 items (Upgraded from 30)
  if (SESSION_ASSETS.length > 100) {
    SESSION_ASSETS.pop();
  }

  // Persist
  try {
    localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(SESSION_ASSETS));
    pushLog(`VAULT SECURED: ${title} [${type}]${leadId ? ` (Linked: ${leadId})` : ''}`);
  } catch (e) {
    console.warn("Vault Storage Full - Could not persist to disk, kept in memory.", e);
    pushLog(`VAULT MEMORY ONLY: Storage Quota Exceeded`);
  }
  
  return asset;
};

// Import / Merge Utility
export const importVault = (externalAssets: AssetRecord[]) => {
  if (!Array.isArray(externalAssets)) return 0;
  
  const existingIds = new Set(SESSION_ASSETS.map(a => a.id));
  let addedCount = 0;

  externalAssets.forEach(asset => {
    if (!existingIds.has(asset.id)) {
      SESSION_ASSETS.push(asset);
      addedCount++;
    }
  });
  
  try {
    localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(SESSION_ASSETS));
    pushLog(`VAULT RESTORE: ${addedCount} ASSETS INJECTED.`);
  } catch (e) {
    console.error("Import failed quota", e);
  }
  return addedCount;
};

export const clearVault = () => {
  SESSION_ASSETS.length = 0;
  localStorage.removeItem(STORAGE_KEY_VAULT);
  pushLog("VAULT PURGED: COLD STORAGE RESET.");
}

export interface SystemLogEntry {
  timestamp: number;
  message: string;
}

export interface EngineSessionState {
  leadLedger: Lead[];
  assets: AssetRecord[];
  logs: SystemLogEntry[];
  activeModule: SubModule | null;
}

export const sessionState: EngineSessionState = {
  leadLedger: [],
  assets: SESSION_ASSETS,
  logs: [],
  activeModule: null,
};

// Restore PRODUCTION_LOGS for ProdLog.tsx compatibility
export const PRODUCTION_LOGS: string[] = [];

export const pushLog = (msg: string) => {
  const time = new Date().toLocaleTimeString();
  const logMsg = `[${time}] ${msg}`;
  
  console.log(`[SYSTEM_LOG] ${msg}`);
  PRODUCTION_LOGS.unshift(logMsg);
  if (PRODUCTION_LOGS.length > 100) PRODUCTION_LOGS.pop();

  sessionState.logs.push({ timestamp: Date.now(), message: msg });
};

// --- Utility: Extract JSON safely from model output ---
export const extractJSON = (text: string) => {
  try {
    let match = text.match(/\{[\s\S]*\}/);
    if (match) {
        try { return JSON.parse(match[0]); } catch (e) { /* continue */ }
    }
    match = text.match(/\[[\s\S]*\]/);
    if (match) {
        try { return JSON.parse(match[0]); } catch (e) { /* continue */ }
    }
    match = text.match(/```json([\s\S]*)```/);
    if (match) {
        try { return JSON.parse(match[1]); } catch (e) { /* continue */ }
    }
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

// --- AUDIO HELPERS (PCM to WAV) ---
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Improved Robust WAV Converter returning Data URI
async function pcmToWavDataUri(base64PCM: string, sampleRate: number = 24000): Promise<string> {
  const binaryString = atob(base64PCM);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + len, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true); // Mono
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, len, true);

  // Create Blob
  const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
  
  // Convert Blob to Data URI
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ===============================
// LOGGED WRAPPER
// ===============================
type LoggedGenerateArgs = {
  ai: GoogleGenAI;
  module: string;
  model: string;
  modelClass: ModelClass;
  reasoningDepth: ReasoningDepth;
  isClientFacing: boolean;
  userId?: string;
  userRole?: UserRole;
  requestId?: string;
  traceId?: string;
  contents: any;
  config?: any;
};

export const loggedGenerateContent = async ({
  ai,
  module,
  model,
  modelClass,
  reasoningDepth,
  isClientFacing,
  userId,
  userRole,
  requestId,
  traceId,
  contents,
  config,
}: LoggedGenerateArgs): Promise<string> => {
  const start = Date.now();
  const moduleWeight = getModuleWeight(module);
  const effectiveWeight = moduleWeight;

  const logBase = {
    logId: uuidLike(),
    timestamp: new Date().toISOString(),
    requestId,
    traceId,
    userId: userId || "anonymous",
    userRole: userRole || "FOUNDER",
    module,
    isClientFacing,
    model,
    modelClass,
    reasoningDepth,
    moduleWeight,
    effectiveWeight,
  };

  if (!isFounderMode()) {
    const currentBalance = getAvailableCredits(userId || "anonymous");
    if (currentBalance < effectiveWeight) {
      const errorMsg = `CREDIT_LIMIT_EXCEEDED: Required ${effectiveWeight}, Available ${currentBalance}`;
      await logAiOperation({ ...logBase, latencyMs: 0, status: "FAILURE", errorMessage: errorMsg });
      pushLog(`[AI_USAGE] BLOCKED: ${module} (${effectiveWeight} credits needed)`);
      throw new Error(errorMsg);
    }
  }

  try {
    const resp = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const latencyMs = Date.now() - start;
    await logAiOperation({ ...logBase, latencyMs, status: "SUCCESS" });
    pushLog(`[AI_USAGE] ${module} (${modelClass}) ${latencyMs}ms | W:${effectiveWeight}`);

    const text = resp.text || "";
    trackCall(model, text.length + 100);
    return text;
  } catch (e: any) {
    const latencyMs = Date.now() - start;
    await logAiOperation({ ...logBase, latencyMs, status: "FAILURE", errorMessage: e?.message || String(e) });
    pushLog(`[AI_USAGE] ${module} (${modelClass}) FAIL ${latencyMs}ms | W:${effectiveWeight} | ${e?.message || String(e)}`);
    throw e;
  }
};

// --- DATA MODELS ---
export interface StackItem { label: string; description: string; }
export interface BenchmarkReport {
  entityName: string; missionSummary: string; visualStack: StackItem[];
  socialStack: StackItem[]; techStack: StackItem[]; funnelStack: StackItem[];
  contentStack: StackItem[]; sonicStack: StackItem[]; deepArchitecture: string;
  sources: Array<{ title: string; uri: string }>; featureGap: string;
  businessModel: string; designSystem: string;
}

export const fetchLiveIntel = async (lead: Lead, moduleType: string): Promise<BenchmarkReport> => {
  pushLog(`ENGAGING MODULE: ${moduleType} for ${lead.businessName}`);
  const ai = getAI();
  const model = "gemini-3-pro-preview";

  const prompt = `
You are the Lead Reverse-Engineer for a high-end AI Technical Agency.
TARGET ENTITY: "${lead.businessName}" (${lead.websiteUrl})
MODULE: "${moduleType}"
Analyze public web presence. Return JSON exactly matching schema.
Schema: { "entityName": "", "missionSummary": "", "visualStack": [{"label":"", "description":""}], "socialStack": [], "techStack": [], "funnelStack": [], "contentStack": [], "sonicStack": [], "featureGap": "", "businessModel": "", "designSystem": "", "deepArchitecture": "", "sources": [{"title":"", "uri":""}] }
`;

  const text = await loggedGenerateContent({
    ai, module: "BENCHMARK", model, modelClass: "PRO", reasoningDepth: "HIGH",
    isClientFacing: true, contents: prompt,
    config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] },
  });

  const data = extractJSON(text || "{}") || {};
  const rawData = data as any;
  const normalizeStack = (arr: any[]): StackItem[] => (Array.isArray(arr) ? arr.filter(Boolean).map(x => ({ label: String(x.label||x.title||"Signal"), description: String(x.description||x.detail||"No description.") })) : []);

  // AUTO SAVE REPORT
  if (rawData.deepArchitecture) {
    saveAsset('TEXT', `INTEL_${moduleType}_${lead.businessName.substring(0,10)}`, `DEEP ARCHITECTURE:\n\n${rawData.deepArchitecture}\n\nSUMMARY: ${rawData.missionSummary}`, moduleType as SubModule, lead.id);
  }

  return {
    entityName: rawData.entityName || lead.businessName,
    missionSummary: rawData.missionSummary || "No summary generated.",
    visualStack: normalizeStack(rawData.visualStack),
    socialStack: normalizeStack(rawData.socialStack),
    techStack: normalizeStack(rawData.techStack),
    funnelStack: normalizeStack(rawData.funnelStack),
    contentStack: normalizeStack(rawData.contentStack),
    sonicStack: normalizeStack(rawData.sonicStack),
    featureGap: rawData.featureGap || "Tactical gap analysis pending.",
    businessModel: rawData.businessModel || "Analysis in progress.",
    designSystem: rawData.designSystem || "Audit pending.",
    deepArchitecture: rawData.deepArchitecture || "Analyzing deep-layer protocols...",
    sources: Array.isArray(rawData.sources) ? rawData.sources : [],
  };
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => fetchLiveIntel(lead, "BENCHMARK");

export const orchestrateBusinessPackage = async (lead: Lead, assets: AssetRecord[]): Promise<any> => {
  pushLog(`ORCHESTRATING BUSINESS PACKAGE FOR ${lead.businessName}`);
  
  // Prepare Context
  const textContext = assets
    .filter(a => a.type === 'TEXT')
    .map(a => `[ASSET: ${a.title}] (${a.module}): ${a.data}`)
    .join('\n\n');
    
  const mediaContext = assets
    .filter(a => a.type !== 'TEXT')
    .map(a => `[${a.type} ASSET]: ${a.title} (Available in Vault)`)
    .join('\n');

  const prompt = `
    You are the Chief Strategy Orchestrator for a High-Ticket AI Agency.
    
    TARGET CLIENT: ${lead.businessName} (${lead.niche})
    LOCATION: ${lead.city}
    SOCIAL GAP: ${lead.socialGap}
    
    AVAILABLE INTELLIGENCE VAULT ASSETS:
    ${textContext}
    
    AVAILABLE MEDIA ASSETS:
    ${mediaContext}
    
    MISSION:
    Synthesize all available intelligence and assets into a cohesive "Final Delivery Package".
    You must weave the text insights together and reference the existence of media assets where appropriate in the strategy.
    
    RETURN JSON STRUCTURE:
    {
      "presentation": {
        "title": "Main Deck Title",
        "slides": [
          { "title": "Slide Title", "bullets": ["Point 1", "Point 2"], "visualRef": "Description of visual to use" }
        ]
      },
      "narrative": "A compelling 2-paragraph executive summary pitch weaving the assets together.",
      "contentPack": [
        { "platform": "Instagram", "type": "Reel", "caption": "Caption text...", "assetRef": "Reference to a Vault asset if applicable" }
      ],
      "outreach": {
        "emailSequence": [
          { "subject": "Subject line", "body": "Email body..." }
        ],
        "linkedin": "Connection note text..."
      }
    }
  `;

  const text = await loggedGenerateContent({
    ai: getAI(),
    module: "BUSINESS_ORCHESTRATOR",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 16000 } }
  });

  return extractJSON(text || "{}");
};

export const runFlashPrompt = async (prompt: string): Promise<string> => {
  const text = await loggedGenerateContent({
    ai: getAI(), module: "PROMPT_AI", model: "gemini-3-flash-preview", modelClass: "FLASH",
    reasoningDepth: "LOW", isClientFacing: true, contents: prompt,
  });
  return text || "No response.";
};

export const critiqueVideoPresence = async (lead: Lead): Promise<string> => {
  const prompt = `Audit video presence for ${lead.businessName}. Output practical action plan.`;
  const text = await loggedGenerateContent({
    ai: getAI(), module: "VIDEO_AI", model: "gemini-3-pro-preview", modelClass: "PRO",
    reasoningDepth: "HIGH", isClientFacing: true, contents: prompt, config: { tools: [{ googleSearch: {} }] },
  });
  if (text) saveAsset('TEXT', `VIDEO_AUDIT_${lead.businessName}`, text, 'VIDEO_AI', lead.id);
  return text || "Audit failed.";
};

export const synthesizeArticle = async (source: string, mode: string): Promise<string> => {
  const prompt = `Synthesize article: ${source} in mode: ${mode}.`;
  const text = await loggedGenerateContent({
    ai: getAI(), module: "ARTICLE_INTEL", model: "gemini-3-pro-preview", modelClass: "PRO",
    reasoningDepth: "MEDIUM", isClientFacing: true, contents: prompt, config: { tools: [{ googleSearch: {} }] },
  });
  if (text) saveAsset('TEXT', `ARTICLE_SYNTH_${mode}`, text, 'ARTICLE_INTEL');
  return text || "Failed.";
};

export const architectPitchDeck = async (lead: Lead): Promise<any[]> => {
  const prompt = `Architect 5-slide deck for ${lead.businessName}. Return JSON array.`;
  const text = await loggedGenerateContent({
    ai: getAI(), module: "DECK_ARCH", model: "gemini-3-pro-preview", modelClass: "PRO",
    reasoningDepth: "HIGH", isClientFacing: true, contents: prompt, config: { thinkingConfig: { thinkingBudget: 4000 } },
  });
  const data = extractJSON(text || "[]") || [];
  if (data.length > 0) saveAsset('TEXT', `DECK_ARCH_${lead.businessName}`, JSON.stringify(data, null, 2), 'DECK_ARCH', lead.id);
  return data;
};

export const generateOutreachSequence = async (lead: Lead): Promise<any[]> => {
  const prompt = `5-day outreach sequence for ${lead.businessName}. Return JSON array.`;
  const text = await loggedGenerateContent({
    ai: getAI(), module: "SEQUENCER", model: "gemini-3-pro-preview", modelClass: "PRO",
    reasoningDepth: "HIGH", isClientFacing: true, contents: prompt, config: { thinkingConfig: { thinkingBudget: 4000 } },
  });
  const data = extractJSON(text || "[]") || [];
  if (data.length > 0) saveAsset('TEXT', `SEQ_DATA_${lead.businessName}`, JSON.stringify(data, null, 2), 'SEQUENCER', lead.id);
  return data;
};

export const architectFunnel = async (lead: Lead): Promise<any[]> => {
  const prompt = `Funnel map for ${lead.businessName}. Return JSON array.`;
  const text = await loggedGenerateContent({
    ai: getAI(), module: "FUNNEL_MAP", model: "gemini-3-pro-preview", modelClass: "PRO",
    reasoningDepth: "HIGH", isClientFacing: true, contents: prompt, config: { thinkingConfig: { thinkingBudget: 4000 }, responseMimeType: "application/json" },
  });
  const data = extractJSON(text || "[]") || [];
  if (data.length > 0) saveAsset('TEXT', `FUNNEL_${lead.businessName}`, JSON.stringify(data, null, 2), 'FUNNEL_MAP', lead.id);
  return data;
};

export const generateROIReport = async (ltv: number, volume: number, conv: number): Promise<string> => {
  const text = await loggedGenerateContent({
    ai: getAI(), module: "ROI_CALC", model: "gemini-3-pro-preview", modelClass: "PRO",
    reasoningDepth: "MEDIUM", isClientFacing: true, contents: `ROI report for LTV ${ltv}, Vol ${volume}, Conv ${conv}%.`,
  });
  if (text) saveAsset('TEXT', `ROI_REPORT_${Date.now()}`, text, 'ROI_CALC');
  return text || "ROI report failed.";
};

export const analyzeLedger = async (leads: Lead[]): Promise<{ risk: string; opportunity: string }> => {
  const text = await loggedGenerateContent({
    ai: getAI(), module: "ANALYTICS_HUB", model: "gemini-3-flash-preview", modelClass: "FLASH",
    reasoningDepth: "LOW", isClientFacing: true, contents: `Analyze leads. JSON {risk, opportunity}.`, config: { responseMimeType: "application/json" },
  });
  return JSON.parse(text || '{"risk":"Data insufficient.","opportunity":"Gather more intel."}');
};

export const generateLeads = async (region: string, nicheHint: string, count: number = 6): Promise<EngineResult> => {
  pushLog(`INITIATING DISCOVERY SCAN: ${region} / ${nicheHint}`);
  const prompt = `Search for ${count} REAL businesses in ${region}, niche ${nicheHint}. JSON schema required.`;
  const text = await loggedGenerateContent({
    ai: getAI(), module: "RADAR_RECON", model: "gemini-3-flash-preview", modelClass: "FLASH",
    reasoningDepth: "LOW", isClientFacing: true, contents: prompt, config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { leads: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { rank: { type: Type.NUMBER }, businessName: { type: Type.STRING }, websiteUrl: { type: Type.STRING }, niche: { type: Type.STRING }, city: { type: Type.STRING }, phone: { type: Type.STRING }, email: { type: Type.STRING }, leadScore: { type: Type.NUMBER }, assetGrade: { type: Type.STRING, enum: ["A", "B", "C"] }, socialGap: { type: Type.STRING }, visualProof: { type: Type.STRING }, bestAngle: { type: Type.STRING }, personalizedHook: { type: Type.STRING } }, required: ["businessName", "assetGrade", "leadScore", "socialGap"] } }, rubric: { type: Type.OBJECT, properties: { visual: {type: Type.STRING}, social: {type: Type.STRING}, highTicket: {type: Type.STRING}, reachability: {type: Type.STRING}, grades: { type: Type.OBJECT, properties: { A: {type: Type.STRING}, B: {type: Type.STRING}, C: {type: Type.STRING} } } } }, assets: { type: Type.OBJECT, properties: { emailOpeners: {type: Type.ARRAY, items: {type: Type.STRING}}, fullEmail: {type: Type.STRING}, callOpener: {type: Type.STRING}, voicemail: {type: Type.STRING}, smsFollowup: {type: Type.STRING} } } } } }
  });
  const result = JSON.parse(text || "{}");
  if (result.leads) result.leads = result.leads.map((l: any, i: number) => ({ ...l, businessName: l.businessName && l.businessName !== "UNIDENTIFIED_TARGET" ? l.businessName : `High-Value Prospect ${i+1}`, id: `gen-${Date.now()}-${i}` }));
  return result;
};

export const identifySubRegions = async (theater: string): Promise<string[]> => {
  const text = await loggedGenerateContent({
    ai: getAI(), module: "AUTO_CRAWL", model: "gemini-3-flash-preview", modelClass: "FLASH",
    reasoningDepth: "LOW", isClientFacing: true, contents: `Identify 6 commercial districts in "${theater}". JSON Array string.`, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
  });
  return JSON.parse(text || "[]");
};

export const crawlTheaterSignals = async (subRegion: string, signal: string): Promise<Lead[]> => {
  pushLog(`CRAWLING SUB-SECTOR: ${subRegion} for ${signal}`);
  const prompt = `Find 5 REAL businesses in "${subRegion}" matching signal: "${signal}". JSON required.`;
  const text = await loggedGenerateContent({
    ai: getAI(), module: "AUTO_CRAWL", model: "gemini-3-flash-preview", modelClass: "FLASH",
    reasoningDepth: "LOW", isClientFacing: true, contents: prompt, config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { businessName: { type: Type.STRING }, niche: { type: Type.STRING }, city: { type: Type.STRING }, assetGrade: { type: Type.STRING, enum: ["A", "B", "C"] }, vulnerabilityContext: { type: Type.STRING }, websiteUrl: { type: Type.STRING } }, required: ["businessName", "niche", "city", "assetGrade"] } } }
  });
  const rawLeads = JSON.parse(text || "[]");
  return rawLeads.map((l: any, i: number) => ({ id: `CRAWL-${subRegion.replace(/\s/g, '')}-${Date.now()}-${i}`, rank: i + 1, status: 'cold', businessName: l.businessName || "Unknown Target", niche: l.niche || "General", city: l.city || subRegion, assetGrade: l.assetGrade || "C", socialGap: l.vulnerabilityContext || signal, websiteUrl: l.websiteUrl || "#", leadScore: Math.floor(Math.random() * (95 - 75) + 75), visualProof: "Pending scan...", bestAngle: "Pending analysis...", personalizedHook: "Pending synthesis...", phone: "Pending...", email: "Pending..." }));
};

export const fetchViralPulseData = async (niche: string): Promise<any[]> => {
  const text = await loggedGenerateContent({
    ai: getAI(), module: "VIRAL_PULSE", model: "gemini-3-flash-preview", modelClass: "FLASH",
    reasoningDepth: "LOW", isClientFacing: true, contents: `Trending topics for ${niche}. JSON [{label, val, type}].`, config: { tools: [{ googleSearch: {} }] }
  });
  return extractJSON(text || "[]") || [];
};

export const fetchTokenStats = async (): Promise<any> => ({ balance: 4250000, consumed: 1420500, recentOps: [{ id: 'T-99', cost: 1200, op: 'VEO_FORGE' }, { id: 'T-98', cost: 450, op: 'RADAR_SCAN' }] });
export const fetchBillingStats = async (): Promise<any> => ({ tokenUsage: 1420500, estimatedCost: 12.45, projectedRevenueLift: 154000, activeTheaters: 4 });

export const testModelPerformance = async (modelName: string, prompt: string): Promise<string> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "MODEL_TEST", model: modelName, modelClass: "OTHER", reasoningDepth: "LOW", isClientFacing: false, contents: prompt });
  return text || "No response."; 
};

export const translateTactical = async (text: string, targetLang: string): Promise<string> => { 
  const res = await loggedGenerateContent({ ai: getAI(), module: "TRANSLATOR", model: "gemini-3-flash-preview", modelClass: "FLASH", reasoningDepth: "LOW", isClientFacing: true, contents: `Translate: ${text} to ${targetLang}` });
  if (res) saveAsset('TEXT', `TRANSLATION_${targetLang}`, res, 'TRANSLATOR');
  return res || "Failed."; 
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string): Promise<any[]> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "AI_CONCIERGE", model: "gemini-3-flash-preview", modelClass: "FLASH", reasoningDepth: "LOW", isClientFacing: true, contents: `Chat scenario for ${lead.businessName}. Return JSON [{role, text}].` });
  return extractJSON(text || "[]") || []; 
};

export const generateMotionLabConcept = async (lead: Lead): Promise<any> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "MOTION_LAB", model: "gemini-3-flash-preview", modelClass: "FLASH", reasoningDepth: "MEDIUM", isClientFacing: true, contents: `Storyboard for ${lead.businessName}. Return JSON {title, hook, scenes:[{time, visual, text}]}.` });
  const json = extractJSON(text || "{}") || {}; 
  if (json.hook) saveAsset('TEXT', `STORYBOARD_${lead.businessName}`, `TITLE: ${json.title}\nHOOK: ${json.hook}`, 'MOTION_LAB', lead.id);
  return json;
};

export const generateFlashSparks = async (lead: Lead): Promise<string[]> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "FLASH_SPARK", model: "gemini-3-flash-preview", modelClass: "FLASH", reasoningDepth: "LOW", isClientFacing: true, contents: `6 hooks for ${lead.businessName}. Return JSON array strings.` });
  const data = extractJSON(text || "[]") || []; 
  if (data.length) saveAsset('TEXT', `SPARKS_${lead.businessName}`, data.join('\n'), 'FLASH_SPARK', lead.id);
  return data;
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number): Promise<string> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "DEMO_SANDBOX", model: "gemini-3-pro-preview", modelClass: "PRO", reasoningDepth: "HIGH", isClientFacing: true, contents: `ROI for ${lead.businessName} (LTV:${ltv}, Vol:${volume}).`, config: { thinkingConfig: { thinkingBudget: 16000 } } });
  if (text) saveAsset('TEXT', `SIMULATION_${lead.businessName}`, text, 'DEMO_SANDBOX', lead.id);
  return text || "Error."; 
};

export const performFactCheck = async (lead: Lead, claim: string): Promise<any> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "FACT_CHECK", model: "gemini-3-flash-preview", modelClass: "FLASH", reasoningDepth: "MEDIUM", isClientFacing: true, contents: `Fact check "${claim}" for ${lead.businessName}. Return JSON {status, evidence, sources: [{title, uri}]}.`, config: { tools: [{ googleSearch: {} }] } });
  return extractJSON(text || "{}") || {}; 
};

export const synthesizeProduct = async (lead: Lead): Promise<any> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "PRODUCT_SYNTH", model: "gemini-3-pro-preview", modelClass: "PRO", reasoningDepth: "HIGH", isClientFacing: true, contents: `Product for ${lead.businessName}. Return JSON {productName, tagline, pricePoint, features: []}.`, config: { thinkingConfig: { thinkingBudget: 16000 } } });
  const data = extractJSON(text || "{}") || {}; 
  if (data.productName) saveAsset('TEXT', `PRODUCT_${lead.businessName}`, `NAME: ${data.productName}\nTAG: ${data.tagline}\nPRICE: ${data.pricePoint}`, 'PRODUCT_SYNTH', lead.id);
  return data;
};

export const generatePitch = async (lead: Lead): Promise<string> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "PITCH_GEN", model: "gemini-3-pro-preview", modelClass: "PRO", reasoningDepth: "MEDIUM", isClientFacing: true, contents: `30s pitch for ${lead.businessName}.`, config: { thinkingConfig: { thinkingBudget: 16000 } } });
  if (text) saveAsset('TEXT', `PITCH_${lead.businessName}`, text, 'PITCH_GEN', lead.id);
  return text || "Error."; 
};

export const generateProposalDraft = async (lead: Lead): Promise<string> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "PROPOSALS", model: "gemini-3-pro-preview", modelClass: "PRO", reasoningDepth: "HIGH", isClientFacing: true, contents: `Proposal for ${lead.businessName}.`, config: { thinkingConfig: { thinkingBudget: 32000 } } });
  if (text) saveAsset('TEXT', `PROPOSAL_${lead.businessName}`, text, 'PROPOSALS', lead.id);
  return text || "Error."; 
};

export const generateMockup = async (businessName: string, niche: string, leadId?: string): Promise<string> => { 
  const ai = getAI(); 
  try {
    const resp = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ text: `4k website mockup for ${businessName} (${niche})` }] } 
    });
    const part = resp.candidates?.[0]?.content?.parts?.find(p => p.inlineData); 
    const data = part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : "";
    
    await logAiOperation({
        logId: uuidLike(), timestamp: new Date().toISOString(), userId: "anonymous", userRole: "FOUNDER", module: "MOCKUPS_4K", isClientFacing: true, model: "gemini-2.5-flash-image", modelClass: "FLASH", reasoningDepth: "LOW", moduleWeight: getModuleWeight("MOCKUPS_4K"), effectiveWeight: getModuleWeight("MOCKUPS_4K"), latencyMs: 0, status: "SUCCESS"
    });
    
    if (data) saveAsset('IMAGE', `MOCKUP_${businessName}`, data, 'MOCKUPS_4K', leadId);
    return data;
  } catch (e) { console.error(e); return ""; }
};

export const generateVideoPayload = async (prompt: string, leadId?: string): Promise<string> => { 
  const ai = getAI(); 
  let op = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt }); 
  
  logAiOperation({
    logId: uuidLike(), timestamp: new Date().toISOString(), userId: "anonymous", userRole: "FOUNDER", module: "VIDEO_PITCH", isClientFacing: true, model: "veo-3.1-fast-generate-preview", modelClass: "PRO", reasoningDepth: "HIGH", moduleWeight: getModuleWeight("VIDEO_AI"), effectiveWeight: getModuleWeight("VIDEO_AI"), latencyMs: 0, status: "SUCCESS"
  });

  while (!op.done) { 
    await new Promise(r => setTimeout(r, 10000)); 
    op = await ai.operations.getVideosOperation({ operation: op }); 
  } 
  const url = (op.response?.generatedVideos?.[0]?.video?.uri ?? '') + `&key=${process.env.API_KEY}`;
  if (url) saveAsset('VIDEO', `VEO_PAYLOAD_${Date.now()}`, url, 'VIDEO_PITCH', leadId);
  return url; 
};

export const generateAudioPitch = async (text: string, voice: string = 'Kore', leadId?: string): Promise<string> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text }] }], 
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } 
  });
  
  logAiOperation({
    logId: uuidLike(), timestamp: new Date().toISOString(), userId: "anonymous", userRole: "FOUNDER", module: "SONIC_STUDIO", isClientFacing: true, model: "gemini-2.5-flash-preview-tts", modelClass: "FLASH", reasoningDepth: "LOW", moduleWeight: getModuleWeight("SONIC_STUDIO"), effectiveWeight: getModuleWeight("SONIC_STUDIO"), latencyMs: 0, status: "SUCCESS"
  });

  // RAW PCM 24kHz Mono
  const pcmBase64 = resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  if (!pcmBase64) throw new Error("Audio generation failed: No data returned.");

  // Convert raw PCM to WAV container for browser playback using async blob approach
  const dataUri = await pcmToWavDataUri(pcmBase64, 24000);

  // Save playable WAV to vault
  if (dataUri) saveAsset('AUDIO', `SONIC_PITCH_${Date.now()}`, dataUri, 'SONIC_STUDIO', leadId);
  
  return dataUri; 
};

export const generateTaskMatrix = async (lead: Lead): Promise<any[]> => { 
  const text = await loggedGenerateContent({ ai: getAI(), module: "TASKS", model: "gemini-3-flash-preview", modelClass: "FLASH", reasoningDepth: "LOW", isClientFacing: true, contents: `Tasks for ${lead.businessName}. Return JSON [{id, task, status}].` });
  return extractJSON(text || "[]") || []; 
};

export const analyzeVisual = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  pushLog("ANALYZING VISUAL ASSET...");
  const text = await loggedGenerateContent({
    ai: getAI(), module: "VISION_LAB", model: "gemini-3-pro-preview", modelClass: "PRO", reasoningDepth: "MEDIUM", isClientFacing: true, contents: { parts: [ { inlineData: { mimeType, data: base64Data } }, { text: `ACT AS A SENIOR DATA ANALYST. ${prompt}` } ] }
  });
  return text || "Visual analysis failed.";
};

export const generateVisual = async (prompt: string, leadId?: string): Promise<string> => {
  pushLog("GENERATING ASSET (IMAGEN)...");
  const ai = getAI();
  const model = "gemini-2.5-flash-image";
  try {
      const response = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } });
      logAiOperation({
        logId: uuidLike(), timestamp: new Date().toISOString(), userId: "anonymous", userRole: "FOUNDER", module: "VISUAL_STUDIO", isClientFacing: true, model, modelClass: "FLASH", reasoningDepth: "LOW", moduleWeight: getModuleWeight("VISUAL_STUDIO"), effectiveWeight: getModuleWeight("VISUAL_STUDIO"), latencyMs: 0, status: "SUCCESS"
      });
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData?.data) {
        const url = `data:image/png;base64,${part.inlineData.data}`;
        saveAsset('IMAGE', `VISUAL_${Date.now()}`, url, 'VISUAL_STUDIO', leadId);
        return url;
      }
      throw new Error("No image data returned");
  } catch(e) { console.error(e); return ""; }
};

export const analyzeVideoUrl = async (url: string, prompt: string, leadId?: string): Promise<string> => {
  pushLog(`ANALYZING VIDEO URL: ${url}`);
  const text = await loggedGenerateContent({
    ai: getAI(), module: "CINEMA_INTEL", model: "gemini-3-pro-preview", modelClass: "PRO", reasoningDepth: "HIGH", isClientFacing: true, contents: `Analyze this video URL: ${url}. \n\nMission: ${prompt}\n\nUse Google Search Grounding to find metadata, transcripts, or summaries of this video to perform the analysis.`, config: { tools: [{ googleSearch: {} }] }
  });
  if (text) saveAsset('TEXT', `VIDEO_ANALYSIS_${Date.now()}`, text, 'CINEMA_INTEL', leadId);
  return text || "Video analysis unavailable.";
};

export const generateAgencyIdentity = async (niche: string, region: string): Promise<any> => {
  pushLog(`FORGING AGENCY IDENTITY FOR ${niche} IN ${region}`);
  const text = await loggedGenerateContent({
    ai: getAI(), module: "IDENTITY", model: "gemini-3-flash-preview", modelClass: "FLASH", reasoningDepth: "LOW", isClientFacing: true, contents: `Create a high-end, futuristic AI Agency Brand Identity targeting ${niche} in ${region}. Return valid JSON: { "name": "Name", "tagline": "Tagline", "manifesto": "Short manifesto", "colors": ["Hex1", "Hex2"] }`, config: { responseMimeType: "application/json" }
  });
  return JSON.parse(text || "{}");
};

export const generatePlaybookStrategy = async (theater: string): Promise<any> => {
  pushLog(`ARCHITECTING PLAYBOOK FOR ${theater}`);
  const text = await loggedGenerateContent({
    ai: getAI(), module: "PLAYBOOK", model: "gemini-3-pro-preview", modelClass: "PRO", reasoningDepth: "HIGH", isClientFacing: true, contents: `Write a 3-step high-ticket AI sales playbook for the ${theater} market. Return valid JSON: { "strategyName": "Title", "steps": [{ "title": "Step 1", "tactic": "Detail" }, ...] }`, config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 8000 } }
  });
  return JSON.parse(text || "{}");
};

export const generateAffiliateProgram = async (niche: string): Promise<any> => {
  pushLog(`ARCHITECTING AFFILIATE MATRIX FOR ${niche}`);
  const text = await loggedGenerateContent({
    ai: getAI(), module: "AFFILIATE", model: "gemini-3-flash-preview", modelClass: "FLASH", reasoningDepth: "LOW", isClientFacing: true, contents: `Create a 3-tier Affiliate Partner Structure for an AI agency in the ${niche} niche. Return valid JSON: { "programName": "Name", "tiers": [{ "name": "Tier 1", "commission": "10%", "requirement": "Requirement" }], "recruitScript": "Short email to recruit partners" }`, config: { responseMimeType: "application/json" }
  });
  return JSON.parse(text || "{}");
};
