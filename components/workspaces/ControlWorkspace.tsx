
import React from 'react';
import { SubModule } from '../../types';

interface ControlWorkspaceProps {
  activeModule: SubModule;
}

export const ControlWorkspace: React.FC<ControlWorkspaceProps> = ({ activeModule }) => {
  return (
    <div className="p-20 text-center bg-[#0a0f1e] border border-slate-800 rounded-3xl">
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-100">Control Subsystem: {activeModule}</h3>
      <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Accessing Cipher Nodes...</p>
      
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-24 bg-[#020617] border border-slate-800 rounded-xl flex items-center justify-center">
            <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
               <div className="w-1/2 h-full bg-indigo-500 animate-[loading_2s_infinite_ease-in-out]"></div>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};
