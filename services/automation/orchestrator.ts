import { AutomationRun, RunStep, AutomationArtifact } from './types';
import { db } from './db';
import { Steps, RunContext } from './steps';
import { uuidLike } from '../usageLogger';

const REGULATED_KEYWORDS = ['medical', 'health', 'dental', 'dentist', 'aesthetics', 'legal', 'finance', 'banking', 'insurance'];

export class AutomationOrchestrator {
  private static instance: AutomationOrchestrator;
  private activeRunIds = new Set<string>();

  private constructor() {}

  static getInstance(): AutomationOrchestrator {
    if (!AutomationOrchestrator.instance) {
      AutomationOrchestrator.instance = new AutomationOrchestrator();
    }
    return AutomationOrchestrator.instance;
  }

  async startRun(targetLeadId?: string, mode: 'full' | 'lite' = 'full'): Promise<AutomationRun> {
    const runId = uuidLike();
    const hasLock = await db.acquireMutex(runId, 5000);
    if (!hasLock) throw new Error("System busy.");

    try {
      db.clearStaleLocks();
      const leads = db.getLeads();
      let selectedLead = targetLeadId ? leads.find(l => l.id === targetLeadId) : leads.filter(l => !l.locked && l.status !== 'won').sort((a, b) => b.leadScore - a.leadScore)[0];
      
      if (!selectedLead) throw new Error("No eligible lead found in database. Search for leads first.");
      if (selectedLead.locked) throw new Error("This lead is currently being processed by another task.");

      const now = Date.now();
      const updatedLeads = leads.map(l => l.id === selectedLead!.id ? { ...l, locked: true, lockedAt: now, lockedByRunId: runId, lockExpiresAt: now + (30 * 60 * 1000) } : l);
      db.saveLeads(updatedLeads);

      const run: AutomationRun = {
        id: runId,
        leadId: selectedLead.id,
        leadName: selectedLead.businessName,
        leadScore: selectedLead.leadScore,
        status: 'queued',
        createdAt: now,
        steps: this.initializeSteps(),
        artifacts: []
      };
      
      (run as any).mode = mode;
      
      db.saveRun(run);
      db.releaseMutex(runId);
      this.processRun(run.id);
      return run;
    } catch (e) {
      db.releaseMutex(runId);
      throw e;
    }
  }

  async getRun(runId: string): Promise<AutomationRun | null> {
    return db.getRun(runId);
  }

  private initializeSteps(): RunStep[] {
    return [
      { name: 'ResolveLead', status: 'pending', attempts: 0 },
      { name: 'DeepResearch', status: 'pending', attempts: 0 },
      { name: 'ExtractSignals', status: 'pending', attempts: 0 },
      { name: 'DecisionGovernor', status: 'pending', attempts: 0 },
      { name: 'SynthesizeIntelligence', status: 'pending', attempts: 0 },
      { name: 'GenerateStrategy', status: 'pending', attempts: 0 },
      { name: 'GenerateTextAssets', status: 'pending', attempts: 0 },
      { name: 'GenerateSocialAssets', status: 'pending', attempts: 0 },
      { name: 'GenerateVideoScripts', status: 'pending', attempts: 0 },
      { name: 'GenerateAudioAssets', status: 'pending', attempts: 0 },
      { name: 'GenerateVisualAssets', status: 'pending', attempts: 0 },
      { name: 'AssembleRun', status: 'pending', attempts: 0 },
      { name: 'GenerateICP', status: 'pending', attempts: 0 },
      { name: 'GenerateOffer', status: 'pending', attempts: 0 },
      { name: 'GenerateOutreach', status: 'pending', attempts: 0 },
      { name: 'CreateFinalPackage', status: 'pending', attempts: 0 },
      { name: 'CompleteRun', status: 'pending', attempts: 0 },
    ];
  }

  private async processRun(runId: string) {
    if (this.activeRunIds.has(runId)) return;
    this.activeRunIds.add(runId);

    try {
      let run = db.getRun(runId);
      if (!run || run.status === 'canceled' || run.status === 'failed' || run.status === 'succeeded') return;

      if (run.status === 'queued') {
        run.status = 'running';
        run.startedAt = Date.now();
        db.saveRun(run);
      }

      const targetLead = db.getLeads().find(l => l.id === run!.leadId);
      if (!targetLead) throw new Error("Target lead disconnected from session.");

      const runMode = (run as any).mode || 'full';

      const hasWebsite = !!(targetLead.websiteUrl && targetLead.websiteUrl !== '#' && targetLead.websiteUrl.length > 5);
      const hasMaps = !!(targetLead.groundingSources?.some(s => s.uri?.includes('google.com/maps')));
      const hasSocials = !!((targetLead.instagram && targetLead.instagram !== 'Not found') || 
                         (targetLead.tiktok && targetLead.tiktok !== 'Not found') || 
                         (targetLead.youtube && targetLead.youtube !== 'Not found'));
      
      const evidenceLevel = (hasWebsite || hasMaps || hasSocials) ? 'high' : 'low';
      const industryText = (targetLead.niche || '').toLowerCase();
      const isRegulated = REGULATED_KEYWORDS.some(kw => industryText.includes(kw));
      const complianceMode = isRegulated ? 'regulated' : 'standard';

      let context: any = {};
      let runCtx: RunContext = {
        identity_strict: false,
        compliance_mode: complianceMode,
        lead_evidence_level: evidenceLevel
      };

      let shouldSkipRemaining = false;

      for (let i = 0; i < run.steps.length; i++) {
        const currentRun = db.getRun(runId);
        if (!currentRun || currentRun.status === 'canceled') return;
        run = currentRun;
        const step = run.steps[i];
        
        if (step.status === 'success') {
          const art = run.artifacts.find(a => a.id === step.outputArtifactIds?.[0]);
          if (art && art.type === 'json') {
             try {
                const parsed = JSON.parse(art.content);
                this.hydrateContext(step.name, parsed, context);
                if (step.name === 'DeepResearch' && parsed.identity_resolution?.business_confirmed === false) {
                  runCtx.identity_strict = true;
                }
             } catch(e) {}
          }
          continue;
        }

        if (shouldSkipRemaining && step.name !== 'CompleteRun') {
          step.status = 'skipped';
          db.saveRun(run);
          continue;
        }

        step.status = 'running';
        step.startedAt = Date.now();
        db.saveRun(run);

        try {
          let result: any;
          
          switch (step.name) {
            case 'ResolveLead':
              result = await Steps.resolveLead(targetLead, runCtx);
              context.resolved = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'DeepResearch':
              if (runMode === 'lite') {
                result = await Steps.generateDeepResearchLite(context.resolved, runCtx);
                shouldSkipRemaining = true;
              } else {
                result = await Steps.deepResearch(context.resolved, runCtx);
              }
              context.research = result.data;
              if (result.data.identity_resolution?.business_confirmed === false) {
                runCtx.identity_strict = true;
              }
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'ExtractSignals':
              result = await Steps.extractSignals(context.research, runCtx);
              context.signals = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'DecisionGovernor':
              result = await Steps.governDecision(context.research, context.signals, runCtx);
              context.governance = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'SynthesizeIntelligence':
              result = await Steps.synthesizeIntelligence(context.governance, runCtx);
              context.dossier = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateStrategy':
              result = await Steps.generateStrategy(context.dossier, runCtx);
              context.strategy = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateTextAssets':
              result = await Steps.generateTextAssets(context.strategy, runCtx);
              context.textAssets = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateSocialAssets':
              result = await Steps.generateSocialAssets(context.strategy, runCtx);
              context.socialAssets = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateVideoScripts':
              result = await Steps.generateVideoScripts(context.strategy, runCtx);
              context.videoScripts = result.data; // FIXED ASSIGNMENT
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateAudioAssets':
              result = await Steps.generateAudioAssets(context.strategy, runCtx);
              context.audioAssets = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateVisualAssets':
              result = await Steps.generateVisualAssets(context.strategy, runCtx);
              context.visualAssets = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'AssembleRun':
              result = await Steps.assembleRun({
                strategy: context.strategy,
                textAssets: context.textAssets,
                socialAssets: context.socialAssets,
                videoScripts: context.videoScripts,
                audioAssets: context.audioAssets,
                visualDirection: context.visualAssets
              }, runCtx);
              context.assembly = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateICP':
              result = await Steps.generateICP(targetLead, context.strategy, runCtx);
              context.icp = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateOffer':
              result = await Steps.generateOffer(targetLead, context.icp, runCtx);
              context.offer = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'GenerateOutreach':
              result = await Steps.generateOutreach(targetLead, context.offer, runCtx);
              context.outreach = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data), result.raw);
              break;

            case 'CreateFinalPackage':
              const report = await Steps.generateFinalReport(targetLead, context);
              this.addArtifact(run, step, 'markdown', report);
              break;

            case 'CompleteRun':
              const finalLeads = db.getLeads();
              const idx = finalLeads.findIndex(l => l.id === run!.leadId);
              if (idx !== -1) { 
                finalLeads[idx].locked = false; 
                db.saveLeads(finalLeads); 
              }
              break;
          }

          step.status = 'success';
          step.completedAt = Date.now();
        } catch (e: any) {
          step.status = 'failed';
          const finalErr = e.message || e.error || (typeof e === 'string' ? e : "Internal Orchestration Error");
          step.error = finalErr;
          run.status = 'failed';
          run.errorSummary = `Protocol terminated at '${step.name}': ${finalErr}`;
          db.saveRun(run);
          return;
        }
        db.saveRun(run);
        await new Promise(r => setTimeout(r, 800));
      }

      const finalRun = db.getRun(runId);
      if (finalRun && finalRun.status !== 'failed' && finalRun.status !== 'canceled') {
        finalRun.status = 'succeeded';
        finalRun.completedAt = Date.now();
        db.saveRun(finalRun);
      }
    } finally {
      this.activeRunIds.delete(runId);
    }
  }

  private hydrateContext(stepName: string, parsed: any, context: any) {
    if (stepName === 'ResolveLead') context.resolved = parsed;
    if (stepName === 'DeepResearch') context.research = parsed;
    if (stepName === 'ExtractSignals') context.signals = parsed;
    if (stepName === 'DecisionGovernor') context.governance = parsed;
    if (stepName === 'SynthesizeIntelligence') context.dossier = parsed;
    if (stepName === 'GenerateStrategy') context.strategy = parsed;
    if (stepName === 'GenerateTextAssets') context.textAssets = parsed;
    if (stepName === 'GenerateSocialAssets') context.socialAssets = parsed;
    if (stepName === 'GenerateVideoScripts') context.videoScripts = parsed;
    if (stepName === 'GenerateAudioAssets') context.audioAssets = parsed;
    if (stepName === 'GenerateVisualAssets') context.visualAssets = parsed;
    if (stepName === 'AssembleRun') context.assembly = parsed;
    if (stepName === 'GenerateICP') context.icp = parsed;
    if (stepName === 'GenerateOffer') context.offer = parsed;
    if (stepName === 'GenerateOutreach') context.outreach = parsed;
  }

  private addArtifact(run: AutomationRun, step: RunStep, type: 'json' | 'markdown' | 'text', content: string, rawResponse?: string) {
    const art: AutomationArtifact = { id: uuidLike(), runId: run.id, stepName: step.name, type, content, createdAt: Date.now() };
    run.artifacts.push(art);
    if (!step.outputArtifactIds) step.outputArtifactIds = [];
    step.outputArtifactIds.push(art.id);

    if (rawResponse) {
      const rawArt: AutomationArtifact = { id: uuidLike(), runId: run.id, stepName: `${step.name}_RAW`, type: 'text', content: rawResponse, createdAt: Date.now() };
      run.artifacts.push(rawArt);
      step.outputArtifactIds.push(rawArt.id);
    }
  }
}
