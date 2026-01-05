
import { GoogleGenAI } from "@google/genai";
import { Lead, BrandIdentity } from '../types';
import { logAiOperation, uuidLike } from './usageLogger';
import { getModuleWeight } from './creditWeights';

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
  modelStr: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
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

// --- CORE UTILS ---
export const pushLog = (msg: string) => {
  PRODUCTION_LOGS.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 200) PRODUCTION_LOGS.pop();
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
  pushLog(`ASSET SAVED: ${title} (${type})`);
  return asset;
};

export const clearVault = () => {
  SESSION_ASSETS.length = 0;
  pushLog("VAULT PURGED");
};

export const importVault = (assets: AssetRecord[]) => {
  SESSION_ASSETS.push(...assets);
  pushLog(`IMPORTED ${assets.length} ASSETS`);
  return assets.length;
};

let aiInstance: GoogleGenAI | null = null;

export const getAI = () => {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      console.error("API_KEY is missing");
      throw new Error("API Key missing");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
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

// --- IMPLEMENTATIONS ---

export const enhanceVideoPrompt = async (rawPrompt: string): Promise<string> => {
  const ai = getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a Hollywood Director. Rewrite this video prompt to be extremely detailed, cinematic, and descriptive for an AI video generator. Include lighting, camera movement, and texture details. Keep it under 60 words. Prompt: "${rawPrompt}"`
  });
  return res.text || rawPrompt;
};

export const generateLeads = async (theater: string, niche: string, count: number) => {
  pushLog(`RADAR: SCANNING ${theater} FOR ${niche}...`);
  const ai = getAI();
  const prompt = `Find ${count} real businesses in ${theater} that are in the ${niche || 'High Ticket Service'} niche. 
  For each, estimate a 'Lead Score' (0-100) based on their likely need for AI automation.
  Identify a specific 'Social Gap' (e.g. inactive instagram, bad website).
  Return JSON: { leads: [ { businessName, websiteUrl, city, niche, leadScore, socialGap, visualProof, bestAngle } ] }`;

  const response = await loggedGenerateContent({
    ai, module: 'RADAR_RECON', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });

  return JSON.parse(response);
};

export const generatePlaybookStrategy = async (niche: string) => {
  pushLog(`STRATEGY: ARCHITECTING FOR ${niche}...`);
  const ai = getAI();
  const prompt = `Create a sales strategy playbook for selling AI services to ${niche}.
  Return JSON: { strategyName, steps: [{ title, tactic }] }`;
  
  const response = await loggedGenerateContent({
    ai, module: 'PLAYBOOK', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response);
};

export const generateProposalDraft = async (lead: Lead) => {
  pushLog(`DRAFTING: PROPOSAL FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Write a high-ticket AI proposal for ${lead.businessName}. Emphasize their gap: ${lead.socialGap}. Format as Markdown.`;
  return await loggedGenerateContent({
    ai, module: 'PROPOSALS', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: true,
    contents: prompt
  });
};

export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  pushLog(`VISION: ANALYZING IMAGE...`);
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: prompt }
      ]
    }
  });
  return response.text || "Analysis failed.";
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  pushLog(`INTEL: FETCHING LIVE DATA FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Analyze ${lead.businessName} (${lead.websiteUrl}) for module: ${module}.
  Provide deep technical insights.
  Return JSON matching BenchmarkReport interface.`;
  
  const res = await loggedGenerateContent({
    ai, module, model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return JSON.parse(res);
};

export const crawlTheaterSignals = async (theater: string, signal: string) => {
  pushLog(`CRAWL: SEARCHING ${theater} FOR SIGNAL "${signal}"...`);
  return (await generateLeads(theater, signal, 5)).leads;
};

export const identifySubRegions = async (theater: string): Promise<string[]> => {
  const ai = getAI();
  const res = await loggedGenerateContent({
    ai, module: 'AUTO_CRAWL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: `List 5 key commercial districts or sub-regions in ${theater}. JSON array of strings.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const analyzeLedger = async (leads: Lead[]) => {
  pushLog(`ANALYTICS: PROCESSING ${leads.length} RECORDS...`);
  const ai = getAI();
  const prompt = `Analyze this list of leads: ${JSON.stringify(leads.map(l => ({ name: l.businessName, score: l.leadScore, gap: l.socialGap })))}.
  Identify 1 Major Risk and 1 Major Opportunity for the agency. JSON: { risk, opportunity }`;
  
  const res = await loggedGenerateContent({
    ai, module: 'ANALYTICS_HUB', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const generateOutreachSequence = async (lead: Lead) => {
  pushLog(`SEQUENCER: MAPPING CAMPAIGN FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Create a 5-step outreach sequence for ${lead.businessName}. JSON: [{ day, channel, purpose, content }]`;
  const res = await loggedGenerateContent({
    ai, module: 'SEQUENCER', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const generateMockup = async (name: string, niche: string, leadId?: string) => {
  pushLog(`MOCKUP: RENDERING 4K ASSET FOR ${name}...`);
  const prompt = `High-end 4k product mockup for ${name}, ${niche}, photorealistic, studio lighting.`;
  const base64 = await generateVisual(prompt, { id: leadId } as Lead);
  if (base64) {
    saveAsset('IMAGE', `MOCKUP_${name}`, base64, 'MOCKUPS_4K', leadId);
  }
  return base64;
};

export const fetchBenchmarkData = async (lead: Lead) => {
  return fetchLiveIntel(lead, 'BENCHMARK');
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  pushLog(`FACT_CHECK: VERIFYING "${claim}"...`);
  const ai = getAI();
  const prompt = `Verify this claim about ${lead.businessName}: "${claim}".
  Return JSON: { status: "Verified" | "Disputed" | "Unknown", evidence: string, sources: [{title, uri}] }`;
  
  const res = await loggedGenerateContent({
    ai, module: 'FACT_CHECK', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return JSON.parse(res);
};

export const synthesizeProduct = async (lead: Lead) => {
  pushLog(`PRODUCT: DESIGNING OFFER FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Design a high-ticket AI product for ${lead.businessName}. JSON: { productName, tagline, pricePoint, features: [] }`;
  const res = await loggedGenerateContent({
    ai, module: 'PRODUCT_SYNTH', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const generatePitch = async (lead: Lead) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'PITCH_GEN', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: `Write a 30-second elevator pitch for ${lead.businessName}.`
  });
};

export const architectFunnel = async (lead: Lead) => {
  pushLog(`FUNNEL: MAPPING JOURNEY FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Design a sales funnel for ${lead.businessName}. JSON Array: [{ stage, title, description, conversionGoal }]`;
  const res = await loggedGenerateContent({
    ai, module: 'FUNNEL_MAP', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  pushLog(`IDENTITY: FORGING AGENCY BRAND...`);
  const ai = getAI();
  const prompt = `Create an agency identity for ${niche} in ${region}. JSON: { name, tagline, manifesto, colors: [] }`;
  const res = await loggedGenerateContent({
    ai, module: 'IDENTITY', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const testModelPerformance = async (model: string, prompt: string) => {
  pushLog(`TEST: BENCHMARKING ${model}...`);
  const ai = getAI();
  const start = Date.now();
  const res = await ai.models.generateContent({ model, contents: prompt });
  const latency = Date.now() - start;
  return `LATENCY: ${latency}ms\nOUTPUT: ${res.text}`;
};

export const generateMotionLabConcept = async (lead: Lead) => {
  pushLog(`MOTION: STORYBOARDING FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Create a motion graphics storyboard for ${lead.businessName}. JSON: { title, hook, scenes: [{ time, visual, text }] }`;
  const res = await loggedGenerateContent({
    ai, module: 'MOTION_LAB', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const generateFlashSparks = async (lead: Lead) => {
  const ai = getAI();
  const res = await loggedGenerateContent({
    ai, module: 'FLASH_SPARK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: `Generate 6 viral content ideas for ${lead.businessName}. Return JSON array of strings.`,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const architectPitchDeck = async (lead: Lead) => {
  pushLog(`DECK: STRUCTURING SLIDES FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Outline a pitch deck for ${lead.businessName}. JSON Array: [{ title, narrativeGoal, keyVisuals }]`;
  const res = await loggedGenerateContent({
    ai, module: 'DECK_ARCH', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  pushLog(`SANDBOX: RUNNING SIMULATION...`);
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'DEMO_SANDBOX', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: true,
    contents: `Simulate a growth scenario for ${lead.businessName} with LTV $${ltv} and ${volume} leads/mo. Describe the outcome.`
  });
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return "Video audit report simulation for " + lead.businessName;
};

export const translateTactical = async (text: string, lang: string) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'TRANSLATOR', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: `Translate to ${lang}: ${text}`
  });
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const ai = getAI();
  const prompt = `Simulate a chat between a lead (${lead.businessName}) and an AI Concierge. Scenario: ${scenario}. JSON: [{ role: 'user'|'ai', text }]`;
  const res = await loggedGenerateContent({
    ai, module: 'AI_CONCIERGE', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const fetchBillingStats = async () => {
  return { estimatedCost: "12.50", tokenUsage: 850000, activeTheaters: 3, projectedRevenueLift: 15000 };
};

export const generateAffiliateProgram = async (niche: string) => {
  pushLog(`AFFILIATE: DESIGNING PROGRAM FOR ${niche}...`);
  const ai = getAI();
  const prompt = `Design an affiliate program for ${niche}. JSON: { programName, tiers: [{ name, requirement, commission }], recruitScript }`;
  const res = await loggedGenerateContent({
    ai, module: 'AFFILIATE', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const generateTaskMatrix = async (lead: Lead) => {
  pushLog(`TASKS: GENERATING CHECKLIST...`);
  const ai = getAI();
  const prompt = `Create a 5-item task checklist for closing ${lead.businessName}. JSON: [{ id, task, status: 'pending' }]`;
  const res = await loggedGenerateContent({
    ai, module: 'TASKS', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const fetchViralPulseData = async (niche: string) => {
  pushLog(`VIRAL: SCANNING TRENDS FOR ${niche}...`);
  const ai = getAI();
  const prompt = `Identify 4 viral trends in ${niche}. JSON: [{ label, val: number (0-100), type: 'up'|'down' }]`;
  const res = await loggedGenerateContent({
    ai, module: 'VIRAL_PULSE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return JSON.parse(res);
};

export const fetchTokenStats = async () => {
  return { recentOps: [{ op: 'SCAN', id: '0x1', cost: 0.05 }, { op: 'GEN', id: '0x2', cost: 0.12 }] };
};

export const synthesizeArticle = async (url: string, mode: string) => {
  pushLog(`ARTICLE: PROCESSING ${url}...`);
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'ARTICLE_INTEL', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: `Analyze this content (${url}) in mode: ${mode}. Provide summary and insights.`
  });
};

export const analyzeVideoUrl = async (url: string, prompt: string, leadId?: string) => {
  pushLog(`VIDEO_INTEL: ANALYZING STREAM...`);
  await new Promise(r => setTimeout(r, 2000));
  return `Analysis of ${url}: ${prompt} (Simulated Output: Video content suggests high engagement potential...)`;
};

export const generateROIReport = async (ltv: number, leads: number, conv: number) => {
  const ai = getAI();
  return await loggedGenerateContent({
    ai, module: 'ROI_CALC', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
    contents: `Write an ROI report for ${leads} leads/mo at ${conv}% conversion with $${ltv} LTV.`
  });
};

export const generateVisual = async (prompt: string, lead?: Lead, inputImage?: string): Promise<string> => {
  pushLog(inputImage ? "EDITING VISUAL ASSET..." : "GENERATING VISUAL ASSET...");
  const ai = getAI();
  const model = "gemini-2.5-flash-image";
  
  let enrichedPrompt = prompt;
  if (lead?.brandIdentity && !inputImage) {
    const { colors, visualTone, aestheticTags } = lead.brandIdentity;
    enrichedPrompt = `
      Create a professional image.
      Brand Context:
      - Colors: ${colors.join(', ')}
      - Aesthetic: ${aestheticTags?.join(', ')}
      - Tone: ${visualTone}
      User Prompt: ${prompt}
    `;
  }

  try {
      let contents;
      if (inputImage) {
          const parts = inputImage.split(',');
          if (parts.length > 1) {
            const mimeType = parts[0].split(':')[1].split(';')[0];
            const data = parts[1];
            contents = { parts: [{ inlineData: { mimeType, data } }, { text: prompt }] };
          } else {
             contents = { parts: [{ text: enrichedPrompt }] };
          }
      } else {
          contents = { parts: [{ text: enrichedPrompt }] };
      }

      const response = await ai.models.generateContent({ model, contents });
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (part?.inlineData?.data) {
        const url = `data:image/png;base64,${part.inlineData.data}`;
        saveAsset('IMAGE', inputImage ? `EDITED_${Date.now()}` : `VISUAL_${Date.now()}`, url, 'VISUAL_STUDIO', lead?.id);
        return url;
      }
      throw new Error("No image data returned");
  } catch(e: any) { 
      console.error(e); 
      pushLog(`VISUAL ERROR: ${e.message}`);
      return ""; 
  }
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: AssetRecord[]) => {
  pushLog(`ORCHESTRATOR: COMPILING DOSSIER FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Create a full business strategy package for ${lead.businessName}.
  Context Assets: ${assets.map(a => a.title).join(', ')}.
  Return JSON: { 
    narrative: string, 
    presentation: { title, slides: [{ title, bullets: [], visualRef }] },
    outreach: { emailSequence: [{ subject, body }], linkedin },
    contentPack: [{ platform, type, caption, assetRef }]
  }`;
  
  const res = await loggedGenerateContent({
    ai, module: 'BUSINESS_ORCHESTRATOR', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: true,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const extractBrandDNA = async (lead: Lead, url: string): Promise<BrandIdentity> => {
  pushLog(`DNA: EXTRACTING BRAND FROM ${url}...`);
  const ai = getAI();
  
  const prompt = `
    You are a world-class Brand Strategist.
    Analyze the website/brand at: ${url} (Business Name: ${lead.businessName}).
    
    If the website is not accessible, Hallucinate a "Best-in-Class" brand identity that would fit this business perfectly based on its name and niche (${lead.niche}).
    
    Construct a "Brand DNA" profile with the following exact specifications:
    
    1. **Colors**: Extract or generate 5 specific Hex color codes representing the brand palette (Primary, Secondary, Accent, Light, Dark).
    2. **Typography**: Identify a premium font pairing (Header Font + Body Font).
    3. **Aesthetic**: List 3-5 keywords describing the visual vibe (e.g., "Professional", "Minimalist", "High-Contrast").
    4. **Voice**: List 3-5 keywords describing the copy tone (e.g., "Confident", "Friendly", "Expert").
    5. **Values**: List 4 core brand values.
    6. **Tagline**: Write a punchy, memorable 1-sentence tagline.
    7. **Mission**: Write a 2-sentence "Business Overview" or Mission Statement.
    8. **Archetype**: Define the Brand Archetype (e.g., "The Ruler", "The Creator").

    Return strictly valid JSON:
    {
      "colors": ["#hex", "#hex", "#hex", "#hex", "#hex"],
      "fontPairing": "HeaderFont / BodyFont",
      "archetype": "string",
      "visualTone": "string",
      "tagline": "string",
      "brandValues": ["string", "string", "string", "string"],
      "aestheticTags": ["string", "string", "string"],
      "voiceTags": ["string", "string", "string"],
      "mission": "string"
    }
  `;
  
  const res = await loggedGenerateContent({
    ai, module: 'IDENTITY', model: 'gemini-3-pro-preview', modelClass: 'PRO', reasoningDepth: 'HIGH', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return JSON.parse(res);
};

export const generateVideoPayload = async (
  prompt: string, 
  leadId?: string, 
  imageStartData?: string, 
  imageEndData?: string,
  config?: VeoConfig
): Promise<string> => {
  pushLog("GENERATING VIDEO ASSET (VEO 3.1)...");
  const ai = getAI();
  
  // Default config if not provided
  const settings: VeoConfig = config || {
    aspectRatio: '16:9',
    resolution: '720p',
    modelStr: 'veo-3.1-fast-generate-preview'
  };

  try {
    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: settings.resolution,
      aspectRatio: settings.aspectRatio
    };

    // If End Frame exists, add it to config (Only supported on fast-generate for now per docs/constraints)
    if (imageEndData) {
      const parts = imageEndData.split(',');
      if (parts.length === 2) {
        const mimeType = parts[0].split(':')[1].split(';')[0];
        const imageBytes = parts[1];
        videoConfig.lastFrame = { imageBytes, mimeType };
      }
    }

    let request: any = {
      model: settings.modelStr,
      prompt,
      config: videoConfig
    };

    // Add Start Frame if present
    if (imageStartData) {
      const parts = imageStartData.split(',');
      if (parts.length === 2) {
        const mimeType = parts[0].split(':')[1].split(';')[0];
        const imageBytes = parts[1];
        request.image = { imageBytes, mimeType };
        pushLog(`VEO: REFERENCE IMAGE ADDED (${mimeType})`);
      }
    }

    let operation = await ai.models.generateVideos(request);
    
    const startTime = Date.now();
    while (!operation.done) {
      if (Date.now() - startTime > 300000) throw new Error("VEO TIMEOUT");
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned from Veo.");

    // Fetch video blob
    const apiKey = process.env.API_KEY || "";
    const fetchUrl = `${videoUri}&key=${apiKey}`;
    const res = await fetch(fetchUrl);
    const blob = await res.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            saveAsset('VIDEO', `VEO_GEN_${Date.now()}`, base64data, 'VIDEO_PITCH', leadId);
            resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

  } catch (e: any) {
    console.error("Veo Gen Error", e);
    pushLog(`ERROR: VEO FAILED - ${e.message}`);
    return "";
  }
};

export const generateAudioPitch = async (t: string, v: string, leadId?: string) => {
  pushLog(`AUDIO: SYNTHESIZING SPEECH (${v})...`);
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text: t }] },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: v } },
        },
      },
    });
    
    const cand = response.candidates?.[0];
    if (cand?.content?.parts?.[0]?.inlineData?.data) {
        const base64Audio = `data:audio/mp3;base64,${cand.content.parts[0].inlineData.data}`;
        saveAsset('AUDIO', `PITCH_${Date.now()}`, base64Audio, 'SONIC_STUDIO', leadId);
        return base64Audio;
    }
    return "";
  } catch(e) {
    console.error("TTS Error", e);
    return "";
  }
};
