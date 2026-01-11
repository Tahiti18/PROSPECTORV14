import React, { useState } from 'react';
import { Lead } from '../../types';
import { openRouterChat } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

interface VoiceStratProps {
  lead?: Lead;
}

export const VoiceStrat: React.FC<VoiceStratProps> = ({ lead }) => {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [strategyInput, setStrategyInput] = useState("");

  const handleConsult = async () => {
    if (!strategyInput.trim()) return;
    setLogs(prev => [...prev, "CONSULTING OPENROUTER_FLASH_CORE..."]);
    setIsActive(true);
    
    try {
      const response = await openRouterChat(
        `Lead: ${lead?.businessName}. Problem: ${strategyInput}. provide high-ticket sales coaching.`,
        "You are an AI Sales Strategist. Provide sharp, tactical advice."
      );
      setLogs(prev => [...prev, `STRAT: ${response}`]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsActive(false);
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Required</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">SALES <span className="text-emerald-600 not-italic">COACH</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">OpenRouter Secured Reasoning Node</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl flex flex-col items-center space-y-10 relative overflow-hidden">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
         
         <div className="w-full space-y-4 relative z-10">
            <textarea 
              value={strategyInput}
              onChange={(e) => setStrategyInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-white placeholder-slate-600"
              placeholder="Describe the current sales obstacle..."
            />
            <button 
               onClick={handleConsult}
               disabled={isActive}
               className="w-full py-4 bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
               {isActive ? 'INFERENCE ACTIVE...' : 'ENGAGE STRATEGIST'}
            </button>
         </div>

         <div className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-6 font-mono text-[10px] h-64 overflow-y-auto custom-scrollbar relative z-10">
            {logs.map((log, i) => <div key={i} className="text-emerald-500 opacity-60 mb-2">[{new Date().toLocaleTimeString()}] {log}</div>)}
            {logs.length === 0 && <div className="text-slate-700 italic uppercase">READY FOR INFERENCE...</div>}
         </div>
      </div>
    </div>
  );
};
