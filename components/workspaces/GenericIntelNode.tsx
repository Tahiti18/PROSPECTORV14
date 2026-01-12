
import React, { useState } from 'react';
import { SubModule, Lead } from '../../types';

interface GenericIntelNodeProps {
  module: SubModule;
  leads: Lead[];
}

export const GenericIntelNode: React.FC<GenericIntelNodeProps> = ({ module, leads }) => {
  const [roiState, setRoiState] = useState({ ltv: 5000, leads: 100, conv: 2 });

  // CATEGORIZATION LOGIC - Synchronized with canonical SubModule type
  const isAnalytics = ['ANALYTICS_HUB', 'ANALYTICS', 'HEATMAP', 'BENCHMARK', 'PIPELINE', 'USAGE_STATS'].includes(module);
  const isSales = ['ROI_CALCULATOR', 'SEQUENCER', 'FUNNEL_MAP', 'PRESENTATION_BUILDER'].includes(module);

  // ARCHETYPE: ANALYTICS
  if (isAnalytics) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">{module.replace('_', ' ')} <span className="text-emerald-600 not-italic">INTEL</span></h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1 italic">Real-time Data Stream: Connected</p>
          </div>
          <div className="flex gap-2">
            {['24H', '7D', '30D', 'ALL'].map(t => (
              <button key={t} className="px-3 py-1.5 bg-slate-900 border-2 border-slate-800 rounded-lg text-[9px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">{t}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0b1021] border-2 border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden h-[400px]">
             <div className="absolute top-8 left-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Multi-Vector Graph</span>
             </div>
             {/* Simple aesthetic chart */}
             <svg className="w-full h-full pt-16 pb-8" viewBox="0 0 1000 400" preserveAspectRatio="none">
                <path d="M0,350 Q250,300 500,200 T1000,50" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="4" />
                <path d="M0,380 Q200,350 400,300 T800,100 T1000,80" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="2" />
                <circle cx="500" cy="200" r="6" className="fill-emerald-500" />
             </svg>
          </div>
          <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[32px] p-8 space-y-6">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Core Metrics</h3>
             {[
               { l: 'Efficiency', v: '94.2%', c: 'text-emerald-400' },
               { l: 'Drift Rate', v: '0.04%', c: 'text-emerald-400' },
               { l: 'Node Latency', v: '12ms', c: 'text-emerald-400' },
               { l: 'Commit Depth', v: '2,492', c: 'text-slate-400' }
             ].map((m, i) => (
               <div key={i} className="flex justify-between items-center py-4 border-b-2 border-slate-800/50">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.l}</span>
                  <span className={`text-sm font-black italic tracking-tighter ${m.c}`}>{m.v}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  // ARCHETYPE: SALES/LOGIC
  if (isSales && module === 'ROI_CALCULATOR') {
    const revenue = (roiState.leads * (roiState.conv / 100)) * roiState.ltv;
    return (
      <div className="max-w-4xl mx-auto py-10 animate-in fade-in duration-500">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">ROI <span className="text-emerald-600 not-italic">PROJECTION</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Quantifying AI Transformation Value</p>
        </div>

        <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[40px] p-12 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avg Product/Service LTV ($)</label>
               <input type="number" value={roiState.ltv} onChange={e => setRoiState({...roiState, ltv: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-5 py-4 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Lead Volume</label>
               <input type="number" value={roiState.leads} onChange={e => setRoiState({...roiState, leads: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-5 py-4 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">AI Conv. Lift (%)</label>
               <input type="range" min="1" max="10" step="0.5" value={roiState.conv} onChange={e => setRoiState({...roiState, conv: parseFloat(e.target.value)})} className="w-full accent-emerald-600" />
               <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1"><span>{roiState.conv}% TARGETED LIFT</span></div>
            </div>
          </div>

          <div className="bg-[#05091a] rounded-[32px] border-2 border-slate-800/60 p-10 flex flex-col items-center justify-center text-center space-y-2">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PROJECTED REVENUE INCREASE</span>
             <h2 className="text-5xl font-black italic text-emerald-400 tracking-tighter">${revenue.toLocaleString()}</h2>
             <button className="mt-8 bg-emerald-600/10 border-2 border-emerald-500/20 text-emerald-400 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">GENERATE REPORT</button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT: OPS / SETTINGS / CATCH-ALL
  return (
    <div className="max-w-5xl mx-auto py-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">{module.replace('_', ' ')}</h1>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Active Operational Node</p>
        </div>
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[40px] p-10 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[50px] rounded-full"></div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b-2 border-slate-800 pb-4">System Protocols</h3>
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border-2 border-slate-800/40">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol_0x{i}FF</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ACTIVE</span>
              </div>
            ))}
         </div>

         <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[40px] p-10 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[50px] rounded-full"></div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b-2 border-slate-800 pb-4">Live Diagnostics</h3>
            <div className="space-y-4">
               <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Latency</span>
                  <span className="text-white">12ms</span>
               </div>
               <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full w-[12%] bg-emerald-500 rounded-full"></div>
               </div>
               
               <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">
                  <span>Uptime</span>
                  <span className="text-white">99.9%</span>
               </div>
               <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full w-[99%] bg-emerald-500 rounded-full"></div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-[#05091a] border-2 border-slate-800 rounded-[32px] p-12 text-center opacity-60">
         <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            Detailed UI for {module} is pending active deployment. 
            Background processes are running normally.
         </p>
      </div>
    </div>
  );
};
