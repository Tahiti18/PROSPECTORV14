/* eslint-disable @typescript-eslint/no-explicit-any */

export const OPENROUTER_PROXY_PATH = '/api/openrouter/chat';

// Default model target. You can override per-call by passing `model`.
export const PRIMARY_MODEL = 'google/gemini-2.0-flash-exp:free';

// System instruction used when building messages[].
export const SYSTEM_INSTRUCTION =
  'You are Prospector OS. Be concise, structured, and produce production-grade outputs.';

// Session-scoped assets + logs (in-memory). The UI reads these in various workspaces.
export const SESSION_ASSETS: Record<string, any[]> = {};
export const PRODUCTION_LOGS: Array<{ ts: number; level: 'info' | 'warn' | 'error'; msg: string; meta?: any }> = [];

export const pushLog = (level: 'info' | 'warn' | 'error', msg: string, meta?: any) => {
  PRODUCTION_LOGS.push({ ts: Date.now(), level, msg, meta });
  // Keep logs from growing forever
  if (PRODUCTION_LOGS.length > 1500) PRODUCTION_LOGS.splice(0, PRODUCTION_LOGS.length - 1500);
};

// ===============================
// Keys (client-side storage)
// ===============================

const LS_OPENROUTER_KEY = 'prospector_openrouter_api_key';
const LS_KIE_KEY = 'prospector_kie_api_key';

export const setStoredKeys = (keys: { openRouterApiKey?: string; kieApiKey?: string }) => {
  if (typeof window === 'undefined') return;
  if (keys.openRouterApiKey != null) localStorage.setItem(LS_OPENROUTER_KEY, keys.openRouterApiKey);
  if (keys.kieApiKey != null) localStorage.setItem(LS_KIE_KEY, keys.kieApiKey);
};

export const getStoredKeys = () => {
  if (typeof window === 'undefined') return { openRouterApiKey: '', kieApiKey: '' };
  return {
    openRouterApiKey: localStorage.getItem(LS_OPENROUTER_KEY) || '',
    kieApiKey: localStorage.getItem(LS_KIE_KEY) || '',
  };
};

// ===============================
// Asset Vault (minimal client impl)
// ===============================

export type AssetRecord = {
  id: string;
  kind: 'image' | 'video' | 'audio' | 'text' | 'json' | 'file';
  name: string;
  createdAt: number;
  leadId?: string;
  url?: string;
  data?: any;
  meta?: any;
};

type AssetSubscriber = (assets: AssetRecord[]) => void;

const ASSET_KEY = 'prospector_asset_vault_v1';
let assetSubscribers: AssetSubscriber[] = [];

const readAssets = (): AssetRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ASSET_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AssetRecord[];
  } catch {
    return [];
  }
};

const writeAssets = (assets: AssetRecord[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ASSET_KEY, JSON.stringify(assets));
  assetSubscribers.forEach((fn) => fn(assets));
};

export const subscribeToAssets = (fn: AssetSubscriber) => {
  assetSubscribers.push(fn);
  fn(readAssets());
  return () => {
    assetSubscribers = assetSubscribers.filter((x) => x !== fn);
  };
};

export const saveAsset = (asset: AssetRecord) => {
  const assets = readAssets();
  const next = [asset, ...assets];
  writeAssets(next);
  return asset;
};

export const deleteAsset = (id: string) => {
  const assets = readAssets().filter((a) => a.id !== id);
  writeAssets(assets);
};

export const clearVault = () => {
  writeAssets([]);
};

export const importVault = (records: AssetRecord[]) => {
  const assets = readAssets();
  writeAssets([...records, ...assets]);
};

export const clearVaultLegacyAlias = () => clearVault(); // compatibility if referenced elsewhere
export const clearVaultAlias = () => clearVault(); // compatibility

export const clearVaultAndSession = () => {
  clearVault();
  Object.keys(SESSION_ASSETS).forEach((k) => delete SESSION_ASSETS[k]);
};

// Backward-compat name used in some workspaces
export const clearVault_legacy = () => clearVault();

// ===============================
// Core OpenRouter Chat
// ===============================

type ChatRole = 'system' | 'user' | 'assistant';

export type OpenRouterMessage = {
  role: ChatRole;
  content: string;
};

export type OpenRouterChatResponse = {
  ok: boolean;
  text: string;
  raw?: any;
  error?: { message: string; code?: number };
};

const ensureNonEmpty = (s: any) => (typeof s === 'string' ? s.trim() : '');

const normalizeMessages = (input: any): OpenRouterMessage[] => {
  // Accept legacy shapes: prompt, input, text, messages, systemInstruction, system, etc.
  const system =
    ensureNonEmpty(input?.systemInstruction) ||
    ensureNonEmpty(input?.system) ||
    ensureNonEmpty(input?.system_prompt) ||
    '';

  if (Array.isArray(input?.messages) && input.messages.length) {
    const msgs = input.messages
      .map((m: any) => ({
        role: (m?.role as ChatRole) || 'user',
        content: ensureNonEmpty(m?.content),
      }))
      .filter((m: any) => m.content);
    if (system) msgs.unshift({ role: 'system', content: system });
    return msgs;
  }

  const prompt =
    ensureNonEmpty(input?.prompt) ||
    ensureNonEmpty(input?.input) ||
    ensureNonEmpty(input?.text) ||
    ensureNonEmpty(input?.content) ||
    '';

  const msgs: OpenRouterMessage[] = [];
  if (system) msgs.push({ role: 'system', content: system });
  if (prompt) msgs.push({ role: 'user', content: prompt });
  return msgs;
};

export const openRouterChat = async (payload: {
  model?: string;
  messages?: OpenRouterMessage[];
  prompt?: string;
  input?: string;
  text?: string;
  systemInstruction?: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  json?: boolean;
}): Promise<OpenRouterChatResponse> => {
  const model = payload.model || PRIMARY_MODEL;

  const msgs =
    Array.isArray(payload.messages) && payload.messages.length
      ? payload.messages
      : normalizeMessages(payload);

  // Guard: never send empty messages (causes OpenRouter 400 Missing prompt)
  if (!msgs.length || !msgs.some((m) => ensureNonEmpty(m.content))) {
    return {
      ok: false,
      text: '',
      error: { message: 'Client payload missing prompt/messages', code: 400 },
      raw: {
        proxyVersion: 'openrouter-normalize-v3-2026-01-13',
        receivedKeys: Object.keys(payload || {}),
        receivedHasMessages: Array.isArray((payload as any)?.messages),
        receivedPromptType: typeof (payload as any)?.prompt,
      },
    };
  }

  const body = {
    model,
    messages: msgs,
    temperature: payload.temperature ?? 0.4,
    top_p: payload.top_p ?? 0.95,
    max_tokens: payload.max_tokens ?? 1600,
  };

  try {
    const res = await fetch(OPENROUTER_PROXY_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const raw = await res.json().catch(() => ({}));
    if (!res.ok || raw?.ok === false) {
      const msg = raw?.error?.message || raw?.message || `Request failed (${res.status})`;
      const code = raw?.error?.code || res.status;
      pushLog('error', 'OpenRouter error', { msg, code, raw });
      return { ok: false, text: '', raw, error: { message: msg, code } };
    }

    // Expected proxy shape: { ok:true, output?:string } OR OpenAI-like { choices:[{message:{content}}] }
    const text =
      ensureNonEmpty(raw?.output) ||
      ensureNonEmpty(raw?.completion) ||
      ensureNonEmpty(raw?.text) ||
      ensureNonEmpty(raw?.choices?.[0]?.message?.content) ||
      ensureNonEmpty(raw?.choices?.[0]?.text) ||
      JSON.stringify(raw);

    return { ok: true, text, raw };
  } catch (e: any) {
    pushLog('error', 'Network/Fetch error', { e: String(e?.message || e) });
    return { ok: false, text: '', error: { message: String(e?.message || e), code: 0 } };
  }
};

// Convenience wrapper used by several modules
export const loggedGenerateContent = async (
  label: string,
  prompt: string,
  opts?: { model?: string; system?: string; json?: boolean }
) => {
  pushLog('info', `AI: ${label} -> start`);
  const resp = await openRouterChat({
    model: opts?.model,
    system: opts?.system || SYSTEM_INSTRUCTION,
    prompt,
  });
  if (!resp.ok) {
    pushLog('error', `AI: ${label} -> failed`, resp.error);
    return resp;
  }
  pushLog('info', `AI: ${label} -> ok`);
  return resp;
};

// ===============================
// Domain helpers used across UI
// ===============================

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const asJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const storeSessionAsset = (bucket: string, record: any) => {
  if (!SESSION_ASSETS[bucket]) SESSION_ASSETS[bucket] = [];
  SESSION_ASSETS[bucket].unshift(record);
  if (SESSION_ASSETS[bucket].length > 200) SESSION_ASSETS[bucket].splice(200);
};

// ===============================
// High-level exports expected by the app
// ===============================

export const generateLeads = async (market: string) => {
  const prompt = `Generate 8 high-intent B2B leads for the market: ${market}.
Return STRICT JSON:
{
  "leads":[
    {"businessName":"","domain":"","category":"","city":"","notes":"","score":0}
  ]
}`;
  const resp = await loggedGenerateContent('generateLeads', prompt, { json: true });
  if (!resp.ok) return resp;

  const parsed = asJson(resp.text);
  const leads = parsed?.leads || [];
  return { ...resp, raw: { ...resp.raw, leads }, leads } as any;
};

export const generateOutreachSequence = async (lead: any, tone = 'premium') => {
  const prompt = `Create a 5-step outreach sequence for this lead. Tone: ${tone}.
Lead JSON: ${JSON.stringify(lead)}
Return JSON: {"steps":[{"channel":"email|linkedin|call","subject":"","body":"","day":1}]}`;
  return loggedGenerateContent('generateOutreachSequence', prompt, { json: true });
};

export const generateProposalDraft = async (lead: any) => {
  const prompt = `Draft a concise proposal for this lead. Return markdown-free plain text with headings.
Lead JSON: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateProposalDraft', prompt);
};

export const generateNurtureDialogue = async (lead: any) => {
  const prompt = `Create a 10-turn nurture dialogue script for this lead. Return JSON:
{"turns":[{"role":"you","text":""},{"role":"lead","text":""}]}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateNurtureDialogue', prompt, { json: true });
};

export const generateAffiliateProgram = async () => {
  const prompt = `Design a simple affiliate program for a SaaS product. Return JSON:
{"tiers":[{"name":"","commissionPct":0,"payoutRules":""}],"terms":""}`;
  return loggedGenerateContent('generateAffiliateProgram', prompt, { json: true });
};

export const analyzeLedger = async (ledger: any) => {
  const prompt = `Analyze this revenue ledger and provide insights + anomalies. Return JSON:
{"summary":"","insights":[""],"anomalies":[""],"nextActions":[""]}.
Ledger: ${JSON.stringify(ledger)}`;
  return loggedGenerateContent('analyzeLedger', prompt, { json: true });
};

export const crawlTheaterSignals = async (theater: string) => {
  const prompt = `For theater/market: ${theater}, list 12 buyer signals and 12 competitor signals. Return JSON:
{"buyerSignals":[""],"competitorSignals":[""]}`;
  return loggedGenerateContent('crawlTheaterSignals', prompt, { json: true });
};

export const identifySubRegions = async (theater: string) => {
  const prompt = `Given region: ${theater}, propose 10 sub-regions for prospecting. Return JSON:
{"subRegions":[""]}`;
  return loggedGenerateContent('identifySubRegions', prompt, { json: true });
};

export const fetchBenchmarkData = async () => {
  const prompt = `Return a small benchmark report (mock) as JSON:
{"items":[{"name":"","score":0,"notes":""}]}`;
  return loggedGenerateContent('fetchBenchmarkData', prompt, { json: true });
};

export type BenchmarkReport = { items: Array<{ name: string; score: number; notes: string }> };

export const extractBrandDNA = async (brand: any) => {
  const prompt = `Extract Brand DNA from this input. Return JSON:
{"voice":"","values":[""],"positioning":"","personas":[""],"messagingPillars":[""]}.
Input: ${JSON.stringify(brand)}`;
  return loggedGenerateContent('extractBrandDNA', prompt, { json: true });
};

export const generateVisual = async (promptText: string) => {
  // This app often routes visuals via KIE; here we just store an instruction asset.
  const rec: AssetRecord = {
    id: uid(),
    kind: 'image',
    name: 'Generated Visual (instruction)',
    createdAt: Date.now(),
    data: { prompt: promptText },
  };
  saveAsset(rec);
  storeSessionAsset('visuals', rec);
  return { ok: true, text: JSON.stringify(rec), raw: rec };
};

export const generateVideoPayload = async (promptText: string) => {
  const rec: AssetRecord = {
    id: uid(),
    kind: 'video',
    name: 'Generated Video Payload (instruction)',
    createdAt: Date.now(),
    data: { prompt: promptText },
  };
  saveAsset(rec);
  storeSessionAsset('videos', rec);
  return { ok: true, text: JSON.stringify(rec), raw: rec };
};

export type VeoConfig = { prompt: string; durationSec?: number; aspect?: string; seed?: number };

export const generateMockup = async (lead: any) => {
  const prompt = `Generate a mockup brief for this lead. Return JSON:
{"hero":"", "sections":[{"title":"","copy":""}], "cta":""}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateMockup', prompt, { json: true });
};

export const generatePitch = async (lead: any) => {
  const prompt = `Create an elevator pitch for this lead. Return JSON:
{"pitch":"","bullets":[""],"cta":""}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generatePitch', prompt, { json: true });
};

export const architectFunnel = async (lead: any) => {
  const prompt = `Design a funnel for this lead. Return JSON:
{"stages":[{"name":"","goal":"","assets":[""]}]}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('architectFunnel', prompt, { json: true });
};

export const generateROIReport = async (lead: any) => {
  const prompt = `Estimate ROI for outreach to this lead. Return JSON:
{"assumptions":[""],"roiRange":{"low":0,"high":0},"notes":""}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateROIReport', prompt, { json: true });
};

export const orchestrateBusinessPackage = async (lead: any) => {
  const prompt = `Create a business package plan (strategy, messaging, assets) for this lead. Return JSON:
{"strategy":"","messagingPillars":[""],"deliverables":[""],"timeline":[""]}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('orchestrateBusinessPackage', prompt, { json: true });
};

export const architectPitchDeck = async (lead: any) => {
  const prompt = `Outline a 10-slide pitch deck for this lead. Return JSON:
{"slides":[{"title":"","bullets":[""]}]}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('architectPitchDeck', prompt, { json: true });
};

export const generateTaskMatrix = async (lead: any) => {
  const prompt = `Create a task matrix for this lead. Return JSON:
{"tasks":[{"area":"","task":"","owner":"","etaDays":0}]}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateTaskMatrix', prompt, { json: true });
};

export const generateNurtureDialogueLegacy = async (lead: any) => generateNurtureDialogue(lead);

export const generateAudioPitch = async (lead: any) => {
  const rec: AssetRecord = {
    id: uid(),
    kind: 'audio',
    name: 'Audio Pitch (instruction)',
    createdAt: Date.now(),
    data: { lead },
  };
  saveAsset(rec);
  storeSessionAsset('audio', rec);
  return { ok: true, text: JSON.stringify(rec), raw: rec };
};

export const generateAgencyIdentity = async (lead: any) => {
  const prompt = `Generate an agency identity kit for the lead. Return JSON:
{"tagline":"","oneLiner":"","palette":[""],"typefaces":[""],"tone":""}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateAgencyIdentity', prompt, { json: true });
};

export const testModelPerformance = async () => {
  const prompt = `Return JSON with a quick synthetic benchmark:
{"latencyMs":0,"qualityScore":0,"notes":""}`;
  return loggedGenerateContent('testModelPerformance', prompt, { json: true });
};

export const generateMotionLabConcept = async (lead: any) => {
  const prompt = `Generate 5 motion/animation concepts for this lead. Return JSON:
{"concepts":[{"name":"","description":"","useCase":""}]}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateMotionLabConcept', prompt, { json: true });
};

export const generateFlashSparks = async (lead: any) => {
  const prompt = `Generate 12 fast content sparks for this lead. Return JSON:
{"sparks":[{"hook":"","angle":"","format":""}]}
Lead: ${JSON.stringify(lead)}`;
  return loggedGenerateContent('generateFlashSparks', prompt, { json: true });
};

export const simulateSandbox = async (promptText: string) => {
  const prompt = `Simulate a sandbox outcome. Return JSON:
{"result":"","steps":[""],"risks":[""]}.
Input: ${promptText}`;
  return loggedGenerateContent('simulateSandbox', prompt, { json: true });
};

export const critiqueVideoPresence = async (urlOrNotes: string) => {
  const prompt = `Critique video presence for: ${urlOrNotes}. Return JSON:
{"strengths":[""],"weaknesses":[""],"fixes":[""],"scriptSuggestion":""}`;
  return loggedGenerateContent('critiqueVideoPresence', prompt, { json: true });
};

export const translateTactical = async (text: string, to: string = 'en') => {
  const prompt = `Translate to ${to}. Return plain text only.\n\n${text}`;
  return loggedGenerateContent('translateTactical', prompt);
};

export const fetchViralPulseData = async (market: string) => {
  const prompt = `Give viral pulse insights for market ${market}. Return JSON:
{"trends":[""],"creators":[""],"angles":[""]}`;
  return loggedGenerateContent('fetchViralPulseData', prompt, { json: true });
};

export const queryRealtimeAgent = async (q: string) => {
  const prompt = `Answer as a realtime agent. Return JSON:
{"answer":"","sources":[""],"confidence":0}.
Question: ${q}`;
  return loggedGenerateContent('queryRealtimeAgent', prompt, { json: true });
};

export const fetchTokenStats = async () => {
  const prompt = `Return token usage stats as JSON: {"today":0,"week":0,"month":0}`;
  return loggedGenerateContent('fetchTokenStats', prompt, { json: true });
};

export const synthesizeArticle = async (topic: string) => {
  const prompt = `Write a short strategic article on: ${topic}. No markdown.`;
  return loggedGenerateContent('synthesizeArticle', prompt);
};

export const analyzeVideoUrl = async (url: string) => {
  const prompt = `Analyze this video URL conceptually (no browsing). Return JSON:
{"summary":"","shots":[""],"improvements":[""]}. URL: ${url}`;
  return loggedGenerateContent('analyzeVideoUrl', prompt, { json: true });
};

export const enhanceStrategicPrompt = async (promptText: string) => {
  const prompt = `Improve this prompt for strategic quality. Return plain text only.\n\n${promptText}`;
  return loggedGenerateContent('enhanceStrategicPrompt', prompt);
};

export const enhanceVideoPrompt = async (promptText: string) => {
  const prompt = `Improve this prompt for video generation. Return plain text only.\n\n${promptText}`;
  return loggedGenerateContent('enhanceVideoPrompt', prompt);
};

export const performFactCheck = async (claim: string) => {
  const prompt = `Fact-check this claim without browsing. Return JSON:
{"assessment":"likely|uncertain|unlikely","reasons":[""],"questionsToVerify":[""]}.
Claim: ${claim}`;
  return loggedGenerateContent('performFactCheck', prompt, { json: true });
};
