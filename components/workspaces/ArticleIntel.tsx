
import React, { useState } from 'react';
import { Lead } from '../../types';
import { synthesizeArticle } from '../../services/geminiService';

interface ArticleIntelProps {
  lead?: Lead;
}

export const ArticleIntel: React.FC<ArticleIntelProps> = ({ lead }) => {
  const [source, setSource] = useState(lead?.websiteUrl || '');
  const [output, setOutput] = useState<string | null>(null);
  const [mode, setMode] = useState('STRATEGY AUDIT');
  const [isLoading, setIsLoading] = useState(false);

  const handleSynthesize = async () => {
    if (!source) return;
    setIsLoading(true);
    try {
      const result = await synthesizeArticle(source, mode);
      setOutput(result);
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
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="text-amber-500">ARTICLE</span> INTEL HUB
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Hyper-speed content synthesis for competitive research and viral repurposing.
          </p>
        </div>
        <div className="flex gap-4">
           {['EXECUTIVE BRIEF', 'VIRAL HOOK PACK', 'STRATEGY AUDIT'].map((t, i) => (
             <button 
              key={i} 
              onClick={() => setMode(t)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${mode === t ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}>
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-10">
           <div className="bg-white border border-slate-200 rounded-[56px] p-12 shadow-2xl space-y-10">
              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">INPUT SOURCE (URL OR TEXT)</h3>
                 <textarea 
                   value={source}
                   onChange={(e) => setSource(e.target.value)}
                   className="w-full bg-slate-50 border-none rounded-3xl p-8 text-sm font-medium text-slate-700 h-64 resize-none placeholder-slate-300 italic focus:ring-1 focus:ring-amber-500/20"
                   placeholder="Paste article URL or raw text here..."
                 />
              </div>

              <button 
                onClick={handleSynthesize}
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-amber-500/20 border-b-4 border-amber-600"
              >
                <span className="text-xl">⚡</span>
                {isLoading ? 'SYNTHESIZING...' : 'EXTRACT INTELLIGENCE'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-white border border-slate-200 rounded-[64px] h-full min-h-[700px] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="p-12 border-b border-slate-50 flex items-center gap-6">
                 <div className="w-14 h-14 bg-amber-500 rounded-3xl flex items-center justify-center shadow-xl">
                    <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2.5"/></svg>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic text-black uppercase tracking-tighter">SYNTHESIS OUTPUT</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">MODE: {mode.split(' ')[0]}</p>
                 </div>
              </div>

              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar-light">
                 {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                       <div className="w-10 h-10 border-2 border-slate-100 border-t-amber-500 rounded-full animate-spin"></div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse italic">Crystallizing Insight Mesh...</p>
                    </div>
                 ) : output ? (
                    <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                       {output}
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-10 grayscale scale-110">
                       <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2"/></svg>
                       <h4 className="text-4xl font-black italic text-black uppercase tracking-tighter mt-10">INTEL HUB IDLE</h4>
                       <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em] max-w-sm mt-4 leading-relaxed">
                         INPUT AN ARTICLE URL OR TEXT TO TRIGGER HIGH-SPEED STRATEGIC SUMMARIZATION.
                       </p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
