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
 * MANDATORY KEY SELECTION LOGIC
 */
const ensureKey = async () => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.aistudio) {
    // @ts-ignore
    if (!(await window.aistudio.hasSelectedApiKey())) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }
};

/**
 * Robust instance creator used right before making an API call.
 */
export const getAI = async () => {
  await ensureKey();
  // --- FIX: Strictly using process.env.API_KEY as per guidelines ---
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

// --- FIX: Added missing generatePlaybookStrategy for ScoringRubricView ---
export const generatePlaybookStrategy = async (niche: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a strategic playbook for closing high-ticket deals in the ${niche} niche. Return JSON: strategyName, steps[{title, tactic}].`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

// --- FIX: Added missing identifySubRegions for AutoCrawl ---
export const identifySubRegions = async (theater: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identify 5 high-value sub-regions or business districts within ${theater}. Return JSON array of strings.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

// --- FIX: Added missing crawlTheaterSignals for AutoCrawl ---
export const crawlTheaterSignals = async (region: string, signal: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find businesses in ${region} exhibiting this signal: "${signal}". Return JSON array of leads. Each: businessName, websiteUrl, city, niche, socialGap (describe the specific deficit), rank, phone, email, leadScore (0-100), assetGrade (A/B/C), visualProof, bestAngle, personalizedHook.`,
    config: { 
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }] 
    }
  });
  return JSON.parse(response.text || "[]");
};

// --- FIX: Added missing analyzeLedger for AnalyticsHub ---
export const analyzeLedger = async (leads: Lead[]) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this collection of leads: ${JSON.stringify(leads.map(l => ({ name: l.businessName, gap: l.socialGap, score: l.leadScore })))}. Return JSON with "risk" (one paragraph of market risks) and "opportunity" (one paragraph of high-level opportunities).`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

// --- FIX: Added missing fetchBenchmarkData for BenchmarkNode and improved source mapping ---
export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep technical benchmark for ${lead.businessName} (${lead.websiteUrl}). Return JSON with: entityName, missionSummary, visualStack[] (label/description), sonicStack[] (label/description), featureGap, businessModel, designSystem, deepArchitecture.`,
      config: { 
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }] 
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || ''
    })) || [];
    return { ...parsed, sources };
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
  // --- FIX: Correctly mapping sources from groundingMetadata for fetchLiveIntel ---
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Source',
    uri: chunk.web?.uri || ''
  })) || [];
  return { ...parsed, sources };
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
  } else {
    // Guidelines recommend wrapping text parts in a contents object
    contents = { parts: [{ text: p }] };
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

// --- RESTORED ORCHESTRATION FUNCTIONS ---

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  const ai = await getAI();
  const prompt = `
    ORCHESTRATION PROTOCOL: Construct a multi-channel agency campaign for "${lead.businessName}".
    NICHE: ${lead.niche}
    SOCIAL GAP: ${lead.socialGap}
    ASSETS AVAILABLE: ${assets.length} items.

    Return JSON:
    {
      "presentation": {
        "title": "Transformation Strategy",
        "slides": [
          { "title": "Market Positioning", "bullets": ["Point A", "Point B"], "visualRef": "Asset Name" }
        ]
      },
      "narrative": "A long-form executive narrative script...",
      "contentPack": [
        { "platform": "Instagram", "type": "Reel", "caption": "Caption text", "assetRef": "Visual directive" }
      ],
      "outreach": {
        "emailSequence": [
          { "subject": "Subject", "body": "Body text" }
        ],
        "linkedin": "Personalized DM"
      },
      "visualDirection": {
        "brandMood": "Sleek and professional",
        "colorPsychology": [{ "color": "#000", "purpose": "Premium" }],
        "visualThemes": ["Minimalism"],
        "aiImagePrompts": [{ "use_case": "Hero", "prompt": "Prompt text" }],
        "aiVideoPrompts": [{ "use_case": "Ad", "prompt": "Prompt text" }]
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const generateOutreachSequence = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 5-day B2B outreach sequence for ${lead.businessName}. Return JSON array. Each: day, channel, purpose, content.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateProposalDraft = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a high-ticket sales proposal for ${lead.businessName} specializing in ${lead.niche}. Focus on solving their ${lead.socialGap}. Use professional persuasive markdown.`
  });
  return response.text || "";
};

export const generateFlashSparks = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 6 viral content ideas for ${lead.businessName}. Return JSON array of strings.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generatePitch = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 30-second high-impact elevator pitch for ${lead.businessName}.`
  });
  return response.text || "";
};

export const architectFunnel = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Architect a 4-stage sales funnel for ${lead.businessName}. Return JSON array. Each: stage, title, description, conversionGoal.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const architectPitchDeck = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Outline a 7-slide pitch deck for ${lead.businessName}. Return JSON array. Each: title, narrativeGoal, keyVisuals.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a summary report explaining the value of adding ${conv}% conversion lift to a business with $${ltv} LTV and ${vol} monthly leads.`
  });
  return response.text || "";
};

export const generateTaskMatrix = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a mission task checklist for onboarding ${lead.businessName}. Return JSON array. Each: id, task, status (pending).`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a 4-turn nurture dialogue for ${lead.businessName} based on: ${scenario}. Return JSON array. Each: role (user/ai), text.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the brand DNA of ${url}. Return JSON: colors[], fontPairing, archetype, visualTone, tagline, brandValues[], logoUrl, extractedImages[].`,
    config: { 
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }] 
    }
  });
  return JSON.parse(response.text || "{}");
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Fact check the following claim for ${lead.businessName}: "${claim}". Return JSON: status (Verified/Disputed), evidence, sources[{title, uri}].`,
    config: { 
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }] 
    }
  });
  return JSON.parse(response.text || "{}");
};

export const simulateSandbox = async (lead: Lead, ltv: number, vol: number) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a growth sandbox for ${lead.businessName} with $${ltv} LTV and ${vol} leads. Describe the impact of AI automation.`
  });
  return response.text || "";
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a cinematic motion design concept for ${lead.businessName}. Return JSON: title, hook, scenes[{time, visual, text}].`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const synthesizeProduct = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesize a premium AI-transformation product for ${lead.businessName}. Return JSON: productName, tagline, pricePoint, features[].`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a professional agency identity for an AI automation firm in the ${niche} niche in ${region}. Return JSON: name, tagline, manifesto, colors[].`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const generateAffiliateProgram = async (niche: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate an affiliate partner program for ${niche}. Return JSON: programName, recruitScript, tiers[{name, commission, requirement}].`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const critiqueVideoPresence = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Critique the video presence of ${lead.businessName}. Focus on opportunities for improvement.`
  });
  return response.text || "";
};

export const translateTactical = async (text: string, lang: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following tactical outreach copy to ${lang}: "${text}"`
  });
  return response.text || text;
};

export const fetchViralPulseData = async (niche: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze current viral trends in ${niche}. Return JSON array. Each: label, type (up/down), val (number).`,
    config: { 
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }] 
    }
  });
  return JSON.parse(response.text || "[]");
};

export const queryRealtimeAgent = async (q: string) => {
  const ai = await getAI();
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

export const analyzeVisual = async (data: string, mime: string, p: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data, mimeType: mime } },
        { text: p }
      ]
    }
  });
  return response.text || "";
};

export const analyzeVideoUrl = async (u: string, p: string, id?: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze video at ${u}. Mission: ${p}`,
    config: { 
      tools: [{ googleSearch: {} }] 
    }
  });
  return response.text || "";
};

export const synthesizeArticle = async (s: string, m: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesize article: ${s}. Mode: ${m}`
  });
  return response.text || "";
};

export const fetchTokenStats = async () => ({ recentOps: [ { op: 'Inference', id: '0x88', cost: '0.002' } ] });

export const testModelPerformance = async (m: string, p: string) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({ model: m, contents: p });
  return res.text || "";
};

export const enhanceVideoPrompt = async (p: string) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Enhance this video prompt for production quality: "${p}"`
  });
  return res.text || p;
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write 15-second catchy lyrics for a jingle for ${l.businessName} based on: ${p}. Type: ${t}`
  });
  return res.text || "";
};

export const generateSonicPrompt = async (l: any) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a specific sonic description for ${l.businessName} brand music.`
  });
  return res.text || "Ambient high-end corporate background music.";
};

export const generateMockup = async (b: string, n: string, id?: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `High-end 4K brand mockup for ${b} (${n}). Minimalist luxury design.`
  });
  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData) {
        const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        saveAsset('IMAGE', `Mockup: ${b}`, imageUrl, 'MOCKUP_FORGE', id);
        return imageUrl;
      }
    }
  }
  return null;
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

export const importVault = (a: any[]) => {
  SESSION_ASSETS.push(...a);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return a.length;
};

// --- LOGGED UTIL ---
export const loggedGenerateContent = async (opts: any) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({ 
    model: opts.model, 
    contents: opts.contents, 
    config: opts.config 
  });
  return res.text || "";
};