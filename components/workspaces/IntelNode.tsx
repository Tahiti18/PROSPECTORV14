import React, { useState, useEffect } from 'react';
import { Lead, SubModule } from '../../types';
import { fetchLiveIntel, BenchmarkReport } from '../../services/geminiService';

interface IntelNodeProps {
  module: SubModule;
  lead?: Lead;
}

export const IntelNode: React.FC<IntelNodeProps> = ({ module, lead }) => {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const loadIntel = async () => {
      setIsLoading(true);
      setReport(null);
      try {
        const data = await fetchLiveIntel(lead, module);
        setReport(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadIntel();
  }, [lead, module]);

  const clean = (text: string) => {
    if (!text) return "";
    return text.replace(/[#*]/g, '').replace(/^- /gm, '').replace(/\n\n+/g, '\n\n').trim();
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Required for {module} Protocol</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1550px] mx-auto py-12 space-y-12 animate-in fade-in duration-700">
      {/* APEX HEADER */}
      <div className="flex justify-between items-start">
        <div className="space-y-4">
           <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase leading-none">
                {module.replace('_', ' ')} <span className="text-emerald-500 not-italic">PROTOCOL</span>
              </h1>
              <div className="bg-emerald-600/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">TARGET: {lead.businessName}</span>
              </div>
           </div>
           {report && <p className="text-xl font-medium text-slate-300 italic max-w-4xl leading-relaxed">"{report?.missionSummary || 'Intelligence summary extracting...'}"</p>}
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[600px] flex flex-col items-center justify-center space-y-12 py-20">
           <div className="w-24 h-24 border-4 border-slate-900 border-t-emerald-500 rounded-full animate-spin"></div>
           <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.7em] animate-pulse italic">EXTRACTING HYPER-FIDELITY INTEL...</p>
        </div>
      ) : report ? (
        <div className="space-y-20 animate-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
             {/* STACKS */}
             <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                   <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] italic">TECHNICAL VECTORS</h3>
                   <ul className="space-y-8">
                      {(report?.visualStack || []).map((item, idx) => (
                         <li key={idx} className="space-y-1 group">
                            <div className="flex items-center gap-4">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                               <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">{clean(item?.label || 'UNLABELED')}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-5 opacity-70 italic leading-relaxed">{clean(item?.description || 'No description provided.')}</p>
                         </li>
                      ))}
                   </ul>
                </div>
                <div className="space-y-8">
                   <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] italic">STRATEGIC GAPS</h3>
                   <ul className="space-y-8">
                      {(report?.sonicStack || []).map((item, idx) => (
                         <li key={idx} className="space-y-1 group">
                            <div className="flex items-center gap-4">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                               <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">{clean(item?.label || 'UNLABELED')}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-5 opacity-70 italic leading-relaxed">{clean(item?.description || 'No description provided.')}</p>
                         </li>
                      ))}
                   </ul>
                </div>
             </div>

             {/* HIGHLIGHT CARDS */}
             <div className="lg:col-span-5 space-y-10">
                <div className="bg-emerald-600 p-12 rounded-[48px] shadow-2xl space-y-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl font-black italic select-none uppercase">GAP</div>
                   <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic border-b border-white/20 pb-4">FEATURE GAP ANALYSIS</h3>
                   <p className="text-white text-lg font-black italic leading-relaxed font-sans uppercase">"{clean(report?.featureGap || 'No specific gap identified.')}"</p>
                </div>
                <div className="bg-[#0b1021] border border-slate-800 p-12 rounded-[48px] shadow-2xl space-y-10">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic border-b border-slate-800 pb-4">INTELLIGENCE MATRIX</h3>
                   <div className="space-y-8">
                      <div className="space-y-2">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">BUSINESS MODEL</p>
                         <p className="text-[12px] font-black text-slate-200 uppercase tracking-widest italic leading-relaxed">{clean(report?.businessModel || 'TRADITIONAL')}</p>
                      </div>
                      <div className="space-y-2">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DESIGN SYSTEM</p>
                         <p className="text-[12px] font-black text-slate-200 uppercase tracking-widest italic leading-relaxed">{clean(report?.designSystem || 'LEGACY')}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* DARK MODE PROTOCOL SECTION */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-[84px] p-24 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-4 bg-emerald-500"></div>
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1.2px, transparent 1.2px)', backgroundSize: '40px 40px' }}></div>
             
             <div className="flex items-center gap-8 mb-20 border-b border-slate-800 pb-12 relative z-10">
                <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-[24px] flex items-center justify-center shadow-2xl">
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5"/></svg>
                </div>
                <div>
                   <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">DEEP ARCHITECTURE PROTOCOL</h3>
                   <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.5em] mt-1 italic">EXHAUSTIVE TECHNICAL & MONETIZATION SYNOPSIS</p>
                </div>
             </div>
             
             <div className="max-w-none relative z-10 space-y-12">
                {clean(report?.deepArchitecture || 'Synthesis in progress...').split('\n\n').map((para, pIdx) => (
                  <p key={pIdx} className="text-slate-300 text-xl font-medium leading-[1.8] font-sans tracking-tight text-justify">{para}</p>
                ))}
             </div>

             <div className="mt-24 pt-16 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                <div className="space-y-8">
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic flex items-center gap-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      VERIFIABLE INTELLIGENCE NODES
                   </h4>
                   <div className="grid grid-cols-1 gap-4">
                      {(report?.sources || []).map((s, i) => (
                         <a key={i} href={s?.uri} target="_blank" rel="noopener noreferrer" className="p-6 bg-slate-900 border border-slate-800 rounded-[28px] hover:border-emerald-500/30 transition-all group flex flex-col gap-1 shadow-sm">
                            <p className="text-[11px] font-black text-slate-200 uppercase truncate group-hover:text-emerald-500 transition-colors">{s?.title || 'External Source'}</p>
                            <p className="text-[8px] text-slate-500 truncate italic font-bold tracking-widest">{s?.uri}</p>
                         </a>
                      ))}
                      {(report?.sources || []).length === 0 && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic text-center py-6 opacity-40">No external nodes detected in crawl.</p>}
                   </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-12 rounded-[56px] flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative group overflow-hidden">
                   <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] relative z-10">SYSTEM_VERDICT</span>
                   <p className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none relative z-10">PRIME TRANSFORMATION TARGET</p>
                   <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-[0.4em] relative z-10">READY FOR 4K PAYLOAD FORGE</p>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center opacity-10">
          <h3 className="text-9xl font-black italic text-white">REVERSE</h3>
        </div>
      )}
    </div>
  );
};