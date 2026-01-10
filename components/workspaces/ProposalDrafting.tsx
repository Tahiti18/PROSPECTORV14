import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateProposalDraft } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface ProposalDraftingProps {
  lead?: Lead;
}

export const ProposalDrafting: React.FC<ProposalDraftingProps> = ({ lead }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const loadDraft = async () => {
      setIsLoading(true);
      try {
        const result = await generateProposalDraft(lead);
        setDraft(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDraft();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Context Required for Proposal Drafting</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">DRAFTING <span className="text-emerald-600 not-italic">PORTAL</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Constructing Operational Blueprint for {lead.businessName}</p>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-16 shadow-2xl relative min-h-[700px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
             <div className="w-1.5 h-32 bg-emerald-500/10 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500 animate-[pulse_1.5s_infinite]"></div>
             </div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse italic">Synthesizing Visionary Copy...</p>
          </div>
        ) : (
          <FormattedOutput content={draft} />
        )}
      </div>

      <div className="flex justify-center pb-20">
         <button className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
           FINALIZE DRAFT & EXPORT
         </button>
      </div>
    </div>
  );
};
