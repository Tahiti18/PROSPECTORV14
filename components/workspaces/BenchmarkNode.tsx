
import React, { useState } from 'react';
import { Lead } from '../../types';
import { fetchBenchmarkData, BenchmarkReport } from '../../services/geminiService';

interface BenchmarkNodeProps {
  lead?: Lead;
}

export const BenchmarkNode: React.FC<BenchmarkNodeProps> = ({ lead }) => {
  const [url, setUrl] = useState(lead?.websiteUrl || 'https://fomoai.com/');
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDive = async () => {
    if (!url) return;
    setIsLoading(true);
    setReport(null);
    try {
      const result = await fetchBenchmarkData({ 
        websiteUrl: url, 
        businessName: lead?.businessName || 'PROSPECT_NODE', 
        niche: lead?.niche || 'AI/Transformation', 
        city: 'Global' 
      } as Lead);
      setReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Robust cleaning to remove AI boilerplate and redundancy
  const clean = (text: string) => {
    if (!text) return "";
    return text
      .replace(/Note:.*$/m, '') // Remove "Note: " lines
      .replace(/Let's stick to.*$/m, '') // Remove schema reminders
      .replace(/Synthesized SpecSpecificity.*$/m, '')
      .replace(/[#*]/g, '') // Remove markdown markers
      .replace(/^- /gm, '') // Remove bullet starts
      .replace(/\n\n+/g, '\n\n') // Normalize paragraphs
      .trim();
  };

  return (
    <div className="max-w-[1550px] mx-auto py-12 space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
          MARKET <span className="text-amber-500 uppercase">REVERSE-ENG</span> HUB
        </h1>
        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em]">
          EXHAUSTIVE MULTI-PARA TECHNICAL SYNTHESIS
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
         <div className="bg-[#0b1021]/80 border-2 border-slate-800 rounded-[64px] p-6 shadow-2xl relative overflow-hidden flex items-center gap-6">
            <div className="absolute inset-0 bg-amber-500/[0.02] pointer-events-none"></div>
            <input 
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               className="flex-1 bg-transparent border-none px-10 text-xl font-bold text-white placeholder-slate-700 focus:ring-0 italic"
               placeholder="INPUT TARGET URL OR PROSPECT..."
            />
            <button 
              onClick={handleDive}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-12 py-5 rounded-[44px] text-[12px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl shadow-amber-500/20 whitespace-nowrap"
            >
               {isLoading ? 'DECONSTRUCTING...' : 'COMMENCE DEEP DIVE'}
            </button>
         </div>

         {report && (
           <div className="mt-16 space-y-20 animate-in slide-in-from-bottom-8 duration-700">
              
              {/* APEX HEADER */}
              <div className="space-y-4">
                 <h2 className="text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
                    {report.entityName}
                 </h2>
                 <p className="text-xl font-medium text-slate-400 italic max-w-4xl leading-relaxed">
                    "{report.missionSummary}"
                 </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                 {/* DUAL STACKS - Technical Bullets */}
                 <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic mb-6">VISUAL / MOTION STACK</h3>
                       <ul className="space-y-8">
                          {report.visualStack.map((item, idx) => (
                             <li key={idx} className="space-y-1 group">
                                <div className="flex items-center gap-4">
                                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                                   <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest group-hover:text-amber-500 transition-colors">{clean(item.label)}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-5 opacity-70 leading-relaxed italic">
                                   {clean(item.description)}
                                </p>
                             </li>
                          ))}
                          {report.visualStack.length === 0 && <p className="text-[9px] text-slate-700 uppercase italic">Analysis pending...</p>}
                       </ul>
                    </div>
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic mb-6">SONIC / MUSIC STACK</h3>
                       <ul className="space-y-8">
                          {report.sonicStack.map((item, idx) => (
                             <li key={idx} className="space-y-1 group">
                                <div className="flex items-center gap-4">
                                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                                   <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest group-hover:text-amber-500 transition-colors">{clean(item.label)}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-5 opacity-70 leading-relaxed italic">
                                   {clean(item.description)}
                                </p>
                             </li>
                          ))}
                          {report.sonicStack.length === 0 && <p className="text-[9px] text-slate-700 uppercase italic">Analysis pending...</p>}
                       </ul>
                    </div>
                 </div>

                 {/* HIGHLIGHT CARDS */}
                 <div className="lg:col-span-5 space-y-10">
                    <div className="bg-amber-500 p-12 rounded-[48px] shadow-2xl space-y-6 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl font-black italic select-none uppercase">GAP</div>
                       <h3 className="text-[11px] font-black text-black uppercase tracking-[0.4em] italic border-b border-black/20 pb-4">FEATURE GAP ANALYSIS</h3>
                       <p className="text-black text-lg font-black italic leading-relaxed font-sans uppercase">
                          "{clean(report.featureGap)}"
                       </p>
                    </div>

                    <div className="bg-[#0b1021] border border-slate-800 p-12 rounded-[48px] shadow-2xl space-y-10">
                       <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic border-b border-slate-800 pb-4">COMMERCIAL INTELLIGENCE</h3>
                       <div className="space-y-8">
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">BUSINESS MODEL</p>
                             <p className="text-[12px] font-black text-slate-100 uppercase tracking-widest italic leading-relaxed">{clean(report.businessModel)}</p>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">DESIGN SYSTEM</p>
                             <p className="text-[12px] font-black text-slate-100 uppercase tracking-widest italic leading-relaxed">{clean(report.designSystem)}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* MASSIVE TECHNICAL PROTOCOL SECTION */}
              <div className="bg-white border border-slate-200 rounded-[84px] p-24 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-4 bg-amber-500"></div>
                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.2px, transparent 1.2px)', backgroundSize: '40px 40px' }}></div>
                 
                 <div className="flex items-center gap-8 mb-20 border-b border-slate-100 pb-12 relative z-10">
                    <div className="w-16 h-16 bg-black rounded-[24px] flex items-center justify-center shadow-2xl">
                       <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5"/></svg>
                    </div>
                    <div>
                       <h3 className="text-4xl font-black italic text-black uppercase tracking-tighter">DEEP ARCHITECTURE PROTOCOL</h3>
                       <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.5em] mt-1 italic">EXHAUSTIVE TECHNICAL & MONETIZATION SYNOPSIS</p>
                    </div>
                 </div>
                 
                 <div className="max-w-none relative z-10 space-y-12">
                    {clean(report.deepArchitecture).split('\n\n').map((para, pIdx) => (
                      <p key={pIdx} className="text-slate-800 text-xl font-medium leading-[1.8] font-sans tracking-tight text-justify">
                         {para}
                      </p>
                    ))}
                 </div>

                 {/* VERIFIABLE NODES */}
                 <div className="mt-24 pt-16 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                    <div className="space-y-8">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic flex items-center gap-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          VERIFIABLE INTELLIGENCE NODES
                       </h4>
                       <div className="grid grid-cols-1 gap-4">
                          {report.sources.map((s, i) => (
                             <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] hover:border-amber-500/30 transition-all group flex flex-col gap-1 shadow-sm">
                                <p className="text-[11px] font-black text-slate-800 uppercase truncate group-hover:text-amber-500 transition-colors">{s.title}</p>
                                <p className="text-[8px] text-slate-400 truncate italic font-bold tracking-widest">{s.uri}</p>
                             </a>
                          ))}
                          {report.sources.length === 0 && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic text-center py-6 opacity-40">No external nodes detected in crawl.</p>}
                       </div>
                    </div>
                    <div className="bg-slate-950 p-12 rounded-[56px] flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative group overflow-hidden">
                       <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] relative z-10">SYSTEM_VERDICT</span>
                       <p className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none relative z-10">PRIME TRANSFORMATION TARGET</p>
                       <p className="text-[9px] text-indigo-400/60 font-black uppercase tracking-[0.4em] relative z-10">DEPLOY 4K PAYLOAD IMMEDIATELY</p>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {!report && !isLoading && (
            <div className="min-h-[400px] flex flex-col items-center justify-center opacity-5 select-none pointer-events-none">
              <h3 className="text-[180px] font-black italic text-white leading-none">REVERSE</h3>
            </div>
         )}

         {isLoading && (
            <div className="min-h-[600px] flex flex-col items-center justify-center space-y-12 py-20 animate-in fade-in duration-1000">
               <div className="w-24 h-24 border-4 border-slate-900 border-t-amber-500 rounded-full animate-spin shadow-2xl shadow-amber-500/10"></div>
               <div className="text-center space-y-5 animate-pulse">
                  <p className="text-[12px] font-black text-amber-500 uppercase tracking-[0.7em] italic">DECONSTRUCTING MULTI-LAYER STACK...</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">ENGAGING GEMINI 3 PRO COGNITIVE CORE (32K BUDGET)</p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};
