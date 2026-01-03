
import React from 'react';
import { SubModule, Lead } from '../../types';

interface SellWorkspaceProps {
  activeModule: SubModule;
  leads: Lead[];
  lockedLead?: Lead;
}

export const SellWorkspace: React.FC<SellWorkspaceProps> = ({ activeModule, leads, lockedLead }) => {
  if (activeModule === 'PROPOSALS') {
    return (
      <div className="space-y-12 py-8 max-w-[1500px] mx-auto px-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase">MAGIC LINK <span className="text-indigo-600 not-italic">ARCHITECT</span> <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full not-italic ml-2 uppercase font-black">i</span></h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Bundle your intelligence assets into a high-end conversion portal for the client.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl transition-all">ARCHITECT NEW</button>
            <div className="px-8 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">ACTIVE PROPOSALS (0)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {/* Blueprint Viewer */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] aspect-[16/10] flex items-center justify-center relative shadow-2xl group cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 flex items-center justify-center p-20 text-center relative z-10">
              <div className="space-y-8">
                 <div className="text-7xl text-slate-800/50 group-hover:scale-110 transition-transform font-thin">+</div>
                 <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] group-hover:text-slate-400 transition-colors">
                   {lockedLead ? `Configuring Context for ${lockedLead.businessName}` : 'Select a lead to begin architecting'}
                 </p>
              </div>
            </div>
            {/* Corner styling as seen in screenshots */}
            <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-slate-800/50 group-hover:border-indigo-500/50 transition-colors"></div>
            <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-slate-800/50 group-hover:border-indigo-500/50 transition-colors"></div>
            <div className="absolute bottom-12 left-12 w-8 h-8 border-b-2 border-l-2 border-slate-800/50 group-hover:border-indigo-500/50 transition-colors"></div>
            <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-slate-800/50 group-hover:border-indigo-500/50 transition-colors"></div>
          </div>

          {/* Blueprint Controls */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 space-y-12 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-[14px] font-black text-white shadow-2xl shadow-indigo-600/30">QR</div>
              <div>
                <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em] mb-1">
                  {lockedLead ? lockedLead.businessName : 'Proposal Blueprint'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Agency Preview Node</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 relative z-10">
              <h4 className="text-2xl font-black italic text-slate-800/80 uppercase tracking-[0.6em] animate-pulse">ARCHITECT MODE IDLE</h4>
            </div>

            <div className="pt-10 flex gap-6 relative z-10">
              <button 
                disabled={!lockedLead}
                className="flex-1 bg-[#05091a] hover:bg-slate-900 disabled:opacity-20 disabled:cursor-not-allowed text-slate-500 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border border-slate-800 transition-all"
              >
                Export Draft
              </button>
              <button 
                disabled={!lockedLead}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95"
              >
                Launch Live View
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-40 text-center bg-[#0b1021]/30 border border-dashed border-slate-800 rounded-[64px] opacity-40 max-w-7xl mx-auto my-12">
      <div className="text-7xl mb-12 grayscale opacity-30">💰</div>
      <h3 className="text-xl font-black uppercase tracking-[0.4em] text-slate-400">Sales Node {activeModule}</h3>
      <p className="text-[11px] text-slate-600 mt-4 font-black uppercase tracking-[0.4em]">Establishing Command Link...</p>
    </div>
  );
};
