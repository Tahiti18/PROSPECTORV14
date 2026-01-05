
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateMotionLabConcept } from '../../services/geminiService';

interface MotionLabProps {
  lead?: Lead;
}

export const MotionLab: React.FC<MotionLabProps> = ({ lead }) => {
  const [concept, setConcept] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const loadConcept = async () => {
      setIsLoading(true);
      try {
        const data = await generateMotionLabConcept(lead);
        setConcept(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadConcept();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Required for Motion Storyboarding</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">MOTION <span className="text-emerald-600 not-italic">LAB</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Cinematic Storyboard Architecture for {lead.businessName}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 bg-[#0b1021] border border-slate-800 rounded-[48px] flex flex-col items-center justify-center space-y-6">
           <div className="w-1.5 h-32 bg-emerald-500/10 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500 animate-[pulse_1.5s_infinite]"></div>
           </div>
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse italic">Mapping Dynamic Vectors...</p>
        </div>
      ) : concept && (
        <div className="grid grid-cols-1 gap-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-12 shadow-2xl space-y-12">
              <div className="flex justify-between items-start">
                 <div className="space-y-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">TREATMENT: {concept.title}</span>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">"{concept.hook}"</h2>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {concept.scenes.map((scene: any, i: number) => (
                   <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition-all group">
                      <div className="flex justify-between items-center">
                         <span className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center font-black text-emerald-400 italic">0{i+1}</span>
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{scene.time}</span>
                      </div>
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-slate-200 uppercase leading-relaxed h-12 overflow-hidden italic">"{scene.visual}"</p>
                         <div className="pt-4 border-t border-slate-800/50">
                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">ON-SCREEN TEXT</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{scene.text}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
