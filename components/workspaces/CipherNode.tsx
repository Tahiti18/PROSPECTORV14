
import React from 'react';

export const CipherNode: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">CIPHER <span className="text-indigo-600 not-italic">MATRIX</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Security & Encryption Infrastructure</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-20 shadow-2xl relative overflow-hidden flex flex-col items-center">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
         
         <div className="w-40 h-40 bg-slate-950 border-4 border-indigo-500/20 rounded-full flex items-center justify-center relative z-10 mb-10 shadow-inner group">
            <span className="text-5xl group-hover:scale-110 transition-transform">🛡️</span>
            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping" style={{ animationDuration: '4s' }}></div>
         </div>

         <div className="text-center space-y-4 relative z-10">
            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">SYSTEM_LOCKED</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.5em]">AES-256 ENCRYPTION ACTIVE</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16 relative z-10">
            {[
              { l: 'RSA_KEY_A', v: '0x88FF...D2', c: 'text-emerald-400' },
              { l: 'VAULT_HEALTH', v: 'OPTIMAL', c: 'text-cyan-400' },
              { l: 'AUTH_NODES', v: '4 ACTIVE', c: 'text-indigo-400' }
            ].map((node, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center space-y-2">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{node.l}</span>
                 <p className={`text-[11px] font-black italic uppercase ${node.c}`}>{node.v}</p>
              </div>
            ))}
         </div>

         <div className="w-full mt-10 pt-10 border-t border-slate-800 relative z-10">
            <button className="w-full bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-500 hover:text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
               REGENERATE ENCRYPTION SALTS
            </button>
         </div>
      </div>
    </div>
  );
};
