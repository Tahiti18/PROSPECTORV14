
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { groundedLeadSearch } from '../../services/geminiService';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';

interface AutomatedSearchProps {
  market: string;
  onNewLeads: (leads: Lead[]) => void;
}

export const AutomatedSearch: React.FC<AutomatedSearchProps> = ({ market, onNewLeads }) => {
  const [signal, setSignal] = useState('Businesses with outdated websites and no video content');
  const [isCrawling, setIsCrawling] = useState(false);
  const [sessionLeads, setSessionLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`]);
  };

  const handleCrawl = async () => {
    if (isCrawling) return;
    setIsCrawling(true);
    setSessionLeads([]);
    setLogs([]);
    setProgress(0);

    try {
      addLog(`INITIALIZING UPLINK TO THEATER: ${market.toUpperCase()}`);
      addLog(`SIGNAL LOCK: "${signal.toUpperCase()}"`);
      addLog(`ENGAGING GEMINI-3-FLASH CRAWLER...`);
      setProgress(20);

      // Simulate a multi-step search for UI fidelity
      await new Promise(r => setTimeout(r, 1000));
      addLog(`SCANNING GOOGLE SEARCH GROUNDING VECTORS...`);
      setProgress(40);

      const result = await groundedLeadSearch(market, signal);
      
      addLog(`INTEL GATHERED. DECODING ${result.leads.length} ENTITY NODES...`);
      setProgress(70);

      const formattedLeads: Lead[] = result.leads.map((l: any, i: number) => ({
        ...l,
        id: `crawled-${Date.now()}-${i}`,
        status: 'cold',
        outreachStatus: 'cold',
        rank: i + 1,
        leadScore: Math.floor(Math.random() * 30) + 60, // Simulated score
        assetGrade: 'B',
        groundingSources: result.sources.map((s: any) => ({ title: s.web?.title, uri: s.web?.uri }))
      }));

      await new Promise(r => setTimeout(r, 1000));
      setSessionLeads(formattedLeads);
      
      // Save to global DB
      const currentLeads = db.getLeads();
      const existingNames = new Set(currentLeads.map(cl => cl.businessName.toLowerCase()));
      const uniqueNew = formattedLeads.filter(fl => !existingNames.has(fl.businessName.toLowerCase()));
      
      if (uniqueNew.length > 0) {
          db.saveLeads([...currentLeads, ...uniqueNew]);
          onNewLeads(uniqueNew);
          addLog(`SUCCESS: ${uniqueNew.length} NEW UNIQUE RECORDS COMMITTED TO LEDGER.`);
      } else {
          addLog(`NOTE: ALL IDENTIFIED TARGETS ALREADY EXIST IN LEDGER.`);
      }

      setProgress(100);
      toast.success(`Autonomous Search Complete: ${formattedLeads.length} Targets Found.`);

    } catch (e: any) {
      console.error(e);
      addLog(`CRITICAL ERROR: SEARCH PROTOCOL INTERRUPTED - ${e.message}`);
      toast.error("Scraping failed. Check API key status.");
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-8 px-6 space-y-12 animate-in fade-in duration-700 pb-32">
      
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">
            AUTONOMOUS <span className="text-emerald-500">CRAWLER</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3 italic">
            Live Web-Grounding & Signal Extraction Node
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-emerald-600/10 border border-emerald-500/20 px-6 py-2.5 rounded-full flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">CRAWLER STATUS: {isCrawling ? 'ACTIVE' : 'IDLE'}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* CONTROL COLUMN */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[80px] rounded-full"></div>
              
              <div className="space-y-4 relative z-10">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1">MISSION DIRECTIVE</h3>
                 <textarea 
                    value={signal}
                    onChange={(e) => setSignal(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-6 text-sm font-bold text-slate-200 focus:outline-none focus:border-emerald-500 h-32 resize-none italic shadow-inner"
                    placeholder="e.g. Find businesses with no video on their home page..."
                 />
              </div>

              <div className="space-y-4 relative z-10">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1">THEATER</h3>
                 <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 text-emerald-400 font-black italic uppercase tracking-widest text-center">
                    {market}
                 </div>
              </div>

              <button 
                onClick={handleCrawl}
                disabled={isCrawling}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800"
              >
                {isCrawling ? 'CRAWLING WEB...' : 'INITIATE AUTO-DISCOVERY'}
              </button>
           </div>

           {/* LOG TERMINAL */}
           <div className="bg-[#05091a] border border-slate-800 rounded-[32px] p-8 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TRACE_LOG</h4>
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                 </div>
              </div>
              <div ref={scrollRef} className="h-64 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
                 {logs.length === 0 && <p className="text-slate-700 italic">SYSTEM_READY: AWAITING PROTOCOL...</p>}
                 {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 border-b border-slate-900 pb-1">
                       <span className="text-emerald-500/40 shrink-0">#</span>
                       <span className="text-slate-400 uppercase leading-relaxed">{log}</span>
                    </div>
                 ))}
                 {isCrawling && <div className="text-emerald-500 animate-pulse">_</div>}
              </div>
           </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-8 space-y-6">
           {isCrawling && (
              <div className="bg-[#0b1021] border border-emerald-500/20 rounded-3xl p-8 mb-4 animate-in slide-in-from-top-4 duration-500">
                 <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Neural Path Tracing Active...</span>
                    <span className="text-2xl font-black italic text-white">{progress}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                 </div>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sessionLeads.length === 0 && !isCrawling ? (
                 <div className="col-span-2 py-40 border-2 border-dashed border-slate-800 rounded-[56px] flex flex-col items-center justify-center text-center opacity-20">
                    <span className="text-7xl mb-8">📡</span>
                    <h3 className="text-xl font-black uppercase tracking-[0.4em]">Radar Standby</h3>
                    <p className="text-[10px] font-bold uppercase mt-4">DISCOVERY MODULE AWAITING INSTRUCTION</p>
                 </div>
              ) : sessionLeads.map((lead, i) => (
                 <div key={lead.id} className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-8 space-y-6 hover:border-emerald-500/40 transition-all shadow-2xl group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex justify-between items-start">
                       <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center font-black text-emerald-500 text-xl shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          {i + 1}
                       </div>
                       <div className="text-right">
                          <span className="text-[8px] font-black text-emerald-500 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-widest">TARGET_ACQUIRED</span>
                          <p className="text-[11px] font-black italic text-white mt-2">SCORE: {lead.leadScore}</p>
                       </div>
                    </div>
                    
                    <div className="space-y-1">
                       <h4 className="text-lg font-black text-white uppercase tracking-tight truncate">{lead.businessName}</h4>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">{lead.niche} // {lead.city}</p>
                    </div>

                    <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/50 group-hover:border-emerald-500/20 transition-all">
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-2">INTELLIGENCE_SIGNAL</span>
                       <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed line-clamp-2">"{lead.socialGap}"</p>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                       <a href={lead.websiteUrl} target="_blank" className="text-[9px] font-black text-emerald-400 hover:text-white uppercase tracking-widest flex items-center gap-2">
                          <span>🌐</span> VISIT NODE
                       </a>
                       
                       <div className="flex gap-2">
                          {lead.groundingSources?.map((s, idx) => (
                             <a key={idx} href={s.uri} target="_blank" className="w-5 h-5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] hover:bg-emerald-900/40 transition-colors" title={s.title}>
                                🔗
                             </a>
                          ))}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};
