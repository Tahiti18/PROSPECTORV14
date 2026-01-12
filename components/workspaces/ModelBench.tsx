
import React, { useState } from 'react';
import { testModelPerformance } from '../../services/geminiService';

export const ModelBench: React.FC = () => {
  const [prompt, setPrompt] = useState('Write a high-end ad headline for a luxury villa.');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    setIsLoading(true);
    try {
      const result = await testModelPerformance(model, prompt);
      setResponse(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">MODEL <span className="text-emerald-600 not-italic">BENCH</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Performance Benchmark Playground</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-2xl">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Engine</label>
               <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-slate-300 focus:outline-none focus:border-emerald-500 uppercase tracking-widest"
               >
                 <option value="gemini-3-flash-preview">GEMINI 3 FLASH</option>
                 <option value="gemini-2.5-flash-image">GEMINI 2.5 FLASH IMAGE</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Test Directive</label>
               <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-emerald-500 h-48 resize-none shadow-xl italic"
               />
            </div>
            <button 
              onClick={handleRun}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border border-emerald-400/20"
            >
              {isLoading ? 'EXECUTING...' : 'RUN TEST'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#05091a] border border-slate-800 rounded-[48px] p-12 min-h-[500px] relative overflow-hidden shadow-2xl">
           {isLoading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] animate-pulse">Request Routing via Neural Mesh...</p>
             </div>
           ) : response ? (
             <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap font-sans uppercase font-medium">
                  {response}
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-center">
                <span className="text-6xl mb-4">🧪</span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Ready for diagnostic link initiation</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
