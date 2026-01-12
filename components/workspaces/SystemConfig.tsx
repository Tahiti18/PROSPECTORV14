
import React, { useState } from 'react';

export const SystemConfig: React.FC = () => {
  const [protocol, setProtocol] = useState('ENTERPRISE_NODE_V4');

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
          CORE <span className="text-emerald-500">CONFIG</span>
        </h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">
          High-Level Technical Parameters
        </p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative overflow-hidden">
         <div className="grid grid-cols-1 gap-10 relative z-10">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Operational Protocol</label>
               <input 
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-all uppercase italic tracking-tighter"
               />
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] text-white transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800">
              SAVE SYSTEM PARAMETERS
            </button>
         </div>
      </div>
    </div>
  );
};
