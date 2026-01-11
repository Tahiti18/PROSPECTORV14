
import { Lead } from '../types';
import { kieSunoService } from './kieSunoService';
// Import GoogleGenAI, Modality, and VideoGenerationReferenceType from @google/genai
import { GoogleGenAI, Modality, VideoGenerationReferenceType } from "@google/genai";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
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
 * ROBUST JSON ISOLATION
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
 * Strictly standard fetch to ensure zero cookie dependency.
 */
export const openRouterChat = async (prompt: string, system?: string) => {
  const systemInstruction = system || `You are the Prospector OS Intelligence Engine. 
    Focus on high-ticket B2B growth. Output raw, valid JSON ONLY. No conversation.`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
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
        throw new Error(`Gateway Error (${response.status}): ${err.error?.message || 'Unauthorized'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e: any) {
    pushLog(`GATEWAY_FAULT: ${e.message}`);
    throw e;
  }
};

/**
 * STANDARDIZED TASK RUNNER
 */
export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const raw = await openRouterChat(prompt, system);
  return extractJson(raw);
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche} via OpenRouter 2.0 Flash...`);
  const prompt = `Find ${count} high-ticket B2B leads in ${region} for ${niche}. 
    Return JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "city": "", "niche": "", "leadScore": 0, "assetGrade": "A", "socialGap": "" }] }`;
  
  const jsonStr = await executeIntelligenceTask(prompt);
  try {
    const parsed = JSON.parse(jsonStr);
    return { leads: parsed.leads || [], groundingSources: [] };
  } catch (e) {
    console.error("Parse Error:", jsonStr);
    throw new Error("Discovery node sync failure.");
  }
};

/**
 * STRATEGIC ORCHESTRATOR
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Orchestrating campaign for ${lead.businessName}...`);
  const prompt = `Create outreach assets for ${lead.businessName}. Return JSON with presentation, narrative, outreach, and visualDirection.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(jsonStr);
};

// --- UTILITIES ---

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

export const queryRealtimeAgentWithGrounding = async (q: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: q,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return { 
    text: response.text, 
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
  };
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

// --- MEDIA GENERATION (GEMINI SDK ENFORCED) ---

/**
 * Visual Generation via Gemini 2.5 Flash Image
 */
// Fix: Use Gemini 2.5 Flash Image for general generation
export const generateVisual = async (prompt: string, lead: any, editImage?: string) => {
  pushLog(`VISUAL: Requesting generation for ${prompt.slice(0, 20)} via Gemini...`);
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [{ text: prompt }];
  if (editImage) {
    parts.unshift({
      inlineData: {
        data: editImage.split(',')[1] || editImage,
        mimeType: 'image/png'
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts }
    });

    let imageUrl = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (imageUrl) {
      saveAsset('IMAGE', `VISUAL: ${prompt.slice(0, 30)}`, imageUrl, 'VISUAL_STUDIO', lead?.id);
    }
    return imageUrl;
  } catch (e: any) {
    pushLog(`VISUAL_FAULT: ${e.message}`);
    return null;
  }
};

/**
 * Video Generation via Veo 3.1
 * UPDATED SIGNATURE: Fixes argument mismatch error in VideoPitch.tsx
 */
// Fix: Accept 7 arguments and implement Veo polling as per guidelines
export const generateVideoPayload = async (
  prompt: string, 
  leadId?: string, 
  startImage?: string, 
  endImage?: string, 
  config?: VeoConfig,
  referenceImages?: string[],
  inputVideo?: string
) => {
  pushLog(`VIDEO: Initiating Veo Video synthesis protocol...`);
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = config?.modelStr || 'veo-3.1-fast-generate-preview';
  
  const videoConfig: any = {
    numberOfVideos: 1,
    resolution: config?.resolution || '720p',
    aspectRatio: config?.aspectRatio || '16:9'
  };

  if (endImage) {
    videoConfig.lastFrame = {
      imageBytes: endImage.split(',')[1] || endImage,
      mimeType: 'image/png'
    };
  }

  if (referenceImages && referenceImages.length > 0) {
    videoConfig.referenceImages = referenceImages.map(img => ({
      image: {
        imageBytes: img.split(',')[1] || img,
        mimeType: 'image/png'
      },
      referenceType: VideoGenerationReferenceType.ASSET
    }));
  }

  const payload: any = {
    model,
    prompt,
    config: videoConfig
  };

  if (startImage) {
    payload.image = {
      imageBytes: startImage.split(',')[1] || startImage,
      mimeType: 'image/png'
    };
  }

  // Handle extension if previous video provided (expects resource URI)
  if (inputVideo && inputVideo.startsWith('gs://')) {
    payload.video = { uri: inputVideo };
  }

  try {
    let operation = await ai.models.generateVideos(payload);
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No download link received from Veo.");

    const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:video/mp4;base64,${buffer.toString('base64')}`;

    saveAsset('VIDEO', `VEO_CLIP: ${prompt.slice(0, 30)}`, base64, 'VIDEO_STUDIO', leadId);
    return base64;
  } catch (e: any) {
    pushLog(`VIDEO_FAULT: ${e.message}`);
    throw e;
  }
};

/**
 * Audio Generation via Gemini 2.5 TTS
 */
// Fix: Use Gemini 2.5 Flash Preview TTS for audio generation
export const generateAudioPitch = async (text: string, voice: string, leadId?: string) => {
    pushLog(`AUDIO: Requesting Gemini TTS synthesis...`);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/pcm;base64,${base64Audio}`;
        saveAsset('AUDIO', `TTS: ${text.slice(0, 30)}`, audioUrl, 'SONIC_STUDIO', leadId);
        return audioUrl;
      }
      return null;
    } catch (e: any) {
      pushLog(`AUDIO_FAULT: ${e.message}`);
      return null;
    }
};

export const generateMockup = async (name: string, niche: string, leadId?: string) => {
  return await generateVisual(`4K Mockup for ${name}`, { id: leadId });
};

export const getAI = () => null; // SDK PURGED

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
};
export const clearVault = () => { SESSION_ASSETS.length = 0; assetListeners.forEach(l => l([])); };
export const importVault = (a: any[]) => { SESSION_ASSETS.push(...a); assetListeners.forEach(l => l([...SESSION_ASSETS])); return a.length; };
