import { AutomationRun, RunStep, AutomationArtifact, RunStatus } from './types';
import { db } from './db';
import { Steps } from './steps';
import { uuidLike } from '../usageLogger';

// Guardrail 1: Module-scoped flag prevents double-resume in React StrictMode
let didResumeOnce = false;

export class AutomationOrchestrator {
  private static instance: AutomationOrchestrator;
  
  // Guardrail 5: In-memory lock (Single Tab Safety)
  private activeRunIds = new Set<string>();

  private constructor() {}

  static getInstance(): AutomationOrchestrator {
    if (!AutomationOrchestrator.instance) {
      AutomationOrchestrator.instance = new AutomationOrchestrator();
    }
    return AutomationOrchestrator.instance;
  }

  // --- PUBLIC API ---

  async startRun(): Promise<AutomationRun> {
    const runId = uuidLike();
    
    // Check global mutex (handled by DB/external lock)
    const hasLock = await db.acquireMutex(runId, 5000);
    if (!hasLock) {
      throw new Error("System busy. Another automation is initializing. Please retry in 5 seconds.");
    }

    try {
      db.clearStaleLocks();

      const leads = db.getLeads();
      const eligible = leads
        .filter(l => !l.locked && l.status !== 'won')
        .sort((a, b) => b.leadScore - a.leadScore);

      if (eligible.length === 0) {
        throw new Error("No eligible leads found (all locked or converted).");
      }

      const selectedLead = eligible[0];
      const now = Date.now();
      const expiresAt = now + (30 * 60 * 1000); // 30 min lock
      
      const updatedLeads = leads.map(l => {
        if (l.id === selectedLead.id) {
          return {
            ...l,
            locked: true,
            lockedAt: now,
            lockedByRunId: runId,
            lockExpiresAt: expiresAt
          };
        }
        return l;
      });
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
      db.saveRun(run);
      db.releaseMutex(runId);
      
      // Fire & Forget
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

  async cancelRun(runId: string): Promise<void> {
    const run = db.getRun(runId);
    if (run && (run.status === 'queued' || run.status === 'running')) {
      run.status = 'canceled';
      run.completedAt = Date.now();
      db.saveRun(run);
    }
  }

  public async resumeInterruptedRuns() {
    // Guardrail 1: Single initialization per app lifecycle
    if (didResumeOnce) return;
    didResumeOnce = true;

    const all = db.listRuns();
    const now = Date.now();
    const MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours

    // Guardrail 3: Stale cleanup
    const stale = all.filter(r => 
      r.status === 'running' && 
      (!r.startedAt || (now - r.startedAt >= MAX_AGE))
    );
    
    for (const r of stale) {
      console.warn(`[Orchestrator] Marking stale run ${r.id} as failed.`);
      r.status = 'failed';
      r.errorSummary = 'System: Run expired during interruption (stale).';
      r.completedAt = now;
      db.saveRun(r);
    }

    // Guardrail 2: Strict resume filter
    // Fixed: Removed redundant check causing TS narrowing error
    const interrupted = all.filter(r => 
      r.status === 'running' && 
      !r.completedAt && 
      r.startedAt && 
      (now - r.startedAt < MAX_AGE) &&
      r.steps.some(s => s.status !== 'success') // Must be actually incomplete
    );

    for (const run of interrupted) {
      console.log(`[Orchestrator] Resuming interrupted run ${run.id}`);
      this.processRun(run.id);
    }
  }

  // --- INTERNAL ENGINE ---

  private initializeSteps(): RunStep[] {
    return [
      { name: 'EnrichLead', status: 'pending', attempts: 0 },
      { name: 'GenerateICP', status: 'pending', attempts: 0 },
      { name: 'GenerateOffer', status: 'pending', attempts: 0 },
      { name: 'GenerateOutreach', status: 'pending', attempts: 0 },
      { name: 'CreateFinalPackage', status: 'pending', attempts: 0 },
      { name: 'CompleteRun', status: 'pending', attempts: 0 },
    ];
  }

  private async processRun(runId: string) {
    // Guardrail 5: In-memory dedupe
    if (this.activeRunIds.has(runId)) return;
    this.activeRunIds.add(runId);

    try {
      let run = db.getRun(runId);
      
      // Initial sanity check
      if (!run || run.status === 'canceled' || run.status === 'failed' || run.status === 'succeeded') {
        return;
      }

      if (run.status === 'queued') {
        run.status = 'running';
        run.startedAt = Date.now();
        db.saveRun(run);
      }

      let context: any = {};

      for (let i = 0; i < run.steps.length; i++) {
        // Atomic Check: Re-fetch run to catch external cancels
        const currentRun = db.getRun(runId);
        if (!currentRun || currentRun.status === 'canceled') {
           console.log(`[Orchestrator] Run ${runId} stopped (canceled/missing).`);
           return;
        }
        
        run = currentRun;
        const step = run.steps[i];
        
        // Guardrail 4: Idempotency (Skip success)
        if (step.status === 'success') {
          // Context Re-hydration
          const artifactId = step.outputArtifactIds?.[0];
          if (artifactId) {
            const art = run.artifacts.find(a => a.id === artifactId);
            if (art && art.type === 'json') {
               try {
                  if (step.name === 'EnrichLead') context.enrichment = JSON.parse(art.content);
                  if (step.name === 'GenerateICP') context.icp = JSON.parse(art.content);
                  if (step.name === 'GenerateOffer') context.offer = JSON.parse(art.content);
                  if (step.name === 'GenerateOutreach') context.outreach = JSON.parse(art.content);
               } catch(e) {}
            }
          }
          continue;
        }

        step.status = 'running';
        step.startedAt = Date.now();
        db.saveRun(run);

        try {
          const leads = db.getLeads();
          const targetLead = leads.find(l => l.id === run!.leadId);
          if (!targetLead) throw new Error("Target lead missing.");

          switch (step.name) {
            case 'EnrichLead':
              const enrichment = await Steps.enrichLead(targetLead);
              context.enrichment = JSON.parse(enrichment);
              this.addArtifact(run, step, 'json', enrichment);
              break;

            case 'GenerateICP':
              const icp = await Steps.generateICP(targetLead, context.enrichment);
              context.icp = JSON.parse(icp);
              this.addArtifact(run, step, 'json', icp);
              break;

            case 'GenerateOffer':
              const offer = await Steps.generateOffer(targetLead, context.icp);
              context.offer = JSON.parse(offer);
              this.addArtifact(run, step, 'json', offer);
              break;

            case 'GenerateOutreach':
              const outreach = await Steps.generateOutreach(targetLead, context.offer);
              context.outreach = JSON.parse(outreach);
              this.addArtifact(run, step, 'json', outreach);
              break;

            case 'CreateFinalPackage':
              const report = await Steps.generateFinalReport(targetLead, context);
              this.addArtifact(run, step, 'markdown', report);
              
              const replay = this.generateManualReplay(run);
              this.addArtifact(run, step, 'markdown', replay);
              const replayJson = this.generateManualReplayJson(run);
              this.addArtifact(run, step, 'json', JSON.stringify(replayJson));
              break;

            case 'CompleteRun':
              const finalLeads = db.getLeads();
              const idx = finalLeads.findIndex(l => l.id === run!.leadId);
              if (idx !== -1) {
                finalLeads[idx].locked = false; 
                finalLeads[idx].status = 'queued';
                finalLeads[idx].lockedByRunId = undefined;
                finalLeads[idx].lockExpiresAt = undefined;
                db.saveLeads(finalLeads);
              }
              break;
          }

          step.status = 'success';
          step.completedAt = Date.now();
        } catch (e: any) {
          console.error(`Step ${step.name} failed:`, e);
          step.status = 'failed';
          step.error = e.message;
          step.attempts++;
          run.status = 'failed';
          run.errorSummary = `Failed at ${step.name}: ${e.message}`;
          db.saveRun(run);
          return;
        }

        db.saveRun(run);
        await new Promise(r => setTimeout(r, 1200));
      }

      const finalRun = db.getRun(runId);
      if (finalRun && finalRun.status !== 'failed' && finalRun.status !== 'canceled') {
        finalRun.status = 'succeeded';
        finalRun.completedAt = Date.now();
        db.saveRun(finalRun);
      }

    } catch (e) {
      console.error("Run loop error", e);
    } finally {
      this.activeRunIds.delete(runId);
    }
  }

  private addArtifact(run: AutomationRun, step: RunStep, type: 'json' | 'markdown' | 'text', content: string) {
    const art: AutomationArtifact = {
      id: uuidLike(),
      runId: run.id,
      stepName: step.name,
      type,
      content,
      createdAt: Date.now()
    };
    run.artifacts.push(art);
    if (!step.outputArtifactIds) step.outputArtifactIds = [];
    step.outputArtifactIds.push(art.id);
  }

  private generateManualReplay(run: AutomationRun): string {
    const lines = [
      `# Manual Replay Guide: ${run.leadName}`,
      `**Run ID:** ${run.id}`,
      `**Date:** ${new Date(run.createdAt).toLocaleString()}`,
      `**Score:** ${run.leadScore}`,
      ``,
      `## Execution Sequence`,
      ``
    ];
    run.steps.forEach((s, i) => {
      lines.push(`### ${i + 1}. ${s.name}`);
      lines.push(`- **Status:** ${s.status.toUpperCase()}`);
      lines.push(``);
    });
    return lines.join('\n');
  }

  private generateManualReplayJson(run: AutomationRun): any {
    return {
      runId: run.id,
      leadName: run.leadName,
      timestamp: new Date(run.createdAt).toISOString(),
      steps: run.steps.map(s => ({
        name: s.name,
        status: s.status,
        outputs: s.outputArtifactIds
      }))
    };
  }
}