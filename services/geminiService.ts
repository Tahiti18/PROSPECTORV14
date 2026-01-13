
import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';
import { GoogleGenAI } from "@google/genai";

// --- CORE ENGINE CONFIGURATION ---
// Categorically hardcoded to Flash per instructions.
const PRIMARY_MODEL = "gemini-3-flash-preview"; 
const IMAGE_MODEL = "gemini-2.5-flash-image";

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

export type VeoConfig = {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
};

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

const extractJson = (text: string) => {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const startObj = cleaned.indexOf('{');
  const startArr = cleaned.indexOf('[');
  let start = -1, end = -1;
  if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
    start = startObj;
    end = cleaned.lastIndexOf('}');
  } else if (startArr !== -1) {
    start = startArr;
    end = cleaned.lastIndexOf(']');
  }
  if (start !== -1 && end !== -1 && end > start) return cleaned.substring(start, end + 1);
  return cleaned;
};

// --- CORE GENERATION ENGINE ---

export const executeIntelligenceTask = async (prompt: string, system?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
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
  return text;
};

// --- DOMAIN LOGIC (ALL USING PRIMARY_MODEL) ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  const prompt = `Find ${count} real businesses in ${region} specializing in ${niche}. Return JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "leadScore": 85, "assetGrade": "A", "socialGap": "Specific vulnerability", "city": "${region}", "niche": "${niche}", "phone": "", "email": "" }] }`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(extractJson(jsonStr));
};

export const generateVisual = async (prompt: string, lead: Lead, sourceImage?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  pushLog(`IMAGE_GEN: Forging visual for ${lead.businessName}...`);
  const contents: any[] = [{ text: prompt }];
  if (sourceImage && sourceImage.includes('base64,')) {
    contents.push({ inlineData: { data: sourceImage.split('base64,')[1], mimeType: 'image/png' } });
  }
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts: contents }
  });
  let imageUrl = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      saveAsset('IMAGE', `GEN: ${prompt.slice(0, 20)}`, imageUrl, 'VISUAL_STUDIO', lead.id);
      break;
    }
  }
  return imageUrl;
};

export const generateMockup = async (name: string, niche: string, leadId?: string) => {
  const prompt = `High-end photorealistic 4K commercial mockup for ${name}, a ${niche} business. Modern luxury aesthetic, professional lighting, depth of field.`;
  return generateVisual(prompt, { businessName: name, niche, id: leadId } as Lead);
};

export const generateProposalDraft = async (l: Lead) => {
  const prompt = `Architect a high-ticket AI transformation proposal for ${l.businessName}. 
  Format: Use the UI_BLOCKS schema with sections for "Executive Narrative", "Strategic Roadmap", and "Projected Revenue Lift". 
  Be persuasive, premium, and avoid technical jargon. Use a 'hero' block for the opening statement.`;
  return await executeIntelligenceTask(prompt, "You are a world-class high-ticket sales closer. Output beautiful UI_BLOCKS JSON.");
};

export const generatePitch = async (l: Lead) => {
  const prompt = `Create a 30-second high-impact elevator pitch for ${l.businessName}. Focus on their specific gap: ${l.socialGap}. Output only the raw text of the pitch, no JSON.`;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const res = await ai.models.generateContent({ model: PRIMARY_MODEL, contents: prompt });
  return res.text || "";
};

export const generateOutreachSequence = async (lead: Lead) => {
  const prompt = `Generate a 5-day outreach sequence for ${lead.businessName}. 
  Return JSON: { "emailSequence": [{ "day": 1, "channel": "Email", "purpose": "Intro", "body": "Persuasive email text" }] }`;
  const jsonStr = await executeIntelligenceTask(prompt);
  const data = JSON.parse(extractJson(jsonStr));
  return data.emailSequence || [];
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  const prompt = `Architect an exhaustive multi-layered campaign for ${lead.businessName}. 
  Context: ${lead.socialGap}.
  Return strictly JSON with these exact root keys: 
  "presentation": { "title": "Strategy Blueprint", "slides": [{ "title": "Slide Title", "bullets": ["Bullet 2"] }] }, 
  "narrative": "A professional 3-paragraph executive summary", 
  "outreach": { "emailSequence": [{ "subject": "Intro", "body": "Body text" }] }, 
  "funnel": [{ "title": "Stage Name", "description": "Details", "conversionGoal": "Action" }], 
  "contentPack": [{ "platform": "Instagram", "type": "Reel", "caption": "Caption text" }], 
  "visualDirection": { "brandMood": "Description", "aiImagePrompts": [{ "use_case": "Hero Image", "prompt": "Prompt text" }] }`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(extractJson(jsonStr));
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const prompt = `Deep audit for ${lead.businessName}. Return JSON with report keys.`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const architectFunnel = async (lead: Lead) => {
  const prompt = `Architect a 4-stage sales funnel for ${lead.businessName}. Return JSON: { "funnel": [{ "stage": 1, "title": "", "description": "", "conversionGoal": "" }] }`;
  const res = JSON.parse(await executeIntelligenceTask(prompt));
  return res.funnel || [];
};

export const architectPitchDeck = async (lead: Lead) => {
  const prompt = `Structure a 5-slide pitch deck for ${lead.businessName}. Return JSON: { "slides": [{ "title": "", "bullets": [""] }] }`;
  const res = JSON.parse(await executeIntelligenceTask(prompt));
  return res.slides || [];
};

export const synthesizeProduct = async (lead: Lead) => {
  const prompt = `Create high-ticket offer for ${lead.businessName}. Return JSON: { "productName": "", "tagline": "", "pricePoint": "", "features": [""] }`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const generateFlashSparks = async (lead: Lead) => {
  const prompt = `10 social hooks for ${lead.businessName}. Return JSON: { "sparks": [""] }`;
  const res = JSON.parse(await executeIntelligenceTask(prompt));
  return res.sparks || [];
};

export const generateTaskMatrix = async (lead: Lead) => {
  const prompt = `Checklist for ${lead.businessName}. Return JSON: { "tasks": [{ "id": "1", "task": "", "status": "pending" }] }`;
  const res = JSON.parse(await executeIntelligenceTask(prompt));
  return res.tasks || [];
};

export const extractBrandDNA = async (lead: Partial<Lead>, url: string): Promise<BrandIdentity> => {
  const prompt = `Extract Brand DNA from ${url}. Return JSON: { "colors": ["#hex"], "fontPairing": "", "archetype": "", "visualTone": "", "extractedImages": [] }`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const queryRealtimeAgent = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const res = await ai.models.generateContent({ model: PRIMARY_MODEL, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
  return { text: res.text || "", sources: res.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const openRouterChat = async (p: string, s?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const res = await ai.models.generateContent({ model: PRIMARY_MODEL, contents: p, config: { systemInstruction: s } });
  return res.text || "";
};

export const analyzeVisual = async (data: string, mime: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const res = await ai.models.generateContent({ model: PRIMARY_MODEL, contents: { parts: [{ inlineData: { data, mimeType: mime } }, { text: prompt }] } });
  return res.text || "";
};

export const groundedLeadSearch = async (r: string, s: string) => {
  const prompt = `Find businesses in ${r} matching: ${s}. Return JSON { "leads": [] }`;
  const res = await executeIntelligenceTask(prompt);
  return { leads: JSON.parse(extractJson(res)).leads || [], sources: [] };
};

export const performFactCheck = async (l: Lead, c: string) => {
  const prompt = `Fact check ${c} for ${l.businessName}. Return JSON { "status": "", "evidence": "", "sources": [] }`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const generateNurtureDialogue = async (l: Lead, s: string) => {
  const prompt = `Dialogue for ${l.businessName} about ${s}. Return JSON { "dialogue": [] }`;
  const res = JSON.parse(await executeIntelligenceTask(prompt));
  return res.dialogue || [];
};

export const generatePlaybookStrategy = async (niche: string) => {
  const prompt = `Architect a master methodology for an AI agency in ${niche}. Return JSON: { "strategyName": "...", "steps": [{ "title": "...", "tactic": "..." }] }`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(extractJson(jsonStr));
};

export const analyzeLedger = async (leads: Lead[]) => {
  const prompt = `Analyze lead database for risks/ops: ${JSON.stringify(leads.map(l => ({ name: l.businessName, score: l.leadScore })))}. Return JSON: { "risk": "...", "opportunity": "..." }`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(extractJson(jsonStr));
};

export const enhanceVideoPrompt = async (p: string) => {
  const prompt = `Enhance video prompt: ${p}. Output raw text.`;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const res = await ai.models.generateContent({ model: PRIMARY_MODEL, contents: prompt });
  return res.text || p;
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  const prompt = `Technical benchmark for ${lead.businessName}. Return JSON.`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return JSON.parse(extractJson(jsonStr));
};

export const generateVideoPayload = async (p: string, id?: string, img?: string, lastFrame?: string, config?: VeoConfig) => "task-123";
export const generateAudioPitch = async (t: string, v: string, id?: string) => "audio-url";
export const generateROIReport = async (l: number, v: number, c: number) => "ROI Report text";
export const generateSonicPrompt = async (l: Lead) => "music prompt";
export const generateLyrics = async (l: Lead, p: string, t: string) => "lyrics";
export const enhanceStrategicPrompt = async (p: string) => p;
export const fetchViralPulseData = async (n: string) => [];
export const identifySubRegions = async (t: string) => ["Region A"];
export const crawlTheaterSignals = async (s: string, sig: string) => [];
export const analyzeVideoUrl = async (u: string, p: string, id?: string) => "Video Analysis";
export const synthesizeArticle = async (s: string, m: string) => "Article summary";
export const testModelPerformance = async (m: string, p: string) => "Test result";
export const simulateSandbox = async (l: Lead, ltv: number, v: number) => "Simulation text";
export const critiqueVideoPresence = async (l: Lead) => "Audit text";
export const translateTactical = async (t: string, lang: string) => t;
export const fetchTokenStats = async () => ({ recentOps: [] });
export const generateMotionLabConcept = async (l: Lead) => ({ title: "", hook: "", scenes: [] });
export const generateAffiliateProgram = async (n: string) => ({ programName: "", tiers: [], recruitScript: "" });
export const generateAgencyIdentity = async (n: string, r: string) => ({ name: "", tagline: "", manifesto: "", colors: [] });
export const loggedGenerateContent = (args: any) => openRouterChat(args.contents, args.config?.systemInstruction);
export const importVault = (a: any) => 0;
export const clearVault = () => {};
export const deleteAsset = (id: string) => {};
export const getStoredKeys = () => ({ openRouter: "", google: "", kie: "" });
export const setStoredKeys = (or: string, kie: string, google?: string) => {};
