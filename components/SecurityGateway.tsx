import React, { useState } from 'react';
import { setStoredKeys } from '../services/geminiService';
import { toast } from '../services/toastManager';

export const SecurityGateway: React.FC<{ onArmed: () => void }> = ({ onArmed }) => {
  const [orKey, setOrKey] = useState('');
  const [kieKey, setKieKey] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleCommit = () => {
    if (!orKey) {
        toast.error("OpenRouter Authorization Key Required.");
        return;
    }
    setIsAuthorizing(true);
    setTimeout(() => {
        setStoredKeys(orKey, kieKey);
        toast.success("INFRASTRUCTURE PERSISTENCE ARMED.");
        onArmed();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
      
      <div className="max-w-xl w-full bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative overflow-hidden animate-in zoom-in-95 duration-500">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
         
         <div className="text-center mb-12 relative z-10">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-600/20 mx-auto mb-8 animate-pulse">
                <span className="text-white font-black text-4xl">P</span>
            </div>
            <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">GATEWAY <span className="text-emerald-500 not-italic">AUTHORIZATION</span></h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">Persist API Keys to Local Storage</p>
         </div>

         <div className="space-y-10 relative z-10">
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">OPENROUTER KEY (STRATEGY & LOGIC)</label>
                <input 
                    type="password"
                    value={orKey}
                    onChange={(e) => setOrKey(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
                    placeholder="sk-or-v1-..."
                />
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">KIE API KEY (MEDIA & VEO 3.1)</label>
                <input 
                    type="password"
                    value={kieKey}
                    onChange={(e) => setKieKey(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
                    placeholder="KIE-..."
                />
            </div>

            <button 
                onClick={handleCommit}
                disabled={isAuthorizing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all border-b-4 border-emerald-800 active:scale-95 disabled:opacity-50"
            >
                {isAuthorizing ? 'AUTHORIZING NEURAL CORE...' : 'COMMIT INFRASTRUCTURE'}
            </button>
         </div>

         <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-12 italic">
            KEYS ARE STORED LOCALLY IN YOUR BROWSER. THEY ARE NEVER SENT TO GOOGLE SERVERS.
         </p>
      </div>
    </div>
  );
};