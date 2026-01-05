
import React from 'react';
import { Lead, OutreachStatus } from '../../types';

interface PipelineProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: OutreachStatus) => void;
}

const STAGES: { id: string; label: string; statuses: OutreachStatus[] }[] = [
  { id: 'recon', label: 'MARKET RECON', statuses: ['cold'] },
  { id: 'staging', label: 'INTEL STAGING', statuses: ['queued'] },
  { id: 'active', label: 'ACTIVE CAMPAIGN', statuses: ['sent', 'opened'] },
  { id: 'dialogue', label: 'NEGOTIATION', statuses: ['replied', 'booked'] },
  { id: 'closed', label: 'CLOSED / TERMINATED', statuses: ['won', 'lost', 'paused'] }
];

export const Pipeline: React.FC<PipelineProps> = ({ leads, onUpdateStatus }) => {
  return (
    <div className="space-y-12 py-6 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold uppercase tracking-tight text-white leading-none">SALES <span className="text-emerald-600">PIPELINE</span></h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center gap-3">
            DEAL STAGE VISUALIZATION
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </p>
        </div>
        <div className="flex gap-10">
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">ACTION REQUIRED</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">NEW ENTRY</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter(l => stage.statuses.includes(l.outreachStatus ?? l.status ?? 'cold'));
          return (
            <div key={stage.id} className="space-y-8">
              <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{stage.label}</h3>
                 </div>
                 <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/20">
                    <span className="text-white font-black italic text-xs">{stageLeads.length}</span>
                 </div>
              </div>

              <div className="space-y-4 min-h-[600px] bg-slate-900/20 rounded-[32px] p-2 border border-slate-800/50">
                {stageLeads.map((lead, i) => {
                  const displayStatus = lead.outreachStatus ?? lead.status ?? 'cold';
                  return (
                    <div key={lead.id} className={`bg-slate-900 border border-slate-800 rounded-[24px] p-6 space-y-4 relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer shadow-lg group hover:border-emerald-500/40`}>
                      <div className="flex justify-between items-start">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black border tracking-widest uppercase ${lead.assetGrade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                           {lead.assetGrade}
                         </span>
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{displayStatus}</span>
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight group-hover:text-emerald-400 transition-colors truncate">{lead.businessName}</h4>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic truncate">{lead.city}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${displayStatus === 'cold' ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{displayStatus}</span>
                         </div>
                         <span className="text-xs font-black italic text-emerald-400 tracking-tighter">{lead.leadScore}</span>
                      </div>
                    </div>
                  );
                })}
                {stageLeads.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center opacity-20"><h4 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">EMPTY</h4></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
