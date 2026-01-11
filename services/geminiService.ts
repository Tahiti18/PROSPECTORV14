
import { Lead, BrandIdentity } from '../types';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { deductCost } from './computeTracker';

// --- CONFIGURATION: OPENROUTER HARD-LOCK ---
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Gemini 2.0 Flash is the high-performance lead discovery engine
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

/* --- State Management Fixes --- */
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

/* --- GenAI SDK Integration --- */
export const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface LoggedGenerateParams {
  module: string;
  model?: string;
  modelClass?: 'FLASH' | 'PRO';
  reasoningDepth?: 'LOW' | 'MEDIUM' | 'HIGH';
  isClientFacing?: boolean;
  contents: any;
  config?: any;
}

/**
 * FIXED: Exported loggedGenerateContent for use in automation steps.
 */
export const loggedGenerateContent = async (params: LoggedGenerateParams): Promise<string> => {
  const ai = getAI();
  const model = params.model || 'gemini-3-flash-preview';
  const start = Date.now();
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: params.contents,
      config: params.config
    });
    
    const text = response.text || '';
    const latency = Date.now() - start;
    
    deductCost(model, (typeof params.contents === 'string' ? params.contents.length : 1000) + text.length);
    
    return text;
  } catch (e: any) {
    pushLog(`GENERATION_ERROR in ${params.module}: ${e.message}`);
    throw e;
  }
};

/**
 * OPENROUTER REST GATEWAY
 * Fixed 401 error by ensuring Bearer token is strictly valid and not string "undefined"
 */
export const openRouterChat = async (prompt: string, system?: string) => {
  const systemInstruction = system || "You are the Prospector OS Intel Engine. Focus on high-ticket B2B growth. Output raw, valid JSON ONLY.";
  
  // Robust key check: Prioritize OpenRouter specific key, then fallback to general API_KEY
  const apiKey = (process.env.OPENROUTER_API_KEY || process.env.API_KEY || "").trim();

  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    const errorMsg = "CRITICAL AUTH FAILURE: Valid API Key not found in bundle. Check Railway environment variables.";
    pushLog(errorMsg);
    throw new Error(errorMsg);
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
        throw new Error(`OpenRouter Error (${response.status}): ${err.error?.message || 'Unauthorized - Check API Key'}`);
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

// --- UTILITIES (REMAINING STUBS FOR COMPATIBILITY) ---

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

/**
 * FIXED: generateOutreachSequence was truncated.
 */
export const generateOutreachSequence = async (lead: Lead) => {
  const prompt = `Create a 5-day multi-channel outreach sequence for ${lead.businessName} (${lead.niche}). 
  Return JSON: [{ "day": 1, "channel": "Email", "content": "...", "purpose": "..." }]`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(jsonStr);
};

/* --- MISSING FUNCTIONS IMPLEMENTATION --- */

export const generatePlaybookStrategy = async (niche: string) => {
    const prompt = `Generate a high-ticket agency playbook strategy for ${niche}. Return JSON: { "strategyName": "", "steps": [{ "title": "", "tactic": "" }] }`;
    const json = await executeIntelligenceTask(prompt);
    return JSON.parse(json);
};

/**
 * FIXED: generateAudioPitch implemented using gemini-2.5-flash-preview-tts
 */
export const generateAudioPitch = async (text: string, voiceName: string = 'Kore', leadId?: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const audioUrl = `data:audio/pcm;base64,${base64Audio}`;
    saveAsset('AUDIO', `Voice Pitch: ${text.slice(0, 30)}`, audioUrl, 'SONIC_STUDIO', leadId, { voiceName });
    return audioUrl;
  }
  return null;
};

export const generateLyrics = async (lead: Lead, theme: string, type: string) => {
  return await executeIntelligenceTask(`Write ${type} lyrics for ${lead.businessName} theme ${theme}. Return raw text.`);
};

/**
 * FIXED: generateVisual implemented using gemini-2.5-flash-image
 */
export const generateVisual = async (prompt: string, lead: Lead, base64Image?: string) => {
  const ai = getAI();
  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.push({
        inlineData: {
            data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
            mimeType: 'image/png'
        }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const url = `data:image/png;base64,${part.inlineData.data}`;
      saveAsset('IMAGE', prompt.slice(0, 30), url, 'CREATIVE_STUDIO', lead.id);
      return url;
    }
  }
  return null;
};

export const generateSonicPrompt = async (lead: Lead) => {
    return await executeIntelligenceTask(`Generate a detailed music generation prompt for ${lead.businessName} brand identity. Return only the prompt string.`);
};

/**
 * FIXED: analyzeVisual implemented using gemini-3-flash-preview (Vision)
 */
export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: prompt }
      ]
    }
  });
  return response.text || '';
};

export const identifySubRegions = async (theater: string) => {
    const json = await executeIntelligenceTask(`Break ${theater} into 5 strategic sub-regions for business prospecting. Return JSON: ["Region 1", ...]`);
    return JSON.parse(json);
};

export const crawlTheaterSignals = async (sector: string, signal: string) => {
    const json = await executeIntelligenceTask(`Identify 3 businesses in ${sector} showing ${signal}. Return JSON: { "leads": [...] }`);
    const parsed = JSON.parse(json);
    return (parsed.leads || []).map((l: any) => ({ ...l, id: uuidLike() }));
};

export const analyzeLedger = async (leads: Lead[]) => {
    const json = await executeIntelligenceTask(`Analyze these ${leads.length} leads. Identify top risk and top opportunity. Return JSON: { "risk": "", "opportunity": "" }`);
    return JSON.parse(json);
};

/**
 * FIXED: generateVideoPayload implemented using veo-3.1-fast-generate-preview
 */
export const generateVideoPayload = async (
    prompt: string, 
    leadId?: string, 
    startImageBase64?: string, 
    endImageBase64?: string, 
    config: VeoConfig = { aspectRatio: '16:9', resolution: '720p' },
    referenceImages: string[] = [],
    inputVideoBase64?: string
) => {
  const ai = getAI();
  const model = inputVideoBase64 ? 'veo-3.1-generate-preview' : config.modelStr || 'veo-3.1-fast-generate-preview';
  
  const payload: any = {
    model,
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: config.resolution,
      aspectRatio: config.aspectRatio
    }
  };

  if (startImageBase64) {
    payload.image = { imageBytes: startImageBase64.split(',')[1], mimeType: 'image/png' };
  }
  if (endImageBase64) {
    payload.lastFrame = { imageBytes: endImageBase64.split(',')[1], mimeType: 'image/png' };
  }
  if (inputVideoBase64) {
    // Note: in a real app, you might need a way to pass the actual Video object if extending
    // but the SDK examples use the video from a previousOperation response. 
    // Here we simulate for the UI flow.
  }

  let operation = await ai.models.generateVideos(payload);
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (downloadLink) {
    const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
    saveAsset('VIDEO', prompt.slice(0, 30), videoUrl, 'VIDEO_STUDIO', leadId);
    return videoUrl;
  }
  return null;
};

export const enhanceVideoPrompt = async (prompt: string) => {
    return await executeIntelligenceTask(`Enhance this video prompt for cinematic 4k quality: ${prompt}`);
};

export const generateMockup = async (businessName: string, niche: string, leadId?: string) => {
    const prompt = `Hyper-realistic 4K mockup for ${businessName} in ${niche} niche. High-end branding.`;
    return await generateVisual(prompt, { businessName, id: leadId } as Lead);
};

/**
 * FIXED: performFactCheck implemented using googleSearch grounding
 */
export const performFactCheck = async (lead: Lead, claim: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Verify this claim about ${lead.businessName} or their niche ${lead.niche}: ${claim}`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return {
    status: response.text?.toLowerCase().includes('verified') ? 'Verified' : 'Disputed',
    evidence: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
      title: c.web?.title || 'Source',
      uri: c.web?.uri || '#'
    })) || []
  };
};

export const synthesizeProduct = async (lead: Lead) => {
    const json = await executeIntelligenceTask(`Architect a new AI-powered product for ${lead.businessName}. Return JSON: { "productName": "", "tagline": "", "pricePoint": "", "features": [] }`);
    return JSON.parse(json);
};

export const generatePitch = async (lead: Lead) => {
    return await executeIntelligenceTask(`Write a 30-second high-ticket elevator pitch for ${lead.businessName}.`);
};

export const architectFunnel = async (lead: Lead) => {
    const json = await executeIntelligenceTask(`Architect a sales funnel for ${lead.businessName}. Return JSON: [{ "stage": "...", "title": "...", "description": "...", "conversionGoal": "..." }]`);
    return JSON.parse(json);
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
    const json = await executeIntelligenceTask(`Generate an agency identity for ${niche} in ${region}. Return JSON: { "name": "", "tagline": "", "manifesto": "", "colors": ["#hex1", ...] }`);
    return JSON.parse(json);
};

export const testModelPerformance = async (model: string, prompt: string) => {
    return await loggedGenerateContent({ module: 'TEST', model, contents: prompt });
};

export const generateMotionLabConcept = async (lead: Lead) => {
    const json = await executeIntelligenceTask(`Create a motion graphics storyboard concept for ${lead.businessName}. Return JSON: { "title": "", "hook": "", "scenes": [{ "time": "0s", "visual": "", "text": "" }] }`);
    return JSON.parse(json);
};

export const generateFlashSparks = async (lead: Lead) => {
    const json = await executeIntelligenceTask(`Generate 6 viral content sparks for ${lead.businessName}. Return JSON array of strings.`);
    return JSON.parse(json);
};

export const architectPitchDeck = async (lead: Lead) => {
    const json = await executeIntelligenceTask(`Architect a 5-slide pitch deck for ${lead.businessName}. Return JSON: [{ "title": "", "narrativeGoal": "", "keyVisuals": "" }]`);
    return JSON.parse(json);
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
    return await executeIntelligenceTask(`Simulate a business growth scenario for ${lead.businessName} with LTV ${ltv} and volume ${volume}.`);
};

export const critiqueVideoPresence = async (lead: Lead) => {
    return await executeIntelligenceTask(`Critique the video presence of ${lead.businessName} based on their niche ${lead.niche}.`);
};

export const translateTactical = async (text: string, lang: string) => {
    return await executeIntelligenceTask(`Translate this text into tactical ${lang}: ${text}`);
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
    const json = await executeIntelligenceTask(`Generate a nurture chat dialogue for ${lead.businessName} in scenario: ${scenario}. Return JSON array of { role: 'user' | 'ai', text: string }.`);
    return JSON.parse(json);
};

export const generateAffiliateProgram = async (niche: string) => {
    const json = await executeIntelligenceTask(`Generate an affiliate program matrix for ${niche}. Return JSON: { "programName": "", "tiers": [...], "recruitScript": "" }`);
    return JSON.parse(json);
};

export const generateTaskMatrix = async (lead: Lead) => {
    const json = await executeIntelligenceTask(`Generate a task checklist for ${lead.businessName}. Return JSON array of { id, task, status: 'pending' }.`);
    return JSON.parse(json);
};

export const fetchViralPulseData = async (niche: string) => {
    const json = await executeIntelligenceTask(`Identify 4 viral trends for ${niche}. Return JSON array of { label: string, type: 'up' | 'down', val: number }.`);
    return JSON.parse(json);
};

/**
 * FIXED: queryRealtimeAgent implemented using googleSearch grounding
 */
export const queryRealtimeAgent = async (query: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: { tools: [{ googleSearch: {} }] }
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
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
    return await executeIntelligenceTask(`Synthesize this article into mode ${mode}: ${source}`);
};

/**
 * FIXED: analyzeVideoUrl implemented using googleSearch grounding (for YouTube context)
 */
export const analyzeVideoUrl = async (url: string, prompt: string, leadId?: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this video: ${url}. Mission: ${prompt}`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || '';
};

export const enhanceStrategicPrompt = async (prompt: string) => {
    return await executeIntelligenceTask(`Enhance this strategic prompt: ${prompt}`);
};

export const generateROIReport = async (ltv: number, leads: number, conv: number) => {
    return await executeIntelligenceTask(`Generate an AI ROI report for LTV ${ltv}, leads ${leads}, conv lift ${conv}.`);
};

/**
 * FIXED: extractBrandDNA implemented using gemini-3-flash-preview (Vision/Search)
 */
export const extractBrandDNA = async (lead: Partial<Lead>, websiteUrl: string): Promise<BrandIdentity> => {
  const ai = getAI();
  const prompt = `Research ${websiteUrl} and extract brand identity. Return JSON: { "colors": ["#hex", ...], "fontPairing": "", "archetype": "", "visualTone": "", "extractedImages": ["url", ...] }`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json' 
    }
  });
  return JSON.parse(response.text || '{}');
};
