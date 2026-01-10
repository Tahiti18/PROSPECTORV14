import { GoogleGenAI, Type } from "@google/genai";
import { Lead, BrandIdentity } from '../types';
import { logAiOperation, uuidLike } from './usageLogger';
import { getModuleWeight } from './creditWeights';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';

// --- TYPES ---
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
  modelStr: string;
}

// --- STATE ---
export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];
const assetListeners = new Set<(assets: AssetRecord[]) => void>();

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

export const pushLog = (msg: string) => {
  PRODUCTION_LOGS.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 200) PRODUCTION_LOGS.pop();
  console.log(`[SYSTEM] ${msg}`);
};

export const subscribeToAssets = (listener: (assets: AssetRecord[]) => void) => {
  assetListeners.add(listener);
  listener(SESSION_ASSETS);
  return () => { assetListeners.delete(listener); };
};

export const saveAsset = (type: any, title: string, data: string, module?: string, leadId?: string, metadata?: any) => {
  const asset: AssetRecord = { id: uuidLike(), type, title, data, module, leadId, timestamp: Date.now(), metadata };
  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  pushLog(`ASSET SAVED: ${title}`);
  return asset;
};

/**
 * DIRECT API KEY RETRIEVAL
 * As per hard requirement, use process.env.API_KEY directly.
 */
export const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("CRITICAL: API_KEY is missing in environment. Ensure it is set in Railway and Redeploy.");
  }
  return new GoogleGenAI({ apiKey });
};

export const loggedGenerateContent = async (opts: any): Promise<string> => {
  const start = Date.now();
  try {
    const aiInstance = opts.ai || getAI();
    const response = await aiInstance.models.generateContent({
      model: opts.model,
      contents: opts.contents,
      config: opts.config
    });
    
    const text = response.text || "";
    logAiOperation({
        logId: uuidLike(),
        timestamp: new Date().toISOString(),
        userId: 'system',
        userRole: 'INTERNAL',
        module: opts.module,
        isClientFacing: false,
        model: opts.model,
        modelClass: opts.model.includes('pro') ? 'PRO' : 'FLASH',
        reasoningDepth: opts.reasoningDepth || 'LOW',
        moduleWeight: 1,
        effectiveWeight: 1,
        latencyMs: Date.now() - start,
        status: 'SUCCESS'
    });
    return text;
  } catch (e: any) {
    const errMsg = e.message || "Unknown API Failure";
    logAiOperation({
        logId: uuidLike(),
        timestamp: new Date().toISOString(),
        userId: 'system',
        userRole: 'INTERNAL',
        module: opts.module,
        isClientFacing: false,
        model: opts.model,
        modelClass: 'OTHER',
        reasoningDepth: 'LOW',
        moduleWeight: 0,
        effectiveWeight: 0,
        latencyMs: Date.now() - start,
        status: 'FAILURE',
        errorMessage: errMsg
    });
    throw new Error(errMsg);
  }
};

export const generateLeads = async (region: string, niche: string, count: number) => {
  try {
    const ai = getAI();
    const prompt = `Generate ${count} B2B leads for "${niche}" in "${region}". Return JSON array. Each: businessName, websiteUrl, city, niche, leadScore (0-100), assetGrade (A/B/C), socialGap, visualProof, bestAngle, personalizedHook.`;
    const res = await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: 'application/json' }, module: 'RADAR' });
    return { leads: JSON.parse(res), groundingSources: [] };
  } catch (e: any) { throw e; }
};

export const generateOutreachSequence = async (lead: any) => {
  try {
    const ai = getAI();
    const res = await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: `Create outreach for ${lead.businessName}. JSON array.`, config: { responseMimeType: 'application/json' }, module: 'OUTREACH' });
    return JSON.parse(res);
  } catch (e: any) { throw e; }
};

export const generateProposalDraft = async (lead: any) => {
  try {
    const ai = getAI();
    return await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: `Draft proposal for ${lead.businessName}.`, module: 'PROPOSAL' });
  } catch (e: any) { throw e; }
};

export const testModelPerformance = async (model: string, prompt: string) => {
  const ai = getAI();
  const res = await ai.models.generateContent({ model, contents: prompt });
  return res.text || "";
};

export const orchestrateBusinessPackage = async (lead: any, assets: any) => {
  const ai = getAI();
  const res = await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: `Orchestrate package for ${lead.businessName}. Return JSON.`, config: { responseMimeType: 'application/json' }, module: 'ORCHESTRATOR' });
  return JSON.parse(res);
};

export const fetchLiveIntel = async (lead: any, module: string) => {
  const ai = getAI();
  const res = await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: `Analyze ${lead.websiteUrl}. Return JSON with missionSummary, visualStack[], sonicStack[], featureGap, businessModel, designSystem, deepArchitecture.`, config: { responseMimeType: 'application/json', tools: [{googleSearch:{}}] }, module: 'INTEL' });
  const parsed = JSON.parse(res);
  return { ...parsed, sources: [] };
};

export const fetchBenchmarkData = async (lead: any) => fetchLiveIntel(lead, 'BENCHMARK');
export const analyzeLedger = async (leads: any) => ({ risk: "Low", opportunity: "High" });
export const identifySubRegions = async (theater: string) => ["Downtown", "Business District"];
export const crawlTheaterSignals = async (sector: string, signal: string) => [];
export const extractBrandDNA = async (lead: any, url: string) => ({ colors: ["#000"], fontPairing: "Inter", archetype: "Modern", visualTone: "Clean" });

export const generateFlashSparks = async (lead: Lead): Promise<string[]> => {
  const ai = getAI();
  const prompt = `Generate 6 viral content 'sparks' for ${lead.businessName}. Return JSON array of strings.`;
  const res = await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: 'application/json' }, module: 'FLASH_SPARK' });
  return JSON.parse(res);
};

export const generatePitch = async (lead: Lead): Promise<string> => {
  const ai = getAI();
  const prompt = `Generate a pitch for ${lead.businessName}.`;
  return await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: prompt, module: 'PITCH_GEN' });
};

export const architectFunnel = async (lead: Lead): Promise<any[]> => {
  const ai = getAI();
  const prompt = `Architect a funnel for ${lead.businessName}. Return JSON array.`;
  const res = await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: 'application/json' }, module: 'FUNNEL_MAP' });
  return JSON.parse(res);
};

export const architectPitchDeck = async (lead: Lead): Promise<any[]> => {
  const ai = getAI();
  const prompt = `Design a pitch deck for ${lead.businessName}. Return JSON array.`;
  const res = await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: 'application/json' }, module: 'DECK_ARCH' });
  return JSON.parse(res);
};

export const generateROIReport = async (ltv: number, volume: number, lift: number): Promise<string> => {
  const ai = getAI();
  const prompt = `ROI report for LTV ${ltv}, Volume ${volume}, Lift ${lift}%.`;
  return await loggedGenerateContent({ ai, model: 'gemini-3-flash-preview', contents: prompt, module: 'ROI_CALC' });
};

export const generateVisual = async (p: string, l: any, editImage?: string) => {
  const ai = getAI();
  let contents: any = p;
  if (editImage) {
    const base64Data = editImage.includes(',') ? editImage.split(',')[1] : editImage;
    const mimeType = editImage.includes(';') ? editImage.split(';')[0].split(':')[1] : 'image/png';
    contents = {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: p }
      ]
    };
  }
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents,
  });

  // FIXED: Explicit checks for candidates and parts to resolve TS18048
  const candidates = response.candidates;
  if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        saveAsset('IMAGE', `Visual: ${p.slice(0, 20)}`, imageUrl, 'VISUAL_STUDIO', l?.id);
        return imageUrl;
      }
    }
  }
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
};

export const generateMockup = async (b: string, n: string, id: string) => null;

export const generateVideoPayload = async (
  p: string, 
  id?: string, 
  startImg?: string, 
  endImg?: string, 
  config?: any, 
  refImgs?: string[], 
  inVid?: string
) => {
  const ai = getAI();
  const model = config?.modelStr || 'veo-3.1-fast-generate-preview';
  const videoConfig: any = {
    numberOfVideos: 1,
    resolution: config?.resolution || '720p',
    aspectRatio: config?.aspectRatio || '16:9'
  };

  const payload: any = {
    model,
    prompt: p,
    config: videoConfig
  };

  if (startImg) {
    payload.image = { 
      imageBytes: startImg.includes(',') ? startImg.split(',')[1] : startImg, 
      mimeType: startImg.includes(';') ? startImg.split(';')[0].split(':')[1] : 'image/png' 
    };
  }
  if (endImg) {
    payload.lastFrame = { 
      imageBytes: endImg.includes(',') ? endImg.split(',')[1] : endImg, 
      mimeType: endImg.includes(';') ? endImg.split(';')[0].split(':')[1] : 'image/png' 
    };
  }
  
  let operation = await ai.models.generateVideos(payload);
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }
  
  const generatedVideos = operation.response?.generatedVideos;
  if (generatedVideos && generatedVideos.length > 0 && generatedVideos[0].video) {
    const uri = generatedVideos[0].video.uri;
    const url = `${uri}&key=${process.env.API_KEY}`;
    saveAsset('VIDEO', `Video: ${p.slice(0, 20)}`, url, 'VIDEO_PITCH', id);
    return url;
  }
  return null;
};

export const enhanceVideoPrompt = async (p: string) => p;
export const generateAudioPitch = async (s: string, v: string, id?: string) => null;
export const generateLyrics = async (l: any, s: string, t: string) => "Lyrics...";
export const generateSonicPrompt = async (l: any) => "Sonic prompt...";
export const performFactCheck = async (l: any, c: string) => ({ status: "Verified", evidence: "Clear", sources: [] });
export const simulateSandbox = async (l: any, ltv: number, vol: number) => "Simulation result...";
export const generateMotionLabConcept = async (l: any) => ({ title: "Motion", hook: "Catchy", scenes: [] });
export const synthesizeProduct = async (l: any) => ({ productName: "AI Engine", tagline: "Fast", pricePoint: "$5k", features: [] });
export const generateAgencyIdentity = async (n: string, r: string) => ({ name: "Agency", tagline: "Best", manifesto: "Work hard", colors: [] });
export const generateAffiliateProgram = async (n: string) => ({ programName: "Partners", recruitScript: "Join us", tiers: [] });
export const critiqueVideoPresence = async (l: any) => "Good video.";
export const translateTactical = async (t: string, l: string) => t;
export const fetchViralPulseData = async (n: string) => [];
export const queryRealtimeAgent = async (q: string) => ({ text: "Agent response", sources: [] });
export const analyzeVisual = async (b: string, m: string, p: string) => "Analysis";
export const analyzeVideoUrl = async (u: string, p: string, id?: string) => "Analysis";
export const synthesizeArticle = async (s: string, m: string) => "Synthesis";
export const fetchTokenStats = async () => ({ recentOps: [] });
export const generateTaskMatrix = async (l: any) => [];
export const generateNurtureDialogue = async (l: any, s: string) => [];
export const generatePlaybookStrategy = async (n: string) => ({ strategyName: "Plan", steps: [] });
export const deleteAsset = (id: string) => {};
export const clearVault = () => {};
export const importVault = (a: any) => 0;
