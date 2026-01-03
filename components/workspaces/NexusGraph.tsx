
import React from 'react';

export const NexusGraph: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">NEXUS <span className="text-indigo-600 not-italic">GRAPH</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Theater Entity Relationship Matrix</p>
        </div>
        <div className="px-5 py-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Linkage: 0.04s</span>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-12 shadow-2xl relative min-h-[600px] overflow-hidden">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
         
         {/* Simulated dynamic node visualization */}
         <svg className="w-full h-[500px] relative z-10" viewBox="0 0 1000 500">
            {[1,2,3,4,5,6,7].map(i => {
              const x = (i * 142.8) % 900 + 50;
              const y = (i * 71.4) % 400 + 50;
              return (
                <g key={i} className="group cursor-pointer">
                   {i > 1 && (
                     <line 
                        x1={( (i-1) * 142.8) % 900 + 50} 
                        y1={( (i-1) * 71.4) % 400 + 50} 
                        x2={x} y2={y} 
                        className="stroke-indigo-500/20 group-hover:stroke-indigo-500/60 transition-all" 
                        strokeWidth="1" 
                     />
                   )}
                   <circle cx={x} cy={y} r="8" className="fill-slate-900 stroke-indigo-500 stroke-2 group-hover:fill-indigo-600 transition-all" />
                   <text x={x+15} y={y+5} className="text-[10px] font-black fill-slate-500 group-hover:fill-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">NODE_0{i}</text>
                </g>
              );
            })}
         </svg>

         <div className="absolute bottom-12 right-12 bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl relative z-20">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Graph Legend</h4>
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">HIGH_TICKET_ENTITY</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ACQUIRED_TARGET</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
