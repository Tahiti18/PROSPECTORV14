
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateOutreachSequence } from '../../services/geminiService';

interface SequencerProps {
  lead?: Lead;
}

export const Sequencer: React.FC<SequencerProps> = ({ lead }) => {
  const [sequence, setSequence] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const loadSequence = async () => {
      setIsLoading(true);
      try {
        const steps = await generateOutreachSequence(lead);
        setSequence(steps);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSequence();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Locked Lead Required for Campaign Builder</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white">CAMPAIGN <span className="text-emerald-600">BUILDER</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Multi-Channel Deployment for {lead.businessName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="h-96 bg-[#0b1021] border border-slate-800 rounded-[48px] flex flex-col items-center justify-center space-y-6">
             <div className="w-1.5 h-16 bg-emerald-500/20 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500 animate-[progress_2s_infinite]"></div>
             </div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse">Architecting 5-Day Campaign Flow...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
             {sequence.map((step, i) => (
               <div key={i} className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 flex flex-col md:flex-row gap-8 hover:border-emerald-500/40 transition-all group shadow-xl">
                  <div className="md:w-32 flex flex-col items-center justify-center border-r border-slate-800/50 pr-8">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DAY</span>
                     <span className="text-5xl font-black italic text-white group-hover:text-emerald-500 transition-colors tracking-tighter">{step.day}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-emerald-600/10 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                           {step.channel}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{step.purpose}</span>
                     </div>
                     <div className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-slate-800 pl-6 py-2 group-hover:border-emerald-500 transition-colors whitespace-pre-wrap">
                       {step.body || "Awaiting drafting..."}
                     </div>
                  </div>
                  <div className="md:w-48 flex items-center justify-end">
                     <button className="bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                        SEND TEST
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
};
