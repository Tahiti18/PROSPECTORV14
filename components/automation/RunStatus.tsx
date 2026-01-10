import React, { useEffect, useState, useMemo } from 'react';
import { AutomationRun, AutomationArtifact } from '../../services/automation/types';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { FormattedOutput } from '../common/FormattedOutput';

interface RunStatusProps {
  runId: string;
  onClose: () => void;
}

const STEP_META: Record<string, { label: string; goal: string }> = {
  ResolveLead: { label: 'Resolve Identity', goal: 'Normalize lead data structure' },
  DeepResearch: { label: 'Deep Research', goal: 'Factual discovery and dossier building' },
  ExtractSignals: { label: 'Extract Signals', goal: 'Identify revenue leverage points' },
  DecisionGovernor: { label: 'Decision Governor', goal: 'Arbitrate truth and confidence' },
  SynthesizeIntelligence: { label: 'Synthesize Intel', goal: 'Construct commercial dossier' },
  GenerateStrategy: { label: 'Build Strategy', goal: 'Architect marketing war plan' },
  GenerateTextAssets: { label: 'Production (Text)', goal: 'Draft copy for ads and site' },
  GenerateSocialAssets: { label: 'Production (Social)', goal: 'Generate social media content' },
  GenerateVideoScripts: { label: 'Production (Video)', goal: 'Generate scripts for reels and ads' },
  GenerateAudioAssets: { label: 'Production (Audio)', goal: 'Generate voice and ad scripts' },
  GenerateVisualAssets: { label: 'Production (Visual)', goal: 'Define art direction and shot lists' },
  AssembleRun: { label: 'Orchestration', goal: 'Assemble assets into executable run' },
  GenerateICP: { label: 'Generate ICP', goal: 'Define buyer persona' },
  GenerateOffer: { label: 'Generate Offer', goal: 'Create value angles' },
  GenerateOutreach: { label: 'Generate Outreach', goal: 'Draft communication assets' },
  CreateFinalPackage: { label: 'Final Package', goal: 'Compile deliverables' },
  CompleteRun: { label: 'Complete Run', goal: 'Finalize and unlock' }
};

const REGULATED_KEYWORDS = ['medical', 'health', 'dental', 'dentist', 'aesthetics', 'legal', 'finance', 'banking', 'insurance'];

export const RunStatus: React.FC<RunStatusProps> = ({ runId, onClose }) => {
  const [run, setRun] = useState<AutomationRun | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'artifacts' | 'raw'>('progress');
  const [selectedRawAssetId, setSelectedRawAssetId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      const data = await AutomationOrchestrator.getInstance().getRun(runId);
      if (data) { setRun(data); setNotFound(false); } 
      else { setNotFound(true); }
    };
    poll();
    const interval = setInterval(poll, 1500);
    return () => { active = false; clearInterval(interval); };
  }, [runId]);

  // Derived run context logic for UI display
  const runContext = useMemo(() => {
    if (!run) return null;
    
    // Check if identity is strict (unconfirmed)
    const resolveArt = run.artifacts.find(a => a.stepName === 'ResolveLead' && a.type === 'json');
    const researchArt = run.artifacts.find(a => a.stepName === 'DeepResearch' && a.type === 'json');
    
    let identityStrict = false;
    try {
        if (resolveArt) {
            const parsed = JSON.parse(resolveArt.content);
            if (parsed.resolved_lead?.business_confirmed === false) identityStrict = true;
        }
        if (researchArt) {
            const parsed = JSON.parse(researchArt.content);
            if (parsed.identity_resolution?.business_confirmed === false) identityStrict = true;
        }
    } catch(e) {}

    // Compliance detection
    const niche = run.artifacts.find(a => a.stepName === 'ResolveLead')?.content?.toLowerCase() || "";
    const isRegulated = REGULATED_KEYWORDS.some(ind => niche.includes(ind));
    
    return {
      compliance_mode: isRegulated ? 'regulated' : 'standard',
      evidence_level: run.leadScore && run.leadScore < 60 ? 'low' : 'high',
      identity_strict: identityStrict
    };
  }, [run]);

  if (notFound) return <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] font-black uppercase text-white">Run Not Found</div>;
  if (!run) return <div className="fixed inset-0 bg-black/80 flex items-center justify-center text-slate-500 animate-pulse z-[200] font-black uppercase">Syncing Neural Core...</div>;

  const downloadArtifact = (art: AutomationArtifact) => {
    const blob = new Blob([art.content], { type: art.type === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${art.stepName}_${run.leadName}.${art.type === 'json' ? 'json' : 'md'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const rawArtifacts = run.artifacts.filter(a => a.stepName.endsWith('_RAW') || a.stepName.includes('_FAILURE_RAW'));
  const cleanArtifacts = run.artifacts.filter(a => !a.stepName.endsWith('_RAW') && !a.stepName.includes('_FAILURE_RAW'));

  const selectedRaw = rawArtifacts.find(a => a.id === selectedRawAssetId);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
      <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] w-full max-w-5xl h-[85vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden">
        
        {/* HEADER */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <div>
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">V3 <span className="text-emerald-500">ENGINE</span></h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{run.leadName} • {run.status}</p>
               {runContext && (
                 <div className="flex gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${runContext.compliance_mode === 'regulated' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                      {runContext.compliance_mode === 'regulated' ? 'REGULATED_COMPLIANCE' : 'STANDARD_COMPLIANCE'}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${runContext.evidence_level === 'low' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                      EVIDENCE: {runContext.evidence_level.toUpperCase()}
                    </span>
                    {runContext.identity_strict && (
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse">
                        IDENTITY_STRICT
                      </span>
                    )}
                 </div>
               )}
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase text-white border border-slate-700">CLOSE MONITOR</button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          {[
            { id: 'progress', label: 'EXECUTION TRACE' },
            { id: 'artifacts', label: 'COMPILED ASSETS' },
            { id: 'raw', label: 'NEURAL RAW OUTPUTS' }
          ].map(tab => (
            <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-emerald-600/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#020617] custom-scrollbar">
          
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {run.steps.map((step, i) => {
                const meta = STEP_META[step.name] || { label: step.name, goal: 'Execute' };
                const isFailed = step.status === 'failed';
                const isRunning = step.status === 'running';
                const isSuccess = step.status === 'success';

                return (
                  <div key={step.name} className={`p-6 rounded-3xl border transition-all ${isRunning ? 'bg-indigo-600/10 border-indigo-500/40 ring-1 ring-indigo-500/20' : isSuccess ? 'bg-emerald-500/5 border-emerald-500/20 opacity-90' : isFailed ? 'bg-rose-500/10 border-rose-500/40' : 'bg-slate-900/50 border-slate-800 opacity-40'}`}>
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${isSuccess ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : isFailed ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-500'}`}>
                            {isSuccess ? '✓' : isFailed ? '!' : i + 1}
                        </div>
                        <div>
                          <h4 className={`text-sm font-black uppercase tracking-wide ${isFailed ? 'text-rose-400' : 'text-white'}`}>{meta.label}</h4>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{meta.goal}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${isRunning ? 'text-indigo-400 border-indigo-500/30 animate-pulse' : isSuccess ? 'text-emerald-400 border-emerald-500/20' : isFailed ? 'text-rose-400 border-rose-500/30' : 'text-slate-600 border-slate-800'}`}>
                            {step.status}
                        </span>
                      </div>
                    </div>

                    {isFailed && (
                        <div className="mt-6 p-6 bg-black/40 border border-rose-500/20 rounded-2xl space-y-4">
                           <div>
                             <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">FAIL_TRACE:</p>
                             <p className="text-xs text-rose-200 font-mono leading-relaxed">{step.error}</p>
                           </div>
                           <div className="flex gap-3">
                              <button 
                                onClick={() => setActiveTab('raw')}
                                className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-500/30 transition-all"
                              >
                                VIEW RAW OUTPUT
                              </button>
                           </div>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'artifacts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cleanArtifacts.map(art => (
                <div key={art.id} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] hover:border-emerald-500/30 transition-all flex flex-col group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-3 py-1 bg-black rounded-lg border border-slate-800">{art.type}</span>
                    <button onClick={() => downloadArtifact(art)} className="text-[9px] font-black text-emerald-500 hover:text-white uppercase tracking-widest">DOWNLOAD</button>
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight mb-4">{art.stepName}</h4>
                  <div className="flex-1 bg-black/40 p-6 rounded-xl border border-slate-800/50 overflow-y-auto max-h-96 custom-scrollbar relative">
                    <FormattedOutput content={art.content} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'raw' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[500px]">
                <div className="lg:col-span-1 space-y-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">NEURAL NODES</h3>
                    {rawArtifacts.map(art => (
                        <button 
                            key={art.id}
                            onClick={() => setSelectedRawAssetId(art.id)}
                            className={`w-full text-left p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedRawAssetId === art.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                        >
                            {art.stepName.replace('_RAW', '').replace('_FAILURE', ' (FAILED)')}
                        </button>
                    ))}
                    {rawArtifacts.length === 0 && <p className="text-[10px] text-slate-700 italic px-2">No raw data available.</p>}
                </div>
                <div className="lg:col-span-2 h-full flex flex-col">
                    {selectedRaw ? (
                        <div className="bg-black border border-slate-800 rounded-[32px] p-8 h-full flex flex-col shadow-inner">
                            <div className="flex justify-between items-center mb-6">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedRaw.stepName.includes('FAILURE') ? 'text-rose-400' : 'text-indigo-400'}`}>
                                    {selectedRaw.stepName.includes('FAILURE') ? 'FAILED_TRACE_DECODED' : 'NEURAL_TRACE_ACTIVE'}
                                </span>
                                <button onClick={() => navigator.clipboard.writeText(selectedRaw.content)} className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest">COPY RAW</button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 p-6 rounded-2xl border border-slate-900">
                                <FormattedOutput content={selectedRaw.content} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-slate-800 rounded-[32px] flex items-center justify-center text-slate-700 opacity-50 italic uppercase tracking-[0.4em] font-black">
                            SELECT NODE TO VIEW NEURAL DATA
                        </div>
                    )}
                </div>
             </div>
          )}

        </div>

        {/* FOOTER STATS */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center px-10">
           <div className="flex gap-10">
              <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">ARTIFACTS</span>
                  <span className="text-xs font-black text-white">{run.artifacts.length}</span>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${run.status === 'running' ? 'bg-indigo-500 animate-pulse' : run.status === 'succeeded' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TRACE_ID: {runId.slice(-8)}</span>
           </div>
        </div>
      </div>
    </div>
  );
};
