
import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../../types';
import { GoogleGenAI } from "@google/genai";

interface PromptAIProps {
  lead?: Lead;
}

export const PromptAI: React.FC<PromptAIProps> = ({ lead }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = lead ? `Context: You are helping an AI Agency close ${lead.businessName} in the ${lead.niche} niche. They have a ${lead.socialGap} gap.` : '';
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${context}\n\nUser: ${userMsg}`,
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || 'Protocol error.' }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'ai', text: 'CONNECTION_INTERRUPTED_0x88' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 h-[80vh] flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">PROMPT <span className="text-indigo-600 not-italic">AI</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1 italic">Direct Tactical Interface</p>
        </div>
        {lead && (
          <div className="px-4 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-lg">
             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Target Context Active</span>
          </div>
        )}
      </div>

      <div className="flex-1 bg-[#05091a] border border-slate-800 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-40 italic">
               <span className="text-4xl mb-4">💬</span>
               <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Neural Link Initiation</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-6 py-4 rounded-2xl text-sm font-medium leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex gap-4">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
            placeholder="INPUT COMMAND OR TACTICAL QUERY..."
          />
          <button 
            onClick={handleSend}
            className="bg-indigo-600 hover:bg-indigo-500 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};
