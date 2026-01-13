
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { generateVisual, saveAsset, generateVideoPayload } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

interface VisualStudioProps {
  leads: Lead[];
  lockedLead?: Lead;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({ leads, lockedLead }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mode, setMode] = useState<'GENERATE' | 'EDIT'>('GENERATE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lockedLead) {
        if (mode === 'GENERATE') {
            if (lockedLead.brandIdentity) {
                setPrompt(`High-end professional brand asset for ${lockedLead.businessName}. Style: ${lockedLead.brandIdentity.visualTone}. Colors: ${lockedLead.brandIdentity.colors.join(', ')}. Commercial 4K photography.`);
            } else {
                setPrompt(`Luxury minimalist branding for ${lockedLead.businessName}, high-fidelity, 4K render, cinematic lighting.`);
            }
        } else {
            setPrompt("Add sophisticated professional elements to the background.");
        }
    } else {
        setPrompt(mode === 'GENERATE' ? 'Futuristic AI agency workspace with clean geometry.' : 'Enhance professional lighting.');
    }
  }, [lockedLead?.id, mode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
          setUploadedImage(ev.target?.result as string);
          setGeneratedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    if (mode === 'EDIT' && !uploadedImage) {
        toast.info("Please upload an image to edit.");
        return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    try {
      const result = await generateVisual(prompt, lockedLead || { id: 'sandbox', businessName: 'Sandbox' } as Lead, mode === 'EDIT' ? uploadedImage || undefined : undefined);
      if (result) {
        setGeneratedImage(result);
        toast.success("Visual Asset Synchronized.");
      } else {
        toast.error("Generation node busy. Retry.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Neural forge connection error.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnimate = async () => {
    if (!generatedImage) return;
    setIsAnimating(true);
    try {
        const animPrompt = `Cinematic subtle motion for this ${lockedLead?.businessName || 'brand'} asset. High resolution.`;
        const videoUrl = await generateVideoPayload(animPrompt, lockedLead?.id, generatedImage);
        if (videoUrl) setGeneratedVideo(videoUrl);
    } catch (e) {
        console.error(e);
    } finally {
        setIsAnimating(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
            VISUAL <span className="text-emerald-500">STUDIO</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Professional imagery generation for high-end branding.
          </p>
        </div>
        <div className="bg-[#0b1021] border border-slate-800 rounded-full p-1 flex shadow-lg">
           {['GENERATE', 'EDIT'].map((m) => (
             <button
               key={m}
               onClick={() => setMode(m as any)}
               className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                 mode === m ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
               }`}
             >
               {m}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[80px] rounded-full"></div>
              {mode === 'EDIT' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 relative z-10">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">SOURCE IMAGE</h3>
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className={`w-full rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${uploadedImage ? 'border-emerald-500/50 h-48' : 'border-slate-800 h-24 hover:border-emerald-500/30'}`}
                   >
                      {uploadedImage ? <img src={uploadedImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Source" /> : <span className="text-2xl opacity-20">📷</span>}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                   </div>
                </div>
              )}
              <div className="space-y-4 relative z-10">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                    {mode === 'GENERATE' ? 'VISUAL DIRECTIVE' : 'EDIT INSTRUCTION'}
                 </h3>
                 <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500 h-48 resize-none shadow-xl italic custom-scrollbar"
                 />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800 relative z-10"
              >
                {isGenerating ? 'GENERATING...' : 'GENERATE ASSET'}
              </button>
           </div>
        </div>
        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[700px] flex flex-col relative shadow-2xl overflow-hidden group items-center justify-center">
              {generatedVideo ? (
                 <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-contain p-8 animate-in fade-in" />
              ) : generatedImage ? (
                 <div className="relative w-full h-full flex flex-col p-8 animate-in zoom-in-95 duration-700">
                    <img src={generatedImage} alt="Generated Asset" className="w-full h-full object-contain rounded-[32px] shadow-2xl" />
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={handleAnimate} disabled={isAnimating} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl border-b-4 border-indigo-800 active:scale-95">
                           {isAnimating ? 'RENDERING...' : 'ANIMATE (VEO)'}
                        </button>
                    </div>
                 </div>
              ) : isGenerating ? (
                 <div className="flex flex-col items-center justify-center space-y-8">
                    <div className="w-20 h-20 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="text-center space-y-2">
                        <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.5em] animate-pulse">SYNTHESIZING MATRIX</p>
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest italic">NEURAL PATH TRACING ACTIVE</p>
                    </div>
                 </div>
              ) : (
                 <div className="text-center space-y-6 opacity-10 grayscale scale-110">
                    <span className="text-[160px]">🖼️</span>
                    <p className="text-[12px] font-black uppercase tracking-[0.8em] text-white">FORGE IDLE</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
