
import React, { useState } from 'react';
import { generatePlaybookStrategy } from '../../services/geminiService';

export const ScoringRubricView: React.FC = () => {
  const [strategy, setStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const data = await generatePlaybookStrategy('High-Ticket SaaS'); // Default for now
      setStrategy(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-16 max-w-[1400px] mx-auto py-12 px-6 pb-32 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">THE PROSPECTOR <span className="text-emerald-600 not-italic">PLAYBOOK</span></h1>
        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic">Master Methodology & Scoring Rubric</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column - Scoring */}
        <div className="lg:col-span-7 bg-[#0b1021]/80 border border-slate-800 rounded-[56px] p-16 space-y-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <h3 className="text-lg font-black text-emerald-400 uppercase tracking-[0.4em] italic mb-14 relative z-10 flex items-center gap-3">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             Intelligence Scoring Rubric
          </h3>
          
          <div className="space-y-14 relative z-10">
            {[
              { label: 'VISUAL RICHNESS', max: '40 POINTS', progress: 85, desc: 'Quality of original site photography, 4K galleries, and visual storytelling.' },
              { label: 'SOCIAL DEFICIT', max: '30 POINTS', progress: 70, desc: 'Gap between brand quality and social activity (inactive posts > 90 days).' },
              { label: 'HIGH-TICKET PLAUSIBILITY', max: '20 POINTS', progress: 50, desc: 'Pricing, clientele affluent density, and service premium positioning.' },
              { label: 'REACHABILITY', max: '10 POINTS', progress: 40, desc: 'Availability of direct phone, WhatsApp, and official contact pathways.' },
            ].map((item, i) => (
              <div key={i} className="space-y-4 group">
                <div className="flex justify-between items-end">
                  <span className="text-[11px] font-black text-slate-100 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{item.label}</span>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">MAX: {item.max}</span>
                </div>
                <div className="h-2.5 bg-[#05091a] rounded-full overflow-hidden border border-slate-800 p-[2px]">
                  <div className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${item.progress}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Asset Grading / Strategy */}
        <div className="lg:col-span-5 space-y-10 flex flex-col">
          <div className="bg-[#0b1021]/80 border border-slate-800 rounded-[56px] p-12 flex-1 shadow-2xl relative overflow-hidden flex flex-col">
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -mr-24 -mb-24"></div>
             
             {!strategy && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                   <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter text-center">STRATEGIC PROTOCOL</h3>
                   <button 
                     onClick={handleGenerate}
                     className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all border-b-4 border-emerald-700"
                   >
                     GENERATE MARKET PROTOCOL
                   </button>
                </div>
             )}

             {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                   <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Architecting Sales Logic...</p>
                </div>
             )}

             {strategy && (
                <div className="space-y-8 relative z-10 animate-in fade-in duration-700">
                   <h3 className="text-lg font-black text-emerald-400 uppercase tracking-[0.2em] italic mb-6">{strategy.strategyName}</h3>
                   <div className="space-y-6">
                      {strategy.steps?.map((s: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all">
                           <div className="flex gap-4">
                              <span className="text-emerald-500 font-black italic text-xl">{i+1}</span>
                              <div>
                                 <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{s.title}</h4>
                                 <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{s.tactic}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
