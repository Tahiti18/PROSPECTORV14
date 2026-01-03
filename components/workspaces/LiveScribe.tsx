
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

export const LiveScribe: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const sessionRef = useRef<any>(null);

  const toggleSession = async () => {
    if (isActive) {
      sessionRef.current?.close();
      setIsActive(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are a high-speed sales scribe. Record every detail and provide a combat summary.'
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setTranscripts(prev => [...prev, "RECORDING NODE ESTABLISHED..."]);
          },
          onmessage: async (message: LiveServerMessage) => {
             const input = message.serverContent?.inputTranscription?.text;
             const output = message.serverContent?.outputTranscription?.text;
             
             if (input) {
               setTranscripts(prev => [...prev, `USER: ${input}`]);
             }
             if (output) {
               setTranscripts(prev => [...prev, `STRAT: ${output}`]);
             }
          },
          onclose: () => setIsActive(false),
          onerror: (e) => console.error(e)
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      alert("Live Scribe initialization failed.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">LIVE <span className="text-indigo-600 not-italic">SCRIBE</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Real-Time Combat Transcription</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl flex flex-col space-y-10 relative overflow-hidden">
         <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
               <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`}></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isActive ? 'RECORDING ACTIVE' : 'NODE STANDBY'}
               </span>
            </div>
            <button 
              onClick={toggleSession}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
            >
              {isActive ? 'STOP SCRIBE' : 'INITIATE SCRIBE'}
            </button>
         </div>

         <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 h-96 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-4 shadow-inner relative z-10">
            {transcripts.map((t, i) => (
              <div key={i} className={`p-3 rounded-xl border ${t.startsWith('USER') ? 'bg-indigo-600/5 border-indigo-500/10 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                {t}
              </div>
            ))}
            {transcripts.length === 0 && <div className="text-slate-800 italic uppercase tracking-widest text-center py-20">Awaiting audio feed...</div>}
         </div>
      </div>
    </div>
  );
};