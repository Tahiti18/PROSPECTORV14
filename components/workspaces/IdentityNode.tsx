
import React, { useState } from 'react';
import { generateAgencyIdentity } from '../../services/geminiService';

export const IdentityNode: React.FC = () => {
  const [niche, setNiche] = useState('AI Automation');
  const [region, setRegion] = useState('Global');
  const [identity, setIdentity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleForge = async () => {
    setIsLoading(true);
    try {
      const data = await generateAgencyIdentity(niche, region);
      setIdentity(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">AGENCY <span className="text-emerald-600 not-italic">IDENTITY</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Credentials & Brand Matrix Forge</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-12 shadow-2xl space-y-10">
         {!identity && !isLoading && (
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Core Niche</label>
                    <input 
                      value={niche} onChange={(e) => setNiche(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-bold"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Region</label>
                    <input 
                      value={region} onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-bold"
                    />
                 </div>
              </div>
              <button 
                onClick={handleForge}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                INITIALIZE BRAND FORGE
              </button>
           </div>
         )}

         {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-6">
               <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] animate-pulse">Architecting Corporate Persona...</p>
            </div>
         )}

         {identity && (
           <div className="flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-700">
              <div className="w-32 h-32 bg-emerald-600 rounded-[32px] flex items-center justify-center text-white text-6xl font-black shadow-2xl shadow-emerald-600/30">
                 {identity.name ? identity.name.charAt(0) : 'A'}
              </div>
              <div>
                 <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">{identity.name}</h3>
                 <p className="text-sm font-bold text-emerald-400 italic tracking-wide mt-2">"{identity.tagline}"</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-8 rounded-[32px] w-full">
                 <p className="text-[11px] font-medium text-slate-300 leading-relaxed italic">
                   {identity.manifesto}
                 </p>
              </div>
              <div className="flex gap-4">
                 {identity.colors?.map((c: string, i: number) => (
                   <div key={i} className="w-12 h-12 rounded-full border-2 border-white/10 shadow-lg" style={{ backgroundColor: c }}></div>
                 ))}
              </div>
              <button onClick={() => setIdentity(null)} className="text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-widest mt-4">RESET IDENTITY</button>
           </div>
         )}
      </div>
    </div>
  );
};
