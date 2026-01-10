
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
 * Checks for a selected key and prompts if missing via AI Studio bridge.
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
    AVAILABLE ASSETS: ${assets.length} items currently in media vault.

    Return an exhaustive JSON payload:
    {
      "presentation": {
        "title": "Transformation Strategy for ${lead.businessName}",
        "slides": [
          { "title": "Market Positioning", "bullets": ["Point A", "Point B"], "visualRef": "Visual Directive" },
          { "title": "Revenue Gap Analysis", "bullets": ["Detail 1", "Detail 2"], "visualRef": "Chart Directive" },
          { "title": "The Implementation Roadmap", "bullets": ["Phase 1", "Phase 2"], "visualRef": "Flow Directive" }
        ]
      },
      "narrative": "A cinematic, persuasive executive-level narrative script...",
      "contentPack": [
        { "platform": "Instagram", "type": "Reel", "caption": "Caption here", "assetRef": "Visual directive" },
        { "platform": "LinkedIn", "type": "Thought Leadership", "caption": "Caption here", "assetRef": "Visual directive" }
      ],
      "outreach": {
        "emailSequence": [
          { "subject": "A strategic observation regarding ${lead.businessName}", "body": "Custom high-ticket outreach body..." }
        ],
        "linkedin": "Personalized connection request script."
      },
      "visualDirection": {
        "brandMood": "Define the target mood...",
        "colorPsychology": [{ "color": "#HEX", "purpose": "Explain why" }],
        "visualThemes": ["Theme A", "Theme B"],
        "aiImagePrompts": [{ "use_case": "Hero Asset", "prompt": "Exhaustive image prompt..." }],
        "aiVideoPrompts": [{ "use_case": "Promotional Clip", "prompt": "Exhaustive video prompt..." }]
      }
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
    contents: `Generate a 5-day high-ticket outreach sequence for ${lead.businessName} targeting their ${lead.socialGap}. Return a JSON array. Each object: day (1-5), channel (Email/LinkedIn/Phone), purpose, content.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateProposalDraft = async (lead: Lead) => {
  const ai = await getAI();
  pushLog(`PROPOSAL_GEN: Drafting high-ticket proposal for ${lead.businessName}...`);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a sophisticated, persuasive high-ticket sales proposal for ${lead.businessName}. Focus on how AI transformation solves their specific ${lead.socialGap}. Use professional markdown with sections for Objectives, Current Gap, Solution, ROI, and Next Steps.`
  });
  return response.text || "";
};

// --- ANALYSIS & BENCHMARK FUNCTIONS ---

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
    const ai = await getAI();
    pushLog(`BENCHMARK: Performing technical deconstruction of ${lead.websiteUrl}...`);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep technical and strategic benchmark for ${lead.businessName} (${lead.websiteUrl}). 
      Analyze their mission, visual stack, sonic presence, and deep architecture. 
      Return JSON: { entityName, missionSummary, visualStack: [{label, description}], sonicStack: [{label, description}], featureGap, businessModel, designSystem, deepArchitecture }.`,
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
    contents: `Analyze this collection of leads: ${JSON.stringify(leadData)}. 
    Evaluate aggregate market risk and high-level opportunity for an AI transformation agency. 
    Return JSON: { "risk": "Extensive paragraph on market risks", "opportunity": "Extensive paragraph on opportunities" }`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const ai = await getAI();
  pushLog(`FACT_CHECK: Verifying claim for ${lead.businessName}...`);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Fact check this claim for ${lead.businessName}: "${claim}". Is it verifiable? Is it accurate? Provide evidence. 
    Return JSON: { status: "Verified/Disputed/Unknown", evidence: "string", sources: [{title, uri}] }`,
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
    contents: `Architect a master tactical playbook for scaling an AI agency in the ${niche} niche. 
    Return JSON: { strategyName: "string", steps: [{title: "string", tactic: "string"}] }`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const architectFunnel = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Architect a high-conversion 4-stage sales funnel for ${lead.businessName}. Return JSON array. Each object: stage, title, description, conversionGoal.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const architectPitchDeck = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Outline a winning 7-slide pitch deck structure for ${lead.businessName}. Return JSON array. Each object: title, narrativeGoal, keyVisuals.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateTaskMatrix = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a prioritized checklist of 8 tactical onboarding tasks for ${lead.businessName}. Return JSON array. Each: id, task, status (pending).`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a realistic 4-turn sales nurture dialogue for ${lead.businessName} based on this scenario: ${scenario}. Return JSON array. Each object: role (user/ai), text.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const ai = await getAI();
  pushLog(`BRAND_DNA: Analyzing visual identity of ${url}...`);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Deep analyze the brand DNA of ${url}. Extract visual tone, colors, typography, and values. 
    Return JSON: { colors: string[], fontPairing: string, archetype: string, visualTone: string, tagline: string, brandValues: string[], logoUrl: string, extractedImages: string[] }.`,
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
    contents: `Synthesize a premium AI transformation product tailored for ${lead.businessName}. 
    Return JSON: { productName, tagline, pricePoint, features: string[] }.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

export const generateFlashSparks = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 6 rapid-fire viral content 'sparks' (hooks/ideas) for ${lead.businessName}. Return JSON array of strings.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "[]");
};

export const generatePitch = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a high-impact 30-second elevator pitch for ${lead.businessName} focusing on AI efficiency.`
  });
  return response.text || "";
};

// Added missing function for MotionLab.tsx
export const generateMotionLabConcept = async (lead: Lead) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a high-end cinematic motion storyboard concept for ${lead.businessName} (${lead.niche}). 
    Analyze their social gap: ${lead.socialGap}.
    Return a JSON object: { "title": "string", "hook": "string", "scenes": [{ "time": "0:00", "visual": "string", "text": "string" }] }. 
    Provide exactly 4 scenes representing a 15-second spot.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text || "{}");
};

// Added missing function for DemoSandbox.tsx
export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Run a high-fidelity growth simulation for ${lead.businessName} (${lead.niche}). 
    Current LTV: $${ltv}. Monthly Lead Volume: ${volume}.
    Simulate the impact of AI-driven conversion optimization. 
    Provide a detailed, professional executive report in Markdown format including specific revenue projections and efficiency gains.`
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

// Updated generateVideoPayload to accept 7 arguments for video extension, fixing VideoPitch.tsx line 130
export const generateVideoPayload = async (
  prompt: string, 
  id?: string, 
  startImg?: string, 
  endImg?: string, 
  config?: VeoConfig,
  referenceImages?: string[],
  inputVideo?: string // Added 7th argument for video extension
) => {
  const ai = await getAI();
  const videoConfig: any = {
    numberOfVideos: 1,
    resolution: config?.resolution || '720p',
    aspectRatio: config?.aspectRatio || '16:9'
  };

  const isMultiRef = referenceImages && referenceImages.length > 0;
  const isExtension = !!inputVideo;
  
  // Rule: Extensions and multi-ref require veo-3.1-generate-preview
  const model = (isMultiRef || isExtension) ? 'veo-3.1-generate-preview' : (config?.modelStr || 'veo-3.1-fast-generate-preview');

  const payload: any = { model, prompt, config: videoConfig };

  // Handle Video Extension
  if (isExtension && inputVideo) {
    payload.video = {
      uri: inputVideo.startsWith('http') ? inputVideo : undefined,
      videoBytes: !inputVideo.startsWith('http') ? (inputVideo.includes(',') ? inputVideo.split(',')[1] : inputVideo) : undefined
    };
    // Extensions are only supported at 720p
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
    contents: `Execute deep intelligence node for ${lead.websiteUrl}. Analyze market positioning, feature gaps, and monetization architecture. Return exhaustive JSON.`,
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
    contents: `Analyze video stream at ${u}. Mission: ${p}`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "";
};

export const synthesizeArticle = async (s: string, m: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesize article content: ${s}. Mode: ${m}`
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
    contents: `Write 15-second catchy lyrics for a jingle for ${l.businessName} based on: ${p}. Type: ${t}`
  });
  return res.text || "";
};

export const generateSonicPrompt = async (l: any) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a specific sonic description for ${l.businessName} brand music based on their profile.`
  });
  return res.text || "Ambient high-end corporate background music.";
};

export const generateMockup = async (b: string, n: string, id?: string) => {
  const ai = await getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `High-end 4K brand mockup for ${b} (${n}). Minimalist luxury design showing professional product placement.`
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
    contents: `Enhance this video prompt for production quality cinema: "${p}"`
  });
  return res.text || p;
};

export const testModelPerformance = async (m: string, p: string) => {
  const ai = await getAI();
  const res = await ai.models.generateContent({ model: m, contents: p });
  return res.text || "";
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
    contents: `Critique the video presence of ${lead.businessName}. Focus on psychological triggers and production gaps.`
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
    contents: `Write a summary report for a business with $${ltv} LTV and ${vol} monthly leads. Explain the financial impact of an additional ${conv}% conversion lift through AI automation.`
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
