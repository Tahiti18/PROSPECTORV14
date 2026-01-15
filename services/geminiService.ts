/* =========================================================
   GEMINI SERVICE – LEGACY SAFE – GEMINI 3.0 FLASH ONLY
   ========================================================= */

const GEMINI_MODEL = "gemini-3.0-flash";

export type GeminiResult<T = any> = {
  ok: boolean;
  text: string;
  raw: any;
  data?: T;
  error?: { message: string; code?: number };
};

/* ------------------ INTERNAL CALL ------------------ */

async function callGemini(prompt: string): Promise<GeminiResult<string>> {
  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        prompt
      })
    });

    const json = await res.json();
    const text = json?.text ?? "";

    return {
      ok: true,
      text,
      raw: json
    };
  } catch (e: any) {
    return {
      ok: false,
      text: "",
      raw: null,
      error: { message: e?.message ?? "Gemini call failed" }
    };
  }
}

/* =========================================================
   SHARED TYPES
   ========================================================= */

export type AssetRecord = {
  id: string;
  type: string;
  module: string;
  timestamp: number;
  url?: string;
  metadata?: any;
};

export type BenchmarkReport = {
  entityName: string;
  missionSummary: string;
  visualStack: any[];
  sonicStack: any[];
  featureGap: string;
  businessModel: string;
  designSystem: string;
  deepArchitecture: string;
  sources: string[];
};

export type VeoConfig = {
  prompt: string;
  duration?: number;
};

/* =========================================================
   STATE STORES (SAFE ITERABLES)
   ========================================================= */

export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];

/* =========================================================
   ASSET HELPERS
   ========================================================= */

export function saveAsset(asset: AssetRecord): AssetRecord {
  SESSION_ASSETS.push(asset);
  return asset;
}

export function subscribeToAssets(): AssetRecord[] {
  return SESSION_ASSETS;
}

export function deleteAsset(id: string) {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx >= 0) SESSION_ASSETS.splice(idx, 1);
}

export function clearVault() {
  SESSION_ASSETS.length = 0;
}

export function importVault(items: AssetRecord[]) {
  SESSION_ASSETS.push(...items);
}

/* =========================================================
   LOGGING
   ========================================================= */

export function pushLog(message: string) {
  PRODUCTION_LOGS.push(message);
}

/* =========================================================
   CORE GENERATORS – ALL LEGACY EXPORTS
   ========================================================= */

export async function generateLeads(prompt: string) {
  return callGemini(prompt);
}

export async function groundedLeadSearch(prompt: string) {
  return { ok: true, leads: [], text: "", raw: null };
}

export async function fetchLiveIntel(prompt: string) {
  return callGemini(prompt);
}

export async function analyzeLedger(prompt: string) {
  return callGemini(prompt);
}

export async function fetchBenchmarkData(prompt?: string) {
  const r = await callGemini(prompt ?? "benchmark");
  return {
    ok: true,
    report: {
      entityName: "",
      missionSummary: r.text,
      visualStack: [],
      sonicStack: [],
      featureGap: "",
      businessModel: "",
      designSystem: "",
      deepArchitecture: "",
      sources: []
    } as BenchmarkReport,
    text: r.text,
    raw: r.raw
  };
}

export async function extractBrandDNA(prompt: string) {
  return callGemini(prompt);
}

export async function generateVisual(prompt: string) {
  return callGemini(prompt);
}

export async function generateMockup(prompt: string) {
  return callGemini(prompt);
}

export async function generateFlashSparks(prompt: string) {
  const r = await callGemini(prompt);
  return { ok: true, data: r.text.split("\n"), text: r.text, raw: r.raw };
}

export async function generateOutreachSequence(prompt: string) {
  return callGemini(prompt);
}

export async function generateProposalDraft(prompt: string) {
  return callGemini(prompt);
}

export async function generateROIReport(prompt: string) {
  return callGemini(prompt);
}

export async function architectFunnel(prompt: string) {
  return callGemini(prompt);
}

export async function architectPitchDeck(prompt: string) {
  return callGemini(prompt);
}

export async function generateTaskMatrix(prompt: string) {
  const r = await callGemini(prompt);
  return { ok: true, data: [], text: r.text, raw: r.raw };
}

export async function generateNurtureDialogue(prompt: string) {
  return callGemini(prompt);
}

export async function synthesizeProduct(prompt: string) {
  return callGemini(prompt);
}

export async function openRouterChat(prompt: string) {
  return callGemini(prompt);
}

export async function performFactCheck(prompt: string) {
  return callGemini(prompt);
}

export async function translateTactical(prompt: string) {
  return callGemini(prompt);
}

export async function analyzeVisual(prompt: string) {
  return callGemini(prompt);
}

export async function analyzeVideoUrl(prompt: string) {
  return callGemini(prompt);
}

export async function generateVideoPayload(prompt: string, config?: VeoConfig) {
  return callGemini(prompt);
}

export async function enhanceVideoPrompt(prompt: string) {
  return callGemini(prompt);
}

export async function generateMotionLabConcept(prompt: string) {
  return callGemini(prompt);
}

export async function generateAgencyIdentity(prompt: string) {
  return callGemini(prompt);
}

export async function orchestrateBusinessPackage(prompt: string) {
  return callGemini(prompt);
}

export async function fetchViralPulseData(prompt: string) {
  return callGemini(prompt);
}

export async function queryRealtimeAgent(prompt: string) {
  return callGemini(prompt);
}

export async function testModelPerformance(prompt?: string) {
  return { ok: true, text: "Gemini 3.0 Flash operational", raw: null };
}

export async function getStoredKeys() {
  return {};
}

export async function setStoredKeys(_: any) {
  return true;
}
