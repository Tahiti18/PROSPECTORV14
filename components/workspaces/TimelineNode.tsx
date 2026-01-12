
import React, { useState, useEffect } from 'react';
import { PRODUCTION_LOGS } from '../../services/geminiService';

export const TimelineNode: React.FC = () => {
  const [events, setEvents] = useState<string[]>([]);
  useEffect(() => {
    setEvents([...PRODUCTION_LOGS]);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black uppercase text-white">OPERATIONAL <span className="text-emerald-600">TIMELINE</span></h1>
      <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-10 space-y-4">
         {events.map((e, i) => <div key={i} className="text-slate-400 font-mono text-[11px]">{e}</div>)}
      </div>
    </div>
  );
};
