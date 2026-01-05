
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { fetchViralPulseData } from '../../services/geminiService';

interface ViralPulseProps {
  lead?: Lead;
}

export const ViralPulse: React.FC<ViralPulseProps> = ({ lead }) => {
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');

  const handleRefresh = async (niche: string = lead?.niche || 'AI Automation') => {
    setIsLoading(true);
    try {
      const data = await fetchViralPulseData(niche);
      setTrends(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, [lead]);

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
            TREND <span className="text-emerald-500">MONITOR</span>
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Real-time cultural intelligence & fact-checking via Google Search Grounding.
          </p>
        </div>
        <div className="bg-emerald-600/10 border border-emerald-500/20 px-6 py-2.5 rounded-full flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">GLOBAL TRENDS FEED LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl flex items-center gap-6">
              <div className="flex-1 space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">INTELLIGENCE QUERY</h3>
                 <textarea 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-6 text-base font-medium text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none h-24 placeholder-slate-600 italic"
                    placeholder="Ask about current events, viral news, or fact-check a topic..."
                 />
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                   TIP: ASK "WHAT'S TRENDING IN AI CONTENT THIS MORNING?" OR "FACT-CHECK THE LATEST X VIRAL CLAIM."
                 </p>
              </div>
              <button 
                onClick={() => handleRefresh(query)}
                className="h-20 w-44 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] flex items-center justify-center gap-3 font-black text-[12px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3"/></svg>
                 ANALYZE
              </button>
           </div>

           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[500px] shadow-2xl flex flex-col overflow-hidden relative">
              <div className="p-10 border-b border-slate-800 flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5"/></svg>
                 </div>
                 <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">INTELLIGENCE BRIEFING</h3>
              </div>
              <div className="flex-1 p-10">
                 {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                       <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse italic">Scanning Grounded Search Vectors...</p>
                    </div>
                 ) : trends.length > 0 ? (
                    <div className="space-y-6">
                       {trends.map((t, i) => (
                         <div key={i} className="p-6 bg-[#020617] border border-slate-800 rounded-2xl flex justify-between items-center group hover:border-emerald-500/40 transition-all">
                            <span className="text-sm font-black italic text-slate-200 uppercase tracking-tighter">{t.label}</span>
                            <span className={`text-[10px] font-black uppercase ${t.type === 'up' ? 'text-emerald-400' : 'text-emerald-500'}`}>
                               {t.type === 'up' ? '▲' : '▼'} {t.val}K VELOCITY
                            </span>
                         </div>
                       ))}
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale scale-110">
                       <svg className="w-32 h-32 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16m-7 6h7" strokeWidth="2" strokeLinecap="round"/></svg>
                       <h4 className="text-2xl font-black italic text-white uppercase tracking-widest mt-6">NODE STANDBY</h4>
                    </div>
                 )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-10">
              <h3 className="text-sm font-black italic text-white uppercase tracking-widest flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 LIVE TREND PULSE
              </h3>

              <div className="space-y-10">
                 {trends.slice(0, 4).map((t, i) => (
                   <div key={i} className="space-y-3">
                      <div className="flex justify-between items-end">
                         <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest truncate max-w-[200px]">{t.label}</span>
                         <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${t.type === 'up' ? 'text-emerald-400' : 'text-emerald-500'}`}>
                           {t.type === 'up' ? '▲' : '▼'} {t.val}K
                         </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full ${t.type === 'up' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-emerald-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`} style={{ width: `${(t.val/150)*100}%` }}></div>
                      </div>
                   </div>
                 ))}
                 {trends.length === 0 && <p className="text-[9px] text-slate-600 font-black uppercase italic tracking-widest">Awaiting feed refresh...</p>}
              </div>

              <button 
                onClick={() => handleRefresh()}
                className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
              >
                 REFRESH TRENDS
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
