
import React, { useState, useEffect } from 'react';

export const SettingsNode: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [autoRecon, setAutoRecon] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedSens = localStorage.getItem('pomelli_os_sensitivity');
    const savedRecon = localStorage.getItem('pomelli_os_auto_recon');
    if (savedSens) setSensitivity(parseInt(savedSens));
    if (savedRecon) setAutoRecon(savedRecon === 'true');
  }, []);

  const handleSave = () => {
    localStorage.setItem('pomelli_os_sensitivity', sensitivity.toString());
    localStorage.setItem('pomelli_os_auto_recon', autoRecon.toString());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">CORE <span className="text-indigo-600 not-italic">SETTINGS</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Operational Logic Configuration</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-12">
         <div className="grid grid-cols-1 gap-12">
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-100 uppercase tracking-widest">Neural Scan Sensitivity</label>
                  <span className="text-sm font-black italic text-indigo-400 tracking-tighter">{sensitivity}%</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="100" 
                 value={sensitivity} 
                 onChange={(e) => setSensitivity(parseInt(e.target.value))}
                 className="w-full accent-indigo-600" 
               />
               <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Controls the depth of competitive data grounding.</p>
            </div>

            <div className="pt-8 border-t border-slate-800/50 flex items-center justify-between">
               <div>
                  <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-widest">Autonomous Recon Mode</h4>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Enable background theater scanning.</p>
               </div>
               <button 
                 onClick={() => setAutoRecon(!autoRecon)}
                 className={`w-14 h-8 rounded-full relative transition-all ${autoRecon ? 'bg-indigo-600' : 'bg-slate-800'}`}
               >
                 <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${autoRecon ? 'left-7 shadow-lg shadow-white/20' : 'left-1'}`}></div>
               </button>
            </div>

            <div className="pt-8 border-t border-slate-800/50 space-y-6">
               <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-widest">API Endpoint Matrix</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { l: 'GEMINI_V3_CORE', s: 'STABLE' },
                    { l: 'VEO_ENGINE_V1', s: 'STANDBY' },
                    { l: 'SEARCH_VECT_09', s: 'STABLE' },
                    { l: 'PCM_AUDIO_LINK', s: 'OFFLINE' }
                  ].map((api, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800/60 p-5 rounded-2xl flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-500 font-mono tracking-tighter">{api.l}</span>
                       <span className={`text-[8px] font-black uppercase tracking-widest ${api.s === 'STABLE' ? 'text-emerald-400' : api.s === 'STANDBY' ? 'text-indigo-400' : 'text-rose-500'}`}>{api.s}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="pt-10">
               <button 
                 onClick={handleSave}
                 className={`w-full text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all ${isSaved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 active:scale-95'}`}
               >
                  {isSaved ? 'CONFIGURATION LOCKED' : 'SAVE SYSTEM STATE'}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
