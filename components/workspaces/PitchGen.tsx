
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generatePitch } from '../../services/geminiService';

interface PitchGenProps {
  lead?: Lead;
}

export const PitchGen: React.FC<PitchGenProps> = ({ lead }) => {
  const [pitch, setPitch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const loadPitch = async () => {
      setIsLoading(true);
      try {
        const data = await generatePitch(lead);
        setPitch(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadPitch();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Required for Pitch Generation</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">PITCH <span className="text-indigo-600 not-italic">GEN</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Elevator Script for {lead.businessName}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-20 shadow-2xl relative min-h-[500px] flex flex-col items-center justify-center">
         {isLoading ? (
           <div className="space-y-6 text-center">
              <div className="w-1.5 h-16 bg-indigo-500/20 rounded-full relative overflow-hidden mx-auto">
                 <div className="absolute inset-0 bg-indigo-500 animate-[progress_2s_infinite]"></div>
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse italic">Crystallizing Hook Dynamics...</p>
           </div>
         ) : pitch && (
           <div className="animate-in slide-in-from-bottom-4 duration-700">
              <div className="bg-[#020617] border border-slate-800 p-12 rounded-[40px] text-center space-y-8 relative">
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 px-4 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">30S_DEPLOYMENT_SCRIPT</div>
                 <p className="text-2xl font-black italic text-slate-200 tracking-tight leading-relaxed font-sans uppercase">
                   "{pitch}"
                 </p>
              </div>
              <div className="mt-12 flex justify-center gap-6">
                 <button className="bg-slate-900 border border-slate-800 text-slate-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">TELEPROMPTER MODE</button>
                 <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all">COPY TO CLIPBOARD</button>
              </div>
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
