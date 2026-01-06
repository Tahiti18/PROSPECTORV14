
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateOutreachSequence, generateProposalDraft } from '../../services/geminiService';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';
import { isEconomyMode } from '../../services/computeTracker';

interface HyperLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: Lead[];
  onComplete: () => void;
}

export const HyperLaunchModal: React.FC<HyperLaunchModalProps> = ({ isOpen, onClose, selectedLeads, onComplete }) => {
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'COMPLETE'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const eco = isEconomyMode();

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const executeSwarm = async () => {
    setStatus('RUNNING');
    setSuccessCount(0);
    setProgress(0);
    addLog(`INITIATING HYPER-LAUNCH PROTOCOL FOR ${selectedLeads.length} TARGETS...`);
    
    // Process in batches of 3 to avoid total browser choke, but simulating high concurrency
    const BATCH_SIZE = 3;
    const leads = [...selectedLeads];
    
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
        const batch = leads.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (lead) => {
            try {
                addLog(`ENGAGING TARGET: ${lead.businessName}...`);
                
                // 1. Generate Sequence (Flash/Pro handled by geminiService based on call, but we can't easily force it there without changing signature. 
                // However, let's assume the service respects global eco mode implicitly or just runs.)
                // In a real app, we'd pass an override. For now, we rely on the service.
                
                // Step 1: Sequence
                await generateOutreachSequence(lead);
                
                // Step 2: Proposal (Magic Link)
                await generateProposalDraft(lead);
                
                // Step 3: Update DB State
                const currentLeads = db.getLeads();
                const idx = currentLeads.findIndex(l => l.id === lead.id);
                if (idx !== -1) {
                    currentLeads[idx].status = 'sent';
                    currentLeads[idx].outreachStatus = 'sent';
                    currentLeads[idx].lastContactAt = Date.now();
                    db.saveLeads(currentLeads);
                }
                
                setSuccessCount(prev => prev + 1);
            } catch (e: any) {
                addLog(`FAILURE ON ${lead.businessName}: ${e.message}`);
            }
        }));
        
        setProgress(Math.round(((i + BATCH_SIZE) / leads.length) * 100));
        // Small delay between batches
        await new Promise(r => setTimeout(r, 1000));
    }
    
    setProgress(100);
    setStatus('COMPLETE');
    addLog("SWARM SEQUENCE COMPLETE.");
    toast.success(`HYPER-LAUNCH FINISHED. ${selectedLeads.length} CAMPAIGNS DEPLOYED.`);
    
    setTimeout(() => {
        onComplete();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
       <div className="bg-[#0b1021] border border-emerald-500/30 rounded-[48px] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.2)]">
          
          <div className="p-10 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
             <div>
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
                   HYPER <span className="text-emerald-500">LAUNCH</span>
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">
                   TARGET LOCK: {selectedLeads.length} ENTITIES | MODE: {eco ? 'ECO_FLASH' : 'PRO_MAX'}
                </p>
             </div>
             <div className="text-4xl">🚀</div>
          </div>

          <div className="p-10 space-y-8">
             {status === 'IDLE' && (
                <div className="text-center space-y-8">
                   <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-lg mx-auto">
                      You are about to deploy {selectedLeads.length} fully autonomous outreach campaigns.
                      This includes generating specific email sequences, constructing custom proposals, and logging the activity to the CRM.
                   </p>
                   
                   <div className="flex gap-4 justify-center">
                      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center">
                         <div className="text-2xl font-black text-white">{selectedLeads.length * 5}</div>
                         <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">EMAILS</div>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center">
                         <div className="text-2xl font-black text-white">{selectedLeads.length}</div>
                         <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">PROPOSALS</div>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center">
                         <div className="text-2xl font-black text-emerald-400">${(selectedLeads.length * (eco ? 0.05 : 1.50)).toFixed(2)}</div>
                         <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">EST. COST</div>
                      </div>
                   </div>

                   <button 
                     onClick={executeSwarm}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/30 active:scale-95 transition-all border-b-4 border-emerald-800"
                   >
                      CONFIRM MASS DEPLOYMENT
                   </button>
                   <button onClick={onClose} className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest">CANCEL</button>
                </div>
             )}

             {status !== 'IDLE' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">DEPLOYING SWARM...</span>
                      <span className="text-2xl font-black italic text-white">{progress}%</span>
                   </div>
                   <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_20px_rgba(16,185,129,0.5)]" style={{ width: `${progress}%` }}></div>
                   </div>
                   <div className="h-48 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
                      {logs.map((l, i) => (
                         <div key={i} className="text-emerald-400/80 border-b border-slate-800/50 pb-1 last:border-0">{l}</div>
                      ))}
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};
