
import React, { useState } from 'react';
import { Lead } from '../../types';
import { openRouterChat } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface StrategicReasoningProps {
  lead?: Lead;
}

export const StrategicReasoning: React.FC<StrategicReasoningProps> = ({ lead }) => {
  const [query, setQuery] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleEngage = async () => {
    if (!query.trim()) return;
    setIsThinking(true);
    try {
      const context = lead ? `Context: Client ${lead.businessName}. ` : '';
      const response = await openRouterChat(`${context}Task: ${query}`);
      setOutput(response);
    } catch (e: any) {
      setOutput(`ERROR: ${e.message}`);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <h1 className="text-4xl font-bold uppercase tracking-tight text-white"><span className="text-emerald-500">STRATEGIC</span> REASONING</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-12 shadow-2xl space-y-12">
              <textarea value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 h-56 resize-none" placeholder="Enter objective..." />
              <button onClick={handleEngage} disabled={isThinking} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] active:scale-95 shadow-xl">
                {isThinking ? 'PROCESSING...' : 'ENGAGE ENGINE'}
              </button>
           </div>
        </div>
        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[700px] flex flex-col relative shadow-2xl p-16">
              {isThinking ? <div className="animate-pulse">Reasoning...</div> : output ? <FormattedOutput content={output} /> : <div className="opacity-10 text-9xl font-black italic">IDLE</div>}
           </div>
        </div>
      </div>
    </div>
  );
};
