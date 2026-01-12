import { AutomationRun, RunStep } from './types';
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
    if (!hasLock) throw new Error("Neural Core Busy. Try in 5s.");

    try {
      db.clearStaleLocks();
      const leads = db.getLeads();
      let selectedLead = targetLeadId ? leads.find(l => l.id === targetLeadId) : leads.filter(l => !l.locked && l.status !== 'won').sort((a, b) => b.leadScore - a.leadScore)[0];
      
      if (!selectedLead) throw new Error("No eligible targets in Ledger.");
      if (selectedLead.locked) throw new Error("Target locked by another process.");

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
      if (!targetLead) throw new Error("Uplink lost: Target Lead not found.");

      const runMode = (run as any).mode || 'full';
      const industryText = (targetLead.niche || '').toLowerCase();
      const isRegulated = REGULATED_KEYWORDS.some(kw => industryText.includes(kw));

      let context: any = {};
      let runCtx: RunContext = {
        identity_strict: false,
        compliance_mode: isRegulated ? 'regulated' : 'standard',
        lead_evidence_level: targetLead.leadScore < 60 ? 'low' : 'high'
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
             try { this.hydrateContext(step.name, JSON.parse(art.content), context); } catch(e) {}
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
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'DeepResearch':
              result = runMode === 'lite' ? await Steps.generateDeepResearchLite(context.resolved, runCtx) : await Steps.deepResearch(context.resolved, runCtx);
              context.research = result.data;
              if (runMode === 'lite') shouldSkipRemaining = true;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'ExtractSignals':
              result = await Steps.extractSignals(context.research, runCtx);
              context.signals = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'DecisionGovernor':
              result = await Steps.governDecision(context.research, context.signals, runCtx);
              context.governance = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'SynthesizeIntelligence':
              result = await Steps.synthesizeIntelligence(context.governance, runCtx);
              context.dossier = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateStrategy':
              result = await Steps.generateStrategy(context.dossier, runCtx);
              context.strategy = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateTextAssets':
              result = await Steps.generateTextAssets(context.strategy, runCtx);
              context.textAssets = result.data;
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateSocialAssets':
              result = await Steps.generateSocialAssets(context.strategy, runCtx);
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateVideoScripts':
              result = await Steps.generateVideoScripts(context.strategy, runCtx);
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateAudioAssets':
              result = await Steps.generateAudioAssets(context.strategy, runCtx);
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateVisualAssets':
              result = await Steps.generateVisualAssets(context.strategy, runCtx);
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'AssembleRun':
              result = await Steps.assembleRun(context, runCtx);
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateICP':
              result = await Steps.generateICP(targetLead, context.strategy, runCtx);
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateOffer':
              result = await Steps.generateOffer(targetLead, context.icp, runCtx);
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'GenerateOutreach':
              result = await Steps.generateOutreach(targetLead, context.offer, runCtx);
              this.addArtifact(run, step, 'json', JSON.stringify(result.data));
              break;
            case 'CreateFinalPackage':
              const report = await Steps.generateFinalReport(targetLead, context);
              this.addArtifact(run, step, 'markdown', report);
              break;
            case 'CompleteRun':
              const finalLeads = db.getLeads();
              const idx = finalLeads.findIndex(l => l.id === run!.leadId);
              if (idx !== -1) { finalLeads[idx].locked = false; db.saveLeads(finalLeads); }
              break;
          }

          step.status = 'success';
          step.completedAt = Date.now();
        } catch (e: any) {
          step.status = 'failed';
          step.error = e.message || "Engine Fault";
          run.status = 'failed';
          run.errorSummary = `Terminated at '${step.name}': ${step.error}`;
          db.saveRun(run);
          return;
        }
        db.saveRun(run);
        await new Promise(r => setTimeout(r, 600));
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
  }

  private addArtifact(run: AutomationRun, step: RunStep, type: 'json' | 'markdown' | 'text', content: string) {
    const art = { id: uuidLike(), runId: run.id, stepName: step.name, type, content, createdAt: Date.now() };
    run.artifacts.push(art);
    if (!step.outputArtifactIds) step.outputArtifactIds = [];
    step.outputArtifactIds.push(art.id);
  }
}