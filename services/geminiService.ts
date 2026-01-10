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
      pushLog("API_KEY_STATUS: REQUESTING SECURE KEY SELECTION...");
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
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

// --- CORE DISCOVERY FUNCTIONS ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  const ai = await getAI();
  pushLog(`LEAD_ENGINE: Initiating market discovery in ${region} for ${niche}...`);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a strategic market scan. Generate ${count} high-ticket B2B leads for "${niche}" in "${region}". 
      Return a JSON array where each object contains: businessName, websiteUrl, city, niche, leadScore (0-100), assetGrade (A/B/C), socialGap, visualProof, bestAngle, personalizedHook.`,
      config: { 
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }]
      }
    });
    const leads = JSON.parse(response.text || "[]");
    pushLog(`LEAD_ENGINE: Successfully identified ${leads.length} high-potential targets.`);
    return { leads, groundingSources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (e: any) {
    pushLog(`LEAD_ENGINE_ERROR: ${e.message}`);
    throw e;
  }
};

export const identifySubRegions = async (theater: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the theater "${theater}". Identify 5 specific business districts or high-wealth sub-regions within this area optimized for B2B high-ticket services. Return JSON array of strings.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const ai = await getAI();
  pushLog(`CRAWL_SWARM: Hunting signals in ${region} [SIG: ${signal}]`);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Market Recon Protocol: Find businesses in ${region} currently exhibiting this specific signal: "${signal}". 
    Return a JSON array of lead objects. Each: businessName, websiteUrl, city, niche, socialGap, rank (1-10), phone, email, leadScore (0-100), assetGrade (A/B/C), visualProof, bestAngle, personalizedHook.`,
    config: { 
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }] 
    }
  });
  return JSON.parse(response.text || "[]");
};

// --- ORCHESTRATION & CAMPAIGN FUNCTIONS ---

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  const ai = await getAI();
  pushLog(`ORCHESTRATOR: Constructing full strategic package for ${lead.businessName}...`);
  const prompt = `
    TASK: ORCHESTRATE A COMPREHENSIVE AGENCY CAMPAIGN.
    TARGET: ${lead.businessName} (${lead.niche})
    MARKET GAP: ${lead.socialGap}
    AVAILABLE ASSETS: ${assets.length} items.

    Return an exhaustive JSON payload using the UI_BLOCKS format. 
    STRICT RULES: NO MARKDOWN. NO CODE BLOCKS. RETURN RAW JSON ONLY.
    
    {
      "format": "ui_blocks",
      "title": "Transformation Strategy for ${lead.businessName}",
      "sections": [
        {
          "heading": "Market Positioning",
          "body": [
            { "type": "p", "content": "Narrative text here..." },
            { "type": "bullets", "content": ["Point A", "Point B"] }
          ]
        },
        {
          "heading": "Visual Direction",
          "body": [
            { "type": "callout", "content": "Brand Mood description..." },
            { "type": "scorecard", "content": [{ "label": "Premium", "value": "95" }] }
          ]
        }
      ],
      "presentation": { "title": "Strategy", "slides": [] },
      "narrative": "Detailed executive script...",
      "contentPack": [],
      "outreach": { "emailSequence": [], "linkedin": "" },
      "visualDirection": { "brandMood": "", "colorPsychology": [], "visualThemes": [], "aiImagePrompts": [], "aiVideoPrompts": [] }
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  pushLog(`ORCHESTRATOR: Package compiled for ${lead.businessName}.`);
  return JSON.parse(response.text || "{}");
};

export const generateOutreachSequence = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 5-day high-ticket outreach sequence for ${lead.businessName}. Return a JSON array. Each object: day (1-5), channel (Email/LinkedIn/Phone), purpose, content. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateProposalDraft = async (lead: Lead) => {
  const ai = await getAI();
  pushLog(`PROPOSAL_GEN: Drafting high-ticket proposal for ${lead.businessName}...`);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a high-ticket sales proposal for ${lead.businessName}. solve their ${lead.socialGap}. 
    
    RETURN RAW JSON IN UI_BLOCKS FORMAT:
    {
      "format": "ui_blocks",
      "title": "PROPOSAL: AI TRANSFORMATION",
      "subtitle": "PREPARED FOR ${lead.businessName}",
      "sections": [
        {
          "heading": "EXECUTIVE SUMMARY",
          "body": [ { "type": "p", "content": "..." } ]
        }
      ]
    }
    NO MARKDOWN CODE FENCES.`,
    config: { responseMimeType: 'application/json' }
  });
  return response.text || "";
};

// --- ANALYSIS & BENCHMARK FUNCTIONS ---

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
    const ai = await getAI();
    pushLog(`BENCHMARK: Performing technical deconstruction of ${lead.websiteUrl}...`);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform technical benchmark for ${lead.businessName} (${lead.websiteUrl}). Return RAW JSON: { entityName, missionSummary, visualStack: [{label, description}], sonicStack: [{label, description}], featureGap, businessModel, designSystem, deepArchitecture }. NO MARKDOWN.`,
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

export const analyzeLedger = async (leads: Lead[]) => {
  const ai = await getAI();
  const leadData = leads.map(l => ({ name: l.businessName, niche: l.niche, gap: l.socialGap, score: l.leadScore }));
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze leads: ${JSON.stringify(leadData)}. Return RAW JSON: { "risk": "text", "opportunity": "text" }. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const ai = await getAI();
  pushLog(`FACT_CHECK: Verifying claim for ${lead.businessName}...`);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Fact check: "${claim}" for ${lead.businessName}. Return RAW JSON: { status: "Verified/Disputed/Unknown", evidence: "text", sources: [{title, uri}] }. NO MARKDOWN.`,
    config: { 
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }] 
    }
  });
  return JSON.parse(response.text || "{}");
};

// --- TACTICAL UTILITIES ---

export const generatePlaybookStrategy = async (niche: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Architect tactical playbook for ${niche}. Return RAW JSON: { strategyName: "string", steps: [{title: "string", tactic: "string"}] }. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const architectFunnel = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Architect funnel for ${lead.businessName}. Return JSON array: [{ stage, title, description, conversionGoal }]. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const architectPitchDeck = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Outline 7-slide deck for ${lead.businessName}. Return JSON array: [{ title, narrativeGoal, keyVisuals }]. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateTaskMatrix = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 8 tasks for ${lead.businessName}. Return JSON array: [{ id, task, status: "pending" }]. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate dialogue for ${lead.businessName}: ${scenario}. Return JSON array: [{ role, text }]. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const ai = await getAI();
  pushLog(`BRAND_DNA: Analyzing visual identity of ${url}...`);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Deep analyze brand DNA of ${url}. Return RAW JSON: { colors, fontPairing, archetype, visualTone, tagline, brandValues, logoUrl, extractedImages }. NO MARKDOWN.`,
    config: { 
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }] 
    }
  });
  return JSON.parse(response.text || "{}");
};

export const synthesizeProduct = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesize product for ${lead.businessName}. Return RAW JSON: { productName, tagline, pricePoint, features }. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const generateFlashSparks = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 6 viral sparks for ${lead.businessName}. Return JSON array of strings. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generatePitch = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate high-impact elevator pitch for ${lead.businessName}. RETURN ONLY RAW TEXT. NO MARKDOWN.`
  });
  return response.text || "";
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate storyboard for ${lead.businessName}. Return RAW JSON: { "title", "hook", "scenes": [{ "time", "visual", "text" }] }. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Growth simulation for ${lead.businessName}. LTV: $${ltv}. Vol: ${volume}.
    
    RETURN RAW JSON IN UI_BLOCKS FORMAT:
    {
      "format": "ui_blocks",
      "title": "GROWTH SIMULATION",
      "sections": [
        { "heading": "REVENUE LIFT", "body": [{ "type": "scorecard", "content": [{"label": "Projected", "value": "$1.2M"}] }] }
      ]
    }
    NO MARKDOWN CODE FENCES.`,
    config: { responseMimeType: 'application/json' }
  });
  return response.text || "";
};

// --- MEDIA & ASSET GENERATION ---

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
        saveAsset('IMAGE', `Visual: ${p.slice(0, 30)}`, imageUrl, 'VISUAL_STUDIO', l?.id);
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
  const isExtension = !!inputVideo;
  
  const model = (isMultiRef || isExtension) ? 'veo-3.1-generate-preview' : (config?.modelStr || 'veo-3.1-fast-generate-preview');

  const payload: any = { model, prompt, config: videoConfig };

  if (isExtension && inputVideo) {
    payload.video = {
      uri: inputVideo.startsWith('http') ? inputVideo : undefined,
      videoBytes: !inputVideo.startsWith('http') ? (inputVideo.includes(',') ? inputVideo.split(',')[1] : inputVideo) : undefined
    };
    payload.config.resolution = '720p';
  }

  if (startImg) {
    payload.image = { 
      imageBytes: startImg.includes(',') ? startImg.split(',')[1] : startImg, 
      mimeType: startImg.includes(';') ? startImg.split(';')[0].split(':')[1] : 'image/png' 
    };
  }
  
  if (endImg) {
    payload.lastFrame = {
      imageBytes: endImg.includes(',') ? endImg.split(',')[1] : endImg,
      mimeType: endImg.includes(';') ? endImg.split(';')[0].split(':')[1] : 'image/png'
    };
  }

  if (isMultiRef && referenceImages) {
    payload.config.referenceImages = referenceImages.map(img => ({
      image: {
        imageBytes: img.includes(',') ? img.split(',')[1] : img,
        mimeType: 'image/png'
      },
      referenceType: 'ASSET'
    }));
  }

  try {
    pushLog(`VEO_STUDIO: Initiating render for ${prompt.slice(0, 20)}...`);
    let operation = await ai.models.generateVideos(payload);
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }
    
    const video = operation.response?.generatedVideos?.[0]?.video;
    if (video?.uri) {
      const url = `${video.uri}&key=${process.env.API_KEY}`;
      saveAsset('VIDEO', `Video: ${prompt.slice(0, 30)}`, url, 'VIDEO_PITCH', id);
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
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData?.data) {
    const audioUrl = `data:audio/pcm;base64,${part.inlineData.data}`;
    saveAsset('AUDIO', `Audio: ${text.slice(0, 30)}`, audioUrl, 'SONIC_STUDIO', leadId);
    return audioUrl;
  }
  return null;
};

// --- MISC UTILS ---

export const fetchLiveIntel = async (lead: any, module: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Deep intelligence for ${lead.websiteUrl}. Return RAW JSON only. NO MARKDOWN.`,
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

export const analyzeVisual = async (data: string, mime: string, p: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data, mimeType: mime } },
        { text: `Analyze visual. Directive: ${p}. 

          RETURN RAW JSON IN UI_BLOCKS FORMAT:
          {
            "format": "ui_blocks",
            "title": "VISION ANALYSIS",
            "sections": [
              { "heading": "VISUAL DECODING", "body": [{ "type": "p", "content": "..." }] }
            ]
          }
          NO MARKDOWN CODE FENCES.` 
        }
      ]
    },
    config: { responseMimeType: 'application/json' }
  });
  return response.text || "";
};

export const analyzeVideoUrl = async (u: string, p: string, id?: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze video stream: ${u}. Mission: ${p}.
    
    RETURN RAW JSON IN UI_BLOCKS FORMAT:
    {
      "format": "ui_blocks",
      "title": "CINEMA INTELLIGENCE REPORT",
      "sections": [
        { 
          "heading": "SCENE DECONSTRUCTION", 
          "body": [
            { "type": "p", "content": "..." },
            { "type": "bullets", "content": ["..."] }
          ]
        }
      ]
    }
    STRICT: NO MARKDOWN. NO CODE BLOCKS. RAW JSON ONLY.`,
    config: { 
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }] 
    }
  });
  return response.text || "";
};

export const synthesizeArticle = async (s: string, m: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesize article: ${s}. Mode: ${m}.
    
    RETURN RAW JSON IN UI_BLOCKS FORMAT:
    {
      "format": "ui_blocks",
      "title": "ARTICLE SYNTHESIS",
      "sections": [
        { "heading": "CORE INSIGHTS", "body": [{ "type": "bullets", "content": ["..."] }] }
      ]
    }
    NO MARKDOWN. RAW JSON ONLY.`,
    config: { responseMimeType: 'application/json' }
  });
  return response.text || "";
};

export const loggedGenerateContent = async (opts: any) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({ 
    model: opts.model, 
    contents: opts.contents, 
    config: opts.config 
  });
  return res.text || "";
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Lyrics for ${l.businessName}. Prompt: ${p}. Type: ${t}. RETURN PLAIN TEXT ONLY. NO MARKDOWN.`
  });
  return res.text || "";
};

export const generateSonicPrompt = async (l: any) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Sonic description for ${l.businessName}. RAW TEXT ONLY. NO MARKDOWN.`
  });
  return res.text || "Ambient high-end corporate background music.";
};

export const generateMockup = async (b: string, n: string, id?: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `High-end 4K brand mockup for ${b} (${n}).`
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

export const enhanceVideoPrompt = async (p: string) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Enhance video prompt: "${p}". RAW TEXT ONLY. NO MARKDOWN.`
  });
  return res.text || p;
};

export const testModelPerformance = async (m: string, p: string) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({ model: m, contents: p + " NO MARKDOWN." });
  return res.text || "";
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Agency identity for ${niche} in ${region}. Return RAW JSON: { name, tagline, manifesto, colors[] }. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const generateAffiliateProgram = async (niche: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Affiliate program for ${niche}. Return RAW JSON: { programName, recruitScript, tiers[] }. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const critiqueVideoPresence = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Critique video for ${lead.businessName}. 
    
    RETURN RAW JSON IN UI_BLOCKS FORMAT:
    {
      "format": "ui_blocks",
      "title": "VIDEO AUDIT",
      "sections": [
        { "heading": "OPPORTUNITY", "body": [{ "type": "p", "content": "..." }] }
      ]
    }
    NO MARKDOWN CODE FENCES.`,
    config: { responseMimeType: 'application/json' }
  });
  return response.text || "";
};

export const translateTactical = async (text: string, lang: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate to ${lang}: "${text}". RAW TEXT ONLY.`
  });
  return response.text || text;
};

export const fetchViralPulseData = async (niche: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Trends in ${niche}. Return JSON array: [{ label, type, val }]. NO MARKDOWN.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const queryRealtimeAgent = async (q: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: q + " NO MARKDOWN.",
    config: { tools: [{ googleSearch: {} }] }
  });
  return { 
    text: response.text || "", 
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
  };
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ROI for $${ltv} LTV, ${vol} leads, ${conv}% lift. 
    
    RETURN RAW JSON IN UI_BLOCKS FORMAT:
    {
      "format": "ui_blocks",
      "title": "ROI PROJECTION",
      "sections": [
        { "heading": "SUMMARY", "body": [{ "type": "p", "content": "..." }] }
      ]
    }
    NO MARKDOWN CODE FENCES.`,
    config: { responseMimeType: 'application/json' }
  });
  return response.text || "";
};

export const fetchTokenStats = async () => ({ recentOps: [ { op: 'Neural Inference', id: 'NODE-88FF', cost: '0.002' } ] });

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
