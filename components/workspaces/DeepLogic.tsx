import React, { useState } from 'react';
import { Lead } from '../../types';
import { openRouterChat } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface DeepLogicProps {
  lead?: Lead;
}

export const DeepLogic: React.FC<DeepLogicProps> = ({ lead }) => {
  const [query, setQuery] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleEngage = async () => {
    if (!query.trim()) return;
    setIsThinking(true);
    setOutput(null);

    try {
      const context = lead ? `Context: Business ${lead.businessName}, Niche ${lead.niche}. ` : '';
      const response = await openRouterChat(`${context}\n\nTask: ${query}`);
      setOutput(response || "Reasoning sequence empty.");
    } catch (e: any) {
      setOutput(`ERROR: ${e.message}`);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
            <span className="text-emerald-500">DEEP</span> REASONING LAB
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            System 2 analysis optimized for OpenRouter Flash.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-12 shadow-2xl space-y-12">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">MISSION PARAMETERS</h3>
                 <textarea 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500 h-56 resize-none italic"
                  placeholder="Enter strategic query..."
                 />
              </div>
              <button 
                onClick={handleEngage}
                disabled={isThinking}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-emerald-600/20"
              >
                {isThinking ? 'PROCESSING...' : 'ENGAGE FLASH CORE'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[700px] flex flex-col relative shadow-2xl overflow-hidden">
              <div className="flex-1 p-16 relative overflow-y-auto custom-scrollbar">
                 {isThinking ? (
                    <div className="h-full flex flex-col items-center justify-center animate-pulse">
                       <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                 ) : output ? (
                    <FormattedOutput content={output} />
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                      <h4 className="text-4xl font-black italic text-slate-500 uppercase tracking-tighter">STANDBY</h4>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
