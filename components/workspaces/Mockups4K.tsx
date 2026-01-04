
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateMockup, saveAsset } from '../../services/geminiService';

interface Mockups4KProps {
  lead?: Lead;
}

export const Mockups4K: React.FC<Mockups4KProps> = ({ lead }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!lead) return;
    setIsGenerating(true);
    try {
      const url = await generateMockup(lead.businessName, lead.niche, lead.id);
      setImageUrl(url);
      // Asset saved internally by generateMockup call with leadId
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Required for 4K Mockup Forge</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">4K <span className="text-indigo-600 not-italic">MOCKUPS</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Ultra-Premium Asset Generation for {lead.businessName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-12 space-y-8 shadow-2xl">
          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Mockup Directive</h3>
             <p className="text-slate-300 text-sm italic border-l-2 border-indigo-500 pl-4 py-2 bg-indigo-500/5">
                Generating ultra-high-end visual proof based on {lead.businessName}'s aesthetic. This mockup will be used in the Magic Link proposal.
             </p>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 border border-indigo-400/20"
          >
            {isGenerating ? 'FORGING 4K ASSET...' : 'INITIATE ASSET FORGE'}
          </button>
        </div>

        <div className="bg-[#05091a] border border-slate-800 rounded-[48px] relative aspect-square overflow-hidden flex items-center justify-center shadow-2xl">
           {imageUrl ? (
             <img src={imageUrl} className="w-full h-full object-cover animate-in zoom-in-95 duration-1000" alt="4K Mockup" />
           ) : (
             <div className="text-center space-y-4 opacity-30">
                <span className="text-6xl block">💎</span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Awaiting Generation</p>
             </div>
           )}
           {isGenerating && (
             <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-6 p-10 text-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">Neural Path Tracing 4K Resolution...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
