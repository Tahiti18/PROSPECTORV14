
import React, { useMemo } from 'react';
import { Lead } from '../../types';

interface NexusGraphProps {
  leads: Lead[];
}

export const NexusGraph: React.FC<NexusGraphProps> = ({ leads }) => {
  
  const nodes = useMemo(() => {
    // Simple clustering logic
    const clusters: Record<string, Lead[]> = {};
    leads.forEach(l => {
      const key = l.niche || 'General';
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(l);
    });

    const visualNodes: any[] = [];
    const keys = Object.keys(clusters);
    const centerX = 500;
    const centerY = 250;
    const radius = 200;

    keys.forEach((k, i) => {
      const angle = (i / keys.length) * 2 * Math.PI;
      const cx = centerX + radius * Math.cos(angle);
      const cy = centerY + radius * Math.sin(angle);
      
      // Cluster Center
      visualNodes.push({ type: 'hub', x: cx, y: cy, label: k, count: clusters[k].length });

      // Leaf Nodes
      clusters[k].forEach((l, j) => {
        const offsetR = 60;
        const leafAngle = (j / clusters[k].length) * 2 * Math.PI;
        visualNodes.push({
          type: 'lead',
          x: cx + offsetR * Math.cos(leafAngle),
          y: cy + offsetR * Math.sin(leafAngle),
          label: l.businessName,
          score: l.leadScore,
          parentX: cx,
          parentY: cy
        });
      });
    });

    return visualNodes;
  }, [leads]);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">NEXUS <span className="text-indigo-600 not-italic">GRAPH</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Theater Entity Relationship Matrix ({leads.length} Nodes)</p>
        </div>
        <div className="px-5 py-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Linkage: 0.04s</span>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-4 shadow-2xl relative min-h-[600px] overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
         
         {leads.length === 0 ? (
            <div className="text-center opacity-30">
               <span className="text-6xl mb-4 block">🕸️</span>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NO DATA POINTS TO CLUSTER</p>
            </div>
         ) : (
           <svg className="w-full h-[600px] relative z-10" viewBox="0 0 1000 500">
              {/* Connections */}
              {nodes.filter(n => n.type === 'lead').map((n, i) => (
                <line 
                  key={`line-${i}`}
                  x1={n.parentX} y1={n.parentY}
                  x2={n.x} y2={n.y}
                  className="stroke-indigo-500/20" 
                  strokeWidth="1" 
                />
              ))}

              {/* Nodes */}
              {nodes.map((n, i) => (
                <g key={i} className="group cursor-pointer hover:z-50">
                   {n.type === 'hub' ? (
                     <>
                       <circle cx={n.x} cy={n.y} r={20 + (n.count * 2)} className="fill-indigo-900/50 stroke-indigo-500 stroke-2" />
                       <text x={n.x} y={n.y} dy="4" textAnchor="middle" className="text-[8px] font-black fill-white uppercase tracking-tighter pointer-events-none">{n.label}</text>
                     </>
                   ) : (
                     <>
                       <circle cx={n.x} cy={n.y} r={n.score > 80 ? 6 : 4} className={`${n.score > 80 ? 'fill-emerald-500' : 'fill-slate-700'} stroke-none group-hover:scale-150 transition-all`} />
                       <text x={n.x + 10} y={n.y + 4} className="text-[8px] font-black fill-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase bg-black">{n.label}</text>
                     </>
                   )}
                </g>
              ))}
           </svg>
         )}

         <div className="absolute bottom-12 right-12 bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl relative z-20">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Graph Legend</h4>
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 border border-indigo-400"></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">NICHE CLUSTER</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">HIGH VALUE (80+)</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
