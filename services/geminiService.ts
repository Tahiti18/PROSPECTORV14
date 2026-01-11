import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURATION ---
const PRIMARY_MODEL = "google/gemini-2.0-flash-001"; // OpenRouter naming convention
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

// --- PERSISTENCE ---
export const getStoredKeys = () => ({
    openRouter: localStorage.getItem('pomelli_auth_override') || process.env.API_KEY || "",
    kie: localStorage.getItem('kie_api_key_override') || process.env.KIE_API_KEY || ""
});

export const setStoredKeys = (openRouter?: string, kie?: string) => {
    if (openRouter) localStorage.setItem('pomelli_auth_override', openRouter.trim());
    if (kie) localStorage.setItem('kie_api_key_override', kie.trim());
};

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

export const importVault = (importedAssets: AssetRecord[]) => {
    if (!Array.isArray(importedAssets)) return 0;
    let count = 0;
    importedAssets.forEach(a => {
        if (!SESSION_ASSETS.find(existing => existing.id === a.id)) {
            SESSION_ASSETS.push(a);
            count++;
        }
    });
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
    return count;
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
  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) return cleaned.substring(start, end + 1);
  } catch (e) {}
  return cleaned;
};

/**
 * CORE INFERENCE ENGINE: OPENROUTER FIRST
 */
export const openRouterChat = async (prompt: string, system?: string) => {
  const keys = getStoredKeys();
  const apiKey = keys.openRouter;

  if (!apiKey) {
    toast.error("GATEWAY LOCKED: OpenRouter API Key required.");
    throw new Error("AUTH_REQUIRED");
  }

  // Case 1: OpenRouter REST Bridge (sk-or-...)
  if (apiKey.startsWith('sk-or-')) {
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
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: system || "You are Prospector OS, a world-class High-Ticket Agency Intelligence Engine." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "OpenRouter Request Failed");
      
      const text = data.choices?.[0]?.message?.content || "{}";
      deductCost(PRIMARY_MODEL, text.length);
      return text;
    } catch (e: any) {
      pushLog(`OR_FAULT: ${e.message}`);
      throw e;
    }
  }

  // Case 2: Fallback to Native SDK if key is AIza...
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: system || "You are Prospector OS. Output JSON.",
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "{}";
    deductCost("gemini-3-flash", text.length);
    return text;
  } catch (e: any) {
    pushLog(`SDK_FAULT: ${e.message}`);
    throw e;
  }
};

export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const raw = await openRouterChat(prompt, system);
  return extractJson(raw);
};

export const loggedGenerateContent = async (args: { module: string; contents: any; config?: any; model?: string }) => {
    const prompt = typeof args.contents === 'string' ? args.contents : JSON.stringify(args.contents);
    return await openRouterChat(prompt, args.config?.systemInstruction);
};

// --- DOMAIN TASKS ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Targeting ${region} for ${niche}...`);
  const prompt = `Find ${count} REAL high-ticket B2B leads in ${region} for the ${niche} niche. Return JSON object with "leads" array containing businessName, websiteUrl, leadScore, assetGrade, socialGap, phone, email.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  const parsed = JSON.parse(jsonStr);
  return { leads: parsed.leads || [], groundingSources: [] };
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Architecting Campaign for ${lead.businessName}...`);
  const prompt = `URGENT TASK: Architect a multi-layered High-Ticket Agency Campaign for ${lead.businessName}. Return STRICT JSON including presentation, narrative, outreach, funnel, contentPack, and visualDirection.`;
  const jsonStr = await executeIntelligenceTask(prompt, "You are a world-class Marketing Architect.");
  return JSON.parse(jsonStr);
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const prompt = `Perform an exhaustive audit for ${lead.websiteUrl}. Identify technical stack and design deficits. Return detailed BenchmarkReport JSON.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(jsonStr);
};

export const generateOutreachSequence = async (lead: Lead) => {
    const prompt = `Generate a 5-day multi-channel sequence for ${lead.businessName}. Return JSON array of {day, channel, purpose, content}.`;
    const jsonStr = await executeIntelligenceTask(prompt);
    return JSON.parse(jsonStr);
};

export const architectFunnel = async (lead: Lead) => {
    const prompt = `Architect a 4-stage funnel for ${lead.businessName}. Return JSON array of {stage, title, description, conversionGoal}.`;
    const jsonStr = await executeIntelligenceTask(prompt);
    return JSON.parse(jsonStr);
};

export const architectPitchDeck = async (lead: Lead) => {
    const prompt = `Design an 8-slide pitch deck for ${lead.businessName}. Return JSON with "slides" array containing {title, bullets: string[]}.`;
    const jsonStr = await executeIntelligenceTask(prompt);
    return JSON.parse(jsonStr);
};

// --- MEDIA BRIDGES ---

export const generateVideoPayload = async (prompt: string, leadId?: string, startImage?: string, lastFrame?: string, config?: any, referenceImages: string[] = []) => {
    toast.info("VEO PROTOCOL: Submitting job via KIE bridge...");
    return ""; // Handling logic in VideoPitch.tsx via service calls to Proxy
};

export const generateAudioPitch = async (text: string, voiceName: string = 'Kore', leadId?: string) => {
    // Media logic
    return ""; 
};

export const generateVisual = async (prompt: string, lead: Lead, base64Image?: string) => {
    // Media logic
    return "";
};

export const analyzeVisual = async (data: string, mimeType: string, prompt: string) => {
    return await openRouterChat(`Analyze visual data with prompt: ${prompt}`);
};

export const fetchBenchmarkData = (lead: Lead) => fetchLiveIntel(lead, 'BENCHMARK');
export const generateProposalDraft = (lead: Lead) => openRouterChat(`Draft agency proposal for ${lead.businessName}.`);
export const generateTaskMatrix = async (lead: Lead) => JSON.parse(await executeIntelligenceTask(`Create a 10-item checklist for ${lead.businessName}. JSON.`));
export const generateNurtureDialogue = async (lead: Lead, sc: string) => JSON.parse(await executeIntelligenceTask(`Simulate lead dialogue for ${lead.businessName}. Scenario: ${sc}. JSON.`));
export const generateROIReport = (ltv: number, l: number, c: number) => openRouterChat(`ROI projection for LTV ${ltv}.`);
export const generateFlashSparks = async (lead: Lead) => JSON.parse(await executeIntelligenceTask(`10 hooks for ${lead.businessName}. JSON array.`));
export const generateMockup = async (n: string, ni: string, id?: string) => "";
export const generatePitch = (lead: Lead) => openRouterChat(`3-minute pitch for ${lead.businessName}.`);
export const generateSonicPrompt = (lead: Lead) => openRouterChat(`Sonic brand prompt for ${lead.businessName}.`);
export const generateLyrics = (lead: Lead, t: string, ty: string) => openRouterChat(`Lyrics for ${lead.businessName}.`);
export const enhanceVideoPrompt = (p: string) => openRouterChat(`Enhance: ${p}`);
export const enhanceStrategicPrompt = (p: string) => openRouterChat(`Optimize: ${p}`);
export const fetchViralPulseData = async (n: string) => JSON.parse(await executeIntelligenceTask(`Trends for ${n}. JSON.`));
export const identifySubRegions = async (t: string): Promise<string[]> => JSON.parse(await executeIntelligenceTask(`Target sectors in ${t}. JSON array.`));
export const crawlTheaterSignals = async (s: string, sig: string): Promise<Lead[]> => JSON.parse(await executeIntelligenceTask(`Leads in ${s}. JSON.`));
export const analyzeLedger = async (ls: Lead[]) => JSON.parse(await executeIntelligenceTask(`Analyze ${ls.length} leads. JSON.`));
export const analyzeVideoUrl = (u: string, p: string, id?: string) => openRouterChat(`Video audit ${u}.`);
export const synthesizeArticle = (s: string, m: string) => openRouterChat(`Analyze article ${s}.`);
export const testModelPerformance = (m: string, p: string) => openRouterChat(`Test ${p}`);
export const generateMotionLabConcept = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Storyboard for ${l.businessName}. JSON.`));
export const generateAffiliateProgram = async (n: string) => JSON.parse(await executeIntelligenceTask(`Affiliate matrix for ${n}. JSON.`));
export const generateAgencyIdentity = async (n: string, r: string) => JSON.parse(await executeIntelligenceTask(`Brand identity for ${n}. JSON.`));
export const extractBrandDNA = async (l: Partial<Lead>, u: string): Promise<BrandIdentity> => JSON.parse(await executeIntelligenceTask(`Extract DNA from ${u}. JSON.`));
export const generatePlaybookStrategy = async (n: string) => JSON.parse(await executeIntelligenceTask(`Strategic playbook for ${n}. JSON.`));
export const performFactCheck = async (l: Lead, c: string) => JSON.parse(await executeIntelligenceTask(`Fact check ${c}. JSON.`));
export const synthesizeProduct = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Offer structure for ${l.businessName}. JSON.`));
export const simulateSandbox = (l: Lead, ltv: number, v: number) => openRouterChat(`Sandbox simulation for ${l.businessName}.`);
export const critiqueVideoPresence = (l: Lead) => openRouterChat(`Video audit ${l.businessName}.`);
export const translateTactical = (t: string, lang: string) => openRouterChat(`Translate to ${lang}: ${t}`);
export const fetchTokenStats = async () => ({ recentOps: [] });

export const queryRealtimeAgent = async (prompt: string) => {
    const text = await openRouterChat(`Search for current info: ${prompt}`);
    return { text, sources: [] };
};