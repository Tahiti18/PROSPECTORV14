
import { Lead } from '../types';
import { GoogleGenAI, Type, Modality } from "@google/genai";

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

export const saveAsset = (type: AssetRecord['type'], title: string, data: string, module?: string, leadId?: string, metadata?: any) => {
  const asset: AssetRecord = { id: uuidLike(), type, title, data, module, leadId, timestamp: Date.now(), metadata };
  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return asset;
};

/**
 * NEURAL PARSER
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

// Standardized SDK Call Wrapper
export const openRouterChat = async (prompt: string, systemInstruction?: string, tools?: any[], imageData?: { data: string, mimeType: string }) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = tools?.some(t => t.googleSearch) ? 'gemini-3-flash-preview' : 'gemini-3-flash-preview';
  
  let contents: any = prompt;
  if (imageData) {
    contents = {
      parts: [
        { inlineData: imageData },
        { text: prompt }
      ]
    };
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: systemInstruction || "You are the Executive Director of Prospector OS. Output strategic analysis in JSON format.",
      responseMimeType: tools?.some(t => t.googleSearch) ? undefined : "application/json",
      tools: tools
    }
  });

  return extractJson(response.text || "");
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`LEAD_ENGINE: Initiating search in ${region}...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find ${count} high-ticket B2B leads for "${niche}" in "${region}". Return a JSON array of objects with businessName, websiteUrl, city, niche, leadScore (0-100), assetGrade (A/B/C), socialGap.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const text = extractJson(response.text || "[]");
  const leads = JSON.parse(text);
  const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
    title: c.web?.title || 'Search Node',
    uri: c.web?.uri || ''
  })) || [];

  return { leads, groundingSources };
};

/**
 * STRATEGIC ORCHESTRATOR
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`ORCHESTRATOR: Constructing strategy for ${lead.businessName}...`);
  const prompt = `Construct a comprehensive marketing campaign for ${lead.businessName}. 
    MANDATORY JSON FORMAT:
    {
      "presentation": { "title": "...", "slides": [{ "title": "...", "bullets": ["..."], "visualRef": "..." }] },
      "narrative": "A long sales narrative...",
      "contentPack": [{ "platform": "...", "type": "...", "caption": "..." }],
      "outreach": { "emailSequence": [{ "subject": "...", "body": "..." }], "linkedin": "..." },
      "visualDirection": { "brandMood": "...", "colorPsychology": [{"color": "#HEX", "purpose": "..."}], "visualThemes": ["..."], "aiImagePrompts": [{"use_case": "...", "prompt": "..."}] }
    }`;

  const text = await openRouterChat(prompt);
  return JSON.parse(text);
};

// --- CORE UTILITIES ---

export const analyzeVisual = async (data: string, mime: string, p: string) => {
  pushLog("VISION: Analyzing visual plate...");
  return await openRouterChat(p, "Analyze this visual data for business intel.", undefined, { data, mimeType: mime });
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  pushLog(`INTEL: Scouring grounded vectors for ${lead.businessName}...`);
  const text = await openRouterChat(`Technical audit for ${lead.websiteUrl} focus on ${module}. Provide JSON with: entityName, missionSummary, visualStack, sonicStack, featureGap, businessModel, designSystem, deepArchitecture.`, undefined, [{ googleSearch: {} }]);
  const parsed = JSON.parse(text || "{}");
  return { 
    entityName: lead.businessName, missionSummary: "Audit complete.",
    visualStack: [], sonicStack: [], featureGap: "N/A", businessModel: "N/A", 
    designSystem: "N/A", deepArchitecture: "N/A", sources: [], ...parsed 
  };
};

export const testModelPerformance = async (m: string, p: string) => {
  pushLog(`BENCHMARK: Stress testing ${m}...`);
  return await openRouterChat(p);
};

export const generateMotionLabConcept = async (lead: Lead) => {
  pushLog(`MOTION: Storyboarding for ${lead.businessName}...`);
  const text = await openRouterChat(`Create a cinematic storyboard concept for ${lead.businessName}. Return JSON with: title, hook, scenes (array of {time, visual, text}).`);
  return JSON.parse(text || "{}");
};

export const analyzeVideoUrl = async (u: string, p: string, id?: string) => {
  pushLog(`CINEMA: Decoding temporal stream ${u}...`);
  return await openRouterChat(`Analyze video at ${u}. Mission: ${p}`, undefined, [{ googleSearch: {} }]);
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, "benchmark");
};

export const generateProposalDraft = async (lead: Lead) => {
  return await openRouterChat(`Write a high-ticket AI transformation proposal for ${lead.businessName}.`);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const text = await openRouterChat(`5-day outreach sequence for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const analyzeLedger = async (leads: Lead[]) => {
  const text = await openRouterChat(`Analyze these leads: ${JSON.stringify(leads)}. Return JSON with { risk, opportunity }.`);
  return JSON.parse(text || "{}");
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const text = await openRouterChat(`Fact check: "${claim}" for ${lead.businessName}. Return JSON with { status, evidence, sources: [] }.`, undefined, [{ googleSearch: {} }]);
  return JSON.parse(text || "{}");
};

export const generatePlaybookStrategy = async (niche: string) => {
  const text = await openRouterChat(`Playbook for ${niche}. Return JSON with { strategyName, steps: [] }.`);
  return JSON.parse(text || "{}");
};

export const architectFunnel = async (lead: Lead) => {
  const text = await openRouterChat(`Funnel map for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const architectPitchDeck = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch deck slides for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const generateTaskMatrix = async (lead: Lead) => {
  const text = await openRouterChat(`Task list for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const text = await openRouterChat(`Chat simulation for ${lead.businessName}: ${scenario}. Return JSON array of {role, text}.`);
  return JSON.parse(text || "[]");
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const text = await openRouterChat(`Extract brand DNA from ${url}. Return JSON with colors: [], fontPairing, archetype, visualTone, tagline, manifesto, extractedImages: [].`, undefined, [{ googleSearch: {} }]);
  return JSON.parse(text || "{}");
};

export const synthesizeProduct = async (lead: Lead) => {
  const text = await openRouterChat(`Offer design for ${lead.businessName}. Return JSON.`);
  return JSON.parse(text || "{}");
};

export const generateFlashSparks = async (lead: Lead) => {
  const text = await openRouterChat(`5 viral hooks for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const generatePitch = async (lead: Lead) => {
  const text = await openRouterChat(`Elevator pitch for ${lead.businessName}. Return JSON: { "pitch": "..." }.`);
  try { return JSON.parse(text).pitch || text; } catch { return text; }
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await openRouterChat(`Growth simulation for ${lead.businessName}. LTV ${ltv}, Vol ${volume}.`);
};

export const synthesizeArticle = async (s: string, m: string) => {
  return await openRouterChat(`Synthesize article: ${s} as ${m}.`, undefined, [{ googleSearch: {} }]);
};

export const loggedGenerateContent = async (opts: any) => {
  const prompt = Array.isArray(opts.contents) ? opts.contents.map((c: any) => c.text || c).join('\n') : opts.contents;
  return await openRouterChat(prompt, opts.config?.systemInstruction);
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  return await openRouterChat(`Commercial lyrics for ${l.businessName}. Style: ${p}.`);
};

export const generateSonicPrompt = async (l: any) => {
  const text = await openRouterChat(`Musical prompt for ${l.businessName}. Return JSON: { "prompt": "..." }.`);
  try { return JSON.parse(text).prompt || "Corporate ambient"; } catch { return "Corporate ambient"; }
};

export const enhanceVideoPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance video prompt: "${p}". Return JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced || p; } catch { return p; }
};

export const enhanceStrategicPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance strategic prompt: "${p}". Return JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced || p; } catch { return p; }
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const text = await openRouterChat(`Identity for agency in ${region} serving ${niche}. Return JSON.`);
  return JSON.parse(text || "{}");
};

export const generateAffiliateProgram = async (niche: string) => {
  const text = await openRouterChat(`Affiliate matrix for ${niche}. Return JSON.`);
  return JSON.parse(text || "{}");
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await openRouterChat(`Video audit for ${lead.businessName}.`, undefined, [{ googleSearch: {} }]);
};

export const translateTactical = async (text: string, lang: string) => {
  const res = await openRouterChat(`Translate to ${lang}: "${text}". Return JSON: { "translated": "..." }.`);
  try { return JSON.parse(res).translated || res; } catch { return res; }
};

export const fetchViralPulseData = async (niche: string) => {
  const text = await openRouterChat(`Viral trends in ${niche}. Return JSON array.`, undefined, [{ googleSearch: {} }]);
  return JSON.parse(text || "[]");
};

export const queryRealtimeAgent = async (q: string) => {
  const text = await openRouterChat(q, undefined, [{ googleSearch: {} }]);
  return { text, sources: [] };
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  return await openRouterChat(`ROI calculation: LTV ${ltv}, Vol ${vol}, Conv ${conv}.`);
};

export const fetchTokenStats = async () => ({ recentOps: [{ op: 'SDK_LINK', id: 'GEMINI_V3', cost: '0.0001' }] });

export const identifySubRegions = async (theater: string) => {
  const text = await openRouterChat(`5 sub-regions in ${theater}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const text = await openRouterChat(`Leads in ${region} with signal: ${signal}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

// --- GATED ASSETS (SDK IMPLEMENTATION) ---

export const generateVisual = async (prompt: string, lead: any, editImage?: string) => {
  pushLog(`FORGE: Synthesizing visual asset...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const contents: any = editImage 
    ? { parts: [{ inlineData: { data: editImage.split(',')[1], mimeType: 'image/png' } }, { text: prompt }] }
    : prompt;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const url = `data:image/png;base64,${part.inlineData.data}`;
      saveAsset('IMAGE', `VISUAL: ${prompt.slice(0, 20)}`, url, 'VISUAL_STUDIO', lead?.id);
      return url;
    }
  }
  return null;
};

// Added missing parameters (referenceImages, inputVideo) to match call site in VideoPitch.tsx
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
  
  // Use veo-3.1-generate-preview if reference images are provided
  const model = (referenceImages && referenceImages.length > 0) 
    ? 'veo-3.1-generate-preview' 
    : (config?.modelStr || 'veo-3.1-fast-generate-preview');

  const videoParams: any = {
    model,
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: (referenceImages && referenceImages.length > 0) ? '720p' : (config?.resolution || '720p'),
      aspectRatio: (referenceImages && referenceImages.length > 0) ? '16:9' : (config?.aspectRatio || '16:9'),
    }
  };

  if (startImage) {
    videoParams.image = {
      imageBytes: startImage.includes(',') ? startImage.split(',')[1] : startImage,
      mimeType: 'image/png'
    };
  }

  if (endImage) {
    videoParams.config.lastFrame = {
      imageBytes: endImage.includes(',') ? endImage.split(',')[1] : endImage,
      mimeType: 'image/png'
    };
  }

  if (referenceImages && referenceImages.length > 0) {
    videoParams.config.referenceImages = referenceImages.map(img => ({
      image: {
        imageBytes: img.includes(',') ? img.split(',')[1] : img,
        mimeType: 'image/png'
      },
      referenceType: 'ASSET'
    }));
  }

  if (inputVideo) {
    // If it's a URI, we can use it for extension as per guidelines
    if (inputVideo.startsWith('http')) {
        videoParams.video = { uri: inputVideo };
    }
  }

  let operation = await ai.models.generateVideos(videoParams);

  while (!operation.done) {
    await new Promise(r => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const link = operation.response?.generatedVideos?.[0]?.video?.uri;
  const url = `${link}&key=${process.env.API_KEY}`;
  saveAsset('VIDEO', `VEO: ${prompt.slice(0, 20)}`, url, 'VIDEO_STUDIO', leadId);
  return url;
};

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

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const url = `data:audio/pcm;base64,${base64Audio}`;
    saveAsset('AUDIO', `PITCH: ${text.slice(0, 20)}`, url, 'SONIC_STUDIO', leadId);
    return url;
  }
  return null;
};

export const generateMockup = async (b: string, n: string, id?: string) => {
  const p = `High-end 4k product mockup for ${b}, a ${n} business. Professional product photography.`;
  return await generateVisual(p, { id });
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
