import React, { useState, useEffect } from 'react';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';

export const SettingsNode: React.FC = () => {
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('pomelli_auth_override') || '');
  const [kieKey, setKieKey] = useState(() => localStorage.getItem('kie_api_key_override') || '');
  const [isSaved, setIsSaved] = useState(false);
  
  const envKeyPresent = !!process.env.OPENROUTER_API_KEY || !!process.env.API_KEY;

  const handleSave = () => {
    // Commit to persistent local storage
    if (openRouterKey) localStorage.setItem('pomelli_auth_override', openRouterKey.trim());
    if (kieKey) localStorage.setItem('kie_api_key_override', kieKey.trim());
    
    setIsSaved(true);
    toast.success("SECURITY PROTOCOLS COMMITTED TO CORE.");
    
    // Pulse animation logic
    setTimeout(() => setIsSaved(false), 2000);
    
    // Force application refresh to re-initialize services with new keys
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleForceUnlock = () => {
    if (confirm("ORCHESTRATOR OVERRIDE: This will release all lead locks. Proceed?")) {
      db.forceUnlockAll();
    }
  };

  const handlePurgeLocal = () => {
      if (confirm("WIPE SECURITY CACHE: This will remove saved keys and reload. Proceed?")) {
          localStorage.removeItem('pomelli_auth_override');
          localStorage.removeItem('kie_api_key_override');
          window.location.reload();
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
            
            {/* AUTH STATUS BADGE */}
            <div className="bg-emerald-900/10 border border-emerald-500/30 p-8 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <span className="text-xl">🛡️</span> SYSTEM AUTHENTICATION
                    </h4>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${envKeyPresent || openRouterKey ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                        {openRouterKey ? 'MANUAL_OVERRIDE_ACTIVE' : (envKeyPresent ? 'ENVIRONMENT_LINK_ACTIVE' : 'KEYS_REQUIRED')}
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-widest">
                    SYSTEM IS PROGRAMMED TO PRIORITIZE MANUAL KEY OVERRIDES TO BYPASS GOOGLE SDK SECRECY BLOCKS.
                </p>
            </div>

            {/* KEY INPUTS */}
            <div className="space-y-10">
                <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">OPENROUTER KEY (LOGIC HUB)</label>
                        <span className="text-[8px] text-slate-600 font-bold uppercase">SECURED BY LOCAL_STORAGE</span>
                    </div>
                    <input 
                        type="password"
                        value={openRouterKey}
                        onChange={(e) => setOpenRouterKey(e.target.value)}
                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
                        placeholder="sk-or-v1-..."
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">KIE API KEY (MEDIA HUB)</label>
                        <span className="text-[8px] text-slate-600 font-bold uppercase">REQUIRED FOR VEO 3.1 & SUNO</span>
                    </div>
                    <input 
                        type="password"
                        value={kieKey}
                        onChange={(e) => setKieKey(e.target.value)}
                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
                        placeholder="KIE Key..."
                    />
                </div>
            </div>

            <div className="pt-6">
               <button 
                 onClick={handleSave}
                 className={`w-full text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all border-b-4 ${isSaved ? 'bg-emerald-500 border-emerald-700' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 active:scale-95 border-emerald-800'}`}
               >
                  {isSaved ? 'CONFIG APPLIED ✓' : 'COMMIT GATEWAY STATE'}
               </button>
            </div>

            <div className="border-t border-slate-800 pt-8 flex justify-between items-center px-2">
                <button 
                    onClick={handlePurgeLocal}
                    className="text-[9px] font-black text-slate-600 hover:text-rose-500 uppercase tracking-widest transition-colors"
                >
                    PURGE LOCAL CACHE
                </button>
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