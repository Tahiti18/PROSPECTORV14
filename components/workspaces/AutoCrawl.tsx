
import React, { useState } from 'react';
import { Lead } from '../../types';
import { crawlTheaterSignals } from '../../services/geminiService';

interface AutoCrawlProps {
  theater: string;
  onNewLeads: (leads: Lead[]) => void;
}

export const AutoCrawl: React.FC<AutoCrawlProps> = ({ theater, onNewLeads }) => {
  const [signal, setSignal] = useState('Businesses with no recent social media posts');
  const [isCrawling, setIsCrawling] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);

  const handleCrawl = async () => {
    setIsCrawling(true);
    setResults([]);
    try {
      const newTargets = await crawlTheaterSignals(theater, signal);
      setResults(newTargets);
    } catch (e) {
      console.error("Crawl logic failed:", e);
      alert("Crawl failed to extract signals.");
    } finally {
      setIsCrawling(false);
    }
  };

  const addLead = (lead: Lead) => {
    onNewLeads([lead]);
    setResults(prev => prev.filter(r => r.id !== lead.id));
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">AUTO <span className="text-indigo-600 not-italic">CRAWL</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Signal Extraction in Theater: {theater}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div className="md:col-span-2 space-y-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vulnerability Signal</label>
             <input 
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              placeholder="e.g. Hiring high-ticket sales agents..."
             />
          </div>
          <button 
            onClick={handleCrawl}
            disabled={isCrawling}
            className="bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 border border-indigo-400/20"
          >
            {isCrawling ? 'EXTRACTING SIGNALS...' : 'INITIATE CRAWL'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Extraction Results</h3>
            {results.length > 0 && (
              <button 
                onClick={() => { onNewLeads(results); setResults([]); }}
                className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white"
              >
                ADD ALL TO LEDGER
              </button>
            )}
          </div>
          {isCrawling ? (
            <div className="h-64 bg-slate-950/50 border border-slate-800 border-dashed rounded-[32px] flex flex-col items-center justify-center space-y-6">
               <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">Scanning Theater via Multi-Vector API...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {results.map((l, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center font-black text-indigo-400">
                      {l.assetGrade}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase">{l.businessName}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">{l.niche} — {l.city}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addLead(l)}
                    className="opacity-0 group-hover:opacity-100 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    ADD TO LEDGER
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 bg-slate-950/30 border border-slate-800 border-dashed rounded-[32px] flex flex-col items-center justify-center text-slate-700 italic">
               <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Command Initiation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
