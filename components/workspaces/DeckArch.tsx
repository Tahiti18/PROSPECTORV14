import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { architectPitchDeck } from '../../services/geminiService';
import { dossierStorage } from '../../services/dossierStorage';

interface DeckArchProps {
  lead?: Lead;
}

export const DeckArch: React.FC<DeckArchProps> = ({ lead }) => {
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    
    // Attempt to pull from existing dossier first for 100% working integration
    const dossier = dossierStorage.getByLead(lead.id);
    if (dossier && dossier.data.presentation?.slides) {
        setSlides(dossier.data.presentation.slides);
        return;
    }

    const loadDeck = async () => {
      setIsLoading(true);
      try {
        const result = await architectPitchDeck(lead);
        if (Array.isArray(result)) {
            setSlides(result);
        } else if (result && typeof result === 'object' && Array.isArray((result as any).slides)) {
            setSlides((result as any).slides);
        } else {
            setSlides([]);
        }
      } catch (e) {
        console.error(e);
        setSlides([]);
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
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">DECK <span className="text-emerald-600 not-italic">ARCH</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Structural Sales Blueprint for {lead.businessName}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative min-h-[600px] flex flex-col">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
             <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse italic">Crystallizing Neural Blueprint...</p>
          </div>
        ) : (
          <div className="space-y-6">
             {slides.length > 0 ? slides.map((s: any, i: number) => (
               <div key={i} className="flex gap-10 p-8 bg-slate-900 border border-slate-800 rounded-[32px] hover:border-emerald-500/40 transition-all group">
                  <div className="w-16 h-16 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center font-black text-emerald-400 italic text-2xl">
                    {i+1}
                  </div>
                  <div className="flex-1 space-y-3">
                     <h4 className="text-[13px] font-black text-white uppercase tracking-widest group-hover:text-emerald-400 transition-colors">{s?.title || "Slide Title"}</h4>
                     <ul className="space-y-2">
                        {s?.bullets?.map((b: string, j: number) => (
                           <li key={j} className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                              {b}
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
             )) : (
               <div className="py-20 text-center opacity-30 flex flex-col items-center">
                 <span className="text-4xl mb-4 grayscale">📂</span>
                 <p className="text-xs font-black uppercase tracking-widest">No slides generated. Run Campaign Forge first.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};