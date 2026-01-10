import { Lead } from '../../types';
import { loggedGenerateContent, getAI } from '../geminiService';
import { safeJsonParse, validateKeys } from './jsonGuard';

/**
 * PROSPECTOR OS VERSION 3
 * Intelligence Agent Protocols - HARDENED JSON + SAFETY GUARDRAILS
 */

export interface RunContext {
  identity_strict: boolean;
  compliance_mode: 'standard' | 'regulated';
  lead_evidence_level: 'high' | 'low';
}

const getSafetyInstruction = (ctx: RunContext) => `
${ctx.identity_strict ? 'STRICT IDENTITY MODE ENABLED: Business identity is NOT fully confirmed. You MUST forbid making definitive claims. Require "inference labeling" for all output (e.g. "Projected", "Likely", "Assumed").' : ''}
${ctx.compliance_mode === 'regulated' ? 'REGULATED COMPLIANCE MODE ENABLED: Target is in a sensitive industry (Medical/Health/Legal/Finance). You MUST avoid any health claims, clinical promises, or financial guarantees. Focus exclusively on technical marketing infrastructure and efficiency.' : ''}
${ctx.lead_evidence_level === 'low' ? 'LOW EVIDENCE WARNING: Source data is extremely sparse. Prioritize factual discovery and "probabilistic outreach" over specific strategic claims.' : ''}
`;

const SYSTEM_BOOTSTRAP = `
You are Prospector OS Version 3.
You are not a chatbot. You are an intelligence engine.

GLOBAL RULES:
- Output ONLY valid JSON.
- No markdown, commentary, or summaries.
- Separate FACT from INFERENCE.
- If data is missing, infer cautiously and label it.
- Do not invent sources or URLs.
`;

/**
 * HARDENED HELPER: Executes a prompt with a Retry-Repair-Fail loop.
 */
async function guardedGenerate<T>(
  module: string,
  model: string,
  prompt: string,
  requiredKeys: string[],
  ctx: RunContext,
  reasoning: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
  tools: any[] = []
): Promise<{ data: T; raw: string }> {
  let ai;
  try {
    ai = getAI();
  } catch (e: any) {
    // Crucial: Throw an error that the orchestrator catch block will recognize
    throw new Error(e.message || "API_KEY_REQUIRED");
  }

  let lastRaw = "";
  const finalPrompt = `${getSafetyInstruction(ctx)}\n\n${prompt}`;

  // ATTEMPT 1: Normal execution
  try {
    lastRaw = await loggedGenerateContent({
      ai, module, model, modelClass: model.includes('pro') ? 'PRO' : 'FLASH',
      reasoningDepth: reasoning, isClientFacing: false,
      contents: finalPrompt,
      config: { systemInstruction: SYSTEM_BOOTSTRAP, responseMimeType: 'application/json', tools }
    });
    const parsed = safeJsonParse<T>(lastRaw);
    if (parsed.ok) {
      const validation = validateKeys(parsed.value, requiredKeys);
      if (validation.ok) return { data: parsed.value!, raw: lastRaw };
    }
  } catch (e: any) {
    console.error(`[GuardedGenerate] Attempt 1 Failed for ${module}:`, e.message);
    if (e.message?.includes('API_KEY')) throw e; // Pass through key errors
  }

  // ATTEMPT 2: Instruction-heavy retry
  try {
    lastRaw = await loggedGenerateContent({
      ai, module: `${module}_RETRY`, model, modelClass: model.includes('pro') ? 'PRO' : 'FLASH',
      reasoningDepth: reasoning, isClientFacing: false,
      contents: `${finalPrompt}\n\nIMPORTANT: RETURN JSON ONLY. DO NOT INCLUDE ANY OTHER TEXT OR NARRATION.`,
      config: { systemInstruction: SYSTEM_BOOTSTRAP, responseMimeType: 'application/json', tools }
    });
    const parsed = safeJsonParse<T>(lastRaw);
    if (parsed.ok) {
      const validation = validateKeys(parsed.value, requiredKeys);
      if (validation.ok) return { data: parsed.value!, raw: lastRaw };
    }
  } catch (e: any) {
     console.error(`[GuardedGenerate] Attempt 2 Failed for ${module}:`, e.message);
  }

  // ATTEMPT 3: Specific repair prompt
  const repairPrompt = `Fix the following output to match the required JSON schema exactly. Return JSON only.
  
  REQUIRED KEYS: [${requiredKeys.join(', ')}]
  
  FAULTY OUTPUT:
  ${lastRaw}
  
  RETURN REPAIRED JSON ONLY:`;

  try {
    lastRaw = await loggedGenerateContent({
      ai, module: `${module}_REPAIR`, model: 'gemini-3-flash-preview', modelClass: 'FLASH',
      reasoningDepth: 'LOW', isClientFacing: false,
      contents: repairPrompt,
      config: { systemInstruction: SYSTEM_BOOTSTRAP, responseMimeType: 'application/json' }
    });

    const finalParsed = safeJsonParse<T>(lastRaw);
    if (finalParsed.ok) {
      const validation = validateKeys(finalParsed.value, requiredKeys);
      if (validation.ok) {
        return { data: finalParsed.value!, raw: lastRaw };
      } else {
        throw new Error(`Schema validation failed after repair for ${module}`);
      }
    }
  } catch (e: any) {
    console.error(`[GuardedGenerate] Repair Failed for ${module}:`, e.message);
  }

  // Final failure fallback
  throw new Error(`Exhausted all recovery attempts for ${module}. Check raw logs.`);
}

export const Steps = {
  resolveLead: async (lead: Lead, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Lead Resolution Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Normalize lead identity. INPUT: ${JSON.stringify(lead)}. OUTPUT: JSON { "resolved_lead": { "business_name": "", "business_confirmed": boolean, "industry_classification": "" }, "fact_vs_inference": { "confirmed_facts": [], "assumed_facts": [] } }`;
    return guardedGenerate('RESOLVE_LEAD', 'gemini-3-pro-preview', prompt, ['resolved_lead.business_confirmed'], ctx);
  },

  deepResearch: async (resolvedData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Deep Research Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Factual discovery and business confirmation. INPUT: ${JSON.stringify(resolvedData)}. OUTPUT: JSON { "identity_resolution": { "business_confirmed": boolean }, "digital_footprint": { "website_status": "", "social_presence": [], "evidence_score": 0 }, "competitors": [] }`;
    return guardedGenerate('DEEP_RESEARCH', 'gemini-3-pro-preview', prompt, ['identity_resolution.business_confirmed', 'digital_footprint'], ctx, 'HIGH', [{ googleSearch: {} }]);
  },

  generateDeepResearchLite: async (resolvedData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Deep Research Agent (LITE MODE).
    TASK: Compact factual discovery and business confirmation.
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    
    INPUT: ${JSON.stringify(resolvedData)}
    OUTPUT: JSON { 
      "identity_resolution": { "business_confirmed": boolean }, 
      "digital_footprint": { 
        "market_context": [], 
        "evidence": [] 
      }, 
      "competitors": [] 
    }`;
    return guardedGenerate('DEEP_RESEARCH_LITE', 'gemini-3-flash-preview', prompt, ['identity_resolution.business_confirmed', 'digital_footprint', 'competitors'], ctx, 'LOW', [{ googleSearch: {} }]);
  },

  extractSignals: async (researchData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Signal Extraction Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Extract leverage. INPUT: ${JSON.stringify(researchData)}. OUTPUT: JSON { "signals": { "pain_signals": [], "opportunity_signals": [] }, "top_10_leverage_insights": [] }`;
    return guardedGenerate('EXTRACT_SIGNALS', 'gemini-3-pro-preview', prompt, ['signals.pain_signals', 'top_10_leverage_insights'], ctx);
  },

  governDecision: async (researchData: any, signalsData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Decision Governor. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Arbitrate truth. INPUT: Research: ${JSON.stringify(researchData)}, Signals: ${JSON.stringify(signalsData)}. OUTPUT: JSON { "validated_intelligence": { "key_facts": [] }, "scores": { "confidence": 0, "readiness": 0 } }`;
    return guardedGenerate('DECISION_GOVERNOR', 'gemini-3-pro-preview', prompt, ['validated_intelligence.key_facts', 'scores'], ctx, 'HIGH');
  },

  synthesizeIntelligence: async (governorData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Intelligence Synthesis Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Commercial dossier. INPUT: ${JSON.stringify(governorData)}. OUTPUT: JSON { "dossier": { "lead_readiness_score_0_100": 0, "pain_points": [], "opportunities": [] } }`;
    return guardedGenerate('INTEL_SYNTHESIS', 'gemini-3-pro-preview', prompt, ['dossier.lead_readiness_score_0_100', 'dossier.pain_points'], ctx);
  },

  generateStrategy: async (dossierData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Strategy Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Marketing blueprint. INPUT: ${JSON.stringify(dossierData)}. OUTPUT: JSON { "positioning": { "core_angle": "", "value_prop": "" }, "funnel": { "stages": [] }, "campaign_architecture": { "theme": "" } }`;
    return guardedGenerate('GENERATE_STRATEGY', 'gemini-3-pro-preview', prompt, ['positioning', 'funnel', 'campaign_architecture'], ctx, 'HIGH');
  },

  generateTextAssets: async (strategyData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Text Production Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Deployable copy. INPUT: ${JSON.stringify(strategyData)}. OUTPUT: JSON { "text_assets": { "website": {}, "google_ads": {}, "meta_ads": {} } }`;
    return guardedGenerate('GENERATE_TEXT_ASSETS', 'gemini-3-pro-preview', prompt, ['text_assets.website', 'text_assets.meta_ads'], ctx);
  },

  generateSocialAssets: async (strategyData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Social Content Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: 30-day calendar. INPUT: ${JSON.stringify(strategyData)}. OUTPUT: JSON { "social_assets": { "30_day_calendar": [] } }`;
    return guardedGenerate('GENERATE_SOCIAL_ASSETS', 'gemini-3-pro-preview', prompt, ['social_assets.30_day_calendar'], ctx);
  },

  generateVideoScripts: async (strategyData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Video Script Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Production scripts. INPUT: ${JSON.stringify(strategyData)}. OUTPUT: JSON { "video_assets": { "short_form": [], "ad_videos": [] } }`;
    return guardedGenerate('GENERATE_VIDEO_SCRIPTS', 'gemini-3-pro-preview', prompt, ['video_assets.short_form', 'video_assets.ad_videos'], ctx);
  },

  generateAudioAssets: async (strategyData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Audio Script Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Voiceover scripts. INPUT: ${JSON.stringify(strategyData)}. OUTPUT: JSON { "audio_assets": { "voiceovers": [], "audio_ads": [] } }`;
    return guardedGenerate('GENERATE_AUDIO_ASSETS', 'gemini-3-pro-preview', prompt, ['audio_assets.voiceovers', 'audio_assets.audio_ads'], ctx);
  },

  generateVisualAssets: async (strategyData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Visual Direction Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: Art direction. INPUT: ${JSON.stringify(strategyData)}. OUTPUT: JSON { "visual_direction": { "brand_mood": "", "ai_image_prompts": [] } }`;
    return guardedGenerate('GENERATE_VISUAL_ASSETS', 'gemini-3-pro-preview', prompt, ['visual_direction.brand_mood', 'visual_direction.ai_image_prompts'], ctx);
  },

  assembleRun: async (context: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `ROLE: Orchestration Agent. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    TASK: OS Run assembly. INPUT: ${JSON.stringify(context)}. OUTPUT: JSON { "media_vault": [], "execution_sequence": [], "outreach_plan": {} }`;
    return guardedGenerate('ASSEMBLE_RUN', 'gemini-3-pro-preview', prompt, ['media_vault', 'execution_sequence', 'outreach_plan'], ctx, 'HIGH');
  },

  generateICP: async (lead: Lead, strategyData: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `Generate ICP for ${lead.businessName}. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    Strategy: ${JSON.stringify(strategyData)}. Output JSON { "icp": { "demographics": {}, "psychographics": {} } }`;
    return guardedGenerate('ICP_GEN', 'gemini-3-flash-preview', prompt, ['icp'], ctx);
  },

  generateOffer: async (lead: Lead, icp: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `Create Offer for ${lead.businessName}. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    ICP: ${JSON.stringify(icp)}. Output JSON { "offer": { "core_product": "", "guarantee": "" } }`;
    return guardedGenerate('OFFER_GEN', 'gemini-3-flash-preview', prompt, ['offer'], ctx);
  },

  generateOutreach: async (lead: Lead, offer: any, ctx: RunContext): Promise<{ data: any; raw: string }> => {
    const prompt = `Generate Outreach Suite for ${lead.businessName}. 
    Lead evidence level: ${ctx.lead_evidence_level}
    Compliance mode: ${ctx.compliance_mode}
    Offer: ${JSON.stringify(offer)}. Output JSON { "outreach": { "email_1": "", "linkedin_1": "" } }`;
    return guardedGenerate('OUTREACH_GEN', 'gemini-3-flash-preview', prompt, ['outreach'], ctx);
  },

  generateFinalReport: async (lead: Lead, allData: any): Promise<string> => {
    const ai = getAI();
    const prompt = `Compile Final Report for ${lead.businessName}. Data: ${JSON.stringify(allData)}. Format as Markdown.`;
    return await loggedGenerateContent({
      ai, module: 'REPORT_GEN', model: 'gemini-3-flash-preview', modelClass: 'FLASH', reasoningDepth: 'LOW', isClientFacing: true,
      contents: prompt
    });
  }
};