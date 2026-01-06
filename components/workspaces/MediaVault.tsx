import React, { useState, useEffect, useRef } from 'react';
import { SESSION_ASSETS, AssetRecord, importVault, clearVault, saveAsset } from '../../services/geminiService';

export const MediaVault: React.FC = () => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const vaultInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAssets([...SESSION_ASSETS]);
    const interval = setInterval(() => {
      if (SESSION_ASSETS.length !== assets.length || SESSION_ASSETS[0]?.id !== assets[0]?.id) {
        setAssets([...SESSION_ASSETS]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [assets]);

  const handleExportVault = () => {
    const dataStr = JSON.stringify(SESSION_ASSETS, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POMELLI_VAULT_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) {
          const count = importVault(imported);
          alert(`SUCCESS: ${count} ASSETS RESTORED FROM COLD STORAGE.`);
        } else {
          alert("ERROR: INVALID VAULT FILE FORMAT.");
        }
      } catch (err) {
        alert("ERROR: CORRUPT VAULT FILE.");
      }
    };
    reader.readAsText(file);
    if (vaultInputRef.current) vaultInputRef.current.value = '';
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        let type: AssetRecord['type'] = 'TEXT';
        if (file.type.startsWith('image/')) type = 'IMAGE';
        else if (file.type.startsWith('video/')) type = 'VIDEO';
        else if (file.type.startsWith('audio/')) type = 'AUDIO';
        
        saveAsset(type, `MANUAL UPLOAD: ${file.name}`, result, 'MEDIA_VAULT');
        setAssets([...SESSION_ASSETS]); // Trigger update
      }
    };
    reader.readAsDataURL(file);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleClear = () => {
    if (confirm("WARNING: THIS WILL DELETE ALL ASSETS FROM BROWSER MEMORY. ENSURE YOU HAVE EXPORTED A BACKUP FIRST. PROCEED?")) {
      clearVault();
      setAssets([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white leading-none">ASSET <span className="text-emerald-600">LIBRARY</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Persistent Asset Reservoir (Local Storage)</p>
        </div>
        <div className="flex gap-4">
           {/* Vault Actions */}
           <button 
             onClick={handleExportVault}
             disabled={assets.length === 0}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-600/20"
           >
             BACKUP VAULT
           </button>
           
           <button 
             onClick={() => vaultInputRef.current?.click()}
             className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
           >
             RESTORE VAULT
           </button>
           <input type="file" ref={vaultInputRef} onChange={handleRestoreVault} className="hidden" accept=".json" />

           {/* Manual Media Upload */}
           <button 
             onClick={() => mediaInputRef.current?.click()}
             className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
           >
             UPLOAD MEDIA
           </button>
           <input 
             type="file" 
             ref={mediaInputRef} 
             onChange={handleMediaUpload} 
             className="hidden" 
             accept="image/*,video/*,audio/*,text/plain,application/pdf"
           />
           
           {assets.length > 0 && (
             <button 
               onClick={handleClear}
               className="bg-rose-900/20 border border-rose-500/20 text-rose-500 hover:bg-rose-900/40 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
             >
               PURGE
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {assets.length === 0 && (
            <div className="col-span-3 text-center py-32 opacity-30 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center">
               <span className="text-6xl mb-6 block">🔒</span>
               <p className="text-[12px] font-black uppercase tracking-[0.3em]">VAULT EMPTY</p>
               <p className="text-[9px] font-bold uppercase tracking-widest mt-2">GENERATE NEW ASSETS OR IMPORT BACKUP</p>
            </div>
         )}

         {assets.map(a => (
           <div key={a.id} className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 space-y-6 hover:border-emerald-500/40 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 blur-[40px] rounded-full"></div>
              <div className="flex justify-between items-start relative z-10">
                 <div className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${
                   a.type === 'VIDEO' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                   a.type === 'IMAGE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                   a.type === 'AUDIO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                 }`}>
                   {a.type}
                 </div>
                 <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 block">{a.module?.replace('_', ' ')}</span>
                    <span className="text-[8px] font-black text-slate-600">{new Date(a.timestamp).toLocaleTimeString()}</span>
                 </div>
              </div>
              <div className="space-y-1 relative z-10">
                 <h4 className="text-sm font-black text-slate-200 uppercase tracking-tight truncate" title={a.title}>{a.title}</h4>
              </div>
              
              {/* PREVIEW AREA */}
              <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center group-hover:border-slate-700 transition-colors">
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
                   className="flex-1 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white py-3 rounded-xl text-[8px] font-black text-emerald-400 uppercase tracking-widest transition-all text-center flex items-center justify-center"
                 >
                   DOWNLOAD FILE
                 </a>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
