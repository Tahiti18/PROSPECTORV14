
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
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Locked Target Required for Sequence Generation</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">ATTACK <span className="text-indigo-600 not-italic">SEQUENCE</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Multi-Channel Deployment for {lead.businessName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="h-96 bg-[#0b1021] border border-slate-800 rounded-[48px] flex flex-col items-center justify-center space-y-6">
             <div className="w-1.5 h-16 bg-indigo-500/20 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500 animate-[progress_2s_infinite]"></div>
             </div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse">Architecting 5-Day Combat Flow...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
             {sequence.map((step, i) => (
               <div key={i} className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 flex flex-col md:flex-row gap-8 hover:border-indigo-500/40 transition-all group">
                  <div className="md:w-32 flex flex-col items-center justify-center border-r border-slate-800/50 pr-8">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DAY</span>
                     <span className="text-5xl font-black italic text-indigo-500 tracking-tighter">{step.day}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                           {step.channel}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{step.purpose}</span>
                     </div>
                     <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-slate-800 pl-6 py-2 group-hover:border-indigo-500 transition-colors">
                       "{step.content}"
                     </p>
                  </div>
                  <div className="md:w-48 flex items-center justify-end">
                     <button className="bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
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
