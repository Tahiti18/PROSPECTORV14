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

export const extractBrandDNA = async (lead: Lead, url: string): Promise<BrandIdentity> => {
  pushLog(`DNA: DEEP FORENSIC SCANNING ${url}...`);
  const ai = getAI();
  
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { hostname = url; }

  const deterministicLogo = `https://logo.clearbit.com/${hostname}`;
  const deterministicIcon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`;

  const prompt = `
    You are a forensic brand design auditor.
    Analyze the website: ${url} (Business: ${lead.businessName}).
    Return strictly valid JSON (do not add markdown blocks):
    {
      "colors": ["#hex", "#hex", "#hex", "#hex", "#hex"],
      "fontPairing": "HeaderFont / BodyFont",
      "archetype": "string",
      "visualTone": "string",
      "tagline": "string",
      "brandValues": ["string", "string", "string", "string"],
      "aestheticTags": ["string", "string", "string", "string"],
      "voiceTags": ["string", "string", "string"],
      "mission": "string",
      "businessOverview": "string",
      "extractedImages": ["url1", "url2"]
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
    
    const rawImages = data.extractedImages || [];
    const cleanImages = rawImages.filter((img: string) => img && img.startsWith('http'));
    data.extractedImages = [deterministicLogo, deterministicIcon, ...cleanImages];
    
    return data;
  } catch (e) {
    return { colors: [], extractedImages: [deterministicLogo] } as any;
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
        imageConfig: { aspectRatio: "1:1" }
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
  config: VeoConfig = { aspectRatio: '16:9', resolution: '720p', modelStr: 'veo-3.1-fast-generate-preview' },
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
    ai, module: 'AUTO_CRAWL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return safeJsonParse(res) || [];
};

export const identifySubRegions = async (theater: string): Promise<string[]> => {
  const ai = getAI();
  const res = await loggedGenerateContent({
    ai, module: 'AUTO_CRAWL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: `List 5 key commercial districts or neighborhoods in ${theater} for business targeting. Return JSON array of strings.`,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || ["Central District", "Business Park", "Downtown"];
};

export const analyzeLedger = async (leads: Lead[]) => {
  const ai = getAI();
  const prompt = `Analyze these ${leads.length} leads. Summarize the total revenue opportunity and key risks. Return JSON: {risk: string, opportunity: string}`;
  const res = await loggedGenerateContent({
    ai, module: 'ANALYTICS', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || { risk: "Unknown", opportunity: "Unknown" };
};

export const generateOutreachSequence = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `Create a 5-step outreach sequence (Email/LinkedIn/Phone) for ${lead.businessName}. JSON Array: [{day: 1, channel: 'Email', purpose: 'Value', content: '...'}].`;
  const res = await loggedGenerateContent({
    ai, module: 'SEQUENCER', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const generateMockup = async (name: string, niche: string, leadId?: string) => {
  const prompt = `Hyper-realistic 4k product shot for ${name}, a ${niche} brand. Professional lighting, studio setup.`;
  return await generateVisual(prompt, { id: leadId, businessName: name } as Lead);
};

export const fetchBenchmarkData = async (lead: Lead) => {
  return await fetchLiveIntel(lead, 'BENCHMARK');
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const ai = getAI();
  const prompt = `Verify this claim about ${lead.businessName}: "${claim}". Return JSON: {status: 'Verified'|'Disputed', evidence: string, sources: [{title, uri}]}`;
  const res = await loggedGenerateContent({
    ai, module: 'FACT_CHECK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return safeJsonParse(res) || { status: "Unknown" };
};

export const synthesizeProduct = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `Design a high-ticket AI package for ${lead.businessName}. JSON: {productName, tagline, pricePoint, features: []}`;
  const res = await loggedGenerateContent({
    ai, module: 'PRODUCT_SYNTH', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const generatePitch = async (lead: Lead) => {
  const ai = getAI();
  const res = await loggedGenerateContent({
    ai, module: 'PITCH_GEN', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: `Write a 30-second elevator pitch for selling AI automation to ${lead.businessName}.`
  });
  return res;
};

export const architectFunnel = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `Design a sales funnel for ${lead.businessName}. JSON Array: [{stage, title, description, conversionGoal}]`;
  const res = await loggedGenerateContent({
    ai, module: 'FUNNEL_MAP', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const ai = getAI();
  const prompt = `Create an AI Agency Brand Identity for the ${niche} niche in ${region}. JSON: {name, tagline, manifesto, colors: []}`;
  const res = await loggedGenerateContent({
    ai, module: 'IDENTITY', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const testModelPerformance = async (model: string, prompt: string) => {
  const ai = getAI();
  try {
    const res = await ai.models.generateContent({ model, contents: prompt });
    return res.text || "No response";
  } catch (e: any) { return e.message; }
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `Create a motion graphics storyboard for ${lead.businessName}. JSON: {title, hook, scenes: [{time, visual, text}]}`;
  const res = await loggedGenerateContent({
    ai, module: 'MOTION_LAB', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const generateFlashSparks = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `Generate 6 viral content ideas for ${lead.businessName}. Return JSON array of strings.`;
  const res = await loggedGenerateContent({
    ai, module: 'FLASH_SPARK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const architectPitchDeck = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `Outline a 10-slide sales deck for ${lead.businessName}. JSON Array: [{title, narrativeGoal, keyVisuals}]`;
  const res = await loggedGenerateContent({
    ai, module: 'DECK_ARCH', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const simulateSandbox = async (lead: Lead, ltv: number, vol: number) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'DEMO_SANDBOX', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: `Simulate a growth scenario for ${lead.businessName} with LTV $${ltv} and ${vol} leads/mo if they adopt AI. Provide concise markdown report.`
  });
};

export const generateTaskMatrix = async (lead: Lead) => {
  const ai = getAI();
  const prompt = `Create a checklist of 5 tasks to close ${lead.businessName}. JSON Array: [{id, task, status: 'pending'}]`;
  const res = await loggedGenerateContent({
    ai, module: 'TASKS', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const fetchViralPulseData = async (niche: string) => {
  const ai = getAI();
  const prompt = `What are 5 trending topics in ${niche} right now? JSON Array: [{label, val: number (0-100), type: 'up'|'down'}]`;
  const res = await loggedGenerateContent({
    ai, module: 'VIRAL_PULSE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return safeJsonParse(res) || [];
};

export const synthesizeArticle = async (source: string, mode: string) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'ARTICLE_INTEL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: `Synthesize this content: ${source}. Mode: ${mode}. Format: Markdown.`,
    config: { tools: [{ googleSearch: {} }] }
  });
};

export const analyzeVideoUrl = async (url: string, prompt: string, leadId?: string) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'VIDEO_AI', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: `Analyze video at ${url}. ${prompt}`,
    config: { tools: [{ googleSearch: {} }] }
  });
};

export const generateROIReport = async (ltv: number, leads: number, conv: number) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'ROI_CALC', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: `Generate ROI report for LTV $${ltv}, ${leads} leads, ${conv}% lift. Markdown.`
  });
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  const ai = getAI();
  const prompt = `
    Orchestrate a full business package for ${lead.businessName}.
    Assets Available: ${assets.length}.
    Return JSON: {
      narrative: string,
      presentation: { title: string, slides: [{title, bullets: [], visualRef}] },
      outreach: { emailSequence: [{subject, body}], linkedin: string },
      contentPack: [{platform, type, caption, assetRef}]
    }
  `;
  const res = await loggedGenerateContent({
    ai, module: 'BUSINESS_ORCHESTRATOR', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const generateAffiliateProgram = async (niche: string) => {
  const ai = getAI();
  const prompt = `Design an affiliate program for ${niche}. JSON: {programName, recruitScript, tiers: [{name, commission, requirement}]}`;
  const res = await loggedGenerateContent({
    ai, module: 'AFFILIATE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};

export const fetchTokenStats = async () => {
  // Mock data for token stats as real usage is tracked in local state
  return { recentOps: [] };
};

export const critiqueVideoPresence = async (lead: Lead) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'VIDEO_AI', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: `Critique the video presence of ${lead.businessName}. Use Search to find their videos.`,
    config: { tools: [{ googleSearch: {} }] }
  });
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const ai = getAI();
  const prompt = `Simulate a chat between an AI Concierge and a lead from ${lead.businessName}. Scenario: ${scenario}. JSON Array: [{role: 'user'|'ai', text: string}]`;
  const res = await loggedGenerateContent({
    ai, module: 'AI_CONCIERGE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res) || [];
};

export const translateTactical = async (text: string, lang: string) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'TRANSLATOR', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: `Translate to ${lang} (maintain marketing tone): ${text}`
  });
};

export const generatePlaybookStrategy = async (niche: string) => {
  const ai = getAI();
  const prompt = `Create a sales playbook strategy for ${niche}. JSON: {strategyName, steps: [{title, tactic}]}`;
  const res = await loggedGenerateContent({
    ai, module: 'PLAYBOOK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return safeJsonParse(res);
};
