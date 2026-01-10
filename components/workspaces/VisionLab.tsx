import React, { useState, useRef } from 'react';
import { Lead } from '../../types';
import { analyzeVisual } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface VisionLabProps {
  lead?: Lead;
}

export const VisionLab: React.FC<VisionLabProps> = ({ lead }) => {
  const [prompt, setPrompt] = useState('Extract all financial data, sentiment, and design patterns from this image.');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const base64 = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const result = await analyzeVisual(base64, mimeType, prompt);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      alert("Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
            <span className="text-emerald-500">VISION</span> INTEL LAB
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Extract, translate, and analyze business intelligence from static visual plates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-10">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-12 shadow-2xl space-y-10">
              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">1. INTELLIGENCE PLATE</h3>
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-[40px] aspect-video flex flex-col items-center justify-center group hover:border-emerald-500/40 transition-all cursor-pointer overflow-hidden relative"
                 >
                    {image ? (
                      <img src={image} className="w-full h-full object-cover" alt="Upload" />
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-slate-600 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-6 group-hover:text-emerald-400 transition-colors">CLICK TO UPLOAD</p>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">2. MISSION OBJECTIVE</h3>
                 <textarea 
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 h-40 resize-none placeholder-slate-600 italic focus:outline-none focus:border-emerald-500/50"
                 />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isLoading || !image}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-emerald-600/20"
              >
                {isLoading ? 'ANALYZING NEURAL PLATE...' : 'EXECUTE VISION PROTOCOL'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[64px] h-full min-h-[700px] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="p-12 border-b border-slate-800/50 flex items-center gap-6">
                 <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl">👁️</span>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">INTELLIGENCE OUTPUT</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">GEMINI 2.5 FLASH VISION CORE</p>
                 </div>
              </div>

              <div className="flex-1 p-16 relative overflow-y-auto custom-scrollbar">
                 {isLoading ? (
                   <div className="h-full flex flex-col items-center justify-center space-y-6 animate-pulse">
                      <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DECODING PIXEL MATRIX...</p>
                   </div>
                 ) : analysis ? (
                   <FormattedOutput content={analysis} />
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-20">
                      <h4 className="text-4xl font-black italic text-slate-700 uppercase tracking-tighter">OPTIC SENSOR IDLE</h4>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
