
import React from 'react';
import { SubModule, Lead } from '../../types';

interface CreateWorkspaceProps {
  activeModule: SubModule;
  leads: Lead[];
  lockedLead?: Lead;
}

export const CreateWorkspace: React.FC<CreateWorkspaceProps> = ({ activeModule, leads, lockedLead }) => {
  return (
    <div className="space-y-12 py-12 max-w-[1550px] mx-auto px-6 animate-in fade-in duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
            {activeModule.replace('_', ' ')} <span className="text-emerald-600 not-italic">FORGE</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] mt-4 italic">High-Resolution Neural Synthesis Protocol Active</p>
        </div>
        <div className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] border-2 border-emerald-500/20 px-8 py-4 rounded-[24px] bg-emerald-500/5 shadow-2xl">
           CORE_LINK: {activeModule}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        {/* CONTROL SIDEBAR */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-12 shadow-2xl space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[80px] rounded-full"></div>
            
            <div className="space-y-4 relative z-10">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">MISSION TARGET</h3>
              <div className="bg-[#020617] border border-slate-800 rounded-[28px] p-2">
                 <select className="w-full bg-transparent border-none px-6 py-4 text-sm font-black text-emerald-400 focus:ring-0 appearance-none cursor-pointer uppercase italic">
                   <option>{lockedLead ? lockedLead.businessName : 'SELECT TARGET...'}</option>
                   {leads.map(l => <option key={l.id}>{l.businessName}</option>)}
                 </select>
              </div>
            </div>
            
            <div className="space-y-4 relative z-10">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">DIRECTIVES</h3>
              <textarea 
                className="w-full bg-[#020617] border border-slate-800 rounded-[32px] p-8 text-sm font-bold text-slate-300 focus:outline-none focus:border-emerald-500 h-64 resize-none shadow-xl placeholder-slate-800 italic leading-relaxed"
                placeholder="INPUT OPERATIONAL DIRECTIVES FOR THE NEURAL CORE..."
              />
            </div>
            
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-[28px] text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-700">
              INITIATE ASSET FORGE
            </button>
          </div>

          <div className="bg-[#0b1021]/50 border border-slate-800 rounded-[40px] p-10 space-y-6">
             <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">TECHNICAL SPECIFICATIONS</h4>
             <div className="space-y-4">
                {[
                  { l: 'Resolution', v: '4K_ULTRA_HD' },
                  { l: 'Engine', v: 'GEMINI_PRO_V3' },
                  { l: 'Sampling', v: '32-BIT_PCM' }
                ].map((spec, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{spec.l}</span>
                     <span className="text-[10px] font-black text-emerald-400 italic">{spec.v}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* OUTPUT CANVAS */}
        <div className="lg:col-span-8">
          <div className="bg-[#05091a]/40 border border-slate-800 border-dashed rounded-[84px] h-full min-h-[700px] flex flex-col items-center justify-center group relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-emerald-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            {/* Visual placeholder */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-8 px-20">
               <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-[32px] flex items-center justify-center text-emerald-500 opacity-40 group-hover:opacity-100 group-hover:scale-110 group-hover:border-emerald-500/40 transition-all shadow-2xl">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" /></svg>
               </div>
               <div className="space-y-4">
                  <h4 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter group-hover:text-slate-200 transition-colors">FORGE_IDLE</h4>
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] max-w-sm mx-auto leading-relaxed group-hover:text-emerald-400/60 transition-colors">
                    ESTABLISH TARGET CONTEXT AND INPUT DIRECTIVES TO INITIALIZE HIGH-FIDELITY ASSET SYNTHESIS.
                  </p>
               </div>
            </div>
            
            {/* Pro corner styling */}
            <div className="absolute top-16 left-16 w-12 h-12 border-t-4 border-l-4 border-slate-800/50 group-hover:border-emerald-500/30 transition-colors"></div>
            <div className="absolute bottom-16 right-16 w-12 h-12 border-b-4 border-r-4 border-slate-800/50 group-hover:border-emerald-500/30 transition-colors"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
