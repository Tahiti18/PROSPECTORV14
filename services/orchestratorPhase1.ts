
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
  generateNurtureDialogue
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

export const orchestratePhase1BusinessPackage = async (lead: Lead): Promise<OrchestrationResult> => {
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
    const commitAsset = (type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO', content: string, sourceModule: string, leadId: string): string => {
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
        const title = `${sourceModule}_${Date.now()}`;
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
        const maxRetries = 2;
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
                    // Exponential Backoff: 1s, 2s
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
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

        // --- PHASE 2: STRATEGY (CRITICAL) ---
        const coreStrategy = await executeStep(
            "BuildCampaignCore", "campaignBuilder", 
            { gapData: gapAnalysis }, true
        );
        
        const funnel = await executeStep(
            "MapFunnel", "funnelMap", 
            { strategy: coreStrategy }, true
        );

        const roadmap = await executeStep(
            "PlanImplementation", "aiRoadmap", 
            { strategy: coreStrategy }, true
        );

        // --- PHASE 3: ASSETS (AUXILIARY) ---
        // 3a. Text
        const sparks = await executeStep(
            "GenerateSparks", "flashSpark", 
            { narrative: coreStrategy.narrative, count: 6 }, false
        );
        
        if (sparks && Array.isArray(sparks)) {
            const stepLog = executionContext.replayLog.find(s => s.actionName === "GenerateSparks");
            sparks.forEach(spark => {
                const assetId = commitAsset('TEXT', spark, "FlashSpark", lead.id);
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
             const assetId = commitAsset('IMAGE', brandImage, "Creative Studio", lead.id);
             if(stepLog) stepLog.generatedAssetIds.push(assetId);
        }

        const productMockup = await executeStep(
            "GenerateMockup", "mockupForge", 
            { offer: coreStrategy.angle }, false
        );
        if (productMockup) {
             const stepLog = executionContext.replayLog.find(s => s.actionName === "GenerateMockup");
             const assetId = commitAsset('IMAGE', productMockup, "Mockup Forge", lead.id);
             if(stepLog) stepLog.generatedAssetIds.push(assetId);
        }

        // --- PHASE 4: OUTREACH & EXECUTION ---
        const outreach = await executeStep(
            "SequenceOutreach", "outreachSequence", 
            { strategy: coreStrategy }, true
        );

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

        const deckStructure = await executeStep(
            "ArchitectDeck", "strategyDeck", 
            { strategy: coreStrategy, roi: roiData }, true
        );

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

        // --- FINALIZE ---
        return {
            runId: runId,
            status: 'SUCCESS',
            package: finalPackage,
            timeline: executionContext.replayLog,
            assets: executionContext.assetManifest,
            completedAt: Date.now()
        };

    } catch (e: any) {
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
