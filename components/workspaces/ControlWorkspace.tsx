
import React from 'react';
import { SubModule } from '../../types';

interface ControlWorkspaceProps {
  activeModule: SubModule;
}

export const ControlWorkspace: React.FC<ControlWorkspaceProps> = ({ activeModule }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
          {activeModule.replace('_', ' ')} <span className="text-emerald-600 not-italic">MODULE</span>
        </h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">
          System Control & Configuration Node
        </p>
      </div>

      <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[56px] p-16 shadow-2xl flex flex-col items-center justify-center space-y-10 relative overflow-hidden min-h-[400px]">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
         
         <div className="w-24 h-24 bg-slate-950 border-2 border-slate-800 rounded-3xl flex items-center justify-center relative z-10 shadow-xl">
            <svg className="w-12 h-12 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
         </div>

         <div className="text-center max-w-lg relative z-10 space-y-4">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Active Configuration Panel</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-serif italic">
               You have accessed the {activeModule} control interface. 
               This module is currently active and monitoring system parameters. 
               Advanced configuration options appear dynamically based on system state.
            </p>
         </div>

         <div className="grid grid-cols-2 gap-4 w-full max-w-md relative z-10 pt-8">
            <div className="bg-slate-900/50 border-2 border-slate-800 p-4 rounded-2xl flex justify-between items-center">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</span>
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ONLINE</span>
            </div>
            <div className="bg-slate-900/50 border-2 border-slate-800 p-4 rounded-2xl flex justify-between items-center">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Latency</span>
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">12ms</span>
            </div>
         </div>
      </div>
    </div>
  );
};
