import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../../types';
import { generateVideoPayload, enhanceVideoPrompt, VeoConfig, subscribeToAssets, AssetRecord, saveAsset } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

interface VideoPitchProps {
  lead?: Lead;
}

export const VideoPitch: React.FC<VideoPitchProps> = ({ lead }) => {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  
  const [config, setConfig] = useState<VeoConfig>({
    aspectRatio: '16:9',
    resolution: '720p'
  });

  const [startImage, setStartImage] = useState<string | null>(null);
  const startInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lead) {
      setPrompt(`Cinematic high-end commercial for ${lead.businessName} in ${lead.city}. Visual style: Luxury AI Transformation.`);
    }
  }, [lead]);

  // Polling logic for KIE TaskId
  useEffect(() => {
    if (!taskId) return;

    let attempts = 0;
    const interval = setInterval(async () => {
        attempts++;
        try {
            const res = await fetch(`/api/kie/record-info?taskId=${taskId}`);
            const data = await res.json();
            const currentStatus = data?.data?.status || data?.status;
            setStatus(currentStatus || 'Processing...');

            if (currentStatus === 'completed' || currentStatus === 'success') {
                clearInterval(interval);
                const url = data?.data?.video_url || data?.video_url;
                if (url) {
                    setVideoUrl(url);
                    saveAsset('VIDEO', `VEO: ${prompt.slice(0, 20)}`, url, 'VIDEO_PITCH', lead?.id);
                    toast.success("VEO FORGE COMPLETE");
                }
                setIsGenerating(false);
            } else if (currentStatus === 'failed') {
                clearInterval(interval);
                toast.error("VEO FORGE FAILED AT PROVIDER");
                setIsGenerating(false);
            }
        } catch (e) {
            console.error("Poll error", e);
        }

        if (attempts > 60) { // 5 minute timeout
            clearInterval(interval);
            setIsGenerating(false);
            toast.error("VEO FORGE TIMED OUT");
        }
    }, 5000);

    return () => clearInterval(interval);
  }, [taskId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setStartImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleForge = async () => {
    setIsGenerating(true);
    setVideoUrl(null);
    try {
      const id = await generateVideoPayload(prompt, lead?.id, startImage || undefined, undefined, config);
      setTaskId(id);
      setStatus('Queued...');
    } catch (e) {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-700">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">VEO <span className="text-emerald-500">STUDIO</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">High-Resolution Cinematic Synthesis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">START FRAME (AI REFERENCE)</label>
                 <div onClick={() => startInputRef.current?.click()} className={`h-40 rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden ${startImage ? 'border-emerald-500/50 bg-black' : 'border-slate-800 bg-slate-950 hover:border-emerald-500/30'}`}>
                    {startImage ? <img src={startImage} className="w-full h-full object-cover" /> : <span className="text-3xl opacity-20">📷</span>}
                    <input type="file" ref={startInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CINEMATIC DIRECTIVE</label>
                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-40 bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm text-white focus:border-emerald-500 outline-none resize-none italic"
                    placeholder="Describe movement, lighting, and camera angle..."
                 />
              </div>
              <button 
                onClick={handleForge}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-[28px] text-[12px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? `STATUS: ${status.toUpperCase()}` : 'INITIATE VIDEO FORGE'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[600px] flex items-center justify-center overflow-hidden relative shadow-2xl">
              {isGenerating ? (
                 <div className="flex flex-col items-center justify-center space-y-8">
                    <div className="w-20 h-20 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="text-center">
                        <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">SYNTHESIZING VEO MATRIX</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2">TASK_ID: {taskId}</p>
                    </div>
                 </div>
              ) : videoUrl ? (
                 <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                 <div className="text-center opacity-10"><span className="text-9xl">🎬</span></div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};