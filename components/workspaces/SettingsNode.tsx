import React, { useState, useEffect } from 'react';
import { setEconomyMode, isEconomyMode, getUserTier, checkFeatureAccess } from '../../services/computeTracker';
import { db } from '../../services/automation/db';

export const SettingsNode: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [autoRecon, setAutoRecon] = useState(true);
  const [ecoMode, setEcoMode] = useState(isEconomyMode());
  const [isSaved, setIsSaved] = useState(false);
  
  // White Label State
  const [agencyName, setAgencyName] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  // Manual API Key Override
  const [manualApiKey, setManualApiKey] = useState('');

  useEffect(() => {
    const savedSens = localStorage.getItem('pomelli_os_sensitivity');
    const savedRecon = localStorage.getItem('pomelli_os_auto_recon');
    const savedAgency = localStorage.getItem('pomelli_agency_name');
    const savedKey = localStorage.getItem('pomelli_api_key');
    
    if (savedSens) setSensitivity(parseInt(savedSens));
    if (savedRecon) setAutoRecon(savedRecon === 'true');
    if (savedAgency) setAgencyName(savedAgency);
    if (savedKey) setManualApiKey(savedKey);
    
    setHasAccess(checkFeatureAccess('WHITE_LABEL'));
  }, []);

  const handleEcoToggle = (val: boolean) => {
    setEcoMode(val);
    setEconomyMode(val);
  };

  const handleSave = () => {
    localStorage.setItem('pomelli_os_sensitivity', sensitivity.toString());
    localStorage.setItem('pomelli_os_auto_recon', autoRecon.toString());
    
    if (manualApiKey) {
        localStorage.setItem('pomelli_api_key', manualApiKey.trim());
    } else {
        localStorage.removeItem('pomelli_api_key');
    }

    if (hasAccess) {
        localStorage.setItem('pomelli_agency_name', agencyName);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleForceUnlock = () => {
    if (confirm("FORCE UNLOCK: This will stop all active automation protocols and unlock all leads. Use only if system is stuck.")) {
        db.forceUnlockAll();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">CORE <span className="text-emerald-600 not-italic">SETTINGS</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Operational Logic Configuration</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-12">
         <div className="grid grid-cols-1 gap-12">
            
            {/* COST AUDIT PANEL */}
            <div className="bg-[#05091a] border border-slate-800 p-8 rounded-3xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 blur-[40px] rounded-full"></div>
                <h4 className="text-[12px] font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-4">
                    BILLING & MODEL AUDIT (ACTIVE)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">TEXT ENGINE</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-black text-white">GEMINI 3 FLASH</span>
                        </div>
                        <p className="text-[8px] text-slate-600 font-mono">$0.10 / 1M TOKENS</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">IMAGE ENGINE</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-black text-white">IMAGEN 3 FLASH</span>
                        </div>
                        <p className="text-[8px] text-slate-600 font-mono">$0.004 / IMAGE</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">VIDEO ENGINE</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-black text-white">VEO 3.1 FAST</span>
                        </div>
                        <p className="text-[8px] text-slate-600 font-mono">ECONOMY TIER ACTIVE</p>
                    </div>
                </div>
            </div>

            {/* MANUAL API KEY OVERRIDE */}
            <div className="bg-indigo-900/10 border border-indigo-500/30 p-8 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                        API KEY OVERRIDE
                    </h4>
                    <span className="text-2xl">🔑</span>
                </div>
                <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-medium max-w-lg leading-relaxed">
                        Use this to test a different Google Gemini API Key directly in the browser. 
                        Useful if the environment variable in Railway is missing or incorrect. 
                        <strong>Leave empty to use the system default (Environment Variable).</strong>
                    </p>
                    <input 
                        value={manualApiKey}
                        onChange={(e) => setManualApiKey(e.target.value)}
                        placeholder="Paste AIza... key here"
                        type="password"
                        className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                    />
                </div>
            </div>

            {/* NEURAL ECONOMY SWITCH */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-700/50 p-8 rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                <div className="space-y-2">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                        NEURAL ECONOMY MODE
                        {ecoMode && <span className="text-[9px] bg-emerald-500 text-black px-2 py-0.5 rounded font-bold">ACTIVE</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium max-w-sm leading-relaxed">
                        Forces use of <strong>Gemini 3 Flash</strong> for all bulk operations. Reduces inference costs by ~98% while maintaining high velocity.
                    </p>
                </div>
                <button 
                    onClick={() => handleEcoToggle(!ecoMode)}
                    className={`w-16 h-9 rounded-full relative transition-all duration-300 ${ecoMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                    <div className={`absolute top-1 w-7 h-7 rounded-full bg-white transition-all duration-300 shadow-lg ${ecoMode ? 'left-8' : 'left-1'}`}></div>
                </button>
            </div>

            {/* EMERGENCY CONTROLS */}
            <div className="bg-rose-900/10 border border-rose-500/30 p-8 rounded-3xl flex items-center justify-between group hover:bg-rose-900/20 transition-all">
                <div className="space-y-2">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                        PROTOCOL OVERRIDE
                    </h4>
                    <p className="text-[10px] text-rose-300/80 font-medium max-w-sm leading-relaxed">
                        Emergency release for all locked leads. Use if "LOCKED BY PROTOCOL" persists due to browser crash or interrupted swarm.
                    </p>
                </div>
                <button 
                    onClick={handleForceUnlock}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
                >
                    UNLOCK ALL TARGETS
                </button>
            </div>

            {/* WHITE LABEL BRANDING */}
            <div className={`p-8 rounded-3xl border transition-all ${hasAccess ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800 opacity-60 grayscale'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                        AGENCY WHITE LABEL
                        {!hasAccess && <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold border border-slate-700">LOCKED (EMPIRE ONLY)</span>}
                    </h4>
                    {hasAccess && <span className="text-2xl">🏢</span>}
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agency Name (Replaces Pomelli branding on exports)</label>
                    <input 
                        disabled={!hasAccess}
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder="ENTER YOUR AGENCY NAME"
                        className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-100 uppercase tracking-widest">Neural Scan Sensitivity</label>
                  <span className="text-sm font-black italic text-emerald-400 tracking-tighter">{sensitivity}%</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="100" 
                 value={sensitivity} 
                 onChange={(e) => setSensitivity(parseInt(e.target.value))}
                 className="w-full accent-emerald-600" 
               />
               <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Controls the depth of competitive data grounding.</p>
            </div>

            <div className="pt-10">
               <button 
                 onClick={handleSave}
                 className={`w-full text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all ${isSaved ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 active:scale-95'}`}
               >
                  {isSaved ? 'CONFIGURATION LOCKED' : 'SAVE SYSTEM STATE'}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
