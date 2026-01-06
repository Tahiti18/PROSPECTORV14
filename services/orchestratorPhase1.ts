
import { Lead } from '../types';
import { 
  saveAsset, 
  SESSION_ASSETS, 
  generateFlashSparks, 
  generateVisual, 
  generateMockup, 
  generateOutreachSequence, 
  generatePitch, 
  architectFunnel, 
  generateROIReport, 
  orchestrateBusinessPackage, 
  architectPitchDeck, 
  generateTaskMatrix,
  generateNurtureDialogue,
  generateVideoPayload,
  generateAudioPitch
} from './geminiService';
import { uuidLike } from './usageLogger';

// --- Types ---

export interface ReplayStep {
  stepId: string;
  orderIndex: number;
  module: string;
  actionName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  startTime: number;
  endTime?: number;
  retryCount: number;
  inputContext: any;
  generatedAssetIds: string[];
  logs: string[];
  errorDetails?: { code?: string; message: string };
  outputSummary?: any;
}

export interface OrchestrationResult {
  runId: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL_SUCCESS';
  package: any;
  timeline: ReplayStep[];
  assets: { id: string; type: string; module: string }[];
  completedAt: number;
  error?: string;
}

export interface OrchestrationOptions {
  mediaPolicy?: 'off' | 'on';
}

// --- Service Adapter Registry ---
const Modules = {
  // Research & Strategy
  competitiveGapAnalysis: async (payload: { url: string; niche: string }) => {
    // Placeholder logic for gap analysis since specific function isn't isolated in geminiService
    return {
      gap: "Social Authority Deficit",
      opportunity: "Visual Automation High-Ticket",
      score: 45
    };
  },
  
  campaignBuilder: async (payload: { gapData: any }) => {
    return {
      narrative: "The Automated Authority Engine",
      angle: "Speed & Precision",
      hook: "Dominate your market before they wake up."
    };
  },

  funnelMap: async (payload: { strategy: any; lead: Lead }) => {
    return await architectFunnel(payload.lead);
  },

  aiRoadmap: async (payload: { strategy: any; lead: Lead }) => {
    return await generateTaskMatrix(payload.lead);
  },

  // Assets
  flashSpark: async (payload: { narrative: string; count: number; lead: Lead }) => {
    return await generateFlashSparks(payload.lead);
  },

  creativeStudio: async (payload: { directives: string; lead: Lead }) => {
    return await generateVisual(payload.directives, payload.lead);
  },

  mockupForge: async (payload: { offer: string; lead: Lead }) => {
    return await generateMockup(payload.lead.businessName, payload.lead.niche, payload.lead.id);
  },

  videoStudio: async (payload: { prompt: string; lead: Lead }) => {
    return await generateVideoPayload(payload.prompt, payload.lead.id);
  },

  audioStudio: async (payload: { script: string; voice: string; lead: Lead }) => {
    return await generateAudioPitch(payload.script, payload.voice, payload.lead.id);
  },

  // Outreach
  outreachSequence: async (payload: { strategy: any; lead: Lead }) => {
    return await generateOutreachSequence(payload.lead);
  },

  pitchGen: async (payload: { gap: any; lead: Lead }) => {
    return await generatePitch(payload.lead);
  },

  aiConcierge: async (payload: { script: any; lead: Lead }) => {
    return await generateNurtureDialogue(payload.lead, "Initial Inquiry Handling");
  },

  // Assembly
  roiProjection: async (payload: { strategy: any }) => {
    // Defaulting params for auto-run
    return await generateROIReport(5000, 50, 15);
  },

  strategyDeck: async (payload: { strategy: any; lead: Lead }) => {
    return await architectPitchDeck(payload.lead);
  },

  magicLinkArchitect: async (payload: { 
    strategy: any; 
    assets: any[]; 
    outreach: any; 
    deck: any; 
    roi: any; 
    pitchScript: any; 
    conciergeDemo: any; 
    lead: Lead 
  }) => {
    // Re-using the main orchestrator function from geminiService as the final compiler
    return await orchestrateBusinessPackage(payload.lead, []); 
  }
};

// --- Orchestrator Implementation ---

export const orchestratePhase1BusinessPackage = async (lead: Lead, options: OrchestrationOptions = { mediaPolicy: 'off' }): Promise<OrchestrationResult> => {
    // 1. Initialization
    const runId = uuidLike();
    let stepCounter = 0;
    
    const executionContext = {
        outputs: {} as Record<string, any>,
        assetManifest: [] as { id: string; type: string; module: string }[],
        replayLog: [] as ReplayStep[],
        globalStatus: 'RUNNING' as 'RUNNING' | 'COMPLETED' | 'FAILED'
    };

    // --- Helper: Simple Hash for Dedupe ---
    const getContentHash = (content: string): string => {
        let hash = 0;
        if (!content || content.length === 0) return hash.toString();
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString();
    };

    // --- Helper: Asset Commit ---
    const commitAsset = (type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO', content: string, sourceModule: string, leadId: string, customTitle?: string): string => {
        // 1. Text Deduplication
        if (type === 'TEXT') {
            const contentHash = getContentHash(content);
            const existing = SESSION_ASSETS.find(a => 
                a.leadId === leadId && 
                a.type === 'TEXT' && 
                getContentHash(a.data) === contentHash
            );
            if (existing) return existing.id;
        }

        // 2. Save New
        // Tagging Schema: client:<businessName> runId:<runId> phase:1 module:<moduleName>
        const tags = `client:${lead.businessName} runId:${runId} phase:1 module:${sourceModule}`;
        const title = customTitle || `[${sourceModule}] ${lead.businessName} (Run ${runId.slice(-4)})`;
        
        const asset = saveAsset(type, title, content, sourceModule, leadId);
        
        executionContext.assetManifest.push({ id: asset.id, type, module: sourceModule });
        return asset.id;
    };

    // --- Helper: Execute Step ---
    const executeStep = async (
        stepName: string, 
        moduleName: keyof typeof Modules, 
        payload: any, 
        isCritical: boolean
    ): Promise<any> => {
        stepCounter++;
        
        const currentStep: ReplayStep = {
            stepId: uuidLike(),
            orderIndex: stepCounter,
            module: moduleName,
            actionName: stepName,
            status: 'PENDING',
            startTime: Date.now(),
            retryCount: 0,
            inputContext: { ...payload, lead: undefined }, // Don't log full lead object
            generatedAssetIds: [],
            logs: []
        };

        let attempt = 0;
        const maxRetries = 1; // Lower retry for perf
        let result = null;

        // Add lead to payload for internal service calls without logging it
        const servicePayload = { ...payload, lead };

        while (attempt <= maxRetries) {
            try {
                currentStep.status = 'IN_PROGRESS';
                
                // EXECUTE
                result = await Modules[moduleName](servicePayload);

                // SUCCESS
                currentStep.status = 'SUCCESS';
                currentStep.endTime = Date.now();
                currentStep.outputSummary = { hasData: true };
                break; 

            } catch (error: any) {
                attempt++;
                currentStep.retryCount = attempt;
                currentStep.logs.push(`Attempt ${attempt} Failed: ${error.message}`);
                
                if (attempt > maxRetries) {
                    currentStep.status = 'FAILED';
                    currentStep.errorDetails = { message: error.message };
                    currentStep.endTime = Date.now();
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        executionContext.replayLog.push(currentStep);

        if (currentStep.status === 'FAILED') {
            if (isCritical) {
                executionContext.globalStatus = 'FAILED';
                throw new Error(`Critical Step Failed: ${stepName}`);
            } else {
                currentStep.status = 'SKIPPED'; // Soft fail for auxiliary
                return null;
            }
        }

        return result;
    };

    try {
        // --- PHASE 1: RESEARCH (CRITICAL) ---
        const gapAnalysis = await executeStep(
            "AnalyzeMarketGap", "competitiveGapAnalysis", 
            { url: lead.websiteUrl, niche: lead.niche }, true
        );
        executionContext.outputs['gapAnalysis'] = gapAnalysis;
        if (gapAnalysis) {
            commitAsset('TEXT', JSON.stringify(gapAnalysis, null, 2), 'GAP_ANALYSIS', lead.id);
        }

        // --- PHASE 2: STRATEGY (CRITICAL) ---
        const coreStrategy = await executeStep(
            "BuildCampaignCore", "campaignBuilder", 
            { gapData: gapAnalysis }, true
        );
        
        const funnel = await executeStep(
            "MapFunnel", "funnelMap", 
            { strategy: coreStrategy }, true
        );
        if (funnel) {
            commitAsset('TEXT', JSON.stringify(funnel, null, 2), 'FUNNEL_MAP', lead.id);
        }

        const roadmap = await executeStep(
            "PlanImplementation", "aiRoadmap", 
            { strategy: coreStrategy }, true
        );
        if (roadmap) {
            commitAsset('TEXT', JSON.stringify(roadmap, null, 2), 'ROADMAP', lead.id);
        }

        // --- PHASE 3: ASSETS (AUXILIARY) ---
        // 3a. Text
        const sparks = await executeStep(
            "GenerateSparks", "flashSpark", 
            { narrative: coreStrategy.narrative, count: 6 }, false
        );
        
        if (sparks && Array.isArray(sparks)) {
            const stepLog = executionContext.replayLog.find(s => s.actionName === "GenerateSparks");
            sparks.forEach(spark => {
                const assetId = commitAsset('TEXT', spark, "FLASH_SPARK", lead.id);
                if(stepLog) stepLog.generatedAssetIds.push(assetId);
            });
        }

        // 3b. Visuals
        const brandImage = await executeStep(
            "GenerateBrandVisual", "creativeStudio", 
            { directives: coreStrategy.angle }, false
        );
        if (brandImage) {
             const stepLog = executionContext.replayLog.find(s => s.actionName === "GenerateBrandVisual");
             const assetId = commitAsset('IMAGE', brandImage, "CREATIVE_STUDIO", lead.id);
             if(stepLog) stepLog.generatedAssetIds.push(assetId);
        }

        const productMockup = await executeStep(
            "GenerateMockup", "mockupForge", 
            { offer: coreStrategy.angle }, false
        );
        if (productMockup) {
             const stepLog = executionContext.replayLog.find(s => s.actionName === "GenerateMockup");
             const assetId = commitAsset('IMAGE', productMockup, "MOCKUP_FORGE", lead.id);
             if(stepLog) stepLog.generatedAssetIds.push(assetId);
        }

        // 3c. Media (Gated)
        if (options.mediaPolicy === 'on') {
            const videoAsset = await executeStep(
                "GenerateVideoAsset", "videoStudio",
                { prompt: `Cinematic commercial for ${lead.businessName}, ${coreStrategy.narrative}, high resolution.` },
                false
            );
            if (videoAsset) {
                const stepLog = executionContext.replayLog.find(s => s.actionName === "GenerateVideoAsset");
                const assetId = commitAsset('VIDEO', videoAsset, "VIDEO_STUDIO", lead.id);
                if(stepLog) stepLog.generatedAssetIds.push(assetId);
            }

            const audioAsset = await executeStep(
                "GenerateAudioPitch", "audioStudio",
                { script: coreStrategy.hook, voice: 'Kore' },
                false
            );
            if (audioAsset) {
                const stepLog = executionContext.replayLog.find(s => s.actionName === "GenerateAudioPitch");
                const assetId = commitAsset('AUDIO', audioAsset, "AUDIO_STUDIO", lead.id);
                if(stepLog) stepLog.generatedAssetIds.push(assetId);
            }
        }

        // --- PHASE 4: OUTREACH & EXECUTION ---
        const outreach = await executeStep(
            "SequenceOutreach", "outreachSequence", 
            { strategy: coreStrategy }, true
        );
        if (outreach) {
            commitAsset('TEXT', JSON.stringify(outreach, null, 2), 'OUTREACH_SEQUENCE', lead.id);
        }

        const pitch = await executeStep(
            "GeneratePitchScript", "pitchGen", 
            { gap: gapAnalysis }, false
        );

        const conciergeTest = await executeStep(
            "SimulateConcierge", "aiConcierge", 
            { script: outreach?.email1 }, false
        );

        // --- PHASE 5: ASSEMBLY (CRITICAL) ---
        const roiData = await executeStep(
            "ProjectROI", "roiProjection", 
            { strategy: coreStrategy }, true
        );
        if (roiData) {
            commitAsset('TEXT', roiData, 'ROI_PROJECTION', lead.id);
        }

        const deckStructure = await executeStep(
            "ArchitectDeck", "strategyDeck", 
            { strategy: coreStrategy, roi: roiData }, true
        );
        if (deckStructure) {
            commitAsset('TEXT', JSON.stringify(deckStructure, null, 2), 'STRATEGY_DECK', lead.id);
        }

        // --- PHASE 6: COMPILATION (CRITICAL) ---
        // Pass optional auxiliaries as potential nulls
        const finalPackage = await executeStep(
            "CompileMagicLink", "magicLinkArchitect", 
            {
                strategy: coreStrategy,
                assets: executionContext.assetManifest,
                outreach: outreach,
                deck: deckStructure,
                roi: roiData,
                pitchScript: pitch || null,
                conciergeDemo: conciergeTest || null
            }, true
        );
        if (finalPackage) {
            commitAsset('TEXT', JSON.stringify(finalPackage, null, 2), 'PACKAGE', lead.id, `PHASE 1 PACKAGE - ${lead.businessName}`);
        }

        // --- FINALIZE ---
        const replayAssetId = commitAsset('TEXT', JSON.stringify(executionContext.replayLog, null, 2), 'REPLAY', lead.id, `REPLAY LOG - ${runId}`);

        return {
            runId: runId,
            status: 'SUCCESS',
            package: finalPackage,
            timeline: executionContext.replayLog,
            assets: executionContext.assetManifest,
            completedAt: Date.now()
        };

    } catch (e: any) {
        // Commit replay even on failure
        commitAsset('TEXT', JSON.stringify(executionContext.replayLog, null, 2), 'REPLAY', lead.id, `REPLAY LOG (FAILED) - ${runId}`);
        
        return {
            runId: runId,
            status: 'FAILED',
            package: null,
            timeline: executionContext.replayLog,
            assets: executionContext.assetManifest,
            completedAt: Date.now(),
            error: e.message
        };
    }
};
