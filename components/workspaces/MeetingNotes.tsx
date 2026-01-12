
import React, { useState } from 'react';
import { openRouterChat } from '../../services/geminiService';

export const MeetingNotes: React.FC = () => {
  const [notes, setNotes] = useState("");

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black uppercase text-white">NOTE <span className="text-emerald-600">SCRIBE</span></h1>
      <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-10">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white h-64" placeholder="Paste notes..." />
        <button className="mt-8 bg-emerald-600 px-8 py-4 rounded-xl text-xs font-black text-white">SUMMARIZE</button>
      </div>
    </div>
  );
};
