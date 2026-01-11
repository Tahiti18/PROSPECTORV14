import { Lead } from '../types';

// Hard-locked to OpenRouter REST to avoid build failures with missing SDKs
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "google/gemini-3-flash-preview"; 

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
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return text.substring(start, end + 1);
    }
  } catch (e) {}
  return text;
};

/**
 * OPENROUTER REST INTERFACE
 * Unified gateway for all intelligence calls.
 */
export const openRouterChat = async (prompt: string, systemInstruction?: string, tools?: any[], imageData?: { data: string, mimeType: string }) => {
  const systemText = systemInstruction || "You are the Executive Strategist. Always output valid JSON. No filler.";
  
  const messages: any[] = [
    { role: "system", content: systemText },
    { role: "user", content: prompt }
  ];

  if (imageData) {
    // Note: OpenRouter supports content as array for vision
    messages[1].content = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: `data:${imageData.mimeType};base64,${imageData.data}` } }
    ];
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Prospector OS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: messages,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || "UPLINK_DENIED");
    }

    const result = await response.json();
    return extractJson(result.choices?.[0]?.message?.content || "");
  } catch (e: any) {
    pushLog(`NEURAL_FAULT: ${e.message}`);
    throw e;
  }
};

// --- CORE DISCOVERY ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche} entities...`);
  const prompt = `Find ${count} high-ticket B2B leads in ${region} for ${niche}. 
    Return ONLY a raw JSON array of objects: { businessName, websiteUrl, city, niche, leadScore (0-100), assetGrade (A/B/C), socialGap }.`;
  const text = await openRouterChat(prompt, "Output ONLY raw JSON array.");
  try {
    const leads = JSON.parse(text);
    return { leads: Array.isArray(leads) ? leads : [], groundingSources: [] };
  } catch (e) {
    return { leads: [], groundingSources: [] };
  }
};

/**
 * STRATEGIC ORCHESTRATOR
 */
export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Mapping strategy for ${lead.businessName}...`);
  const prompt = `Architect a multi-channel campaign for ${lead.businessName}. 
    MANDATORY JSON: 
    {
      "presentation": { "title": "", "slides": [{ "title": "", "bullets": [], "visualRef": "" }] },
      "narrative": "",
      "contentPack": [{ "platform": "", "type": "", "caption": "" }],
      "outreach": { "emailSequence": [{ "subject": "", "body": "" }], "linkedin": "" },
      "visualDirection": { "brandMood": "", "colorPsychology": [], "aiImagePrompts": [] }
    }`;

  const text = await openRouterChat(prompt);
  return JSON.parse(text);
};

// --- CORE UTILITIES ---

export const analyzeVisual = async (data: string, mime: string, p: string) => {
  return await openRouterChat(p, "Analyze this visual data.", undefined, { data, mimeType: mime });
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const text = await openRouterChat(`Technical audit for ${lead.websiteUrl} focus on ${module}. JSON format.`);
  const parsed = JSON.parse(text || "{}");
  return { 
    entityName: lead.businessName, missionSummary: "Audit successful.",
    visualStack: [], sonicStack: [], featureGap: "N/A", businessModel: "N/A", 
    designSystem: "N/A", deepArchitecture: "N/A", sources: [], ...parsed 
  };
};

export const testModelPerformance = async (m: string, p: string) => {
  return await openRouterChat(p);
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const text = await openRouterChat(`Motion graphics concept for ${lead.businessName}. JSON: { title, hook, scenes: [] }.`);
  return JSON.parse(text || "{}");
};

export const analyzeVideoUrl = async (u: string, p: string, id?: string) => {
  return await openRouterChat(`Analyze video at ${u}. Directive: ${p}`);
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, "competitive_benchmark");
};

export const generateProposalDraft = async (lead: Lead) => {
  return await openRouterChat(`High-ticket proposal for ${lead.businessName}.`);
};

export const generateOutreachSequence = async (lead: Lead) => {
  const text = await openRouterChat(`Outreach sequence for ${lead.businessName}. JSON array.`);
  return JSON.parse(text || "[]");
};

export const analyzeLedger = async (leads: Lead[]) => {
  const text = await openRouterChat(`Analyze these leads: ${JSON.stringify(leads)}. JSON: { risk, opportunity }.`);
  return JSON.parse(text || "{}");
};

export const performFactCheck = async (lead: Lead, claim: string) => {
  const text = await openRouterChat(`Fact check: "${claim}" for ${lead.businessName}. JSON: { status, evidence, sources: [] }.`);
  return JSON.parse(text || "{}");
};

export const generatePlaybookStrategy = async (niche: string) => {
  const text = await openRouterChat(`Playbook for ${niche}. JSON: { strategyName, steps: [] }.`);
  return JSON.parse(text || "{}");
};

export const architectFunnel = async (lead: Lead) => {
  const text = await openRouterChat(`Funnel for ${lead.businessName}. JSON array.`);
  return JSON.parse(text || "[]");
};

export const architectPitchDeck = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch deck for ${lead.businessName}. JSON array.`);
  return JSON.parse(text || "[]");
};

export const generateTaskMatrix = async (lead: Lead) => {
  const text = await openRouterChat(`Tasks for ${lead.businessName}. JSON array.`);
  return JSON.parse(text || "[]");
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const text = await openRouterChat(`Chat simulation for ${lead.businessName}: ${scenario}. JSON array.`);
  return JSON.parse(text || "[]");
};

export const extractBrandDNA = async (lead: any, url: string) => {
  const text = await openRouterChat(`Brand DNA from ${url}. JSON: { colors: [], fontPairing, archetype, visualTone, tagline, manifesto, extractedImages: [] }.`);
  return JSON.parse(text || "{}");
};

export const synthesizeProduct = async (lead: Lead) => {
  const text = await openRouterChat(`Product offer for ${lead.businessName}. JSON.`);
  return JSON.parse(text || "{}");
};

export const generateFlashSparks = async (lead: Lead) => {
  const text = await openRouterChat(`5 viral hooks for ${lead.businessName}. JSON array.`);
  return JSON.parse(text || "[]");
};

export const generatePitch = async (lead: Lead) => {
  const text = await openRouterChat(`Pitch for ${lead.businessName}. JSON: { "pitch": "..." }.`);
  try { return JSON.parse(text).pitch || text; } catch { return text; }
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await openRouterChat(`ROI simulation for ${lead.businessName}. LTV ${ltv}, Vol ${volume}.`);
};

export const synthesizeArticle = async (s: string, m: string) => {
  return await openRouterChat(`Synthesize article: ${s} as ${m}.`);
};

export const loggedGenerateContent = async (opts: any) => {
  const prompt = Array.isArray(opts.contents) ? opts.contents.map((c: any) => c.text || c).join('\n') : opts.contents;
  return await openRouterChat(prompt, opts.config?.systemInstruction);
};

export const generateLyrics = async (l: any, p: string, t: string) => {
  return await openRouterChat(`Jingle lyrics for ${l.businessName}. Style: ${p}.`);
};

export const generateSonicPrompt = async (l: any) => {
  const text = await openRouterChat(`Sonic description for ${l.businessName}. JSON: { "prompt": "..." }.`);
  try { return JSON.parse(text).prompt || "Corporate ambient"; } catch { return "Corporate ambient"; }
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
  const text = await openRouterChat(`Identity for agency in ${region} serving ${niche}. JSON.`);
  return JSON.parse(text || "{}");
};

export const generateAffiliateProgram = async (niche: string) => {
  const text = await openRouterChat(`Affiliate program for ${niche}. JSON.`);
  return JSON.parse(text || "{}");
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await openRouterChat(`Video audit for ${lead.businessName}.`);
};

export const translateTactical = async (text: string, lang: string) => {
  const res = await openRouterChat(`Translate to ${lang}: "${text}". JSON: { "translated": "..." }.`);
  try { return JSON.parse(res).translated || res; } catch { return res; }
};

export const fetchViralPulseData = async (niche: string) => {
  const text = await openRouterChat(`Trends in ${niche}. JSON array.`);
  return JSON.parse(text || "[]");
};

export const queryRealtimeAgent = async (q: string) => {
  const text = await openRouterChat(q);
  return { text, sources: [] };
};

export const generateROIReport = async (ltv: number, vol: number, conv: number) => {
  return await openRouterChat(`ROI Report: LTV ${ltv}, Vol ${vol}, Conv ${conv}.`);
};

export const fetchTokenStats = async () => ({ recentOps: [{ op: 'REST_LINK', id: 'GEMINI_FLASH_V3', cost: '0.0001' }] });

export const identifySubRegions = async (theater: string) => {
  const text = await openRouterChat(`List 5 business districts in ${theater}. JSON array.`);
  return JSON.parse(text || "[]");
};

export const crawlTheaterSignals = async (region: string, signal: string) => {
  const text = await openRouterChat(`Find businesses in ${region} with signal: ${signal}. JSON array.`);
  return JSON.parse(text || "[]");
};

// --- GATED ---
export const generateVisual = async (p: string, l: any, e?: string) => null;
export const generateVideoPayload = async (p: string, i?: string, s?: string, e?: string, c?: any, r?: any, v?: any) => null;
export const generateAudioPitch = async (t: string, v: string, l?: string) => null;
export const generateMockup = async (b: string, n: string, id?: string) => null;
export const getAI = () => { return null; }; // SDK Mock

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
};
export const clearVault = () => { SESSION_ASSETS.length = 0; assetListeners.forEach(l => l([])); };
export const importVault = (a: any[]) => { SESSION_ASSETS.push(...a); assetListeners.forEach(l => l([...SESSION_ASSETS])); return a.length; };
