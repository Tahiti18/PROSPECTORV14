import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from '../types';

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

export const saveAsset = (type: any, title: string, data: string, module?: string, leadId?: string, metadata?: any) => {
  const asset: AssetRecord = { id: uuidLike(), type, title, data, module, leadId, timestamp: Date.now(), metadata };
  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return asset;
};

/**
 * MANDATORY AI STUDIO KEY BRIDGE
 * Ensures the user has selected a valid key from a paid GCP project.
 */
const ensureKeySelected = async () => {
  // @ts-ignore - access the AI Studio global bridge
  if (typeof window !== 'undefined' && window.aistudio) {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      pushLog("API_KEY_MISSING: Prompting for key selection...");
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Proceed immediately as per instructions
    }
  }
};

/**
 * Robust instance creator
 */
export const getAI = async () => {
  await ensureKeySelected();
  // Strictly use process.env.API_KEY as required
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

// --- CORE SERVICE FUNCTIONS ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  const ai = await getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate ${count} B2B leads for "${niche}" in "${region}". Return JSON array. Each: businessName, websiteUrl, city, niche, leadScore (0-100), assetGrade (A/B/C), socialGap, visualProof, bestAngle, personalizedHook.`,
      config: { responseMimeType: 'application/json' }
    });
    return { leads: JSON.parse(response.text || "[]"), groundingSources: [] };
  } catch (e: any) {
    if (e.message?.includes("Requested entity was not found")) {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.aistudio) await window.aistudio.openSelectKey();
    }
    throw e;
  }
};

export const fetchLiveIntel = async (lead: any, module: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze ${lead.websiteUrl}. Return JSON with missionSummary, visualStack[], sonicStack[], featureGap, businessModel, designSystem, deepArchitecture.`,
    config: { 
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }] 
    }
  });
  const parsed = JSON.parse(response.text || "{}");
  return { ...parsed, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const generateVisual = async (p: string, l: any, editImage?: string) => {
  const ai = await getAI();
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

  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData) {
        const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        saveAsset('IMAGE', `Visual: ${p.slice(0, 20)}`, imageUrl, 'VISUAL_STUDIO', l?.id);
        return imageUrl;
      }
    }
  }
  return null;
};

export const generateVideoPayload = async (
  prompt: string, 
  id?: string, 
  startImg?: string, 
  endImg?: string, 
  config?: VeoConfig,
  referenceImages?: string[],
  inputVideo?: string
) => {
  const ai = await getAI();
  
  const videoConfig: any = {
    numberOfVideos: 1,
    resolution: config?.resolution || '720p',
    aspectRatio: config?.aspectRatio || '16:9'
  };

  const isMultiRef = referenceImages && referenceImages.length > 0;
  const model = isMultiRef ? 'veo-3.1-generate-preview' : (config?.modelStr || 'veo-3.1-fast-generate-preview');

  const payload: any = {
    model,
    prompt,
    config: videoConfig
  };

  if (startImg) {
    payload.image = { 
      imageBytes: startImg.includes(',') ? startImg.split(',')[1] : startImg, 
      mimeType: startImg.includes(';') ? startImg.split(';')[0].split(':')[1] : 'image/png' 
    };
  }

  try {
    let operation = await ai.models.generateVideos(payload);
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }
    
    const videos = operation.response?.generatedVideos;
    if (videos && videos.length > 0 && videos[0].video) {
      const uri = videos[0].video.uri;
      const url = `${uri}&key=${process.env.API_KEY}`;
      saveAsset('VIDEO', `Video: ${prompt.slice(0, 20)}`, url, 'VIDEO_PITCH', id);
      return url;
    }
  } catch (e: any) {
    if (e.message?.includes("Requested entity was not found")) {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.aistudio) await window.aistudio.openSelectKey();
    }
    throw e;
  }
  return null;
};

export const generateAudioPitch = async (text: string, voice: string, leadId?: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData?.data) {
    const audioUrl = `data:audio/pcm;base64,${part.inlineData.data}`;
    saveAsset('AUDIO', `Audio: ${text.slice(0, 20)}`, audioUrl, 'SONIC_STUDIO', leadId);
    return audioUrl;
  }
  return null;
};

// --- STUBS & UTILS ---
export const loggedGenerateContent = async (opts: any) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({ model: opts.model, contents: opts.contents, config: opts.config });
  return res.text || "";
};

export const fetchBenchmarkData = async (lead: any) => fetchLiveIntel(lead, 'BENCHMARK');
export const analyzeLedger = async (leads: any) => ({ risk: "Low", opportunity: "High" });
export const identifySubRegions = async (theater: string) => ["Downtown", "Business District"];
export const crawlTheaterSignals = async (sector: string, signal: string) => [];
export const extractBrandDNA = async (lead: any, url: string) => ({ colors: ["#000"], fontPairing: "Inter", archetype: "Modern", visualTone: "Clean" });
export const generateFlashSparks = async (lead: Lead) => ["Spark 1", "Spark 2"];
export const generatePitch = async (lead: Lead) => "Strategic pitch content...";
export const architectFunnel = async (lead: Lead) => [];
export const architectPitchDeck = async (lead: Lead) => [];
export const generateROIReport = async (l: number, v: number, conv: number) => "ROI Summary...";
export const orchestrateBusinessPackage = async (l: Lead, a: any[]) => ({ presentation: { title: "Strategy", slides: [] }, narrative: "Narrative", contentPack: [], outreach: { emailSequence: [] } });
export const generateOutreachSequence = async (l: Lead) => [];
export const generateProposalDraft = async (l: Lead) => "Draft...";
export const generateTaskMatrix = async (l: Lead) => [];
export const generateNurtureDialogue = async (l: Lead, s: string) => [];
export const generatePlaybookStrategy = async (n: string) => ({ strategyName: "Plan", steps: [] });
export const performFactCheck = async (l: Lead, c: string) => ({ status: "Verified", evidence: "Evidence", sources: [] });
export const simulateSandbox = async (l: Lead, ltv: number, vol: number) => "Simulation result...";
export const generateMotionLabConcept = async (l: Lead) => ({ title: "Concept", hook: "Hook", scenes: [] });
export const synthesizeProduct = async (l: Lead) => ({ productName: "Product", tagline: "Tag", pricePoint: "$100", features: [] });
export const generateAgencyIdentity = async (n: string, r: string) => ({ name: "Agency", tagline: "Tag", manifesto: "Manifesto", colors: ["#000"] });
export const generateAffiliateProgram = async (n: string) => ({ programName: "Partners", recruitScript: "Script", tiers: [] });
export const critiqueVideoPresence = async (l: Lead) => "Critique...";
export const translateTactical = async (t: string, l: string) => t;
export const fetchViralPulseData = async (n: string) => [];
export const queryRealtimeAgent = async (q: string) => ({ text: "Response", sources: [] });
export const analyzeVisual = async (b: string, m: string, p: string) => "Analysis...";
export const analyzeVideoUrl = async (u: string, p: string, id?: string) => "Analysis...";
export const synthesizeArticle = async (s: string, m: string) => "Synthesis...";
export const fetchTokenStats = async () => ({ recentOps: [] });
export const testModelPerformance = async (m: string, p: string) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({ model: m, contents: p });
  return res.text || "";
};
export const enhanceVideoPrompt = async (p: string) => p;
export const generateLyrics = async (l: any, p: string, t: string) => "Lyrics...";
export const generateSonicPrompt = async (l: any) => "Sonic prompt...";
export const generateMockup = async (b: string, n: string, id?: string) => null;
export const deleteAsset = (id: string) => {};
export const clearVault = () => {};
export const importVault = (a: any) => 0;
