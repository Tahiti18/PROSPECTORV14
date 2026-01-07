
import { GoogleGenAI } from "@google/genai";
import { Lead, BrandIdentity } from '../types';
import { logAiOperation, uuidLike } from './usageLogger';
import { getModuleWeight } from './creditWeights';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';

// --- CONSTANTS ---
// STRICT HARDCODED KEY FOR VEO OPERATIONS (KIE PROXY)
const KIE_KEY = '302d700cb3e9e3dcc2ad9d94d5059279';
const KIE_ENDPOINT = 'https://api.kie.ai/api/v1/veo/generate';

const VALID_VEO_MODELS = [
  'veo-3.1-fast-generate-preview', // Economic Default
  'veo-3.1-generate-preview'       // Pro (User must explicit opt-in)
];

// --- TYPES ---
export interface AssetRecord {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  title: string;
  data: string; // content or base64 or url
  module?: string;
  leadId?: string;
  timestamp: number;
}

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  modelStr: string; 
}

export interface BenchmarkReport {
  entityName: string;
  missionSummary: string;
  visualStack: { label: string; description: string }[];
  sonicStack: { label: string; description: string }[];
  featureGap: string;
  businessModel: string;
  designSystem: string;
  deepArchitecture: string;
  sources: { title: string; uri: string }[];
}

// --- STATE ---
export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];

// --- ASSET SUBSCRIPTION SYSTEM ---
type AssetListener = (assets: AssetRecord[]) => void;
const assetListeners = new Set<AssetListener>();

export const subscribeToAssets = (listener: AssetListener) => {
  assetListeners.add(listener);
  listener([...SESSION_ASSETS]);
  return () => { assetListeners.delete(listener); };
};

const notifyAssetListeners = () => {
  const snapshot = [...SESSION_ASSETS];
  assetListeners.forEach(l => l(snapshot));
};

// --- CORE UTILS ---
export const pushLog = (msg: string) => {
  PRODUCTION_LOGS.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 200) PRODUCTION_LOGS.pop();
  console.log(`[SYSTEM] ${msg}`);
};

export const saveAsset = (type: AssetRecord['type'], title: string, data: string, module?: string, leadId?: string) => {
  const asset: AssetRecord = {
    id: uuidLike(),
    type,
    title,
    data,
    module,
    leadId,
    timestamp: Date.now()
  };
  SESSION_ASSETS.unshift(asset);
  notifyAssetListeners(); 
  pushLog(`ASSET SAVED: ${title} (${type})`);
  toast.success(`Asset Secured: ${title.slice(0, 20)}...`);
  return asset;
};

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    notifyAssetListeners();
    pushLog(`ASSET DELETED: ${id}`);
    toast.info("Asset removed from vault.");
  }
};

export const clearVault = () => {
  SESSION_ASSETS.length = 0;
  notifyAssetListeners();
  pushLog("VAULT PURGED");
};

export const importVault = (assets: AssetRecord[]) => {
  SESSION_ASSETS.push(...assets);
  notifyAssetListeners();
  pushLog(`IMPORTED ${assets.length} ASSETS`);
  return assets.length;
};

export const getAI = () => {
  const localKey = localStorage.getItem('pomelli_api_key');
  const envKey = process.env.API_KEY;
  const activeKey = localKey || envKey;

  if (!activeKey) {
    console.error("API_KEY is missing from both Settings and Environment");
    toast.error("SYSTEM HALT: API Key Missing. Configure in Settings or Railway.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey: activeKey });
};

// --- LOGGED WRAPPER ---
export const loggedGenerateContent = async (params: {
  ai: GoogleGenAI;
  module: string;
  model: string;
  modelClass: 'FLASH' | 'PRO' | 'OTHER';
  reasoningDepth: 'LOW' | 'MEDIUM' | 'HIGH';
  isClientFacing: boolean;
  contents: any;
  config?: any;
}): Promise<string> => {
  const start = Date.now();
  let status: 'SUCCESS' | 'FAILURE' = 'SUCCESS';
  let errorMessage: string | undefined;

  const inputStr = JSON.stringify(params.contents);
  const estimatedChars = inputStr.length;
  
  const canAfford = deductCost(params.model, estimatedChars);
  if (!canAfford) {
      throw new Error("OPERATION_BLOCKED: Check Subscription Tier or Balance.");
  }

  try {
    const response = await params.ai.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: params.config
    });
    return response.text || "";
  } catch (e: any) {
    status = 'FAILURE';
    errorMessage = e.message;
    toast.error(`Neural Link Failed: ${e.message}`);
    throw e;
  } finally {
    const latency = Date.now() - start;
    const weight = getModuleWeight(params.module);
    
    logAiOperation({
      logId: uuidLike(),
      timestamp: new Date().toISOString(),
      userId: 'USER_001', 
      userRole: 'FOUNDER',
      module: params.module,
      isClientFacing: params.isClientFacing,
      model: params.model,
      modelClass: params.modelClass,
      reasoningDepth: params.reasoningDepth,
      moduleWeight: weight,
      effectiveWeight: weight,
      latencyMs: latency,
      status,
      errorMessage
    });
  }
};

const safeJsonParse = (text: string) => {
  try {
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("JSON Parse Error, attempting recovery", e);
    return null;
  }
};

// --- IMPLEMENTATIONS ---

// NEW: Real-Time Agent with Search Grounding (FLASH Optimized)
export const queryRealtimeAgent = async (query: string) => {
  pushLog(`VIRAL PULSE: SEARCHING LIVE WEB: "${query}"...`);
  const ai = getAI();
  
  // Using Gemini 3 Flash for economy + speed, combined with Google Search
  const model = 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    // Extract citations
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return {
      text: response.text || "No intelligence found.",
      sources: sources
    };
  } catch (e: any) {
    console.error(e);
    toast.error(`Search Failed: ${e.message}`);
    return { text: "Search uplink failed.", sources: [] };
  }
};

export const fetchViralPulseData = async (niche: string) => {
  pushLog(`VIRAL PULSE: SCANNING TRENDS FOR ${niche}...`);
  const ai = getAI();
  
  const prompt = `
    You are a trend spotter. Search Google for the very latest news, viral topics, and discussions related to: "${niche}".
    Focus on what happened in the last 24-48 hours.
    
    Return a JSON array of trend objects:
    [
      { "label": "Short Trend Title", "val": 95, "type": "up" }
    ]
    Limit to 4 items. The 'val' should be a velocity score (0-100).
  `;

  try {
    const res = await loggedGenerateContent({
      ai, module: 'VIRAL_PULSE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }] 
      }
    });
    
    let data = safeJsonParse(res);
    if (!Array.isArray(data)) data = [];
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const extractBrandDNA = async (lead: Lead, url: string): Promise<BrandIdentity> => {
  pushLog(`DNA: DEEP FORENSIC SCANNING ${url}...`);
  const ai = getAI();
  
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { hostname = url; }

  // 1. Get Text & Color Data
  const prompt = `
    You are a forensic brand design auditor.
    Analyze the business at: ${url} (Name: ${lead.businessName}).
    
    Task 1: Extract 5 hex colors that represent their brand.
    Task 2: Identify their primary font style (Serif, Sans, etc).
    Task 3: Write a 1-sentence tagline that captures their essence.
    Task 4: Find 4-6 high-quality image URLs that represent their products, services, or vibe. 
    Use Google Search to find real images associated with this domain or brand.
    
    Return strictly valid JSON:
    {
      "colors": ["#hex", ...],
      "fontPairing": "Serif / Sans-Serif",
      "archetype": "string",
      "visualTone": "Luxury | Minimal | Bold",
      "tagline": "string",
      "extractedImages": ["url1", "url2", "url3", "url4"]
    }
  `;
  
  try {
    const res = await loggedGenerateContent({
      ai, module: 'IDENTITY', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
      contents: prompt,
      config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
    });
    
    let data = safeJsonParse(res);
    if (!data) data = { colors: [], extractedImages: [] };
    
    // Fallback images if search fails (Simulated for robustness in demo)
    const fallbackImages = [
       `https://source.unsplash.com/800x1000/?${encodeURIComponent(lead.niche)}`,
       `https://source.unsplash.com/800x1000/?${encodeURIComponent(lead.niche + ' luxury')}`,
       `https://source.unsplash.com/800x1000/?${encodeURIComponent(lead.niche + ' minimal')}`,
       `https://source.unsplash.com/800x1000/?${encodeURIComponent(lead.niche + ' detail')}`
    ];

    if (!data.extractedImages || data.extractedImages.length < 2) {
       data.extractedImages = fallbackImages;
    }
    
    // Add Clearbit Logo as a safety asset
    data.extractedImages.unshift(`https://logo.clearbit.com/${hostname}`);
    
    return data;
  } catch (e) {
    console.error("DNA Extraction Failed", e);
    return { colors: ['#000000'], extractedImages: [] } as any;
  }
};

export const generateVisual = async (prompt: string, lead?: Lead, inputImageBase64?: string) => {
  pushLog(`VISION: GENERATING ASSET...`);
  const ai = getAI();
  
  if(!deductCost('gemini-2.5-flash-image', 1000)) return null;

  try {
    const parts: any[] = [{ text: prompt }];
    if (inputImageBase64) {
       // Extract mime type if present in data URL
       let mimeType = 'image/png';
       let data = inputImageBase64;
       
       if (inputImageBase64.includes(';base64,')) {
           const [header, content] = inputImageBase64.split(';base64,');
           if (header.includes(':')) {
               mimeType = header.split(':')[1];
           }
           data = content;
       }

       parts.unshift({
         inlineData: { mimeType, data }
       });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: "9:16" } // Default to vertical for campaign
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64 = part.inlineData.data;
        const url = `data:image/png;base64,${base64}`;
        saveAsset('IMAGE', `GEN_${Date.now()}`, url, 'VISUAL_STUDIO', lead?.id);
        return url;
      }
    }
    return null;
  } catch (e) {
    console.error(e);
    toast.error("Image Gen Failed.");
    return null;
  }
};

// --- VIDEO GENERATION & POLLING ---

const pollKieStatus = async (taskId: string): Promise<string | null> => {
    const url = `https://api.kie.ai/api/v1/veo/status/${taskId}`;
    let attempts = 0;
    const maxAttempts = 60; 

    while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 5000));
        attempts++;

        try {
            const res = await fetch(url, {
                headers: { 
                    "Authorization": `Bearer ${KIE_KEY}`,
                    "Content-Type": "application/json"
                }
            });
            const raw = await res.text();
            let data;
            try { data = JSON.parse(raw); } catch { continue; }

            const payload = data.data || data; 
            const status = (payload.status || payload.state || '').toUpperCase();

            if (['SUCCEEDED', 'COMPLETED', 'SUCCESS', 'DONE'].includes(status)) {
                const finalUrl = payload.url || payload.video_url || payload.result?.url || payload.output?.url;
                if (finalUrl) return finalUrl;
            }
            if (['FAILED', 'ERROR', 'CANCELED'].includes(status)) {
                throw new Error(payload.error || `Task failed with status: ${status}`);
            }
        } catch (e: any) {
            if (e.message.includes('Task failed')) throw e;
        }
    }
    throw new Error("Polling timed out after 5 minutes.");
};

export const generateVideoPayload = async (
  prompt: string,
  leadId?: string,
  startImageBase64?: string,
  endImageBase64?: string, 
  config: VeoConfig = { aspectRatio: '9:16', resolution: '720p', modelStr: 'veo-3.1-fast-generate-preview' },
  referenceImages?: string[], 
  inputVideoBase64?: string 
): Promise<string | null> => {
  pushLog(`VEO: INITIALIZING VIDEO GENERATION (KIE)...`);
  toast.neural("VEO ENGINE: SENDING PAYLOAD TO KIE CLUSTER...");

  const cleanBase64 = (b64?: string) => b64 ? (b64.includes(',') ? b64.split(',')[1] : b64) : undefined;
  const cleanImage = cleanBase64(startImageBase64);
  const cleanEndImage = cleanBase64(endImageBase64);
  const cleanInputVideo = cleanBase64(inputVideoBase64);
  const cleanRefs = referenceImages?.map(img => cleanBase64(img)).filter(Boolean);

  // SAFETY MAPPING: Ensure we always map loose UI strings to exact API models
  const modelMap: Record<string, string> = {
      'veo3_fast': 'veo-3.1-fast-generate-preview',
      'veo3_pro': 'veo-3.1-generate-preview',
      // Default fallback
      'default': 'veo-3.1-fast-generate-preview'
  };
  
  const targetModel = modelMap[config.modelStr] || config.modelStr || modelMap.default;

  const params: any = {
    prompt: prompt,
    model: targetModel,
    aspect_ratio: config.aspectRatio,
    resolution: config.resolution,
    ...(cleanImage ? { image: cleanImage } : {}),
    ...(cleanEndImage ? { image_end: cleanEndImage } : {}),
    ...(cleanRefs && cleanRefs.length > 0 ? { references: cleanRefs } : {}),
    ...(cleanInputVideo ? { video: cleanInputVideo } : {})
  };

  try {
    const kieResponse = await fetch(KIE_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${KIE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });

    const raw = await kieResponse.text();
    if (!kieResponse.ok) throw new Error(`KIE Error ${kieResponse.status}: ${raw}`);

    let data;
    try { data = JSON.parse(raw); } catch { throw new Error(`KIE Response Not JSON: ${raw}`); }
    
    const payload = data.data || data;
    const videoUrl = payload.url || payload.video_url || payload.uri || payload.video?.uri;
    if (videoUrl) {
      saveAsset('VIDEO', `VEO_CLIP_${Date.now()}`, videoUrl, 'VIDEO_PITCH', leadId);
      toast.success("Video Rendered Successfully.");
      return videoUrl;
    } 
    
    const taskId = payload.id || payload.task_id || payload.taskId || payload.job_id;
    if (taskId) {
       toast.info(`VEO Job Started: ${taskId}. Polling...`);
       const finalUrl = await pollKieStatus(taskId);
       if (finalUrl) {
           saveAsset('VIDEO', `VEO_CLIP_${Date.now()}`, finalUrl, 'VIDEO_PITCH', leadId);
           toast.success("Video Rendered Successfully.");
           return finalUrl;
       }
    } 
    throw new Error(`KIE Unexpected Data`);
  } catch (e: any) {
    console.error("Veo Generation Error:", e);
    toast.error(`Video Failed: ${e.message}`);
    return null;
  }
};

export const generateAudioPitch = async (script: string, voiceName: string, leadId?: string): Promise<string | null> => {
  pushLog(`AUDIO: SYNTHESIZING SPEECH (${voiceName})...`);
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text: script }] },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
       const url = `data:audio/wav;base64,${base64Audio}`;
       saveAsset('AUDIO', `AUDIO_${Date.now()}`, url, 'SONIC_STUDIO', leadId); 
       return url; 
    }
    return null;
  } catch (e: any) {
    console.error(e);
    toast.error("Audio Failed.");
    return null;
  }
};

// --- REAL IMPLEMENTATIONS OF PREVIOUSLY STUBBED FUNCTIONS (NOW FLASH OPTIMIZED) ---

export const enhanceVideoPrompt = async (raw: string): Promise<string> => {
  const ai = getAI();
  const res = await loggedGenerateContent({
    ai, module: 'PROMPT_ENHANCE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: `Enhance this video prompt for Veo 3.1 (Cinematic, Photorealistic, Unreal Engine 5 Style). Keep it under 50 words. Prompt: ${raw}`
  });
  return res.trim();
};

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RADAR: SCANNING ${region} FOR ${niche}...`);
  const ai = getAI();
  const prompt = `
    Find ${count} high-ticket businesses in ${region} in the ${niche || 'Luxury/Medical/Tech'} niche.
    For each, find: Name, Website, City, Niche, and estimate a 'Social Gap' (why they need AI marketing).
    
    Return strict JSON:
    {
      "leads": [
        { "businessName": "", "websiteUrl": "", "city": "", "niche": "", "socialGap": "", "leadScore": 85 }
      ],
      "groundingSources": [ {"title": "Source Title", "uri": "url"} ]
    }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'RADAR_RECON', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  const parsed = safeJsonParse(res);
  return parsed || { leads: [], groundingSources: [] };
};

export const generateProposalDraft = async (lead: Lead) => {
  pushLog(`DRAFTING PROPOSAL FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `
    Write a high-ticket AI Transformation Proposal for ${lead.businessName} (${lead.niche}).
    Identify their gap: "${lead.socialGap}".
    Propose: 
    1. Automated Video Content Engine.
    2. 24/7 AI Concierge.
    3. ROI Projection.
    Format as Markdown. Professional, persuasive, luxurious tone.
  `;
  return await loggedGenerateContent({
    ai, module: 'PROPOSALS', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true, contents: prompt
  });
};

export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  pushLog(`VISION: ANALYZING FRAME...`);
  const ai = getAI();
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash-image", // Force Flash for Vision
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: prompt }
      ]
    }
  });
  return res.text || "Analysis failed.";
};

export const fetchLiveIntel = async (lead: Lead, module: string) => {
  pushLog(`INTEL: GATHERING DATA FOR ${module}...`);
  const ai = getAI();
  const prompt = `
    Analyze ${lead.businessName} (${lead.websiteUrl}) for the ${module} module.
    Provide a deep technical and strategic breakdown.
    Return JSON matching the BenchmarkReport interface.
  `;
  const res = await loggedGenerateContent({
    ai, module, model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return safeJsonParse(res) || { visualStack: [], sonicStack: [], sources: [] };
};

export const crawlTheaterSignals = async (sector: string, signal: string) => {
  pushLog(`CRAWL: SECTOR ${sector}...`);
  const ai = getAI();
  const prompt = `
    Search for businesses in ${sector} matching signal: "${signal}".
    Return top 3 results as JSON array of Lead objects.
  `;
  const res = await loggedGenerateContent({
    ai, module: 'AUTO_CRAWL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  const data = safeJsonParse(res);
  return Array.isArray(data) ? data : [];
};

export const identifySubRegions = async (theater: string) => {
  const ai = getAI();
  const res = await loggedGenerateContent({
    ai, module: 'AUTO_CRAWL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: `List 5 key commercial districts or neighborhoods in ${theater}. Return JSON array of strings.`,
    config: { responseMimeType: 'application/json' }
  });
  const data = safeJsonParse(res);
  return Array.isArray(data) ? data : [theater];
};

export const analyzeLedger = async (leads: Lead[]) => {
  const ai = getAI();
  const prompt = `
    Analyze these ${leads.length} leads.
    Identify 1 major 'Risk' (why they might not buy) and 1 major 'Opportunity' (low hanging fruit).
    Return JSON: { "risk": "string", "opportunity": "string" }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'ANALYTICS', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Create a 3-step outreach sequence (Email, LinkedIn, Call) for ${lead.businessName}.
    Gap: ${lead.socialGap}.
    Return JSON array: [{ day: 1, channel: "Email", purpose: "Hook", content: "..." }, ...]
  `;
  const res = await loggedGenerateContent({
    ai, module: 'SEQUENCER', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const architectPitchDeck = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Outline a 5-slide pitch deck for ${lead.businessName}.
    Return JSON array: [{ title: "Slide 1", narrativeGoal: "...", keyVisuals: "..." }]
  `;
  const res = await loggedGenerateContent({
    ai, module: 'DECK_ARCH', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const synthesizeProduct = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Design a high-ticket AI service package for ${lead.businessName}.
    Return JSON: { productName: "...", tagline: "...", pricePoint: "$X,XXX", features: ["...", "..."] }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'PRODUCT_SYNTH', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const generateFlashSparks = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Write 6 viral video hooks for ${lead.businessName}. Short, punchy, controversial.
    Return JSON array of strings.
  `;
  const res = await loggedGenerateContent({
    ai, module: 'FLASH_SPARK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const generatePitch = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `Write a 30-second elevator pitch for ${lead.businessName} to buy AI automation.`;
  return await loggedGenerateContent({
    ai, module: 'PITCH_GEN', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: prompt
  });
};

export const architectFunnel = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Design a conversion funnel for ${lead.businessName}.
    Return JSON array of stages: [{ stage: 1, title: "...", description: "...", conversionGoal: "..." }]
  `;
  const res = await loggedGenerateContent({
    ai, module: 'FUNNEL_MAP', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const ai = getAI();
  const prompt = `
    Create a luxury AI Agency Brand Identity targeting ${niche} in ${region}.
    Return JSON: { name: "...", tagline: "...", manifesto: "...", colors: ["#...", "#..."] }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'IDENTITY', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const testModelPerformance = async (model: string, prompt: string) => {
  const ai = getAI();
  const start = Date.now();
  const res = await ai.models.generateContent({
    model,
    contents: prompt
  });
  const duration = Date.now() - start;
  return `OUTPUT: ${res.text?.slice(0, 100)}... \nLATENCY: ${duration}ms`;
};

export const translateTactical = async (text: string, lang: string) => {
  const ai = getAI();
  const prompt = `Translate this marketing copy to ${lang}. Maintain persuasive tone.\n\n${text}`;
  const res = await loggedGenerateContent({
    ai, module: 'TRANSLATOR', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: prompt
  });
  return res;
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const ai = getAI();
  const prompt = `
    Verify this claim about ${lead.businessName}: "${claim}".
    Search the web.
    Return JSON: { status: "Verified" | "Disputed" | "Unknown", evidence: "...", sources: [{ title: "...", uri: "..." }] }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'FACT_CHECK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return safeJsonParse(res);
};

export const generateROIReport = async (ltv: number, leads: number, conv: number) => {
  const ai = getAI();
  const prompt = `
    Generate a concise Executive ROI Report.
    Inputs: LTV $${ltv}, Monthly Leads ${leads}, Conversion Lift ${conv}%.
    Calculate projected revenue impact and write a persuasive summary.
  `;
  return await loggedGenerateContent({
    ai, module: 'ROI_CALC', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt
  });
};

export const generateTaskMatrix = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Create a checklist of 5 mission-critical tasks to close ${lead.businessName}.
    Return JSON array: [{ id: "1", task: "...", status: "pending" }]
  `;
  const res = await loggedGenerateContent({
    ai, module: 'TASKS', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const generatePlaybookStrategy = async (niche: string) => {
  const ai = getAI();
  const prompt = `
    Create a 3-step high-ticket sales strategy for ${niche}.
    Return JSON: { strategyName: "...", steps: [{ title: "...", tactic: "..." }] }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'PLAYBOOK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const synthesizeArticle = async (source: string, mode: string) => {
  const ai = getAI();
  const prompt = `
    Analyze this text/url: ${source}.
    Mode: ${mode}.
    Provide a high-level synthesis suitable for strategy planning.
  `;
  const res = await loggedGenerateContent({
    ai, module: 'ARTICLE_INTEL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });
  return res;
};

export const analyzeVideoUrl = async (url: string, instructions: string, leadId?: string) => {
  const ai = getAI();
  const prompt = `
    Analyze this video URL: ${url}.
    Instructions: ${instructions}.
    Focus on visual cues, sentiment, and conversion hooks.
  `;
  const res = await loggedGenerateContent({
    ai, module: 'CINEMA_INTEL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });
  return res;
};

export const critiqueVideoPresence = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Search for video content related to ${lead.businessName} (${lead.websiteUrl}).
    Critique their current video presence. Identify gaps and opportunities.
  `;
  const res = await loggedGenerateContent({
    ai, module: 'VIDEO_AI', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });
  return res;
};

export const generateMockup = async (brand: string, niche: string, leadId?: string) => {
  // Use Image Gen
  const prompt = `High-end product mockup for ${brand}, ${niche}, professional studio lighting, 4k resolution.`;
  return await generateVisual(prompt, { id: leadId } as Lead);
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Create a motion graphics storyboard concept for ${lead.businessName}.
    Return JSON: { title: "...", hook: "...", scenes: [{ time: "0:00-0:05", visual: "...", text: "..." }] }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'MOTION_LAB', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const ai = getAI();
  const prompt = `
    Simulate a chat between an AI Concierge and a lead from ${lead.businessName}.
    Scenario: ${scenario}.
    Return JSON array: [{ role: "user" | "ai", text: "..." }]
  `;
  const res = await loggedGenerateContent({
    ai, module: 'AI_CONCIERGE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const generateAffiliateProgram = async (niche: string) => {
  const ai = getAI();
  const prompt = `
    Design an affiliate program for ${niche}.
    Return JSON: { programName: "...", tiers: [{ name: "...", commission: "...", requirement: "..." }], recruitScript: "..." }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'AFFILIATE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const fetchTokenStats = async () => {
  // Mock stats
  return {
    recentOps: [
      { id: 'OP_88A', op: 'VIDEO_GEN', cost: '150 CR' },
      { id: 'OP_89B', op: 'DEEP_REASON', cost: '40 CR' },
      { id: 'OP_90C', op: 'SEARCH_SWARM', cost: '12 CR' },
      { id: 'OP_91D', op: 'FLASH_INFER', cost: '2 CR' }
    ]
  };
};

export const fetchBenchmarkData = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `
    Analyze ${lead.businessName} (${lead.websiteUrl}).
    Reverse engineer their tech stack, sonic branding, and visual style.
    Return JSON matching BenchmarkReport.
  `;
  const res = await loggedGenerateContent({
    ai, module: 'BENCHMARK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return safeJsonParse(res);
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: AssetRecord[]) => {
  pushLog(`ORCHESTRATOR: COMPILING STRATEGY FOR ${lead.businessName}...`);
  const ai = getAI();
  
  const assetContext = assets.map(a => `[${a.type}] ${a.title}`).join(', ');
  
  const prompt = `
    Act as a Chief Strategy Officer.
    Target: ${lead.businessName} (${lead.niche}).
    Available Assets: ${assetContext}.
    
    Compile a comprehensive business transformation package.
    Return JSON:
    {
      "narrative": "Executive summary narrative...",
      "presentation": {
        "title": "Pitch Deck Title",
        "slides": [
          { "title": "Slide 1", "bullets": ["point 1", "point 2"], "visualRef": "suggestion" }
        ]
      },
      "outreach": {
        "emailSequence": [{ "subject": "...", "body": "..." }],
        "linkedin": "connection message..."
      },
      "contentPack": [
        { "platform": "Instagram", "type": "Reel", "caption": "...", "assetRef": "optional asset id" }
      ]
    }
  `;
  
  const res = await loggedGenerateContent({
    ai, module: 'BUSINESS_ORCHESTRATOR', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'HIGH', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  
  return safeJsonParse(res);
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  const ai = getAI();
  const prompt = `
    Run a predictive growth simulation for ${lead.businessName}.
    Parameters: Current LTV $${ltv}, Monthly Volume ${volume}.
    Scenario: Implementation of AI-driven outreach and 24/7 concierge.
    
    Output a detailed Markdown report covering:
    1. Conservative vs Aggressive Growth Scenarios (Month 1-6).
    2. Estimated Revenue Impact.
    3. Operational Bottlenecks to Watch.
  `;
  
  return await loggedGenerateContent({
    ai, 
    module: 'DEMO_SANDBOX', 
    model: 'gemini-3-flash-preview', 
    modelClass: 'FLASH', 
    reasoningDepth: 'HIGH', 
    isClientFacing: true,
    contents: prompt
  });
};
