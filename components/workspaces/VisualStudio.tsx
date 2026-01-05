
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateVisual, saveAsset } from '../../services/geminiService';

interface VisualStudioProps {
  leads: Lead[];
  lockedLead?: Lead;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({ leads, lockedLead }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (lockedLead) {
        if (lockedLead.brandIdentity) {
            setPrompt(`Professional brand asset for ${lockedLead.businessName}. Style: ${lockedLead.brandIdentity.visualTone}. Colors: ${lockedLead.brandIdentity.colors.join(', ')}. Context: High-end corporate imagery.`);
        } else {
            setPrompt(`High-end minimalist branding for ${lockedLead.businessName}, luxury aesthetic, 4k render.`);
        }
    } else {
        setPrompt('A futuristic workspace with neon accents.');
    }
  }, [lockedLead]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const base64Image = await generateVisual(prompt, lockedLead);
      setGeneratedImage(base64Image);
    } catch (e) {
      console.error(e);
      alert("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSocialPack = async () => {
    if(!lockedLead || !lockedLead.brandIdentity) {
        alert("Please extract Brand DNA in Strategy Hub first.");
        return;
    }
    const platforms = ["Instagram Square", "LinkedIn Landscape", "Story Vertical"];
    setIsGenerating(true);
    for (const p of platforms) {
        const pPrompt = `Social media background for ${p}. ${prompt}`;
        try {
            await generateVisual(pPrompt, lockedLead);
        } catch(e) {}
    }
    setIsGenerating(false);
    alert("Social pack generated and saved to Asset Library.");
  }

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
            VISUAL <span className="text-emerald-500">STUDIO</span>
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Generative Image Synthesis Engine (Imagen 3 / Gemini Pro Vision)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-10">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DIRECTIVE</h3>
                 <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500 h-64 resize-none shadow-xl placeholder-slate-700 italic leading-relaxed"
                  placeholder="Describe the high-fidelity visual asset..."
                 />
              </div>

              <div className="space-y-4">
                 <button 
                   onClick={handleGenerate}
                   disabled={isGenerating}
                   className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-600/20 border-b-4 border-emerald-700"
                 >
                   {isGenerating ? 'RENDERING...' : 'GENERATE ASSET'}
                 </button>
                 <button 
                   onClick={handleGenerateSocialPack}
                   disabled={isGenerating}
                   className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                 >
                   AUTO-GENERATE SOCIAL PACK
                 </button>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[700px] flex flex-col relative shadow-2xl overflow-hidden group items-center justify-center">
              <div className="absolute inset-0 bg-emerald-600/[0.02] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {generatedImage ? (
                 <img src={generatedImage} alt="Generated Asset" className="w-full h-full object-contain animate-in zoom-in-95 duration-700" />
              ) : isGenerating ? (
                 <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">DIFFUSION MODEL ACTIVE...</p>
                 </div>
              ) : (
                 <div className="text-center opacity-30">
                    <span className="text-6xl mb-6 block grayscale">🖼️</span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">VISUAL CORE IDLE</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
