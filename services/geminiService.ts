import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';
import { GoogleGenAI, Type, Modality } from "@google/genai";

// --- INFRASTRUCTURE CONFIGURATION ---
const PRIMARY_MODEL = "gemini-3-flash-preview"; 
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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
// As per instructions, API Key is obtained exclusively from process.env.API_KEY
export const getStoredKeys = () => {
    return { 
      openRouter: process.env.OPENROUTER_API_KEY || process.env.API_KEY || "", 
      google: process.env.API_KEY || "", 
      kie: process.env.KIE_API_KEY || "" 
    };
};

// No longer needed to set keys manually via UI
export const setStoredKeys = (openRouter?: string, kie?: string) => {
    if (openRouter) localStorage.setItem('pomelli_auth_override', openRouter);
    if (kie) localStorage.setItem('kie_api_key_override', kie);
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

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
};

const extractJson = (text: string) => {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  
  if (arrStart !== -1 && (start === -1 || arrStart < start)) {
      return cleaned.substring(arrStart, arrEnd + 1);
  }
  if (start !== -1 && end !== -1) return cleaned.substring(start, end + 1);
  return cleaned;
};

// --- CORE SDK INFERENCE BRIDGE ---
// Fix: Use process.env.API_KEY directly for initialization as per guidelines
export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: prompt,
    config: {
      systemInstruction: system || "You are Prospector OS Intelligence. Output valid JSON objects exclusively.",
      responseMimeType: "application/json"
    }
  });
  
  const text = response.text || "{}";
  deductCost(PRIMARY_MODEL, text.length);
  return extractJson(text);
};

// Fix: Implemented openRouterChat (using Gemini) to resolve missing export errors in reasoning modules
export const openRouterChat = async (prompt: string, system?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview"; // Using Pro for complex reasoning
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      systemInstruction: system || "You are Prospector OS Intelligence Reasoning Engine.",
    }
  });
  
  const text = response.text || "";
  deductCost(model, text.length);
  return text;
};

// --- DOMAIN LOGIC (LINKED TO UI) ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche}...`);
  const prompt = `Find ${count} real businesses in ${region} specializing in ${niche}. 
  Return JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "leadScore": 85, "assetGrade": "A", "socialGap": "Detailed reason why they need AI transformation", "city": "${region}", "niche": "${niche}", "phone": "", "email": "" }] }`;
  const jsonStr = await executeIntelligenceTask(prompt);
  const parsed = JSON.parse(jsonStr);
  if (Array.isArray(parsed)) return { leads: parsed };
  return parsed;
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Architecting campaign for ${lead.businessName}...`);
  const prompt = `Architect an exhaustive multi-layered campaign for ${lead.businessName}. 
  Context: ${lead.socialGap}.
  Return JSON with these exact keys: 
  "presentation": { "title": "...", "slides": [{ "title": "Slide Title", "bullets": ["Bullet 1", "Bullet 2"] }] }, 
  "narrative": "A professional 3-paragraph executive summary", 
  "outreach": { "emailSequence": [{ "subject": "Subject", "body": "Body text" }] }, 
  "funnel": [{ "title": "Stage Name", "description": "Details", "conversionGoal": "Action" }], 
  "contentPack": [{ "platform": "Instagram", "type": "Reel", "caption": "Caption text" }], 
  "visualDirection": { "brandMood": "Description", "aiImagePrompts": [{ "use_case": "Hero Image", "prompt": "Prompt text" }] }`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const prompt = `Perform an exhaustive audit for ${lead.businessName} (${lead.websiteUrl}). 
  Return JSON with keys: entityName, missionSummary, visualStack (array of {label, description}), sonicStack (array), featureGap, businessModel, designSystem, deepArchitecture, sources (array of {title, uri}).`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return fetchLiveIntel(lead, "BENCHMARK");
};

export const generateOutreachSequence = async (lead: Lead) => {
    const prompt = `Generate 5-day sequence for ${lead.businessName}. Return JSON: { "emailSequence": [{ "day": 1, "channel": "Email", "purpose": "Intro", "subject": "...", "body": "..." }] }`;
    const res = JSON.parse(await executeIntelligenceTask(prompt));
    return res.emailSequence || [];
};

export const architectFunnel = async (lead: Lead) => {
    const prompt = `Architect 4-stage funnel for ${lead.businessName}. Return JSON: { "funnel": [{ "stage": 1, "title": "", "description": "", "conversionGoal": "" }] }`;
    const res = JSON.parse(await executeIntelligenceTask(prompt));
    return res.funnel || [];
};

export const architectPitchDeck = async (lead: Lead) => {
    const prompt = `Design pitch deck for ${lead.businessName}. Return JSON: { "slides": [{ "title": "", "bullets": [""] }] }`;
    return JSON.parse(await executeIntelligenceTask(prompt));
};

export const extractBrandDNA = async (lead: Partial<Lead>, url: string): Promise<BrandIdentity> => {
    const prompt = `Extract Brand DNA from ${url}. Return JSON: { "colors": ["#hex"], "fontPairing": "Font1 / Font2", "archetype": "", "visualTone": "", "extractedImages": ["url_placeholders"] }`;
    return JSON.parse(await executeIntelligenceTask(prompt));
};

export const generateTaskMatrix = async (lead: Lead) => {
    const prompt = `Project checklist for ${lead.businessName}. Return JSON: { "tasks": [{ "id": "1", "task": "", "status": "pending" }] }`;
    const res = JSON.parse(await executeIntelligenceTask(prompt));
    return res.tasks || [];
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
    const prompt = `AI Concierge dialogue for ${lead.businessName} regarding ${scenario}. Return JSON: { "dialogue": [{ "role": "user", "text": "" }, { "role": "assistant", "text": "" }] }`;
    const res = JSON.parse(await executeIntelligenceTask(prompt));
    return res.dialogue || [];
};

export const generateFlashSparks = async (lead: Lead) => {
    const prompt = `10 creative social hooks for ${lead.businessName}. Return JSON: { "sparks": ["Hook 1", "Hook 2"] }`;
    const res = JSON.parse(await executeIntelligenceTask(prompt));
    return res.sparks || [];
};

export const generatePlaybookStrategy = async (niche: string) => {
    const prompt = `Strategic playbook for ${niche} agency. Return JSON: { "strategyName": "", "steps": [{ "title": "", "tactic": "" }] }`;
    return JSON.parse(await executeIntelligenceTask(prompt));
};

export const analyzeLedger = async (leads: Lead[]) => {
    const prompt = `Analyze these ${leads.length} leads: ${JSON.stringify(leads.map(l => l.businessName))}. 
    Return JSON: { "risk": "summary of market risk", "opportunity": "summary of market opportunity" }`;
    return JSON.parse(await executeIntelligenceTask(prompt));
};

export const synthesizeProduct = async (lead: Lead) => {
    const prompt = `Synthesize high-ticket offer for ${lead.businessName}. 
    Return JSON: { "productName": "", "tagline": "", "pricePoint": "", "features": [""] }`;
    return JSON.parse(await executeIntelligenceTask(prompt));
};

// Fix: Using process.env.API_KEY and correct text access
export const performFactCheck = async (lead: Lead, claim: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: `Fact check claim for ${lead.businessName}: "${claim}". Return JSON: { "status": "Verified|Disputed", "evidence": "", "sources": [{ "title": "", "uri": "" }] }`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    return JSON.parse(extractJson(res.text || "{}"));
};

// Fix: Using process.env.API_KEY
export const groundedLeadSearch = async (region: string, signal: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: `Find 5 real businesses in ${region} matching: "${signal}". 
        Return JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "niche": "", "city": "${region}", "socialGap": "" }] }`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const data = JSON.parse(extractJson(res.text || '{"leads":[]}'));
    const sources = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { leads: data.leads || [], sources };
};

// Fix: Using process.env.API_KEY
export const queryRealtimeAgent = async (prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    return { text: res.text || "", sources: res.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

// --- REMAINING STUBS ---
export const generateVideoPayload = async (p: string, id?: string, img?: string, frame?: string, cfg?: any) => { return "task-id-123"; };
export const generateAudioPitch = async (t: string, v: string, id?: string) => { return ""; };
export const generateVisual = async (p: string, l: Lead, img?: string) => { return ""; };
export const generateMockup = async (n: string, ni: string, id?: string) => { return ""; };
export const generatePitch = (l: Lead) => executeIntelligenceTask(`Pitch for ${l.businessName}.`);
export const generateProposalDraft = (l: Lead) => executeIntelligenceTask(`Proposal for ${l.businessName}.`);
export const generateROIReport = (ltv: number, l: number, c: number) => executeIntelligenceTask(`ROI for LTV ${ltv}.`);
export const generateSonicPrompt = (l: Lead) => executeIntelligenceTask(`Sonic prompt for ${l.businessName}.`);
export const generateLyrics = (l: Lead, p: string, t: string) => executeIntelligenceTask(`Lyrics for ${l.businessName}.`);
export const enhanceVideoPrompt = (p: string) => executeIntelligenceTask(`Enhance: ${p}`);
export const enhanceStrategicPrompt = (p: string) => executeIntelligenceTask(`Enhance: ${p}`);
export const fetchViralPulseData = async (n: string) => [{ label: "AI Automation", val: 80, type: 'up' }];
export const identifySubRegions = async (t: string) => ["Downtown", "Sectors"];
export const crawlTheaterSignals = async (s: string, sig: string) => [];
export const analyzeVideoUrl = (u: string, p: string, id?: string) => executeIntelligenceTask(`Analyze video ${u}.`);
export const synthesizeArticle = (s: string, m: string) => executeIntelligenceTask(`Synthesize: ${s}`);
export const testModelPerformance = (m: string, p: string) => executeIntelligenceTask(`Test: ${p}`);
export const simulateSandbox = (l: Lead, ltv: number, v: number) => executeIntelligenceTask(`Sandbox: ${l.businessName}.`);
export const critiqueVideoPresence = (l: Lead) => executeIntelligenceTask(`Audit video for ${l.businessName}.`);
export const translateTactical = (t: string, lang: string) => executeIntelligenceTask(`Translate to ${lang}: ${t}`);
export const fetchTokenStats = async () => ({ recentOps: [] });
// Fix: Implemented analyzeVisual for audit tasks using Gemini Pro Vision capabilities
export const analyzeVisual = async (base64: string, mimeType: string, prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';
    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { inlineData: { data: base64, mimeType } },
                { text: prompt }
            ]
        }
    });
    return response.text || "";
};
export const generateMotionLabConcept = async (l: Lead) => ({ title: "Intro", hook: "Hook", scenes: [] });
export const generateAffiliateProgram = async (n: string) => ({ programName: "Partners", tiers: [], recruitScript: "" });
export const generateAgencyIdentity = async (n: string, r: string) => ({ name: n, tagline: "", manifesto: "", colors: [] });
export const loggedGenerateContent = (args: any) => executeIntelligenceTask(args.contents, args.config?.systemInstruction);
export const importVault = (assets: AssetRecord[]) => { SESSION_ASSETS.length = 0; SESSION_ASSETS.push(...assets); assetListeners.forEach(l => l([...SESSION_ASSETS])); return assets.length; };
export const clearVault = () => { SESSION_ASSETS.length = 0; assetListeners.forEach(l => l([...SESSION_ASSETS])); };
