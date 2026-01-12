import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';

// --- INFRASTRUCTURE CONFIGURATION (REST ONLY - NO GOOGLE SDK) ---
const PRIMARY_MODEL = "google/gemini-2.0-flash-001"; 
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  modelStr?: string;
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

// --- SECURED KEY PERSISTENCE ---
export const getStoredKeys = () => {
    const sysGeneric = (process.env.API_KEY || "").trim();
    const sysOr = (process.env.OPENROUTER_API_KEY || "").trim();
    const sysKie = (process.env.KIE_API_KEY || "").trim();

    const localOr = (localStorage.getItem('pomelli_auth_override') || "").trim();
    const localKie = (localStorage.getItem('kie_api_key_override') || "").trim();

    const finalOr = (sysOr && sysOr !== "undefined") ? sysOr : (sysGeneric && sysGeneric !== "undefined") ? sysGeneric : localOr;
    const finalKie = (sysKie && sysKie !== "undefined") ? sysKie : localKie;

    return { openRouter: finalOr, kie: finalKie };
};

export const setStoredKeys = (openRouter?: string, kie?: string) => {
    if (openRouter) localStorage.setItem('pomelli_auth_override', openRouter.trim());
    if (kie) localStorage.setItem('kie_api_key_override', kie.trim());
};

// --- GLOBAL ASSET REPOSITORY ---
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

export const importVault = (assets: AssetRecord[]) => {
  SESSION_ASSETS.length = 0;
  SESSION_ASSETS.push(...assets);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return assets.length;
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

const extractJson = (text: string) => {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) return cleaned.substring(start, end + 1);
  return cleaned;
};

// --- CORE REST INFERENCE BRIDGE (NO GOOGLE SDK) ---
export const openRouterChat = async (prompt: string, system?: string) => {
  const { openRouter: apiKey } = getStoredKeys();

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    toast.error("GATEWAY LOCKED: OpenRouter API Key required.");
    throw new Error("AUTH_REQUIRED");
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Prospector OS"
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: [
          { role: "system", content: system || "You are Prospector OS Intelligence. Output ONLY valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Inference Node Error");
    
    const text = data.choices?.[0]?.message?.content || "{}";
    deductCost(PRIMARY_MODEL, text.length);
    return text;
  } catch (e: any) {
    pushLog(`ENGINE_FAULT: ${e.message}`);
    throw e;
  }
};

export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const raw = await openRouterChat(prompt, system);
  return extractJson(raw);
};

export const loggedGenerateContent = async (args: { module: string; contents: any; config?: any; model?: string }) => {
    const prompt = typeof args.contents === 'string' ? args.contents : JSON.stringify(args.contents);
    const system = args.config?.systemInstruction || "Output JSON.";
    return await openRouterChat(prompt, system);
};

// --- DOMAIN-SPECIFIC LOGIC (54 MODULES) ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche}...`);
  const prompt = `Find ${count} HIGH-TICKET B2B leads in ${region} for the ${niche} niche. Return JSON object with "leads" array. Each lead: businessName, websiteUrl, leadScore(0-100), assetGrade(A|B|C), socialGap, phone, email.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  const parsed = JSON.parse(jsonStr);
  return { leads: parsed.leads || [], groundingSources: [] };
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Architecting campaign for ${lead.businessName}...`);
  const prompt = `Architect a multi-layered campaign for ${lead.businessName}. Return STRICT JSON: "presentation" (slides array), "narrative", "outreach" (emailSequence), "funnel", "contentPack", "visualDirection".`;
  const jsonStr = await executeIntelligenceTask(prompt, "You are a World-Class Agency Architect.");
  return JSON.parse(jsonStr);
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const prompt = `Perform an exhaustive audit for ${lead.websiteUrl}. Return BenchmarkReport JSON.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(jsonStr);
};

export const generateOutreachSequence = async (lead: Lead) => {
    const jsonStr = await executeIntelligenceTask(`Generate 5-day outreach sequence for ${lead.businessName}. JSON array of {day, channel, content}.`);
    return JSON.parse(jsonStr);
};

export const architectFunnel = async (lead: Lead) => {
    const jsonStr = await executeIntelligenceTask(`Architect 4-stage conversion funnel for ${lead.businessName}. JSON.`);
    return JSON.parse(jsonStr);
};

export const architectPitchDeck = async (lead: Lead) => {
    const jsonStr = await executeIntelligenceTask(`Design pitch deck for ${lead.businessName}. JSON slides array.`);
    return JSON.parse(jsonStr);
};

export const generateVideoPayload = async (prompt: string, leadId?: string, startImage?: string, lastFrame?: string, config?: any) => {
    const payload = {
        prompt,
        image: startImage ? startImage.split(',')[1] : undefined,
        lastFrame: lastFrame ? lastFrame.split(',')[1] : undefined,
        aspectRatio: config?.aspectRatio || '16:9',
        resolution: config?.resolution || '720p'
    };
    const res = await fetch('/api/kie/video_submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.taskId || data.data?.taskId; 
};

export const generateAudioPitch = async (text: string, voiceName: string = 'Kore', leadId?: string) => ""; 

export const generateVisual = async (prompt: string, lead: Lead, base64Image?: string) => {
    const placeholder = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop`;
    saveAsset('IMAGE', `VISUAL: ${prompt.slice(0, 20)}`, placeholder, 'VISUAL_STUDIO', lead.id);
    return placeholder;
};

// --- CORE UTILITY EXPORTS ---

export const fetchBenchmarkData = (lead: Lead) => fetchLiveIntel(lead, 'BENCHMARK');
export const generateProposalDraft = (lead: Lead) => openRouterChat(`Draft agency proposal for ${lead.businessName}.`);
export const generateTaskMatrix = async (lead: Lead) => JSON.parse(await executeIntelligenceTask(`Create implemention checklist for ${lead.businessName}. JSON.`));
export const generateNurtureDialogue = async (lead: Lead, sc: string) => JSON.parse(await executeIntelligenceTask(`Simulate dialogue for ${lead.businessName} (Scenario: ${sc}). JSON.`));
export const generateROIReport = (ltv: number, l: number, c: number) => openRouterChat(`ROI: LTV ${ltv}, Vol ${l}, Conv ${c}.`);
export const generateFlashSparks = async (lead: Lead) => JSON.parse(await executeIntelligenceTask(`10 hooks for ${lead.businessName}. JSON array.`));
export const generateMockup = async (n: string, ni: string, id?: string) => generateVisual(`Mockup for ${n}`, { id } as Lead);
export const generatePitch = (lead: Lead) => openRouterChat(`Pitch for ${lead.businessName}.`);
export const generateSonicPrompt = (lead: Lead) => openRouterChat(`Sonic prompt for ${lead.businessName}.`);
export const generateLyrics = (lead: Lead, t: string, ty: string) => openRouterChat(`Lyrics for ${lead.businessName}.`);
export const enhanceVideoPrompt = (p: string) => openRouterChat(`Enhance video: ${p}`);
export const enhanceStrategicPrompt = (p: string) => openRouterChat(`Optimize strategy: ${p}`);
export const fetchViralPulseData = async (n: string) => JSON.parse(await executeIntelligenceTask(`Trends for ${n}. JSON.`));
export const identifySubRegions = async (t: string): Promise<string[]> => JSON.parse(await executeIntelligenceTask(`Sectors in ${t}. JSON.`));
export const crawlTheaterSignals = async (s: string, sig: string): Promise<Lead[]> => JSON.parse(await executeIntelligenceTask(`Leads in ${s} with signal ${sig}. JSON.`));
export const analyzeLedger = async (ls: Lead[]) => JSON.parse(await executeIntelligenceTask(`Analysis of ${ls.length} leads. JSON.`));
export const analyzeVideoUrl = (u: string, p: string, id?: string) => openRouterChat(`Audit video ${u}: ${p}`);
export const synthesizeArticle = (s: string, m: string) => openRouterChat(`Analyze source: ${s}`);
export const testModelPerformance = (m: string, p: string) => openRouterChat(`Benchmark: ${p}`);
export const generateMotionLabConcept = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Storyboard for ${l.businessName}. JSON.`));
export const generateAffiliateProgram = async (n: string) => JSON.parse(await executeIntelligenceTask(`Affiliate matrix for ${n}. JSON.`));
export const generateAgencyIdentity = async (n: string, r: string) => JSON.parse(await executeIntelligenceTask(`Agency identity for ${n}. JSON.`));
export const extractBrandDNA = async (l: Partial<Lead>, u: string): Promise<BrandIdentity> => JSON.parse(await executeIntelligenceTask(`Brand DNA from ${u}. JSON.`));
export const generatePlaybookStrategy = async (n: string) => JSON.parse(await executeIntelligenceTask(`Strategic playbook for ${n}. JSON.`));
export const performFactCheck = async (l: Lead, c: string) => JSON.parse(await executeIntelligenceTask(`Fact check: ${c}. JSON.`));
export const synthesizeProduct = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Offer synth for ${l.businessName}. JSON.`));
export const simulateSandbox = (l: Lead, ltv: number, v: number) => openRouterChat(`Sandbox for ${l.businessName} (LTV:${ltv})`);
export const critiqueVideoPresence = (l: Lead) => openRouterChat(`Video presence for ${l.businessName}.`);
export const translateTactical = (t: string, lang: string) => openRouterChat(`Translate to ${lang}: ${t}`);
export const fetchTokenStats = async () => ({ recentOps: [] });
export const analyzeVisual = async (data: string, mimeType: string, prompt: string) => openRouterChat(`Analyze vision: ${prompt}`);
export const queryRealtimeAgent = async (prompt: string) => ({ text: await openRouterChat(`Search for: ${prompt}`), sources: [] });
