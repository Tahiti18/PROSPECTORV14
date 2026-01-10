import React, { useState } from 'react';
import { Lead } from '../../types';
import { analyzeVideoUrl } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface CinemaIntelProps {
  lead?: Lead;
}

export const CinemaIntel: React.FC<CinemaIntelProps> = ({ lead }) => {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('Provide a psychological breakdown of the speaker and key conversion hooks.');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsLoading(true);
    try {
      const result = await analyzeVideoUrl(url, prompt, lead?.id);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
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
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-12 shadow-2xl space-y-10">
              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">1. VIDEO SOURCE (URL)</h3>
                 <input 
                   value={url}
                   onChange={(e) => setUrl(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-[24px] px-8 py-6 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                   placeholder="Paste YouTube or Vimeo Link..."
                 />
              </div>

              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">2. INTELLIGENCE MISSION</h3>
                 <textarea 
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-300 h-40 resize-none placeholder-slate-600 italic focus:outline-none focus:border-emerald-500 transition-colors shadow-inner leading-relaxed"
                 />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isLoading || !url}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-emerald-600/20 border-b-4 border-emerald-700"
              >
                {isLoading ? 'DECODING STREAM...' : 'ANALYZE VIDEO'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[64px] h-full min-h-[700px] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="p-12 border-b border-slate-800/40 flex items-center gap-6">
                 <div className="w-14 h-14 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl text-white">🎬</span>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">INTELLIGENCE OUTPUT</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">MULTI-MODAL TEMPORAL DECODING</p>
                 </div>
              </div>

              <div className="flex-1 p-16 relative overflow-y-auto custom-scrollbar">
                 {isLoading ? (
                   <div className="h-full flex flex-col items-center justify-center space-y-6">
                      <div className="w-16 h-16 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">SEARCHING VIDEO METADATA...</p>
                   </div>
                 ) : analysis ? (
                    <FormattedOutput content={analysis} />
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-20">
                      <h4 className="text-4xl font-black italic text-white uppercase tracking-tighter">STREAM OFFLINE</h4>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};