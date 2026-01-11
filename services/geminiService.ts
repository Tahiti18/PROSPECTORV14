
import { Lead } from '../types';
import { kieSunoService } from './kieSunoService';
// Fix: Import official @google/genai SDK components
import { GoogleGenAI, Type, Modality } from "@google/genai";

const PRIMARY_MODEL = "gemini-3-flash-preview"; 
const IMAGE_MODEL = "gemini-2.5-flash-image"; 

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
 * CLEAN JSON EXTRACTION
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
 * GEMINI SDK CHAT GATEWAY
 */
// Fix: Use @google/genai SDK for all chat operations
export const openRouterChat = async (prompt: string, system?: string, isImage = false) => {
  const systemInstruction = system || `You are the Prospector OS Intelligence Engine. 
    Focus on high-ticket AI transformation. Output raw JSON ONLY. No conversation.`;

  // Fix: Create new GoogleGenAI instance using pre-configured process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    // Fix: Simple and direct access to .text property on response
    return response.text || "";
  } catch (e: any) {
    pushLog(`GATEWAY_FAULT: ${e.message}`);
    throw e;
  }
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche} via Gemini...`);
  const prompt = `Find ${count} high-ticket B2B leads in ${region} for ${niche}. 
    Return JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "city": "", "niche": "", "leadScore": 0, "assetGrade": "A", "socialGap": "" }] }`;
  
  const text = await openRouterChat(prompt);
  try {
    const parsed = JSON.parse(extractJson(text));
    return { leads: parsed.leads || [], groundingSources: [] };
  } catch (e) {
    console.error("Discovery Parse Error:", text);
    throw new Error("Failed to parse lead intelligence stream.");
  }
};

/**
 * STRATEGIC ORCHESTRATOR
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Orchestrating campaign for ${lead.businessName}...`);
  const prompt = `Create outreach assets for ${lead.businessName}. Return JSON with presentation, narrative, outreach, and visualDirection.`;
  const text = await openRouterChat(prompt);
  return JSON.parse(extractJson(text));
};

// --- UTILITIES ---

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const text = await openRouterChat(`Technical audit for ${lead.websiteUrl} focus ${module}. Return JSON BenchmarkReport.`);
  return JSON.parse(extractJson(text));
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, "benchmark");
};

export const generateProposalDraft = async (lead: Lead) => {
  return await openRouterChat(`Proposal draft for ${lead.businessName}. Focus on AI ROI.`);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const text = await openRouterChat(`Outreach sequence for ${lead.businessName}. Return JSON array.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

export const analyzeLedger = async (leads: Lead[]) => {
  const text = await openRouterChat(`Analyze Ledger: ${JSON.stringify(leads)}. Return JSON {risk, opportunity}.`);
  try { return JSON.parse(extractJson(text)); } catch { return { risk: "N/A", opportunity: "N/A" }; }
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  // Fix: Use Google Search grounding for query as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: `Fact check: "${claim}" for ${lead.businessName}. Return JSON {status: string, evidence: string, sources: array}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "{}";
    const parsed = JSON.parse(extractJson(text));
    
    // Extract sources from grounding chunks
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Search Result",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return { ...parsed, sources: [...(parsed.sources || []), ...sources] };
  } catch (e) {
    console.error(e);
    return { status: "Unknown", evidence: "N/A", sources: [] };
  }
};

export const generatePlaybookStrategy = async (niche: string) => {
  const text = await openRouterChat(`Strategy for ${niche}. Return JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return { strategyName: "Ops", steps: [] }; }
};

export const architectFunnel = async (lead: Lead) => {
  const text = await openRouterChat(`Funnel for ${lead.businessName}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

export const architectPitchDeck = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch deck for ${lead.businessName}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

export const generateTaskMatrix = async (lead: Lead) => {
  const text = await openRouterChat(`Task matrix for ${lead.businessName}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const text = await openRouterChat(`Chat scenario for ${lead.businessName}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const text = await openRouterChat(`Brand DNA from ${url}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return {}; }
};

export const synthesizeProduct = async (lead: Lead) => {
  const text = await openRouterChat(`Product design for ${lead.businessName}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return {}; }
};

export const generateFlashSparks = async (lead: Lead) => {
  const text = await openRouterChat(`Viral hooks for ${lead.businessName}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

export const generatePitch = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch for ${lead.businessName}. JSON {pitch}.`);
  try { return JSON.parse(extractJson(text)).pitch || text; } catch { return text; }
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await openRouterChat(`ROI simulation for ${lead.businessName}. LTV ${ltv}, Vol ${volume}.`);
};

export const synthesizeArticle = async (s: string, m: string) => {
  return await openRouterChat(`Synthesize article: ${s} as ${m}.`);
};

// Fix: Use correct chat arguments for logged content
export const loggedGenerateContent = async (opts: any) => {
  return await openRouterChat(opts.contents, opts.config?.systemInstruction);
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  return await openRouterChat(`Lyrics for ${l.businessName} in style ${p}.`);
};

export const generateSonicPrompt = async (l: any) => {
  const text = await openRouterChat(`Sonic prompt for ${l.businessName}. JSON {prompt}.`);
  try { return JSON.parse(extractJson(text)).prompt || "Premium Sound"; } catch { return "Premium Sound"; }
};

export const enhanceVideoPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance video prompt: "${p}". JSON {enhanced}.`);
  try { return JSON.parse(extractJson(text)).enhanced || p; } catch { return p; }
};

export const enhanceStrategicPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance strategy prompt: "${p}". JSON {enhanced}.`);
  try { return JSON.parse(extractJson(text)).enhanced || p; } catch { return p; }
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const text = await openRouterChat(`Agency identity for ${niche} in ${region}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return {}; }
};

export const generateAffiliateProgram = async (niche: string) => {
  const text = await openRouterChat(`Affiliate matrix for ${niche}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return {}; }
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await openRouterChat(`Video audit for ${lead.businessName}.`);
};

export const translateTactical = async (text: string, lang: string) => {
  const res = await openRouterChat(`Translate to ${lang}: "${text}". JSON {translated}.`);
  try { return JSON.parse(extractJson(res)).translated || res; } catch { return res; }
};

export const fetchViralPulseData = async (niche: string) => {
  const text = await openRouterChat(`Trends for ${niche}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

// Fix: Use Google Search grounding for real-time agent queries
export const queryRealtimeAgent = async (q: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: q,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text, sources };
  } catch (e) {
    console.error(e);
    return { text: "Search node interrupted.", sources: [] };
  }
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  return await openRouterChat(`ROI Report: LTV ${ltv}, Vol ${vol}, Conv ${conv}.`);
};

export const fetchTokenStats = async () => ({ recentOps: [{ op: 'GATEWAY_LINK', id: 'GEMINI_V3', cost: '0.0001' }] });

export const identifySubRegions = async (theater: string) => {
  const text = await openRouterChat(`Split ${theater} into 5 sectors. JSON array.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const text = await openRouterChat(`Find 5 businesses in ${region} for ${signal}. JSON array.`);
  try { return JSON.parse(extractJson(text)); } catch { return []; }
};

export const analyzeVideoUrl = async (u: string, p: string, leadId?: string) => {
  return await openRouterChat(`Analyze video ${u}. Instruction: ${p}`);
};

// Fix: Use proper multi-modal parts for image analysis
export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: prompt }
      ]
    }
  });
  return response.text || "";
};

export const testModelPerformance = async (model: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt
  });
  return response.text || "";
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const text = await openRouterChat(`Storyboard for ${lead.businessName}. JSON.`);
  try { return JSON.parse(extractJson(text)); } catch { return null; }
};

// --- MEDIA GENERATION (GEMINI SDK HANDLED) ---

// Fix: Implement image generation using Gemini 2.5 Flash Image / Gemini 3 Pro
export const generateVisual = async (prompt: string, lead: any, editImage?: string) => {
  pushLog(`VISUAL: Requesting visual via Gemini Core...`);
  
  const isHighQuality = prompt.toLowerCase().includes('4k') || prompt.toLowerCase().includes('2k');
  
  // Mandatory check for paid key selection on high-end models
  if (isHighQuality && !(await (window as any).aistudio.hasSelectedApiKey())) {
    await (window as any).aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = isHighQuality ? 'gemini-3-pro-image-preview' : IMAGE_MODEL;
  
  const contents: any = { parts: [{ text: prompt }] };
  
  // Support for Image-to-Image editing
  if (editImage) {
    contents.parts.unshift({
      inlineData: {
        data: editImage.split(',')[1] || editImage,
        mimeType: 'image/png'
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: isHighQuality ? "1K" : undefined }
      }
    });

    // Iterate through parts to find the generated image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const dataUrl = `data:image/png;base64,${part.inlineData.data}`;
        saveAsset('IMAGE', prompt.slice(0, 30), dataUrl, 'VISUAL_STUDIO', lead?.id);
        return dataUrl;
      }
    }
  } catch (e: any) {
    pushLog(`VISUAL_FAULT: ${e.message}`);
  }
  return null;
};

// Fix: Correct signature for generateVideoPayload (7 arguments) and implement polling
export const generateVideoPayload = async (
  prompt: string, 
  leadId?: string, 
  startImage?: string, 
  endImage?: string, 
  config?: VeoConfig,
  referenceImages?: string[],
  inputVideo?: string
) => {
  pushLog(`VIDEO: Initiating Video synthesis protocol...`);

  // Mandatory check for paid key selection for Veo models
  if (!(await (window as any).aistudio.hasSelectedApiKey())) {
    await (window as any).aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: config?.resolution || '720p',
      aspectRatio: config?.aspectRatio || '16:9',
    };

    const payload: any = {
      model: config?.modelStr || 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'Professional cinematography for business transformation',
      config: videoConfig,
    };

    if (startImage) {
      payload.image = {
        imageBytes: startImage.split(',')[1] || startImage,
        mimeType: 'image/png',
      };
    }

    if (endImage) {
      payload.lastFrame = {
        imageBytes: endImage.split(',')[1] || endImage,
        mimeType: 'image/png',
      };
    }

    if (referenceImages && referenceImages.length > 0) {
      payload.config.referenceImages = referenceImages.map(img => ({
        image: {
          imageBytes: img.split(',')[1] || img,
          mimeType: 'image/png',
        },
        referenceType: 'ASSET',
      }));
    }

    // Handle video object for extension if applicable (simplified for this context)
    // Note: Actual extension requires a video reference from a previous operation response.

    let operation = await ai.models.generateVideos(payload);

    // Poll until operation is complete
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed - no URI returned");

    // Fetch MP4 bytes using API key as per rules
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });

    saveAsset('VIDEO', prompt.slice(0, 30), dataUrl, 'VIDEO_STUDIO', leadId);
    return dataUrl;

  } catch (e: any) {
    if (e.message?.includes("Requested entity was not found.")) {
      await (window as any).aistudio.openSelectKey();
    }
    pushLog(`VIDEO_FAULT: ${e.message}`);
    throw e;
  }
};

// Fix: Implement TTS using the Speech-to-Text model
export const generateAudioPitch = async (text: string, voice: string, leadId?: string) => {
    pushLog(`AUDIO: Requesting Gemini TTS synthesis...`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
              },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const dataUrl = `data:audio/pcm;base64,${base64Audio}`;
        saveAsset('AUDIO', text.slice(0, 30), dataUrl, 'SONIC_STUDIO', leadId);
        return dataUrl;
      }
    } catch (e: any) {
      pushLog(`AUDIO_FAULT: ${e.message}`);
    }
    return null;
};

export const generateMockup = async (name: string, niche: string, leadId?: string) => {
  return await generateVisual(`Mockup for ${name}, 4k resolution, high quality.`, { id: leadId });
};

export const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY }); 

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
};
export const clearVault = () => { SESSION_ASSETS.length = 0; assetListeners.forEach(l => l([])); };
export const importVault = (a: any[]) => { SESSION_ASSETS.push(...a); assetListeners.forEach(l => l([...SESSION_ASSETS])); return a.length; };
