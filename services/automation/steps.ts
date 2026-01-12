import { Lead } from '../../types';
import { loggedGenerateContent } from '../geminiService';
import { safeJsonParse, validateKeys } from './jsonGuard';

const ENFORCED_MODEL = "google/gemini-2.0-flash-001";

export interface RunContext {
  identity_strict: boolean;
  compliance_mode: 'standard' | 'regulated';
  lead_evidence_level: 'high' | 'low';
}

const getSafetyInstruction = (ctx: RunContext) => `
${ctx.identity_strict ? 'STRICT IDENTITY MODE ENABLED: Business identity is NOT fully confirmed. Require "inference labeling" for all output.' : ''}
${ctx.compliance_mode === 'regulated' ? 'REGULATED COMPLIANCE MODE ENABLED: Focus exclusively on technical marketing infrastructure.' : ''}
${ctx.lead_evidence_level === 'low' ? 'LOW EVIDENCE WARNING: Prioritize factual discovery.' : ''}
`;

const SYSTEM_BOOTSTRAP = `You are Prospector OS. Output ONLY valid JSON.`;

async function guardedGenerate<T>(
  module: string,
  model: string,
  prompt: string,
  requiredKeys: string[],
  ctx: RunContext
): Promise<{ data: T; raw: string }> {
  const finalPrompt = `${getSafetyInstruction(ctx)}\n\n${prompt}`;
  
  try {
    const lastRaw = await loggedGenerateContent({
      module, 
      contents: finalPrompt,
      config: { systemInstruction: SYSTEM_BOOTSTRAP }
    });
    const parsed = safeJsonParse<T>(lastRaw);
    if (parsed.ok) {
      const validation = validateKeys(parsed.value, requiredKeys);
      if (validation.ok) return { data: parsed.value!, raw: lastRaw };
    }
  } catch (e: any) {
    console.error(`[GuardedGenerate] Fail for ${module}:`, e.message);
  }

  throw new Error(`Exhausted all recovery attempts for ${module}. Check raw logs.`);
}

export const Steps = {
  resolveLead: async (lead: Lead, ctx: RunContext) => {
    const prompt = `TASK: Normalize lead identity. INPUT: ${JSON.stringify(lead)}. OUTPUT: JSON { "resolved_lead": { "business_name": "", "business_confirmed": boolean, "industry_classification": "" } }`;
    return guardedGenerate('RESOLVE_LEAD', ENFORCED_MODEL, prompt, ['resolved_lead.business_confirmed'], ctx);
  },
  deepResearch: async (resolvedData: any, ctx: RunContext) => {
    const prompt = `TASK: Factual discovery. INPUT: ${JSON.stringify(resolvedData)}. OUTPUT: JSON { "identity_resolution": { "business_confirmed": boolean }, "digital_footprint": { "website_status": "", "social_presence": [] } }`;
    return guardedGenerate('DEEP_RESEARCH', ENFORCED_MODEL, prompt, ['identity_resolution.business_confirmed'], ctx);
  },
  generateDeepResearchLite: async (resolvedData: any, ctx: RunContext) => {
    const prompt = `TASK: Compact factual discovery. INPUT: ${JSON.stringify(resolvedData)}. OUTPUT: JSON { "identity_resolution": { "business_confirmed": boolean } }`;
    return guardedGenerate('DEEP_RESEARCH_LITE', ENFORCED_MODEL, prompt, ['identity_resolution.business_confirmed'], ctx);
  },
  extractSignals: async (researchData: any, ctx: RunContext) => {
    const prompt = `TASK: Extract leverage. INPUT: ${JSON.stringify(researchData)}. OUTPUT: JSON { "signals": { "pain_signals": [] } }`;
    return guardedGenerate('EXTRACT_SIGNALS', ENFORCED_MODEL, prompt, ['signals.pain_signals'], ctx);
  },
  governDecision: async (researchData: any, signalsData: any, ctx: RunContext) => {
    const prompt = `TASK: Arbitrate truth. INPUT: Research: ${JSON.stringify(researchData)}. OUTPUT: JSON { "validated_intelligence": { "key_facts": [] } }`;
    return guardedGenerate('DECISION_GOVERNOR', ENFORCED_MODEL, prompt, ['validated_intelligence.key_facts'], ctx);
  },
  synthesizeIntelligence: async (governorData: any, ctx: RunContext) => {
    const prompt = `TASK: Commercial dossier. INPUT: ${JSON.stringify(governorData)}. OUTPUT: JSON { "dossier": { "lead_readiness_score_0_100": 0 } }`;
    return guardedGenerate('INTEL_SYNTHESIS', ENFORCED_MODEL, prompt, ['dossier.lead_readiness_score_0_100'], ctx);
  },
  generateStrategy: async (dossierData: any, ctx: RunContext) => {
    const prompt = `TASK: Marketing blueprint. INPUT: ${JSON.stringify(dossierData)}. OUTPUT: JSON { "positioning": { "core_angle": "" } }`;
    return guardedGenerate('GENERATE_STRATEGY', ENFORCED_MODEL, prompt, ['positioning'], ctx);
  },
  generateTextAssets: async (strategyData: any, ctx: RunContext) => {
    const prompt = `TASK: Deployable copy. INPUT: ${JSON.stringify(strategyData)}. OUTPUT: JSON { "text_assets": { "website": {} } }`;
    return guardedGenerate('GENERATE_TEXT_ASSETS', ENFORCED_MODEL, prompt, ['text_assets.website'], ctx);
  },
  generateSocialAssets: async (strategyData: any, ctx: RunContext) => {
    const prompt = `TASK: 30-day calendar. OUTPUT: JSON { "social_assets": { "30_day_calendar": [] } }`;
    return guardedGenerate('GENERATE_SOCIAL_ASSETS', ENFORCED_MODEL, prompt, ['social_assets.30_day_calendar'], ctx);
  },
  generateVideoScripts: async (strategyData: any, ctx: RunContext) => {
    const prompt = `TASK: Production scripts. OUTPUT: JSON { "video_assets": { "short_form": [] } }`;
    return guardedGenerate('GENERATE_VIDEO_SCRIPTS', ENFORCED_MODEL, prompt, ['video_assets.short_form'], ctx);
  },
  generateAudioAssets: async (strategyData: any, ctx: RunContext) => {
    const prompt = `TASK: Voiceover scripts. OUTPUT: JSON { "audio_assets": { "voiceovers": [] } }`;
    return guardedGenerate('GENERATE_AUDIO_ASSETS', ENFORCED_MODEL, prompt, ['audio_assets.voiceovers'], ctx);
  },
  generateVisualAssets: async (strategyData: any, ctx: RunContext) => {
    const prompt = `TASK: Art direction. OUTPUT: JSON { "visual_direction": { "brand_mood": "" } }`;
    return guardedGenerate('GENERATE_VISUAL_ASSETS', ENFORCED_MODEL, prompt, ['visual_direction.brand_mood'], ctx);
  },
  assembleRun: async (context: any, ctx: RunContext) => {
    const prompt = `TASK: OS Run assembly. OUTPUT: JSON { "media_vault": [] }`;
    return guardedGenerate('ASSEMBLE_RUN', ENFORCED_MODEL, prompt, ['media_vault'], ctx);
  },
  generateICP: async (lead: Lead, strategyData: any, ctx: RunContext) => {
    const prompt = `Generate ICP for ${lead.businessName}. Output JSON { "icp": {} }`;
    return guardedGenerate('ICP_GEN', ENFORCED_MODEL, prompt, ['icp'], ctx);
  },
  generateOffer: async (lead: Lead, icp: any, ctx: RunContext) => {
    const prompt = `Create Offer for ${lead.businessName}. Output JSON { "offer": {} }`;
    return guardedGenerate('OFFER_GEN', ENFORCED_MODEL, prompt, ['offer'], ctx);
  },
  generateOutreach: async (lead: Lead, offer: any, ctx: RunContext) => {
    const prompt = `Generate Outreach Suite. Output JSON { "outreach": {} }`;
    return guardedGenerate('OUTREACH_GEN', ENFORCED_MODEL, prompt, ['outreach'], ctx);
  },
  generateFinalReport: async (lead: Lead, allData: any): Promise<string> => {
    const prompt = `Compile Final Report for ${lead.businessName}. Data: ${JSON.stringify(allData)}. RETURN JSON IN UI_BLOCKS FORMAT.`;
    return await loggedGenerateContent({
      module: 'REPORT_GEN', 
      contents: prompt
    });
  }
};