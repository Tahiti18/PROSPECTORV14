
import React, { useState, useEffect } from 'react';
import { PRODUCTION_LOGS } from '../../services/geminiService';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => {
    setLogs([...PRODUCTION_LOGS]);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black uppercase text-white">ACTIVITY <span className="text-emerald-600">LOGS</span></h1>
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 h-[500px] overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2">
         {logs.map((l, i) => <div key={i} className="text-slate-400">{l}</div>)}
      </div>
    </div>
  );
};
