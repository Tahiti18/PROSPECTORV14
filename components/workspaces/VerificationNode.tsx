
import React, { useState, useEffect } from 'react';
import { db } from '../../services/automation/db';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { Lead } from '../../types';
import { toast } from '../../services/toastManager';
import { getStoredKeys } from '../../services/geminiService';

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

  const addLog = (msg: string) => setRunLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const generateScenario = (type: 'REGULATED' | 'LOW_EVIDENCE' | 'STRICT_IDENTITY') => {
    switch(type) {
      case 'REGULATED':
        setTestLead({ ...testLead, businessName: "Health Plus Clinic", niche: "Medical Aesthetics", websiteUrl: "https://healthplus.com" });
        toast.info("Scenario: Regulated Industry (Compliance Test)");
        break;
      case 'LOW_EVIDENCE':
        setTestLead({ ...testLead, businessName: "Shadow Firm", niche: "Stealth Tech", websiteUrl: "#", city: "Unknown" });
        toast.info("Scenario: Missing Data (Evidence Test)");
        break;
      case 'STRICT_IDENTITY':
        setTestLead({ ...testLead, businessName: "Ghost LLC", niche: "Import Export" });
        toast.info("Scenario: High Uncertainty (Identity Test)");
        break;
    }
  };

  const runTest = async (mode: 'full' | 'lite') => {
    setRunLogs([]);
    addLog(`INITIATING ${mode.toUpperCase()} TEST RUN...`);
    
    const keys = getStoredKeys();
    if (!keys.openRouter) {
        addLog("CRITICAL: OPENROUTER_API_KEY IS MISSING.");
        toast.error("Authorization Required.");
        return;
    }
    
    try {
      const mockId = `TEST_${Date.now()}`;
      const mockLead: Lead = { 
        ...testLead as Lead, 
        id: mockId, 
        status: 'cold', 
        rank: 999,
        niche: testLead.niche || 'Testing'
      };
      db.saveLeads([...db.getLeads(), mockLead]);
      
      const run = await AutomationOrchestrator.getInstance().startRun(mockId, mode);
      setActiveRunId(run.id);
      addLog(`RUN_ID ${run.id} SECURED. MONITORING TRACE...`);
    } catch (e: any) {
      addLog(`CRITICAL START ERROR: ${e.message}`);
      toast.error("Orchestrator failed to initialize.");
    }
  };

  useEffect(() => {
    if (!activeRunId) return;
    const interval = setInterval(() => {
      const run = db.getRun(activeRunId);
      if (run && (run.status === 'succeeded' || run.status === 'failed')) {
        addLog(`TEST SEQUENCE TERMINATED: ${run.status.toUpperCase()}`);
        setActiveRunId(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRunId]);

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">LOGIC <span className="text-emerald-500 not-italic">VERIFIER</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Non-SDK Inference Stress Test</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-800 pb-4">1. TEST SCENARIOS</h3>
              
              <div className="grid grid-cols-1 gap-3">
                 {[
                   { id: 'REGULATED', label: 'REGULATED COMPLIANCE', color: 'emerald' },
                   { id: 'LOW_EVIDENCE', label: 'LOW EVIDENCE SCAN', color: 'rose' },
                   { id: 'STRICT_IDENTITY', label: 'IDENTITY UNCERTAINTY', color: 'indigo' }
                 ].map(s => (
                   <button key={s.id} onClick={() => generateScenario(s.id as any)} className={`w-full py-4 rounded-2xl bg-slate-900 border-2 border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-${s.color}-500/50 transition-all text-left px-6 flex justify-between items-center group`}>
                     <span>{s.label}</span>
                     <div className={`w-2 h-2 rounded-full bg-${s.color}-500 shadow-[0_0_10px_currentcolor]`}></div>
                   </button>
                 ))}
              </div>

              <div className="p-6 bg-slate-950 rounded-3xl border-2 border-slate-800 space-y-4">
                 <div className="flex justify-between">
                    <span className="text-[9px] font-black text-slate-600 uppercase">Target</span>
                    <span className="text-[10px] font-bold text-white uppercase">{testLead.businessName}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-[9px] font-black text-slate-600 uppercase">Auth</span>
                    <span className="text-[10px] font-black text-emerald-500">REST_PROTOCOL</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-slate-800">
                 <button onClick={() => runTest('lite')} className="bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800">TEST LITE</button>
                 <button onClick={() => runTest('full')} className="bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-b-4 border-slate-900">TEST FULL</button>
              </div>
           </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
           <div className="bg-black border-2 border-slate-800 rounded-[48px] flex-1 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-8 border-b-2 border-slate-800 flex justify-between items-center bg-slate-950">
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activeRunId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">SECURED_TRACE_MESH</h3>
                 </div>
              </div>
              <div className="flex-1 p-8 font-mono text-[11px] overflow-y-auto custom-scrollbar space-y-2">
                 {runLogs.length === 0 && <div className="text-slate-800 italic uppercase tracking-[0.5em] text-center py-20">SYSTEM_IDLE: AWAITING TEST INITIATION</div>}
                 {runLogs.map((log, i) => (
                   <div key={i} className="flex gap-4 text-slate-400">
                      <span className="shrink-0 opacity-30 select-none">#{runLogs.length - i}</span>
                      <span className="whitespace-pre-wrap uppercase">{log}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
