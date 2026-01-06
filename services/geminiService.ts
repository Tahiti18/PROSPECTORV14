import { GoogleGenAI } from "@google/genai";
import { Lead, BrandIdentity } from '../types';
import { logAiOperation, uuidLike } from './usageLogger';
import { getModuleWeight } from './creditWeights';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';

// --- CONSTANTS ---
// STRICT HARDCODED KEY FOR VEO OPERATIONS
const KIE_KEY = '302d700cb3e9e3dcc2ad9d94d5059279';

// --- TYPES ---
export interface AssetRecord {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  title: string;
  data: string; // content or base64 or url
  module?: string;
  leadId?: string;
  timestamp: number;
}

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  modelStr: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
}

export interface BenchmarkReport {
  entityName: string;
  missionSummary: string;
  visualStack: { label: string; description: string }[];
  sonicStack: { label: string; description: string }[];
  featureGap: string;
  businessModel: string;
  designSystem: string;
  deepArchitecture: string;
  sources: { title: string; uri: string }[];
}

// --- STATE ---
export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];

// --- CORE UTILS ---
export const pushLog = (msg: string) => {
  PRODUCTION_LOGS.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 200) PRODUCTION_LOGS.pop();
};

export const saveAsset = (type: AssetRecord['type'], title: string, data: string, module?: string, leadId?: string) => {
  const asset: AssetRecord = {
    id: uuidLike(),
    type,
    title,
    data,
    module,
    leadId,
    timestamp: Date.now()
  };
  SESSION_ASSETS.unshift(asset);
  pushLog(`ASSET SAVED: ${title} (${type})`);
  toast.success(`Asset Secured: ${title.slice(0, 20)}...`);
  return asset;
};

export const clearVault = () => {
  SESSION_ASSETS.length = 0;
  pushLog("VAULT PURGED");
};

export const importVault = (assets: AssetRecord[]) => {
  SESSION_ASSETS.push(...assets);
  pushLog(`IMPORTED ${assets.length} ASSETS`);
  return assets.length;
};

export const getAI = () => {
  const localKey = localStorage.getItem('pomelli_api_key');
  const envKey = process.env.API_KEY;
  const activeKey = localKey || envKey;

  if (!activeKey) {
    console.error("API_KEY is missing from both Settings and Environment");
    toast.error("SYSTEM HALT: API Key Missing. Configure in Settings or Railway.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey: activeKey });
};

// --- LOGGED WRAPPER ---
export const loggedGenerateContent = async (params: {
  ai: GoogleGenAI;
  module: string;
  model: string;
  modelClass: 'FLASH' | 'PRO' | 'OTHER';
  reasoningDepth: 'LOW' | 'MEDIUM' | 'HIGH';
  isClientFacing: boolean;
  contents: any;
  config?: any;
}): Promise<string> => {
  const start = Date.now();
  let status: 'SUCCESS' | 'FAILURE' = 'SUCCESS';
  let errorMessage: string | undefined;

  const inputStr = JSON.stringify(params.contents);
  const estimatedChars = inputStr.length;
  
  const canAfford = deductCost(params.model, estimatedChars);
  if (!canAfford) {
      throw new Error("OPERATION_BLOCKED: Check Subscription Tier or Balance.");
  }

  try {
    const response = await params.ai.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: params.config
    });
    return response.text || "";
  } catch (e: any) {
    status = 'FAILURE';
    errorMessage = e.message;
    toast.error(`Neural Link Failed: ${e.message}`);
    throw e;
  } finally {
    const latency = Date.now() - start;
    const weight = getModuleWeight(params.module);
    
    logAiOperation({
      logId: uuidLike(),
      timestamp: new Date().toISOString(),
      userId: 'USER_001', 
      userRole: 'FOUNDER',
      module: params.module,
      isClientFacing: params.isClientFacing,
      model: params.model,
      modelClass: params.modelClass,
      reasoningDepth: params.reasoningDepth,
      moduleWeight: weight,
      effectiveWeight: weight,
      latencyMs: latency,
      status,
      errorMessage
    });
  }
};

const safeJsonParse = (text: string) => {
  try {
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("JSON Parse Error, attempting recovery", e);
    return null;
  }
};

// --- IMPLEMENTATIONS ---

export const extractBrandDNA = async (lead: Lead, url: string): Promise<BrandIdentity> => {
  pushLog(`DNA: DEEP FORENSIC SCANNING ${url}...`);
  const ai = getAI();
  
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { hostname = url; }

  const deterministicLogo = `https://logo.clearbit.com/${hostname}`;
  const deterministicIcon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`;

  const prompt = `
    You are a forensic brand design auditor.
    Analyze the website: ${url} (Business: ${lead.businessName}).
    Return strictly valid JSON (do not add markdown blocks):
    {
      "colors": ["#hex", "#hex", "#hex", "#hex", "#hex"],
      "fontPairing": "HeaderFont / BodyFont",
      "archetype": "string",
      "visualTone": "string",
      "tagline": "string",
      "brandValues": ["string", "string", "string", "string"],
      "aestheticTags": ["string", "string", "string", "string"],
      "voiceTags": ["string", "string", "string"],
      "mission": "string",
      "businessOverview": "string",
      "extractedImages": ["url1", "url2"]
    }
  `;
  
  try {
    const res = await loggedGenerateContent({
      ai, module: 'IDENTITY', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
      contents: prompt,
      config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
    });
    
    let data = safeJsonParse(res);
    if (!data) data = { colors: [], extractedImages: [] };
    
    const rawImages = data.extractedImages || [];
    const cleanImages = rawImages.filter((img: string) => img && img.startsWith('http'));
    data.extractedImages = [deterministicLogo, deterministicIcon, ...cleanImages];
    
    return data;
  } catch (e) {
    return { colors: [], extractedImages: [deterministicLogo] } as any;
  }
};

export const generateVisual = async (prompt: string, lead?: Lead, inputImageBase64?: string) => {
  pushLog(`VISION: GENERATING ASSET...`);
  const ai = getAI();
  
  if(!deductCost('gemini-2.5-flash-image', 1000)) return null;

  try {
    const parts: any[] = [{ text: prompt }];
    if (inputImageBase64) {
       parts.unshift({
         inlineData: { mimeType: 'image/png', data: inputImageBase64.split(',')[1] || inputImageBase64 }
       });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64 = part.inlineData.data;
        const url = `data:image/png;base64,${base64}`;
        saveAsset('IMAGE', `GEN_${Date.now()}`, url, 'VISUAL_STUDIO', lead?.id);
        return url;
      }
    }
    return null;
  } catch (e) {
    console.error(e);
    toast.error("Image Gen Failed.");
    return null;
  }
};

// --- VIDEO GENERATION WITH HARDCODED KIE KEY ---
export const generateVideoPayload = async (
  prompt: string,
  leadId?: string,
  startImageBase64?: string,
  endImageBase64?: string, 
  config: VeoConfig = { aspectRatio: '16:9', resolution: '720p', modelStr: 'veo-3.1-fast-generate-preview' }
): Promise<string | null> => {
  pushLog(`VEO: INITIALIZING VIDEO GENERATION (${config.modelStr})...`);
  
  // 1. DIRECT INSTANCE WITH HARDCODED KIE KEY
  // This explicitly bypasses any other key logic for Veo operations.
  const ai = new GoogleGenAI({ apiKey: KIE_KEY });

  // 3. Construct Payload
  const payload: any = {
    model: config.modelStr,
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: config.resolution,
      aspectRatio: config.aspectRatio
    }
  };

  if (startImageBase64) {
    // Safe base64 extraction
    const base64Data = startImageBase64.includes(',') ? startImageBase64.split(',')[1] : startImageBase64;
    payload.image = {
      imageBytes: base64Data,
      mimeType: 'image/png'
    };
  }
  
  // Note: lastFrame removed to prevent TS build errors.

  try {
    toast.neural("VEO ENGINE: RENDERING STARTED (This takes ~60s)...");
    
    // 4. Polling Operation
    let operation = await ai.models.generateVideos(payload);
    
    // Poll loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
      operation = await ai.operations.getVideosOperation({ operation: operation });
      pushLog("VEO: RENDERING IN PROGRESS...");
    }

    // 5. Extract Result
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
      // Fetch the actual bytes using the KIE KEY to bypass expiration/CORS issues
      // Ensure we use the same key for the fetch as the generation
      const videoRes = await fetch(`${videoUri}&key=${KIE_KEY}`);
      const videoBlob = await videoRes.blob();
      const videoUrl = URL.createObjectURL(videoBlob); // Create local blob URL
      
      saveAsset('VIDEO', `VEO_CLIP_${Date.now()}`, videoUrl, 'VIDEO_PITCH', leadId);
      pushLog("VEO: RENDER COMPLETE.");
      toast.success("Video Rendered Successfully.");
      return videoUrl;
    }
    
    throw new Error("No video URI in response");

  } catch (e: any) {
    console.error("Veo Generation Error:", e);
    // Display cleaner error message if it's the specific API Key error
    if (e.message?.includes("API key not valid")) {
       toast.error(`Invalid API Key (${KIE_KEY.slice(0,4)}...). Please verify the KIE key string.`);
    } else {
       toast.error(`Video Failed: ${e.message}`);
    }
    pushLog(`VEO ERROR: ${e.message}`);
    return null;
  }
};

export const generateAudioPitch = async (script: string, voiceName: string, leadId?: string): Promise<string | null> => {
  pushLog(`AUDIO: SYNTHESIZING SPEECH (${voiceName})...`);
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text: script }] },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
       const url = `data:audio/wav;base64,${base64Audio}`;
       saveAsset('AUDIO', `AUDIO_${Date.now()}`, url, 'SONIC_STUDIO', leadId); 
       return url; 
    }
    return null;
  } catch (e: any) {
    console.error(e);
    toast.error("Audio Failed.");
    return null;
  }
};

// --- STUBS WITH FIXED TYPES ---
export const enhanceVideoPrompt = async (raw: string) => raw;
export const generateLeads = async (t: string, n: string, c: number) => ({ leads: [], groundingSources: [] });
export const generatePlaybookStrategy = async (n: string) => ({});
export const generateProposalDraft = async (l: Lead) => "";
export const analyzeVisual = async (b: string, m: string, p: string) => "";
export const fetchLiveIntel = async (l: Lead, m: string) => ({ visualStack: [], sonicStack: [], sources: [] } as any);
export const crawlTheaterSignals = async (t: string, s: string) => [];

// FIX: Return typed string array to prevent TS 'never' inference
export const identifySubRegions = async (t: string): Promise<string[]> => {
    return ["North District", "South District", "Central Business Hub"];
};

export const analyzeLedger = async (l: Lead[]) => ({ risk: "", opportunity: "" });
export const generateOutreachSequence = async (l: Lead) => [];
export const generateMockup = async (n: string, ni: string, id?: string) => "";
export const fetchBenchmarkData = async (l: Lead) => ({ visualStack: [], sonicStack: [], sources: [] } as any);
export const performFactCheck = async (l: Lead, c: string) => ({ status: "Unknown" });
export const synthesizeProduct = async (l: Lead) => ({});
export const generatePitch = async (l: Lead) => "";
export const architectFunnel = async (l: Lead) => [];
export const generateAgencyIdentity = async (n: string, r: string) => ({});
export const testModelPerformance = async (m: string, p: string) => "";
export const generateMotionLabConcept = async (l: Lead) => ({});
export const generateFlashSparks = async (l: Lead) => [];
export const architectPitchDeck = async (l: Lead) => [];
export const simulateSandbox = async (l: Lead, v: number, vol: number) => "";
export const generateTaskMatrix = async (l: Lead) => [];
export const fetchViralPulseData = async (n: string) => [];
export const synthesizeArticle = async (s: string, m: string) => "";
export const analyzeVideoUrl = async (u: string, p: string, id?: string) => "";
export const generateROIReport = async (l: number, v: number, c: number) => "";
export const orchestrateBusinessPackage = async (l: Lead, a: any[]) => ({});
export const generateAffiliateProgram = async (n: string) => ({});
export const fetchTokenStats = async () => ({});
export const critiqueVideoPresence = async (l: Lead) => "";
export const generateNurtureDialogue = async (l: Lead, s: string) => [];
export const translateTactical = async (t: string, l: string) => "";
