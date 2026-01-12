
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { generateVisual, saveAsset, generateVideoPayload } from '../../services/geminiService';

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

  const EDIT_PRESETS = [
    { label: '✂️ REMOVE BG', prompt: 'Remove the background from this image. Solid white background.' },
    { label: '➕ ADD OBJECT', prompt: 'Add a [object] to the scene naturally.' },
    { label: '🎨 CYBERPUNK', prompt: 'Transform into cyberpunk style, neon lights, futuristic city.' },
    { label: '✏️ SKETCH', prompt: 'Convert to a pencil sketch drawing.' },
    { label: '💡 STUDIO LIGHT', prompt: 'Enhance with professional studio lighting, soft shadows.' },
    { label: '🚀 FUTURISTIC', prompt: 'Make it look futuristic and high-tech.' }
  ];

  useEffect(() => {
    if (lockedLead) {
        if (mode === 'GENERATE') {
            if (lockedLead.brandIdentity) {
                setPrompt(`Professional brand asset for ${lockedLead.businessName}. Style: ${lockedLead.brandIdentity.visualTone}. Colors: ${lockedLead.brandIdentity.colors.join(', ')}. Context: High-end corporate imagery.`);
            } else {
                setPrompt(`High-end minimalist branding for ${lockedLead.businessName}, luxury aesthetic, 4k render.`);
            }
        } else {
            setPrompt("Add a neon sign saying 'OPEN' to the background.");
        }
    } else {
        setPrompt(mode === 'GENERATE' ? 'A futuristic workspace with neon accents.' : 'Turn this into a pencil sketch.');
    }
  }, [lockedLead, mode]);

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
        alert("Please upload an image to edit.");
        return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    try {
      const base64Image = await generateVisual(prompt, lockedLead || { id: 'sandbox' } as Lead, mode === 'EDIT' ? uploadedImage || undefined : undefined);
      if (base64Image) setGeneratedImage(base64Image);
    } catch (e) {
      console.error(e);
      alert("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnimate = async () => {
    if (!generatedImage) return;
    setIsAnimating(true);
    try {
        const animPrompt = `Cinematic slow motion animation of this image. Bring the subject to life. ${prompt || 'High quality, 4k, trending on artstation'}`;
        const videoUrl = await generateVideoPayload(animPrompt, lockedLead?.id, generatedImage);
        if (videoUrl) setGeneratedVideo(videoUrl);
    } catch (e) {
        console.error(e);
        alert("Animation failed.");
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
        <div className="bg-[#0b1021] border border-slate-800 rounded-full p-1 flex">
           {['GENERATE', 'EDIT'].map((m) => (
             <button
               key={m}
               onClick={() => setMode(m as any)}
               className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
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
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-8">
              {mode === 'EDIT' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
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
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                    {mode === 'GENERATE' ? 'VISUAL DIRECTIVE' : 'EDIT INSTRUCTION'}
                 </h3>
                 <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500 h-48 resize-none shadow-xl italic"
                 />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-700"
              >
                {isGenerating ? 'GENERATING...' : 'GENERATE ASSET'}
              </button>
           </div>
        </div>
        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[700px] flex flex-col relative shadow-2xl overflow-hidden group items-center justify-center">
              {generatedVideo ? (
                 <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-contain p-8" />
              ) : generatedImage ? (
                 <div className="relative w-full h-full flex flex-col p-8">
                    <img src={generatedImage} alt="Generated Asset" className="w-full h-full object-contain rounded-[32px]" />
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={handleAnimate} disabled={isAnimating} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest shadow-2xl border-b-4 border-indigo-800">
                           {isAnimating ? 'RENDERING...' : 'ANIMATE (VEO)'}
                        </button>
                    </div>
                 </div>
              ) : isGenerating ? (
                 <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SYNTHESIZING...</p>
                 </div>
              ) : (
                 <div className="text-center opacity-10"><span className="text-9xl">🖼️</span></div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
