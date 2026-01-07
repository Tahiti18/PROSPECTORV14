
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { generateAudioPitch, generateLyrics, SESSION_ASSETS, subscribeToAssets, generateVisual, AssetRecord } from '../../services/geminiService';
import { kieSunoService } from '../../services/kieSunoService';
import { SonicStudioPlayer } from './SonicStudioPlayer';

interface SonicStudioProps {
  lead?: Lead;
}

// --- CONFIGURATION CONSTANTS ---
const PRESETS = [
  { id: 'SAAS', label: 'Tech SaaS', prompt: 'Upbeat corporate tech, marimba, synthesizer, futuristic, optimistic, 120bpm', icon: '💻' },
  { id: 'LUXURY', label: 'Luxury Real Estate', prompt: 'Sophisticated deep house, lounge, piano, elegant, expensive atmosphere, 110bpm', icon: '💎' },
  { id: 'MEDICAL', label: 'Modern Medical', prompt: 'Clean, ambient, soft piano, reassuring, sterile but warm, 90bpm', icon: '🏥' },
  { id: 'GYM', label: 'High Energy Gym', prompt: 'Phonk, aggressive drift bass, high energy, workout motivation, 140bpm', icon: '💪' },
  { id: 'LOFI', label: 'Study/Focus', prompt: 'Lofi hip hop beats, chill, tape saturation, vinyl crackle, relaxing', icon: '☕' },
  { id: 'CINEMATIC', label: 'Epic Cinematic', prompt: 'Orchestral hybrid, hans zimmer style, deep drums, epic swelling strings', icon: '🎬' }
];

const DURATIONS = [
  { label: '15s (Spot)', val: 15 },
  { label: '30s (Ad)', val: 30 },
  { label: '2m (Full)', val: 120 }
];

const VOICES = ['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'];

export const SonicStudio: React.FC<SonicStudioProps> = ({ lead }) => {
  // --- STATE ---
  
  // Inputs
  const [activeTab, setActiveTab] = useState<'MUSIC' | 'VOICE' | 'MIXER'>('MUSIC');
  const [musicPrompt, setMusicPrompt] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isInstrumental, setIsInstrumental] = useState(true);
  const [targetDuration, setTargetDuration] = useState(DURATIONS[1]);
  
  // Assets
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<AssetRecord[]>([]);
  
  // Mixer State
  const [mixMusicId, setMixMusicId] = useState<string | null>(null);
  const [mixVoiceId, setMixVoiceId] = useState<string | null>(null);
  const [musicVol, setMusicVol] = useState(0.5);
  const [voiceVol, setVoiceVol] = useState(1.0);
  const [isPlayingMix, setIsPlayingMix] = useState(false);

  // Processing Flags
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isWritingLyrics, setIsWritingLyrics] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  // Refs
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION ---

  useEffect(() => {
    // Load assets
    const initial = SESSION_ASSETS.filter(a => a.type === 'AUDIO');
    setGeneratedAssets(initial);
    const unsub = subscribeToAssets((all) => setGeneratedAssets(all.filter(a => a.type === 'AUDIO')));
    
    // Default Prompts
    if (lead) {
        setMusicPrompt(`Background music for ${lead.businessName} (${lead.niche}). Professional and engaging.`);
        setVoiceText(`Hey, this is ${lead.businessName}. We specialize in high-ticket transformation. Call us today.`);
    }

    return () => unsub();
  }, [lead]);

  // --- MIXER LOGIC ---
  useEffect(() => {
    if (musicAudioRef.current) musicAudioRef.current.volume = musicVol;
    if (voiceAudioRef.current) voiceAudioRef.current.volume = voiceVol;
  }, [musicVol, voiceVol]);

  useEffect(() => {
    if (isPlayingMix) {
        musicAudioRef.current?.play();
        voiceAudioRef.current?.play();
    } else {
        musicAudioRef.current?.pause();
        voiceAudioRef.current?.pause();
        if (musicAudioRef.current) musicAudioRef.current.currentTime = 0;
        if (voiceAudioRef.current) voiceAudioRef.current.currentTime = 0;
    }
  }, [isPlayingMix]);

  // --- ACTIONS ---

  const handleMagicEnhance = () => {
    const enhancers = ["high fidelity", "studio quality", "grammy award winning", "wide stereo", "warm analog warmth"];
    setMusicPrompt(prev => `${prev}, ${enhancers.join(', ')}`);
  };

  const handlePresetSelect = (p: typeof PRESETS[0]) => {
    setMusicPrompt(p.prompt);
  };

  const handleWriteLyrics = async () => {
    if (!lead) return;
    setIsWritingLyrics(true);
    try {
        const text = await generateLyrics(lead, musicPrompt, 'JINGLE');
        setLyrics(text);
        setVoiceText(text); // Auto-copy to voice input
        setIsInstrumental(false); // Assume vocal track needed
        setActiveTab('VOICE'); // Switch to see lyrics
    } catch (e) {
        console.error(e);
    } finally {
        setIsWritingLyrics(false);
    }
  };

  const handleGenerateVoice = async () => {
    setIsGeneratingVoice(true);
    try {
        await generateAudioPitch(voiceText, selectedVoice, lead?.id);
    } finally {
        setIsGeneratingVoice(false);
    }
  };

  const handleGenerateMusic = async () => {
    setIsGeneratingMusic(true);
    try {
        const fullPrompt = `${musicPrompt} [${targetDuration.label}]`;
        await kieSunoService.runFullCycle(fullPrompt, isInstrumental, lead?.id, coverImage || undefined);
    } finally {
        setIsGeneratingMusic(false);
    }
  };

  const handleGenerateCover = async () => {
    setIsGeneratingCover(true);
    try {
        const url = await generateVisual(`Album cover for ${lead?.businessName}, ${musicPrompt}, minimal high design`, lead);
        if (url) setCoverImage(url);
    } finally {
        setIsGeneratingCover(false);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setCoverImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
            SONIC <span className="text-emerald-500 not-italic">STUDIO</span>
            <span className="px-3 py-1 bg-slate-800 text-[10px] text-slate-400 rounded-full font-bold tracking-widest border border-slate-700">PRO SUITE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            Audio Synthesis & Engineering Lab: {lead ? lead.businessName : 'Sandbox'}
          </p>
        </div>
        <div className="flex bg-[#0b1021] border border-slate-800 rounded-xl p-1 shadow-2xl">
           {['MUSIC', 'VOICE', 'MIXER'].map(t => (
             <button
               key={t}
               onClick={() => setActiveTab(t as any)}
               className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === t 
                   ? 'bg-emerald-600 text-white shadow-lg' 
                   : 'text-slate-500 hover:text-white hover:bg-slate-900'
               }`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start h-full min-h-[700px]">
        
        {/* --- LEFT RACK: CONTROLS --- */}
        <div className="xl:col-span-4 flex flex-col gap-6">
           
           {/* MUSIC RACK */}
           {activeTab === 'MUSIC' && (
             <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-2xl space-y-8 animate-in slide-in-from-left-4">
                <div className="flex justify-between items-center">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GENERATOR CORE</h3>
                   <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-bold text-emerald-500">SUNO V3.5</span>
                   </div>
                </div>

                {/* Cover Art */}
                <div className="flex items-center gap-6 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                   <div 
                     onClick={() => coverInputRef.current?.click()}
                     className="w-20 h-20 bg-black rounded-xl border border-slate-800 flex items-center justify-center cursor-pointer overflow-hidden group relative"
                   >
                      {coverImage ? <img src={coverImage} className="w-full h-full object-cover" /> : <span className="text-2xl opacity-30">💿</span>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <span className="text-[8px] font-bold text-white">CHANGE</span>
                      </div>
                      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" />
                   </div>
                   <div className="flex-1 space-y-2">
                      <button onClick={handleGenerateCover} disabled={isGeneratingCover} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all">
                         {isGeneratingCover ? 'DESIGNING...' : 'GENERATE AI ART'}
                      </button>
                      <p className="text-[8px] text-slate-600 font-medium text-center">Auto-embeds into MP3 metadata</p>
                   </div>
                </div>

                {/* Presets */}
                <div className="space-y-3">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SMART PRESETS</label>
                   <div className="grid grid-cols-3 gap-2">
                      {PRESETS.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => handlePresetSelect(p)}
                          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 p-3 rounded-xl flex flex-col items-center gap-1 transition-all group"
                        >
                           <span className="text-xl group-hover:scale-110 transition-transform">{p.icon}</span>
                           <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wide">{p.id}</span>
                        </button>
                      ))}
                   </div>
                </div>

                {/* Prompt */}
                <div className="space-y-3">
                   <div className="flex justify-between">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SONIC PROMPT</label>
                      <button onClick={handleMagicEnhance} className="text-[9px] font-bold text-indigo-400 hover:text-white uppercase tracking-widest flex items-center gap-1">
                         <span>✨</span> ENHANCE
                      </button>
                   </div>
                   <textarea 
                     value={musicPrompt}
                     onChange={(e) => setMusicPrompt(e.target.value)}
                     className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-emerald-500 h-32 resize-none shadow-inner placeholder-slate-700 italic"
                     placeholder="Describe the sound..."
                   />
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">DURATION</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                        onChange={(e) => setTargetDuration(DURATIONS.find(d => d.val === parseInt(e.target.value)) || DURATIONS[1])}
                      >
                         {DURATIONS.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">MODE</label>
                      <button 
                        onClick={() => setIsInstrumental(!isInstrumental)}
                        className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isInstrumental ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-indigo-600 border-indigo-500 text-white'}`}
                      >
                        {isInstrumental ? 'INSTRUMENTAL' : 'VOCAL TRACK'}
                      </button>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                   <div className="flex gap-4">
                      <button 
                        onClick={handleWriteLyrics} 
                        disabled={isWritingLyrics}
                        className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        {isWritingLyrics ? 'WRITING...' : 'WRITE LYRICS'}
                      </button>
                      <button 
                        onClick={handleGenerateMusic}
                        disabled={isGeneratingMusic}
                        className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                      >
                        {isGeneratingMusic ? 'COMPOSING...' : 'GENERATE TRACK'}
                      </button>
                   </div>
                </div>
             </div>
           )}

           {/* VOICE RACK */}
           {activeTab === 'VOICE' && (
             <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-2xl space-y-8 animate-in slide-in-from-left-4">
                <div className="flex justify-between items-center">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VOICE SYNTHESIS</h3>
                   <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="text-[9px] font-bold text-indigo-500">GEMINI TTS</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">VOICE MODEL</label>
                   <div className="grid grid-cols-3 gap-2">
                      {VOICES.map(v => (
                        <button
                          key={v}
                          onClick={() => setSelectedVoice(v)}
                          className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedVoice === v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}
                        >
                          {v}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SCRIPT / LYRICS</label>
                   <textarea 
                     value={voiceText}
                     onChange={(e) => setVoiceText(e.target.value)}
                     className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-6 text-sm font-medium text-slate-300 focus:outline-none focus:border-indigo-500 h-64 resize-none shadow-inner placeholder-slate-700 leading-relaxed font-mono"
                     placeholder="Enter text to speak..."
                   />
                </div>

                <button 
                  onClick={handleGenerateVoice}
                  disabled={isGeneratingVoice}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all border-b-4 border-indigo-800"
                >
                  {isGeneratingVoice ? 'SYNTHESIZING...' : 'GENERATE VOICE'}
                </button>
             </div>
           )}

           {/* MIXER RACK */}
           {activeTab === 'MIXER' && (
             <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-2xl space-y-8 animate-in slide-in-from-left-4">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MULTI-TRACK MIXER</h3>
                   <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">LIVE PREVIEW</span>
                </div>

                {/* Track 1: Music */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">MUSIC TRACK</span>
                      <select 
                        className="bg-slate-900 text-[9px] font-bold text-white border-none outline-none max-w-[150px] truncate"
                        onChange={(e) => setMixMusicId(e.target.value)}
                        value={mixMusicId || ''}
                      >
                         <option value="">-- Select Track --</option>
                         {generatedAssets.filter(a => a.metadata?.isInstrumental).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                      </select>
                   </div>
                   <input type="range" min="0" max="1" step="0.1" value={musicVol} onChange={(e) => setMusicVol(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
                </div>

                {/* Track 2: Voice */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">VOICE TRACK</span>
                      <select 
                        className="bg-slate-900 text-[9px] font-bold text-white border-none outline-none max-w-[150px] truncate"
                        onChange={(e) => setMixVoiceId(e.target.value)}
                        value={mixVoiceId || ''}
                      >
                         <option value="">-- Select Voice --</option>
                         {generatedAssets.filter(a => !a.metadata?.isInstrumental).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                      </select>
                   </div>
                   <input type="range" min="0" max="1" step="0.1" value={voiceVol} onChange={(e) => setVoiceVol(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                </div>

                {/* Transport */}
                <div className="pt-4 flex justify-center">
                   <button 
                     onClick={() => setIsPlayingMix(!isPlayingMix)}
                     disabled={!mixMusicId && !mixVoiceId}
                     className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                   >
                      {isPlayingMix ? (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                   </button>
                </div>

                {/* Hidden Players for Mix */}
                <audio ref={musicAudioRef} src={generatedAssets.find(a => a.id === mixMusicId)?.data} loop />
                <audio ref={voiceAudioRef} src={generatedAssets.find(a => a.id === mixVoiceId)?.data} />
             </div>
           )}
        </div>

        {/* --- RIGHT: GALLERY & VISUALIZER --- */}
        <div className="xl:col-span-8 h-full min-h-[700px]">
           <SonicStudioPlayer assets={generatedAssets} />
        </div>
      </div>
    </div>
  );
};
