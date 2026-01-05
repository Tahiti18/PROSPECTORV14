
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateNurtureDialogue } from '../../services/geminiService';

interface AIConciergeProps {
  lead?: Lead;
}

export const AIConcierge: React.FC<AIConciergeProps> = ({ lead }) => {
  const [scenario, setScenario] = useState('New inquiry about premium service packages');
  const [chat, setChat] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async () => {
    if (!lead) return;
    setIsLoading(true);
    try {
      const messages = await generateNurtureDialogue(lead, scenario);
      setChat(messages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Concierge Simulation</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">AI <span className="text-emerald-600 not-italic">CONCIERGE</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Autonomous Agent POC: {lead.businessName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-2xl space-y-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Simulation Scenario</label>
                 <textarea 
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-emerald-500 h-32 resize-none shadow-xl italic"
                 />
              </div>
              <button 
                onClick={handleSimulate}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border border-emerald-400/20"
              >
                {isLoading ? 'SIMULATING...' : 'INITIATE AGENT POC'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-[48px] p-10 min-h-[500px] flex flex-col shadow-2xl overflow-hidden relative">
           <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4">
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                   <div className={`max-w-[80%] p-6 rounded-[28px] text-[12px] font-medium leading-relaxed italic ${m.role === 'user' ? 'bg-slate-900 border border-slate-800 text-slate-400 rounded-bl-none' : 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-br-none'}`}>
                      <span className="text-[8px] font-black uppercase tracking-widest block mb-2 opacity-50">{m.role === 'user' ? 'LEAD_INQUIRY' : 'AI_CONCIERGE_RESPONSE'}</span>
                      "{m.text}"
                   </div>
                </div>
              ))}
              {isLoading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.4em] text-center py-20">AGENT_THINKING...</div>}
              {chat.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic space-y-4">
                   <span className="text-5xl">🤖</span>
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Ready for nurture test</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
