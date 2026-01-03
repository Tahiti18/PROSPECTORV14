
import React, { useState } from 'react';
import { Lead } from '../../types';
import { GoogleGenAI } from "@google/genai";

interface DeepLogicProps {
  lead?: Lead;
}

export const DeepLogic: React.FC<DeepLogicProps> = ({ lead }) => {
  const [intensity, setIntensity] = useState(16000);
  const [query, setQuery] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleEngage = async () => {
    if (!query.trim()) return;
    setIsThinking(true);
    setOutput(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: query,
        config: {
          thinkingConfig: { thinkingBudget: intensity }
        }
      });
      setOutput(response.text || "Reasoning sequence failed to materialize.");
    } catch (e) {
      console.error(e);
      setOutput("CRITICAL_NODE_FAILURE: Reasoning chain interrupted.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="text-amber-500">DEEP</span> REASONING LAB
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            System 2 high-intensity cognitive processing for the most complex agency missions.
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-2.5 rounded-full flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
             THINKING MODE: ACTIVE ({intensity.toLocaleString()} TOKENS)
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column - Parameters */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-12 shadow-2xl space-y-12 relative overflow-hidden">
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">THINKING INTENSITY</h3>
                   <span className="text-sm font-black italic text-amber-500 tracking-tighter">{intensity.toLocaleString()}</span>
                </div>
                <div className="relative pt-2">
                  <input 
                    type="range" 
                    min="0" max="32000" step="1000"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                     <span>TACTICAL</span>
                     <span>STRATEGIC</span>
                     <span>EXHAUSTIVE</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">MISSION PARAMETERS</h3>
                 <textarea 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 focus:outline-none focus:border-amber-500/50 h-56 resize-none shadow-inner placeholder-slate-800 italic leading-relaxed"
                  placeholder="Enter a highly complex strategic query..."
                 />
              </div>

              <div className="flex gap-4 pt-4">
                <button className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5"/></svg>
                </button>
                <button 
                  onClick={handleEngage}
                  disabled={isThinking}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-amber-500/20"
                >
                  <span className="text-xl">⚡</span>
                  ENGAGE DEEP THOUGHT
                </button>
              </div>
           </div>
        </div>

        {/* Right Column - Output */}
        <div className="lg:col-span-8">
           <div className="bg-white border border-slate-200 rounded-[56px] min-h-[700px] flex flex-col relative shadow-2xl overflow-hidden">
              <div className="p-10 border-b border-slate-100 flex items-center gap-6">
                 <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl">🧪</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-black italic text-black uppercase tracking-tighter">REASONING OUTPUT</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">HIGH-COMPUTE LOGICAL EXTRACTION</p>
                 </div>
              </div>

              <div className="flex-1 p-16 relative overflow-y-auto custom-scrollbar-light">
                 {isThinking ? (
                   <div className="h-full flex flex-col items-center justify-center space-y-8 animate-pulse">
                      <div className="w-20 h-1 bg-slate-100 rounded-full relative overflow-hidden">
                         <div className="absolute inset-0 bg-amber-500 animate-[loading_1.5s_infinite]"></div>
                      </div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">SYSTEM 2: COGNITIVE CHAINING...</p>
                   </div>
                 ) : output ? (
                   <div className="prose prose-slate max-w-none">
                      <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap font-sans">
                        {output}
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                      <div className="text-[120px] grayscale brightness-200 select-none">⚡</div>
                      <div className="space-y-2">
                        <h4 className="text-4xl font-black italic text-slate-800 uppercase tracking-tighter">COGNITIVE HUB IDLE</h4>
                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] max-w-xs mx-auto">
                          ACTIVATE THE REASONING BUDGET AND PROVIDE STRATEGIC PARAMETERS TO BEGIN MULTI-MODAL LOGICAL DECODING.
                        </p>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .custom-scrollbar-light::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};
