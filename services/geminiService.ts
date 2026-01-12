
import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';
// Fix: Import GoogleGenAI from @google/genai
import { GoogleGenAI } from "@google/genai";

// --- INFRASTRUCTURE CONFIGURATION ---
const PRIMARY_MODEL = "google/gemini-3-flash-preview";
const PROXY_BASE = "/api/proxy"; // Standardized backend proxy route

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

// --- SECURED KEY PERSISTENCE (ENVIRONMENT DRIVEN) ---
const sanitizeKey = (k: any): string => {
  if (!k || k === 'undefined' || k === 'null' || k === '') return '';
  return String(k).trim().replace(/^["']|["']$/g, '');
};

export const getStoredKeys = () => {
    return { 
        openRouter: sanitizeKey(process.env.OPENROUTER_API_KEY || process.env.API_KEY), 
        kie: sanitizeKey(process.env.KIE_API_KEY),
        google: sanitizeKey(process.env.API_KEY)
    };
};

export const setStoredKeys = (openRouter?: string, kie?: string) => {
    if (openRouter) localStorage.setItem('pomelli_auth_override', sanitizeKey(openRouter));
    if (kie) localStorage.setItem('kie_api_key_override', sanitizeKey(kie));
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

export const importVault = (newAssets: AssetRecord[]) => {
  SESSION_ASSETS.unshift(...newAssets);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  return newAssets.length;
};

export const clearVault = () => {
  SESSION_ASSETS.length = 0;
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
};

export const deleteAsset = (id: string) => {
  const index = SESSION_ASSETS.findIndex(a => a.id === id);
  if (index !== -1) {
    SESSION_ASSETS.splice(index, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
};

const extractJson = (text: string) => {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) return cleaned.substring(start, end + 1);
  return cleaned;
};

// --- CORE PROXY BRIDGES ---

export const openRouterChat = async (prompt: string, system?: string): Promise<string> => {
  try {
    const response = await fetch(`${PROXY_BASE}/openrouter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: [
          { role: "system", content: system || "You are Prospector OS Intelligence. Output JSON." },
          { role: "user", content: prompt }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Proxy Fail");
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

export const loggedGenerateContent = async (args: { module: string; contents: any; config?: any }) => {
    const prompt = typeof args.contents === 'string' ? args.contents : JSON.stringify(args.contents);
    const system = args.config?.systemInstruction || "Output JSON.";
    return await openRouterChat(prompt, system);
};

// --- RESTORED API METHODS ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  const prompt = `Identify ${count} high-ticket targets in ${region} for ${niche}. JSON: { "leads": [...] }`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return { leads: JSON.parse(jsonStr).leads || [], groundingSources: [] };
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  const prompt = `Architect campaign for ${lead.businessName}. JSON: { "presentation": { "slides": [] }, "narrative": "", "outreach": {}, "funnel": [], "contentPack": [], "visualDirection": {} }`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const prompt = `Audit ${lead.websiteUrl} for ${module}. Return BenchmarkReport JSON structure.`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const generateOutreachSequence = async (lead: Lead) => {
    return JSON.parse(await executeIntelligenceTask(`5-day sequence for ${lead.businessName}. JSON array.`));
};

export const architectFunnel = async (lead: Lead) => {
    return JSON.parse(await executeIntelligenceTask(`4-stage funnel for ${lead.businessName}. JSON array.`));
};

export const architectPitchDeck = async (lead: Lead) => {
    return JSON.parse(await executeIntelligenceTask(`Slides for ${lead.businessName}. JSON.`));
};

// Fix: Added generatePlaybookStrategy using @google/genai SDK
export const generatePlaybookStrategy = async (niche: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Develop master playbook strategy for ${niche}. Return JSON { "strategyName": "", "steps": [{ "title": "", "tactic": "" }] }`,
    config: { 
      responseMimeType: 'application/json',
      systemInstruction: "You are a master business strategist. Output only valid JSON."
    }
  });
  const text = response.text || "{}";
  deductCost('gemini-3-flash-preview', text.length);
  return JSON.parse(text);
};

// Fix: Added generateProposalDraft using @google/genai SDK
export const generateProposalDraft = async (lead: Lead) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Draft high-ticket proposal for ${lead.businessName}. Focus on ${lead.socialGap}. Return detailed markdown.`,
    config: {
      systemInstruction: "You are a high-ticket sales closer. Output professional markdown."
    }
  });
  const text = response.text || "";
  deductCost('gemini-3-pro-preview', text.length);
  return text;
};

export const generateVideoPayload = async (prompt: string, leadId?: string, startImg?: string, lastFr?: string, config?: any) => {
    const res = await fetch(`${PROXY_BASE}/kie/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, leadId, startImg, lastFr, config })
    });
    const data = await res.json();
    return data.url || data.taskId; 
};

export const generateAudioPitch = async (text: string, voice: string, leadId?: string) => {
    const res = await fetch(`${PROXY_BASE}/kie/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, leadId })
    });
    const data = await res.json();
    if (data.url) saveAsset('AUDIO', `Voice: ${text.slice(0,15)}`, data.url, 'SONIC_STUDIO', leadId);
    return data.url || "";
};

export const generateVisual = async (prompt: string, lead: Lead, base64Image?: string): Promise<string | undefined> => {
    const res = await fetch(`${PROXY_BASE}/kie/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, base64Image, leadId: lead.id })
    });
    const data = await res.json();
    if (data.url) saveAsset('IMAGE', prompt.slice(0,20), data.url, 'VISUAL_STUDIO', lead.id);
    return data.url;
};

export const analyzeVisual = async (data: string, mimeType: string, prompt: string) => {
    return await openRouterChat(`Analyze image (${mimeType}): ${prompt}. Data: ${data.slice(0, 50)}...`);
};

export const queryRealtimeAgent = async (prompt: string) => {
    const text = await openRouterChat(`Search grounded query: ${prompt}`);
    return { text, sources: [] };
};

export const fetchBenchmarkData = (lead: Lead) => fetchLiveIntel(lead, 'BENCHMARK');
export const generateLyrics = (lead: Lead, p: string, s: string) => openRouterChat(`Lyrics for ${lead.businessName}, ${p}, ${s}`);
export const generateSonicPrompt = (lead: Lead) => openRouterChat(`Music prompt for ${lead.businessName}`);
export const crawlTheaterSignals = async (r: string, s: string): Promise<Lead[]> => JSON.parse(await executeIntelligenceTask(`Signals in ${r}: ${s}. JSON.`));
export const identifySubRegions = async (t: string): Promise<string[]> => JSON.parse(await executeIntelligenceTask(`Regions in ${t}. JSON array.`));
export const analyzeLedger = async (ls: Lead[]) => JSON.parse(await executeIntelligenceTask(`Risk/Opp analysis of ${ls.length} leads. JSON.`));
export const enhanceVideoPrompt = (p: string) => openRouterChat(`Enhance: ${p}`);
export const generateMockup = (n: string, ni: string, id?: string) => generateVisual(`Mockup for ${n}, ${ni}`, { id } as Lead);
export const performFactCheck = async (l: Lead, c: string) => JSON.parse(await executeIntelligenceTask(`Fact check ${c} for ${l.businessName}. JSON.`));
export const synthesizeProduct = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Product offer for ${l.businessName}. JSON.`));
export const generatePitch = (l: Lead) => openRouterChat(`Elevator pitch for ${l.businessName}`);
export const generateAgencyIdentity = async (n: string, r: string) => JSON.parse(await executeIntelligenceTask(`Identity for ${n} in ${r}. JSON.`));
export const testModelPerformance = (m: string, p: string) => openRouterChat(`Performance test ${m}: ${p}`);
export const generateMotionLabConcept = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Storyboard for ${l.businessName}. JSON.`));
export const generateFlashSparks = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Hooks for ${l.businessName}. JSON array.`));
export const simulateSandbox = (l: Lead, ltv: number, v: number) => openRouterChat(`Growth simulation for ${l.businessName}, LTV ${ltv}, Vol ${v}`);
export const critiqueVideoPresence = (l: Lead) => openRouterChat(`Critique video for ${l.businessName}`);
export const translateTactical = (t: string, l: string) => openRouterChat(`Translate to ${l}: ${t}`);
export const generateNurtureDialogue = async (l: Lead, s: string) => JSON.parse(await executeIntelligenceTask(`Dialogue for ${l.businessName}, ${s}. JSON.`));
export const generateAffiliateProgram = async (n: string) => JSON.parse(await executeIntelligenceTask(`Affiliate program for ${n}. JSON.`));
export const generateTaskMatrix = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Tasks for ${l.businessName}. JSON.`));
export const fetchViralPulseData = async (n: string) => JSON.parse(await executeIntelligenceTask(`Trends for ${n}. JSON.`));
export const fetchTokenStats = async () => ({ recentOps: [] });
export const synthesizeArticle = (s: string, m: string) => openRouterChat(`Synthesize ${s} in mode ${m}`);
export const analyzeVideoUrl = (u: string, p: string, id?: string) => openRouterChat(`Audit video ${u}: ${p}`);
export const enhanceStrategicPrompt = (p: string) => openRouterChat(`Optimize strategy: ${p}`);
export const generateROIReport = (ltv: number, l: number, c: number) => openRouterChat(`ROI: LTV ${ltv}, Leads ${l}, Conv ${c}`);
export const extractBrandDNA = async (l: Partial<Lead>, u: string): Promise<BrandIdentity> => JSON.parse(await executeIntelligenceTask(`Brand DNA from ${u}. JSON.`));
