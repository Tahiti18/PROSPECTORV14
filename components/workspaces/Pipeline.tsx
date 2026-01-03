
import React from 'react';
import { Lead } from '../../types';

interface PipelineProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: Lead['status']) => void;
}

const STAGES: { id: Lead['status']; label: string; count: number }[] = [
  { id: 'cold', label: 'THEATER RECON', count: 18 },
  { id: 'analyzed', label: 'INTEL AUDIT', count: 8 },
  { id: 'outreached', label: 'PAYLOAD FORGE', count: 0 },
  { id: 'converted', label: 'SIGNAL DIST.', count: 0 },
];

export const Pipeline: React.FC<PipelineProps> = ({ leads, onUpdateStatus }) => {
  return (
    <div className="space-y-12 py-6 animate-in fade-in duration-700 max-w-[1550px] mx-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">MISSION <span className="text-indigo-600 not-italic">PIPELINE</span></h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center gap-3">
            ECONOMIC LENS: PHASE URGENCY VISUALIZATION (DRAG TO PRIORITIZE)
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </p>
        </div>
        <div className="flex gap-10">
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">CRITICAL STALL</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">NEW ENTRY</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {STAGES.map((stage, sIdx) => {
          const stageLeads = leads.filter(l => l.status === stage.id);
          return (
            <div key={stage.id} className="space-y-8">
              <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">{stage.label}</h3>
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-600 font-black">i</span>
                 </div>
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <span className="text-white font-black italic text-sm">{stageLeads.length || stage.count}</span>
                 </div>
              </div>

              <div className="space-y-6 min-h-[700px]">
                {stageLeads.map((lead, i) => (
                  <div 
                    key={lead.id} 
                    className={`bg-slate-900 border border-slate-800 rounded-[36px] p-8 space-y-8 relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer shadow-2xl group ${
                      i === 0 ? 'ring-2 ring-rose-500/20 border-rose-500/30' : 'hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">TGT_{lead.rank || i+1}</p>
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">2D IN PHASE</p>
                       </div>
                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border tracking-widest uppercase ${
                         lead.assetGrade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                       }`}>
                         GRADE {lead.assetGrade}
                       </span>
                    </div>

                    <div className="space-y-1">
                       <h4 className="text-lg font-black text-white italic tracking-tighter uppercase leading-tight group-hover:text-indigo-400 transition-colors">{lead.businessName}</h4>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic truncate">{lead.city} • {lead.niche}</p>
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-rose-500' : 'bg-slate-600 animate-pulse'}`}></div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{i === 0 ? 'IDLE' : 'PENDING'}</span>
                       </div>
                       <span className="text-sm font-black italic text-indigo-400 tracking-tighter">€12.5K</span>
                    </div>
                  </div>
                ))}
                
                {stageLeads.length === 0 && (
                   <div className="h-full border-2 border-dashed border-slate-800/40 rounded-[48px] flex flex-col items-center justify-center text-center opacity-20">
                      <h4 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter">SECTOR CLEAR</h4>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button simulation from screenshot */}
      <button className="fixed bottom-32 left-10 w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-90 transition-all z-50">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5"/></svg>
      </button>
    </div>
  );
};
