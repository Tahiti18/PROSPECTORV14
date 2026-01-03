
import React, { useState } from 'react';

export const ThemeNode: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState('DEEP_STEALTH');

  const themes = [
    { id: 'DEEP_STEALTH', name: 'DEEP STEALTH', colors: ['bg-[#020617]', 'bg-indigo-600'] },
    { id: 'NEON_WAR', name: 'NEON WAR', colors: ['bg-slate-900', 'bg-rose-600'] },
    { id: 'PLATINUM', name: 'PLATINUM CORE', colors: ['bg-slate-100', 'bg-slate-800'] },
    { id: 'VANTABLACK', name: 'VANTA BLACK', colors: ['bg-black', 'bg-emerald-600'] }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">UI <span className="text-indigo-600 not-italic">THEME</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">OS Aesthetic Configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {themes.map(t => (
           <div 
            key={t.id}
            onClick={() => setActiveTheme(t.id)}
            className={`bg-[#0b1021] border p-10 rounded-[48px] shadow-2xl cursor-pointer transition-all relative overflow-hidden group ${
              activeTheme === t.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-800 hover:border-slate-600'
            }`}
           >
              <div className="flex justify-between items-center relative z-10 mb-8">
                 <h3 className="text-lg font-black italic text-white uppercase tracking-tighter leading-none">{t.name}</h3>
                 {activeTheme === t.id && <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse"></div>}
              </div>
              
              <div className="flex gap-3 relative z-10">
                 {t.colors.map((c, idx) => (
                   <div key={idx} className={`w-12 h-12 rounded-2xl ${c} border border-white/10 shadow-lg`}></div>
                 ))}
              </div>

              <div className="absolute bottom-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">APPLY THEME →</span>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-[40px] p-10 flex items-center justify-between">
         <div className="space-y-1">
            <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-widest">Operational Notice</h4>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Theme changes affect neural rendering latency (simulated).</p>
         </div>
         <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">COMMIT SELECTION</button>
      </div>
    </div>
  );
};
