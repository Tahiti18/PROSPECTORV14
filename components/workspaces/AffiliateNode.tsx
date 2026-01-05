
import React, { useState } from 'react';
import { generateAffiliateProgram } from '../../services/geminiService';

export const AffiliateNode: React.FC = () => {
  const [niche, setNiche] = useState('High-Ticket AI');
  const [program, setProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const data = await generateAffiliateProgram(niche);
      setProgram(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">PARTNER <span className="text-indigo-600 not-italic">ARCHITECT</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Affiliate Matrix Generator</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-12 shadow-2xl space-y-10">
         <div className="flex gap-4">
            <input 
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Target Niche for Partners..."
            />
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {isLoading ? 'ARCHITECTING...' : 'GENERATE PROGRAM'}
            </button>
         </div>

         {program && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4">
              <div className="space-y-6">
                 <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">{program.programName}</h3>
                 <div className="space-y-4">
                    {program.tiers?.map((t: any, i: number) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
                         <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">{t.name}</p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">{t.requirement}</p>
                         </div>
                         <p className="text-2xl font-black italic text-emerald-400 tracking-tighter">{t.commission}</p>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl relative">
                 <div className="absolute -top-3 left-8 bg-indigo-600 px-3 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">RECRUITMENT SCRIPT</div>
                 <p className="text-slate-400 text-xs leading-relaxed font-mono whitespace-pre-wrap">{program.recruitScript}</p>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
