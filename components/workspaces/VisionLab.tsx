
import React from 'react';
import { Lead } from '../../types';

interface VisionLabProps {
  lead?: Lead;
}

export const VisionLab: React.FC<VisionLabProps> = ({ lead }) => {
  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="text-amber-500">VISION</span> INTEL LAB
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Extract, translate, and analyze business intelligence from static visual plates.
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-2.5 rounded-full flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
           <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">MULTI-MODAL CORE ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-10">
           <div className="bg-white border border-slate-200 rounded-[56px] p-12 shadow-2xl space-y-10">
              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">1. INTELLIGENCE PLATE (IMAGE)</h3>
                 <div className="border-2 border-dashed border-slate-100 rounded-[40px] aspect-video flex flex-col items-center justify-center group hover:border-amber-400/40 transition-all cursor-pointer">
                    <svg className="w-12 h-12 text-slate-100 group-hover:text-amber-400/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg>
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mt-6 group-hover:text-slate-400 transition-colors">DROP RECEIPT, MENU, OR CHART</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">2. MISSION OBJECTIVE</h3>
                 <textarea 
                   className="w-full bg-slate-50 border-none rounded-3xl p-8 text-sm font-medium text-slate-700 h-40 resize-none placeholder-slate-300 italic focus:ring-1 focus:ring-amber-500/20"
                   placeholder="What should I extract or analyze from this image?..."
                 />
              </div>
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-white border border-slate-200 rounded-[64px] h-full min-h-[700px] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="p-12 border-b border-slate-50 flex items-center gap-6">
                 <div className="w-14 h-14 bg-black rounded-3xl flex items-center justify-center shadow-xl">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5"/></svg>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic text-black uppercase tracking-tighter">INTELLIGENCE OUTPUT</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">GROUNDED VISUAL REASONING</p>
                 </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-10 grayscale scale-110">
                 <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>
                 <h4 className="text-4xl font-black italic text-black uppercase tracking-tighter mt-10">NEURAL OPTIC FEED OFFLINE</h4>
                 <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em] max-w-sm mt-4 leading-relaxed">
                   UPLOAD A VISUAL ASSET AND PROVIDE MISSION PARAMETERS TO BEGIN REAL-TIME NEURAL DECODING.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
