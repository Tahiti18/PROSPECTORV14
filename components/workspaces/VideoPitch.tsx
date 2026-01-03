
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateVideoPayload } from '../../services/geminiService';

interface VideoPitchProps {
  lead?: Lead;
}

export const VideoPitch: React.FC<VideoPitchProps> = ({ lead }) => {
  const [prompt, setPrompt] = useState(lead ? `A sleek 4k cinematic intro for a high-end AI agency pitching to ${lead.businessName} in ${lead.city}. Show luxury office aesthetics and rapid data visualization.` : "");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const checkAndOpenKey = async () => {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
    setHasApiKey(true);
  };

  const handleForge = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      await checkAndOpenKey();
      const url = await generateVideoPayload(prompt);
      setVideoUrl(url);
    } catch (e) {
      console.error(e);
      alert("Video generation requires a paid API key and valid permissions.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">VEO <span className="text-indigo-600 not-italic">FORGE</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Cinematic Payload Generation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-2xl">
            <div className="bg-indigo-600/5 border border-indigo-500/20 p-4 rounded-xl">
               <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest leading-relaxed">
                 VEO-3.1 FAST REQUIRES A PAID API KEY SELECTION. CLICK GENERATE TO INITIATE PROTOCOL.
               </p>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cinematic Directive</label>
               <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-indigo-500 h-48 resize-none shadow-xl italic"
                placeholder="Describe the cinematic intro..."
               />
            </div>
            <button 
              onClick={handleForge}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 border border-indigo-400/20"
            >
              {isGenerating ? 'FORGING CINEMATIC...' : 'GENERATE VEO PAYLOAD'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-[#05091a] border border-slate-800 rounded-[48px] h-full min-h-[500px] relative overflow-hidden flex items-center justify-center shadow-2xl border-dashed">
             {videoUrl ? (
               <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover animate-in zoom-in-95 duration-700" />
             ) : (
               <div className="text-center space-y-4 opacity-30 group">
                  <span className="text-6xl group-hover:scale-110 transition-transform block">🎬</span>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Input Directive to Start Veo Forge</p>
               </div>
             )}
             {isGenerating && (
               <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-8 p-12 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <div className="space-y-3">
                    <p className="text-[12px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Initializing VEO-3.1 Neural Engine...</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest max-w-xs">High-fidelity video synthesis can take up to 2 minutes. Do not disconnect.</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
