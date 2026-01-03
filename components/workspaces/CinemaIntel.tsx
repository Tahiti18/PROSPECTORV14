
import React from 'react';
import { Lead } from '../../types';

interface CinemaIntelProps {
  lead?: Lead;
}

export const CinemaIntel: React.FC<CinemaIntelProps> = ({ lead }) => {
  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="text-rose-500 uppercase">CINEMA</span> INTEL HUB
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Deep-layer video understanding. Extract summaries, hooks, and timestamps instantly.
          </p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 px-6 py-2.5 rounded-full flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
           <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">TEMPORAL ANALYSIS NODE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-10">
           <div className="bg-white border border-slate-200 rounded-[56px] p-12 shadow-2xl space-y-10">
              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">1. VIDEO SOURCE PLATE</h3>
                 <div className="border-2 border-dashed border-slate-100 rounded-[40px] aspect-video flex flex-col items-center justify-center group hover:border-rose-400/40 transition-all cursor-pointer">
                    <svg className="w-12 h-12 text-slate-100 group-hover:text-rose-400/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2"/></svg>
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mt-6 group-hover:text-slate-400 transition-colors">DROP MP4/WEBM SOURCE</p>
                    <p className="text-[8px] font-black text-slate-200 uppercase tracking-widest mt-2 opacity-50">MAX 20MB FOR QUICK ANALYSIS</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">2. INTELLIGENCE MISSION</h3>
                 <textarea 
                   className="w-full bg-slate-50 border-none rounded-3xl p-8 text-sm font-medium text-slate-700 h-40 resize-none placeholder-slate-300 italic focus:ring-1 focus:ring-rose-500/20"
                   placeholder="What deep insights should I extract from this cinema plate?..."
                 />
              </div>
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[64px] h-full min-h-[700px] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="p-12 border-b border-slate-800/40 flex items-center gap-6">
                 <div className="w-14 h-14 bg-rose-600 rounded-3xl flex items-center justify-center shadow-xl">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" strokeWidth="2.5"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5"/></svg>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">INTELLIGENCE OUTPUT</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">MULTI-MODAL TEMPORAL DECODING</p>
                 </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-10 grayscale scale-110">
                 <svg className="w-24 h-24 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2"/></svg>
                 <h4 className="text-4xl font-black italic text-white uppercase tracking-tighter mt-10">CINEMA STREAM IDLE</h4>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-sm mt-4 leading-relaxed">
                   UPLOAD A VIDEO AND CHOOSE A MISSION PRESET TO ENGAGE THE DEEP-LAYER TEMPORAL ANALYST.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
