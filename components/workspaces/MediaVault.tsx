
import React from 'react';

export const MediaVault: React.FC = () => {
  const assets = [
    { id: 'ASSET_01', type: 'VEO_PAYLOAD', name: 'Cinematic_Intro_V1.mp4', size: '14.2MB', date: '2025.04.12' },
    { id: 'ASSET_02', type: 'MOCKUP_4K', name: 'Luxury_Interior_A.png', size: '2.4MB', date: '2025.04.11' },
    { id: 'ASSET_03', type: 'SONIC_PAYLOAD', name: 'Outreach_Voice_B.wav', size: '1.1MB', date: '2025.04.11' }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">MEDIA <span className="text-indigo-600 not-italic">VAULT</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Encrypted Asset Reservoir</p>
        </div>
        <button className="bg-slate-900 border border-slate-800 text-slate-500 hover:text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
          BATCH EXPORT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {assets.map(a => (
           <div key={a.id} className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 space-y-6 hover:border-indigo-500/40 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-[40px] rounded-full"></div>
              <div className="flex justify-between items-start relative z-10">
                 <div className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${
                   a.type === 'VEO_PAYLOAD' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                   a.type === 'MOCKUP_4K' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                 }`}>
                   {a.type}
                 </div>
                 <span className="text-[9px] font-black text-slate-700">{a.id}</span>
              </div>
              <div className="space-y-1 relative z-10">
                 <h4 className="text-sm font-black text-slate-200 uppercase tracking-tight truncate">{a.name}</h4>
                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{a.size} — COMMITTED: {a.date}</p>
              </div>
              <div className="pt-4 border-t border-slate-800/50 flex gap-3 relative z-10">
                 <button className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 py-3 rounded-xl text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">PREVIEW</button>
                 <button className="flex-1 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white py-3 rounded-xl text-[8px] font-black text-indigo-400 uppercase tracking-widest transition-all">SYNC</button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
