
import React, { useState, useEffect } from 'react';
import { PRODUCTION_LOGS } from '../../services/geminiService';

export const ProdLog: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setLogs([...PRODUCTION_LOGS]);
    const interval = setInterval(() => {
      setLogs([...PRODUCTION_LOGS]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">PROD <span className="text-indigo-600 not-italic">LOG</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Real-Time Operational Trace</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl flex flex-col space-y-8 relative overflow-hidden">
         <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Link Active</span>
            </div>
            <button className="text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors">CLEAR BUFFER</button>
         </div>

         <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 h-[500px] overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2 shadow-inner relative z-10">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-4 group">
                 <span className="text-slate-700 group-hover:text-indigo-500 transition-colors shrink-0">[{i.toString().padStart(4, '0')}]</span>
                 <span className="text-slate-400 group-hover:text-slate-200 transition-colors uppercase italic">{l}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 italic uppercase tracking-widest text-center py-20">
                 <p className="text-[10px] font-black">Awaiting initial operative deployment...</p>
              </div>
            )}
         </div>

         <div className="pt-6 border-t border-slate-800 flex justify-between items-center relative z-10">
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">0x88FF_BUFFER_SYNCED</span>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">{logs.length} EVENTS RECORDED</span>
         </div>
      </div>
    </div>
  );
};
