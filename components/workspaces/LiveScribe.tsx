import React, { useState } from 'react';
import { openRouterChat } from '../../services/geminiService';

export const LiveScribe: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");

  const handleScribe = async () => {
    if (!inputText) return;
    setIsActive(true);
    try {
      const response = await openRouterChat(
        `Summarize these meeting notes: ${inputText}`,
        "You are a high-speed sales scribe."
      );
      setTranscripts(prev => [...prev, `SCRIBE_SUMMARY: ${response}`]);
      setInputText("");
    } finally {
      setIsActive(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">SECURE <span className="text-emerald-600 not-italic">SCRIBE</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Grounded Transcription Synthesis</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl flex flex-col space-y-10 relative overflow-hidden">
         <div className="w-full space-y-4 relative z-10">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-white placeholder-slate-600 h-32"
              placeholder="Paste raw conversation notes for synthesis..."
            />
            <button 
              onClick={handleScribe}
              disabled={isActive}
              className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600 text-white'}`}
            >
              {isActive ? 'SYNTHESIZING...' : 'GENERATE COMBAT SUMMARY'}
            </button>
         </div>

         <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 h-64 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-4 shadow-inner relative z-10">
            {transcripts.map((t, i) => (
              <div key={i} className="p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-400">
                {t}
              </div>
            ))}
            {transcripts.length === 0 && <div className="text-slate-600 italic uppercase tracking-widest text-center py-20">Awaiting input node...</div>}
         </div>
      </div>
    </div>
  );
};
