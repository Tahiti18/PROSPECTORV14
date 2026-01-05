
import React, { useState } from 'react';

export const OSForge: React.FC = () => {
  const [protocol, setProtocol] = useState('HIGH_TICKET_AI_TRANSFORMATION_V1');
  const [instruction, setInstruction] = useState('You are a professional outreach engineer specializing in visual-rich local businesses.');

  const handleCommit = () => {
    localStorage.setItem('pomelli_os_protocol', protocol);
    localStorage.setItem('pomelli_os_instruction', instruction);
    alert("PROTOCOLS COMMITTED TO CORE STORAGE.");
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">OS <span className="text-emerald-600 not-italic">FORGE</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Meta-Operational Protocol Configuration</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-10 relative overflow-hidden">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
         
         <div className="grid grid-cols-1 gap-10 relative z-10">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Operational Protocol ID</label>
               <input 
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-all uppercase italic tracking-tighter"
               />
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Core Indoctrination Instruction (System)</label>
               <textarea 
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-8 text-sm font-bold text-slate-300 focus:outline-none focus:border-emerald-500 h-48 resize-none shadow-xl italic leading-relaxed"
               />
            </div>

            <div className="pt-6">
               <button 
                 onClick={handleCommit}
                 className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border border-emerald-400/20"
               >
                 COMMIT PROTOCOLS TO CORE
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-10 flex items-center gap-8">
            <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center font-black text-emerald-400 text-xl">
               S
            </div>
            <div>
               <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">State Synchronizer</h4>
               <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Active Link: 0x88FF</p>
            </div>
         </div>
         <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-10 flex items-center gap-8">
            <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center font-black text-emerald-400 text-xl">
               P
            </div>
            <div>
               <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Permission Matrix</h4>
               <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Status: OPTIMAL</p>
            </div>
         </div>
      </div>
    </div>
  );
};
