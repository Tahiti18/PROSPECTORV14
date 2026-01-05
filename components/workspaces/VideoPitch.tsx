
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateVideoPayload, saveAsset } from '../../services/geminiService';

interface VideoPitchProps {
  lead?: Lead;
}

export const VideoPitch: React.FC<VideoPitchProps> = ({ lead }) => {
  const [prompt, setPrompt] = useState(lead ? `A sleek 4k cinematic intro for a high-end AI agency pitching to ${lead.businessName} in ${lead.city}. Show luxury office aesthetics and rapid data visualization.` : "");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const checkAndOpenKey = async () => {
    // Safeguard: Only run if window.aistudio exists (AI Studio Environment)
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

  const handleForge = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      await checkAndOpenKey();
      // Ensure we pass the lead ID for proper vault linking
      const url = await generateVideoPayload(prompt, lead?.id);
      setVideoUrl(url);
    } catch (e) {
      console.error(e);
      alert("Video generation failed. Ensure your API key is valid and has the Veo API enabled.");
    } finally {
      setIsGenerating(false);
    }
  };

  const SUGGESTIONS = [
    {
      category: "NANO CLIPS",
      prompts: [
        "A fast-paced 5-second loop of a futuristic neon city with glitched text overlay saying 'AI REVOLUTION'.",
        "Rapid zoom into a digital eye, transitioning to binary code rain.",
        "Quick montage of modern office workflow, high energy, blue and white color palette.",
        "Spinning 3D logo of a generic tech company with sparks flying, transparent background style.",
        "Time-lapse of a flower blooming instantly into a robotic structure."
      ]
    },
    {
      category: "VIRAL HOOKS",
      prompts: [
        "POV shot of someone holding a smartphone that projects a hologram, shocking reaction.",
        "Split screen comparison: Old boring office vs. New AI-powered futuristic office.",
        "Text bubble popping up on screen saying 'STOP SCROLLING' with a glitch effect.",
        "A satisfying hydraulic press crushing a pile of paperwork, revealing a clean desk.",
        "A person snapping their fingers and the background instantly changes to a luxury villa."
      ]
    },
    {
      category: "HIGH-TECH & AI",
      prompts: [
        "Abstract data visualization of a neural network glowing blue and purple in a dark void.",
        "Cinematic drone shot flying through a server room where the servers are glowing crystal blocks.",
        "A robot hand shaking a human hand, highly detailed, realistic texture, 4k.",
        "A close up of a microchip with liquid gold flowing through the circuits.",
        "A futuristic dashboard interface floating in mid-air, being manipulated by invisible hands."
      ]
    }
  ];

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Required for Veo Video Forge</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-6xl font-black italic text-white uppercase tracking-tighter leading-none">
            VIDEO <span className="text-amber-500 not-italic">PITCH</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] mt-4 italic">Veo 3.1 Generative Video Core</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
           <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">VEO ENGINE ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-12 shadow-2xl space-y-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">DIRECTOR'S PROMPT</h3>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-[32px] p-8 text-sm font-bold text-slate-300 focus:outline-none focus:border-amber-500 h-64 resize-none shadow-xl placeholder-slate-700 italic leading-relaxed"
                placeholder="Describe the video asset (e.g. 'Cinematic drone shot of...')"
              />
            </div>
            
            <button 
              onClick={handleForge}
              disabled={isGenerating}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black py-6 rounded-[28px] text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-amber-500/20 active:scale-95 border-b-4 border-amber-600 disabled:opacity-50"
            >
              {isGenerating ? 'RENDERING VIDEO...' : 'GENERATE VEO ASSET'}
            </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-[40px] p-8 space-y-6">
             <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RAPID PROMPT LIBRARY</h4>
             <div className="space-y-3 h-64 overflow-y-auto custom-scrollbar pr-2">
                {SUGGESTIONS.map((cat, i) => (
                  <div key={i} className="space-y-2">
                     <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest sticky top-0 bg-slate-900/90 py-1">{cat.category}</p>
                     {cat.prompts.map((p, j) => (
                       <button 
                         key={j}
                         onClick={() => setPrompt(p)}
                         className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-amber-500/30 transition-all truncate"
                         title={p}
                       >
                         {p}
                       </button>
                     ))}
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-[#05091a] border border-slate-800 rounded-[84px] h-full min-h-[700px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group">
            
            {/* Background Ambient Effect */}
            <div className="absolute inset-0 bg-amber-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            {videoUrl ? (
              <div className="relative w-full h-full flex flex-col">
                 <div className="absolute top-8 right-8 z-20">
                    <span className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">1080P PREVIEW</span>
                 </div>
                 <video 
                   src={videoUrl} 
                   className="w-full h-full object-cover animate-in zoom-in-95 duration-1000" 
                   controls 
                   autoPlay 
                   loop 
                   muted
                 />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center text-center space-y-8 px-20 opacity-30">
                 <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center">
                    <svg className="w-16 h-16 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                 </div>
                 <h4 className="text-4xl font-black italic text-slate-700 uppercase tracking-tighter">VEO STANDBY</h4>
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] max-w-md leading-relaxed">
                   INPUT A DIRECTIVE TO INITIATE GENERATIVE VIDEO SYNTHESIS.
                 </p>
              </div>
            )}

            {isGenerating && (
               <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-8 z-30">
                  <div className="relative">
                     <div className="w-24 h-24 border-4 border-slate-800 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center space-y-2">
                     <p className="text-[12px] font-black text-amber-500 uppercase tracking-[0.4em] animate-pulse">VEO MODEL PROCESSING...</p>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ESTIMATED TIME: 30-60 SECONDS</p>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
