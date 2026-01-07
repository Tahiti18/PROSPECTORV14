
import React, { useState, useRef, useEffect } from 'react';
import { AssetRecord } from '../../services/geminiService';

interface SonicStudioPlayerProps {
  assets: AssetRecord[];
}

export const SonicStudioPlayer: React.FC<SonicStudioPlayerProps> = ({ assets }) => {
  // State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  const currentTrack = assets[currentTrackIndex];

  // Auto-play new tracks when added (if it's the first one or user is idle)
  useEffect(() => {
    if (assets.length > 0 && !currentTrack) {
        setCurrentTrackIndex(0);
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
  }, [currentTrackIndex]);

  // Effect to handle play/pause toggling
  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.warn("Playback prevented:", e));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying, currentTrackIndex]);

  // Controls
  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        setProgress(time);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
        audioRef.current.volume = vol;
        setIsMuted(vol === 0);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!assets || assets.length === 0) {
    return (
        <div className="h-full flex flex-col items-center justify-center opacity-20 italic space-y-4 min-h-[400px]">
            <span className="text-6xl grayscale">🎧</span>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Audio Matrix Offline</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#05091a] rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl relative">
      <audio 
        ref={audioRef} 
        src={currentTrack?.data} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* --- TOP: THE DECK (Visualizer & Controls) --- */}
      <div className="bg-[#0b1021] p-8 border-b border-slate-800 relative overflow-hidden">
         {/* Background Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>

         <div className="relative z-10 flex flex-col items-center space-y-6">
            {/* Metadata */}
            <div className="text-center space-y-2 max-w-lg">
               <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">
                 {currentTrack?.title || "Unknown Track"}
               </h3>
               <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.3em] bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-500/20">
                 {currentTrack?.module?.replace('_', ' ') || 'SYSTEM AUDIO'}
               </span>
            </div>

            {/* Visualizer */}
            <div className="flex items-end gap-1 h-12 w-full max-w-xs justify-center opacity-80">
               {[...Array(20)].map((_, i) => (
                 <div 
                   key={i} 
                   className={`w-1.5 rounded-t-sm transition-all duration-100 ${isPlaying ? 'bg-emerald-500 animate-[bounce_1s_infinite]' : 'bg-slate-800 h-2'}`}
                   style={{ 
                     height: isPlaying ? `${Math.random() * 100}%` : '20%',
                     animationDelay: `${i * 0.05}s`
                   }}
                 ></div>
               ))}
            </div>

            {/* Transport Controls */}
            <div className="w-full space-y-4">
               {/* Progress Bar */}
               <div className="flex items-center gap-3 w-full">
                  <span className="text-[9px] font-mono text-slate-500 w-8 text-right">{formatTime(progress)}</span>
                  <input 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    value={progress} 
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                  />
                  <span className="text-[9px] font-mono text-slate-500 w-8">{formatTime(duration)}</span>
               </div>

               {/* Buttons */}
               <div className="flex items-center justify-center gap-8">
                  <button 
                    onClick={() => playTrack(Math.max(0, currentTrackIndex - 1))}
                    disabled={currentTrackIndex === 0}
                    className="text-slate-500 hover:text-white transition-colors disabled:opacity-30"
                  >
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                  </button>

                  <button 
                    onClick={togglePlay}
                    className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all active:scale-95 border-b-4 border-emerald-800"
                  >
                     {isPlaying ? (
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                     ) : (
                       <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     )}
                  </button>

                  <button 
                    onClick={() => playTrack(Math.min(assets.length - 1, currentTrackIndex + 1))}
                    disabled={currentTrackIndex === assets.length - 1}
                    className="text-slate-500 hover:text-white transition-colors disabled:opacity-30"
                  >
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* --- BOTTOM: THE CRATE (Playlist) --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#05091a]">
         <div className="p-2 space-y-1">
            {assets.map((asset, i) => {
               const active = i === currentTrackIndex;
               return (
                 <div 
                   key={asset.id} 
                   onClick={() => playTrack(i)}
                   className={`group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${active ? 'bg-slate-900 border-emerald-500/30' : 'border-transparent hover:bg-slate-900 hover:border-slate-800'}`}
                 >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${active ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500 group-hover:text-white'}`}>
                       {active && isPlaying ? (
                          <div className="flex gap-0.5 h-3 items-end">
                             <div className="w-0.5 bg-black animate-[bounce_0.5s_infinite]"></div>
                             <div className="w-0.5 bg-black animate-[bounce_0.7s_infinite]"></div>
                             <div className="w-0.5 bg-black animate-[bounce_0.6s_infinite]"></div>
                          </div>
                       ) : (i + 1)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <h4 className={`text-[10px] font-bold uppercase truncate ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {asset.title}
                       </h4>
                       <p className="text-[8px] font-mono text-slate-600 truncate">{new Date(asset.timestamp).toLocaleTimeString()}</p>
                    </div>

                    <a 
                      href={asset.data} 
                      download={`TRACK_${i+1}.mp3`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-600 hover:text-emerald-400 transition-colors"
                    >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                 </div>
               );
            })}
         </div>
      </div>
    </div>
  );
};
