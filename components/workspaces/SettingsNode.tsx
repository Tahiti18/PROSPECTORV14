
import React, { useState, useEffect } from 'react';
import { isEconomyMode, checkFeatureAccess } from '../../services/computeTracker';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';

export const SettingsNode: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [autoRecon, setAutoRecon] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  // Manual Auth Override
  const [manualKey, setManualKey] = useState('');
  const [keySource, setKeySource] = useState('NOT_DETECTED');

  useEffect(() => {
    const savedKey = localStorage.getItem('pomelli_auth_override') || '';
    setManualKey(savedKey);

    // Diagnostics
    const envKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY;
    if (savedKey) setKeySource('MANUAL_OVERRIDE (localStorage)');
    else if (envKey && envKey !== "undefined") setKeySource('ENVIRONMENT_VARIABLE');
    else setKeySource('NOT_FOUND');
  }, []);

  const handleSave = () => {
    localStorage.setItem('pomelli_os_sensitivity', sensitivity.toString());
    localStorage.setItem('pomelli_os_auto_recon', autoRecon.toString());
    localStorage.setItem('pomelli_auth_override', manualKey.trim());
    
    setIsSaved(true);
    toast.success("SYSTEM STATE COMMITTED.");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleForceUnlock = () => {
    if (confirm("FORCE UNLOCK: Unlock all leads?")) db.forceUnlockAll();
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">INFRASTRUCTURE <span className="text-emerald-600 not-italic">LOCK</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">OpenRouter Secured Gateway</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-12">
         <div className="grid grid-cols-1 gap-12">
            
            {/* MANUAL AUTH OVERRIDE (SAFETY VALVE) */}
            <div className="bg-emerald-900/10 border border-emerald-500/30 p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <span className="text-xl">🛡️</span> AUTH OVERRIDE
                    </h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${keySource.includes('NOT') ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-black'}`}>
                        {keySource}
                    </span>
                </div>
                
                <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-widest">
                        IF YOU ARE EXPERIENCING 401 ERRORS, PASTE YOUR OPENROUTER API KEY BELOW. THIS BYPASSES ALL AUTOMATED ENVIRONMENT CHECKS.
                    </p>
                    <div className="relative">
                        <input 
                            type="password"
                            value={manualKey}
                            onChange={(e) => setManualKey(e.target.value)}
                            className="w-full bg-black border border-slate-700 rounded-xl px-6 py-4 text-emerald-400 font-mono text-xs focus:border-emerald-500 outline-none"
                            placeholder="sk-or-v1-..."
                        />
                        {manualKey && (
                            <button 
                                onClick={() => setManualKey('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-500 uppercase"
                            >
                                CLEAR
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-[#05091a] border border-slate-800 p-8 rounded-3xl space-y-6">
                <h4 className="text-[12px] font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-4">
                    ACTIVE ENGINE
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MODEL_ID</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-black text-white italic uppercase">GEMINI-2.0-FLASH-001 (OPENROUTER)</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">LATENCY_STATUS</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-black text-white italic">OPTIMAL (12ms)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6">
               <button 
                 onClick={handleSave}
                 className={`w-full text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all ${isSaved ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 active:scale-95'}`}
               >
                  {isSaved ? 'CONFIG APPLIED' : 'COMMIT SYSTEM STATE'}
               </button>
            </div>

            <div className="border-t border-slate-800 pt-8 flex justify-center">
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
