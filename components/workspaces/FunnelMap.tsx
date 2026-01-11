import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { architectFunnel } from '../../services/geminiService';
import { dossierStorage } from '../../services/dossierStorage';

interface FunnelMapProps {
  lead?: Lead;
}

export const FunnelMap: React.FC<FunnelMapProps> = ({ lead }) => {
  const [stages, setStages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;

    // Attempt to pull from existing dossier first
    const dossier = dossierStorage.getByLead(lead.id);
    if (dossier && dossier.data.funnel) {
        setStages(dossier.data.funnel);
        return;
    }

    const loadFunnel = async () => {
      setIsLoading(true);
      try {
        const data = await architectFunnel(lead);
        setStages(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadFunnel();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Funnel Architecture</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">FUNNEL <span className="text-emerald-600 not-italic">MAP</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Conversion Logic for {lead.businessName}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative min-h-[600px] flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="space-y-6">
             <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse">Mapping Intent Vectors...</p>
          </div>
        ) : (
          <div className="w-full max-w-2xl space-y-8">
             {stages.length > 0 ? stages.map((s, i) => (
               <div key={i} className="relative group">
                  {i < stages.length - 1 && (
                    <div className="absolute left-1/2 -bottom-8 w-px h-8 bg-emerald-500/30"></div>
                  )}
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] hover:border-emerald-500/40 transition-all flex items-center gap-10">
                     <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center font-black text-emerald-400 italic text-xl">
                       {s.stage || (i+1)}
                     </div>
                     <div className="flex-1 space-y-1">
                        <h4 className="text-[13px] font-black text-white uppercase tracking-widest">{s.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.description}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">CONVERSION GOAL</p>
                        <p className="text-[11px] font-black text-slate-200 uppercase italic tracking-tighter">{s.conversionGoal}</p>
                     </div>
                  </div>
               </div>
             )) : (
                <div className="text-center opacity-30">
                    <p className="text-xs font-black uppercase tracking-widest">No funnel map available. Run Campaign Forge first.</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};