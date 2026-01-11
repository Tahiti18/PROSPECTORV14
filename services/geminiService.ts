
import { Lead } from '../types';
// Add correct SDK imports according to guidelines
import { GoogleGenAI, Type, Modality } from "@google/genai";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "google/gemini-3-flash-preview"; 

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
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
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

// FIX: Updated saveAsset parameter type for strict safety
export const saveAsset = (type: AssetRecord['type'], title: string, data: string, module?: string, leadId?: string, metadata?: any) => {
  const asset: AssetRecord = { id: uuidLike(), type, title, data, module, leadId, timestamp: Date.now(), metadata };
  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return asset;
};

/**
 * NEURAL CLEANER
 * Extracts valid JSON blocks even if the model surrounds them with conversational noise.
 */
const extractJson = (text: string) => {
  if (!text) return "";
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return text.substring(start, end + 1);
    }
  } catch (e) {}
  return text;
};

/**
 * OPENROUTER REST INTERFACE
 * Standardized for Gemini 3 Flash.
 */
export const openRouterChat = async (prompt: string, systemInstruction?: string, tools?: any[], imageData?: { data: string, mimeType: string }) => {
  const systemText = systemInstruction || "You are the Lead Strategist. Always output valid JSON. No conversational filler.";
  
  const messages: any[] = [
    { role: "system", content: systemText },
    { role: "user", content: prompt }
  ];

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Prospector OS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: messages,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || "Gateway Denied Request");
    }

    const result = await response.json();
    return extractJson(result.choices?.[0]?.message?.content || "");
  } catch (e: any) {
    pushLog(`REST_FAULT: ${e.message}`);
    throw e;
  }
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`SCANNER: Probing ${region} for ${niche} signals...`);
  const prompt = `Find ${count} high-ticket B2B leads in ${region} for ${niche}. 
    Return a JSON array of objects with keys: businessName, websiteUrl, city, niche, leadScore (0-100), assetGrade (A/B/C), socialGap.`;
  const text = await openRouterChat(prompt, "Output ONLY a raw JSON array.");
  try {
    const leads = JSON.parse(text);
    return { leads: Array.isArray(leads) ? leads : [], groundingSources: [] };
  } catch (e) {
    return { leads: [], groundingSources: [] };
  }
};

/**
 * CAMPAIGN ORCHESTRATOR
 * Optimized prompt to prevent Flash truncation.
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Synthesizing campaign for ${lead.businessName}...`);
  const prompt = `Architect a multi-channel campaign for ${lead.businessName}. 
    MANDATORY JSON KEYS: 
    "presentation" (title, slides array with title/bullets), 
    "narrative" (long string), 
    "contentPack" (array with platform, caption), 
    "outreach" (emailSequence array with subject/body, linkedin string), 
    "visualDirection" (brandMood, colorPsychology array, aiImagePrompts array).
    CONTEXT: ${lead.niche} in ${lead.city}. Gaps: ${lead.socialGap}.`;

  const text = await openRouterChat(prompt);
  try {
    return JSON.parse(text);
  } catch (e) {
    pushLog("FORGE_ERROR: AI result was not valid JSON.");
    throw new Error("RETRY: Model failed to produce valid campaign data.");
  }
};

// --- UTILITIES ---

export const identifySubRegions = async (theater: string) => {
  const text = await openRouterChat(`List 5 business districts in ${theater}. JSON array of strings.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const text = await openRouterChat(`Find leads in ${region} exhibiting ${signal}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
    const text = await openRouterChat(`Audit ${lead.websiteUrl}. JSON: { entityName, missionSummary, visualStack: [], sonicStack: [], featureGap, businessModel, designSystem, deepArchitecture }.`);
    const parsed = JSON.parse(text || "{}");
    return { ...parsed, sources: [] };
};

export const generateProposalDraft = async (lead: Lead) => {
  return await openRouterChat(`Write a proposal for ${lead.businessName}. Focus on AI ROI.`);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const text = await openRouterChat(`5-step email sequence for ${lead.businessName}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const analyzeLedger = async (leads: Lead[]) => {
  const text = await openRouterChat(`Analyze market risk/opportunity for these leads: ${JSON.stringify(leads)}. JSON: { risk, opportunity }.`);
  try { return JSON.parse(text); } catch { return { risk: "N/A", opportunity: "N/A" }; }
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const text = await openRouterChat(`Verify claim: "${claim}" for ${lead.businessName}. JSON: { status, evidence, sources: [] }.`);
  try { return JSON.parse(text); } catch { return { status: "Unknown", evidence: "N/A" }; }
};

export const generatePlaybookStrategy = async (niche: string) => {
  const text = await openRouterChat(`Steps to dominate ${niche}. JSON: { strategyName, steps: [] }.`);
  try { return JSON.parse(text); } catch { return { strategyName: "Standard Ops", steps: [] }; }
};

export const architectFunnel = async (lead: Lead) => {
  const text = await openRouterChat(`Conversion funnel for ${lead.businessName}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const architectPitchDeck = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch deck outline for ${lead.businessName}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generateTaskMatrix = async (lead: Lead) => {
  const text = await openRouterChat(`Action items for ${lead.businessName}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const text = await openRouterChat(`Chat simulation for ${lead.businessName}: ${scenario}. JSON array of {role, text}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const text = await openRouterChat(`Extract brand DNA from ${url}. JSON: { colors: [], fontPairing, archetype, visualTone, tagline, manifesto, extractedImages: [] }.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const synthesizeProduct = async (lead: Lead) => {
  const text = await openRouterChat(`New AI product offer for ${lead.businessName}. JSON: { productName, tagline, pricePoint, features: [] }.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const generateFlashSparks = async (lead: Lead) => {
  const text = await openRouterChat(`5 viral hooks for ${lead.businessName}. JSON array of strings.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generatePitch = async (lead: Lead) => {
  const text = await openRouterChat(`Elevator pitch for ${lead.businessName}. JSON: { "pitch": "..." }.`);
  try { return JSON.parse(text).pitch || text; } catch { return text; }
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await openRouterChat(`Projected growth for ${lead.businessName}. LTV: ${ltv}, Vol: ${volume}. Output marketing report.`);
};

export const synthesizeArticle = async (s: string, m: string) => {
  return await openRouterChat(`Synthesize source: ${s} as ${m}.`);
};

export const loggedGenerateContent = async (opts: any) => {
  const prompt = Array.isArray(opts.contents) ? opts.contents.map((c:any)=>c.text||c).join(' ') : opts.contents;
  return await openRouterChat(prompt, opts.config?.systemInstruction);
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  return await openRouterChat(`Commercial lyrics for ${l.businessName}. Style: ${p}. Type: ${t}. Return plain text lyrics.`);
};

export const generateSonicPrompt = async (l: any) => {
  const text = await openRouterChat(`Musical description for ${l.businessName} jingle. JSON: { "prompt": "..." }.`);
  try { return JSON.parse(text).prompt || "Corporate ambient"; } catch { return "Corporate ambient"; }
};

export const enhanceVideoPrompt = async (p: string) => {
  const text = await openRouterChat(`Make this video prompt cinematic: "${p}". JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced || p; } catch { return p; }
};

export const enhanceStrategicPrompt = async (p: string) => {
  const text = await openRouterChat(`Deepen this strategic instruction: "${p}". JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced || p; } catch { return p; }
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const text = await openRouterChat(`Brand for an agency in ${region} serving ${niche}. JSON: { name, tagline, manifesto, colors: [] }.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const generateAffiliateProgram = async (niche: string) => {
  const text = await openRouterChat(`Affiliate structure for ${niche}. JSON: { programName, tiers: [], recruitScript }.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await openRouterChat(`Audit video content for ${lead.businessName}.`);
};

export const translateTactical = async (text: string, lang: string) => {
  const res = await openRouterChat(`Translate to ${lang}: "${text}". JSON: { "translated": "..." }.`);
  try { return JSON.parse(res).translated || res; } catch { return res; }
};

export const fetchViralPulseData = async (niche: string) => {
  const text = await openRouterChat(`Viral trends in ${niche}. JSON array: [ { label, val, type: 'up'|'down' } ].`);
  try { return JSON.parse(text); } catch { return []; }
};

export const queryRealtimeAgent = async (q: string) => {
  const text = await openRouterChat(q);
  return { text, sources: [] };
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  return await openRouterChat(`ROI calculation: LTV ${ltv}, Vol ${vol}, Conv-Lift ${conv}%.`);
};

export const fetchTokenStats = async () => ({ recentOps: [{ op: 'REST_LINK', id: 'GEMINI_FLASH_V3', cost: '0.0001' }] });

// --- SDK IMPLEMENTATIONS (FIX ERRORS) ---

// Fix error: Module '"../../services/geminiService"' has no exported member 'analyzeVisual'.
/**
 * VISION ANALYSIS
 * Preferred for high-fidelity optic deconstruction.
 */
export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  pushLog(`VISION: Analyzing neural plate...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: prompt }
      ]
    }
  });
  return response.text || "No analysis generated.";
};

// Fix error: Module '"../../services/geminiService"' has no exported member 'fetchLiveIntel'.
/**
 * LIVE INTEL (SEARCH GROUNDED)
 * Performs real-time audit via Google Search Grounding.
 */
export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  pushLog(`INTEL: Scouring grounded vectors for ${lead.businessName}...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Audit the business at ${lead.websiteUrl} for ${module}. Provide a technical benchmark report.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });

  const text = extractJson(response.text || "{}");
  try {
    const parsed = JSON.parse(text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
      title: c.web?.title || 'Intelligence Node',
      uri: c.web?.uri || ''
    })) || [];
    return { 
      entityName: lead.businessName,
      missionSummary: "Grounded analysis complete.",
      visualStack: [], 
      sonicStack: [], 
      featureGap: "N/A", 
      businessModel: "N/A", 
      designSystem: "N/A", 
      deepArchitecture: "N/A", 
      ...parsed, 
      sources 
    };
  } catch (e) {
    return {
      entityName: lead.businessName,
      missionSummary: "Parsing failure on intel stream.",
      visualStack: [],
      sonicStack: [],
      featureGap: "N/A",
      businessModel: "N/A",
      designSystem: "N/A",
      deepArchitecture: "N/A",
      sources: []
    };
  }
};

// Fix error: Module '"../../services/geminiService"' has no exported member 'testModelPerformance'.
/**
 * MODEL PERFORMANCE TEST
 */
export const testModelPerformance = async (model: string, prompt: string) => {
  pushLog(`BENCHMARK: Stress testing ${model}...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: model as any,
    contents: prompt
  });
  return response.text || "No response from neural core.";
};

// Fix error: Module '"../../services/geminiService"' has no exported member 'generateMotionLabConcept'.
/**
 * MOTION LAB CONCEPT
 * Generates cinematic storyboards.
 */
export const generateMotionLabConcept = async (lead: Lead) => {
  pushLog(`MOTION: Storyboarding for ${lead.businessName}...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a cinematic motion graphics concept for ${lead.businessName}. Return JSON with fields: title, hook, scenes (array of {time, visual, text}).`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(extractJson(response.text || "{}"));
};

// Fix error: Module '"../../services/geminiService"' has no exported member 'analyzeVideoUrl'.
/**
 * VIDEO URL ANALYSIS (SEARCH GROUNDED)
 */
export const analyzeVideoUrl = async (url: string, prompt: string, leadId?: string) => {
  pushLog(`CINEMA: Decoding temporal stream ${url}...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this video: ${url}. Mission: ${prompt}`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "Analysis offline.";
};

// Fix: Implement visual generation using Nano Banana
export const generateVisual = async (prompt: string, lead: any, editImageBase64?: string) => {
  pushLog(`FORGE: Synthesizing visual asset...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: prompt }];
  
  if (editImageBase64) {
    const data = editImageBase64.split(',')[1] || editImageBase64;
    const mimeType = editImageBase64.split(';')[0].split(':')[1] || 'image/png';
    parts.unshift({ inlineData: { mimeType, data } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts }
  });

  // Iterating parts to find image content according to guidelines
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const url = `data:image/png;base64,${part.inlineData.data}`;
      saveAsset('IMAGE', `VISUAL: ${prompt.slice(0, 30)}`, url, 'VISUAL_STUDIO', lead?.id);
      return url;
    }
  }
  return null;
};

// Fix: Implement video generation using Veo
export const generateVideoPayload = async (
  prompt: string, 
  leadId?: string, 
  startImage?: string, 
  endImage?: string, 
  config?: VeoConfig, 
  referenceImages?: string[], 
  inputVideo?: string
) => {
  pushLog(`VEO: Initializing video render...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const videoConfig: any = {
    numberOfVideos: 1,
    resolution: config?.resolution || '720p',
    aspectRatio: config?.aspectRatio || '16:9'
  };

  const payload: any = {
    model: config?.modelStr || 'veo-3.1-fast-generate-preview',
    prompt,
    config: videoConfig
  };

  if (startImage) {
    payload.image = {
      imageBytes: startImage.split(',')[1] || startImage,
      mimeType: 'image/png'
    };
  }

  if (endImage) {
    payload.config.lastFrame = {
      imageBytes: endImage.split(',')[1] || endImage,
      mimeType: 'image/png'
    };
  }

  let operation = await ai.models.generateVideos(payload);
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoRes.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      saveAsset('VIDEO', `VEO_CLIP: ${prompt.slice(0, 30)}`, base64, 'VIDEO_STUDIO', leadId);
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

// Fix: Implement speech generation using Gemini TTS
export const generateAudioPitch = async (text: string, voice: string, leadId?: string) => {
  pushLog(`SONIC: Synthesizing voice profile...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const url = `data:audio/pcm;base64,${base64Audio}`;
    saveAsset('AUDIO', `PITCH: ${text.slice(0, 20)}...`, url, 'SONIC_STUDIO', leadId);
    return url;
  }
  return null;
};

// Fix: Implement mockup generation using the existing visual engine
export const generateMockup = async (businessName: string, niche: string, leadId?: string) => {
  const prompt = `Premium 4K product mockup for ${businessName} in the ${niche} industry. High resolution, professional studio lighting, depth of field.`;
  return await generateVisual(prompt, { id: leadId });
};

// Fix: Correct AI instance retrieval
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
