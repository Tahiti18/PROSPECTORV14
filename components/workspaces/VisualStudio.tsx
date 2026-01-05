
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateVisual, saveAsset } from '../../services/geminiService';

interface VisualStudioProps {
  leads: Lead[];
  lockedLead?: Lead;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({ leads, lockedLead }) => {
  const [prompt, setPrompt] = useState(lockedLead ? `High-end minimalist branding for ${lockedLead.businessName}, luxury aesthetic, 4k render.` : 'A futuristic workspace with neon accents.');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const base64Image = await generateVisual(prompt, lockedLead?.id);
      setGeneratedImage(base64Image);
      // Asset saved internally by generateVisual with leadId
    } catch (e) {
      console.error(e);
      alert("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
            VISUAL <span className="text-indigo-600 not-italic">STUDIO</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] mt-4 italic">Gemini 2.5 Flash Image Core</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-12 shadow-2xl space-y-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">PROMPT DIRECTIVE</h3>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-[32px] p-8 text-sm font-bold text-slate-300 focus:outline-none focus:border-indigo-500 h-64 resize-none shadow-xl placeholder-slate-700 italic"
                placeholder="Describe the visual asset..."
              />
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[28px] text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 border-b-4 border-indigo-700"
            >
              {isGenerating ? 'RENDERING...' : 'GENERATE ASSET'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-[#05091a] border border-slate-800 rounded-[84px] h-full min-h-[700px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            {generatedImage ? (
              <img src={generatedImage} className="w-full h-full object-cover animate-in zoom-in-95 duration-1000" alt="Generated Asset" />
            ) : (
              <div className="relative z-10 flex flex-col items-center text-center space-y-8 px-20 opacity-30">
                 <svg className="w-32 h-32 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" /></svg>
                 <h4 className="text-3xl font-black italic text-slate-700 uppercase tracking-tighter">STUDIO IDLE</h4>
              </div>
            )}
            {isGenerating && (
               <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">DIFFUSION MATRIX ACTIVE...</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
