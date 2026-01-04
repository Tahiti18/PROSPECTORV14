
import React, { useEffect, useState } from 'react';
import { AutomationRun, AutomationArtifact } from '../../services/automation/types';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { db } from '../../services/automation/db';

interface RunStatusProps {
  runId: string;
  onClose: () => void;
}

// Metadata map to replace deleted schema fields (goal, label, etc.)
// This ensures DB schema remains pure/technical while UI remains rich.
const STEP_META: Record<string, { label: string; goal: string }> = {
  EnrichLead: { label: 'Enrich Lead', goal: 'Gather industry intelligence' },
  GenerateICP: { label: 'Generate ICP', goal: 'Define buyer persona' },
  GenerateOffer: { label: 'Generate Offer', goal: 'Create value angles' },
  GenerateOutreach: { label: 'Generate Outreach', goal: 'Draft communication assets' },
  CreateFinalPackage: { label: 'Final Package', goal: 'Compile deliverables' },
  CompleteRun: { label: 'Complete Run', goal: 'Finalize and unlock' }
};

export const RunStatus: React.FC<RunStatusProps> = ({ runId, onClose }) => {
  const [run, setRun] = useState<AutomationRun | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'artifacts' | 'replay'>('progress');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      const data = await AutomationOrchestrator.getInstance().getRun(runId);
      if (data) {
        setRun(data);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    };
    poll();
    const interval = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [runId]);

  const handleClearDB = () => {
    if (confirm("This will clear the automation database history. Are you sure?")) {
      db.clearRunsDB();
      onClose();
    }
  };

  if (notFound) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
        <div className="bg-slate-900 border border-rose-500/50 p-8 rounded-2xl text-center max-w-md shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2">Run Not Found</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The requested automation run ID could not be retrieved. It may have been corrupted, cleared, or failed to initialize correctly.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={handleClearDB} className="px-6 py-2 bg-rose-900/50 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-black uppercase tracking-widest border border-rose-500/20">
              Clear Automation DB
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-black uppercase tracking-widest border border-slate-700">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!run) return <div className="fixed inset-0 bg-black/80 flex items-center justify-center text-slate-500 animate-pulse z-[200]">Initializing run context...</div>;

  const downloadArtifact = (art: AutomationArtifact) => {
    if (!art.content) return;
    const blob = new Blob([art.content], { type: art.type === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Derive label/filename from step name since 'label' field is removed from DB schema
    const label = `${art.stepName} Output`;
    a.download = `${label.replace(/\s+/g, '_')}_${run.leadName}.${art.type === 'json' ? 'json' : 'md'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Find replay artifact by step name and content scan (robust detection)
  const manualReplay = run.artifacts.find(a => a.stepName === 'CreateFinalPackage' && a.type === 'markdown' && a.content.includes('# Manual Replay'));

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
              ONE-CLICK <span className="text-indigo-500">RUNNER</span>
              {run.status === 'running' && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Target: {run.leadName} | Status: {run.status}</p>
          </div>
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white">CLOSE</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950">
          {['progress', 'artifacts', 'replay'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'replay' ? 'MANUAL REPLAY' : tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#020617]">
          
          {activeTab === 'progress' && (
            <div className="space-y-4">
              {run.steps.map((step, i) => {
                const meta = STEP_META[step.name] || { label: step.name, goal: 'Execute Protocol' };
                return (
                  <div key={step.name} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    step.status === 'running' ? 'bg-indigo-600/10 border-indigo-500/30' :
                    step.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                    step.status === 'failed' ? 'bg-rose-500/10 border-rose-500/30' :
                    'bg-slate-900 border-slate-800 opacity-60'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        step.status === 'success' ? 'bg-emerald-500 text-black' : 
                        step.status === 'running' ? 'bg-indigo-600 text-white animate-pulse' : 
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wide">{meta.label}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{meta.goal}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                        step.status === 'success' ? 'text-emerald-400 bg-emerald-500/10' : 
                        step.status === 'running' ? 'text-indigo-400 bg-indigo-500/10' : 
                        'text-slate-600 bg-slate-800'
                      }`}>
                        {step.status}
                      </span>
                      {step.error && <span className="text-[9px] text-rose-500 mt-1 max-w-xs text-right truncate">{step.error}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'artifacts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {run.artifacts.filter(a => !a.content.includes('# Manual Replay')).map(art => (
                <div key={art.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group hover:border-indigo-500/40 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{art.type}</span>
                    <button onClick={() => downloadArtifact(art)} className="text-[9px] font-black text-indigo-400 hover:text-white uppercase tracking-widest">DOWNLOAD</button>
                  </div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight mb-2">{art.stepName} Output</h4>
                  <div className="h-24 overflow-hidden relative">
                    <pre className="text-[10px] text-slate-400 font-mono leading-relaxed opacity-70">{art.content.slice(0, 300)}...</pre>
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  </div>
                </div>
              ))}
              {run.artifacts.length === 0 && <div className="text-slate-500 text-center col-span-2 py-20 italic font-medium">No artifacts generated yet. Wait for pipeline completion.</div>}
            </div>
          )}

          {activeTab === 'replay' && (
            <div className="space-y-6">
              {manualReplay ? (
                <>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => downloadArtifact(manualReplay)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                    >
                      DOWNLOAD GUIDE
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(manualReplay.content)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      COPY MARKDOWN
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-slate-300">{manualReplay.content}</pre>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-center py-20 italic font-medium">Replay guide is generated at the end of the run.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
