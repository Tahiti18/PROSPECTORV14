import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { analyzeVideoUrl, enhanceStrategicPrompt } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';
import { Tooltip } from '../Tooltip';
import { toast } from '../../services/toastManager';

interface CinemaIntelProps {
  lead?: Lead;
}

interface Mission {
  id: string;
  label: string;
  desc: string;
  prompt: string;
}

const MISSIONS: Mission[] = [
  // --- STANDARD SUITE ---
  { 
    id: 'EXEC_DECON', 
    label: 'EXECUTIVE DECONSTRUCTION', 
    desc: 'Audit of monetization, core thesis, and audience intent. Ideal for competitive mapping.',
    prompt: 'Perform a high-level strategic deconstruction using the UI_BLOCKS format. Focus on the monetization model, core thesis, and target audience intent. Identify the underlying commercial objectives and market positioning. Structure the output with a section for BUSINESS_LOGIC and another for TARGET_PERSONA.'
  },
  { 
    id: 'TRANS_LEDGER', 
    label: 'TRANSCRIPT LEDGER', 
    desc: 'Literal extraction of key quotes, timestamps, and actionable takeaways for internal review.',
    prompt: 'Extract the definitive transcript ledger in UI_BLOCKS format. Isolate critical quotes with timestamps, summarize the core narrative arc, and list every specific actionable takeaway mentioned. Create a section titled TRANSCRIPT_EXTRACTS and another for ACTION_STEPS.'
  },
  { 
    id: 'RETENTION_AUDIT', 
    label: 'RETENTION AUDIT', 
    desc: 'Analysis of pacing, visual transitions, and hook density vs industry benchmarks.',
    prompt: 'Conduct a retention audit in UI_BLOCKS format. Analyze the pacing, frequency of visual pattern interrupts, and "hook" density. Benchmark the content against top-tier 1% retention standards. Include a scorecard for PACING and VISUAL_ENGAGEMENT.'
  },
  // --- AGENCY SUITE ---
  { 
    id: 'PSYCH_PROF', 
    label: 'PSYCHOLOGICAL PROFILE', 
    desc: 'Analyzes authority markers, relatability vs. dominance, and trust-building mechanics.',
    prompt: 'Provide a deep psychological breakdown in UI_BLOCKS format. Analyze authority markers, relatability vs. dominance, and trust-building mechanics used to influence the viewer. Create sections for AUTHORITY_MARKERS and INFLUENCE_ENGINEERING.'
  },
  { 
    id: 'HOOK_ANATOMY', 
    label: 'SALES HOOK ANATOMY', 
    desc: 'Isolation of specific claims, objection handles, and CTA structures used in the content.',
    prompt: 'Deconstruct the sales anatomy in UI_BLOCKS format. Isolate every specific claim, objection handling technique, and call-to-action (CTA). Categorize hooks by emotional vs logical appeal in a section titled CONVERSION_GEOMETRY.'
  },
  { 
    id: 'KILL_CHAIN', 
    label: 'COMPETITIVE KILL-CHAIN', 
    desc: 'Identify logic gaps and weak arguments to exploit for a superior AI-driven pitch.',
    prompt: 'Identify logic gaps, weak arguments, or missed opportunities in UI_BLOCKS format. Provide a tactical blueprint for exploiting these vulnerabilities to pitch a superior, AI-driven solution. Include a section for LOGIC_GAPS and another for PITCH_LEVERAGE.'
  },
  // --- ADVANCED SUITE ---
  { 
    id: 'SWARM_BLUEPRINT', 
    label: 'CONTENT SWARM BLUEPRINT', 
    desc: '30-day repurposing plan: specific LinkedIn posts, X threads, and Reel scripts.',
    prompt: 'Architect a 30-day content swarm blueprint in UI_BLOCKS format. Generate 5 specific LinkedIn strategic posts, 10 Tweet threads, and 3 short-form Reel scripts based on key timestamps. Group these under REPURPOSING_VECTORS.'
  },
  { 
    id: 'VIBE_DNA', 
    label: 'AESTHETIC / VIBE DNA', 
    desc: 'Creative director audit of set design, lighting, wardrobe, and audio quality status.',
    prompt: 'Perform a creative director audit in UI_BLOCKS format. Evaluate set design, lighting, wardrobe, and audio fidelity to benchmark "Production Value Status". Use sections for VISUAL_DNA and SONIC_IDENTITY.'
  },
  { 
    id: 'HORMOZI_FILTER', 
    label: 'THE "HORMOZI" FILTER', 
    desc: 'Analyzes value-to-noise ratio and "Edutainment" quality for high-ticket conversion.',
    prompt: 'Analyze content through the lens of high-retention Edutainment in UI_BLOCKS format. Calculate the value-to-noise ratio and determine if information density is optimized for high-ticket acquisition. Include a scorecard for VALUE_DENSITY.'
  }
];

export const CinemaIntel: React.FC<CinemaIntelProps> = ({ lead }) => {
  const [url, setUrl] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState(MISSIONS[3].id); 
  const [prompt, setPrompt] = useState(MISSIONS[3].prompt);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const selectedMission = MISSIONS.find(m => m.id === selectedMissionId) || MISSIONS[3];

  const handleMissionChange = (id: string) => {
    const mission = MISSIONS.find(m => m.id === id);
    if (mission) {
      setSelectedMissionId(id);
      setPrompt(mission.prompt);
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceStrategicPrompt(prompt);
      // Ensure the structural directive remains
      const finalizedPrompt = enhanced.includes('UI_BLOCKS') ? enhanced : `${enhanced} Ensure the final response follows the UI_BLOCKS format strictly.`;
      setPrompt(finalizedPrompt);
      toast.neural("NEURAL DIRECTIVE OPTIMIZED: FIDELITY INCREASED");
    } catch (e) {
      console.error(e);
      toast.error("NEURAL ENHANCE FAILED");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!url) {
      toast.error("Please provide a valid video URL.");
      return;
    }
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeVideoUrl(url, prompt, lead?.id);
      if (result) {
        setAnalysis(result);
      } else {
        throw new Error("Empty response from temporal core.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`ANALYSIS FAILED: ${e.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
            <span className="text-emerald-500">CINEMA</span> INTEL HUB
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Deep-layer video understanding via Search Grounding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-10">
           {/* Dark Mode Input Panel */}
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-10 shadow-2xl space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[60px] rounded-full pointer-events-none"></div>
              
              <div className="space-y-6 relative z-10">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">1. VIDEO SOURCE (URL)</h3>
                 <input 
                   value={url}
                   onChange={(e) => setUrl(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-[24px] px-8 py-6 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                   placeholder="Paste YouTube or Vimeo Link..."
                 />
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">2. MISSION PROTOCOL</h3>
                    <Tooltip content={selectedMission.desc} side="left">
                        <div className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-500 text-[10px] cursor-help hover:bg-emerald-500 hover:text-black transition-colors">?</div>
                    </Tooltip>
                 </div>
                 <div className="relative">
                    <select 
                        value={selectedMissionId}
                        onChange={(e) => handleMissionChange(e.target.value)}
                        className="w-full bg-[#020617] border border-slate-800 rounded-[24px] px-8 py-6 text-xs font-black text-emerald-400 uppercase tracking-widest appearance-none focus:outline-none focus:border-emerald-500 transition-colors shadow-inner cursor-pointer"
                    >
                        {MISSIONS.map(m => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3"/></svg>
                    </div>
                 </div>
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">3. NEURAL DIRECTIVE</h3>
                    <button 
                      onClick={handleEnhance}
                      disabled={isEnhancing || !prompt}
                      className="flex items-center gap-2 text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors disabled:opacity-30 group"
                    >
                      {isEnhancing ? <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : <span className="group-hover:animate-pulse">✨</span>}
                      NEURAL ENHANCE
                    </button>
                 </div>
                 <textarea 
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-[32px] p-8 text-sm font-medium text-slate-300 h-48 resize-none placeholder-slate-700 italic focus:outline-none focus:border-emerald-500 transition-colors shadow-inner leading-relaxed custom-scrollbar"
                   placeholder="Refine the intelligence mission parameters..."
                 />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isLoading || !url}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-emerald-600/20 border-b-4 border-emerald-800"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    DECODING STREAM...
                  </>
                ) : (
                  <>
                    <span className="text-xl">🎬</span>
                    ANALYZE VIDEO
                  </>
                )}
              </button>
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[64px] h-full min-h-[700px] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="p-12 border-b border-slate-800/40 flex items-center gap-6">
                 <div className="w-14 h-14 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl text-white">📡</span>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">INTELLIGENCE OUTPUT</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">MULTI-MODAL TEMPORAL DECODING</p>
                 </div>
              </div>

              <div className="flex-1 p-16 relative overflow-y-auto custom-scrollbar bg-[#020617]/50">
                 {isLoading ? (
                   <div className="h-full flex flex-col items-center justify-center space-y-12">
                      <div className="relative w-24 h-24">
                         <div className="absolute inset-0 border-4 border-emerald-900/30 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                         <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🎬</div>
                      </div>
                      <div className="text-center space-y-4">
                        <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.6em] animate-pulse">SCANNING VIDEO VECTORS...</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Target Protocol: {selectedMission.label}</p>
                      </div>
                   </div>
                 ) : analysis ? (
                    <FormattedOutput content={analysis} />
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-20 select-none">
                      <h4 className="text-5xl font-black italic text-white uppercase tracking-tighter">STREAM OFFLINE</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-6 italic">ESTABLISH UPLINK TO BEGIN TEMPORAL DECODING</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};