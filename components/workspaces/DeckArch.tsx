
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { architectPitchDeck } from '../../services/geminiService';

interface DeckArchProps {
  lead?: Lead;
}

export const DeckArch: React.FC<DeckArchProps> = ({ lead }) => {
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const loadDeck = async () => {
      setIsLoading(true);
      try {
        const data = await architectPitchDeck(lead);
        setSlides(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDeck();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Deck Architecture</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">DECK <span className="text-indigo-600 not-italic">ARCH</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Structural Sales Blueprint for {lead.businessName}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative min-h-[600px] flex flex-col">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
             <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse italic">Mapping Slide Logic Hierarchy...</p>
          </div>
        ) : (
          <div className="space-y-6">
             {slides.map((s, i) => (
               <div key={i} className="flex gap-10 p-8 bg-slate-900 border border-slate-800 rounded-[32px] hover:border-indigo-500/40 transition-all group">
                  <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center font-black text-indigo-400 italic text-2xl">
                    {i+1}
                  </div>
                  <div className="flex-1 space-y-3">
                     <h4 className="text-[13px] font-black text-white uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{s.title}</h4>
                     <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">"{s.narrativeGoal}"</p>
                     <div className="pt-4 border-t border-slate-800/50 flex items-center gap-4">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">VISUAL_ASSET:</span>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest truncate">{s.keyVisuals}</p>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
