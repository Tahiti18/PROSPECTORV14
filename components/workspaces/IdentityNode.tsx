
import React, { useState } from 'react';

export const IdentityNode: React.FC = () => {
  const [agency, setAgency] = useState({
    name: 'POMELLI CORE',
    founder: 'AGENT ZERO',
    status: 'ACTIVE',
    niche: 'AI TRANSFORMATION',
    hq: 'DECENTRALIZED NODE'
  });

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">AGENCY <span className="text-indigo-600 not-italic">IDENTITY</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Credentials & Brand Matrix</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-12 shadow-2xl space-y-10">
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-600/30">P</div>
               <div>
                  <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">{agency.name}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">OPERATIONAL SINCE 2025</p>
               </div>
            </div>
            <div className="space-y-4 pt-8 border-t border-slate-800/50">
               {[
                 { l: 'FOUNDER', v: agency.founder },
                 { l: 'CORE NICHE', v: agency.niche },
                 { l: 'GLOBAL HQ', v: agency.hq },
                 { l: 'STATUS', v: agency.status, c: 'text-emerald-400' }
               ].map((m, i) => (
                 <div key={i} className="flex justify-between items-center py-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{m.l}</span>
                    <span className={`text-[11px] font-black italic uppercase ${m.c || 'text-slate-300'}`}>{m.v}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-10 space-y-6">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brand Directives</h3>
               <div className="space-y-4">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 italic text-slate-400 text-xs">
                    "We do not build generic AI; we construct high-ticket transformation pipelines for elite entities."
                  </div>
                  <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-white px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                     GENERATE BRAND STYLEGUIDE
                  </button>
               </div>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-4">
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Security Protocol</span>
               <p className="text-xl font-black italic text-slate-300 tracking-tighter uppercase">CIPHER_ENABLED</p>
               <button className="text-[9px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">UPDATE RSA KEYPAIR →</button>
            </div>
         </div>
      </div>
    </div>
  );
};
