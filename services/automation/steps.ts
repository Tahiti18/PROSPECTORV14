
import { Lead } from '../../types';
import { loggedGenerateContent, getAI } from '../geminiService';

export const Steps = {
  enrichLead: async (lead: Lead): Promise<string> => {
    const ai = getAI();
    const prompt = `
      Act as a Lead Enrichment Specialist.
      Target: ${lead.businessName} (${lead.websiteUrl}) in ${lead.city}.
      
      Task: Provide a comprehensive but concise enrichment summary.
      1. What exact industry/sub-niche are they in?
      2. What is their likely revenue tier based on "high-ticket" signals?
      3. Identify 3 key decision-maker titles to target.
      
      Output JSON only: { "industry": "...", "revenue_tier": "...", "targets": ["...", "...", "..."], "summary": "..." }
    `;
    
    return await loggedGenerateContent({
      ai,
      module: 'AUTO_ENRICH',
      model: 'gemini-3-flash-preview',
      modelClass: 'FLASH',
      reasoningDepth: 'LOW',
      isClientFacing: false,
      contents: prompt,
      config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
    });
  },

  generateICP: async (lead: Lead, enrichmentData: any): Promise<string> => {
    const ai = getAI();
    const prompt = `
      Generate an Ideal Customer Profile (ICP) Analysis for ${lead.businessName}.
      Enrichment Context: ${JSON.stringify(enrichmentData)}
      
      Define:
      1. Their Pains (3 bullet points)
      2. Their Desires (3 bullet points)
      3. The specific "Trigger Event" that makes them buy AI services now.
      
      Output JSON only.
    `;
    return await loggedGenerateContent({
      ai,
      module: 'ICP_GEN',
      model: 'gemini-3-pro-preview',
      modelClass: 'PRO',
      reasoningDepth: 'MEDIUM',
      isClientFacing: false,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
  },

  generateOffer: async (lead: Lead, icp: any): Promise<string> => {
    const ai = getAI();
    const prompt = `
      Create 2 High-Ticket Offer Angles for ${lead.businessName}.
      ICP Context: ${JSON.stringify(icp)}
      
      Angle 1: "Efficiency/Cost Cutting"
      Angle 2: "Growth/Revenue Expansion"
      
      For each, write a 1-sentence "Hook" and a 1-sentence "Value Prop".
      Output JSON only.
    `;
    return await loggedGenerateContent({
      ai,
      module: 'OFFER_GEN',
      model: 'gemini-3-pro-preview',
      modelClass: 'PRO',
      reasoningDepth: 'HIGH',
      isClientFacing: false,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
  },

  generateOutreach: async (lead: Lead, offer: any): Promise<string> => {
    const ai = getAI();
    const prompt = `
      Write a complete outreach suite for ${lead.businessName} based on this offer: ${JSON.stringify(offer)}.
      
      Required:
      1. Cold Email (Subject + Body) - Keep it under 100 words.
      2. LinkedIn Connection Note (max 300 chars).
      3. Cold Call Opener (2 sentences).
      
      Output JSON only.
    `;
    return await loggedGenerateContent({
      ai,
      module: 'OUTREACH_GEN',
      model: 'gemini-3-pro-preview',
      modelClass: 'PRO',
      reasoningDepth: 'HIGH',
      isClientFacing: false,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
  },

  generateFinalReport: async (lead: Lead, allData: any): Promise<string> => {
    const ai = getAI();
    const prompt = `
      Compile a "Final Strategic Package" Executive Summary for ${lead.businessName}.
      Data: ${JSON.stringify(allData)}
      
      Format as clean, professional Markdown.
      Include:
      - Executive Summary
      - Recommended Strategy
      - Immediate Next Steps
    `;
    return await loggedGenerateContent({
      ai,
      module: 'REPORT_GEN',
      model: 'gemini-3-flash-preview', // Flash is fine for formatting
      modelClass: 'FLASH',
      reasoningDepth: 'LOW',
      isClientFacing: true,
      contents: prompt
    });
  }
};
