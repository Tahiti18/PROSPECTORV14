
import React, { useState, useEffect } from 'react';
import { fetchTokenStats } from '../../services/geminiService';
import { subscribeToCompute } from '../../services/computeTracker';
import { ComputeStats } from '../../types';

export const TokenNode: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [compute, setCompute] = useState<ComputeStats | null>(null);

  useEffect(() => {
    fetchTokenStats().then(data => {
      setStats(data);
      setIsLoading(false);
    });
    const unsubscribe = subscribeToCompute(setCompute);
    return () => { unsubscribe(); };
  }, []);

  if (isLoading) return <div className="p-20 text-center text-slate-500 animate-pulse uppercase tracking-widest text-[10px]">Syncing Token Vault...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">NEURAL <span className="text-indigo-600 not-italic">TOKENS</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Computational Credit Repository</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative overflow-hidden flex flex-col items-center">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
         
         <div className="w-48 h-48 bg-slate-950 border-4 border-indigo-500/20 rounded-full flex flex-col items-center justify-center relative z-10 mb-6 shadow-inner group transition-all hover:border-indigo-500/40">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">AVAILABLE</span>
            <p className="text-4xl font-black italic text-white tracking-tighter">4.2M</p>
            <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[ping_4s_infinite]"></div>
         </div>

         <div className="mb-12 text-center relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SESSION TOKENS CONSUMED</p>
            <p className="text-xl font-black italic text-indigo-400 uppercase mt-1">{(compute?.sessionTokens || 0).toLocaleString()}</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative z-10">
            {stats?.recentOps?.map((op: any, i: number) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{op.op}</p>
                    <p className="text-[8px] text-slate-600 font-bold uppercase">{op.id}</p>
                 </div>
                 <span className="text-sm font-black italic text-indigo-400 tracking-tighter">-{op.cost}</span>
              </div>
            ))}
         </div>

         <button className="w-full mt-10 bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-600/20">
            PURCHASE COMPUTE CREDITS
         </button>
      </div>
    </div>
  );
};