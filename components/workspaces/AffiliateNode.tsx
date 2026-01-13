
import React, { useState } from 'react';
import { generateAffiliateProgram } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

export const AffiliateNode: React.FC = () => {
  const [niche, setNiche] = useState('AI Automation Agency');
  const [program, setProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const data = await generateAffiliateProgram(niche);
      setProgram(data);
      toast.success("PARTNER PROGRAM ARCHITECTED.");
    } catch (e: any) {
      console.error(e);
      toast.error("Architecture Failed: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-in fade-in duration-500 pb-40">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">PARTNER <span className="text-emerald-600 not-italic">ARCHITECT</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Growth Network Infrastructure</p>
      </div>

      <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
         
         <div className="flex gap-6 relative z-10">
            <input 
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="flex-1 bg-[#020617] border-2 border-slate-800 rounded-2xl px-8 py-5 text-white font-bold text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
              placeholder="Target Niche for Growth Partners..."
            />
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800"
            >
              {isLoading ? 'ARCHITECTING...' : 'GENERATE PROGRAM'}
            </button>
         </div>

         {program && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-8 duration-700 relative z-10">
              <div className="space-y-8">
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">{program.programName}</h3>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em]">COMMISSION HIERARCHY</p>
                 </div>
                 <div className="space-y-4">
                    {program.tiers?.map((t: any, i: number) => (
                      <div key={i} className="bg-slate-900/50 border-2 border-slate-800 p-8 rounded-3xl flex justify-between items-center group hover:border-emerald-500/40 transition-all shadow-lg">
                         <div>
                            <p className="text-sm font-black text-white uppercase tracking-widest">{t.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 italic">{t.requirement}</p>
                         </div>
                         <p className="text-4xl font-black italic text-emerald-400 tracking-tighter group-hover:scale-110 transition-transform">{t.commission}</p>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="bg-slate-950 border-2 border-slate-800 p-10 rounded-[40px] relative shadow-inner overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[60px] rounded-full"></div>
                 <div className="absolute top-6 left-10 bg-emerald-600 px-4 py-1.5 rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-emerald-400/20">RECRUITMENT PROTOCOL</div>
                 <div className="mt-12 text-slate-400 text-xs leading-relaxed font-mono whitespace-pre-wrap italic uppercase">
                   {program.recruitScript}
                 </div>
              </div>
           </div>
         )}
         
         {!program && !isLoading && (
            <div className="py-20 text-center opacity-20 italic flex flex-col items-center gap-6">
                <span className="text-7xl">🤝</span>
                <p className="text-[10px] font-black uppercase tracking-[0.6em]">Awaiting Program Parameters</p>
            </div>
         )}
      </div>
    </div>
  );
};
