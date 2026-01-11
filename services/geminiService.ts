
import { Lead } from '../types';
// Import GoogleGenAI and Type as per guidelines
import { GoogleGenAI, Type } from "@google/genai";

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

// Fix Error: Module '"../../services/geminiService"' has no exported member 'VeoConfig'.
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
 * DEFENSIVE NEURAL PARSER
 * Strips markdown and aggressively isolates valid JSON objects.
 */
const extractJson = (text: string) => {
  if (!text) return "";
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return cleaned.substring(start, end + 1);
    }
  } catch (e) {}
  return cleaned;
};

/**
 * GEMINI CORE CHAT
 * Enforces strict role-play and uses the Google GenAI SDK.
 */
export const openRouterChat = async (prompt: string, systemInstruction?: string) => {
  // Always initialize GoogleGenAI inside the call as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const defaultSystem = `You are a Senior B2B Sales Strategist for a high-end AI Transformation Agency. 
Your goal is to help your agency close specific business targets. 
NEVER mention "Prospector OS", "The Engine", or your own internal software in your outreach. 
You work for the user. Always output raw valid JSON. No conversational filler.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || defaultSystem,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    return extractJson(text);
  } catch (e: any) {
    pushLog(`NEURAL_FAULT: ${e.message}`);
    throw e;
  }
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche} entities...`);
  const prompt = `Find ${count} high-ticket B2B leads in ${region} for ${niche}. 
    Return a JSON array of objects: { "leads": [{ "businessName": "", "websiteUrl": "", "city": "", "niche": "", "leadScore": 0, "assetGrade": "A", "socialGap": "" }] }`;
  const text = await openRouterChat(prompt);
  try {
    const parsed = JSON.parse(text);
    return { leads: parsed.leads || [], groundingSources: [] };
  } catch (e) {
    return { leads: [], groundingSources: [] };
  }
};

/**
 * STRATEGIC ORCHESTRATOR
 * Stabilized prompt for Gemini 3 Flash.
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Mapping strategy for ${lead.businessName}...`);
  const prompt = `Construct a multi-channel campaign for the target: ${lead.businessName}. 
    Niche: ${lead.niche}. Context: ${lead.socialGap}.
    
    MANDATORY JSON STRUCTURE:
    {
      "presentation": { "title": "Strategic Roadmap", "slides": [{ "title": "Intro", "bullets": ["Point 1"] }] },
      "narrative": "A long, compelling executive narrative...",
      "contentPack": [{ "platform": "LinkedIn", "type": "Text", "caption": "Post content" }],
      "outreach": { "emailSequence": [{ "subject": "Proposal", "body": "Email content" }], "linkedin": "Connect request" },
      "visualDirection": { "brandMood": "Premium", "colorPsychology": [], "aiImagePrompts": [] }
    }`;

  const text = await openRouterChat(prompt);
  const data = JSON.parse(text);
  if (!data.presentation) data.presentation = { title: "Draft", slides: [] };
  if (!data.outreach) data.outreach = { emailSequence: [], linkedin: "" };
  return data;
};

// --- UTILITIES ---

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const text = await openRouterChat(`Audit the business at ${lead.websiteUrl} for ${module}. Return JSON.`);
  const parsed = JSON.parse(text || "{}");
  return { 
    entityName: lead.businessName, missionSummary: "Audit complete.",
    visualStack: [], sonicStack: [], featureGap: "N/A", businessModel: "N/A", 
    designSystem: "N/A", deepArchitecture: "N/A", sources: [], ...parsed 
  };
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, "benchmark");
};

export const generateProposalDraft = async (lead: Lead) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a high-ticket AI transformation proposal for ${lead.businessName}. Focus on ROI.`,
  });
  return response.text || "";
};

export const generateOutreachSequence = async (lead: Lead) => {
  const text = await openRouterChat(`5-step outreach sequence for ${lead.businessName}. JSON array of {day: 1, subject: "", content: ""}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const analyzeLedger = async (leads: Lead[]) => {
  const text = await openRouterChat(`Analyze these leads: ${JSON.stringify(leads)}. JSON: { "risk": "", "opportunity": "" }.`);
  try { return JSON.parse(text); } catch { return { risk: "N/A", opportunity: "N/A" }; }
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const text = await openRouterChat(`Fact check: "${claim}" for ${lead.businessName}. JSON: { "status": "", "evidence": "", "sources": [] }.`);
  try { return JSON.parse(text); } catch { return { status: "Unknown", evidence: "N/A" }; }
};

export const generatePlaybookStrategy = async (niche: string) => {
  const text = await openRouterChat(`Playbook for ${niche}. JSON: { "strategyName": "", "steps": [] }.`);
  try { return JSON.parse(text); } catch { return { strategyName: "Ops", steps: [] }; }
};

export const architectFunnel = async (lead: Lead) => {
  const text = await openRouterChat(`Funnel for ${lead.businessName}. JSON array of {stage: "", title: "", description: "", conversionGoal: ""}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const architectPitchDeck = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch deck for ${lead.businessName}. JSON array of {title: "", narrativeGoal: "", keyVisuals: ""}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generateTaskMatrix = async (lead: Lead) => {
  const text = await openRouterChat(`Tasks for ${lead.businessName}. JSON array of {id: "", task: "", status: "pending"}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const text = await openRouterChat(`Chat for ${lead.businessName}: ${scenario}. JSON array of {role: "", text: ""}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const text = await openRouterChat(`Brand DNA from ${url}. JSON: { "colors": [], "fontPairing": "", "archetype": "", "visualTone": "", "tagline": "", "manifesto": "", "extractedImages": [] }.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const synthesizeProduct = async (lead: Lead) => {
  const text = await openRouterChat(`Product for ${lead.businessName}. JSON: { "productName": "", "tagline": "", "pricePoint": "", "features": [] }.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const generateFlashSparks = async (lead: Lead) => {
  const text = await openRouterChat(`5 hooks for ${lead.businessName}. JSON array of strings.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generatePitch = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch for ${lead.businessName}. JSON: { "pitch": "..." }.`);
  try { return JSON.parse(text).pitch || text; } catch { return text; }
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ROI for ${lead.businessName}. LTV ${ltv}, Vol ${volume}.`,
  });
  return response.text || "";
};

export const synthesizeArticle = async (s: string, m: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesize article: ${s} as ${m}.`,
  });
  return response.text || "";
};

export const loggedGenerateContent = async (opts: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const p = Array.isArray(opts.contents) ? opts.contents.map((c:any)=>c.text||c).join(' ') : opts.contents;
  const response = await ai.models.generateContent({
    model: opts.model || 'gemini-3-flash-preview',
    contents: p,
    config: opts.config
  });
  return response.text || "";
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Lyrics for ${l.businessName}. Style: ${p}.`,
  });
  return response.text || "";
};

export const generateSonicPrompt = async (l: any) => {
  const text = await openRouterChat(`Sonic prompt for ${l.businessName}. JSON: { "prompt": "..." }.`);
  try { return JSON.parse(text).prompt || "Corporate"; } catch { return "Corporate"; }
};

export const enhanceVideoPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance video prompt: "${p}". JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced || p; } catch { return p; }
};

export const enhanceStrategicPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance strategic prompt: "${p}". JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced || p; } catch { return p; }
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const text = await openRouterChat(`Brand for agency in ${region} serving ${niche}. JSON.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const generateAffiliateProgram = async (niche: string) => {
  const text = await openRouterChat(`Affiliate for ${niche}. JSON.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const critiqueVideoPresence = async (lead: Lead) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Video audit for ${lead.businessName}.`,
  });
  return response.text || "";
};

export const translateTactical = async (text: string, lang: string) => {
  const res = await openRouterChat(`Translate to ${lang}: "${text}". JSON: { "translated": "..." }.`);
  try { return JSON.parse(res).translated || res; } catch { return res; }
};

export const fetchViralPulseData = async (niche: string) => {
  const text = await openRouterChat(`Trends in ${niche}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const queryRealtimeAgent = async (q: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: q,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return { 
    text: response.text || "", 
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
  };
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ROI: LTV ${ltv}, Vol ${vol}, Conv ${conv}.`,
  });
  return response.text || "";
};

export const fetchTokenStats = async () => ({ recentOps: [{ op: 'REST_LINK', id: 'OR_FLASH_V3', cost: '0.0001' }] });

export const identifySubRegions = async (theater: string) => {
  const text = await openRouterChat(`List 5 districts in ${theater}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const text = await openRouterChat(`Businesses in ${region} with ${signal}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

// Fix Error: Expected 2 arguments, but got 3.
export const analyzeVideoUrl = async (u: string, p: string, leadId?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze video ${u}. Instruction: ${p}`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return response.text || "";
};

/**
 * Fix Error: Module '"../../services/geminiService"' has no exported member 'analyzeVisual'.
 * Implementation for VisionLab.tsx using Gemini Vision part format.
 */
export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ inlineData: { data: base64, mimeType } }, { text: prompt }] }]
  });
  return response.text || "";
};

// Implementation for CreativeStudio using Gemini 2.5 Flash Image
export const generateVisual = async (prompt: string, lead: any, base64Image?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: prompt }];
  
  if (base64Image) {
    const [mimePart, dataPart] = base64Image.split(';base64,');
    const mimeType = mimePart.split(':')[1];
    parts.unshift({ inlineData: { data: dataPart, mimeType } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const b64 = part.inlineData.data;
      const url = `data:image/png;base64,${b64}`;
      saveAsset('IMAGE', `VISUAL: ${prompt.slice(0, 20)}`, url, 'VISUAL_STUDIO', lead?.id);
      return url;
    }
  }
  return null;
};

// Implementation for VideoPitch using Veo models
export const generateVideoPayload = async (
  prompt: string,
  leadId?: string,
  startImage?: string,
  endImage?: string,
  config?: VeoConfig,
  referenceImages?: string[],
  inputVideo?: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = config?.modelStr || 'veo-3.1-fast-generate-preview';
  
  const videoParams: any = {
    model,
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: config?.resolution || '720p',
      aspectRatio: config?.aspectRatio || '16:9'
    }
  };

  if (startImage) {
    const [mime, data] = startImage.split(';base64,');
    videoParams.image = { imageBytes: data, mimeType: mime.split(':')[1] };
  }
  if (endImage) {
    const [mime, data] = endImage.split(';base64,');
    videoParams.lastFrame = { imageBytes: data, mimeType: mime.split(':')[1] };
  }
  
  let operation = await ai.models.generateVideos(videoParams);
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) return null;
  
  const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoRes.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      saveAsset('VIDEO', `VEO: ${prompt.slice(0, 20)}`, base64, 'VIDEO_STUDIO', leadId);
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

// Implementation for SonicStudio using Gemini TTS models
export const generateAudioPitch = async (text: string, voice: string, leadId?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO" as any], 
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const url = `data:audio/pcm;base64,${base64Audio}`;
    saveAsset('AUDIO', `VOICE: ${text.slice(0, 20)}`, url, 'SONIC_STUDIO', leadId);
    return url;
  }
  return null;
};

// Implementation for Mockups4K
export const generateMockup = async (businessName: string, niche: string, leadId?: string) => {
  return await generateVisual(`A high-end 4k 3D product mockup for ${businessName} in the ${niche} niche. Professional studio lighting.`, { id: leadId });
};

/**
 * Fix Error: Module '"../../services/geminiService"' has no exported member 'testModelPerformance'.
 * Implementation for ModelTest.tsx
 */
export const testModelPerformance = async (model: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: model as any,
    contents: prompt,
  });
  return response.text || "";
};

/**
 * Fix Error: Module '"../../services/geminiService"' has no exported member 'generateMotionLabConcept'.
 * Implementation for MotionLab.tsx
 */
export const generateMotionLabConcept = async (lead: Lead) => {
  const prompt = `Create a motion lab concept for ${lead.businessName}. Lead context: ${lead.socialGap}. JSON { "title": "", "hook": "", "scenes": [{ "time": "0s", "visual": "", "text": "" }] }`;
  const text = await openRouterChat(prompt);
  try {
    return JSON.parse(text);
  } catch {
    return { title: "Draft", hook: "N/A", scenes: [] };
  }
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
