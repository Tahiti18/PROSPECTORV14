
import React from 'react';
import { Lead } from '../../types';

interface HeatmapProps {
  leads: Lead[];
  market: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({ leads, market }) => {
  return (
    <div className="space-y-10 py-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">HOT <span className="text-emerald-600 not-italic">ZONE</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Opportunity Density: {market}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-[#0b1021] border-2 border-slate-800 rounded-[56px] p-12 shadow-2xl relative aspect-square lg:aspect-video overflow-hidden">
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
           
           <svg className="w-full h-full relative z-10" viewBox="0 0 1000 500">
             {leads.map((l, i) => {
               const x = (i * 137.5) % 900 + 50;
               const y = (i * 97.2) % 400 + 50;
               const r = (l.leadScore / 100) * 40 + 10;
               const opacity = l.leadScore / 100;
               
               return (
                 <g key={l.id} className="group cursor-pointer">
                   <circle 
                    cx={x} cy={y} r={r} 
                    className="fill-emerald-600 animate-pulse" 
                    style={{ fillOpacity: opacity * 0.3, animationDuration: `${3 - (l.leadScore/50)}s` }} 
                   />
                   <circle 
                    cx={x} cy={y} r={4} 
                    className="fill-emerald-400" 
                   />
                   <text x={x+10} y={y+5} className="text-[10px] font-black fill-slate-500 group-hover:fill-white uppercase opacity-0 group-hover:opacity-100 transition-all">
                     {l.businessName}
                   </text>
                 </g>
               );
             })}
           </svg>
           
           <div className="absolute bottom-10 left-10 flex gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-600/20 border border-emerald-500/40"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Low Opportunity</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Critical Strike Zone</span>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-[32px] p-8">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Theater Coordinates</h3>
             <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {leads.sort((a,b) => b.leadScore - a.leadScore).map(l => (
                  <div key={l.id} className="flex justify-between items-center py-3 border-b-2 border-slate-800/50 last:border-0">
                    <div>
                      <p className="text-[10px] font-black text-slate-200 uppercase truncate max-w-[150px]">{l.businessName}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">{l.niche}</p>
                    </div>
                    <span className={`text-[11px] font-black italic ${l.leadScore > 80 ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {l.leadScore}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
