
import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';
import { toast } from './toastManager';
import { GoogleGenAI, Type, Modality } from "@google/genai";

// --- INFRASTRUCTURE CONFIGURATION ---
const PRIMARY_MODEL = "gemini-3-flash-preview"; 
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

// --- SECURED KEY PERSISTENCE (RAILWAY ENV PRIORITY) ---
const sanitizeKey = (k: any): string => {
  if (!k || k === 'undefined' || k === 'null' || k === '') return '';
  return String(k).replace(/['"]/g, '').trim();
};

export const getStoredKeys = () => {
    const sysGeneric = sanitizeKey(process.env.API_KEY);
    const sysOr = sanitizeKey(process.env.OPENROUTER_API_KEY);
    
    const localOr = sanitizeKey(localStorage.getItem('pomelli_auth_override'));
    const localKie = sanitizeKey(localStorage.getItem('kie_api_key_override'));

    // OpenRouter Key priority: Explicit OR Env -> Generic API Env (if OR format) -> Local Override
    const effectiveOr = sysOr || (sysGeneric.startsWith('sk-or-') ? sysGeneric : '') || localOr;
    
    // Google Key priority: Generic API Env (if NOT OR format) -> empty
    const effectiveGoogle = (sysGeneric && !sysGeneric.startsWith('sk-or-')) ? sysGeneric : "";

    return { 
        openRouter: effectiveOr, 
        google: effectiveGoogle,
        kie: localKie || sanitizeKey(process.env.KIE_API_KEY)
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

// --- CORE REST INFERENCE BRIDGE (SDK PREFERRED) ---
export const openRouterChat = async (prompt: string, system?: string) => {
  const { openRouter, google } = getStoredKeys();

  // RULE: Always use the SDK if we have a Google key
  if (google) {
    const ai = new GoogleGenAI({ apiKey: google });
    try {
      const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: prompt,
        config: system ? { systemInstruction: system } : undefined,
      });
      const text = response.text || "{}";
      deductCost(PRIMARY_MODEL, text.length);
      return text;
    } catch (e: any) {
      pushLog(`SDK_FAULT: ${e.message}`);
      if (e.message?.includes('auth') || e.message?.includes('401')) throw new Error("AUTH_REQUIRED");
      throw e;
    }
  }

  // FALLBACK: OpenRouter (Manual Fetch)
  if (!openRouter) {
    toast.error("GATEWAY LOCKED: No Authorization Key found.");
    throw new Error("AUTH_REQUIRED");
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      credentials: 'omit', // CRITICAL: Omit cookies to prevent 401 'No cookie auth' conflicts
      headers: {
        "Authorization": `Bearer ${openRouter}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Prospector OS"
      },
      body: JSON.stringify({
        model: `google/${PRIMARY_MODEL}`,
        messages: [
          { role: "system", content: system || "You are Prospector OS Intelligence. Output JSON." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
        const errorMsg = data?.error?.message || "OpenRouter Error";
        if (response.status === 401) {
            pushLog(`AUTH_FAILURE: ${errorMsg}`);
            throw new Error("AUTH_REQUIRED");
        }
        throw new Error(errorMsg);
    }
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

// --- DOMAIN-SPECIFIC LOGIC ---

export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: Scanning ${region} for ${niche}...`);
  const prompt = `Identify ${count} high-ticket B2B targets in ${region} for ${niche}. Return JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "leadScore": 0, "assetGrade": "A", "socialGap": "", "phone": "", "email": "" }] }`;
  const jsonStr = await executeIntelligenceTask(prompt);
  return { leads: JSON.parse(jsonStr).leads || [], groundingSources: [] };
};

export const orchestrateBusinessPackage = async (lead: Lead, assets: any[]) => {
  pushLog(`FORGE: Architecting campaign for ${lead.businessName}...`);
  const prompt = `Architect a multi-layered campaign for ${lead.businessName}. Return STRICT JSON: "presentation" (slides array), "narrative", "outreach" (emailSequence), "funnel", "contentPack", "visualDirection".`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const prompt = `Perform an audit for ${lead.websiteUrl}. Return BenchmarkReport JSON.`;
  return JSON.parse(await executeIntelligenceTask(prompt));
};

export const generateOutreachSequence = async (lead: Lead) => {
    return JSON.parse(await executeIntelligenceTask(`Generate 5-day outreach sequence for ${lead.businessName}. JSON array.`));
};

export const architectFunnel = async (lead: Lead) => {
    return JSON.parse(await executeIntelligenceTask(`Architect 4-stage funnel for ${lead.businessName}. JSON.`));
};

export const architectPitchDeck = async (lead: Lead) => {
    return JSON.parse(await executeIntelligenceTask(`Design pitch deck for ${lead.businessName}. JSON slides.`));
};

export const generateVideoPayload = async (prompt: string, leadId?: string, startImage?: string, lastFrame?: string, config?: any) => {
    const payload = {
        prompt,
        image: startImage ? startImage.split(',')[1] : undefined,
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

export const generateAudioPitch = async (text: string, voiceName: string = 'Kore', leadId?: string) => {
    const { google } = getStoredKeys();
    if (!google) return "";
    const ai = new GoogleGenAI({ apiKey: google });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const url = `data:audio/pcm;base64,${base64Audio}`;
            saveAsset('AUDIO', `Speech: ${text.slice(0, 20)}`, url, 'SONIC_STUDIO', leadId);
            return url;
        }
    } catch (e: any) {
        pushLog(`TTS_ERROR: ${e.message}`);
    }
    return "";
};

export const generateVisual = async (prompt: string, lead: Lead, base64Image?: string) => {
    const { google } = getStoredKeys();
    if (!google) return "";
    const ai = new GoogleGenAI({ apiKey: google });
    try {
        const contents: any = { parts: [{ text: prompt }] };
        if (base64Image) {
            contents.parts.push({ inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } });
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents,
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64: string = part.inlineData.data;
                const url = `data:image/png;base64,${base64}`;
                saveAsset('IMAGE', prompt.slice(0, 20), url, 'VISUAL_STUDIO', lead.id);
                return url;
            }
        }
    } catch (e: any) {
        pushLog(`IMAGE_ERROR: ${e.message}`);
    }
    return "";
};

export const fetchBenchmarkData = (lead: Lead) => fetchLiveIntel(lead, 'BENCHMARK');
export const generateProposalDraft = (lead: Lead) => openRouterChat(`Draft proposal for ${lead.businessName}.`);
export const generateTaskMatrix = async (lead: Lead) => JSON.parse(await executeIntelligenceTask(`Checklist for ${lead.businessName}. JSON.`));
export const generateNurtureDialogue = async (lead: Lead, sc: string) => JSON.parse(await executeIntelligenceTask(`Dialogue for ${lead.businessName} (${sc}). JSON.`));
export const generateROIReport = (ltv: number, l: number, c: number) => openRouterChat(`ROI Report: LTV ${ltv}, Leads ${l}, Conv ${c}.`);
export const generateFlashSparks = async (lead: Lead) => JSON.parse(await executeIntelligenceTask(`10 hooks for ${lead.businessName}. JSON.`));
export const generateMockup = async (n: string, ni: string, id?: string) => generateVisual(`Mockup for ${n}`, { id } as Lead);
export const generatePitch = (lead: Lead) => openRouterChat(`Pitch for ${lead.businessName}.`);
export const generateSonicPrompt = (lead: Lead) => openRouterChat(`Sonic prompt for ${lead.businessName}.`);
export const generateLyrics = (lead: Lead, t: string, ty: string) => openRouterChat(`Lyrics for ${lead.businessName}.`);
export const enhanceVideoPrompt = (p: string) => openRouterChat(`Enhance video: ${p}`);
export const enhanceStrategicPrompt = (p: string) => openRouterChat(`Optimize strategy: ${p}`);
export const fetchViralPulseData = async (n: string) => JSON.parse(await executeIntelligenceTask(`Trends for ${n}. JSON.`));
export const identifySubRegions = async (t: string): Promise<string[]> => JSON.parse(await executeIntelligenceTask(`Sectors in ${t}. JSON.`));
export const crawlTheaterSignals = async (s: string, sig: string): Promise<Lead[]> => JSON.parse(await executeIntelligenceTask(`Leads in ${s}: ${sig}. JSON.`));
export const analyzeLedger = async (ls: Lead[]) => JSON.parse(await executeIntelligenceTask(`Analysis of ${ls.length} leads. JSON.`));
export const analyzeVideoUrl = (u: string, p: string, id?: string) => openRouterChat(`Audit video ${u}: ${p}`);
export const synthesizeArticle = (s: string, m: string) => openRouterChat(`Analyze source: ${s}`);
export const testModelPerformance = (m: string, p: string) => openRouterChat(`Benchmark: ${p}`);
export const generateMotionLabConcept = async (l: Lead) => JSON.parse(await executeIntelligenceTask(`Storyboard for ${l.businessName}. JSON.`));
export const generateAffiliateProgram = async (n: string) => JSON.parse(await executeIntelligenceTask(`Affiliate program for ${n}. JSON.`));
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
export const queryRealtimeAgent = async (prompt: string) => {
    const { google } = getStoredKeys();
    if (!google) return { text: "Grounded search requires Google API Key.", sources: [] };
    const ai = new GoogleGenAI({ apiKey: google });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return { text: response.text || "", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
    } catch (e: any) {
        pushLog(`SEARCH_ERROR: ${e.message}`);
        return { text: "Search failed.", sources: [] };
    }
};
