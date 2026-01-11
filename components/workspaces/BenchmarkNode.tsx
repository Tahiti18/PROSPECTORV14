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

  const clean = (text: string) => {
    if (!text) return "";
    return text
      .replace(/Note:.*$/m, '')
      .replace(/Let's stick to.*$/m, '')
      .replace(/Synthesized SpecSpecificity.*$/m, '')
      .replace(/[#*]/g, '')
      .replace(/^- /gm, '')
      .replace(/\n\n+/g, '\n\n')
      .trim();
  };

  return (
    <div className="max-w-[1550px] mx-auto py-12 space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold uppercase tracking-tight text-white leading-none">
          MARKET <span className="text-emerald-500 uppercase">REVERSE-ENG</span> HUB
        </h1>
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
          EXHAUSTIVE MULTI-PARA TECHNICAL SYNTHESIS
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
         <div className="bg-[#0b1021]/80 border-2 border-slate-800 rounded-[64px] p-6 shadow-2xl relative overflow-hidden flex items-center gap-6">
            <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none"></div>
            <input 
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               className="flex-1 bg-transparent border-none px-10 text-xl font-bold text-white placeholder-slate-600 focus:ring-0 italic"
               placeholder="INPUT TARGET URL OR PROSPECT..."
            />
            <button 
              onClick={handleDive}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-12 py-5 rounded-[44px] text-[12px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl shadow-emerald-600/20 whitespace-nowrap"
            >
               {isLoading ? 'DECONSTRUCTING...' : 'COMMENCE DEEP DIVE'}
            </button>
         </div>

         {report && (
           <div className="mt-16 space-y-20 animate-in slide-in-from-bottom-8 duration-700">
              
              <div className="space-y-4">
                 <h2 className="text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
                    {report?.entityName || "TARGET IDENTITY"}
                 </h2>
                 <p className="text-xl font-medium text-slate-300 italic max-w-4xl leading-relaxed">
                    "{report?.missionSummary || "Summary extracting..."}"
                 </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                 <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic mb-6">VISUAL / MOTION STACK</h3>
                       <ul className="space-y-8">
                          {(report?.visualStack || []).map((item, idx) => (
                             <li key={idx} className="space-y-1 group">
                                <div className="flex items-center gap-4">
                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                   <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">{clean(item?.label || 'VECTOR')}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-5 opacity-70 leading-relaxed italic">
                                   {clean(item?.description || 'N/A')}
                                </p>
                             </li>
                          ))}
                       </ul>
                    </div>
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic mb-6">SONIC / MUSIC STACK</h3>
                       <ul className="space-y-8">
                          {(report?.sonicStack || []).map((item, idx) => (
                             <li key={idx} className="space-y-1 group">
                                <div className="flex items-center gap-4">
                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                   <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">{clean(item?.label || 'VECTOR')}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-5 opacity-70 leading-relaxed italic">
                                   {clean(item?.description || 'N/A')}
                                </p>
                             </li>
                          ))}
                       </ul>
                    </div>
                 </div>

                 <div className="lg:col-span-5 space-y-10">
                    <div className="bg-emerald-600 p-12 rounded-[48px] shadow-2xl space-y-6 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl font-black italic select-none uppercase">GAP</div>
                       <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic border-b border-white/20 pb-4">FEATURE GAP ANALYSIS</h3>
                       <p className="text-white text-lg font-black italic leading-relaxed font-sans uppercase">
                          "{clean(report?.featureGap || 'No specific gap detected.')}"
                       </p>
                    </div>

                    <div className="bg-[#0b1021] border border-slate-800 p-12 rounded-[48px] shadow-2xl space-y-10">
                       <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic border-b border-slate-800 pb-4">COMMERCIAL INTELLIGENCE</h3>
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

              <div className="bg-[#0b1021] border border-slate-800 rounded-[84px] p-24 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-4 bg-emerald-500"></div>
                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.2px, transparent 1.2px)', backgroundSize: '40px 40px' }}></div>
                 
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
                                <p className="text-[11px] font-black text-slate-300 uppercase truncate group-hover:text-emerald-500 transition-colors">{s?.title || 'Source Link'}</p>
                                <p className="text-[8px] text-slate-500 truncate italic font-bold tracking-widest">{s?.uri}</p>
                             </a>
                          ))}
                       </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-12 rounded-[56px] flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative group overflow-hidden">
                       <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] relative z-10">SYSTEM_VERDICT</span>
                       <p className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none relative z-10">PRIME TRANSFORMATION TARGET</p>
                       <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-[0.4em] relative z-10">DEPLOY 4K PAYLOAD IMMEDIATELY</p>
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
               <div className="w-24 h-24 border-4 border-slate-900 border-t-emerald-500 rounded-full animate-spin shadow-2xl shadow-emerald-500/10"></div>
               <div className="text-center space-y-5 animate-pulse">
                  <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.7em] italic">DECONSTRUCTING MULTI-LAYER STACK...</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">ENGAGING GEMINI 3 FLASH COGNITIVE CORE</p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};