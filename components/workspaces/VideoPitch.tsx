
import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../../types';
import { generateVideoPayload, enhanceVideoPrompt, VeoConfig, saveAsset } from '../../services/geminiService';

interface VideoPitchProps {
  lead?: Lead;
}

export const VideoPitch: React.FC<VideoPitchProps> = ({ lead }) => {
  // Core State
  const [prompt, setPrompt] = useState(lead ? `Cinematic establishing shot of a modern office in ${lead.city}, sleek, 4k, trending on artstation.` : "A futuristic cyberpunk city with neon lights, 4k, highly detailed.");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Configuration State
  const [config, setConfig] = useState<VeoConfig>({
    aspectRatio: '16:9',
    resolution: '720p',
    modelStr: 'veo-3.1-fast-generate-preview'
  });

  // Assets State
  const [startImage, setStartImage] = useState<string | null>(null);
  const [endImage, setEndImage] = useState<string | null>(null);
  const [history, setHistory] = useState<{url: string, prompt: string, timestamp: number}[]>([]);

  // Refs
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // --- ACTIONS ---

  const checkAndOpenKey = async () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'START' | 'END') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'START') setStartImage(ev.target?.result as string);
        else setEndImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        alert("Please provide at least a prompt or a start image.");
        return;
    }
    
    setIsGenerating(true);
    setVideoUrl(null);
    
    try {
      await checkAndOpenKey();
      
      const url = await generateVideoPayload(
        prompt, 
        lead?.id, 
        startImage || undefined, 
        endImage || undefined,
        config
      );
      
      if (url) {
        setVideoUrl(url);
        setHistory(prev => [{ url, prompt, timestamp: Date.now() }, ...prev]);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Generation Failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToVault = () => {
    if (videoUrl) {
      // It's already saved by generateVideoPayload, but user feedback is nice
      alert("Video secured in Media Vault.");
    }
  };

  const handleExport = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `VEO_GEN_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-[1800px] mx-auto p-6 h-[calc(100vh-100px)] flex flex-col gap-6 animate-in fade-in duration-700 bg-[#020617] text-white">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight leading-none flex items-center gap-3">
            VEO <span className="text-emerald-500">DIRECTOR</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400 font-bold tracking-widest border border-slate-700">3.1 SUITE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            {lead ? `TARGET: ${lead.businessName}` : 'SANDBOX MODE'}
          </p>
        </div>
        <div className="flex gap-4">
           {videoUrl && (
             <>
               <button onClick={handleSaveToVault} className="text-[9px] font-black text-emerald-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                 <span>💾</span> TO VAULT
               </button>
               <button onClick={handleExport} className="text-[9px] font-black text-indigo-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                 <span>⬇</span> EXPORT MP4
               </button>
             </>
           )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT: ASSETS */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">VISUAL ANCHORS</h3>
           
           {/* START FRAME */}
           <div className="space-y-2 flex-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                 <span>START FRAME</span>
                 {startImage && <button onClick={() => setStartImage(null)} className="text-rose-500 hover:text-white">CLEAR</button>}
              </label>
              <div 
                onClick={() => startInputRef.current?.click()}
                className={`w-full h-full min-h-[140px] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group flex flex-col items-center justify-center ${startImage ? 'border-emerald-500/50 bg-black' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-500'}`}
              >
                 {startImage ? (
                   <img src={startImage} className="w-full h-full object-contain" alt="Start" />
                 ) : (
                   <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-2xl block mb-2">🎬</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">UPLOAD SOURCE</span>
                   </div>
                 )}
                 <input type="file" ref={startInputRef} onChange={(e) => handleImageUpload(e, 'START')} className="hidden" accept="image/*" />
              </div>
           </div>

           {/* END FRAME */}
           <div className="space-y-2 flex-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                 <span>END FRAME (OPTIONAL)</span>
                 {endImage && <button onClick={() => setEndImage(null)} className="text-rose-500 hover:text-white">CLEAR</button>}
              </label>
              <div 
                onClick={() => endInputRef.current?.click()}
                className={`w-full h-full min-h-[140px] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group flex flex-col items-center justify-center ${endImage ? 'border-indigo-500/50 bg-black' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-500'}`}
              >
                 {endImage ? (
                   <img src={endImage} className="w-full h-full object-contain" alt="End" />
                 ) : (
                   <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-2xl block mb-2">🏁</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">TARGET END</span>
                   </div>
                 )}
                 <input type="file" ref={endInputRef} onChange={(e) => handleImageUpload(e, 'END')} className="hidden" accept="image/*" />
              </div>
           </div>
        </div>

        {/* CENTER: VIEWPORT */}
        <div className="lg:col-span-6 flex flex-col">
           <div className={`flex-1 bg-black border border-slate-800 rounded-[32px] overflow-hidden relative shadow-2xl flex items-center justify-center group ${config.aspectRatio === '9:16' ? 'max-w-sm mx-auto w-full' : 'w-full'}`}>
              
              {/* Overlay UI */}
              <div className="absolute top-6 left-6 z-20 flex gap-3">
                 <div className={`px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                    {isGenerating ? 'RENDERING' : 'STANDBY'}
                 </div>
                 {videoUrl && <div className="px-3 py-1 rounded-full bg-emerald-600/80 backdrop-blur text-[8px] font-black uppercase tracking-widest text-white">READY</div>}
              </div>

              {isGenerating ? (
                 <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative w-24 h-24">
                       <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                       <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">GENERATING PIXELS...</p>
                       <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">VEO 3.1 ENGINE</p>
                    </div>
                 </div>
              ) : videoUrl ? (
                 <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                 <div className="text-center opacity-30 select-none">
                    <span className="text-6xl block mb-4 grayscale">🎥</span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">CINEMA VIEWPORT</p>
                 </div>
              )}
           </div>

           {/* History Strip */}
           <div className="h-24 mt-4 flex gap-4 overflow-x-auto custom-scrollbar pb-2">
              {history.map((h, i) => (
                <div key={i} onClick={() => setVideoUrl(h.url)} className="h-full aspect-video bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-emerald-500 transition-all shrink-0 relative group">
                   <video src={h.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                   <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[6px] text-white truncate">{h.prompt}</div>
                </div>
              ))}
           </div>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="lg:col-span-3 bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl flex flex-col gap-6">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">DIRECTOR'S CONSOLE</h3>
           
           {/* Prompt */}
           <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SCENE PROMPT</label>
                 <button onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt} className="text-[8px] font-black text-indigo-400 hover:text-white uppercase tracking-widest flex items-center gap-1">
                    {isEnhancing ? 'MAGIC...' : '✨ ENHANCE'}
                 </button>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-[#020617] border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 resize-none shadow-inner leading-relaxed custom-scrollbar"
                placeholder="Describe the scene motion, lighting, and camera movement..."
              />
           </div>

           {/* Settings Grid */}
           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                 <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ASPECT RATIO</label>
                 <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    {['16:9', '9:16'].map(ar => (
                      <button 
                        key={ar}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ar as any }))}
                        className={`flex-1 py-2 text-[8px] font-black rounded-md transition-all ${config.aspectRatio === ar ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {ar}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">RESOLUTION</label>
                 <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    {['720p', '1080p'].map(res => (
                      <button 
                        key={res}
                        onClick={() => setConfig(prev => ({ ...prev, resolution: res as any }))}
                        className={`flex-1 py-2 text-[8px] font-black rounded-md transition-all ${config.resolution === res ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {res}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Model Select */}
           <div className="space-y-1">
              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">VEO MODEL</label>
              <select 
                value={config.modelStr}
                onChange={(e) => setConfig(prev => ({ ...prev, modelStr: e.target.value as any }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-[9px] font-black text-white focus:outline-none focus:border-emerald-500 uppercase"
              >
                 <option value="veo-3.1-fast-generate-preview">VEO FAST (SPEED)</option>
                 <option value="veo-3.1-generate-preview">VEO PRO (QUALITY)</option>
              </select>
           </div>

           <div className="mt-auto pt-4 border-t border-slate-800">
              <button 
                onClick={handleForge}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800 flex items-center justify-center gap-2"
              >
                {isGenerating ? <span className="animate-spin text-lg">⟳</span> : <span className="text-lg">⚡</span>}
                {isGenerating ? 'RENDERING...' : 'GENERATE'}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
