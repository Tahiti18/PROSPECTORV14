
import React, { useState, useEffect, useRef } from 'react';

const LOGS = [
  "UPLINK ESTABLISHED: CONNECTING TO MULTI-VECTOR SEARCH API...",
  "SCRAPING THEATER METADATA: REGION MATCH [CYPRUS]...",
  "FILTERING BY HIGH-TICKET PARAMETERS...",
  "IDENTIFIED BOUTIQUE ARCHITECTURE FIRM SIGNAL...",
  "EXTRACTING WEBSITE VISUAL ASSETS (4K COMPLIANCE)...",
  "NEURAL ENGINE EVALUATING SOCIAL DEFICIT SCORE...",
  "VULNERABILITY DETECTED: INACTIVE IG FEED (142 DAYS)...",
  "CALCULATING ROI PROJECTION FOR AI TRANSFORMATION...",
  "CROSS-REFERENCING PUBLIC CONTACT REGISTRIES...",
  "SYNTHESIZING PERSONALIZED PITCH HOOKS...",
  "RANKING TARGETS BY ACQUISITION PLAUSIBILITY...",
  "LEDGER SYNC IN PROGRESS: COMMITING RESULTS..."
];

export const Loader: React.FC = () => {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < LOGS.length) {
        setVisibleLogs(prev => [...prev, LOGS[i]]);
        setProgress(Math.round(((i + 1) / LOGS.length) * 100));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLogs]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="bg-[#0b1021] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900">
           <div 
             className="h-full bg-indigo-500 transition-all duration-500 ease-linear shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
             style={{ width: `${progress}%` }}
           ></div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">AI Thinking Process</span>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{progress}% COMPLETED</span>
          </div>

          <div className="bg-[#020617] rounded-xl p-6 font-mono text-[10px] space-y-2 h-48 overflow-y-auto custom-scrollbar border border-slate-800/50">
            {visibleLogs.map((log, idx) => (
              <div key={idx} className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
                <span className="text-slate-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                <span className={`${idx === visibleLogs.length - 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {log}
                </span>
              </div>
            ))}
            <div ref={logEndRef}></div>
          </div>
          
          <div className="flex justify-center">
             <div className="flex gap-1.5">
               {[1,2,3].map(i => (
                 <div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
               ))}
             </div>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.5em] text-center mt-6 italic">
        The system is conducting multi-vector research. Do not refresh.
      </p>
    </div>
  );
};
