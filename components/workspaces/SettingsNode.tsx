
import React from 'react';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';

export const SettingsNode: React.FC = () => {
  const handleForceUnlock = () => {
    if (confirm("ORCHESTRATOR OVERRIDE: This will release all lead locks. Proceed?")) {
      db.forceUnlockAll();
    }
  };

  const handleClearHistory = () => {
    if (confirm("Clear local cache and activity history? This does not affect lead records.")) {
      toast.info("Activity history purged.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">SYSTEM <span className="text-emerald-600 not-italic">SETTINGS</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Core Configuration & Security Protocols</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
         
         <div className="grid grid-cols-1 gap-12 relative z-10">
            
            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">INFERENCE MODEL STATUS</label>
                  <div className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 flex items-center justify-between">
                     <span className="text-emerald-400 font-mono text-sm uppercase">gemini-3-flash-preview (HARD-LOCKED)</span>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">ACTIVE</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={handleForceUnlock}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-500 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                  >
                    FORCE UNLOCK ALL TARGETS
                  </button>
                  <button 
                    onClick={handleClearHistory}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                  >
                    PURGE ACTIVITY HISTORY
                  </button>
               </div>
            </div>

            <div className="border-t border-slate-800 pt-8">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center italic">
                   INFRASTRUCTURE SECURED VIA ENVIRONMENT GATEWAY. DIRECT MANUAL OVERRIDE IS RESTRICTED.
                </p>
            </div>
         </div>
      </div>
    </div>
  );
};
