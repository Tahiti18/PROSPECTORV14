
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { simulateSandbox } from '../../services/geminiService';

interface DemoSandboxProps {
  lead?: Lead;
}

export const DemoSandbox: React.FC<DemoSandboxProps> = ({ lead }) => {
  const [ltv, setLtv] = useState(5000);
  const [volume, setVolume] = useState(50);
  const [simulation, setSimulation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async () => {
    if (!lead) return;
    setIsLoading(true);
    try {
      const result = await simulateSandbox(lead, ltv, volume);
      setSimulation(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Required for Sandbox Simulation</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">DEMO <span className="text-emerald-600 not-italic">SANDBOX</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Predictive Growth Modeling for {lead.businessName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-10 space-y-10 shadow-2xl">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current LTV ($)</label>
               <input 
                type="number"
                value={ltv}
                onChange={(e) => setLtv(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
               />
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Lead Volume</label>
               <input 
                type="number"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
               />
            </div>
            <button 
              onClick={handleSimulate}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border border-emerald-400/20"
            >
              {isLoading ? 'SIMULATING...' : 'INITIATE SIMULATION'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#05091a] border border-slate-800 rounded-[48px] p-16 min-h-[600px] relative overflow-hidden shadow-2xl">
           {isLoading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                <div className="w-1.5 h-16 bg-emerald-500/20 rounded-full relative overflow-hidden mx-auto">
                   <div className="absolute inset-0 bg-emerald-500 animate-[progress_2s_infinite]"></div>
                </div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse italic">Crunshing Market Variance Probabilities...</p>
             </div>
           ) : simulation ? (
             <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap font-sans font-medium">
                  {simulation}
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-center">
                <span className="text-6xl mb-4">🏖️</span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Define Parameters to Start Sandbox Simulation</p>
             </div>
           )}
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
};
