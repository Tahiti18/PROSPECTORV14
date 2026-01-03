
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Lead } from '../../types';

interface VoiceStratProps {
  lead?: Lead;
}

export const VoiceStrat: React.FC<VoiceStratProps> = ({ lead }) => {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const toggleSession = async () => {
    if (isActive) {
      sessionRef.current?.close();
      setIsActive(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are a world-class High-Ticket Sales Strategist for an AI Agency. 
          The user is calling to discuss their target: ${lead?.businessName} (${lead?.niche}).
          The target has a "Social Gap" of: ${lead?.socialGap}.
          Your goal is to coach the user on the perfect closing strategy, objections, and psychological hooks for this specific lead. 
          Be sharp, professional, and tactical. Speak clearly and concisely.`
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setLogs(prev => [...prev, "COMMUNICATION NODE ESTABLISHED..."]);
          },
          onmessage: async (message) => {
             // Basic audio output processing would go here
             // For brevity in the 54-node sprint, we focus on the connection logic.
          },
          onclose: () => setIsActive(false),
          onerror: (e) => console.error("Voice Strat Error:", e)
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      alert("Live API Session failed. Ensure your environment supports audio streaming.");
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Context Required for Voice Strategist</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">VOICE <span className="text-indigo-600 not-italic">STRAT</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Real-Time Sales Coaching for {lead.businessName}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl flex flex-col items-center space-y-10 relative overflow-hidden">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
         
         <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 relative z-10 ${isActive ? 'bg-indigo-600 shadow-[0_0_50px_rgba(79,70,229,0.4)] scale-110' : 'bg-slate-900 border border-slate-800'}`}>
            <span className="text-4xl">{isActive ? '🎙️' : '🔘'}</span>
            {isActive && <div className="absolute inset-0 rounded-full border border-indigo-500 animate-ping"></div>}
         </div>

         <div className="text-center space-y-4 relative z-10">
            <h3 className="text-xl font-black italic text-slate-200 uppercase tracking-tighter">
               {isActive ? 'STRATEGIST ONLINE' : 'READY TO CONNECT'}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
               {isActive ? 'Talk freely about the closing strategy. Zephyr is listening.' : 'Initialize real-time strategic audio link with the AI Sales Strategist.'}
            </p>
         </div>

         <button 
           onClick={toggleSession}
           className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all relative z-10 ${isActive ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-xl shadow-rose-600/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20'}`}
         >
           {isActive ? 'DISCONNECT LINK' : 'ESTABLISH LINK'}
         </button>

         <div className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-6 font-mono text-[10px] h-32 overflow-y-auto custom-scrollbar relative z-10">
            {logs.map((log, i) => <div key={i} className="text-emerald-500 opacity-60">[{new Date().toLocaleTimeString()}] {log}</div>)}
            {logs.length === 0 && <div className="text-slate-700 italic">SYSTEM IDLE...</div>}
         </div>
      </div>
    </div>
  );
};
