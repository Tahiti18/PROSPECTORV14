import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../../types';
import { generateVideoPayload, enhanceVideoPrompt, VeoConfig, subscribeToAssets, AssetRecord, deleteAsset } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

interface VideoPitchProps {
  lead?: Lead;
}

export const VideoPitch: React.FC<VideoPitchProps> = ({ lead }) => {
  const defaultPrompt = lead 
    ? `Cinematic 4k commercial establishing shot for a ${lead.niche || 'luxury'} business in ${lead.city}. ${lead.brandIdentity?.visualTone || 'Professional and sleek'} aesthetic, photorealistic, trending on artstation, unreal engine 5 render, dramatic lighting.` 
    : "A futuristic cyberpunk city with neon lights, 4k, highly detailed.";

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<VeoConfig>({
    aspectRatio: '16:9',
    resolution: '720p',
    modelStr: 'VEO_3_1'
  });

  const [startImage, setStartImage] = useState<string | null>(null);
  const [endImage, setEndImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [assets, setAssets] = useState<AssetRecord[]>([]);

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToAssets((allAssets) => {
        setAssets(allAssets);
    });
    return () => unsub();
  }, []);

  const videoHistory = assets.filter(a => a.type === 'VIDEO' && (lead ? a.leadId === lead.id : !a.leadId));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'START' | 'END' | 'REF') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'REF') {
        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result && referenceImages.length < 3) {
                    setReferenceImages(prev => [...prev, ev.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
    } else {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (type === 'START') setStartImage(ev.target?.result as string);
            else setEndImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleEnhancePrompt = async () => {
    if (!prompt) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceVideoPrompt(prompt);
      setPrompt(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleForge = async () => {
    if (!prompt && !startImage) {
        toast.error("Input required: Prompt or Start Frame.");
        return;
    }
    
    setIsGenerating(true);
    setVideoUrl(null);
    setError(null);
    
    try {
      toast.info("VEO PROTOCOL: Submitting job to KIE pipeline...");
      const url = await generateVideoPayload(
        prompt, 
        lead?.id, 
        startImage || undefined, 
        endImage || undefined,
        config,
        referenceImages
      );
      
      if (url) {
        setVideoUrl(url);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Uplink Failure.");
    } finally {
      setIsGenerating(false);
    }
  };

  const STYLES = [
    { label: 'CINEMATIC', val: 'Cinematic lighting, 35mm film grain, shallow depth of field' },
    { label: 'DRONE', val: 'FPV drone shot, sweeping aerial view, high speed motion' },
    { label: 'CYBERPUNK', val: 'Neon lights, futuristic city, rain reflections, volumetric fog' },
    { label: 'MACRO', val: 'Extreme close up macro shot, intricate details, bokeh' },
    { label: 'VINTAGE', val: '1980s VHS glitch aesthetic, retro color grading' }
  ];

  return (
    <div className="max-w-[1920px] mx-auto p-6 min-h-screen flex flex-col gap-10 animate-in fade-in duration-700 bg-[#020617] text-white">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight leading-none flex items-center gap-3">
            VIDEO <span className="text-emerald-500">STUDIO</span>
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-[10px] text-white font-black tracking-widest border border-emerald-400 shadow-lg shadow-emerald-600/20">VEO 3.1 KIE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3 italic">
            {lead ? `TARGET: ${lead.businessName} • SECURED KIE LINK` : 'SANDBOX MODE • KIE MEDIA CORE'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-3 flex flex-col gap-6 bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-xl">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">VISUAL ANCHORS</h3>
           <div className="space-y-4">
              <div className="space-y-2">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">START FRAME</p>
                 <div onClick={() => startInputRef.current?.click()} className={`w-full h-32 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden ${startImage ? 'border-emerald-500/50 bg-black' : 'border-slate-800 bg-slate-900/30'}`}>
                    {startImage ? <img src={startImage} className="w-full h-full object-contain" /> : <span className="text-2xl opacity-20">🎬</span>}
                    <input type="file" ref={startInputRef} onChange={(e) => handleImageUpload(e, 'START')} className="hidden" accept="image/*" />
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">END FRAME (MORPH)</p>
                 <div onClick={() => endInputRef.current?.click()} className={`w-full h-32 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden ${endImage ? 'border-indigo-500/50 bg-black' : 'border-slate-800 bg-slate-900/30'}`}>
                    {endImage ? <img src={endImage} className="w-full h-full object-contain" /> : <span className="text-2xl opacity-20">🏁</span>}
                    <input type="file" ref={endInputRef} onChange={(e) => handleImageUpload(e, 'END')} className="hidden" accept="image/*" />
                 </div>
              </div>
           </div>
        </div>

        <div className="xl:col-span-6 flex flex-col">
           <div className={`w-full aspect-video bg-black border border-slate-800 rounded-[40px] overflow-hidden relative shadow-2xl flex items-center justify-center`}>
              {isGenerating ? (
                 <div className="flex flex-col items-center justify-center space-y-8">
                    <div className="w-24 h-24 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] animate-pulse">SYNTHESIZING VEO MATRIX...</p>
                 </div>
              ) : videoUrl ? (
                 <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : error ? (
                 <div className="text-center p-10"><p className="text-rose-500 font-mono text-xs">{error}</p></div>
              ) : (
                 <div className="text-center opacity-10"><span className="text-8xl">🎥</span></div>
              )}
           </div>
        </div>

        <div className="xl:col-span-3 bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-xl flex flex-col gap-6">
           <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">DIRECTOR CONSOLE</h3>
              <button onClick={handleEnhancePrompt} className="text-[8px] font-black text-emerald-400">✨ ENHANCE</button>
           </div>
           <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 bg-[#020617] border border-slate-800 rounded-2xl p-5 text-sm font-medium text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
              placeholder="Describe cinematic motion..."
           />
           <div className="flex flex-wrap gap-2">
              {STYLES.map(s => <button key={s.label} onClick={() => setPrompt(prev => `${s.val}, ${prev}`)} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[7px] font-black text-slate-500 hover:text-white transition-all uppercase">{s.label}</button>)}
           </div>
           <button 
             onClick={handleForge}
             disabled={isGenerating}
             className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 border-b-4 border-emerald-800 disabled:opacity-50"
           >
             {isGenerating ? 'RENDERING...' : 'START FORGE'}
           </button>
        </div>
      </div>
    </div>
  );
};
