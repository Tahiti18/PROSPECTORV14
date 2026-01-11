import React, { useState, useEffect } from 'react';
import { isEconomyMode, checkFeatureAccess } from '../../services/computeTracker';
import { db } from '../../services/automation/db';

export const SettingsNode: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [autoRecon, setAutoRecon] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  const [agencyName, setAgencyName] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const savedSens = localStorage.getItem('pomelli_os_sensitivity');
    const savedRecon = localStorage.getItem('pomelli_os_auto_recon');
    const savedAgency = localStorage.getItem('pomelli_agency_name');
    
    if (savedSens) setSensitivity(parseInt(savedSens));
    if (savedRecon) setAutoRecon(savedRecon === 'true');
    if (savedAgency) setAgencyName(savedAgency);
    
    setHasAccess(checkFeatureAccess('WHITE_LABEL'));
  }, []);

  const handleSave = () => {
    localStorage.setItem('pomelli_os_sensitivity', sensitivity.toString());
    localStorage.setItem('pomelli_os_auto_recon', autoRecon.toString());
    if (hasAccess) localStorage.setItem('pomelli_agency_name', agencyName);
    setIsSaved(true);
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
            
            <div className="bg-indigo-900/10 border border-indigo-500/30 p-8 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                        SECURITY STATUS
                    </h4>
                    <span className="text-2xl">🛡️</span>
                </div>
                <div className="space-y-6">
                    <p className="text-[10px] text-slate-400 font-medium max-w-lg leading-relaxed uppercase tracking-widest">
                        THIS INSTANCE IS HARD-LOCKED TO OPENROUTER. NATIVE GOOGLE SDKS AND DIRECT BILLING PATHWAYS ARE DISCONNECTED.
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono">
                            GATEWAY: https://openrouter.ai/api/v1
                        </span>
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
                            <span className="text-[10px] font-black text-white italic">GOOGLE/GEMINI-3-FLASH-PREVIEW</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-700/50 p-8 rounded-3xl flex items-center justify-between">
                <div className="space-y-2">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                        NEURAL ECONOMY
                        <span className="text-[9px] bg-emerald-500 text-black px-2 py-0.5 rounded font-bold">ACTIVE</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium max-w-sm leading-relaxed">
                        Economy mode is enforced. Native Pro models cannot be invoked.
                    </p>
                </div>
                <div className={`w-16 h-9 rounded-full relative transition-all duration-300 bg-emerald-600`}>
                    <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg left-8`}></div>
                </div>
            </div>

            <div className="pt-10">
               <button 
                 onClick={handleSave}
                 className={`w-full text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all ${isSaved ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 active:scale-95'}`}
               >
                  {isSaved ? 'STATE COMMITTED' : 'SAVE NODE CONFIG'}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
