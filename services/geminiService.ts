import { Lead, BrandIdentity } from '../types';
import { deductCost } from './computeTracker';

/**
 * LOCK-IN RULES:
 * - Browser NEVER calls OpenRouter directly.
 * - Browser calls our same-origin proxy: POST /api/openrouter/chat
 * - Proxy attaches Authorization: Bearer <OPENROUTER_API_KEY>
 */

// Public route implemented in vite.config.ts middleware
export const OPENROUTER_PROXY_PATH = '/api/openrouter/chat';

// Default model
export const PRIMARY_MODEL = 'google/gemini-3-flash-preview';

// Stable system instruction
export const SYSTEM_INSTRUCTION = `
You are Prospector OS.
When asked for JSON, output VALID JSON only (no markdown fences).
Keep output structured and usable.
`.trim();

// -------------------- Types --------------------
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
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  modelStr?: string;
}

export interface LoggedGenerateParams {
  module: string;
  model?: string;
  modelClass?: 'FLASH' | 'PRO';
  reasoningDepth?: 'LOW' | 'MEDIUM' | 'HIGH';
  isClientFacing?: boolean;
  contents: any;
  config?: any;
}

// -------------------- State (Assets/Vault) --------------------
export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];
const assetListeners = new Set<(assets: AssetRecord[]) => void>();

const uuidLike = () => Math.random().toString(36).substring(2, 15);

export const pushLog = (msg: string) => {
  PRODUCTION_LOGS.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 200) PRODUCTION_LOGS.pop();
};

export const subscribeToAssets = (listener: (assets: AssetRecord[]) => void) => {
  assetListeners.add(listener);
  listener(SESSION_ASSETS);
  return () => {
    assetListeners.delete(listener);
  };
};

export const saveAsset = (
  type: AssetRecord['type'],
  title: string,
  data: string,
  module?: string,
  leadId?: string,
  metadata?: any
) => {
  const asset: AssetRecord = {
    id: uuidLike(),
    type,
    title,
    data,
    module,
    leadId,
    timestamp: Date.now(),
    metadata
  };
  SESSION_ASSETS.unshift(asset);
  assetListeners.forEach((l) => l([...SESSION_ASSETS]));
  return asset;
};

export const deleteAsset = (id: string) => {
  const idx = SESSION_ASSETS.findIndex((a) => a.id === id);
  if (idx !== -1) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach((l) => l([...SESSION_ASSETS]));
  }
};

export const clearVault = () => {
  SESSION_ASSETS.length = 0;
  assetListeners.forEach((l) => l([]));
};

export const importVault = (assets: AssetRecord[]) => {
  SESSION_ASSETS.length = 0;
  SESSION_ASSETS.push(...assets);
  assetListeners.forEach((l) => l([...SESSION_ASSETS]));
  return SESSION_ASSETS.length;
};

// -------------------- Key storage (local) --------------------
const OR_KEY = 'POMELLI_OPENROUTER_KEY';
const KIE_KEY = 'POMELLI_KIE_KEY';

export const setStoredKeys = (openRouter?: string, kie?: string) => {
  try {
    if (typeof window === 'undefined') return;
    if (openRouter) window.localStorage.setItem(OR_KEY, openRouter.trim());
    if (kie) window.localStorage.setItem(KIE_KEY, kie.trim());
  } catch {
    // ignore
  }
};

export const getStoredKeys = () => {
  try {
    if (typeof window === 'undefined') return { openRouter: '', kie: '' };
    return {
      openRouter: window.localStorage.getItem(OR_KEY) || '',
      kie: window.localStorage.getItem(KIE_KEY) || ''
    };
  } catch {
    return { openRouter: '', kie: '' };
  }
};

// -------------------- Helpers --------------------
const extractJson = (text: string) => {
  if (!text) return '';
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');

  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart) && objEnd > objStart) {
    return cleaned.substring(objStart, objEnd + 1);
  }
  if (arrStart !== -1 && arrEnd > arrStart) {
    return cleaned.substring(arrStart, arrEnd + 1);
  }
  return cleaned;
};

const safeJsonParse = <T = any>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

// Compatibility shim (older code imports getAI())
export const getAI = () => null;

// -------------------- OpenRouter (via proxy) --------------------
export const openRouterChat = async (
  prompt: string,
  system?: string,
  model: string = PRIMARY_MODEL
): Promise<string> => {
  const keys = getStoredKeys();

  const body = {
    prompt,
    systemInstruction: system || SYSTEM_INSTRUCTION,
    model
  };

  const res = await fetch(OPENROUTER_PROXY_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(keys.openRouter ? { 'x-openrouter-key': keys.openRouter } : {})
    },
    body: JSON.stringify(body)
  });

  const rawText = await res.text();

  if (!res.ok) {
    pushLog(`OpenRouter Proxy Error (${res.status}): ${rawText}`);
    const statusText = res.status === 401 ? 'Unauthorized (Check Key)' : `Error ${res.status}`;
    throw new Error(`OpenRouter Error (${statusText}): ${rawText}`);
  }

  const data = safeJsonParse<any>(rawText, null);
  if (data && typeof data === 'object') {
    return data?.choices?.[0]?.message?.content ?? data?.text ?? '';
  }
  return rawText;
};

export const executeIntelligenceTask = async (
  prompt: string,
  system?: string,
  opts?: {
    expectJson?: boolean;
    requiredTopKeys?: string[];
    module?: string;
  }
) => {
  const raw = await openRouterChat(prompt, system);

  if (opts?.expectJson) {
    const extracted = extractJson(raw);

    if (!extracted || extracted.trim().length < 2) {
      pushLog(`JSON_EMPTY module=${opts?.module || 'UNKNOWN'} rawLen=${raw?.length || 0}`);
      throw new Error('AI returned empty/invalid JSON. Try again or check the prompt/schema.');
    }

    if (opts?.requiredTopKeys && opts.requiredTopKeys.length > 0) {
      const parsed = safeJsonParse<any>(extracted, null);
      const ok =
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        opts.requiredTopKeys.every((k) => Object.prototype.hasOwnProperty.call(parsed, k));

      if (!ok) {
        pushLog(
          `JSON_SCHEMA_FAIL module=${opts?.module || 'UNKNOWN'} required=${opts.requiredTopKeys.join(
            ','
          )} extractedLen=${extracted.length}`
        );
        throw new Error('AI JSON schema mismatch (missing required keys).');
      }
    }

    return extracted;
  }

  return raw;
};

export const executeIntelligenceTaskJson = async (prompt: string, requiredTopKeys: string[], module: string) => {
  const jsonStr = await executeIntelligenceTask(prompt, SYSTEM_INSTRUCTION, {
    expectJson: true,
    requiredTopKeys,
    module
  });
  return safeJsonParse<any>(jsonStr, {});
};

// Keep API-compatible export
export const loggedGenerateContent = async (params: LoggedGenerateParams): Promise<string> => {
  const model = params.model || PRIMARY_MODEL;
  const contentStr = typeof params.contents === 'string' ? params.contents : JSON.stringify(params.contents ?? {});
  const started = Date.now();

  try {
    const text = await openRouterChat(contentStr, SYSTEM_INSTRUCTION, model);
    deductCost(model, contentStr.length + text.length);
    pushLog(`GEN_OK ${params.module} (${Date.now() - started}ms) model=${model}`);
    return text;
  } catch (e: any) {
    pushLog(`GENERATION_ERROR in ${params.module}: ${e?.message || String(e)}`);
    throw e;
  }
};

// -------------------- Core: Lead Discovery --------------------
export const generateLeads = async (region: string, niche: string, count: number) => {
  pushLog(`RECON: ${region} | ${niche} | count=${count}`);

  const prompt = `
Find ${count} high-ticket B2B leads in ${region} for ${niche}.
Return VALID JSON ONLY in this shape:
{
  "leads": [
    {
      "businessName": "",
      "websiteUrl": "",
      "city": "",
      "niche": "",
      "leadScore": 0,
      "assetGrade": "A",
      "socialGap": ""
    }
  ]
}
`.trim();

  const jsonStr = await executeIntelligenceTask(prompt, SYSTEM_INSTRUCTION, { expectJson: true, requiredTopKeys: ['leads'], module: 'LEAD_DISCOVERY' });
  const parsed = safeJsonParse<any>(jsonStr, { leads: [] });

  return { leads: parsed.leads || [], groundingSources: [] as any[] };
};

// -------------------- Text modules --------------------
export const orchestrateBusinessPackage = async (lead: Lead, _assets: any[]) => {
  // STRICT schema: CampaignOrchestrator relies on these keys to populate tabs.
  const schema = {
    presentation: {
      title: 'STRATEGY Blueprint',
      slides: [
        {
          title: 'Positioning',
          bullets: ['...'],
          proofPoints: ['...'],
          nextActions: ['...']
        }
      ]
    },
    narrative: 'Executive narrative as a single string.',
    contentPack: {
      emails: [{ subject: '', body: '' }],
      linkedin: [{ hook: '', message: '' }],
      ads: [{ headline: '', primaryText: '' }]
    },
    outreach: {
      sequence: [{ day: 1, channel: 'Email', purpose: '', content: '' }],
      objections: [{ objection: '', reply: '' }]
    },
    funnel: [{ stage: '', goal: '', asset: '', metric: '' }],
    visualDirection: [{ label: '', description: '' }]
  };

  const prompt = `
You are generating a Campaign Orchestrator package for Prospector OS.

Business:
- name: ${lead.businessName}
- website: ${lead.websiteUrl || ''}
- niche: ${lead.niche || ''}
- city/market: ${lead.city || ''}

Return VALID JSON ONLY (no markdown, no commentary) matching EXACTLY this top-level shape:
${JSON.stringify(schema, null, 2)}

Rules:
- Include ALL top-level keys: presentation, narrative, contentPack, outreach, funnel, visualDirection
- Do NOT add extra top-level keys.
- Use concise, client-ready language.
- Ensure arrays are non-empty (at least 1 item each).
`.trim();

  const jsonStr = await executeIntelligenceTask(prompt, SYSTEM_INSTRUCTION, {
    expectJson: true,
    requiredTopKeys: ['presentation', 'narrative', 'contentPack', 'outreach', 'funnel', 'visualDirection'],
    module: 'CAMPAIGN_ORCHESTRATOR'
  });

  const parsed = safeJsonParse<any>(jsonStr, null);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI returned invalid package JSON.');
  }

  return parsed;
};

export const fetchLiveIntel = async (lead: Lead, module: string): Promise<BenchmarkReport> => {
  const json = await executeIntelligenceTask(
    `Technical audit for ${lead.websiteUrl}. Focus module="${module}". Return VALID JSON BenchmarkReport.`,
    SYSTEM_INSTRUCTION,
    { expectJson: true, module: `LIVE_INTEL_${module}` }
  );
  return safeJsonParse<BenchmarkReport>(json, {
    entityName: lead.businessName,
    missionSummary: '',
    visualStack: [],
    sonicStack: [],
    featureGap: '',
    businessModel: '',
    designSystem: '',
    deepArchitecture: '',
    sources: []
  });
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => {
  return await fetchLiveIntel(lead, 'benchmark');
};

export const generateProposalDraft = async (lead: Lead) => {
  return await executeIntelligenceTask(
    `Write a proposal draft for ${lead.businessName}. Focus on AI ROI, speed, and measurable outcomes. Return plain text.`,
    SYSTEM_INSTRUCTION
  );
};

export const generateOutreachSequence = async (lead: Lead) => {
  const prompt = `
Create a 5-day multi-channel outreach sequence for:
Business: ${lead.businessName}
Niche: ${lead.niche}
Website: ${lead.websiteUrl}

Return VALID JSON ONLY:
[
  { "day": 1, "channel": "Email", "content": "...", "purpose": "..." }
]
`.trim();
  const jsonStr = await executeIntelligenceTask(prompt, SYSTEM_INSTRUCTION, { expectJson: true, module: 'OUTREACH_SEQUENCE' });
  return safeJsonParse<any[]>(jsonStr, []);
};

export const generatePitch = async (lead: Lead) => {
  return await executeIntelligenceTask(`Write a 30-second pitch for ${lead.businessName}. Return plain text only.`, SYSTEM_INSTRUCTION);
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string) => {
  const json = await executeIntelligenceTask(
    `Generate nurture dialogue for ${lead.businessName} in scenario: ${scenario}. Return VALID JSON array of messages.`,
    SYSTEM_INSTRUCTION,
    { expectJson: true, module: 'NURTURE_DIALOGUE' }
  );
  return safeJsonParse<any[]>(json, []);
};

export const generateAffiliateProgram = async (niche: string) => {
  const json = await executeIntelligenceTask(`Generate an affiliate program matrix for ${niche}. Return VALID JSON.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'AFFILIATE_PROGRAM'
  });
  return safeJsonParse<any>(json, {});
};

export const analyzeLedger = async (leads: Lead[]) => {
  const json = await executeIntelligenceTask(
    `Analyze these ${leads.length} leads. Return VALID JSON: { "risk": "", "opportunity": "" }`,
    SYSTEM_INSTRUCTION,
    { expectJson: true, requiredTopKeys: ['risk', 'opportunity'], module: 'LEDGER_ANALYSIS' }
  );
  return safeJsonParse<any>(json, { risk: '', opportunity: '' });
};

export const identifySubRegions = async (theater: string) => {
  const json = await executeIntelligenceTask(`Break ${theater} into 5 strategic sub-regions. Return VALID JSON array.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'SUBREGIONS'
  });
  return safeJsonParse<string[]>(json, []);
};

export const crawlTheaterSignals = async (sector: string, signal: string) => {
  const json = await executeIntelligenceTask(
    `Identify 3 businesses in ${sector} showing signal="${signal}". Return VALID JSON: { "leads": [ ... ] }`,
    SYSTEM_INSTRUCTION,
    { expectJson: true, requiredTopKeys: ['leads'], module: 'THEATER_SIGNALS' }
  );
  const parsed = safeJsonParse<any>(json, { leads: [] });
  return (parsed.leads || []).map((l: any) => ({ ...l, id: uuidLike() }));
};

export const generatePlaybookStrategy = async (niche: string) => {
  const json = await executeIntelligenceTask(
    `Generate a high-ticket agency playbook strategy for ${niche}. Return VALID JSON: { "strategyName": "", "steps": [{ "title": "", "tactic": "" }] }`,
    SYSTEM_INSTRUCTION,
    { expectJson: true, requiredTopKeys: ['strategyName', 'steps'], module: 'PLAYBOOK' }
  );
  return safeJsonParse<any>(json, {});
};

export const synthesizeProduct = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Architect an AI product for ${lead.businessName}. Return VALID JSON.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'PRODUCT_SYNTHESIS'
  });
  return safeJsonParse<any>(json, {});
};

export const architectFunnel = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Architect a sales funnel for ${lead.businessName}. Return VALID JSON array.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'FUNNEL_ARCH'
  });
  return safeJsonParse<any[]>(json, []);
};

export const architectPitchDeck = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Architect a 5-slide pitch deck for ${lead.businessName}. Return VALID JSON.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'DECK_ARCH'
  });
  return safeJsonParse<any>(json, {});
};

export const generateROIReport = async (ltv: number, leads: number, conv: number) => {
  return await executeIntelligenceTask(
    `Generate an AI ROI report using: LTV=${ltv}, Leads=${leads}, ConversionLift=${conv}. Return plain text.`,
    SYSTEM_INSTRUCTION
  );
};

export const generateAgencyIdentity = async (niche: string, region: string) => {
  const json = await executeIntelligenceTask(`Generate agency identity for ${niche} in ${region}. Return VALID JSON.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'AGENCY_IDENTITY'
  });
  return safeJsonParse<any>(json, {});
};

export const testModelPerformance = async (model: string, prompt: string) => {
  return await loggedGenerateContent({ module: 'TEST', model, contents: prompt });
};

export const generateMotionLabConcept = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Create a storyboard concept for ${lead.businessName}. Return VALID JSON.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'MOTION_LAB'
  });
  return safeJsonParse<any>(json, {});
};

export const generateFlashSparks = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Generate 6 viral sparks for ${lead.businessName}. Return VALID JSON array of ideas.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'FLASH_SPARKS'
  });
  return safeJsonParse<any[]>(json, []);
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number) => {
  return await executeIntelligenceTask(
    `Simulate business growth for ${lead.businessName}. LTV=${ltv}, Volume=${volume}. Return plain text.`,
    SYSTEM_INSTRUCTION
  );
};

export const critiqueVideoPresence = async (lead: Lead) => {
  return await executeIntelligenceTask(`Critique the video presence of ${lead.businessName}. Return plain text.`, SYSTEM_INSTRUCTION);
};

export const translateTactical = async (text: string, lang: string) => {
  return await executeIntelligenceTask(`Translate this into ${lang} with tactical tone: ${text}. Return plain text.`, SYSTEM_INSTRUCTION);
};

export const generateTaskMatrix = async (lead: Lead) => {
  const json = await executeIntelligenceTask(`Generate a task checklist for ${lead.businessName}. Return VALID JSON array of tasks.`, SYSTEM_INSTRUCTION, {
    expectJson: true,
    module: 'TASK_MATRIX'
  });
  return safeJsonParse<any[]>(json, []);
};

export const fetchViralPulseData = async (niche: string) => {
  const json = await executeIntelligenceTask(
    `Identify 4 viral trends for ${niche}. Return VALID JSON array of trends with brief notes.`,
    SYSTEM_INSTRUCTION,
    { expectJson: true, module: 'VIRAL_PULSE' }
  );
  return safeJsonParse<any[]>(json, []);
};

export const queryRealtimeAgent = async (query: string) => {
  const text = await executeIntelligenceTask(`Answer: ${query}. Return plain text plus any source hints if known.`, SYSTEM_INSTRUCTION);
  return { text, sources: [] as any[] };
};

export const fetchTokenStats = async () => {
  return {
    recentOps: [
      { op: 'LEAD_RECON', id: '0x88FF', cost: 1200 },
      { op: 'VIDEO_SYNTH', id: '0x12A4', cost: 45000 }
    ]
  };
};

export const synthesizeArticle = async (source: string, mode: string) => {
  return await executeIntelligenceTask(`Synthesize this article into mode=${mode}: ${source}. Return plain text.`, SYSTEM_INSTRUCTION);
};

export const analyzeVideoUrl = async (url: string, prompt: string, _leadId?: string) => {
  return await executeIntelligenceTask(`Analyze video URL: ${url}. Mission: ${prompt}. Return plain text.`, SYSTEM_INSTRUCTION);
};

export const enhanceStrategicPrompt = async (prompt: string) => {
  return await executeIntelligenceTask(`Enhance strategic prompt: ${prompt}. Return plain text.`, SYSTEM_INSTRUCTION);
};

export const enhanceVideoPrompt = async (prompt: string) => {
  return await executeIntelligenceTask(`Enhance this video prompt for cinematic 4K: ${prompt}. Return plain text.`, SYSTEM_INSTRUCTION);
};

// -------------------- Media stubs --------------------
export const generateVisual = async (_prompt: string, _lead: Lead, _base64Image?: string) => {
  return null as any;
};

export const analyzeVisual = async (_base64: string, _mimeType: string, prompt: string) => {
  return await executeIntelligenceTask(`Visual analysis task: ${prompt}. Return plain text.`, SYSTEM_INSTRUCTION);
};

export const generateMockup = async (businessName: string, niche: string, _leadId?: string) => {
  const prompt = `Hyper-realistic 4K mockup for ${businessName} in ${niche}.`;
  await executeIntelligenceTask(`Create an image direction prompt for: ${prompt}. Return plain text prompt only.`, SYSTEM_INSTRUCTION);
  return null as any;
};

export const generateVideoPayload = async (
  prompt: string,
  leadId?: string,
  _startImageBase64?: string,
  _endImageBase64?: string,
  config: VeoConfig = { aspectRatio: '16:9', resolution: '720p' },
  _referenceImages: string[] = [],
  _inputVideoBase64?: string
) => {
  const payload = { provider: 'KIE', prompt, leadId, config };
  saveAsset('TEXT', 'Video Payload', JSON.stringify(payload, null, 2), 'VIDEO_STUDIO', leadId);
  return null as any;
};

export const generateAudioPitch = async (_text: string, _voiceName: string = 'Kore', _leadId?: string) => {
  return null as any;
};

export const generateLyrics = async (lead: Lead, theme: string, type: string) => {
  return await executeIntelligenceTask(
    `Write ${type} lyrics for ${lead.businessName}. Theme: ${theme}. Return plain text only.`,
    SYSTEM_INSTRUCTION
  );
};

export const generateSonicPrompt = async (lead: Lead) => {
  return await executeIntelligenceTask(
    `Generate a detailed music generation prompt for ${lead.businessName}'s brand identity. Return ONLY the prompt string.`,
    SYSTEM_INSTRUCTION
  );
};

export const performFactCheck = async (_lead: Lead, claim: string) => {
  const text = await executeIntelligenceTask(`Fact-check this claim: "${claim}". Return plain text with reasoning.`, SYSTEM_INSTRUCTION);
  return { status: 'Review', evidence: text, sources: [] as any[] };
};

export const extractBrandDNA = async (_lead: Partial<Lead>, websiteUrl: string): Promise<BrandIdentity> => {
  const json = await executeIntelligenceTask(
    `Research ${websiteUrl} and extract brand DNA. Return VALID JSON: { "colors": ["#hex"], "fontPairing": "", "archetype": "", "visualTone": "", "extractedImages": ["url"] }`,
    SYSTEM_INSTRUCTION,
    { expectJson: true, module: 'BRAND_DNA' }
  );
  return safeJsonParse<BrandIdentity>(json, {} as BrandIdentity);
};
