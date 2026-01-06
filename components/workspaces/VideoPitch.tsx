import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../../types';
import { generateVideoPayload, enhanceVideoPrompt, VeoConfig, subscribeToAssets, AssetRecord, deleteAsset } from '../../services/geminiService';

interface VideoPitchProps {
  lead?: Lead;
}

export const VideoPitch: React.FC<VideoPitchProps> = ({ lead }) => {
  // Enhanced Default Prompt
  const defaultPrompt = lead 
    ? `Cinematic 4k commercial establishing shot for a ${lead.niche || 'luxury'} business in ${lead.city}. ${lead.brandIdentity?.visualTone || 'Professional and sleek'} aesthetic, photorealistic, trending on artstation, unreal engine 5 render, dramatic lighting.` 
    : "A futuristic cyberpunk city with neon lights, 4k, highly detailed.";

  // Core State
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration State
  const [config, setConfig] = useState<VeoConfig>({
    aspectRatio: '16:9',
    resolution: '720p',
    modelStr: 'veo3_fast'
  });

  // Assets State
  const [startImage, setStartImage] = useState<string | null>(null);
  const [endImage, setEndImage] = useState<string | null>(null);
  
  // New: Multi-Ref & Extend
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [inputVideo, setInputVideo] = useState<string | null>(null); // Base64 string for extension
  const [extendingVideoId, setExtendingVideoId] = useState<string | null>(null);

  // Gallery State
  const [assets, setAssets] = useState<AssetRecord[]>([]);

  // Refs
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Assets
  useEffect(() => {
    const unsub = subscribeToAssets((allAssets) => {
        setAssets(allAssets);
    });
    return () => unsub();
  }, []);

  // Filter for relevant videos (current lead or sandbox)
  const videoHistory = assets.filter(a => {
      if (a.type !== 'VIDEO') return false;
      if (lead) return a.leadId === lead.id;
      return !a.leadId; // Sandbox mode shows only global/unassigned videos
  });

  // Re-sync prompt if lead changes (and prompt hasn't been manually edited heavily)
  useEffect(() => {
    if (lead) {
       setPrompt(`Cinematic 4k commercial establishing shot for a ${lead.niche || 'luxury'} business in ${lead.city}. ${lead.brandIdentity?.visualTone || 'Professional and sleek'} aesthetic, photorealistic, trending on artstation, unreal engine 5 render, dramatic lighting.`);
    }
  }, [lead?.id]);

  // --- ACTIONS ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'START' | 'END' | 'REF') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'REF') {
        // Handle multiple files
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
    // Reset input
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
    if (!prompt && !startImage && !inputVideo) {
        alert("Please provide at least a prompt, start image, or input video.");
        return;
    }
    
    setIsGenerating(true);
    setVideoUrl(null);
    setError(null);
    
    try {
      // Direct call to KIE-powered function
      const url = await generateVideoPayload(
        prompt, 
        lead?.id, 
        startImage || undefined, 
        endImage || undefined,
        config,
        referenceImages,
        inputVideo || undefined
      );
      
      if (url) {
        setVideoUrl(url);
        // Asset saved automatically in service
        
        // Reset extension state after success
        if (inputVideo) {
            setInputVideo(null);
            setExtendingVideoId(null);
        }
      }
    } catch (e: any) {
      console.error(e);
      // Display detailed error in UI
      const msg = e.message || "Unknown error occurred.";
      setError(msg);
      alert(`Generation Failed: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddStyle = (style: string) => {
    setPrompt(prev => `${style}, ${prev}`);
  };

  const handleDeleteVideo = (id: string) => {
    if (confirm("Permanently delete this video from the vault?")) {
        deleteAsset(id);
        if (assets.find(a => a.id === id)?.data === videoUrl) {
            setVideoUrl(null);
        }
    }
  };

  const handleRemix = (asset: AssetRecord) => {
    let p = asset.title;
    if (p.includes("VEO_CLIP")) p = "Remix of previous generation...";
    setPrompt(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExtend = async (asset: AssetRecord) => {
    if (!confirm("Load this video for extension? This will lock the input to generate the NEXT 8 seconds.")) return;
    
    // Fetch blob and convert to base64
    try {
        const response = await fetch(asset.data);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setInputVideo(base64);
            setExtendingVideoId(asset.id);
            setPrompt(`Continuing action from previous clip...`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        reader.readAsDataURL(blob);
    } catch (e) {
        alert("Failed to load video for extension. Ensure the URL is accessible.");
    }
  };

  const handleDownload = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `VEO_GEN_${id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const STYLES = [
    { label: 'CINEMATIC', val: 'Cinematic lighting, 35mm film grain, shallow depth of field' },
    { label: 'DRONE', val: 'FPV drone shot, sweeping aerial view, high speed motion' },
    { label: 'CYBERPUNK', val: 'Neon lights, futuristic city, rain reflections, volumetric fog' },
    { label: 'MACRO', val: 'Extreme close up macro shot, intricate details, bokeh' },
    { label: 'VINTAGE', val: '1980s VHS glitch aesthetic, retro color grading' }
  ];

  return (
    <div className="max-w-[1920px] mx-auto p-6 min-h-screen flex flex-col gap-10 animate-in fade-in duration-700 bg-[#020617] text-white">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight leading-none flex items-center gap-3">
            VIDEO <span className="text-emerald-500">STUDIO</span>
            <span className="px-3 py-1 rounded-full bg-indigo-600 text-[10px] text-white font-black tracking-widest border border-indigo-400 shadow-lg shadow-indigo-500/20">VEO 3.1 PRO</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3 italic">
            {lead ? `TARGET: ${lead.businessName} • AI DIRECTOR` : 'SANDBOX MODE • CREATIVE SUITE'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: VISUAL ANCHORS (Start/End/Ref) */}
        <div className="xl:col-span-3 flex flex-col gap-6 bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-xl h-full">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">VISUAL ANCHORS</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
           
           {/* START FRAME */}
           <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                 <span>START FRAME</span>
                 {startImage && <button onClick={() => setStartImage(null)} className="text-rose-500 hover:text-white transition-colors text-[8px]">REMOVE</button>}
              </label>
              <div 
                onClick={() => startInputRef.current?.click()}
                className={`w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group flex flex-col items-center justify-center shadow-inner ${startImage ? 'border-emerald-500/50 bg-black' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900 hover:border-emerald-500/50'}`}
              >
                 {startImage ? (
                   <img src={startImage} className="w-full h-full object-contain" alt="Start" />
                 ) : (
                   <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-2xl block mb-2">🎬</span>
                      <span className="text-[8px] font-black uppercase tracking-widest block">START</span>
                   </div>
                 )}
                 <input type="file" ref={startInputRef} onChange={(e) => handleImageUpload(e, 'START')} className="hidden" accept="image/*" />
              </div>
           </div>

           {/* END FRAME */}
           <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                 <span>END FRAME (MORPH)</span>
                 {endImage && <button onClick={() => setEndImage(null)} className="text-rose-500 hover:text-white transition-colors text-[8px]">REMOVE</button>}
              </label>
              <div 
                onClick={() => endInputRef.current?.click()}
                className={`w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group flex flex-col items-center justify-center shadow-inner ${endImage ? 'border-indigo-500/50 bg-black' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900 hover:border-indigo-500/50'}`}
              >
                 {endImage ? (
                   <img src={endImage} className="w-full h-full object-contain" alt="End" />
                 ) : (
                   <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-2xl block mb-2">🏁</span>
                      <span className="text-[8px] font-black uppercase tracking-widest block">END</span>
                   </div>
                 )}
                 <input type="file" ref={endInputRef} onChange={(e) => handleImageUpload(e, 'END')} className="hidden" accept="image/*" />
              </div>
           </div>

           {/* REFERENCES (Multi) */}
           <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                 <span>CHARACTER / STYLE REFS ({referenceImages.length}/3)</span>
                 {referenceImages.length > 0 && <button onClick={() => setReferenceImages([])} className="text-rose-500 hover:text-white transition-colors text-[8px]">CLEAR</button>}
              </label>
              <div 
                onClick={() => refInputRef.current?.click()}
                className={`w-full min-h-[100px] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group flex flex-wrap items-center justify-center gap-2 p-2 shadow-inner ${referenceImages.length > 0 ? 'border-indigo-500/50 bg-slate-950' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900'}`}
              >
                 {referenceImages.length > 0 ? (
                   referenceImages.map((ref, idx) => (
                     <img key={idx} src={ref} className="w-12 h-12 object-cover rounded-lg border border-slate-700" alt={`Ref ${idx}`} />
                   ))
                 ) : (
                   <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-2xl block mb-2">🧬</span>
                      <span className="text-[8px] font-black uppercase tracking-widest block">MULTI-REF</span>
                   </div>
                 )}
                 <input type="file" ref={refInputRef} onChange={(e) => handleImageUpload(e, 'REF')} className="hidden" accept="image/*" multiple />
              </div>
           </div>
        </div>

        {/* CENTER: CINEMA VIEWPORT */}
        <div className="xl:col-span-6 flex flex-col">
           <div className={`w-full aspect-video bg-black border border-slate-800 rounded-[40px] overflow-hidden relative shadow-2xl flex items-center justify-center group ring-4 ring-slate-900`}>
              
              {/* Overlay UI */}
              <div className="absolute top-8 left-8 z-20 flex gap-3">
                 <div className={`px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-lg`}>
                    <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                    {isGenerating ? 'VEO RENDERING...' : 'STANDBY'}
                 </div>
                 {inputVideo && (
                    <div className="px-4 py-1.5 rounded-full bg-indigo-600/80 border border-white/10 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-white shadow-lg animate-pulse">
                        EXTENSION MODE
                    </div>
                 )}
              </div>

              {isGenerating ? (
                 <div className="flex flex-col items-center justify-center space-y-8">
                    <div className="relative w-32 h-32">
                       <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                       <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                       <div className="absolute inset-0 flex items-center justify-center font-black text-xl italic text-slate-700">VEO</div>
                    </div>
                    <div className="text-center space-y-2">
                       <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] animate-pulse">SYNTHESIZING PIXELS...</p>
                       <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">EST. TIME: 45s</p>
                    </div>
                 </div>
              ) : videoUrl ? (
                 <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : error ? (
                 <div className="text-center max-w-md px-10">
                    <span className="text-6xl block mb-6 grayscale opacity-50">⚠️</span>
                    <p className="text-[12px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">RENDER INTERRUPTED</p>
                    <p className="text-[10px] font-bold text-slate-400 font-mono bg-slate-900 p-6 rounded-2xl border border-slate-800 leading-relaxed">
                        {error}
                    </p>
                 </div>
              ) : (
                 <div className="text-center opacity-20 select-none">
                    <span className="text-8xl block mb-6 grayscale">🎥</span>
                    <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em]">CINEMA VIEWPORT</p>
                 </div>
              )}
           </div>
        </div>

        {/* RIGHT: DIRECTOR CONSOLE */}
        <div className="xl:col-span-3 bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-xl flex flex-col gap-8 h-full">
           <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">DIRECTOR'S CONSOLE</h3>
              <button onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt} className="px-3 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 {isEnhancing ? <span className="animate-spin">⟳</span> : <span>✨</span>}
                 AI ENHANCE
              </button>
           </div>
           
           {/* Prompt */}
           <div className="space-y-3 flex-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SCENE DESCRIPTION</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-48 bg-[#020617] border border-slate-800 rounded-2xl p-5 text-sm font-medium text-slate-300 focus:outline-none focus:border-emerald-500 resize-none shadow-inner leading-relaxed custom-scrollbar placeholder-slate-700"
                placeholder={inputVideo ? "Describe what happens NEXT in the video..." : "Describe camera movement, lighting, subject action, and atmosphere..."}
              />
           </div>

           {/* Style Chips */}
           <div className="space-y-3">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AESTHETIC PRESETS</label>
              <div className="flex flex-wrap gap-2">
                 {STYLES.map(style => (
                   <button 
                     key={style.label}
                     onClick={() => handleAddStyle(style.val)}
                     className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[8px] font-black text-slate-400 hover:text-white hover:border-emerald-500 hover:bg-emerald-900/20 transition-all uppercase tracking-wider"
                     title={style.val}
                   >
                     {style.label}
                   </button>
                 ))}
              </div>
           </div>

           {/* Config */}
           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="space-y-2">
                 <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ASPECT</label>
                 <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                    {['16:9', '9:16'].map(ar => (
                      <button 
                        key={ar}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ar as any }))}
                        className={`flex-1 py-2 text-[8px] font-black rounded-lg transition-all ${config.aspectRatio === ar ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {ar}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">QUALITY</label>
                 <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                    {['720p', '1080p'].map(res => (
                      <button 
                        key={res}
                        onClick={() => setConfig(prev => ({ ...prev, resolution: res as any }))}
                        className={`flex-1 py-2 text-[8px] font-black rounded-lg transition-all ${config.resolution === res ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {res}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <button 
             onClick={handleForge}
             disabled={isGenerating}
             className={`w-full text-white py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border-b-4 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 ${inputVideo ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 border-indigo-800' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 border-emerald-800'}`}
           >
             {isGenerating ? <span className="animate-spin text-xl">⟳</span> : <span className="text-xl">⚡</span>}
             {isGenerating ? 'RENDERING...' : (inputVideo ? 'EXTEND VIDEO' : 'GENERATE VIDEO')}
           </button>
        </div>
      </div>

      {/* --- PRODUCTION GALLERY --- */}
      <div className="mt-20 pt-10 border-t border-slate-800/50">
         <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
               <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">PRODUCTION <span className="text-indigo-500">HISTORY</span></h2>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">ARCHIVED GENERATIONS ({videoHistory.length})</p>
            </div>
            {videoHistory.length > 0 && <button onClick={() => {}} className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest">EXPORT ALL</button>}
         </div>

         {videoHistory.length === 0 ? (
            <div className="py-20 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center text-center opacity-40">
               <span className="text-6xl mb-4 grayscale">🎞️</span>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NO CLIPS IN ARCHIVE</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {videoHistory.map((video) => (
                  <div key={video.id} className="group bg-[#0b1021] border border-slate-800 hover:border-emerald-500/50 rounded-[32px] overflow-hidden transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 flex flex-col">
                     <div className="aspect-video bg-black relative overflow-hidden">
                        <video src={video.data} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" controls />
                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[7px] font-black text-white uppercase tracking-widest border border-white/10">
                           {video.module?.includes('FAST') ? 'FAST' : 'PRO'}
                        </div>
                     </div>
                     <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{new Date(video.timestamp).toLocaleString()}</p>
                           <p className="text-xs font-medium text-slate-300 line-clamp-3 leading-relaxed italic" title={video.title}>"{video.title}"</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-800/50">
                           <button 
                             onClick={() => handleExtend(video)}
                             className="py-2 col-span-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-[8px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                             title="Extend this clip (+8s)"
                           >
                             <span>⏩</span> EXTEND CLIP
                           </button>
                           <button 
                             onClick={() => handleRemix(video)}
                             className="py-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                             title="Load prompt to editor"
                           >
                             <span>↺</span> REMIX
                           </button>
                           <button 
                             onClick={() => handleDownload(video.data, video.id)}
                             className="py-2 rounded-lg bg-slate-900 text-emerald-500 hover:text-emerald-400 hover:bg-slate-800 text-[8px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                             title="Download MP4"
                           >
                             <span>⬇</span> SAVE
                           </button>
                        </div>
                        <div className="mt-2 text-center">
                           <button 
                             onClick={() => handleDeleteVideo(video.id)}
                             className="text-[8px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-colors"
                           >
                             DELETE ASSET
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};