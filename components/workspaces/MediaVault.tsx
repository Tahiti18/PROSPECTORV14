import React, { useState, useEffect, useRef } from 'react';
import { SESSION_ASSETS, AssetRecord, importVault, clearVault, saveAsset, subscribeToAssets, generateVideoPayload } from '../../services/geminiService';

export const MediaVault: React.FC = () => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [mediaErrors, setMediaErrors] = useState<Set<string>>(new Set());
  const vaultInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAssets((updatedAssets) => {
        setAssets(updatedAssets);
    });
    return () => unsubscribe();
  }, []);

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
  };

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
      }
    };
    reader.readAsDataURL(file);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleClear = () => {
    if (confirm("WARNING: THIS WILL DELETE ALL ASSETS FROM BROWSER MEMORY. ENSURE YOU HAVE EXPORTED A BACKUP FIRST. PROCEED?")) {
      clearVault();
    }
  };

  const handleMediaError = (id: string) => {
    setMediaErrors(prev => new Set(prev).add(id));
  };

  const handleAnimate = async (asset: AssetRecord) => {
    if (asset.type !== 'IMAGE') return;
    setAnimatingId(asset.id);
    
    try {
        let base64Image = "";
        if (asset.data.startsWith("data:")) {
            base64Image = asset.data;
        } else {
            alert("External URL animation not supported in this mode. Download and re-upload.");
            setAnimatingId(null);
            return;
        }

        const prompt = "Cinematic slow motion pan, bringing the image to life, 4k high quality, natural movement";
        await generateVideoPayload(prompt, asset.leadId, base64Image);
    } catch (e) {
        console.error("Animation failed", e);
        alert("Failed to animate image.");
    } finally {
        setAnimatingId(null);
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
           <button 
             onClick={() => mediaInputRef.current?.click()}
             className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
           >
             <span>⬆️</span> IMPORT MEDIA FILE
           </button>
           <input 
             type="file" 
             ref={mediaInputRef} 
             onChange={handleMediaUpload} 
             className="hidden" 
             accept="image/*,video/*,audio/*,text/plain,application/pdf,.mp4,.mov,.webm,.m4v,.mp3,.wav,.png,.jpg,.jpeg,.webp"
           />

           <button 
             onClick={handleExportVault}
             disabled={assets.length === 0}
             className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
             BACKUP VAULT (JSON)
           </button>
           
           <button 
             onClick={() => vaultInputRef.current?.click()}
             className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
           >
             RESTORE BACKUP
           </button>
           <input type="file" ref={vaultInputRef} onChange={handleRestoreVault} className="hidden" accept=".json" />
           
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
               <p className="text-[9px] font-bold uppercase tracking-widest mt-2">GENERATE NEW ASSETS OR IMPORT MEDIA</p>
            </div>
         )}

         {assets.map(a => {
           const isError = mediaErrors.has(a.id);
           // FIXED: Sanitized filename to prevent extension conflicts (.ts -> video)
           const safeBase = sanitizeFilename(a.title);
           const ext = a.type === 'TEXT' ? 'txt' : a.type === 'IMAGE' ? 'png' : a.type === 'VIDEO' ? 'mp4' : 'bin';
           const downloadName = `POM_${safeBase}_${a.id.slice(-4)}.${ext}`;

           return (
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
                
                <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center group-hover:border-slate-700 transition-colors">
                   {isError ? (
                      <div className="flex flex-col items-center justify-center text-rose-500 text-center p-4">
                         <span className="text-2xl mb-2">⚠️</span>
                         <p className="text-[8px] font-black uppercase tracking-widest">ASSET EXPIRED / INVALID</p>
                      </div>
                   ) : (
                     <>
                       {a.type === 'IMAGE' && <img src={a.data} className="w-full h-full object-cover" alt="Asset" onError={() => handleMediaError(a.id)} />}
                       {a.type === 'VIDEO' && <video src={a.data} className="w-full h-full object-cover" controls onError={() => handleMediaError(a.id)} />}
                       {a.type === 'AUDIO' && (
                          <div className="w-full h-full flex items-center justify-center bg-amber-500/5 relative">
                             {a.metadata?.coverUrl && <img src={a.metadata.coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                             <span className="text-4xl relative z-10">🎵</span>
                             <audio 
                                src={a.data} 
                                controls 
                                crossOrigin="anonymous"
                                className="absolute bottom-2 left-2 right-2 w-[calc(100%-16px)] h-8 opacity-80 hover:opacity-100 relative z-20" 
                                onError={() => handleMediaError(a.id)}
                             />
                          </div>
                       )}
                       {a.type === 'TEXT' && (
                          <div className="p-4 w-full h-full overflow-y-auto custom-scrollbar bg-slate-900/50">
                              <p className="text-[9px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">{a.data}</p>
                          </div>
                       )}
                     </>
                   )}
                   
                   {a.type === 'IMAGE' && !isError && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button 
                           onClick={() => handleAnimate(a)}
                           disabled={animatingId === a.id}
                           className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
                         >
                           {animatingId === a.id ? (
                              <>
                                 <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                 ANIMATING...
                              </>
                           ) : (
                              <>⚡ ANIMATE VEO</>
                           )}
                         </button>
                      </div>
                   )}
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex gap-3 relative z-10">
                   <a 
                     href={a.type === 'TEXT' ? `data:text/plain;charset=utf-8,${encodeURIComponent(a.data)}` : a.data} 
                     download={downloadName} 
                     className="flex-1 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white py-3 rounded-xl text-[8px] font-black text-emerald-400 uppercase tracking-widest transition-all text-center flex items-center justify-center"
                   >
                     DOWNLOAD FILE
                   </a>
                </div>
             </div>
           );
         })}
      </div>
    </div>
  );
};
