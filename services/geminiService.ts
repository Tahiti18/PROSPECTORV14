
import { Lead } from '../types';

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

export const saveAsset = (type: AssetRecord['type'], title: string, data: string, module?: string, leadId?: string, metadata?: any) => {
  const asset: AssetRecord = { id: uuidLike(), type, title, data, module, leadId, timestamp: Date.now(), metadata };
  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return asset;
};

/**
 * DEFENSIVE NEURAL PARSER
 * Strips markdown and aggressively isolates valid JSON objects.
 */
const extractJson = (text: string) => {
  if (!text) return "";
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return cleaned.substring(start, end + 1);
    }
  } catch (e) {}
  return cleaned;
};

/**
 * OPENROUTER GEMINI FLASH CHAT
 * STRICTLY uses Gemini 2.0 Flash via OpenRouter API
 * NO GOOGLE APIS - NO PRO MODELS - ONLY FLASH
 */
export const openRouterChat = async (prompt: string, systemInstruction?: string) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env file');
  }

  const defaultSystem = `You are a Senior B2B Sales Strategist for a high-end AI Transformation Agency. 
Your goal is to help your agency close specific business targets. 
NEVER mention "Prospector OS", "The Engine", or your own internal software in your outreach. 
You work for the user. Always output raw valid JSON. No conversational filler.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://prospector-os.app',
        'X-Title': 'Prospector OS V14'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: systemInstruction || defaultSystem
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return extractJson(text);
  } catch (e: any) {
    pushLog(`NEURAL_FAULT: ${e.message}`);
    throw e;
  }
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche} entities...`);
  const prompt = `Find ${count} high-ticket B2B leads in ${region} for ${niche}. 
    Return a JSON array of objects: { "leads": [{ "businessName": "", "websiteUrl": "", "city": "", "niche": "", "leadScore": 0, "assetGrade": "A", "socialGap": "" }] }`;
  const text = await openRouterChat(prompt);
  try {
    const parsed = JSON.parse(text);
    return { leads: parsed.leads || [], groundingSources: [] };
  } catch (e) {
    return { leads: [], groundingSources: [] };
  }
};

/**
 * STRATEGIC ORCHESTRATOR
 * Stabilized prompt for Gemini Flash via OpenRouter.
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Mapping strategy for ${lead.businessName}...`);
  const prompt = `Construct a multi-channel campaign for the target: ${lead.businessName}. 
    Niche: ${lead.niche}. Context: ${lead.socialGap}.
    
    MANDATORY JSON STRUCTURE:
    {
      "presentation": { "title": "Strategic Roadmap", "slides": [{ "title": "Intro", "bullets": ["Point 1"] }] },
      "narrative": "A long, compelling executive narrative...",
      "contentPack": [{ "platform": "LinkedIn", "type": "Text", "caption": "Post content" }],
      "outreach": { "emailSequence": [{ "subject": "Proposal", "body": "Email content" }], "linkedin": "Connect request" },
      "visualDirection": { "brandMood": "Premium", "colorPsychology": [], "aiImagePrompts": [] }
    }`;

  const text = await openRouterChat(prompt);
  const data = JSON.parse(text);
  if (!data.presentation) data.presentation = { title: "Draft", slides: [] };
  if (!data.outreach) data.outreach = { emailSequence: [], linkedin: "" };
  return data;
};

// --- UTILITIES ---

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const text = await openRouterChat(`Audit the business at ${lead.websiteUrl} for ${module}. Return JSON.`);
  const parsed = JSON.parse(text || "{}");
  return { 
    entityName: lead.businessName, missionSummary: "Audit complete.",
    visualStack: [], sonicStack: [], featureGap: "N/A", businessModel: "N/A", 
    designSystem: "N/A", deepArchitecture: "N/A", sources: [], ...parsed 
  };
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, "benchmark");
};

export const generateProposalDraft = async (lead: Lead) => {
  const text = await openRouterChat(`Write a high-ticket AI transformation proposal for ${lead.businessName}. Focus on ROI. Return as JSON with "proposal" field.`);
  try { 
    return JSON.parse(text).proposal || text; 
  } catch { 
    return text; 
  }
};

export const generateOutreachSequence = async (lead: Lead) => {
  const text = await openRouterChat(`5-step outreach sequence for ${lead.businessName}. JSON array of {day: 1, subject: "", content: ""}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const analyzeLedger = async (leads: Lead[]) => {
  const text = await openRouterChat(`Analyze these leads: ${JSON.stringify(leads)}. JSON: { "risk": "", "opportunity": "" }.`);
  try { return JSON.parse(text); } catch { return { risk: "N/A", opportunity: "N/A" }; }
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const text = await openRouterChat(`Fact check: "${claim}" for ${lead.businessName}. JSON: { "status": "", "evidence": "", "sources": [] }.`);
  try { return JSON.parse(text); } catch { return { status: "Unknown", evidence: "N/A" }; }
};

export const generatePlaybookStrategy = async (niche: string) => {
  const text = await openRouterChat(`Playbook for ${niche}. JSON: { "strategyName": "", "steps": [] }.`);
  try { return JSON.parse(text); } catch { return { strategyName: "Ops", steps: [] }; }
};

export const architectFunnel = async (lead: Lead) => {
  const text = await openRouterChat(`Funnel for ${lead.businessName}. JSON array of {stage: "", title: "", description: "", conversionGoal: ""}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const architectPitchDeck = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch deck for ${lead.businessName}. JSON array of {title: "", narrativeGoal: "", keyVisuals: ""}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generateTaskMatrix = async (lead: Lead) => {
  const text = await openRouterChat(`Tasks for ${lead.businessName}. JSON array of {id: "", task: "", status: "pending"}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const text = await openRouterChat(`Chat for ${lead.businessName}: ${scenario}. JSON array of {role: "", text: ""}.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const text = await openRouterChat(`Brand DNA from ${url}. JSON: { "colors": [], "fontPairing": "", "archetype": "", "visualTone": "", "tagline": "", "manifesto": "", "extractedImages": [] }.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const synthesizeProduct = async (lead: Lead) => {
  const text = await openRouterChat(`Product for ${lead.businessName}. JSON: { "productName": "", "tagline": "", "pricePoint": "", "features": [] }.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const generateFlashSparks = async (lead: Lead) => {
  const text = await openRouterChat(`5 hooks for ${lead.businessName}. JSON array of strings.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const generatePitch = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch for ${lead.businessName}. JSON: { "pitch": "..." }.`);
  try { return JSON.parse(text).pitch || text; } catch { return text; }
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  const text = await openRouterChat(`ROI simulation for ${lead.businessName}. LTV $${ltv}, Volume ${volume}. Return as JSON with "analysis" field.`);
  try {
    return JSON.parse(text).analysis || text;
  } catch {
    return text;
  }
};

export const synthesizeArticle = async (s: string, m: string) => {
  const text = await openRouterChat(`Synthesize article: ${s} as ${m}. Return as JSON with "article" field.`);
  try {
    return JSON.parse(text).article || text;
  } catch {
    return text;
  }
};

export const loggedGenerateContent = async (opts: any) => {
  const p = Array.isArray(opts.contents) ? opts.contents.map((c:any)=>c.text||c).join(' ') : opts.contents;
  const text = await openRouterChat(p, opts.config?.systemInstruction);
  return text;
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  const text = await openRouterChat(`Lyrics for ${l.businessName}. Style: ${p}. Return as JSON with "lyrics" field.`);
  try {
    return JSON.parse(text).lyrics || text;
  } catch {
    return text;
  }
};

export const generateSonicPrompt = async (l: any) => {
  const text = await openRouterChat(`Sonic prompt for ${l.businessName}. JSON: { "prompt": "..." }.`);
  try { return JSON.parse(text).prompt || "Corporate"; } catch { return "Corporate"; }
};

export const enhanceVideoPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance video prompt: "${p}". JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced || p; } catch { return p; }
};

export const enhanceStrategicPrompt = async (p: string) => {
  const text = await openRouterChat(`Enhance strategic prompt: "${p}". JSON: { "enhanced": "..." }.`);
  try { return JSON.parse(text).enhanced || p; } catch { return p; }
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const text = await openRouterChat(`Brand for agency in ${region} serving ${niche}. JSON.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const generateAffiliateProgram = async (niche: string) => {
  const text = await openRouterChat(`Affiliate for ${niche}. JSON.`);
  try { return JSON.parse(text); } catch { return {}; }
};

export const critiqueVideoPresence = async (lead: Lead) => {
  const text = await openRouterChat(`Video audit for ${lead.businessName}. Return as JSON with "audit" field.`);
  try {
    return JSON.parse(text).audit || text;
  } catch {
    return text;
  }
};

export const translateTactical = async (text: string, lang: string) => {
  const res = await openRouterChat(`Translate to ${lang}: "${text}". JSON: { "translated": "..." }.`);
  try { return JSON.parse(res).translated || res; } catch { return res; }
};

export const fetchViralPulseData = async (niche: string) => {
  const text = await openRouterChat(`Trends in ${niche}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const queryRealtimeAgent = async (q: string) => {
  const text = await openRouterChat(`${q} Return as JSON with "text" and "sources" fields.`);
  try {
    const parsed = JSON.parse(text);
    return {
      text: parsed.text || text,
      sources: parsed.sources || []
    };
  } catch {
    return {
      text: text,
      sources: []
    };
  }
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  const text = await openRouterChat(`ROI Report: LTV $${ltv}, Volume ${vol}, Conversion ${conv}%. Return as JSON with "report" field.`);
  try {
    return JSON.parse(text).report || text;
  } catch {
    return text;
  }
};

export const fetchTokenStats = async () => ({ recentOps: [{ op: 'REST_LINK', id: 'OR_FLASH_V3', cost: '0.0001' }] });

export const identifySubRegions = async (theater: string) => {
  const text = await openRouterChat(`List 5 districts in ${theater}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const text = await openRouterChat(`Businesses in ${region} with ${signal}. JSON array.`);
  try { return JSON.parse(text); } catch { return []; }
};

// NOTE: Video/image analysis features require KIE API (audio/video generation service)
// OpenRouter with Gemini Flash doesn't support multimodal vision/video analysis
export const analyzeVideoUrl = async (u: string, p: string, leadId?: string) => {
  const text = await openRouterChat(`Analyze video at URL: ${u}. Instruction: ${p}. Return as JSON with "analysis" field. Note: Direct video analysis not available, provide text-based analysis.`);
  try {
    return JSON.parse(text).analysis || text;
  } catch {
    return text;
  }
};

// NOTE: Visual analysis via base64 images not supported by OpenRouter Gemini Flash
// This returns a placeholder - use KIE API for actual image generation
export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
  pushLog('WARN: Image analysis not supported via OpenRouter. Use KIE API for visual features.');
  return `Visual analysis requested: ${prompt}. Note: Direct image analysis not available through OpenRouter API. Consider using KIE API for visual generation.`;
};

// NOTE: Image generation not supported by OpenRouter Gemini Flash
// Use KIE API for actual image generation
export const generateVisual = async (prompt: string, lead: any, base64Image?: string) => {
  pushLog('WARN: Image generation not supported via OpenRouter. Use KIE API for image generation.');
  return null;
};

// NOTE: Video generation not supported by OpenRouter
// Use KIE API for actual video generation
export const generateVideoPayload = async (
  prompt: string,
  leadId?: string,
  startImage?: string,
  endImage?: string,
  config?: VeoConfig,
  referenceImages?: string[],
  inputVideo?: string
) => {
  pushLog('WARN: Video generation not supported via OpenRouter. Use KIE API for video generation.');
  return null;
};

// NOTE: Audio generation not supported by OpenRouter
// Use KIE API for actual audio generation
export const generateAudioPitch = async (text: string, voice: string, leadId?: string) => {
  pushLog('WARN: Audio generation not supported via OpenRouter. Use KIE API for audio generation.');
  return null;
};

// Mockup generation uses visual generation (KIE API required)
export const generateMockup = async (businessName: string, niche: string, leadId?: string) => {
  return await generateVisual(`A high-end 4k 3D product mockup for ${businessName} in the ${niche} niche. Professional studio lighting.`, { id: leadId });
};

// Model testing with OpenRouter
export const testModelPerformance = async (model: string, prompt: string) => {
  const text = await openRouterChat(prompt);
  return text;
};

// Motion lab concept generation
export const generateMotionLabConcept = async (lead: Lead) => {
  const prompt = `Create a motion lab concept for ${lead.businessName}. Lead context: ${lead.socialGap}. JSON { "title": "", "hook": "", "scenes": [{ "time": "0s", "visual": "", "text": "" }] }`;
  const text = await openRouterChat(prompt);
  try {
    return JSON.parse(text);
  } catch {
    return { title: "Draft", hook: "N/A", scenes: [] };
  }
};

// Legacy compatibility - no longer returns AI instance
export const getAI = () => {
  pushLog('WARN: getAI() deprecated. Using OpenRouter API instead of direct SDK.');
  return null;
};

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
};

export const clearVault = () => { SESSION_ASSETS.length = 0; assetListeners.forEach(l => l([])); };
export const importVault = (a: any[]) => { SESSION_ASSETS.push(...a); assetListeners.forEach(l => l([...SESSION_ASSETS])); return a.length; };
