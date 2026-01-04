
import React, { useState, useEffect } from 'react';
import { PRODUCTION_LOGS } from '../../services/geminiService';

export const ChronosNode: React.FC = () => {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    // Hydrate initial logs
    setEvents([...PRODUCTION_LOGS]);
    
    // Poll for updates
    const interval = setInterval(() => {
      setEvents([...PRODUCTION_LOGS]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">CHRONOS <span className="text-indigo-600 not-italic">LOGS</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Historical Operational Timeline</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative overflow-hidden min-h-[600px]">
         <div className="absolute top-0 left-0 w-1 h-full bg-slate-800/40 ml-20"></div>
         
         <div className="space-y-8 relative z-10 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
            {events.length === 0 && (
               <div className="text-center py-20 opacity-30">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NO TEMPORAL DATA RECORDED</p>
               </div>
            )}
            
            {events.map((e, i) => {
              // Parse basic structure "[TIME] MSG"
              const parts = e.split('] ');
              const time = parts[0]?.replace('[', '') || '00:00:00';
              const msg = parts[1] || e;
              const isError = msg.includes('ERROR') || msg.includes('FAILURE');
              
              return (
                <div key={i} className="flex gap-12 group animate-in slide-in-from-left-4 duration-500">
                   <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center relative z-20 group-hover:border-indigo-500 transition-all shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${isError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                   </div>
                   <div className="flex-1 bg-slate-900/30 border border-slate-800/60 p-6 rounded-[24px] group-hover:border-indigo-500/20 transition-all">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-black text-slate-600 font-mono tracking-widest">{time}</span>
                         <span className={`text-[9px] font-black px-3 py-1 rounded-lg border ${isError ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                           {isError ? 'ALERT' : 'LOGGED'}
                         </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wide font-mono leading-relaxed">{msg}</p>
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
};
