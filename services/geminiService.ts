import { Lead, BrandIdentity } from '../types';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { deductCost } from './computeTracker';

// --- CONFIGURATION: OPENROUTER HARD-LOCK ---
// IMPORTANT: browser must NOT call OpenRouter directly.
// Calls go to server route: POST /api/openrouter/chat
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "google/gemini-3-flash-preview";

// --- TYPES ---
export interface AssetRecord {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'LINK' | 'DOC';
  title: string;
  url: string;
  module: string;
  leadId?: string;
  metadata?: any;
  createdAt: number;
}

export type AuthKeySource = 'ENV' | 'OVERRIDE' | 'MISSING';

export interface AuthKeyState {
  source: AuthKeySource;
  key?: string;
}

export interface LeadDiscoveryResult {
  leads: Lead[];
  meta?: any;
}

export interface GenAIResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  raw?: any;
}

// --- LOGGING / UX UTILITIES ---
const LOG_KEY = 'PROSPECTOR_OS_LOGS_V1';

export const pushLog = (message: string) => {
  try {
    const now = new Date().toISOString();
    const entry = `[${now}] ${message}`;
    const existing = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    existing.unshift(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(existing.slice(0, 500)));
    console.log(entry);
  } catch {
    console.log(message);
  }
};

export const getLogs = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
};

// --- AUTH OVERRIDE SUPPORT (kept for UI, but not used for server-side OpenRouter calls) ---
const AUTH_OVERRIDE_KEY = 'PROSPECTOR_OS_AUTH_OVERRIDE_V1';

export const setAuthOverride = (key: string) => {
  try {
    localStorage.setItem(AUTH_OVERRIDE_KEY, key.trim());
    pushLog("Auth Override set.");
  } catch {
    // ignore
  }
};

export const clearAuthOverride = () => {
  try {
    localStorage.removeItem(AUTH_OVERRIDE_KEY);
    pushLog("Auth Override cleared.");
  } catch {
    // ignore
  }
};

export const getAuthOverride = (): string | null => {
  try {
    return localStorage.getItem(AUTH_OVERRIDE_KEY);
  } catch {
    return null;
  }
};

export const getAuthKey = (): AuthKeyState => {
  // In Vite production builds, process.env isn't real at runtime in the browser.
  // Keeping this for legacy UI display, but OpenRouter calls must go through server.mjs.
  const override = getAuthOverride();
  if (override && override.length > 10) return { source: 'OVERRIDE', key: override };
  return { source: 'MISSING' };
};

// --- JSON EXTRACTION ---
export const extractJson = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    // Try to locate JSON within text
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

// --- OPENROUTER CHAT (SERVER-SIDE PROXY ONLY) ---
export const openRouterChat = async (prompt: string, system?: string) => {
  /**
   * IMPORTANT:
   * - Never call OpenRouter directly from the browser (leaks keys + causes 401 "cookie auth" failures).
   * - Always call our server route, which attaches: Authorization: Bearer $OPENROUTER_API_KEY
   *
   * Server route expected: POST /api/openrouter/chat  (implemented in server.mjs)
   */
  try {
    const response = await fetch("/api/openrouter/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        systemInstruction: system || "You are Prospector OS. Focus on B2B growth. Output JSON.",
        model: PRIMARY_MODEL
      })
    });

    const raw = await response.text();

    if (!response.ok) {
      const statusText = response.status === 401 ? "Unauthorized (Check Key)" : `Error ${response.status}`;
      throw new Error(`OpenRouter (${statusText}): ${raw || "Gateway Fault"}`);
    }

    let data: any = {};
    try {
      data = JSON.parse(raw);
    } catch {
      // If server returned plain text, pass it through
      return raw;
    }

    return data?.choices?.[0]?.message?.content ?? "";
  } catch (e: any) {
    pushLog(`INTEL_FAULT [server]: ${e?.message || String(e)}`);
    throw e;
  }
};

// --- GOOGLE GEMINI (DIRECT) ---
// NOTE: This project uses GoogleGenAI for some internal modules; keep as-is.
const getGoogleApiKey = (): string | null => {
  try {
    // If you still use a Google key in some modules, put it in Auth Override or use your own mechanism.
    const override = getAuthOverride();
    if (override && override.startsWith("AIza")) return override;
  } catch {}
  return null;
};

export const geminiGenerate = async (prompt: string, schema?: any): Promise<GenAIResult<any>> => {
  try {
    const apiKey = getGoogleApiKey();
    if (!apiKey) {
      return { ok: false, error: "Missing Google API key for direct Gemini calls." };
    }

    const client = new GoogleGenAI({ apiKey });

    const config: any = {
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    if (schema) {
      config.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: schema
      };
    }

    const result = await client.models.generateContent(config);
    const text = result?.text ?? "";

    if (schema) {
      const parsed = extractJson(text);
      if (!parsed) return { ok: false, error: "Gemini returned non-JSON when JSON was required.", raw: text };
      return { ok: true, data: parsed, raw: text };
    }

    return { ok: true, data: text, raw: text };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Gemini fault" };
  }
};

// --- ASSET SAVE (USED BY OTHER MODULES) ---
export const saveAsset = async (
  type: AssetRecord['type'],
  title: string,
  url: string,
  module: string,
  leadId?: string,
  metadata?: any
) => {
  // This is project-specific; keep behavior unchanged if your backend endpoint exists.
  try {
    const payload: AssetRecord = {
      id: `ASSET_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type,
      title,
      url,
      module,
      leadId,
      metadata,
      createdAt: Date.now()
    };

    const res = await fetch('/api/assets/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!res || !res.ok) {
      pushLog(`ASSET_SAVE_WARN: Asset save endpoint unavailable or failed (${res?.status || 'no-res'}).`);
      return payload;
    }

    return await res.json().catch(() => payload);
  } catch (e: any) {
    pushLog(`ASSET_SAVE_FAULT: ${e.message}`);
    return null;
  }
};

// --- LEAD DISCOVERY (USES OPENROUTER VIA openRouterChat) ---
export const discoverLeads = async (
  market: string,
  city: string,
  count: number,
  niche?: string
): Promise<LeadDiscoveryResult> => {
  const prompt = `
You are an elite B2B lead discovery engine. Return ONLY valid JSON.

Task:
Generate ${count} business leads in the market: ${market}
Location: ${city}
${niche ? `Niche constraint: ${niche}` : ''}

Output JSON schema:
{
  "leads": [
    {
      "id": "LEAD_...",
      "businessName": "...",
      "niche": "...",
      "city": "...",
      "website": "...",
      "email": "...",
      "phone": "...",
      "notes": "...",
      "confidence": 0-100
    }
  ],
  "meta": { "market": "...", "city": "...", "generatedAt": "ISO" }
}
`;

  const system = `You are a market intelligence generator for B2B sales. Output STRICT JSON only.`;

  const raw = await openRouterChat(prompt, system);
  const parsed = extractJson(raw);

  if (!parsed?.leads || !Array.isArray(parsed.leads)) {
    throw new Error(`Lead discovery returned invalid JSON. Raw: ${raw?.slice(0, 500) || ''}`);
  }

  // Normalize minimal fields
  const leads: Lead[] = parsed.leads.map((l: any) => ({
    id: l.id || `LEAD_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    businessName: l.businessName || l.name || "Unknown",
    niche: l.niche || niche || market,
    city: l.city || city,
    website: l.website || "",
    email: l.email || "",
    phone: l.phone || "",
    notes: l.notes || "",
    score: typeof l.confidence === "number" ? l.confidence : 50,
    createdAt: Date.now()
  }));

  return { leads, meta: parsed.meta };
};

// --- PLACEHOLDER: BRAND IDENTITY ---
export const generateBrandIdentity = async (lead: Lead): Promise<BrandIdentity | null> => {
  try {
    const prompt = `
Return ONLY valid JSON.

Create a concise brand identity for:
Business: ${lead.businessName}
Niche: ${lead.niche}
City: ${lead.city}

Schema:
{
  "voice": "...",
  "positioning": "...",
  "offers": ["..."],
  "keywords": ["..."],
  "objections": ["..."]
}
`;
    const raw = await openRouterChat(prompt, "You are a brand strategist. Output JSON only.");
    const parsed = extractJson(raw);
    return parsed || null;
  } catch (e: any) {
    pushLog(`BRAND_ID_FAULT: ${e.message}`);
    return null;
  }
};

// --- COST TRACKING HOOK (OPTIONAL) ---
export const chargeCompute = async (credits: number, reason: string) => {
  try {
    deductCost(credits, reason);
  } catch {
    // ignore
  }
};

// --- LEGACY EXPORTS (KEEP FOR COMPAT) ---
export const OPENROUTER_MODEL = PRIMARY_MODEL;
export const OPENROUTER_ENDPOINT = OPENROUTER_URL;
