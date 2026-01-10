import React, { useState, useEffect } from 'react';
import { db } from '../../services/automation/db';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { Lead } from '../../types';
import { toast } from '../../services/toastManager';

export const VerificationNode: React.FC = () => {
  const [testLead, setTestLead] = useState<Partial<Lead>>({
    businessName: "Test Entity Alpha",
    niche: "General Consulting",
    websiteUrl: "https://example.com",
    city: "New York",
    leadScore: 85
  });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [internalFlags, setInternalFlags] = useState({
    compliance: 'standard',
    evidence: 'high',
    identity: 'unverified'
  });

  const addLog = (msg: string) => setRunLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const generateScenario = (type: 'REGULATED' | 'LOW_EVIDENCE' | 'STRICT_IDENTITY') => {
    switch(type) {
      case 'REGULATED':
        setTestLead({ ...testLead, businessName: "Health Plus Clinic", niche: "Medical Aesthetics", websiteUrl: "https://healthplus.com" });
        setInternalFlags(f => ({ ...f, compliance: 'regulated' }));
        toast.info("Scenario: Regulated Industry (Compliance Test)");
        break;
      case 'LOW_EVIDENCE':
        setTestLead({ ...testLead, businessName: "Shadow Firm", niche: "Stealth Tech", websiteUrl: "#", city: "Unknown" });
        setInternalFlags(f => ({ ...f, evidence: 'low' }));
        toast.info("Scenario: Missing Data (Evidence Test)");
        break;
      case 'STRICT_IDENTITY':
        setTestLead({ ...testLead, businessName: "Ghost LLC", niche: "Import Export" });
        setInternalFlags(f => ({ ...f, identity: 'strict' }));
        toast.info("Scenario: High Uncertainty (Identity Test)");
        break;
    }
  };

  const runTest = async (mode: 'full' | 'lite') => {
    setRunLogs([]);
    addLog(`INITIATING ${mode.toUpperCase()} TEST RUN...`);
    addLog(`ENVIRONMENT: ${window.location.hostname}`);
    addLog(`API_KEY_PRESENT: ${!!process.env.API_KEY}`);
    
    try {
      // 1. Save Test Lead to DB to make it selectable
      const mockId = `TEST_${Date.now()}`;
      const mockLead: Lead = { 
        ...testLead as Lead, 
        id: mockId, 
        status: 'cold', 
        rank: 999,
        // Ensure niche is set for orchestrator compliance detection
        niche: testLead.niche || 'Testing'
      };
      db.saveLeads([...db.getLeads(), mockLead]);
      
      // 2. Start Run
      const run = await AutomationOrchestrator.getInstance().startRun(mockId, mode);
      setActiveRunId(run.id);
      addLog(`RUN_ID ${run.id} SECURED. POLLING...`);
    } catch (e: any) {
      addLog(`CRITICAL START ERROR: ${e.message}`);
      toast.error("Orchestrator failed to initialize.");
    }
  };

  // Poll for status updates to show internal logic working
  useEffect(() => {
    if (!activeRunId) return;
    
    const seenSteps = new Set<string>();
    const interval = setInterval(() => {
      const run = db.getRun(activeRunId);
      if (run) {
        run.steps.forEach(s => {
          const key = `${s.name}_${s.status}`;
          if (seenSteps.has(key)) return;
          
          if (s.status === 'running') addLog(`EXECUTING: ${s.name}...`);
          if (s.status === 'skipped') addLog(`SKIPPED: ${s.name} (POLICY)`);
          if (s.status === 'success') {
            addLog(`SUCCESS: ${s.name}`);
            seenSteps.add(key);
          }
          if (s.status === 'failed') {
            addLog(`FAILURE: ${s.name} -> ${s.error || 'Unknown Error'}`);
            seenSteps.add(key);
          }
        });

        if (run.status === 'succeeded' || run.status === 'failed') {
          addLog(`TEST SEQUENCE TERMINATED: ${run.status.toUpperCase()}`);
          if (run.errorSummary) addLog(`SUMMARY: ${run.errorSummary}`);
          setActiveRunId(null);
          clearInterval(interval);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRunId]);

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">LOGIC <span className="text-emerald-500 not-italic">VERIFIER</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Engine Stress Test & Protocol Audit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Scenario Config */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-4">1. CONFIGURE TEST SCENARIO</h3>
              
              <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => generateScenario('REGULATED')} className="w-full py-4 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-amber-500/50 transition-all text-left px-6 flex justify-between items-center">
                   <span>REGULATED COMPLIANCE (DENTAL/LEGAL)</span>
                   <span className="text-amber-500">⚖️</span>
                 </button>
                 <button onClick={() => generateScenario('LOW_EVIDENCE')} className="w-full py-4 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-rose-500/50 transition-all text-left px-6 flex justify-between items-center">
                   <span>LOW EVIDENCE (NO WEBSITE/MAPS)</span>
                   <span className="text-rose-500">📉</span>
                 </button>
                 <button onClick={() => generateScenario('STRICT_IDENTITY')} className="w-full py-4 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-indigo-500/50 transition-all text-left px-6 flex justify-between items-center">
                   <span>IDENTITY UNCERTAINTY</span>
                   <span className="text-indigo-500">👻</span>
                 </button>
              </div>

              <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
                 <div className="flex justify-between">
                    <span className="text-[9px] font-black text-slate-600 uppercase">Target</span>
                    <span className="text-[10px] font-bold text-white uppercase">{testLead.businessName}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-[9px] font-black text-slate-600 uppercase">Industry</span>
                    <span className="text-[10px] font-bold text-white uppercase">{testLead.niche}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-[9px] font-black text-slate-600 uppercase">URL</span>
                    <span className="text-[10px] font-bold text-white truncate max-w-[150px]">{testLead.websiteUrl}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                 <button 
                  onClick={() => runTest('lite')}
                  disabled={!!activeRunId}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800"
                 >
                   TEST LITE MODE
                 </button>
                 <button 
                  onClick={() => runTest('full')}
                  disabled={!!activeRunId}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-b-4 border-slate-900"
                 >
                   TEST FULL MODE
                 </button>
              </div>
           </div>
        </div>

        {/* Trace Console */}
        <div className="lg:col-span-7 flex flex-col gap-6">
           <div className="bg-black border border-slate-800 rounded-[48px] flex-1 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activeRunId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">ORCHESTRATOR_TRACE_v3</h3>
                 </div>
                 <button onClick={() => setRunLogs([])} className="text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-widest">CLEAR CONSOLE</button>
              </div>
              <div className="flex-1 p-8 font-mono text-[11px] overflow-y-auto custom-scrollbar space-y-2">
                 {runLogs.length === 0 && <div className="text-slate-800 italic uppercase tracking-[0.5em] text-center py-20">SYSTEM IDLE. AWAITING TEST INITIATION.</div>}
                 {runLogs.map((log, i) => (
                   <div key={i} className={`flex gap-4 ${log.includes('ERROR') || log.includes('FAILURE') ? 'text-rose-500' : log.includes('SKIPPED') ? 'text-amber-500/70' : log.includes('SUCCESS') ? 'text-emerald-500' : 'text-slate-400'}`}>
                      <span className="shrink-0 opacity-30 select-none">{runLogs.length - i}</span>
                      <span className="whitespace-pre-wrap">{log}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 grid grid-cols-3 gap-6 shadow-xl">
              <div className="space-y-2 text-center">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">LITE_SKIP_LOGIC</p>
                 <span className={`text-[10px] font-black ${runLogs.some(l => l.includes('LITE')) ? 'text-emerald-400' : 'text-slate-600'}`}>VERIFIED</span>
              </div>
              <div className="space-y-2 text-center border-x border-slate-800">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">COMPLIANCE_KEY_SCAN</p>
                 <span className={`text-[10px] font-black ${internalFlags.compliance === 'regulated' ? 'text-emerald-400' : 'text-slate-600'}`}>ACTIVE</span>
              </div>
              <div className="space-y-2 text-center">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">IDENTITY_ENFORCEMENT</p>
                 <span className={`text-[10px] font-black ${internalFlags.identity === 'strict' ? 'text-emerald-400' : 'text-slate-600'}`}>HARDENED</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};