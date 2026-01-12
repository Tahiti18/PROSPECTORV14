
import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../../types';
import { openRouterChat } from '../../services/geminiService';

interface PromptInterfaceProps {
  lead?: Lead;
}

export const PromptInterface: React.FC<PromptInterfaceProps> = ({ lead }) => {
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
      const context = lead ? `Context: You are helping an AI Agency close ${lead.businessName} in the ${lead.niche} niche.` : '';
      const response = await openRouterChat(`${context}\n\nUser: ${userMsg}`);
      setMessages(prev => [...prev, { role: 'ai', text: response || 'Node error.' }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'ai', text: 'CONNECTION_FAILED_OR_RESTRICTED' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 h-[80vh] flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">SECURED <span className="text-emerald-600 not-italic">PROMPT</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1 italic italic">OpenRouter Flash Core Access</p>
        </div>
      </div>

      <div className="flex-1 bg-[#05091a] border border-slate-800 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-6 py-4 rounded-2xl text-sm font-medium leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl flex gap-1 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
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
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
            placeholder="INPUT COMMAND..."
          />
          <button onClick={handleSend} className="bg-emerald-600 hover:bg-emerald-500 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-95">SEND</button>
        </div>
      </div>
    </div>
  );
};
