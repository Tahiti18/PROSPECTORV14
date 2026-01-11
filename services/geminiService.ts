import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURATION: OPENROUTER & KIE HARD-LOCK ---
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const KIE_BASE_URL = "/api/kie"; 
// Updated to canonical Gemini model name
const PRIMARY_MODEL = "gemini-3-flash-preview"; 

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

// --- PERSISTENCE UTILS ---
export const getStoredKeys = () => ({
    openRouter: localStorage.getItem('pomelli_auth_override') || "",
    kie: localStorage.getItem('kie_api_key_override') || ""
});

export const setStoredKeys = (openRouter?: string, kie?: string) => {
    if (openRouter) localStorage.setItem('pomelli_auth_override', openRouter.trim());
    if (kie) localStorage.setItem('kie_api_key_override', kie.trim());
};

const purgeInvalidKeys = () => {
    localStorage.removeItem('pomelli_auth_override');
    // Refresh to force Security Gateway to appear
    window.location.reload();
};

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

export const importVault = (importedAssets: AssetRecord[]) => {
  let count = 0;
  importedAssets.forEach(a => {
    if (!SESSION_ASSETS.find(existing => existing.id === a.id)) {
      SESSION_ASSETS.push(a);
      count++;
    }
  });
  SESSION_ASSETS.sort((a, b) => b.timestamp - a.timestamp);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return count;
};

const extractJson = (text: string) => {
  if (!text) return "";
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) start = Math.min(firstBrace, firstBracket);
    else if (firstBrace !== -1) start = firstBrace;
    else if (firstBracket !== -1) start = firstBracket;

    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    let end = -1;
    if (lastBrace !== -1 && lastBracket !== -1) end = Math.max(lastBrace, lastBracket);
    else if (lastBrace !== -1) end = lastBrace;
    else if (lastBracket !== -1) end = lastBracket;

    if (start !== -1 && end !== -1 && end >= start) return cleaned.substring(start, end + 1);
  } catch (e) {}
  return cleaned;
};

/**
 * RESOLVE KEY: ALWAYS check localStorage first to bypass leaked environment keys.
 */
const getAuthKey = (type: 'OPENROUTER' | 'KIE') => {
    const keys = getStoredKeys();
    if (type === 'OPENROUTER') {
        const key = (keys.openRouter || process.env.API_KEY || "").trim();
        return key;
    }
    if (type === 'KIE') {
        return (keys.kie || process.env.KIE_API_KEY || "").trim();
    }
    return "";
};

const handleApiError = (e: any) => {
    const msg = e.message || "";
    if (msg.includes("leaked") || msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
        pushLog("CRITICAL: API KEY INVALIDATED BY PROVIDER (LEAKED). PURGING LOCAL AUTH.");
        toast.error("API KEY REJECTED: Reported as leaked. Please provide a new key.");
        purgeInvalidKeys();
    }
    pushLog(`INTEL_FAULT: ${msg}`);
    throw e;
};

/**
 * OPENROUTER INFERENCE CORE (V3 FLASH)
 * Modified to use dynamically resolved key to allow user override of leaked keys.
 */
export const openRouterChat = async (prompt: string, system?: string) => {
  const apiKey = getAuthKey('OPENROUTER');
  if (!apiKey) {
      toast.error("GATEWAY LOCKED: No Authorization Key Found.");
      throw new Error("AUTH_REQUIRED");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: (system || "You are Prospector OS, a world-class High-Ticket Agency Intelligence Engine.") + 
        " DO NOT provide generic placeholders. Every response must be exhaustive, detailed, and data-dense. Use specific real-world terminology for the target niche.",
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    deductCost(PRIMARY_MODEL, text.length);
    return text;
  } catch (e: any) {
    return handleApiError(e);
  }
};

export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const raw = await openRouterChat(prompt, system);
  return extractJson(raw);
};

export const loggedGenerateContent = async (args: { module: string; contents: any; config?: any; model?: string }) => {
    const apiKey = getAuthKey('OPENROUTER');
    const prompt = typeof args.contents === 'string' ? args.contents : JSON.stringify(args.contents);
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: args.model || PRIMARY_MODEL,
            contents: prompt,
            config: args.config
        });
        const text = response.text || "";
        deductCost(args.model || PRIMARY_MODEL, text.length);
        return text;
    } catch (e: any) {
        return handleApiError(e);
    }
};

/**
 * RECON & LEAD GEN (GEMINI)
 */
export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Targeting ${region} via Gemini...`);
  const prompt = `
    TASK: Find ${count} REAL high-ticket B2B leads in ${region} for the ${niche} niche.
    DIRECTIVE: Output REAL business names. Identify specific Social Gaps. Rate Lead Score (0-100).
    FORMAT: JSON object with "leads" array.
    REQUIRED FIELDS: businessName, websiteUrl, leadScore (0-100), assetGrade (A/B/C), socialGap (detailed description), phone, email.
  `;
  const jsonStr = await executeIntelligenceTask(prompt);
  const parsed = JSON.parse(jsonStr);
  return { leads: parsed.leads || [], groundingSources: [] };
};

/**
 * CAMPAIGN FORGE: THE EXHAUSTIVE ARCHITECT
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Architecting Exhaustive V3 Campaign for ${lead.businessName}...`);
  const prompt = `
    URGENT TASK: Architect a multi-layered High-Ticket Agency Campaign for ${lead.businessName}.
    NICHE: ${lead.niche}. CURRENT SOCIAL GAP: ${lead.socialGap}.
    RETURN STRICT JSON including presentation, narrative, outreach, funnel, contentPack, and visualDirection.
  `;
  const jsonStr = await executeIntelligenceTask(prompt, "You are a world-class High-Ticket Marketing Architect. Quantity of quality data is required.");
  await new Promise(r => setTimeout(r, 1500));
  return JSON.parse(jsonStr);
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const prompt = `Perform an exhaustive audit for ${lead.websiteUrl}. Focus: ${module}. Identify technical stack and specific design deficits. Return detailed BenchmarkReport JSON.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(jsonStr);
};

export const architectFunnel = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Architect a 4-stage ultra-high-ticket funnel for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(jsonStr);
};

export const architectPitchDeck = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Design an 8-slide AI Transformation pitch deck for ${lead.businessName}. Return JSON object with slides array.`);
  return JSON.parse(jsonStr);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Generate a 7-day multi-channel sequence for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(jsonStr);
};

export const generateVideoPayload = async (prompt: string, leadId?: string, startImage?: string, lastFrame?: string, config?: any, referenceImages: string[] = []) => {
    const apiKey = getAuthKey('OPENROUTER'); // Or KIE
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const videoConfig: any = {
          numberOfVideos: 1,
          resolution: config?.resolution || '720p',
          aspectRatio: config?.aspectRatio || '16:9'
        };

        const request: any = {
          model: 'veo-3.1-fast-generate-preview',
          prompt,
          config: videoConfig
        };

        if (startImage) {
          const data = startImage.includes(',') ? startImage.split(',')[1] : startImage;
          const mimeType = startImage.includes(';') ? startImage.split(';')[0].split(':')[1] : 'image/png';
          request.image = { imageBytes: data, mimeType };
        }

        let operation = await ai.models.generateVideos(request);
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({ operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        const videoRes = await fetch(`${downloadLink}&key=${apiKey}`);
        const blob = await videoRes.blob();
        const videoUrl = URL.createObjectURL(blob);

        if (videoUrl) {
          saveAsset('VIDEO', `VEO: ${prompt.slice(0, 30)}`, videoUrl, 'VIDEO_PITCH', leadId);
        }
        return videoUrl;
    } catch (e: any) {
        return handleApiError(e);
    }
};

export const generateAudioPitch = async (text: string, voiceName: string = 'Kore', leadId?: string) => {
    const apiKey = getAuthKey('OPENROUTER');
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: ["AUDIO"],
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
          saveAsset('AUDIO', `TTS: ${text.slice(0, 30)}`, audioUrl, 'SONIC_STUDIO', leadId);
          return audioUrl;
        }
        return null;
    } catch (e: any) {
        return handleApiError(e);
    }
};

export const generateVisual = async (prompt: string, lead: Lead, base64Image?: string) => {
    const apiKey = getAuthKey('OPENROUTER');
    try {
        const ai = new GoogleGenAI({ apiKey });
        const parts: any[] = [{ text: prompt }];
        
        if (base64Image) {
          const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
          const mimeType = base64Image.includes(';') ? base64Image.split(';')[0].split(':')[1] : 'image/png';
          parts.unshift({ inlineData: { data, mimeType } });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts }
        });

        let imageUrl = "";
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imageUrl) {
          saveAsset('IMAGE', `VISUAL: ${prompt.slice(0, 30)}`, imageUrl, 'VISUAL_STUDIO', lead.id);
        }
        return imageUrl;
    } catch (e: any) {
        return handleApiError(e);
    }
};

export const analyzeVisual = async (base64ImageData: string, mimeType: string, prompt: string) => {
    const apiKey = getAuthKey('OPENROUTER');
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data: base64ImageData, mimeType } },
              { text: prompt }
            ]
          }
        });
        return response.text;
    } catch (e: any) {
        return handleApiError(e);
    }
};

export const fetchBenchmarkData = (lead: Lead) => fetchLiveIntel(lead, 'BENCHMARK');
export const generateProposalDraft = (lead: Lead) => executeIntelligenceTask(`Draft a 2000-word formal agency proposal for ${lead.businessName}.`);
export const generateTaskMatrix = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Create a 10-item implementation checklist for ${lead.businessName}. JSON.`);
  return JSON.parse(jsonStr);
};
export const generateNurtureDialogue = async (lead: Lead, sc: string) => {
  const jsonStr = await executeIntelligenceTask(`Simulate a high-ticket conversation for ${lead.businessName}. Scenario: ${sc}. JSON.`);
  return JSON.parse(jsonStr);
};
export const generateROIReport = (ltv: number, l: number, c: number) => executeIntelligenceTask(`Detailed ROI for LTV ${ltv} Vol ${l} Conv ${c}.`);
export const generateFlashSparks = async (lead: Lead) => {
  const jsonStr = await executeIntelligenceTask(`10 viral hooks for ${lead.businessName}. JSON array.`);
  return JSON.parse(jsonStr);
};

export const generateMockup = async (n: string, ni: string, id?: string) => {
    const apiKey = getAuthKey('OPENROUTER');
    const prompt = `High-end minimalist 4K mockup for ${n} in the ${ni} industry.`;
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] }
        });
        let imageUrl = "";
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
        if (imageUrl) {
            saveAsset('IMAGE', `MOCKUP: ${n}`, imageUrl, 'MOCKUPS_4K', id);
        }
        return imageUrl;
    } catch (e: any) {
        return handleApiError(e);
    }
};

export const generatePitch = (lead: Lead) => executeIntelligenceTask(`3-minute high-pressure pitch for ${lead.businessName}.`);
export const generateSonicPrompt = (lead: Lead) => executeIntelligenceTask(`Sonic brand prompt for ${lead.businessName}.`);
export const generateLyrics = (lead: Lead, t: string, ty: string) => executeIntelligenceTask(`Jingle lyrics for ${lead.businessName}.`);
export const enhanceVideoPrompt = (p: string) => executeIntelligenceTask(`Enhance: ${p}`);
export const enhanceStrategicPrompt = (p: string) => executeIntelligenceTask(`Optimize: ${p}`);
export const fetchViralPulseData = async (n: string) => {
  const jsonStr = await executeIntelligenceTask(`Trends for ${n}. JSON.`);
  return JSON.parse(jsonStr);
};
export const identifySubRegions = async (t: string): Promise<string[]> => {
  const jsonStr = await executeIntelligenceTask(`Target sectors in ${t}. JSON array.`);
  return JSON.parse(jsonStr);
};
export const crawlTheaterSignals = async (s: string, sig: string): Promise<Lead[]> => {
  const jsonStr = await executeIntelligenceTask(`Leads in ${s} with ${sig}. JSON.`);
  return JSON.parse(jsonStr);
};
export const analyzeLedger = async (ls: Lead[]) => {
  const jsonStr = await executeIntelligenceTask(`Analyze ${ls.length} leads. JSON.`);
  return JSON.parse(jsonStr);
};
export const analyzeVideoUrl = (u: string, p: string, id?: string) => executeIntelligenceTask(`Video audit ${u}.`);
export const synthesizeArticle = (s: string, m: string) => executeIntelligenceTask(`Analyze ${s}.`);
export const testModelPerformance = (m: string, p: string) => executeIntelligenceTask(`Test: ${p}`);
export const generateMotionLabConcept = async (l: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Storyboard for ${l.businessName}. JSON.`);
  return JSON.parse(jsonStr);
};
export const generateAffiliateProgram = async (n: string) => {
  const jsonStr = await executeIntelligenceTask(`Affiliate matrix for ${n}. JSON.`);
  return JSON.parse(jsonStr);
};
export const generateAgencyIdentity = async (n: string, r: string) => {
  const jsonStr = await executeIntelligenceTask(`Brand identity for ${n}. JSON.`);
  return JSON.parse(jsonStr);
};
export const extractBrandDNA = async (l: Partial<Lead>, u: string): Promise<BrandIdentity> => {
  const jsonStr = await executeIntelligenceTask(`Extract DNA from ${u}. JSON.`);
  return JSON.parse(jsonStr);
};
export const generatePlaybookStrategy = async (n: string) => {
  const jsonStr = await executeIntelligenceTask(`Strategic playbook for ${n}. JSON.`);
  return JSON.parse(jsonStr);
};
export const performFactCheck = async (l: Lead, c: string) => {
  const jsonStr = await executeIntelligenceTask(`Fact check ${c} for ${l.businessName}. JSON.`);
  return JSON.parse(jsonStr);
};
export const synthesizeProduct = async (l: Lead) => {
  const jsonStr = await executeIntelligenceTask(`Offer structure for ${l.businessName}. JSON.`);
  return JSON.parse(jsonStr);
};
export const simulateSandbox = (l: Lead, ltv: number, v: number) => executeIntelligenceTask(`Sandbox ${l.businessName}.`);
export const critiqueVideoPresence = (l: Lead) => executeIntelligenceTask(`Video presence audit ${l.businessName}.`);
export const translateTactical = (t: string, lang: string) => executeIntelligenceTask(`Translate to ${lang}: ${t}`);
export const fetchTokenStats = async () => ({ recentOps: [] });

export const queryRealtimeAgent = async (prompt: string) => {
    const apiKey = getAuthKey('OPENROUTER');
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || "Source",
          uri: chunk.web?.uri
        })).filter((s: any) => s.uri) || [];

        return {
          text: response.text,
          sources
        };
    } catch (e: any) {
        return handleApiError(e);
    }
};
