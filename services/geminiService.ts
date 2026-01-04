import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EngineResult, Lead, SubModule } from "../types";
import { trackCall } from "./computeTracker";
import { getModuleWeight } from "./creditWeights";
import {
  logAiOperation,
  uuidLike,
  UserRole,
  ModelClass,
  ReasoningDepth,
  isFounderMode,
  getAvailableCredits,
} from "./usageLogger";

export const getAI = () => {
  const apiKey =
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error(
      "SYSTEM CRITICAL: Missing API key env var. Set API_KEY (preferred) or GOOGLE_API_KEY / GEMINI_API_KEY."
    );
  }

  return new GoogleGenAI({ apiKey: apiKey || "" });
};

// --- GLOBAL SESSION STATE ---
export interface AssetRecord {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT'; // Kept for compatibility
  module?: SubModule; // Added for new logger compatibility
  title: string;
  data: string; // Base64 or URL
  timestamp: string | number; // Union for compatibility
  content?: string; // Union for compatibility
}

export const SESSION_ASSETS: AssetRecord[] = [];

export const saveAsset = (type: AssetRecord['type'], title: string, data: string) => {
  const asset: AssetRecord = {
    id: `ASSET-${Date.now().toString().slice(-6)}`,
    type,
    title,
    data,
    timestamp: new Date().toLocaleTimeString(),
    // Compatibility fields
    content: data,
    module: 'MEDIA_VAULT' as SubModule 
  };
  SESSION_ASSETS.unshift(asset); // Newest first
  pushLog(`ASSET SECURED: ${title} [${type}]`);
};

export interface SystemLogEntry {
  timestamp: number;
  message: string;
}

export interface EngineSessionState {
  leadLedger: Lead[];
  assets: AssetRecord[];
  logs: SystemLogEntry[];
  activeModule: SubModule | null;
}

export const sessionState: EngineSessionState = {
  leadLedger: [],
  assets: SESSION_ASSETS,
  logs: [],
  activeModule: null,
};

// Restore PRODUCTION_LOGS for ProdLog.tsx compatibility
export const PRODUCTION_LOGS: string[] = [];

export const pushLog = (msg: string) => {
  const time = new Date().toLocaleTimeString();
  const logMsg = `[${time}] ${msg}`;
  
  // Update old logs array
  console.log(`[SYSTEM_LOG] ${msg}`);
  PRODUCTION_LOGS.unshift(logMsg);
  if (PRODUCTION_LOGS.length > 100) PRODUCTION_LOGS.pop();

  // Update new session state
  sessionState.logs.push({ timestamp: Date.now(), message: msg });
};

// --- Utility: Extract JSON safely from model output ---
export const extractJSON = (text: string) => {
  try {
    // 1. Try finding a JSON Object
    let match = text.match(/\{[\s\S]*\}/);
    if (match) {
        try { return JSON.parse(match[0]); } catch (e) { /* continue */ }
    }
    // 2. Try finding a JSON Array
    match = text.match(/\[[\s\S]*\]/);
    if (match) {
        try { return JSON.parse(match[0]); } catch (e) { /* continue */ }
    }
    // 3. Try finding Markdown block
    match = text.match(/```json([\s\S]*)```/);
    if (match) {
        try { return JSON.parse(match[1]); } catch (e) { /* continue */ }
    }
    // 4. Raw parse attempt
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

// ===============================
// LOGGED WRAPPER (WITH ENFORCEMENT SWITCH)
// ===============================
type LoggedGenerateArgs = {
  ai: GoogleGenAI;
  module: string;
  model: string;
  modelClass: ModelClass;
  reasoningDepth: ReasoningDepth;
  isClientFacing: boolean;

  userId?: string;
  userRole?: UserRole;
  requestId?: string;
  traceId?: string;

  // Pass-through to Gemini SDK
  contents: any;
  config?: any;
};

export const loggedGenerateContent = async ({
  ai,
  module,
  model,
  modelClass,
  reasoningDepth,
  isClientFacing,
  userId,
  userRole,
  requestId,
  traceId,
  contents,
  config,
}: LoggedGenerateArgs): Promise<string> => {
  const start = Date.now();
  const moduleWeight = getModuleWeight(module);
  const effectiveWeight = moduleWeight;

  const logBase = {
    logId: uuidLike(),
    timestamp: new Date().toISOString(),
    requestId,
    traceId,
    userId: userId || "anonymous",
    userRole: userRole || "FOUNDER",
    module,
    isClientFacing,
    model,
    modelClass,
    reasoningDepth,
    moduleWeight,
    effectiveWeight,
  };

  // --- MONETIZATION GATE ---
  // Only enforce limits if NOT in Founder Mode
  if (!isFounderMode()) {
    const currentBalance = getAvailableCredits(userId || "anonymous");
    if (currentBalance < effectiveWeight) {
      const errorMsg = `CREDIT_LIMIT_EXCEEDED: Required ${effectiveWeight}, Available ${currentBalance}`;
      
      await logAiOperation({
        ...logBase,
        latencyMs: 0,
        status: "FAILURE",
        errorMessage: errorMsg,
      });

      pushLog(`[AI_USAGE] BLOCKED: ${module} (${effectiveWeight} credits needed)`);
      throw new Error(errorMsg);
    }
  }
  // -------------------------

  try {
    const resp = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const latencyMs = Date.now() - start;

    await logAiOperation({
      ...logBase,
      latencyMs,
      status: "SUCCESS",
    });

    pushLog(`[AI_USAGE] ${module} (${modelClass}) ${latencyMs}ms | W:${effectiveWeight}`);

    const text = resp.text || "";
    // Maintain UI tracking compatibility
    trackCall(model, text.length + 100);
    
    return text;
  } catch (e: any) {
    const latencyMs = Date.now() - start;

    await logAiOperation({
      ...logBase,
      latencyMs,
      status: "FAILURE",
      errorMessage: e?.message || String(e),
    });

    pushLog(`[AI_USAGE] ${module} (${modelClass}) FAIL ${latencyMs}ms | W:${effectiveWeight} | ${e?.message || String(e)}`);

    throw e;
  }
};

// --- DATA MODELS ---
export interface StackItem {
  label: string;
  description: string;
}
export interface BenchmarkReport {
  entityName: string;
  missionSummary: string;
  visualStack: StackItem[];
  socialStack: StackItem[];
  techStack: StackItem[];
  funnelStack: StackItem[];
  contentStack: StackItem[];
  sonicStack: StackItem[];
  deepArchitecture: string;
  sources: Array<{ title: string; uri: string }>;
  featureGap: string;
  businessModel: string;
  designSystem: string;
}

// --- CORE: LIVE INTEL / BENCHMARK ---
export const fetchLiveIntel = async (
  lead: Lead,
  moduleType: string
): Promise<BenchmarkReport> => {
  pushLog(`ENGAGING MODULE: ${moduleType} for ${lead.businessName}`);
  const ai = getAI();
  const model = "gemini-3-pro-preview";

  const prompt = `
You are the Lead Reverse-Engineer for a high-end AI Technical Agency.

TARGET ENTITY: "${lead.businessName}"
TARGET URL: "${lead.websiteUrl}"
MODULE: "${moduleType}"

OBJECTIVE:
Reverse-engineer the business’s public web presence and infer:
- Brand positioning & mission
- Visual strengths & weaknesses
- Social presence (frequency, quality, reach)
- Tech stack & platform signals
- Funnel structure & conversion posture
- Content engine maturity
- Sonic / audio signals if any (podcasts, voice branding)
- Deep architecture: infer underlying growth logic and hidden operational layers

RULES:
- Use Google Search grounding to cite sources when relevant.
- Be concise but high signal.
- Return structured JSON exactly matching the schema.

SCHEMA:
{
  "entityName": "string",
  "missionSummary": "string",
  "visualStack": [{ "label":"string","description":"string" }],
  "socialStack": [{ "label":"string","description":"string" }],
  "techStack": [{ "label":"string","description":"string" }],
  "funnelStack": [{ "label":"string","description":"string" }],
  "contentStack": [{ "label":"string","description":"string" }],
  "sonicStack": [{ "label":"string","description":"string" }],
  "featureGap": "string",
  "businessModel": "string",
  "designSystem": "string",
  "deepArchitecture": "string",
  "sources": [{ "title":"string","uri":"string" }]
}
`;

  const text = await loggedGenerateContent({
    ai,
    module: "BENCHMARK",
    model,
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
    },
  });

  const data = extractJSON(text || "{}") || {};
  const rawData = data as any;

  const normalizeStack = (arr: any[]): StackItem[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(Boolean)
      .map((x) => ({
        label: String(x.label || x.title || "Signal"),
        description: String(x.description || x.detail || "No description provided."),
      }));
  };

  return {
    entityName: rawData.entityName || lead.businessName,
    missionSummary: rawData.missionSummary || "No summary generated.",
    visualStack: normalizeStack(rawData.visualStack),
    socialStack: normalizeStack(rawData.socialStack),
    techStack: normalizeStack(rawData.techStack),
    funnelStack: normalizeStack(rawData.funnelStack),
    contentStack: normalizeStack(rawData.contentStack),
    sonicStack: normalizeStack(rawData.sonicStack),
    featureGap: rawData.featureGap || "Tactical gap analysis pending.",
    businessModel: rawData.businessModel || "Analysis in progress.",
    designSystem: rawData.designSystem || "Audit pending.",
    deepArchitecture: rawData.deepArchitecture || "Analyzing deep-layer protocols...",
    sources: Array.isArray(rawData.sources) ? rawData.sources : [],
  };
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => fetchLiveIntel(lead, "BENCHMARK");

// --- GENERAL FLASH PROMPT NODE ---
export const runFlashPrompt = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const text = await loggedGenerateContent({
    ai,
    module: "PROMPT_AI",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "LOW",
    isClientFacing: true,
    contents: prompt,
  });
  return text || "No response.";
};

// --- UPGRADED INTELLIGENCE NODES (LEVEL 5) ---

// 1. VIDEO_AI: Pro + Search Grounding (real evidence)
export const critiqueVideoPresence = async (lead: Lead): Promise<string> => {
  const ai = getAI();

  const prompt = `
You are a senior performance creative strategist and video marketing auditor for a high-end growth agency.

TASK:
Conduct a deep audit of the business's current video presence and its conversion posture. Use Google Search grounding to find real evidence.

BUSINESS:
- Name: ${lead.businessName}
- Website: ${lead.websiteUrl}
- Niche: ${lead.niche}
- City: ${lead.city}
- Known handles (may be empty): IG=${lead.instagram || "N/A"} | TikTok=${lead.tiktok || "N/A"} | YouTube=${lead.youtube || "N/A"}

REQUIREMENTS:
1) Find their actual short-form and long-form video footprint (TikTok/Reels/YouTube) to provide a verified critique.
2) Summarize what exists today: frequency, format, hooks, production quality, CTA style, and content pillars.
3) Identify conversion gaps: weak hooks, missing CTAs, poor targeting, no offer, no proof, inconsistent brand tone, etc.
4) Identify competitive contrast: what competitors in their niche are doing that they are not.
5) Produce a practical 14-day action plan with:
   - Content pillars (3–5)
   - Hook formulas (at least 10 examples)
   - CTA/offer suggestions
   - Posting cadence
   - Suggested filming/editing style guidelines

OUTPUT FORMAT:
- Evidence (bulleted list with sources)
- Audit Summary (tight)
- Conversion Failures (bullets)
- Competitive Gaps (bullets)
- 14-Day Action Plan (numbered)
- 10 Hook Examples (bulleted)
`;

  const text = await loggedGenerateContent({
    ai,
    module: "VIDEO_AI",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return text || "Audit failed.";
};

// 2. ARTICLE_INTEL: Pro + Search for Executive Synthesis
export const synthesizeArticle = async (
  source: string,
  mode: string
): Promise<string> => {
  const ai = getAI();

  const prompt = `
You are an executive research analyst for a growth and lead-intelligence system.

INPUT:
- Source: ${source}
- Mode: ${mode}

TASK:
1) If the source is a URL, use Google Search grounding to validate and cross-reference.
2) Produce executive-level synthesis that can be used to sell a strategic retainer:
   - Key claims and what matters commercially
   - Competitive implications / "so what?"
   - How to weaponize this intel for outbound messaging
   - 3 angles to position our agency as the solution

OUTPUT:
- Executive Summary (5–8 bullets)
- Commercial Implications (bullets)
- Outreach Angles (3)
- Recommended Next Actions (5 bullets)
`;

  const text = await loggedGenerateContent({
    ai,
    module: "ARTICLE_INTEL",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "MEDIUM",
    isClientFacing: true,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return text || "Failed.";
};

// 3. DECK_ARCH: Pro + increased thinking budget (persuasive slide logic)
export const architectPitchDeck = async (lead: Lead): Promise<any[]> => {
  const ai = getAI();

  const prompt = `
You are a sales-deck narrative architect for a premium AI marketing agency.

CLIENT / TARGET:
- Business: ${lead.businessName}
- Website: ${lead.websiteUrl}
- Niche: ${lead.niche}
- City: ${lead.city}
- Social Gap: ${lead.socialGap}
- Visual Proof: ${lead.visualProof}
- Best Angle: ${lead.bestAngle}
- Personalized Hook: ${lead.personalizedHook}

TASK:
Architect a 5-slide deck that is psychologically persuasive and logically sequenced.
Focus on: problem framing → proof → solution → plan → offer/CTA.

OUTPUT REQUIREMENTS:
Return VALID JSON array exactly like:
[
  {
    "title": "Slide title",
    "narrativeGoal": "What this slide must accomplish psychologically",
    "keyVisuals": ["visual idea 1", "visual idea 2"],
    "bullets": ["bullet 1", "bullet 2", "bullet 3"]
  }
]

RULES:
- No markdown. JSON only.
- Keep bullets concrete and client-specific.
`;

  const text = await loggedGenerateContent({
    ai,
    module: "DECK_ARCH",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 4000 } },
  });

  return extractJSON(text || "[]") || [];
};

// 4. SEQUENCER: Pro + thinking budget (high-EQ conversion copy)
export const generateOutreachSequence = async (lead: Lead): Promise<any[]> => {
  const ai = getAI();

  const prompt = `
You are an elite outbound copywriter and sales sequence strategist.

TARGET:
- Business: ${lead.businessName}
- Website: ${lead.websiteUrl}
- Niche: ${lead.niche}
- City: ${lead.city}
- Asset Grade: ${lead.assetGrade}
- Social Gap: ${lead.socialGap}
- Best Angle: ${lead.bestAngle}
- Personalized Hook: ${lead.personalizedHook}

TASK:
Design a 5-day multi-channel outreach sequence that is respectful, high-EQ, and value-forward.
Channels may include: Email, LinkedIn, Phone, SMS (choose what makes sense).

REQUIREMENTS:
- Day-by-day plan
- Each step must have: channel, purpose, message content
- Include a micro-offer (audit, teardown, quick win) and a clear CTA to book a call

OUTPUT:
Return VALID JSON array exactly like:
[
  { "day": 1, "channel": "Email", "purpose": "Why this message exists", "content": "Full message text" },
  ...
]

RULES:
- No markdown. JSON only.
- Keep it specific to the lead.
`;

  const text = await loggedGenerateContent({
    ai,
    module: "SEQUENCER",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 4000 } },
  });

  return extractJSON(text || "[]") || [];
};

// 5. FUNNEL_MAP: Pro + thinking budget (conversion architecture)
export const architectFunnel = async (lead: Lead): Promise<any[]> => {
  const ai = getAI();

  const prompt = `
You are a conversion architect designing a premium lead-to-cash funnel for a service business.

BUSINESS:
- Name: ${lead.businessName}
- Website: ${lead.websiteUrl}
- Niche: ${lead.niche}
- City: ${lead.city}
- Asset Grade: ${lead.assetGrade}
- Social Gap: ${lead.socialGap}
- Visual Proof: ${lead.visualProof}

TASK:
Design a 4-stage funnel with clear conversion goals and deliverables.
Example stages: Ad/Hook → Landing/VSL → Offer/Checkout → Follow-up/Upsell.
Tailor to the niche and local context.

OUTPUT:
Return VALID JSON array exactly like:
[
  { "stage": 1, "title": "Stage title", "description": "What happens here", "conversionGoal": "What we measure" },
  ...
]

RULES:
- No markdown. JSON only.
- Make it implementable.
`;

  const text = await loggedGenerateContent({
    ai,
    module: "FUNNEL_MAP",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: prompt,
    config: { 
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json" 
    },
  });

  return extractJSON(text || "[]") || [];
};

// 6. ROI_CALC: Pro for financial persuasion
export const generateROIReport = async (
  ltv: number,
  volume: number,
  conv: number
): Promise<string> => {
  pushLog("GENERATING ROI NARRATIVE (PRO)...");
  const ai = getAI();
  try {
    const revenue = volume * (conv / 100) * ltv;

    const text = await loggedGenerateContent({
      ai,
      module: "ROI_CALC",
      model: "gemini-3-pro-preview",
      modelClass: "PRO",
      reasoningDepth: "MEDIUM",
      isClientFacing: true,
      contents: `Act as a Chief Financial Officer for an AI Agency.
Data:
- Client LTV: $${ltv}
- Monthly Lead Volume: ${volume}
- AI Conversion Lift: ${conv}%
- Projected Monthly Revenue Increase: $${revenue.toFixed(2)}

Write a persuasive, executive-level summary explaining WHY this AI implementation is a "no-brainer" investment.
Use psychological anchoring. Focus on the cost of inaction vs. compound growth.
Keep it under 250 words.`,
    });

    return text || "ROI report failed.";
  } catch (e) {
    console.error(e);
    return "ROI report failed.";
  }
};

// 7. ANALYTICS_HUB: Ledger insight (Flash is fine)
export const analyzeLedger = async (
  leads: Lead[]
): Promise<{ risk: string; opportunity: string }> => {
  pushLog("ANALYZING LEDGER DATA...");
  const ai = getAI();

  try {
    const summary = leads
      .slice(0, 25)
      .map(
        (l) =>
          `${l.businessName} (${l.niche} in ${l.city}) - Score: ${l.leadScore} - Grade: ${l.assetGrade} - SocialGap: ${l.socialGap}`
      )
      .join("\n");

    const text = await loggedGenerateContent({
      ai,
      module: "ANALYTICS_HUB",
      model: "gemini-3-flash-preview",
      modelClass: "FLASH",
      reasoningDepth: "LOW",
      isClientFacing: true,
      contents: `Analyze this list of sales leads and provide 2 distinct, punchy insights.

LEADS:
${summary}

OUTPUT JSON EXACTLY:
{
  "risk": "A short, sharp warning about market saturation, lead quality, or hidden risk inferred from the list.",
  "opportunity": "A short, sharp, specific angle or opportunity to attack this list and convert."
}
`,
      config: { responseMimeType: "application/json" },
    });

    return JSON.parse(
      text || '{"risk":"Data insufficient.","opportunity":"Gather more intel."}'
    );
  } catch (e) {
    console.error(e);
    return { risk: "Ledger Analysis Failed", opportunity: "Retry analysis." };
  }
};

// 8. RESTORED FUNCTIONS FOR COMPATIBILITY

export const generateLeads = async (region: string, nicheHint: string, count: number = 6): Promise<EngineResult> => {
  pushLog(`INITIATING DISCOVERY SCAN: ${region} / ${nicheHint}`);
  const ai = getAI();
  const model = "gemini-3-flash-preview"; 
  
  const prompt = `Search for and identify EXACTLY ${count} REAL businesses in ${region} focusing on ${nicheHint || 'high-end niches'}. 
  CRITICAL: You must find REAL businesses with REAL names (e.g. "Acme Corp", "Smith & Associates"). DO NOT return "Unidentified Target".
  Assess their "Social Gap" (difference between visual quality and social presence).`;

  try {
    const text = await loggedGenerateContent({
      ai,
      module: "RADAR_RECON",
      model,
      modelClass: "FLASH",
      reasoningDepth: "LOW",
      isClientFacing: true,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leads: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.NUMBER },
                  businessName: { type: Type.STRING },
                  websiteUrl: { type: Type.STRING },
                  niche: { type: Type.STRING },
                  city: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  email: { type: Type.STRING },
                  leadScore: { type: Type.NUMBER },
                  assetGrade: { type: Type.STRING, enum: ["A", "B", "C"] },
                  socialGap: { type: Type.STRING },
                  visualProof: { type: Type.STRING },
                  bestAngle: { type: Type.STRING },
                  personalizedHook: { type: Type.STRING }
                },
                required: ["businessName", "assetGrade", "leadScore", "socialGap"]
              }
            },
            rubric: { type: Type.OBJECT, properties: { visual: {type: Type.STRING}, social: {type: Type.STRING}, highTicket: {type: Type.STRING}, reachability: {type: Type.STRING}, grades: { type: Type.OBJECT, properties: { A: {type: Type.STRING}, B: {type: Type.STRING}, C: {type: Type.STRING} } } } },
            assets: { type: Type.OBJECT, properties: { emailOpeners: {type: Type.ARRAY, items: {type: Type.STRING}}, fullEmail: {type: Type.STRING}, callOpener: {type: Type.STRING}, voicemail: {type: Type.STRING}, smsFollowup: {type: Type.STRING} } }
          }
        }
      }
    });

    const result = JSON.parse(text || "{}");
    
    // SAFETY FALLBACK: Ensure no "Unidentified Target" slips through
    if (result.leads) {
      result.leads = result.leads.map((l: any, i: number) => ({
        ...l,
        businessName: l.businessName && l.businessName !== "UNIDENTIFIED_TARGET" ? l.businessName : `High-Value Prospect ${i+1}`,
        id: `gen-${Date.now()}-${i}`
      }));
    }

    return result;
  } catch (error) {
    pushLog(`DISCOVERY_FAILURE: ${error instanceof Error ? error.message : 'API Node Failure'}`);
    throw error;
  }
};

export const identifySubRegions = async (theater: string): Promise<string[]> => {
  const ai = getAI();
  const prompt = `Identify 6 distinct, high-value commercial cities or districts within the region "${theater}" that would be suitable for B2B prospecting. Return ONLY a JSON array of strings.`;
  
  try {
    const text = await loggedGenerateContent({
      ai,
      module: "AUTO_CRAWL",
      model: "gemini-3-flash-preview",
      modelClass: "FLASH",
      reasoningDepth: "LOW",
      isClientFacing: true,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(text || "[]");
  } catch (e) {
    pushLog("SUB_REGION_IDENTIFICATION_FAILED. Defaulting to single sector.");
    return [theater];
  }
};

export const crawlTheaterSignals = async (subRegion: string, signal: string): Promise<Lead[]> => {
  pushLog(`CRAWLING SUB-SECTOR: ${subRegion} for ${signal}`);
  const ai = getAI();
  
  const prompt = `
    Act as a lead generation scout. 
    Find 5 REAL businesses in "${subRegion}" that match this vulnerability signal: "${signal}".
    CRITICAL: Return valid JSON.
  `;

  try {
    const text = await loggedGenerateContent({
      ai,
      module: "AUTO_CRAWL",
      model: "gemini-3-flash-preview",
      modelClass: "FLASH",
      reasoningDepth: "LOW",
      isClientFacing: true,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              businessName: { type: Type.STRING },
              niche: { type: Type.STRING },
              city: { type: Type.STRING },
              assetGrade: { type: Type.STRING, enum: ["A", "B", "C"] },
              vulnerabilityContext: { type: Type.STRING },
              websiteUrl: { type: Type.STRING }
            },
            required: ["businessName", "niche", "city", "assetGrade"]
          }
        }
      }
    });

    const rawLeads = JSON.parse(text || "[]");
    
    return rawLeads.map((l: any, i: number) => ({
      id: `CRAWL-${subRegion.replace(/\s/g, '')}-${Date.now()}-${i}`,
      rank: i + 1,
      status: 'cold',
      businessName: l.businessName || "Unknown Target",
      niche: l.niche || "General",
      city: l.city || subRegion,
      assetGrade: l.assetGrade || "C",
      socialGap: l.vulnerabilityContext || signal,
      websiteUrl: l.websiteUrl || "#",
      leadScore: Math.floor(Math.random() * (95 - 75) + 75),
      visualProof: "Pending scan...",
      bestAngle: "Pending analysis...",
      personalizedHook: "Pending synthesis...",
      phone: "Pending...",
      email: "Pending..."
    }));
  } catch (error) {
    pushLog(`CRAWL_FAILURE [${subRegion}]: ${error instanceof Error ? error.message : 'Unknown'}`);
    return [];
  }
};

export const fetchViralPulseData = async (niche: string): Promise<any[]> => {
  const ai = getAI();
  const text = await loggedGenerateContent({
    ai,
    module: "VIRAL_PULSE",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "LOW",
    isClientFacing: true,
    contents: `Trending marketing topics for ${niche}. Return JSON [{label, val, type}].`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return extractJSON(text || "[]") || [];
};

export const fetchTokenStats = async (): Promise<any> => ({ balance: 4250000, consumed: 1420500, recentOps: [{ id: 'T-99', cost: 1200, op: 'VEO_FORGE' }, { id: 'T-98', cost: 450, op: 'RADAR_SCAN' }] });
export const fetchBillingStats = async (): Promise<any> => ({ tokenUsage: 1420500, estimatedCost: 12.45, projectedRevenueLift: 154000, activeTheaters: 4 });

export const testModelPerformance = async (modelName: string, prompt: string): Promise<string> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "MODEL_TEST",
    model: modelName,
    modelClass: "OTHER",
    reasoningDepth: "LOW",
    isClientFacing: false,
    contents: prompt
  });
  return text || "No response."; 
};

export const translateTactical = async (text: string, targetLang: string): Promise<string> => { 
  const ai = getAI(); 
  const res = await loggedGenerateContent({
    ai,
    module: "TRANSLATOR",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "LOW",
    isClientFacing: true,
    contents: `Translate: ${text} to ${targetLang}`
  });
  return res || "Failed."; 
};

export const generateNurtureDialogue = async (lead: Lead, scenario: string): Promise<any[]> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "AI_CONCIERGE",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "LOW",
    isClientFacing: true,
    contents: `Chat scenario for ${lead.businessName}. Return JSON [{role, text}].`
  });
  return extractJSON(text || "[]") || []; 
};

export const generateMotionLabConcept = async (lead: Lead): Promise<any> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "MOTION_LAB",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "MEDIUM",
    isClientFacing: true,
    contents: `Storyboard for ${lead.businessName}. Return JSON {title, hook, scenes:[{time, visual, text}]}.`
  });
  return extractJSON(text || "{}") || {}; 
};

export const generateFlashSparks = async (lead: Lead): Promise<string[]> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "FLASH_SPARK",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "LOW",
    isClientFacing: true,
    contents: `6 hooks for ${lead.businessName}. Return JSON array strings.`
  });
  return extractJSON(text || "[]") || []; 
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number): Promise<string> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "DEMO_SANDBOX",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: `ROI for ${lead.businessName} (LTV:${ltv}, Vol:${volume}).`,
    config: { thinkingConfig: { thinkingBudget: 16000 } }
  });
  return text || "Error."; 
};

export const performFactCheck = async (lead: Lead, claim: string): Promise<any> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "FACT_CHECK",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "MEDIUM",
    isClientFacing: true,
    contents: `Fact check "${claim}" for ${lead.businessName}. Return JSON {status, evidence, sources: [{title, uri}]}.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return extractJSON(text || "{}") || {}; 
};

export const synthesizeProduct = async (lead: Lead): Promise<any> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "PRODUCT_SYNTH",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: `Product for ${lead.businessName}. Return JSON {productName, tagline, pricePoint, features: []}.`,
    config: { thinkingConfig: { thinkingBudget: 16000 } }
  });
  return extractJSON(text || "{}") || {}; 
};

export const generatePitch = async (lead: Lead): Promise<string> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "PITCH_GEN",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "MEDIUM",
    isClientFacing: true,
    contents: `30s pitch for ${lead.businessName}.`,
    config: { thinkingConfig: { thinkingBudget: 16000 } }
  });
  return text || "Error."; 
};

export const generateProposalDraft = async (lead: Lead): Promise<string> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "PROPOSALS",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: `Proposal for ${lead.businessName}.`,
    config: { thinkingConfig: { thinkingBudget: 32000 } }
  });
  return text || "Error."; 
};

export const generateMockup = async (businessName: string, niche: string): Promise<string> => { 
  const ai = getAI(); 
  // Wrapper usage for Image (generateContent)
  try {
    const text = await loggedGenerateContent({
      ai,
      module: "MOCKUPS_4K",
      model: "gemini-2.5-flash-image",
      modelClass: "FLASH", // or OTHER
      reasoningDepth: "LOW",
      isClientFacing: true,
      contents: { parts: [{ text: `4k website mockup for ${businessName} (${niche})` }] }
    });
    //loggedGenerateContent returns text, but we need image parts. 
    // Wait, loggedGenerateContent returns resp.text. 
    // For images, we need to inspect the response object directly. 
    // Limitation of wrapper: it returns string. 
    // Fallback: Use raw call for image generation if wrapper only returns text.
    // BUT we must log. 
    // Let's just do a raw call + manual log here to handle the binary response properly.
    
    // Re-do raw call
    const resp = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ text: `4k website mockup for ${businessName} (${niche})` }] } 
    });
    const part = resp.candidates?.[0]?.content?.parts?.find(p => p.inlineData); 
    const data = part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : "";
    
    // Log manually
    await logAiOperation({
        logId: uuidLike(),
        timestamp: new Date().toISOString(),
        userId: "anonymous", userRole: "FOUNDER",
        module: "MOCKUPS_4K",
        isClientFacing: true,
        model: "gemini-2.5-flash-image", modelClass: "FLASH", reasoningDepth: "LOW",
        moduleWeight: getModuleWeight("MOCKUPS_4K"), effectiveWeight: getModuleWeight("MOCKUPS_4K"),
        latencyMs: 0, status: "SUCCESS"
    });
    
    return data;
  } catch (e) {
      console.error(e);
      return "";
  }
};

export const generateVideoPayload = async (prompt: string): Promise<string> => { 
  const ai = getAI(); 
  let op = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt }); 
  
  // Manual Log Start
  logAiOperation({
    logId: uuidLike(), timestamp: new Date().toISOString(), userId: "anonymous", userRole: "FOUNDER",
    module: "VIDEO_PITCH", isClientFacing: true, model: "veo-3.1-fast-generate-preview", modelClass: "PRO", reasoningDepth: "HIGH",
    moduleWeight: getModuleWeight("VIDEO_AI"), effectiveWeight: getModuleWeight("VIDEO_AI"), latencyMs: 0, status: "SUCCESS"
  });

  while (!op.done) { 
    await new Promise(r => setTimeout(r, 10000)); 
    op = await ai.operations.getVideosOperation({ operation: op }); 
  } 
  return (op.response?.generatedVideos?.[0]?.video?.uri ?? '') + `&key=${process.env.API_KEY}`; 
};

export const generateAudioPitch = async (text: string, voice: string = 'Kore'): Promise<string> => { 
  const ai = getAI(); 
  // Raw call because wrapper returns text, we need binary parts
  const resp = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text }] }], 
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } 
  });
  
  logAiOperation({
    logId: uuidLike(), timestamp: new Date().toISOString(), userId: "anonymous", userRole: "FOUNDER",
    module: "SONIC_STUDIO", isClientFacing: true, model: "gemini-2.5-flash-preview-tts", modelClass: "FLASH", reasoningDepth: "LOW",
    moduleWeight: getModuleWeight("SONIC_STUDIO"), effectiveWeight: getModuleWeight("SONIC_STUDIO"), latencyMs: 0, status: "SUCCESS"
  });

  return resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || ""; 
};

export const generateTaskMatrix = async (lead: Lead): Promise<any[]> => { 
  const ai = getAI(); 
  const text = await loggedGenerateContent({
    ai,
    module: "TASKS",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "LOW",
    isClientFacing: true,
    contents: `Tasks for ${lead.businessName}. Return JSON [{id, task, status}].`
  });
  return extractJSON(text || "[]") || []; 
};

export const analyzeVisual = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  pushLog("ANALYZING VISUAL ASSET...");
  const ai = getAI();
  const model = "gemini-3-pro-preview";
  
  const text = await loggedGenerateContent({
    ai,
    module: "VISION_LAB",
    model,
    modelClass: "PRO",
    reasoningDepth: "MEDIUM",
    isClientFacing: true,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: `ACT AS A SENIOR DATA ANALYST. ${prompt}` }
      ]
    }
  });
  return text || "Visual analysis failed.";
};

export const generateVisual = async (prompt: string): Promise<string> => {
  pushLog("GENERATING ASSET (IMAGEN)...");
  const ai = getAI();
  const model = "gemini-2.5-flash-image";
  
  // Raw call to get binary
  try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] }
      });
      
      logAiOperation({
        logId: uuidLike(), timestamp: new Date().toISOString(), userId: "anonymous", userRole: "FOUNDER",
        module: "VISUAL_STUDIO", isClientFacing: true, model, modelClass: "FLASH", reasoningDepth: "LOW",
        moduleWeight: getModuleWeight("VISUAL_STUDIO"), effectiveWeight: getModuleWeight("VISUAL_STUDIO"), latencyMs: 0, status: "SUCCESS"
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("No image data returned");
  } catch(e) {
      console.error(e);
      return "";
  }
};

export const analyzeVideoUrl = async (url: string, prompt: string): Promise<string> => {
  pushLog(`ANALYZING VIDEO URL: ${url}`);
  const ai = getAI();
  
  const text = await loggedGenerateContent({
    ai,
    module: "CINEMA_INTEL",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: `Analyze this video URL: ${url}. \n\nMission: ${prompt}\n\nUse Google Search Grounding to find metadata, transcripts, or summaries of this video to perform the analysis.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return text || "Video analysis unavailable.";
};

export const generateAgencyIdentity = async (niche: string, region: string): Promise<any> => {
  pushLog(`FORGING AGENCY IDENTITY FOR ${niche} IN ${region}`);
  const ai = getAI();
  
  const text = await loggedGenerateContent({
    ai,
    module: "IDENTITY",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "LOW",
    isClientFacing: true,
    contents: `Create a high-end, futuristic AI Agency Brand Identity targeting ${niche} in ${region}.
  Return valid JSON: { "name": "Name", "tagline": "Tagline", "manifesto": "Short manifesto", "colors": ["Hex1", "Hex2"] }`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(text || "{}");
};

export const generatePlaybookStrategy = async (theater: string): Promise<any> => {
  pushLog(`ARCHITECTING PLAYBOOK FOR ${theater}`);
  const ai = getAI();
  
  const text = await loggedGenerateContent({
    ai,
    module: "PLAYBOOK",
    model: "gemini-3-pro-preview",
    modelClass: "PRO",
    reasoningDepth: "HIGH",
    isClientFacing: true,
    contents: `Write a 3-step high-ticket AI sales playbook for the ${theater} market.
  Return valid JSON: { "strategyName": "Title", "steps": [{ "title": "Step 1", "tactic": "Detail" }, ...] }`,
    config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 8000 }
    }
  });
  return JSON.parse(text || "{}");
};

export const generateAffiliateProgram = async (niche: string): Promise<any> => {
  pushLog(`ARCHITECTING AFFILIATE MATRIX FOR ${niche}`);
  const ai = getAI();
  
  const text = await loggedGenerateContent({
    ai,
    module: "AFFILIATE",
    model: "gemini-3-flash-preview",
    modelClass: "FLASH",
    reasoningDepth: "LOW",
    isClientFacing: true,
    contents: `Create a 3-tier Affiliate Partner Structure for an AI agency in the ${niche} niche.
  Return valid JSON: { 
    "programName": "Name", 
    "tiers": [{ "name": "Tier 1", "commission": "10%", "requirement": "Requirement" }],
    "recruitScript": "Short email to recruit partners"
  }`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(text || "{}");
};