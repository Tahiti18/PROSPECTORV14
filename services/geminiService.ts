
import { GoogleGenAI } from "@google/genai";
import { Lead, BrandIdentity } from '../types';
import { logAiOperation, uuidLike } from './usageLogger';
import { getModuleWeight } from './creditWeights';
import { deductCost } from './computeTracker'; // IMPORTED MONETIZATION
import { toast } from './toastManager'; // IMPORTED TOAST

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

// --- SYSTEM INSTRUCTIONS ---
const ORCHESTRATOR_SYSTEM_INSTRUCTION = `
ROLE (FIXED)
You are not a general assistant.
You are an AI Orchestration Engine embedded inside a production B2B platform.

Your responsibilities are:
• Orchestrate existing modules
• Normalize outputs
• Resolve duplication
• Compile client-ready packages
• Explain your own execution transparently

You do not invent new platform modules.
You do not redesign UI unless explicitly asked.
You do not provide speculative or unbounded creativity.

PLATFORM AWARENESS (EXPLICIT)
You are aware that the platform contains the following existing categories and modules:

Categories: Research, Strategy, Create, Media, Outreach, Execution, Proposals, Asset Library, Admin

Core Modules:
• Campaign Builder, Strategy Deck, Pitch Script, Content Pack
• Outreach Sequence, Deck Architect, Funnel Map
• FlashSpark (text generation), Creative Studio (brand imagery), Mockup Forge (product mockups)
• Video Studio / VEO, Audio Studio
• Outreach Builder, PitchGen, Sales Coach, AI Concierge
• Magic-Link Architect, ROI Projection, Competitive Gap Analysis
• AI Implementation Roadmap, Asset Library

PRIMARY OBJECTIVE
For a given business input, your job is to orchestrate the entire system and produce a complete, structured, client-ready campaign package, using existing modules.

EXECUTION ORDER (MANDATORY)
1. Research: Website analysis, contact protocol, trust gaps.
2. Strategy Aggregation: Campaign Builder, Deck structure, Funnel logic.
3. Asset Orchestration: Text via FlashSpark, Images via Creative Studio, Video/Audio studios.
4. Outreach & Execution: Sequences, PitchGen, Concierge simulation.
5. Proposal Assembly: Executive summary, Gap analysis, ROI logic.
6. Compilation: Client-facing package, Internal execution package, Replay timeline.

OUTPUT REQUIREMENTS (STRICT JSON)
You must always return a JSON object matching this structure:
{
  "narrative": "Executive Summary string",
  "presentation": { "title": "string", "slides": [{ "title": "string", "bullets": ["string"], "visualRef": "string" }] },
  "outreach": { "emailSequence": [{ "subject": "string", "body": "string" }], "linkedin": "string" },
  "contentPack": [{ "platform": "string", "type": "string", "caption": "string", "assetRef": "string" }],
  "replayTimeline": [{ "step": number, "module": "string", "action": "string", "status": "string" }],
  "humanReview": ["string"]
}

BEHAVIOR RULES
• Avoid military or aggressive terminology.
• Avoid claims of certainty or guarantees.
• Prefer explainable logic over persuasion.
• If an error occurs, log it and continue when possible.
`;

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
  toast.success(`Asset Secured: ${title.slice(0, 20)}...`); // Toast
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

// --- LOGGED WRAPPER (NOW WITH MONETIZATION & GATING) ---
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

  // 1. Estimate Cost (Heuristic: Input length * 4)
  const inputStr = JSON.stringify(params.contents);
  const estimatedChars = inputStr.length; // Approximate
  
  // 2. Enforce Payment & Gating
  const canAfford = deductCost(params.model, estimatedChars);
  if (!canAfford) {
      // deductCost handles specific error toasts (Locked vs Insufficient Funds)
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
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("JSON Parse Error, attempting recovery", e);
    return null;
  }
};

// --- IMPLEMENTATIONS (Cost-Optimized to Flash) ---

export const extractBrandDNA = async (lead: Lead, url: string): Promise<BrandIdentity> => {
  pushLog(`DNA: DEEP FORENSIC SCANNING ${url}...`);
  const ai = getAI();
  
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  // 1. Deterministic Asset Recovery (Mathematical Extraction)
  const deterministicLogo = `https://logo.clearbit.com/${hostname}`;
  const deterministicIcon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`;

  const prompt = `
    You are a forensic brand design auditor.
    Analyze the website: ${url} (Business: ${lead.businessName}).
    
    Your goal is to extract the EXACT Brand Identity used on the live site.
    
    CRITICAL IMAGE EXTRACTION (MANDATORY 12+ IMAGES):
    1.  Perform a DEEP Google Search for "site:${hostname} OR site:instagram.com/${lead.businessName} OR site:facebook.com/${lead.businessName}".
    2.  Extract DIRECT, VALID image URLs.
        - MUST start with http:// or https://.
        - MUST end with .jpg, .png, .webp, .jpeg.
        - DO NOT invent or hallucinate URLs like "${hostname}/image1.jpg".
        - Only return URLs found in the search results or grounding data.
    3.  Prioritize:
        - Hero banners from homepage
        - Product photography
        - Lifestyle shots of customers
        - Team/About Us photos
    
    CRITICAL BRAND EXTRACTION:
    1.  COLORS: Find the EXACT Hex codes used for the Primary Brand Color, Secondary/Action Color, Backgrounds, and Accents.
    2.  FONTS: Identify the font families used for Headers and Body text (e.g. "Montserrat", "Open Sans").
    3.  COPY: Extract the exact Tagline and a 2-3 sentence Business Overview.
    
    Return strictly valid JSON (do not add markdown blocks):
    {
      "colors": ["#hex", "#hex", "#hex", "#hex", "#hex"],
      "fontPairing": "HeaderFont / BodyFont",
      "archetype": "string (e.g. The Explorer, The Sage)",
      "visualTone": "string (e.g. Coastal, Luxury, Minimalist)",
      "tagline": "string (The main h1 or slogan)",
      "brandValues": ["string", "string", "string", "string"],
      "aestheticTags": ["string", "string", "string", "string"],
      "voiceTags": ["string", "string", "string"],
      "mission": "string (Short mission statement)",
      "businessOverview": "string (2-3 sentences describing what they do)",
      "extractedImages": ["url1", "url2", "url3", "url4", "url5", "url6", "url7", "url8", "url9", "url10", "url11", "url12"]
    }
  `;
  
  try {
    // DOWNGRADED TO FLASH
    const res = await loggedGenerateContent({
      ai, module: 'IDENTITY', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
      contents: prompt,
      config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
    });
    
    let data = safeJsonParse(res);
    
    // Safety fallback if parsing failed completely
    if (!data) {
        data = {
            colors: ['#000000', '#FFFFFF', '#333333', '#666666', '#999999'],
            fontPairing: 'Inter / Roboto',
            archetype: 'Unknown',
            visualTone: 'Professional',
            tagline: 'Building the Future',
            extractedImages: []
        };
    }
    
    // Post-Process: Inject Deterministic Assets & Filter Stock
    const rawImages = data.extractedImages || [];
    const cleanImages = rawImages.filter((img: string) => 
      img && img.startsWith('http') &&
      (img.includes('.jpg') || img.includes('.png') || img.includes('.jpeg') || img.includes('.webp') || img.includes('Logo') || img.includes('logo')) &&
      !img.includes('unsplash.com') && 
      !img.includes('pexels.com') && 
      !img.includes('freepik.com')
    );

    // Ensure we have unique images
    const uniqueImages = Array.from(new Set([...cleanImages]));

    // Always prepend the real assets we know exist
    data.extractedImages = [deterministicLogo, deterministicIcon, ...uniqueImages];
    
    // Save to Vault for persistence
    data.extractedImages.forEach((img: string, i: number) => {
        if (i < 15) saveAsset('IMAGE', `EXTRACTED_ASSET_${i}_${hostname}`, img, 'DNA_EXTRACTOR', lead.id);
    });

    return data;
  } catch (e) {
    console.error("DNA Extraction Failed", e);
    // Hard Fallback to prevent crash
    return {
        colors: ['#000000', '#FFFFFF', '#333333', '#666666', '#999999'],
        fontPairing: 'Inter / Roboto',
        archetype: 'Unknown',
        visualTone: 'Professional',
        tagline: 'Building the Future',
        extractedImages: [deterministicLogo, deterministicIcon]
    } as BrandIdentity;
  }
};

export const enhanceVideoPrompt = async (rawPrompt: string): Promise<string> => {
  const ai = getAI();
  return await loggedGenerateContent({
      ai, module: 'VIDEO_PITCH', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: false,
      contents: `Act as a Hollywood Director. Rewrite this video prompt to be extremely detailed, cinematic, and descriptive for an AI video generator. Include lighting, camera movement, and texture details. Keep it under 60 words. Prompt: "${rawPrompt}"`
  });
};

export const generateLeads = async (theater: string, niche: string, count: number) => {
  pushLog(`RADAR: SCANNING ${theater} FOR ${niche}...`);
  const ai = getAI();
  const prompt = `Find ${count} real businesses in ${theater} that are in the ${niche || 'High Ticket Service'} niche. 
  For each, estimate a 'Lead Score' (0-100) based on their likely need for AI automation.
  Identify a specific 'Social Gap' (e.g. inactive instagram, bad website).
  Return JSON: { leads: [ { businessName, websiteUrl, city, niche, leadScore, socialGap, visualProof, bestAngle } ] }`;

  // DOWNGRADED TO FLASH
  const response = await loggedGenerateContent({
    ai, module: 'RADAR_RECON', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
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
  
  // DOWNGRADED TO FLASH
  const response = await loggedGenerateContent({
    ai, module: 'PLAYBOOK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response);
};

export const generateProposalDraft = async (lead: Lead) => {
  pushLog(`DRAFTING: PROPOSAL FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Write a high-ticket AI proposal for ${lead.businessName}. Emphasize their gap: ${lead.socialGap}. Format as Markdown.`;
  // DOWNGRADED TO FLASH
  return await loggedGenerateContent({
    ai, module: 'PROPOSALS', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
    contents: prompt
  });
};

export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  pushLog(`VISION: ANALYZING IMAGE...`);
  // Use logged wrapper manually or construct call
  const ai = getAI();
  // Image analysis with Flash is efficient
  if(!deductCost('gemini-3-flash-preview', 1000)) {
      throw new Error("Usage blocked.");
  }
  
  // DOWNGRADED TO FLASH
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
  
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module, model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
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
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'SEQUENCER', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
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
  
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'FACT_CHECK', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
  });
  return JSON.parse(res);
};

export const synthesizeProduct = async (lead: Lead) => {
  pushLog(`PRODUCT: DESIGNING OFFER FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Design a high-ticket AI product for ${lead.businessName}. JSON: { productName, tagline, pricePoint, features: [] }`;
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'PRODUCT_SYNTH', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
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
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'FUNNEL_MAP', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  pushLog(`IDENTITY: FORGING AGENCY BRAND...`);
  const ai = getAI();
  const prompt = `Create an agency identity for ${niche} in ${region}. JSON: { name, tagline, manifesto, colors: [] }`;
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'IDENTITY', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const testModelPerformance = async (model: string, prompt: string) => {
  pushLog(`TEST: BENCHMARKING ${model}...`);
  const ai = getAI();
  const start = Date.now();
  if(!deductCost(model, prompt.length)) return "BLOCKED: Upgrade Required"; 
  const res = await ai.models.generateContent({ model, contents: prompt });
  const latency = Date.now() - start;
  return `LATENCY: ${latency}ms\nOUTPUT: ${res.text}`;
};

export const generateMotionLabConcept = async (lead: Lead) => {
  pushLog(`MOTION: STORYBOARDING FOR ${lead.businessName}...`);
  const ai = getAI();
  const prompt = `Create a motion graphics storyboard for ${lead.businessName}. JSON: { title, hook, scenes: [{ time, visual, text }] }`;
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'MOTION_LAB', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
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
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'DECK_ARCH', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res);
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  pushLog(`SANDBOX: RUNNING SIMULATION...`);
  const ai = getAI();
  // DOWNGRADED TO FLASH
  return await loggedGenerateContent({
    ai, module: 'DEMO_SANDBOX', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
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
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'AI_CONCIERGE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: true,
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
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, module: 'AFFILIATE', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
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
  // DOWNGRADED TO FLASH
  return await loggedGenerateContent({
    ai, module: 'ARTICLE_INTEL', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'MEDIUM', isClientFacing: false,
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
  
  // Cost check for image generation (high cost)
  if(!deductCost(model, 5000)) {
      throw new Error("Operation cancelled: Insufficient Credits.");
  }

  // High-fidelity prompt engineering to mimic "4072" / 4K request
  let enrichedPrompt = prompt + " 4k, high resolution, highly detailed, photorealistic, professional photography, cinematic lighting, 8k render, unreal engine 5";
  
  if (lead?.brandIdentity && !inputImage) {
    const { colors, visualTone, aestheticTags } = lead.brandIdentity;
    enrichedPrompt = `
      Create a professional, high-fidelity image.
      Brand Context:
      - Colors: ${colors.join(', ')}
      - Aesthetic: ${aestheticTags?.join(', ')}
      - Tone: ${visualTone}
      
      Requirements:
      - Photorealistic 4K quality
      - Commercial grade photography
      - Sharp focus, high detail
      
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
            contents = { parts: [{ inlineData: { mimeType, data } }, { text: enrichedPrompt }] };
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
  
  // Input Contract Construction
  const inputContext = {
    businessName: lead.businessName,
    websiteUrl: lead.websiteUrl,
    location: lead.city,
    market: lead.niche,
    contextAssets: assets.map(a => `${a.type}: ${a.title}`),
    brandIdentity: lead.brandIdentity
  };

  const prompt = `
    INPUT CONTRACT:
    ${JSON.stringify(inputContext, null, 2)}

    EXECUTE ORCHESTRATION PROTOCOL.
    Refer to your System Instruction for mandatory Execution Order and Output Requirements.
  `;
  
  // DOWNGRADED TO FLASH
  const res = await loggedGenerateContent({
    ai, 
    module: 'BUSINESS_ORCHESTRATOR', 
    model: 'gemini-3-flash-preview', 
    modelClass: 'FLASH', 
    reasoningDepth: 'MEDIUM', 
    isClientFacing: true,
    contents: prompt,
    config: { 
      responseMimeType: 'application/json',
      systemInstruction: ORCHESTRATOR_SYSTEM_INSTRUCTION
    }
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
  // DEBUG ALERT: CONFIRM EXECUTION START
  alert("DEBUG: Starting Veo Generation Protocol...");
  
  pushLog("GENERATING VIDEO ASSET (VEO 3.1)...");
  
  // KIE INTEGRATION: Use HARDCODED key as requested by user.
  // Using explicit key bypassing env to ensure KIE key is used.
  const KIE_KEY = '2f30b2e5cdf012a40e82f10d7c30cb7f';
  let ai: GoogleGenAI;

  try {
    ai = new GoogleGenAI({ apiKey: KIE_KEY });
  } catch (e: any) {
    alert("CRITICAL: SDK Init Failed with KIE Key. " + e.message);
    throw e;
  }

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

    if (imageStartData) {
      const parts = imageStartData.split(',');
      if (parts.length === 2) {
        const mimeType = parts[0].split(':')[1].split(';')[0];
        const imageBytes = parts[1];
        request.image = { imageBytes, mimeType };
        pushLog(`VEO: REFERENCE IMAGE ADDED (${mimeType})`);
      }
    }

    alert(`DEBUG: Sending Request to ${settings.modelStr}. Please wait...`);
    console.log("[VEO] Sending Request:", request);
    
    let operation = await ai.models.generateVideos(request);
    
    alert("DEBUG: Operation Initiated. Polling for video...");
    
    const startTime = Date.now();
    while (!operation.done) {
      if (Date.now() - startTime > 300000) throw new Error("VEO TIMEOUT");
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned from Veo.");

    // Fetch video blob - Must use the KIE key here too
    const fetchUrl = `${videoUri}&key=${KIE_KEY}`;
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
    // CRITICAL FIX: Propagate error with specific message
    const msg = e.message || "Unknown API Error";
    pushLog(`ERROR: VEO FAILED - ${msg}`);
    
    // Explicit Alert for the User
    alert(`VEO ERROR: ${msg}`);
    throw new Error(`Veo API Error: ${msg}`);
  }
};

export const generateAudioPitch = async (t: string, v: string, leadId?: string) => {
  pushLog(`AUDIO: SYNTHESIZING SPEECH (${v})...`);
  const ai = getAI();
  try {
    deductCost('gemini-2.5-flash-preview-tts', t.length); // TTS cost
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
