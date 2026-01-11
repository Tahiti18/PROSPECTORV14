import React, { useState } from 'react';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';
import { getStoredKeys, setStoredKeys } from '../../services/geminiService';

export const SettingsNode: React.FC = () => {
  const [keys, setKeys] = useState(getStoredKeys());

  const handleSaveKeys = () => {
    setStoredKeys(keys.openRouter, keys.kie);
    toast.success("INFRASTRUCTURE SECURED: Keys persisted to browser.");
  };

  const handleForceUnlock = () => {
    if (confirm("ORCHESTRATOR OVERRIDE: This will release all lead locks. Proceed?")) {
      db.forceUnlockAll();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">INFRASTRUCTURE <span className="text-emerald-600 not-italic">CONTROL</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Authentication & Gateway Protocols</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
         
         <div className="grid grid-cols-1 gap-12 relative z-10">
            
            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">OPENROUTER AUTHORIZATION</label>
                  <input 
                    type="password"
                    value={keys.openRouter}
                    onChange={(e) => setKeys({...keys, openRouter: e.target.value})}
                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
                    placeholder="sk-or-v1-..."
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">KIE MEDIA CORE KEY</label>
                  <input 
                    type="password"
                    value={keys.kie}
                    onChange={(e) => setKeys({...keys, kie: e.target.value})}
                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
                    placeholder="KIE-..."
                  />
               </div>

               <button 
                 onClick={handleSaveKeys}
                 className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all border-b-4 border-emerald-800 active:scale-95"
               >
                  SAVE INFRASTRUCTURE KEYS
               </button>
            </div>

            <div className="border-t border-slate-800 pt-8 flex justify-end items-center px-2">
                <button 
                    onClick={handleForceUnlock}
                    className="text-[9px] font-black text-rose-500 hover:text-white uppercase tracking-widest transition-colors opacity-40 hover:opacity-100"
                >
                    FORCE UNLOCK ALL TARGETS
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};