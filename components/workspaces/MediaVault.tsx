
import React, { useState, useEffect } from 'react';
import { SESSION_ASSETS, AssetRecord } from '../../services/geminiService';

export const MediaVault: React.FC = () => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);

  useEffect(() => {
    // Initial Load
    setAssets([...SESSION_ASSETS]);
    
    // Poll for updates (in case background processes add assets)
    const interval = setInterval(() => {
      // Check if reference changed or length changed
      if (SESSION_ASSETS.length !== assets.length || SESSION_ASSETS[0]?.id !== assets[0]?.id) {
        setAssets([...SESSION_ASSETS]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [assets]);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">MEDIA <span className="text-indigo-600 not-italic">VAULT</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Persistent Asset Reservoir (Local Storage)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 text-slate-500 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest">
          {assets.length} ASSETS SECURED
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {assets.length === 0 && (
            <div className="col-span-3 text-center py-20 opacity-30">
               <span className="text-6xl mb-4 block">🔒</span>
               <p className="text-[10px] font-black uppercase tracking-widest">VAULT EMPTY. GENERATE ASSETS IN CREATION ZONE.</p>
            </div>
         )}

         {assets.map(a => (
           <div key={a.id} className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 space-y-6 hover:border-indigo-500/40 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-[40px] rounded-full"></div>
              <div className="flex justify-between items-start relative z-10">
                 <div className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${
                   a.type === 'VIDEO' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                   a.type === 'IMAGE' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 
                   a.type === 'AUDIO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                 }`}>
                   {a.type}
                 </div>
                 <div className="text-right">
                    <span className="text-[9px] font-black text-slate-700 block">{a.module?.replace('_', ' ')}</span>
                    <span className="text-[8px] font-black text-slate-800">{a.timestamp}</span>
                 </div>
              </div>
              <div className="space-y-1 relative z-10">
                 <h4 className="text-sm font-black text-slate-200 uppercase tracking-tight truncate" title={a.title}>{a.title}</h4>
              </div>
              
              {/* PREVIEW AREA */}
              <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
                 {a.type === 'IMAGE' && <img src={a.data} className="w-full h-full object-cover" alt="Asset" />}
                 {a.type === 'VIDEO' && <video src={a.data} className="w-full h-full object-cover" controls />}
                 {a.type === 'AUDIO' && (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500/5">
                       <span className="text-4xl">🎵</span>
                       <audio src={a.data} controls className="absolute bottom-2 left-2 right-2 w-[calc(100%-16px)] h-8 opacity-80 hover:opacity-100" />
                    </div>
                 )}
                 {a.type === 'TEXT' && (
                    <div className="p-4 w-full h-full overflow-y-auto custom-scrollbar bg-slate-900/50">
                        <p className="text-[9px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">{a.data}</p>
                    </div>
                 )}
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex gap-3 relative z-10">
                 <a 
                   href={a.type === 'TEXT' ? `data:text/plain;charset=utf-8,${encodeURIComponent(a.data)}` : a.data} 
                   download={`POM_${a.id}.${a.type === 'TEXT' ? 'txt' : 'bin'}`} 
                   className="flex-1 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white py-3 rounded-xl text-[8px] font-black text-indigo-400 uppercase tracking-widest transition-all text-center flex items-center justify-center"
                 >
                   DOWNLOAD
                 </a>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
