
import React, { useState, useRef, useEffect } from 'react';
import { AssetRecord, deleteAsset } from '../../services/geminiService';

interface SonicStudioPlayerProps {
  assets: AssetRecord[];
  onSetCover?: (url: string) => void;
}

export const SonicStudioPlayer: React.FC<SonicStudioPlayerProps> = ({ assets, onSetCover }) => {
  // State
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeStems, setActiveStems] = useState({ drums: true, bass: true, vocals: true, other: true });

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentAsset = assets[currentAssetIndex];

  // Auto-play new tracks
  useEffect(() => {
    if (assets.length > 0 && !currentAsset) {
        setCurrentAssetIndex(0);
    }
  }, [assets.length]);

  // Handle Audio Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentAssetIndex]);

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) audioRef.current.play().catch(e => console.warn(e));
        else audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const selectAsset = (index: number) => {
    setCurrentAssetIndex(index);
    // If it's audio, autoplay. If image, just show.
    if (assets[index].type === 'AUDIO') {
        setIsPlaying(true);
    } else {
        setIsPlaying(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this asset?")) {
        deleteAsset(id);
        // If deleted current, shift index
        if (currentAsset?.id === id) {
            setCurrentAssetIndex(0);
            setIsPlaying(false);
        }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleStem = (stem: keyof typeof activeStems) => {
    setActiveStems(prev => ({ ...prev, [stem]: !prev[stem] }));
    // Simulate audio change (volume dip)
    if (audioRef.current) {
        audioRef.current.volume = 0.5; // Dip
        setTimeout(() => { if (audioRef.current) audioRef.current.volume = 1.0; }, 300);
    }
  };

  if (!assets || assets.length === 0) {
    return (
        <div className="h-full flex flex-col items-center justify-center opacity-20 italic space-y-4 min-h-[400px]">
            <span className="text-6xl grayscale">🎧</span>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Gallery Empty</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#05091a] rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* Audio Element (Hidden if image) */}
      {currentAsset?.type === 'AUDIO' && (
        <audio ref={audioRef} src={currentAsset.data} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      )}

      {/* --- TOP: THE DECK (Visualizer & Controls) --- */}
      <div className="bg-[#0b1021] p-8 border-b border-slate-800 relative overflow-hidden flex-none">
         {/* Background Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>

         <div className="relative z-10 flex flex-col items-center space-y-8">
            
            {/* 1. VISUALIZER & COVER / IMAGE VIEW */}
            <div className="flex items-center gap-12 w-full max-w-4xl justify-center h-48">
                {currentAsset?.type === 'AUDIO' ? (
                    <>
                        {/* Cover Art */}
                        <div className="w-48 h-48 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl relative group shrink-0">
                            {currentAsset.metadata?.coverUrl ? (
                                <img src={currentAsset.metadata.coverUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-4xl">🎵</div>
                            )}
                            {isPlaying && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-1">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-white rounded-sm animate-spin"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Freq Analyzer */}
                        <div className="flex-1 h-32 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-end justify-center gap-1 p-4 overflow-hidden relative">
                            <div className="absolute top-2 left-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">FREQ ANALYZER</div>
                            {[...Array(40)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-2 rounded-t-sm transition-all duration-75 ${isPlaying ? 'bg-emerald-500' : 'bg-slate-800'}`}
                                    style={{ 
                                        height: isPlaying ? `${Math.random() * 80 + 10}%` : '5%',
                                        opacity: i > 20 ? 0.6 : 1
                                    }}
                                ></div>
                            ))}
                        </div>
                    </>
                ) : (
                    // IMAGE VIEW
                    <div className="h-full flex items-center justify-center relative group">
                        <img src={currentAsset?.data} className="h-full object-contain rounded-xl border border-slate-800 shadow-xl" />
                        {onSetCover && (
                            <button 
                                onClick={() => onSetCover && onSetCover(currentAsset.data)}
                                className="absolute bottom-4 px-4 py-2 bg-black/60 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100"
                            >
                                USE AS COVER ART
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 2. METADATA & STEMS */}
            <div className="text-center space-y-4">
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight truncate px-4 max-w-2xl mx-auto">
                        {currentAsset?.title || "Unknown Asset"}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                            {currentAsset?.module?.replace('_', ' ') || 'SYSTEM ASSET'}
                        </p>
                        <span className="text-slate-700">•</span>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            {new Date(currentAsset?.timestamp || 0).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Controls based on Type */}
                {currentAsset?.type === 'AUDIO' ? (
                    <div className="flex gap-2 justify-center">
                        {['DRUMS', 'BASS', 'VOCALS', 'OTHER'].map(stem => (
                            <button
                                key={stem}
                                onClick={() => toggleStem(stem.toLowerCase() as any)}
                                className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${
                                    activeStems[stem.toLowerCase() as keyof typeof activeStems] 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                        : 'bg-slate-900 border-slate-800 text-slate-600 line-through'
                                }`}
                            >
                                {stem}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="h-8"></div> // Spacer
                )}
            </div>

            {/* 3. TRANSPORT (Audio Only) */}
            {currentAsset?.type === 'AUDIO' ? (
                <div className="w-full max-w-2xl space-y-4">
                   <div className="flex items-center gap-4 w-full">
                      <span className="text-[9px] font-mono text-slate-500 w-10 text-right">{formatTime(progress)}</span>
                      <input 
                        type="range" 
                        min="0" 
                        max={duration || 100} 
                        value={progress} 
                        onChange={handleSeek}
                        className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                      />
                      <span className="text-[9px] font-mono text-slate-500 w-10">{formatTime(duration || currentAsset?.metadata?.duration || 0)}</span>
                   </div>

                   <div className="flex items-center justify-center gap-8">
                      <button onClick={() => selectAsset(Math.max(0, currentAssetIndex - 1))} disabled={currentAssetIndex === 0} className="text-slate-500 hover:text-white transition-colors disabled:opacity-30">
                         <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                      </button>

                      <button onClick={togglePlay} className="w-16 h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all active:scale-95 border-b-4 border-emerald-800">
                         {isPlaying ? (
                           <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                         ) : (
                           <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                         )}
                      </button>

                      <button onClick={() => selectAsset(Math.min(assets.length - 1, currentAssetIndex + 1))} disabled={currentAssetIndex === assets.length - 1} className="text-slate-500 hover:text-white transition-colors disabled:opacity-30">
                         <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                      </button>
                   </div>
                </div>
            ) : (
                <div className="w-full max-w-2xl flex justify-center gap-8 py-4">
                     <button onClick={() => selectAsset(Math.max(0, currentAssetIndex - 1))} disabled={currentAssetIndex === 0} className="text-slate-500 hover:text-white transition-colors disabled:opacity-30">
                         <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                     </button>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest py-2">
                        ITEM {currentAssetIndex + 1} / {assets.length}
                     </span>
                     <button onClick={() => selectAsset(Math.min(assets.length - 1, currentAssetIndex + 1))} disabled={currentAssetIndex === assets.length - 1} className="text-slate-500 hover:text-white transition-colors disabled:opacity-30">
                         <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                     </button>
                </div>
            )}
         </div>
      </div>

      {/* --- BOTTOM: THE GALLERY (Grid) --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617] p-8">
         <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ASSET GALLERY</h4>
            <div className="flex gap-2">
                <span className="text-[8px] font-bold text-slate-600 bg-slate-900 px-2 py-1 rounded">{assets.filter(a => a.type === 'AUDIO').length} AUDIO</span>
                <span className="text-[8px] font-bold text-slate-600 bg-slate-900 px-2 py-1 rounded">{assets.filter(a => a.type === 'IMAGE').length} VISUAL</span>
            </div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {assets.map((asset, i) => {
               const active = i === currentAssetIndex;
               return (
                 <div 
                   key={asset.id} 
                   onClick={() => selectAsset(i)}
                   className={`group relative aspect-square rounded-3xl overflow-hidden cursor-pointer transition-all border-2 ${active ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-600'}`}
                 >
                    {/* Background Image */}
                    {asset.type === 'IMAGE' ? (
                        <img src={asset.data} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : asset.metadata?.coverUrl ? (
                        <img src={asset.metadata.coverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <span className="text-4xl opacity-50 grayscale">💿</span>
                        </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                        {asset.type === 'AUDIO' ? '♫' : '🖼️'}
                    </div>

                    {/* Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className="flex flex-col gap-1 mb-6">
                            <p className="text-[11px] font-black text-white uppercase truncate">{asset.title}</p>
                            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest truncate">{asset.module}</p>
                        </div>
                    </div>
                    
                    {/* Actions (Always visible on hover) */}
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                       <button 
                         onClick={(e) => handleDelete(e, asset.id)}
                         className="p-2 bg-rose-900/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-colors"
                         title="Delete Asset"
                       >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                       <a 
                         href={asset.data} 
                         download={`ASSET_${i+1}.${asset.type === 'AUDIO' ? 'mp3' : 'png'}`}
                         onClick={(e) => e.stopPropagation()}
                         className="p-2 bg-black/60 hover:bg-emerald-600 text-white rounded-xl backdrop-blur-md transition-colors"
                         title="Download"
                       >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </a>
                    </div>
                 </div>
               );
            })}
         </div>
      </div>
    </div>
  );
};
