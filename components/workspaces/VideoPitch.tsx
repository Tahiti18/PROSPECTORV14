
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
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  const handleForge = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      await checkAndOpenKey();
      const url = await generateVideoPayload(prompt, lead?.id);
      setVideoUrl(url);
      // Asset saved internally by generateVideoPayload with leadId
    } catch (e) {
      console.error(e);
      alert("Video generation requires a paid API key and valid permissions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const SUGGESTIONS = [
    {
      category: "CINEMATIC & LUXURY",
      prompts: [
        "Cinematic drone shot flying over a futuristic glass mansion on a cliff edge at sunset, 4k, highly detailed.",
        "Close-up macro shot of a diamond rotating in a void with refractive light dispersion, luxury aesthetic.",
        "Slow motion footage of a vintage 1960s sports car driving along a coastal highway, golden hour.",
        "A sleek, modern architectural interior with floor-to-ceiling windows overlooking a cyber-city at night.",
        "Liquid gold pouring over a matte black surface, forming abstract shapes, high contrast."
      ]
    },
    {
      category: "HIGH-TECH & AI",
      prompts: [
        "Abstract data visualization of a neural network glowing blue and purple in a dark void.",
        "A futuristic holographic interface floating in mid-air, displaying complex financial charts and graphs.",
        "Cybernetic eye opening to reveal digital code streaming within the iris, 8k resolution.",
        "Server room with infinite rows of blinking lights, camera dolly zoom, matrix green color palette.",
        "Nanobots assembling a complex mechanical structure, macro photography style."
      ]
    },
    {
      category: "SOCIAL & VIRAL",
      prompts: [
        "Fast-paced POV shot of running through a neon-lit Tokyo street at night, motion blur.",
        "A satisfying loop of colorful kinetic sand being sliced by a knife, ASMR visual.",
        "Stop-motion animation of office supplies rearranging themselves into a robot.",
        "A cute robot mascot dancing on a desk, Pixar style animation.",
        "Time-lapse of a busy city intersection turning from day to night in 5 seconds."
      ]
    },
    {
      category: "CORPORATE & BIZ",
      prompts: [
        "Diverse team of professionals brainstorming at a glass whiteboard in a sunlit office.",
        "Handshake between two executives in slow motion with a lens flare background.",
        "Low-angle shot of skyscrapers with clouds moving fast, symbolizing growth and stability.",
        "A modern clean desk setup with a laptop, coffee, and plant, soft natural lighting.",
        "Typing on a backlit mechanical keyboard, close-up with shallow depth of field."
      ]
    },
    {
      category: "ATMOSPHERIC & TEXTURE",
      prompts: [
        "Heavy rain falling on a window pane with blurred city lights in the background, lo-fi vibe.",
        "Thick fog rolling over a dark forest, moody and cinematic.",
        "Ink swirling in water, slow motion, 4k, vibrant colors.",
        "Fire crackling in a fireplace, cozy atmosphere, close-up.",
        "Stars rotating in the night sky, time-lapse astrophotography."
      ]
    }
  ];

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

      <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-200">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/50 pb-4">
          <span className="text-lg">💡</span> Neural Directives (Click to Apply)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {SUGGESTIONS.map((cat, i) => (
             <div key={i} className="space-y-4">
                <h4 className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">{cat.category}</h4>
                <div className="space-y-2">
                  {cat.prompts.map((p, j) => (
                    <button 
                      key={j}
                      onClick={() => setPrompt(p)}
                      className="w-full text-left p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900 transition-all text-[9px] text-slate-400 hover:text-slate-200 font-bold leading-relaxed line-clamp-3 hover:line-clamp-none active:scale-95"
                      title={p}
                    >
                      {p}
                    </button>
                  ))}
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};
