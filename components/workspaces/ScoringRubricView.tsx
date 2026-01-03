
import React from 'react';

export const ScoringRubricView: React.FC = () => {
  return (
    <div className="space-y-16 max-w-[1400px] mx-auto py-12 px-6 pb-32">
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-black italic tracking-tighter text-white uppercase leading-none">THE POMELLI <span className="text-indigo-600 not-italic">PLAYBOOK</span></h1>
        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic">Master Methodology & Scoring Rubric</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column - Scoring */}
        <div className="lg:col-span-7 bg-[#0b1021]/80 border border-slate-800 rounded-[56px] p-16 space-y-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <h3 className="text-lg font-black text-indigo-400 uppercase tracking-[0.4em] italic mb-14 relative z-10 flex items-center gap-3">
             <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
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
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.progress}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Asset Grading */}
        <div className="lg:col-span-5 space-y-10 flex flex-col">
          <div className="bg-[#0b1021]/80 border border-slate-800 rounded-[56px] p-16 flex-1 shadow-2xl relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -mr-24 -mb-24"></div>
             <h3 className="text-lg font-black text-slate-200 uppercase tracking-[0.4em] italic mb-14 relative z-10">Asset Grading Protocol</h3>
             <div className="space-y-12 relative z-10">
               {[
                 { grade: 'A', title: 'ELITE TARGET', sub: 'Exceptional premium visuals + weak funnel. Massive upside and immediate ROI potential.', color: 'emerald' },
                 { grade: 'B', title: 'VIABLE TARGET', sub: 'Solid visuals + room for improvement. Viable prospect with clear conversion lift.', color: 'indigo' },
                 { grade: 'C', title: 'SECONDARY TARGET', sub: 'Borderline. Potentially profitable but requires significant foundational work.', color: 'slate' },
               ].map((g, i) => (
                 <div key={i} className="flex gap-8 items-start group">
                   <div className={`w-20 h-20 rounded-3xl bg-${g.color === 'emerald' ? 'emerald' : g.color === 'indigo' ? 'indigo' : 'slate'}-500/10 border border-${g.color === 'emerald' ? 'emerald' : g.color === 'indigo' ? 'indigo' : 'slate'}-500/20 flex items-center justify-center font-black text-3xl text-${g.color === 'emerald' ? 'emerald' : g.color === 'indigo' ? 'indigo' : 'slate'}-400 group-hover:scale-110 group-hover:bg-${g.color}-500/20 transition-all shadow-lg`}>
                     {g.grade}
                   </div>
                   <div className="space-y-2 pt-1">
                     <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{g.title}</h4>
                     <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-widest">{g.sub}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-[#0b1021]/50 border border-slate-800 rounded-[48px] p-12 flex flex-col items-center justify-center text-center space-y-6 shadow-xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] relative z-10">Quick Objective</span>
             <p className="text-sm font-black text-slate-400 italic max-w-sm leading-relaxed relative z-10 px-4 group-hover:text-slate-300 transition-colors">
               "WE BUILD FOR THE FUTURE BY EXPLOITING THE GAPS OF THE PRESENT. SECURE THE VISUAL, BRIDGE THE SOCIAL, CLOSE THE DEAL."
             </p>
          </div>
        </div>
      </div>

      {/* Steps at the bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {[
          { step: 'STEP 1: GROUNDING', desc: 'IDENTIFY THE GRADE-A VISUAL GAPS.' },
          { step: 'STEP 2: PRODUCTION', desc: 'BUILD THE 4K MOCKUP AND VEO PITCH.' },
          { step: 'STEP 3: OUTREACH', desc: 'SEND THE MAGIC LINK AND CLOSE.' }
        ].map((s, i) => (
          <div key={i} className="bg-[#0b1021]/40 border border-slate-800/60 p-12 rounded-[40px] flex flex-col items-start gap-4 group hover:border-slate-700 transition-all">
            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">{s.step}</h4>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-20">
         <button className="px-12 py-5 bg-slate-900 border border-slate-800 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white hover:border-slate-600 transition-all shadow-xl active:scale-95">
           RESTART INDOCTRINATION TOUR
         </button>
      </div>
    </div>
  );
};
