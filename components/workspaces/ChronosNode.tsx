
import React from 'react';

export const ChronosNode: React.FC = () => {
  const events = [
    { id: 'EV-091', op: 'RADAR_SWEEP', result: '30 TARGETS SECURED', date: '2025.04.12 14:22', status: 'COMPLETE' },
    { id: 'EV-090', op: 'VEO_FORGE', result: '4K ASSET RENDERED', date: '2025.04.12 11:05', status: 'COMPLETE' },
    { id: 'EV-088', op: 'INTEL_GROUND', result: 'FACT_CHECK DISPUTED', date: '2025.04.11 18:42', status: 'WARNING' },
    { id: 'EV-087', op: 'SONIC_SYNTH', result: 'VOICE_PAYLOAD_V1', date: '2025.04.11 09:15', status: 'COMPLETE' }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">CHRONOS <span className="text-indigo-600 not-italic">LOGS</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Historical Operational Timeline</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1 h-full bg-slate-800/40 ml-20"></div>
         
         <div className="space-y-12 relative z-10">
            {events.map((e, i) => (
              <div key={e.id} className="flex gap-12 group">
                 <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center relative z-20 group-hover:border-indigo-500 transition-all">
                    <div className={`w-2.5 h-2.5 rounded-full ${e.status === 'COMPLETE' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                 </div>
                 <div className="flex-1 bg-slate-900/30 border border-slate-800/60 p-8 rounded-[32px] group-hover:border-indigo-500/20 transition-all">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-slate-600 font-mono tracking-widest">{e.date} — {e.id}</span>
                       <span className={`text-[9px] font-black px-3 py-1 rounded-lg border ${e.status === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{e.status}</span>
                    </div>
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{e.op}</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2">RESULT: {e.result}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
