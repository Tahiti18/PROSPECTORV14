
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { crawlTheaterSignals, identifySubRegions } from '../../services/geminiService';
import { db } from '../../services/automation/db'; // IMPORT DB
import { toast } from '../../services/toastManager'; // IMPORT TOAST

interface AutoCrawlProps {
  theater: string;
  onNewLeads: (leads: Lead[]) => void;
}

export const AutoCrawl: React.FC<AutoCrawlProps> = ({ theater, onNewLeads }) => {
  const [signal, setSignal] = useState('Businesses with no recent social media posts');
  const [isCrawling, setIsCrawling] = useState(false);
  const [sessionLeads, setSessionLeads] = useState<Lead[]>([]);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs, sessionLeads]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`]);

  const handleCrawl = async () => {
    if (isCrawling) return;
    setIsCrawling(true);
    setSessionLeads([]);
    setLogs([]);
    setProgress(0);

    try {
      addLog(`INITIALIZING SEARCH PROTOCOL FOR MARKET: ${theater}`);
      addLog(`DECOMPOSING REGION INTO STRATEGIC VECTORS...`);
      const subRegions = await identifySubRegions(theater);
      addLog(`IDENTIFIED ${subRegions.length} HIGH-VALUE SECTORS: ${subRegions.join(', ')}`);

      let totalFound = 0;
      for (let i = 0; i < subRegions.length; i++) {
        const sector = subRegions[i];
        setActiveSector(sector);
        addLog(`ENGAGING SECTOR ${i + 1}/${subRegions.length}: ${sector.toUpperCase()}`);
        try {
          const newLeads = await crawlTheaterSignals(sector, signal);
          if (newLeads.length > 0) {
            addLog(`SUCCESS: ${newLeads.length} SIGNALS EXTRACTED FROM ${sector}`);
            
            // LOCAL UPDATE
            setSessionLeads(prev => [...prev, ...newLeads]);
            
            // GLOBAL DB PERSISTENCE (FIX)
            const currentDb = db.getLeads();
            // Simple dedupe by name
            const existingNames = new Set(currentDb.map(l => l.businessName.toLowerCase()));
            const uniqueNew = newLeads.filter(l => !existingNames.has(l.businessName.toLowerCase()));
            
            if (uniqueNew.length > 0) {
                db.saveLeads([...currentDb, ...uniqueNew]);
                onNewLeads(uniqueNew); // Notify parent
                toast.success(`DB SYNC: +${uniqueNew.length} NEW TARGETS LOCKED.`);
            } else {
                toast.info(`DB SYNC: ${newLeads.length} TARGETS SKIPPED (DUPLICATES).`);
            }

            totalFound += newLeads.length;
          } else {
            addLog(`WARNING: WEAK SIGNAL DENSITY IN ${sector}`);
          }
        } catch (err) {
          addLog(`ERROR: VECTOR FAILURE IN ${sector}`);
        }
        setProgress(Math.round(((i + 1) / subRegions.length) * 100));
        await new Promise(r => setTimeout(r, 800));
      }
      addLog(`SEARCH COMPLETE. ${totalFound} TARGETS SECURED IN DATABASE.`);
      setActiveSector(null);
    } catch (e) {
      console.error("Swarm logic failed:", e);
      addLog("CRITICAL FAILURE: SEARCH ABORTED.");
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-bold uppercase tracking-tight text-white">AUTO <span className="text-emerald-600">SEARCH</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Multi-Vector Signal Extraction: {theater}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-8 shadow-2xl space-y-8">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vulnerability Signal</label>
             <textarea 
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold text-xs focus:outline-none focus:border-emerald-500 transition-all shadow-inner resize-none h-32"
              placeholder="e.g. Hiring high-ticket sales agents, No video content on landing page..."
             />
          </div>
          <button 
            onClick={handleCrawl}
            disabled={isCrawling}
            className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-95 border ${isCrawling ? 'bg-slate-800 border-slate-700 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/20 shadow-emerald-600/20'}`}
          >
            {isCrawling ? 'SEARCH ACTIVE...' : 'INITIATE AUTO-SEARCH'}
          </button>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-64 overflow-y-auto custom-scrollbar font-mono text-[9px] space-y-2 shadow-inner" ref={scrollRef}>
            {logs.length === 0 && <span className="text-slate-600 italic">SYSTEM READY. AWAITING COMMAND.</span>}
            {logs.map((log, i) => (
              <div key={i} className={`truncate ${log.includes('ERROR') ? 'text-rose-500' : log.includes('SUCCESS') ? 'text-emerald-500' : 'text-slate-400'}`}>
                {log}
              </div>
            ))}
            {isCrawling && <div className="text-emerald-500 animate-pulse">_</div>}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-[#0b1021]/50 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-4">
               {isCrawling && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {isCrawling ? `SCANNING: ${activeSector || 'INITIALIZING...'}` : `LIVE FEED (${sessionLeads.length})`}
               </h3>
            </div>
            {sessionLeads.length > 0 && (
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">AUTO-SAVED</span>
              </div>
            )}
          </div>

          {isCrawling && (
            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
               <div className="bg-emerald-500 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          <div className="space-y-3 min-h-[500px]">
            {sessionLeads.length === 0 && !isCrawling ? (
               <div className="h-96 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center text-slate-600 italic opacity-50">
                  <span className="text-4xl mb-4">📡</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">NO DATA IN FEED</p>
               </div>
            ) : (
              sessionLeads.map((l, i) => (
                <div key={i} className="bg-[#0b1021] border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/40 transition-all animate-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-5 overflow-hidden">
                    <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center font-black text-slate-500 shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white uppercase truncate">{l.businessName}</h4>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-800 text-slate-400">{l.city}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic truncate">{l.niche}</p>
                      <p className="text-[9px] text-emerald-400/80 mt-1 truncate border-l-2 border-emerald-500/20 pl-2">Signal: "{l.socialGap}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                     <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">SAVED</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
