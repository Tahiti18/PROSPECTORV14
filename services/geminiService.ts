
import { Lead } from '../types';
// Fixed: Use @google/genai SDK instead of hardcoded OpenRouter implementation
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Removed hardcoded sk-or key for security compliance
// Using process.env.API_KEY exclusively as per guidelines

// Hard-locked to Gemini 3 series for primary reasoning
const PRIMARY_MODEL = "gemini-3-flash-preview"; 

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

// Fixed: Export VeoConfig to resolve build error in VideoPitch.tsx
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

export const saveAsset = (type: any, title: string, data: string, module?: string, leadId?: string, metadata?: any) => {
  const asset: AssetRecord = { id: uuidLike(), type, title, data, module, leadId, timestamp: Date.now(), metadata };
  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return asset;
};

/**
 * NEURAL PARSER
 * Aggressively extracts JSON blocks from conversational responses.
 */
const extractJson = (text: string) => {
  if (!text) return "";
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return match ? match[0] : text;
};

/**
 * GEMINI GENERIC INTERFACE
 * Standardized wrapper for generateContent using @google/genai SDK.
 * Note: Tools like googleSearch disable responseMimeType: "application/json".
 */
export const openRouterChat = async (prompt: string, systemInstruction?: string, tools?: any[], imageData?: { data: string, mimeType: string }) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemText = systemInstruction || "You are the Executive Director of Prospector OS. Strictly output strategic analysis in JSON format.";
  
  let contents: any = prompt;
  if (imageData) {
    contents = {
      parts: [
        { text: prompt },
        { inlineData: imageData }
      ]
    };
  }

  const config: any = {
    systemInstruction: systemText,
  };

  // Grounding tools prevent JSON forced output at SDK level
  if (tools && tools.length > 0) {
    config.tools = tools;
  } else {
    config.responseMimeType = "application/json";
  }

  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents,
      config
    });

    return extractJson(response.text || "");
  } catch (e: any) {
    pushLog(`NEURAL_FAULT: ${e.message}`);
    throw e;
  }
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`LEAD_ENGINE: Initiating scan in ${region}...`);
  const prompt = `MISSION: Find ${count} B2B leads for "${niche}" in "${region}". Return ONLY a JSON array of objects with businessName, websiteUrl, city, niche, leadScore (0-100), assetGrade (A/B/C), socialGap.`;
  
  // Lead discovery requires search grounding
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const text = extractJson(response.text || "");
  const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title,
    uri: chunk.web?.uri
  })) || [];

  return { leads: JSON.parse(text || "[]"), groundingSources };
};

/**
 * STRATEGIC ORCHESTRATOR
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`ORCHESTRATOR: Constructing strategy for ${lead.businessName}...`);
  
  const prompt = `TASK: Orchestrate a comprehensive marketing campaign for ${lead.businessName}.
    CONTEXT: ${lead.niche} in ${lead.city}. Gaps identified: ${lead.socialGap}.
    
    YOU MUST RETURN A SINGLE JSON OBJECT WITH THESE EXACT TOP-LEVEL KEYS:
    {
      "presentation": {
        "title": "A Bold Strategy Title",
        "slides": [
          {"title": "Mission Overview", "bullets": ["Point A", "Point B"], "visualRef": "Image description"}
        ]
      },
      "narrative": "A long-form executive sales narrative (min 500 words).",
      "contentPack": [
        {"platform": "Instagram", "type": "Reel", "caption": "Caption text", "assetRef": "visual-ref"}
      ],
      "outreach": {
        "emailSequence": [
          {"subject": "The Hook", "body": "Full email text"}
        ],
        "linkedin": "A connection message"
      },
      "visualDirection": {
        "brandMood": "Elegant, Tech-forward, Premium",
        "colorPsychology": [{"color": "#10b981", "purpose": "Growth/Trust"}],
        "visualThemes": ["Dark UI", "Neon Accents"],
        "aiImagePrompts": [{"use_case": "Main Hero", "prompt": "4k realistic interior"}],
        "aiVideoPrompts": [{"use_case": "Logo intro", "prompt": "3d metallic motion"}]
      }
    }`;

  const text = await openRouterChat(prompt);
  try {
    return JSON.parse(text);
  } catch (e) {
    pushLog("ORCHESTRATOR_FAULT: Malformed JSON returned.");
    throw new Error("ORCHESTRATOR_FAULT: Data corrupted during transit.");
  }
};

// --- MISC UTILITIES ---

export const identifySubRegions = async (theater: string) => {
  const text = await openRouterChat(`Identify 5 districts in "${theater}". Return JSON array of strings.`);
  return JSON.parse(text || "[]");
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const text = await openRouterChat(`Find 3 businesses in ${region} with signal: "${signal}". Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
    const text = await openRouterChat(`Benchmark for ${lead.websiteUrl}. Return JSON: { entityName, missionSummary, visualStack: [], sonicStack: [], featureGap, businessModel, designSystem, deepArchitecture }.`, undefined, [{ googleSearch: {} }]);
    return { ...JSON.parse(text || "{}"), sources: [] };
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  return await fetchBenchmarkData(lead);
};

export const generateProposalDraft = async (lead: Lead) => {
  return await openRouterChat(`Write a proposal for ${lead.businessName}. Return UI_BLOCKS format.`);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const text = await openRouterChat(`5-day sequence for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const analyzeLedger = async (leads: Lead[]) => {
  const text = await openRouterChat(`Analyze these leads: ${JSON.stringify(leads)}. Return JSON: { risk, opportunity }.`);
  return JSON.parse(text || "{}");
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const text = await openRouterChat(`Fact check: "${claim}" for ${lead.businessName}. Return JSON: { status, evidence, sources: [] }.`, undefined, [{ googleSearch: {} }]);
  return JSON.parse(text || "{}");
};

export const generatePlaybookStrategy = async (niche: string) => {
  const text = await openRouterChat(`Playbook for ${niche}. Return JSON: { strategyName, steps: [] }.`);
  return JSON.parse(text || "{}");
};

export const architectFunnel = async (lead: Lead) => {
  const text = await openRouterChat(`Funnel for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const architectPitchDeck = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch deck slides for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const generateTaskMatrix = async (lead: Lead) => {
  const text = await openRouterChat(`Tasks for ${lead.businessName}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const text = await openRouterChat(`Dialogue for ${lead.businessName}: ${scenario}. Return JSON array.`);
  return JSON.parse(text || "[]");
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const text = await openRouterChat(`Brand DNA for ${url}. Return JSON: { colors: [], fontPairing, archetype, visualTone, tagline, brandValues, logoUrl, extractedImages }.`, undefined, [{ googleSearch: {} }]);
  return JSON.parse(text || "{}");
};

export const synthesizeProduct = async (lead: Lead) => {
  const text = await openRouterChat(`Offer design for ${lead.businessName}. Return JSON.`);
  return JSON.parse(text || "{}");
};

export const generateFlashSparks = async (lead: Lead) => {
  const text = await openRouterChat(`5 viral sparks for ${lead.businessName}. Return JSON array of strings.`);
  return JSON.parse(text || "[]");
};

export const generatePitch = async (lead: Lead) => {
  const text = await openRouterChat(`Elevator pitch for ${lead.businessName}. Return JSON: { "pitch": "..." }.`);
  try { return JSON.parse(text).pitch || text; } catch(e) { return text; }
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const text = await openRouterChat(`Motion storyboard for ${lead.businessName}. Return JSON.`);
  return JSON.parse(text || "{}");
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await openRouterChat(`Simulation for ${lead.businessName}. LTV: ${ltv}, Vol: ${volume}. Return UI_BLOCKS.`);
};

export const analyzeVisual = async (data: string, mime: string, p: string) => {
  return await openRouterChat(p, undefined, undefined, { data, mimeType: mime });
};

export const analyzeVideoUrl = async (u: string, p: string, id?: string) => {
  return await openRouterChat(`Grounded video audit: ${u}. Mission: ${p}. Use UI_BLOCKS format.`, undefined, [{ googleSearch: {} }]);
};

export const synthesizeArticle = async (s: string, m: string) => {
  return await openRouterChat(`Article synthesis: ${s}. Mode: ${m}. Return UI_BLOCKS.`, undefined, [{ googleSearch: {} }]);
};

export const loggedGenerateContent = async (opts: any) => {
  let prompt = opts.contents;
  if (Array.isArray(prompt)) prompt = prompt.map((p: any) => p.text || p).join('\n');
  if (typeof prompt === 'object' && prompt.parts) prompt = prompt.parts.map((p: any) => p.text || p).join('\n');
  return await openRouterChat(prompt, opts.config?.systemInstruction, opts.config?.tools);
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  return await openRouterChat(`Lyrics for ${l.businessName}. Context: ${p}.`, "Return plain text lyrics.");
};

export const generateSonicPrompt = async (l: any) => {
  const text = await openRouterChat(`Sonic description for ${l.businessName}. Return JSON: { "prompt": "..." }.`);
  try { return JSON.parse(text).prompt; } catch(e) { return "Corporate ambient."; }
};

export const enhanceVideoPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance video prompt: "${p}". Return JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced; } catch(e) { return p; }
};

export const enhanceStrategicPrompt = async (p: string) => {
  const text = await openRouterChat(`Expand strategic directive: "${p}". Return JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced; } catch(e) { return p; }
};

export const testModelPerformance = async (m: string, p: string) => {
  return await openRouterChat(p);
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const text = await openRouterChat(`Agency identity for ${niche} in ${region}. Return JSON.`);
  return JSON.parse(text || "{}");
};

export const generateAffiliateProgram = async (niche: string) => {
  const text = await openRouterChat(`Affiliate program for ${niche}. Return JSON.`);
  return JSON.parse(text || "{}");
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await openRouterChat(`Critique video presence for ${lead.businessName}. Use UI_BLOCKS.`, undefined, [{ googleSearch: {} }]);
};

export const translateTactical = async (text: string, lang: string) => {
  const res = await openRouterChat(`Translate to ${lang}: "${text}". Return JSON: { "translated": "..." }.`);
  try { return JSON.parse(res).translated; } catch(e) { return res; }
};

export const fetchViralPulseData = async (niche: string) => {
  const text = await openRouterChat(`Pulse for ${niche}. Return JSON array.`, undefined, [{ googleSearch: {} }]);
  return JSON.parse(text || "[]");
};

export const queryRealtimeAgent = async (q: string) => {
  const text = await openRouterChat(q, "Use UI_BLOCKS format.", [{ googleSearch: {} }]);
  return { text, sources: [] };
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  return await openRouterChat(`ROI Report: LTV ${ltv}, Vol ${vol}, Conv ${conv}. Use UI_BLOCKS.`);
};

export const fetchTokenStats = async () => ({ recentOps: [{ op: 'Google_Link', id: 'GEMINI_V3', cost: '0.0001' }] });

// --- GATED ASSETS (GEMINI SDK IMPLEMENTATION) ---

/**
 * NANO BANANA IMAGE GENERATION
 */
export const generateVisual = async (p: string, l: any, e?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents: any = {
    parts: [
      e ? { inlineData: { data: e.split(',')[1], mimeType: e.split(';')[0].split(':')[1] } } : null,
      { text: p }
    ].filter(Boolean) as any
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents,
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        saveAsset('IMAGE', p.slice(0, 30), url, 'CREATIVE_STUDIO', l?.id);
        return url;
      }
    }
  } catch (err: any) {
    pushLog(`IMAGE_GEN_FAULT: ${err.message}`);
  }
  return null;
};

/**
 * VEO 3.1 VIDEO GENERATION
 */
export const generateVideoPayload = async (
  prompt: string, 
  leadId?: string, 
  startImage?: string, 
  endImage?: string, 
  config?: VeoConfig,
  referenceImages?: string[],
  inputVideo?: any
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const model = config?.modelStr || 'veo-3.1-fast-generate-preview';
  const videoConfig: any = {
    numberOfVideos: 1,
    resolution: config?.resolution || '720p',
    aspectRatio: config?.aspectRatio || '16:9'
  };

  const payload: any = {
    model,
    prompt,
    config: videoConfig
  };

  if (startImage) {
    payload.image = {
      imageBytes: startImage.includes(',') ? startImage.split(',')[1] : startImage,
      mimeType: startImage.includes(';') ? startImage.split(';')[0].split(':')[1] : 'image/png'
    };
  }

  if (endImage) {
    payload.lastFrame = {
      imageBytes: endImage.includes(',') ? endImage.split(',')[1] : endImage,
      mimeType: endImage.includes(';') ? endImage.split(';')[0].split(':')[1] : 'image/png'
    };
  }

  if (referenceImages && referenceImages.length > 0) {
    payload.model = 'veo-3.1-generate-preview';
    payload.config.referenceImages = referenceImages.map(img => ({
      image: {
        imageBytes: img.split(',')[1],
        mimeType: img.split(';')[0].split(':')[1]
      },
      referenceType: 'ASSET'
    }));
  }

  try {
    let operation = await ai.models.generateVideos(payload);
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
    
    saveAsset('VIDEO', prompt.slice(0, 40), finalUrl, 'VIDEO_STUDIO', leadId);
    return finalUrl;
  } catch (e: any) {
    pushLog(`VEO_FAULT: ${e.message}`);
    throw e;
  }
};

/**
 * GEMINI TTS GENERATION
 */
export const generateAudioPitch = async (t: string, v: string, l?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: t }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: v },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const url = `data:audio/pcm;base64,${base64Audio}`;
      saveAsset('AUDIO', t.slice(0, 30), url, 'SONIC_STUDIO', l);
      return url;
    }
  } catch (err: any) {
    pushLog(`TTS_FAULT: ${err.message}`);
  }
  return null;
};

export const generateMockup = async (b: string, n: string, id?: string) => {
  const p = `High-end 4k commercial mockup for ${b}, a ${n} business. Professional product photography, studio lighting, clean background.`;
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
