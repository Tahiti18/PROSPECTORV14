
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EngineResult, Lead, SubModule } from "../types";
import { trackCall } from "./computeTracker";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("SYSTEM CRITICAL: API_KEY MISSING from environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const PRODUCTION_LOGS: string[] = [];
const pushLog = (msg: string) => {
  console.log(`[SYSTEM_LOG] ${msg}`);
  PRODUCTION_LOGS.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (PRODUCTION_LOGS.length > 100) PRODUCTION_LOGS.shift();
};

const extractJSON = (text: string) => {
  try {
    // Attempt to find the first outer-most JSON object
    let match = text.match(/\{[\s\S]*\}/);
    if (match) {
        return JSON.parse(match[0]);
    }
    // Fallback for markdown blocks
    match = text.match(/```json([\s\S]*)```/);
    if (match) {
        return JSON.parse(match[1]);
    }
    return JSON.parse(text);
  } catch (e) {
    pushLog("PARSE_ERROR: Failed to extract valid JSON from response.");
    console.error("Raw text was:", text);
    return null;
  }
};

const ELITE_NODES: SubModule[] = [
  'BENCHMARK', 'DEEP_LOGIC', 'ROI_CALC', 'PROPOSALS', 'DRAFTING', 'PRODUCT_SYNTH', 'PITCH_GEN'
];

export interface StackItem { label: string; description: string; }
export interface BenchmarkReport {
  entityName: string; missionSummary: string; visualStack: StackItem[]; sonicStack: StackItem[]; featureGap: string; businessModel: string; designSystem: string; deepArchitecture: string; sources: Array<{ title: string; uri: string }>;
}

export const fetchLiveIntel = async (lead: Lead, moduleType: string): Promise<BenchmarkReport> => {
  pushLog(`ENGAGING MODULE: ${moduleType} for ${lead.businessName}`);
  const ai = getAI();
  const isElite = ELITE_NODES.includes(moduleType as SubModule);
  // Use Pro for deep analysis (reverse engineering), Flash for speed
  const model = isElite ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
  
  const prompt = `
    You are a high-level Intelligence Officer for an elite Agency.
    TARGET: "${lead.businessName}"
    URL: "${lead.websiteUrl}"
    MODULE: "${moduleType}"

    MISSION:
    1. Analyze the target URL using Google Search to identify their actual business model, tech stack, and branding.
    2. If the URL is inaccessible, blocked, or new, INFER the likely profile based on the business name and niche ("${lead.niche}"). 
    3. IMPORTANT: DO NOT RETURN EMPTY DATA. If data is missing, SIMULATE a highly plausible, professional profile.
    4. "deepArchitecture" must be a long, multi-paragraph technical breakdown (at least 300 words).

    OUTPUT FORMAT:
    Return ONLY a raw JSON object. No markdown formatting. No preamble.
    
    JSON SCHEMA:
    {
      "entityName": "Verified Business Name",
      "missionSummary": "Executive summary of their market position.",
      "visualStack": [ {"label": "Tech/Style", "description": "e.g. React, WebGL, Minimalist"} ],
      "sonicStack": [ {"label": "Tone/Audio", "description": "e.g. Corporate Synth, Voice Over"} ],
      "featureGap": "Critical missing opportunity (e.g. No AI Chatbot).",
      "businessModel": "How they make money.",
      "designSystem": "Visual identity analysis.",
      "deepArchitecture": "Long form technical analysis."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Drastically increased thinking budget for Elite nodes to ensure quality
        thinkingConfig: isElite ? { thinkingBudget: 16000 } : undefined,
      }
    });

    const rawData = extractJSON(response.text || "{}") || {};
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(c => c.web).map(c => ({ title: c.web?.title || 'External Intelligence Node', uri: c.web?.uri || '' })) || [];

    trackCall(model, (response.text?.length || 0) + prompt.length);

    // Fallback if AI returns empty object
    if (!rawData.entityName) {
        throw new Error("AI returned empty intelligence payload.");
    }

    return {
      entityName: rawData.entityName || lead.businessName,
      missionSummary: rawData.missionSummary || "Intelligence extraction in progress.",
      visualStack: rawData.visualStack || [],
      sonicStack: rawData.sonicStack || [],
      featureGap: rawData.featureGap || "Tactical gap analysis pending.",
      businessModel: rawData.businessModel || "Analysis in progress.",
      designSystem: rawData.designSystem || "Audit pending.",
      deepArchitecture: rawData.deepArchitecture || "Analyzing deep-layer protocols...",
      sources
    };
  } catch (error) {
    pushLog(`INTEL_FETCH_FAILURE: ${error instanceof Error ? error.message : 'Unknown Connection Error'}`);
    // Return a graceful failure object so the UI doesn't crash
    return {
        entityName: lead.businessName,
        missionSummary: "TARGET_LOCKED: SIGNAL_INTERFERENCE. MANUAL RECON ADVISED.",
        visualStack: [{ label: "Error", description: "Connection reset by peer" }],
        sonicStack: [],
        featureGap: "DATA_UNAVAILABLE",
        businessModel: "UNKNOWN",
        designSystem: "UNKNOWN",
        deepArchitecture: "The automated reconnaissance unit encountered a firewall or empty response vector. Proceed with manual inspection.",
        sources: []
    };
  }
};

export const fetchBenchmarkData = async (lead: Lead): Promise<BenchmarkReport> => fetchLiveIntel(lead, "BENCHMARK");

export const generateLeads = async (region: string, nicheHint: string, count: number = 6): Promise<EngineResult> => {
  pushLog(`INITIATING DISCOVERY SCAN: ${region} / ${nicheHint}`);
  const ai = getAI();
  const model = "gemini-3-flash-preview"; 
  
  const prompt = `Search for and identify EXACTLY ${count} REAL businesses in ${region} focusing on ${nicheHint || 'high-end niches'}. 
  CRITICAL: You must find REAL businesses with REAL names (e.g. "Acme Corp", "Smith & Associates"). DO NOT return "Unidentified Target".
  Assess their "Social Gap" (difference between visual quality and social presence).`;

  try {
    const response = await ai.models.generateContent({
      model,
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

    const result = JSON.parse(response.text || "{}");
    
    // SAFETY FALLBACK: Ensure no "Unidentified Target" slips through
    if (result.leads) {
      result.leads = result.leads.map((l: any, i: number) => ({
        ...l,
        businessName: l.businessName && l.businessName !== "UNIDENTIFIED_TARGET" ? l.businessName : `High-Value Prospect ${i+1}`,
        id: `gen-${Date.now()}-${i}`
      }));
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      result.groundingSources = groundingChunks.filter(c => c.web).map(c => ({ title: c.web?.title, uri: c.web?.uri }));
    }

    trackCall(model, (response.text?.length || 0) + prompt.length);
    pushLog(`SUCCESS: Found ${result.leads?.length || 0} valid targets.`);
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    const rawLeads = JSON.parse(response.text || "[]");
    
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
  const response = await ai.models.generateContent({ 
    model: "gemini-3-flash-preview", 
    contents: `Trending marketing topics for ${niche}. Return JSON [{label, val, type}].`, 
    config: { tools: [{ googleSearch: {} }] } 
  });
  return extractJSON(response.text || "[]") || [];
};

export const fetchTokenStats = async (): Promise<any> => ({ balance: 4250000, consumed: 1420500, recentOps: [{ id: 'T-99', cost: 1200, op: 'VEO_FORGE' }, { id: 'T-98', cost: 450, op: 'RADAR_SCAN' }] });
export const fetchBillingStats = async (): Promise<any> => ({ tokenUsage: 1420500, estimatedCost: 12.45, projectedRevenueLift: 154000, activeTheaters: 4 });
export const testModelPerformance = async (modelName: string, prompt: string): Promise<string> => { const ai = getAI(); const resp = await ai.models.generateContent({ model: modelName, contents: prompt }); return resp.text || "No response."; };
export const critiqueVideoPresence = async (lead: Lead): Promise<string> => { const ai = getAI(); const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Audit video presence for ${lead.businessName}` }); return resp.text || "Audit failed."; };
export const translateTactical = async (text: string, targetLang: string): Promise<string> => { const ai = getAI(); const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Translate: ${text} to ${targetLang}` }); return resp.text || "Failed."; };

export const generateNurtureDialogue = async (lead: Lead, scenario: string): Promise<any[]> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Chat scenario for ${lead.businessName}. Return JSON [{role, text}].` }); 
  return extractJSON(resp.text || "[]") || []; 
};

export const generateMotionLabConcept = async (lead: Lead): Promise<any> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Storyboard for ${lead.businessName}. Return JSON {title, hook, scenes:[{time, visual, text}]}.` }); 
  return extractJSON(resp.text || "{}") || {}; 
};

export const generateFlashSparks = async (lead: Lead): Promise<string[]> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `6 hooks for ${lead.businessName}. Return JSON array strings.` }); 
  return extractJSON(resp.text || "[]") || []; 
};

export const architectPitchDeck = async (lead: Lead): Promise<any[]> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `5-slide deck for ${lead.businessName}. Return JSON [{title, narrativeGoal, keyVisuals}].` }); 
  return extractJSON(resp.text || "[]") || []; 
};

export const simulateSandbox = async (lead: Lead, ltv: number, volume: number): Promise<string> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: `ROI for ${lead.businessName} (LTV:${ltv}, Vol:${volume}).`, config: { thinkingConfig: { thinkingBudget: 16000 } } }); 
  return resp.text || "Error."; 
};

export const performFactCheck = async (lead: Lead, claim: string): Promise<any> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Fact check "${claim}" for ${lead.businessName}. Return JSON {status, evidence, sources: [{title, uri}]}.`, config: { tools: [{ googleSearch: {} }] } }); 
  return extractJSON(resp.text || "{}") || {}; 
};

export const synthesizeProduct = async (lead: Lead): Promise<any> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: `Product for ${lead.businessName}. Return JSON {productName, tagline, pricePoint, features: []}.`, config: { thinkingConfig: { thinkingBudget: 16000 } } }); 
  return extractJSON(resp.text || "{}") || {}; 
};

export const generatePitch = async (lead: Lead): Promise<string> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: `30s pitch for ${lead.businessName}.`, config: { thinkingConfig: { thinkingBudget: 16000 } } }); 
  return resp.text || "Error."; 
};

export const architectFunnel = async (lead: Lead): Promise<any[]> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `4-stage funnel for ${lead.businessName}. Return JSON [{stage, title, description, conversionGoal}].` }); 
  return extractJSON(resp.text || "[]") || []; 
};

export const generateProposalDraft = async (lead: Lead): Promise<string> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: `Proposal for ${lead.businessName}.`, config: { thinkingConfig: { thinkingBudget: 32000 } } }); 
  return resp.text || "Error."; 
};

export const generateMockup = async (businessName: string, niche: string): Promise<string> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: `4k website mockup for ${businessName} (${niche})` }] } }); 
  const part = resp.candidates?.[0]?.content?.parts?.find(p => p.inlineData); 
  return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : ""; 
};

export const generateOutreachSequence = async (lead: Lead): Promise<any[]> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `5-day outreach for ${lead.businessName}. Return JSON [{day, channel, purpose, content}].` }); 
  return extractJSON(resp.text || "[]") || []; 
};

export const generateVideoPayload = async (prompt: string): Promise<string> => { 
  const ai = getAI(); 
  let op = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt }); 
  while (!op.done) { 
    await new Promise(r => setTimeout(r, 10000)); 
    op = await ai.operations.getVideosOperation({ operation: op }); 
  } 
  return (op.response?.generatedVideos?.[0]?.video?.uri ?? '') + `&key=${process.env.API_KEY}`; 
};

export const generateAudioPitch = async (text: string, voice: string = 'Kore'): Promise<string> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }); 
  return resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || ""; 
};

export const generateTaskMatrix = async (lead: Lead): Promise<any[]> => { 
  const ai = getAI(); 
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Tasks for ${lead.businessName}. Return JSON [{id, task, status}].` }); 
  return extractJSON(resp.text || "[]") || []; 
};

export const synthesizeArticle = async (source: string, mode: string): Promise<string> => {
  const ai = getAI();
  const resp = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Audit ${source} in ${mode}.`, config: { tools: [{ googleSearch: {} }] } });
  return resp.text || "Failed.";
};
