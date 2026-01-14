// services/geminiService.ts
// Central AI + local persistence layer.
// Design goal: keep runtime solid while staying permissive enough to not break builds
// when UI modules evolve (call signatures/types are intentionally broad).

/* eslint-disable @typescript-eslint/no-explicit-any */

const OPENROUTER_CHAT_PATH = '/api/openrouter/chat';

// -----------------------------
// Types (kept permissive on purpose)
// -----------------------------
export type AiError = { message: any; code?: number | string };
export type AiResult<T = any> = { ok: boolean; text: string; raw?: any; error?: AiError } & T;

export type Lead = any;

// Asset + logs are used across many workspaces; keep flexible.
export type AssetRecord = {
  id: string;
  url?: string;
  kind?: string;        // 'image' | 'video' | 'audio' | 'doc' | etc
  type?: string;        // legacy field used by some UI
  module?: string;
  name?: string;
  timestamp?: number;
  createdAt?: number;
  metadata?: any;
  data?: any;
};

export type ProductionLog = {
  id: string;
  ts: number;
  level: 'info' | 'warn' | 'error';
  module?: string;
  message: string;
  meta?: any;
};

export type VeoConfig = {
  // Keep wide so UI can pass config objects freely.
  prompt?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  durationSeconds?: number;
  fps?: number;
  seed?: number;
  guidanceScale?: number;
  style?: string;
  [k: string]: any;
};

export type BenchmarkReport = {
  entityName?: string;
  missionSummary?: string;
  visualStack?: any[];
  sonicStack?: any[];
  featureGap?: string;
  businessModel?: string;
  designSystem?: string;
  deepArchitecture?: string;
  sources?: any[];
  groundingSources?: any[];
  [k: string]: any;
};

// -----------------------------
// Local key management (SecurityGateway + VerificationNode)
// -----------------------------
const LS_KEYS = 'prospector.keys.v1';

export type StoredKeys = {
  openRouterKey?: string;
  openRouterModel?: string;
  geminiKey?: string;
  geminiModel?: string;
  kieKey?: string;
  [k: string]: any;
};

export const getStoredKeys = (): StoredKeys => {
  try {
    const raw = localStorage.getItem(LS_KEYS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const setStoredKeys = (keys: StoredKeys): void => {
  const merged: StoredKeys = { ...getStoredKeys(), ...(keys || {}) };
  localStorage.setItem(LS_KEYS, JSON.stringify(merged));
};

// -----------------------------
// Production logs (some UIs iterate directly)
// -----------------------------
const LS_LOGS = 'prospector.productionLogs.v1';

const readLogs = (): ProductionLog[] => {
  try {
    const raw = localStorage.getItem(LS_LOGS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const writeLogs = (logs: ProductionLog[]) => {
  localStorage.setItem(LS_LOGS, JSON.stringify(Array.isArray(logs) ? logs : []));
};

export const pushLog = (message: string, meta?: any, level: ProductionLog['level'] = 'info', module?: string) => {
  const logs = readLogs();
  logs.push({
    id: crypto?.randomUUID?.() || String(Date.now()),
    ts: Date.now(),
    level,
    module,
    message,
    meta,
  });
  // keep last 500
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  writeLogs(logs);
};

export const PRODUCTION_LOGS = {
  read: readLogs,
  write: writeLogs,
  clear: () => writeLogs([]),
  [Symbol.iterator]: function* () {
    yield* readLogs();
  },
};

// -----------------------------
// Asset vault (some UIs expect iterable store, some expect array ops)
// -----------------------------
const LS_ASSETS = 'prospector.assets.v2';

const readAssets = (): AssetRecord[] => {
  try {
    const raw = localStorage.getItem(LS_ASSETS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const writeAssets = (items: AssetRecord[]) => {
  localStorage.setItem(LS_ASSETS, JSON.stringify(Array.isArray(items) ? items : []));
};

type AssetListener = (assets: AssetRecord[]) => void;
const assetListeners = new Set<AssetListener>();

const emitAssets = () => {
  const assets = readAssets();
  for (const cb of assetListeners) {
    try { cb(assets); } catch { /* ignore */ }
  }
};

export const subscribeToAssets = (cb: AssetListener) => {
  assetListeners.add(cb);
  cb(readAssets());
  return () => assetListeners.delete(cb);
};

export const clearVault = () => {
  writeAssets([]);
  emitAssets();
};

export const deleteAsset = async (id: string) => {
  const assets = readAssets().filter(a => a?.id !== id);
  writeAssets(assets);
  emitAssets();
  return { ok: true, text: 'deleted', raw: { id } } as AiResult;
};

export const importVault = async (payload: any) => {
  const incoming = Array.isArray(payload) ? payload : payload?.assets;
  const assets = readAssets();
  if (Array.isArray(incoming)) {
    for (const a of incoming) {
      if (!a) continue;
      const rec: AssetRecord = {
        id: a.id || crypto?.randomUUID?.() || String(Date.now()),
        ...a,
        timestamp: a.timestamp || a.createdAt || Date.now(),
      };
      assets.push(rec);
    }
    writeAssets(assets);
    emitAssets();
  }
  return { ok: true, text: 'imported', raw: { count: Array.isArray(incoming) ? incoming.length : 0 } } as AiResult;
};

export const saveAsset = async (...args: any[]): Promise<AssetRecord> => {
  // Accept multiple call styles:
  // saveAsset(assetRecord)
  // saveAsset(module, url, metadata?)
  // saveAsset({ module, url, kind, ... })
  let rec: AssetRecord | null = null;

  if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    rec = { ...(args[0] as any) };
  } else {
    const module = typeof args[0] === 'string' ? args[0] : undefined;
    const url = typeof args[1] === 'string' ? args[1] : undefined;
    const metadata = args[2];
    rec = { id: crypto?.randomUUID?.() || String(Date.now()), module, url, metadata };
  }

  if (!rec!.id) rec!.id = crypto?.randomUUID?.() || String(Date.now());
  if (!rec!.timestamp) rec!.timestamp = rec!.createdAt || Date.now();

  const assets = readAssets();
  assets.unshift(rec!);
  // keep last 5000
  if (assets.length > 5000) assets.splice(5000);
  writeAssets(assets);
  emitAssets();
  return rec!;
};

export const SESSION_ASSETS = {
  read: readAssets,
  write: writeAssets,
  [Symbol.iterator]: function* () { yield* readAssets(); },
};

// -----------------------------
// OpenRouter chat (proxy lives in vite middleware / server)
// -----------------------------
const safeJson = async (res: Response) => {
  try { return await res.json(); } catch { return null; }
};

const normalizeResult = (parsed: any): AiResult => {
  // Proxy returns { ok, content, text, raw, error, ... } depending on upstream
  if (parsed && typeof parsed === 'object') {
    if (typeof parsed.text === 'string') return { ok: !!parsed.ok, text: parsed.text, raw: parsed.raw ?? parsed } as AiResult;
    if (typeof parsed.content === 'string') return { ok: !!parsed.ok, text: parsed.content, raw: parsed.raw ?? parsed } as AiResult;
    // OpenRouter style: choices[0].message.content
    const content = parsed?.choices?.[0]?.message?.content;
    if (typeof content === 'string') return { ok: true, text: content, raw: parsed } as AiResult;
    if (typeof parsed?.output === 'string') return { ok: true, text: parsed.output, raw: parsed } as AiResult;
  }
  return { ok: false, text: '', raw: parsed, error: { message: 'Empty/unknown response shape' } };
};

export const openRouterChat: any = async (...args: any[]): Promise<AiResult> => {
  // Accepted call styles:
  // openRouterChat(prompt: string)
  // openRouterChat(prompt: string, model?: string)
  // openRouterChat({ prompt, messages, model, temperature, max_tokens, ... })
  const keys = getStoredKeys();
  const modelDefault =
    keys.openRouterModel ||
    keys.geminiModel ||
    'google/gemini-2.0-flash-001';

  let payload: any = {};
  if (args.length === 1 && typeof args[0] === 'string') {
    payload = { prompt: args[0], model: modelDefault };
  } else if (args.length >= 1 && typeof args[0] === 'string') {
    payload = { prompt: args[0], model: args[1] || modelDefault };
  } else if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    payload = { ...args[0] };
    if (!payload.model) payload.model = modelDefault;
  } else {
    payload = { prompt: String(args[0] ?? ''), model: modelDefault };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Proxy supports x-openrouter-key and/or env OPENROUTER_API_KEY
  const key = keys.openRouterKey;
  if (key) headers['x-openrouter-key'] = key;

  // If caller gave messages, keep them; else build messages from prompt.
  if (!payload.messages) {
    const system = payload.system || payload.systemPrompt || 'You are a helpful assistant.';
    payload.messages = [
      { role: 'system', content: system },
      { role: 'user', content: payload.prompt ?? payload.input ?? payload.text ?? '' },
    ];
  }

  try {
    const res = await fetch(OPENROUTER_CHAT_PATH, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const parsed = await safeJson(res);
    if (!res.ok) {
      return { ok: false, text: '', raw: parsed, error: { message: parsed?.error?.message || parsed || res.statusText, code: res.status } };
    }
    return normalizeResult(parsed);
  } catch (e: any) {
    return { ok: false, text: '', raw: null, error: { message: e?.message || e } };
  }
};

// -----------------------------
// Higher-level helpers used by many modules
// -----------------------------
export const loggedGenerateContent: any = async (...args: any[]): Promise<AiResult> => {
  // Typical call patterns in the app:
  // loggedGenerateContent(prompt)
  // loggedGenerateContent(moduleName, prompt)
  // loggedGenerateContent(moduleName, prompt, options)
  // loggedGenerateContent({ module, prompt, ... })
  let moduleName: string | undefined;
  let prompt: string = '';
  let options: any = {};

  if (args.length === 1 && typeof args[0] === 'string') {
    prompt = args[0];
  } else if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
    moduleName = args[0];
    prompt = args[1];
    options = args[2] || {};
  } else if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    moduleName = args[0].module || args[0].name;
    prompt = args[0].prompt || args[0].text || '';
    options = args[0];
  } else {
    prompt = String(args[0] ?? '');
  }

  if (moduleName) pushLog(`AI request: ${moduleName}`, { prompt }, 'info', moduleName);

  const result = await openRouterChat({
    ...options,
    prompt,
  });

  if (moduleName) {
    if (result.ok) pushLog(`AI ok: ${moduleName}`, { chars: result.text.length }, 'info', moduleName);
    else pushLog(`AI error: ${moduleName}`, { error: result.error, raw: result.raw }, 'error', moduleName);
  }

  return result;
};

// Convenience unwrappers (to reduce UI boilerplate)
export const unwrapText = (r: any, fallback = ''): string => (r && typeof r.text === 'string') ? r.text : (typeof r === 'string' ? r : fallback);

// -----------------------------
// Domain functions (kept functional, but not over-typed)
// -----------------------------
export const generateLeads: any = async (...args: any[]) => {
  const [market, niche, count] = args;
  const prompt = `Generate ${count || 15} B2B leads for the following:\nMarket: ${market}\nNiche: ${niche}\nReturn JSON with shape {leads:[{businessName,website,location,contactEmail,contactName,notes}]} and nothing else.`;
  const r = await loggedGenerateContent('generateLeads', prompt, { temperature: 0.4 });
  let leads: any[] = [];
  try {
    const parsed = JSON.parse(r.text);
    leads = Array.isArray(parsed?.leads) ? parsed.leads : [];
  } catch {
    // best-effort: keep as text
  }
  return { ok: r.ok, leads, text: r.text, raw: r.raw, error: r.error };
};

export const groundedLeadSearch: any = async (...args: any[]) => {
  const [query, region, count] = args;
  const prompt = `Find real businesses matching: ${query}${region ? ` in ${region}` : ''}. Return JSON {leads:[{businessName,website,location,contactEmail,contactName,notes}], groundingSources:[{title,url,snippet}]}. Aim for ${count || 15} leads.`;
  const r = await loggedGenerateContent('groundedLeadSearch', prompt, { temperature: 0.4 });
  let leads: any[] = [];
  let groundingSources: any[] = [];
  try {
    const parsed = JSON.parse(r.text);
    leads = Array.isArray(parsed?.leads) ? parsed.leads : [];
    groundingSources = Array.isArray(parsed?.groundingSources) ? parsed.groundingSources : [];
  } catch {}
  return { ok: r.ok, leads, groundingSources, text: r.text, raw: r.raw, error: r.error };
};

export const generateOutreachSequence: any = async (...args: any[]) => {
  const [leadOrContext, offer] = args;
  const prompt = `Write a 7-touch outreach sequence (email + LinkedIn) for this lead/context:\n${JSON.stringify(leadOrContext)}\nOffer: ${offer || 'Prospector OS'}\nReturn JSON {steps:[{channel,subject,body}]} only.`;
  const r = await loggedGenerateContent('generateOutreachSequence', prompt, { temperature: 0.6 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, steps: parsed?.steps || [], text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, steps: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const generateProposalDraft: any = async (...args: any[]) => {
  const [leadOrContext, scope] = args;
  const prompt = `Draft a concise proposal for:\n${JSON.stringify(leadOrContext)}\nScope/Offer: ${scope || 'Marketing + Lead Gen'}\nReturn plain text proposal with headings.`;
  return await loggedGenerateContent('generateProposalDraft', prompt, { temperature: 0.6 });
};

export const generateROIReport: any = async (...args: any[]) => {
  const [inputs] = args;
  const prompt = `Create an ROI report using these inputs:\n${JSON.stringify(inputs)}\nReturn plain text plus a short JSON summary at the bottom as {summary:{...}}.`;
  return await loggedGenerateContent('generateROIReport', prompt, { temperature: 0.4 });
};

export const analyzeLedger: any = async (...args: any[]) => {
  const [ledger] = args;
  const prompt = `Analyze this revenue/expense ledger and give risks + opportunities. Return JSON {risk,opportunity,notes}.\nLedger:\n${JSON.stringify(ledger)}`;
  const r = await loggedGenerateContent('analyzeLedger', prompt, { temperature: 0.3 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, risk: '', opportunity: '', notes: r.text, text: r.text, raw: r.raw, error: r.error };
  }
};

export const synthesizeArticle: any = async (...args: any[]) => {
  const [topic, angle] = args;
  const prompt = `Write a high-signal article on: ${topic}. Angle: ${angle || 'practical'}\nReturn markdown-free plain text with sections.`;
  return await loggedGenerateContent('synthesizeArticle', prompt, { temperature: 0.7 });
};

export const generateFlashSparks: any = async (...args: any[]) => {
  const [context] = args;
  const prompt = `Generate 25 short campaign spark ideas for:\n${JSON.stringify(context)}\nReturn JSON {sparks:["..."]}.`;
  const r = await loggedGenerateContent('generateFlashSparks', prompt, { temperature: 0.8 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, sparks: parsed?.sparks || [], text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, sparks: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const generateVisual: any = async (...args: any[]) => {
  // NOTE: This app stores generated media references; actual image generation may be delegated elsewhere.
  const [prompt, meta] = args;
  const r = await loggedGenerateContent('generateVisual', `Create a detailed image prompt for: ${prompt}\nReturn JSON {imagePrompt, style, negativePrompt}.`, { temperature: 0.6 });
  let parsed: any = {};
  try { parsed = JSON.parse(r.text); } catch {}
  const asset = await saveAsset({ module: 'generateVisual', kind: 'image', type: 'image', name: meta?.name, metadata: parsed, data: { prompt } });
  return { ok: r.ok, asset, ...parsed, text: r.text, raw: r.raw, error: r.error };
};

export const generateMockup: any = async (...args: any[]) => {
  const [product, angle] = args;
  const r = await loggedGenerateContent('generateMockup', `Create a 4K mockup prompt for product: ${product}. Angle: ${angle || 'luxury'}. Return JSON {mockupPrompt}.`, { temperature: 0.5 });
  let parsed: any = {};
  try { parsed = JSON.parse(r.text); } catch {}
  const asset = await saveAsset({ module: 'generateMockup', kind: 'image', type: 'image', metadata: parsed, data: { product, angle } });
  return { ok: r.ok, asset, ...parsed, text: r.text, raw: r.raw, error: r.error };
};

export const generateVideoPayload: any = async (...args: any[]) => {
  const [concept, cfg] = args;
  const prompt = `Create a video generation payload for concept:\n${concept}\nConfig:\n${JSON.stringify(cfg)}\nReturn JSON {prompt, negativePrompt, durationSeconds, aspectRatio}.`;
  const r = await loggedGenerateContent('generateVideoPayload', prompt, { temperature: 0.5 });
  let payload: any = {};
  try { payload = JSON.parse(r.text); } catch {}
  return { ok: r.ok, payload, text: r.text, raw: r.raw, error: r.error };
};

export const fetchViralPulseData: any = async (...args: any[]) => {
  const [topic] = args;
  const prompt = `Provide a 'viral pulse' summary for: ${topic}. Return JSON {signals:[{title,whyItMatters,hook}], sources:[{title,url,snippet}]}.`;
  const r = await loggedGenerateContent('fetchViralPulseData', prompt, { temperature: 0.6 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, signals: [], sources: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const queryRealtimeAgent: any = async (...args: any[]) => {
  const [question] = args;
  return await loggedGenerateContent('queryRealtimeAgent', String(question || ''), { temperature: 0.5 });
};

export const extractBrandDNA: any = async (...args: any[]) => {
  const [business] = args;
  const prompt = `Extract Brand DNA for:\n${JSON.stringify(business)}\nReturn JSON {colors:[...], fontPairing:{heading,body}, archetype, visualTone, messagingPillars:[...]} only.`;
  const r = await loggedGenerateContent('extractBrandDNA', prompt, { temperature: 0.4 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, text: r.text, raw: r.raw, error: r.error };
  }
};

export const orchestrateBusinessPackage: any = async (...args: any[]) => {
  const [lead, options] = args;
  const prompt = `Orchestrate a business package for this lead. Return JSON {deliverables:[{name,summary}]}\nLead:\n${JSON.stringify(lead)}\nOptions:\n${JSON.stringify(options)}`;
  const r = await loggedGenerateContent('orchestrateBusinessPackage', prompt, { temperature: 0.5 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, deliverables: parsed?.deliverables || [], text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, deliverables: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const architectPitchDeck: any = async (...args: any[]) => {
  const [context] = args;
  const prompt = `Architect a pitch deck outline for:\n${JSON.stringify(context)}\nReturn JSON {slides:[{title,bullets:[...]}]}.`;
  const r = await loggedGenerateContent('architectPitchDeck', prompt, { temperature: 0.5 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, slides: parsed?.slides || [], text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, slides: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const architectFunnel: any = async (...args: any[]) => {
  const [context] = args;
  const prompt = `Design a marketing funnel for:\n${JSON.stringify(context)}\nReturn JSON {stages:[{name,goal,assets:[...]}]}.`;
  const r = await loggedGenerateContent('architectFunnel', prompt, { temperature: 0.5 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, stages: parsed?.stages || [], text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, stages: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const generatePitch: any = async (...args: any[]) => {
  const [lead] = args;
  const prompt = `Write a short pitch for:\n${JSON.stringify(lead)}\nReturn plain text.`;
  return await loggedGenerateContent('generatePitch', prompt, { temperature: 0.6 });
};

export const generateTaskMatrix: any = async (...args: any[]) => {
  const [context] = args;
  const prompt = `Create a task matrix (owner, priority, ETA) for:\n${JSON.stringify(context)}\nReturn JSON {tasks:[{task,owner,priority,eta}]}.`;
  const r = await loggedGenerateContent('generateTaskMatrix', prompt, { temperature: 0.4 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, tasks: parsed?.tasks || [], text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, tasks: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const generateNurtureDialogue: any = async (...args: any[]) => {
  const [lead] = args;
  const prompt = `Write a nurture dialogue (5 messages) for:\n${JSON.stringify(lead)}\nReturn JSON {messages:[{role,content}]}.`;
  const r = await loggedGenerateContent('generateNurtureDialogue', prompt, { temperature: 0.7 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, messages: parsed?.messages || [], text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, messages: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const performFactCheck: any = async (...args: any[]) => {
  const [claim] = args;
  const prompt = `Fact-check this claim and explain briefly:\n${claim}\nReturn JSON {verdict, reasoning, sources:[{title,url}]} only.`;
  const r = await loggedGenerateContent('performFactCheck', prompt, { temperature: 0.2 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, verdict: 'unknown', reasoning: r.text, sources: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const fetchBenchmarkData: any = async (...args: any[]) => {
  const [entity] = args;
  const prompt = `Benchmark the entity (product/company) and return a structured report. Return JSON with keys: entityName, missionSummary, visualStack, sonicStack, featureGap, businessModel, designSystem, deepArchitecture, sources.\nEntity:\n${entity}`;
  const r = await loggedGenerateContent('fetchBenchmarkData', prompt, { temperature: 0.4 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, report: parsed as BenchmarkReport, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, report: { entityName: String(entity || '') }, text: r.text, raw: r.raw, error: r.error };
  }
};

export const analyzeVideoUrl: any = async (...args: any[]) => {
  const [url] = args;
  const prompt = `Analyze this video URL for messaging + offer fit: ${url}. Return JSON {summary, hooks:[...], issues:[...], recommendations:[...]}.`;
  const r = await loggedGenerateContent('analyzeVideoUrl', prompt, { temperature: 0.4 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, summary: r.text, hooks: [], issues: [], recommendations: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const enhanceStrategicPrompt: any = async (...args: any[]) => {
  const [prompt] = args;
  return await loggedGenerateContent('enhanceStrategicPrompt', `Improve this prompt for better strategic output:\n${prompt}`, { temperature: 0.5 });
};

export const enhanceVideoPrompt: any = async (...args: any[]) => {
  const [prompt] = args;
  return await loggedGenerateContent('enhanceVideoPrompt', `Rewrite this into a high-quality video prompt:\n${prompt}`, { temperature: 0.6 });
};

export const enhanceVideoPrompt: any = async (...args: any[]) => {
  const [prompt] = args;
  return await loggedGenerateContent('enhanceVideoPrompt', `Rewrite this into a high-quality video prompt:\n${prompt}`, { temperature: 0.6 });
};

export const critiqueVideoPresence: any = async (...args: any[]) => {
  const [context] = args;
  const prompt = `Critique video presence (tone, clarity, CTA, credibility). Return JSON {score, strengths:[...], issues:[...], fixes:[...]}.\nContext:\n${JSON.stringify(context)}`;
  const r = await loggedGenerateContent('critiqueVideoPresence', prompt, { temperature: 0.4 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, score: '', strengths: [], issues: [], fixes: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const analyzeVisual: any = async (...args: any[]) => {
  const [imageUrl] = args;
  const prompt = `Analyze this image (marketing + brand): ${imageUrl}. Return JSON {summary, improvements:[...], altPrompts:[...]} only.`;
  const r = await loggedGenerateContent('analyzeVisual', prompt, { temperature: 0.4 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, summary: r.text, improvements: [], altPrompts: [], text: r.text, raw: r.raw, error: r.error };
  }
};

export const synthesizeProduct: any = async (...args: any[]) => {
  const [context] = args;
  const prompt = `Synthesize a product offer + positioning from:\n${JSON.stringify(context)}\nReturn JSON {name, positioning, features:[...], pricing, faq:[{q,a}]}.`;
  const r = await loggedGenerateContent('synthesizeProduct', prompt, { temperature: 0.6 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, text: r.text, raw: r.raw, error: r.error };
  }
};

export const generateAffiliateProgram: any = async (...args: any[]) => {
  const [context] = args;
  const prompt = `Design an affiliate program for:\n${JSON.stringify(context)}\nReturn JSON {tiers:[{name,commission,requirements}], assets:[...], outreach:[...]} only.`;
  const r = await loggedGenerateContent('generateAffiliateProgram', prompt, { temperature: 0.5 });
  try {
    const parsed = JSON.parse(r.text);
    return { ok: r.ok, ...parsed, text: r.text, raw: r.raw, error: r.error };
  } catch {
    return { ok: r.ok, text: r.text, raw: r.raw, error: r.error };
  }
};

export const simulateSandbox: any = async (...args: any[]) => {
  const [scenario] = args;
  return await loggedGenerateContent('simulateSandbox', `Simulate this scenario step-by-step and return concise outputs:\n${JSON.stringify(scenario)}`, { temperature: 0.6 });
};

export const translateTactical: any = async (...args: any[]) => {
  const [text, target] = args;
  return await loggedGenerateContent('translateTactical', `Translate to ${target || 'English'} preserving meaning and tone:\n${text}`, { temperature: 0.3 });
};

export const fetchTokenStats: any = async (...args: any[]) => {
  const [context] = args;
  return await loggedGenerateContent('fetchTokenStats', `Estimate token usage/costs for this context and return JSON {estimate, notes}.\n${JSON.stringify(context)}`, { temperature: 0.2 });
};

export const testModelPerformance: any = async (...args: any[]) => {
  const [model] = args;
  return await loggedGenerateContent('testModelPerformance', `Briefly test model performance assumptions for model=${model}. Return JSON {latencyHint, qualityHint, risks}.`, { temperature: 0.2 });
};

// Back-compat aliases some modules import
export const fetchLiveIntel: any = queryRealtimeAgent;
export const crawlTheaterSignals: any = async (...args: any[]) => loggedGenerateContent('crawlTheaterSignals', `Crawl/collect signals: ${JSON.stringify(args[0])}`, { temperature: 0.4 });
export const identifySubRegions: any = async (...args: any[]) => loggedGenerateContent('identifySubRegions', `Identify sub-regions: ${JSON.stringify(args[0])}`, { temperature: 0.4 });
export const generateAgencyIdentity: any = async (...args: any[]) => loggedGenerateContent('generateAgencyIdentity', `Generate agency identity: ${JSON.stringify(args[0])}`, { temperature: 0.5 });
export const generatePlaybookStrategy: any = async (...args: any[]) => loggedGenerateContent('generatePlaybookStrategy', `Generate playbook strategy: ${JSON.stringify(args[0])}`, { temperature: 0.5 });
export const generateAudioPitch: any = async (...args: any[]) => loggedGenerateContent('generateAudioPitch', `Create an audio pitch script: ${JSON.stringify(args[0])}`, { temperature: 0.6 });
