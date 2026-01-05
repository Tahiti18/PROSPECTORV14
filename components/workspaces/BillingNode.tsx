
import React, { useState, useEffect } from 'react';
import { fetchBillingStats } from '../../services/geminiService';
import { subscribeToCompute } from '../../services/computeTracker';
import { ComputeStats } from '../../types';

export const BillingNode: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [compute, setCompute] = useState<ComputeStats | null>(null);

  useEffect(() => {
    fetchBillingStats().then(data => {
      setStats(data);
      setIsLoading(false);
    });
    const unsubscribe = subscribeToCompute(setCompute);
    return () => { unsubscribe(); };
  }, []);

  if (isLoading) return <div className="p-20 text-center text-slate-500 animate-pulse uppercase tracking-widest text-[10px]">Syncing with Billing Hub...</div>;

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-in fade-in duration-500 pb-32">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter transition-colors">THEATER <span className="text-emerald-600 not-italic">BILLING</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic">Operational Ledger & Real-Time Cost Analysis</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-12 shadow-2xl space-y-10 relative overflow-hidden transition-colors">
         <div className="absolute inset-0 bg-emerald-600/[0.02] pointer-events-none"></div>
         
         <div className="flex flex-col md:flex-row justify-around items-center space-y-8 md:space-y-0">
           <div className="text-center space-y-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">LOCAL SESSION ESTIMATE</p>
              <p className="text-4xl font-black italic text-white tracking-tighter">${compute?.sessionCostUsd.toFixed(2) || '0.00'}</p>
           </div>
           <div className="w-px h-12 bg-slate-800 hidden md:block"></div>
           <div className="text-center space-y-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">ELITE_PRO CALLS</p>
              <p className="text-4xl font-black italic text-emerald-400 tracking-tighter">{compute?.proCalls || 0}</p>
           </div>
           <div className="w-px h-12 bg-slate-800 hidden md:block"></div>
           <div className="text-center space-y-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">EST. MONTHLY OPEX</p>
              <p className={`text-4xl font-black italic tracking-tighter ${compute && compute.projectedMonthlyUsd > 100 ? 'text-amber-500' : 'text-emerald-400'}`}>
                ${compute?.projectedMonthlyUsd.toFixed(2) || '0.00'}
              </p>
           </div>
         </div>

         <div className="pt-8 border-t border-slate-800/50 flex flex-col items-center gap-8">
            <div className="bg-amber-900/10 border border-amber-500/20 p-6 rounded-2xl max-w-2xl text-center">
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest leading-relaxed">
                REAL-WORLD EXPENDITURE IS MANAGED VIA YOUR EXTERNAL GOOGLE ACCOUNT. USE THE SECURE PATHWAYS BELOW TO VERIFY CURRENT BILLING.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <a 
                href="https://aistudio.google.com/app/settings/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-600/30 active:scale-95 border border-emerald-400/20 flex items-center justify-center gap-3"
              >
                <span className="text-lg">🛠️</span> AI STUDIO LIMITS
              </a>
              <a 
                href="https://console.cloud.google.com/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-black text-white px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border border-slate-700 flex items-center justify-center gap-3"
              >
                <span className="text-lg">💳</span> GCP BILLING CONSOLE
              </a>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { l: 'TOTAL TOKENS INDEXED', v: stats?.tokenUsage?.toLocaleString() || '0', c: 'text-white' },
           { l: 'SESSION ESTIMATE', v: `$${stats?.estimatedCost || '0.00'}`, c: 'text-emerald-400' },
           { l: 'ACTIVE THEATERS', v: stats?.activeTheaters || '0', c: 'text-emerald-400' },
           { l: 'PROJECTED REV LIFT', v: `$${stats?.projectedRevenueLift?.toLocaleString() || '0'}`, c: 'text-emerald-400' }
         ].map((m, i) => (
           <div key={i} className="bg-[#0b1021] border border-slate-800 p-10 rounded-[32px] flex flex-col items-center text-center space-y-2 group hover:border-emerald-500/40 transition-all shadow-xl">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.l}</span>
              <p className={`text-2xl font-black italic tracking-tighter uppercase ${m.c}`}>{m.v}</p>
           </div>
         ))}
      </div>
    </div>
  );
};
