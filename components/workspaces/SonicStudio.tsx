
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { generateAudioPitch, generateLyrics, SESSION_ASSETS, subscribeToAssets, generateVisual, AssetRecord, generateSonicPrompt } from '../../services/geminiService';
import { kieSunoService } from '../../services/kieSunoService';
import { SonicStudioPlayer } from './SonicStudioPlayer';
import { toast } from '../../services/toastManager';

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

const GENRES = ['Cinematic', 'Electronic', 'Rock', 'Hip Hop', 'Jazz', 'Ambient', 'Corporate', 'Pop', 'Synthwave', 'Lo-Fi'];
const VIBES = ['Uplifting', 'Melancholic', 'Energetic', 'Relaxing', 'Suspenseful', 'Motivational', 'Dark', 'Ethereal', 'Punchy', 'Warm'];

const DURATIONS = [
  { label: '15s (Spot)', val: 15 },
  { label: '30s (Ad)', val: 30 },
  { label: '60s (Full)', val: 60 }
];

const VOICES = ['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'];

export const SonicStudio: React.FC<SonicStudioProps> = ({ lead }) => {
  // --- STATE ---
  
  // Inputs
  const [activeTab, setActiveTab] = useState<'MUSIC' | 'VOICE' | 'MIXER' | 'GALLERY'>('MUSIC');
  const [musicPrompt, setMusicPrompt] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isInstrumental, setIsInstrumental] = useState(true);
  const [targetDuration, setTargetDuration] = useState(DURATIONS[1]);
  const [exportFormat, setExportFormat] = useState<'MP3' | 'WAV'>('MP3');
  
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
  
  // Auto-Prompt
  const [isAutoPrompting, setIsAutoPrompting] = useState(false);

  // Refs
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION ---

  useEffect(() => {
    // Filter for Audio AND Images relevant to this lead (or global if no lead)
    const filterAssets = (all: AssetRecord[]) => {
        return all.filter(a => {
            const isTypeMatch = a.type === 'AUDIO' || a.type === 'IMAGE';
            const isLeadMatch = lead ? a.leadId === lead.id : true;
            return isTypeMatch && isLeadMatch;
        });
    };

    setGeneratedAssets(filterAssets(SESSION_ASSETS));
    
    const unsub = subscribeToAssets((all) => {
        setGeneratedAssets(filterAssets(all));
    });
    
    // Auto-Prompt Generation Logic
    if (lead) {
        setIsAutoPrompting(true);
        // Instant feedback
        setMusicPrompt(`[AI DIRECTOR] Analyzing ${lead.businessName} brand DNA for sonic architecture...`);
        
        generateSonicPrompt(lead)
            .then(prompt => {
                setMusicPrompt(prompt);
                setVoiceText(`Welcome to ${lead.businessName}. We are the premier choice for ${lead.niche} in ${lead.city}. Contact us today to transform your future.`);
            })
            .catch(() => {
                // Fallback if AI fails
                setMusicPrompt(`Background music for ${lead.businessName} (${lead.niche}). Professional, high-quality, engaging, suitable for commercial use.`);
            })
            .finally(() => setIsAutoPrompting(false));
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
    const enhancers = ["high fidelity", "studio quality", "grammy award winning", "wide stereo", "warm analog warmth", "mixed and mastered"];
    setMusicPrompt(prev => `${prev}, ${enhancers.join(', ')}`);
    toast.neural("PROMPT ENHANCED WITH AUDIO ENGINEERING TAGS");
  };

  const toggleKeyword = (keyword: string) => {
    if (musicPrompt.includes(keyword)) {
        setMusicPrompt(prev => prev.replace(keyword, '').replace(', ,', ',').trim());
    } else {
        setMusicPrompt(prev => prev ? `${prev}, ${keyword}` : keyword);
    }
  };

  const handlePresetSelect = (p: typeof PRESETS[0]) => {
    setMusicPrompt(p.prompt);
  };

  const handleWriteLyrics = async () => {
    if (!lead) {
      toast.error("Please select a lead to generate lyrics.");
      return;
    }
    setIsWritingLyrics(true);
    try {
        const text = await generateLyrics(lead, musicPrompt, 'JINGLE');
        setVoiceText(text); // Auto-copy to voice input
        setIsInstrumental(false); // Assume vocal track needed
        setActiveTab('VOICE'); // Switch to see lyrics
        toast.success("Lyricsmith: Script Generated & Copied to Voice Engine");
    } catch (e) {
        console.error(e);
        toast.error("Failed to generate lyrics.");
    } finally {
        setIsWritingLyrics(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!voiceText) {
        toast.error("Please enter text for speech generation");
        return;
    }
    setIsGeneratingVoice(true);
    try {
        const result = await generateAudioPitch(voiceText, selectedVoice, lead?.id);
        if (result) {
            toast.success("Voice Generated Successfully");
        } else {
            throw new Error("Voice generation yielded no result");
        }
    } catch (e: any) {
        console.error("Voice Gen Error:", e);
        toast.error(`Voice Generation Failed: ${e.message || "Unknown Error"}`);
    } finally {
        setIsGeneratingVoice(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!musicPrompt) {
        toast.error("Music Prompt cannot be empty");
        return;
    }
    setIsGeneratingMusic(true);
    
    // Add artificial delay start to ensure UI updates
    const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
        const fullPrompt = musicPrompt;
        const [, result] = await Promise.all([
            minDelay,
            kieSunoService.runFullCycle(fullPrompt, isInstrumental, lead?.id, coverImage || undefined, targetDuration.val)
        ]);
        
        toast.success("Music Generation Complete");
    } catch (e: any) {
        console.error("Music Gen Error:", e);
        // Even on error, we might have fallen back to simulation in the service, but if it bubbles up:
        toast.error(`Generation Failed: ${e.message || "Service Unreachable"}`);
    } finally {
        setIsGeneratingMusic(false);
    }
  };

  const handleGenerateCover = async () => {
    setIsGeneratingCover(true);
    try {
        // FIX: Provide empty object fallback for lead to satisfy Partial<Lead> type
        const url = await generateVisual(
            `Album cover for ${lead?.businessName || 'Brand'}, ${musicPrompt}, minimal high design`, 
            lead || {} 
        );
        if (url) {
            setCoverImage(url);
            toast.success("Cover Art Generated");
        }
    } catch (e) {
        console.error("Cover Gen Error:", e);
        toast.error("Failed to generate cover art");
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

  const isGalleryMode = activeTab === 'GALLERY';

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
           {['MUSIC', 'VOICE', 'MIXER', 'GALLERY'].map(t => (
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

      <div className="grid grid-cols-12 gap-6 items-stretch min-h-[700px]">
        
        {/* --- LEFT RACK (Hidden in Gallery Mode) --- */}
        {!isGalleryMode && (
          <div className="col-span-3 flex flex-col gap-6">
              {activeTab === 'MUSIC' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                      <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-emerald-500">●</span> INDUSTRY PRESETS
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PRESETS.map(p => (
                              <button 
                                key={p.id} 
                                onClick={() => handlePresetSelect(p)}
                                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 p-3 rounded-xl flex flex-col items-center gap-2 transition-all group text-center"
                              >
                                <span className="text-xl group-hover:scale-110 transition-transform">{p.icon}</span>
                                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-emerald-400">{p.id}</span>
                              </button>
                            ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">GENRE DEFINITION</label>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map(g => (
                              <button 
                                key={g}
                                onClick={() => toggleKeyword(g)}
                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                                  musicPrompt.includes(g) 
                                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ATMOSPHERE</label>
                        <div className="flex flex-wrap gap-2">
                            {VIBES.map(v => (
                              <button 
                                key={v}
                                onClick={() => toggleKeyword(v)}
                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                                  musicPrompt.includes(v) 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                        </div>
                      </div>
                  </div>
              )}

              {activeTab === 'VOICE' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 block">VOICE MODEL</label>
                    <div className="grid grid-cols-1 gap-3">
                        {VOICES.map(v => (
                          <button
                            key={v}
                            onClick={() => setSelectedVoice(v)}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all group ${
                              selectedVoice === v 
                                ? 'bg-indigo-600 border-indigo-500 text-white' 
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest">{v}</span>
                            {selectedVoice === v && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                          </button>
                        ))}
                    </div>
                  </div>
              )}

              {activeTab === 'MIXER' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">DECK A: MUSIC</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                        <select 
                          className="w-full bg-[#020617] text-[10px] font-bold text-white border border-slate-800 rounded-xl px-3 py-3 outline-none focus:border-emerald-500"
                          onChange={(e) => setMixMusicId(e.target.value)}
                          value={mixMusicId || ''}
                        >
                          <option value="">-- Load Track --</option>
                          {generatedAssets.filter(a => a.metadata?.isInstrumental).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black text-slate-500">
                              <span>GAIN</span>
                              <span>{Math.round(musicVol * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="1" step="0.01" value={musicVol} onChange={(e) => setMusicVol(parseFloat(e.target.value))} className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-full appearance-none" />
                        </div>
                    </div>
                  </div>
              )}
          </div>
        )}

        {/* --- CENTER STAGE (Full Width in Gallery Mode) --- */}
        <div className={isGalleryMode ? "col-span-12 flex flex-col" : "col-span-6 flex flex-col"}>
           <div className="flex-1 bg-[#05091a] border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden relative">
              <SonicStudioPlayer 
                 assets={generatedAssets} 
                 onSetCover={(url) => {
                   setCoverImage(url);
                   toast.success("Cover Art Selected");
                 }}
                 exportFormat={exportFormat}
              />
           </div>
           
           {/* Mixer Transport Overlay (Only visible in Mixer Mode) */}
           {activeTab === 'MIXER' && (
              <div className="mt-6 flex justify-center">
                 <button 
                   onClick={() => setIsPlayingMix(!isPlayingMix)}
                   disabled={!mixMusicId && !mixVoiceId}
                   className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group border-4 border-slate-200 hover:border-white ring-4 ring-black/20"
                 >
                    {isPlayingMix ? (
                      <svg className="w-8 h-8 group-hover:text-rose-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-8 h-8 ml-1 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                 </button>
                 {/* Hidden Players */}
                 <audio ref={musicAudioRef} src={generatedAssets.find(a => a.id === mixMusicId)?.data} loop />
                 <audio ref={voiceAudioRef} src={generatedAssets.find(a => a.id === mixVoiceId)?.data} />
              </div>
           )}
        </div>

        {/* --- RIGHT RACK (Hidden in Gallery Mode) --- */}
        {!isGalleryMode && (
          <div className="col-span-3 flex flex-col gap-6">
              {activeTab === 'MUSIC' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SONIC PROMPT</label>
                            <div className="flex gap-1">
                              {isAutoPrompting && <span className="text-[8px] font-bold text-emerald-500 animate-pulse bg-emerald-500/10 px-2 rounded">AI DIRECTING...</span>}
                              <button onClick={handleMagicEnhance} className="text-[9px] font-bold text-indigo-400 hover:text-white uppercase tracking-widest flex items-center gap-1">
                                  ⚡ MAGIC WAND
                              </button>
                            </div>
                        </div>
                        <textarea 
                          value={musicPrompt}
                          onChange={(e) => setMusicPrompt(e.target.value)}
                          className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 h-40 resize-none shadow-inner custom-scrollbar"
                          placeholder={isAutoPrompting ? "AI is crafting your strategy..." : "Describe the sound..."}
                          disabled={isAutoPrompting}
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CONFIGURATION</label>
                        
                        {/* Duration */}
                        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                            {DURATIONS.map(d => (
                              <button
                                key={d.val}
                                onClick={() => setTargetDuration(d)}
                                className={`flex-1 py-2 text-[8px] font-black rounded transition-all ${targetDuration.val === d.val ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                {d.label.split(' ')[0]}
                              </button>
                            ))}
                        </div>

                        {/* Export */}
                        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-800">
                            {['MP3', 'WAV'].map((fmt) => (
                              <button
                                key={fmt}
                                onClick={() => setExportFormat(fmt as any)}
                                className={`flex-1 py-2 text-[8px] font-black rounded transition-all ${exportFormat === fmt ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                {fmt}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Cover Art Mini */}
                      <div 
                        onClick={() => coverInputRef.current?.click()}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-4 cursor-pointer group hover:border-emerald-500/50 transition-all"
                      >
                        <div className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-800 relative">
                            {coverImage ? <img src={coverImage} className="w-full h-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-lg grayscale opacity-50">💿</span>}
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-400">COVER ART</p>
                            <p className="text-[8px] text-slate-600 font-medium">CLICK TO CHANGE</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleGenerateCover(); }} className="text-[10px] p-2 hover:bg-slate-800 rounded-lg">🎨</button>
                        <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" />
                      </div>

                      <div className="mt-auto space-y-3 pt-6 border-t border-slate-800">
                        <button 
                          onClick={handleGenerateMusic}
                          disabled={isGeneratingMusic}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                          {isGeneratingMusic ? 'COMPOSING...' : 'GENERATE TRACK'}
                        </button>
                        <button 
                          onClick={handleWriteLyrics} 
                          disabled={isWritingLyrics}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-800"
                        >
                          {isWritingLyrics ? 'WRITING...' : 'LYRICSMITH AI'}
                        </button>
                      </div>
                  </div>
              )}

              {activeTab === 'VOICE' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-6">
                    <div className="flex-1 space-y-4 flex flex-col">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SCRIPT</label>
                        <textarea 
                          value={voiceText}
                          onChange={(e) => setVoiceText(e.target.value)}
                          className="flex-1 w-full bg-[#020617] border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 resize-none shadow-inner leading-relaxed custom-scrollbar"
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

              {activeTab === 'MIXER' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">DECK B: VOICE</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                        <select 
                          className="w-full bg-[#020617] text-[10px] font-bold text-white border border-slate-800 rounded-xl px-3 py-3 outline-none focus:border-indigo-500"
                          onChange={(e) => setMixVoiceId(e.target.value)}
                          value={mixVoiceId || ''}
                        >
                          <option value="">-- Load Voice --</option>
                          {generatedAssets.filter(a => !a.metadata?.isInstrumental).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black text-slate-500">
                              <span>GAIN</span>
                              <span>{Math.round(voiceVol * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="1" step="0.01" value={voiceVol} onChange={(e) => setVoiceVol(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-full appearance-none" />
                        </div>
                    </div>
                  </div>
              )}
          </div>
        )}

        {/* --- CENTER STAGE (Full Width in Gallery Mode) --- */}
        <div className={isGalleryMode ? "col-span-12 flex flex-col" : "col-span-6 flex flex-col"}>
           <div className="flex-1 bg-[#05091a] border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden relative">
              <SonicStudioPlayer 
                 assets={generatedAssets} 
                 onSetCover={(url) => {
                   setCoverImage(url);
                   toast.success("Cover Art Selected");
                 }}
                 exportFormat={exportFormat}
              />
           </div>
           
           {/* Mixer Transport Overlay (Only visible in Mixer Mode) */}
           {activeTab === 'MIXER' && (
              <div className="mt-6 flex justify-center">
                 <button 
                   onClick={() => setIsPlayingMix(!isPlayingMix)}
                   disabled={!mixMusicId && !mixVoiceId}
                   className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group border-4 border-slate-200 hover:border-white ring-4 ring-black/20"
                 >
                    {isPlayingMix ? (
                      <svg className="w-8 h-8 group-hover:text-rose-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-8 h-8 ml-1 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                 </button>
                 {/* Hidden Players */}
                 <audio ref={musicAudioRef} src={generatedAssets.find(a => a.id === mixMusicId)?.data} loop />
                 <audio ref={voiceAudioRef} src={generatedAssets.find(a => a.id === mixVoiceId)?.data} />
              </div>
           )}
        </div>

        {/* --- RIGHT RACK (Hidden in Gallery Mode) --- */}
        {!isGalleryMode && (
          <div className="col-span-3 flex flex-col gap-6">
              {activeTab === 'MUSIC' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SONIC PROMPT</label>
                            <div className="flex gap-1">
                              {isAutoPrompting && <span className="text-[8px] font-bold text-emerald-500 animate-pulse bg-emerald-500/10 px-2 rounded">AI DIRECTING...</span>}
                              <button onClick={handleMagicEnhance} className="text-[9px] font-bold text-indigo-400 hover:text-white uppercase tracking-widest flex items-center gap-1">
                                  ⚡ MAGIC WAND
                              </button>
                            </div>
                        </div>
                        <textarea 
                          value={musicPrompt}
                          onChange={(e) => setMusicPrompt(e.target.value)}
                          className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 h-40 resize-none shadow-inner custom-scrollbar"
                          placeholder={isAutoPrompting ? "AI is crafting your strategy..." : "Describe the sound..."}
                          disabled={isAutoPrompting}
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CONFIGURATION</label>
                        
                        {/* Duration */}
                        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                            {DURATIONS.map(d => (
                              <button
                                key={d.val}
                                onClick={() => setTargetDuration(d)}
                                className={`flex-1 py-2 text-[8px] font-black rounded transition-all ${targetDuration.val === d.val ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                {d.label.split(' ')[0]}
                              </button>
                            ))}
                        </div>

                        {/* Export */}
                        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-800">
                            {['MP3', 'WAV'].map((fmt) => (
                              <button
                                key={fmt}
                                onClick={() => setExportFormat(fmt as any)}
                                className={`flex-1 py-2 text-[8px] font-black rounded transition-all ${exportFormat === fmt ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                {fmt}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Cover Art Mini */}
                      <div 
                        onClick={() => coverInputRef.current?.click()}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-4 cursor-pointer group hover:border-emerald-500/50 transition-all"
                      >
                        <div className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-800 relative">
                            {coverImage ? <img src={coverImage} className="w-full h-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-lg grayscale opacity-50">💿</span>}
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-400">COVER ART</p>
                            <p className="text-[8px] text-slate-600 font-medium">CLICK TO CHANGE</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleGenerateCover(); }} className="text-[10px] p-2 hover:bg-slate-800 rounded-lg">🎨</button>
                        <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" />
                      </div>

                      <div className="mt-auto space-y-3 pt-6 border-t border-slate-800">
                        <button 
                          onClick={handleGenerateMusic}
                          disabled={isGeneratingMusic}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                          {isGeneratingMusic ? 'COMPOSING...' : 'GENERATE TRACK'}
                        </button>
                        <button 
                          onClick={handleWriteLyrics} 
                          disabled={isWritingLyrics}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-800"
                        >
                          {isWritingLyrics ? 'WRITING...' : 'LYRICSMITH AI'}
                        </button>
                      </div>
                  </div>
              )}

              {activeTab === 'VOICE' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-6">
                    <div className="flex-1 space-y-4 flex flex-col">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SCRIPT</label>
                        <textarea 
                          value={voiceText}
                          onChange={(e) => setVoiceText(e.target.value)}
                          className="flex-1 w-full bg-[#020617] border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 resize-none shadow-inner leading-relaxed custom-scrollbar"
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

              {activeTab === 'MIXER' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">DECK B: VOICE</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                        <select 
                          className="w-full bg-[#020617] text-[10px] font-bold text-white border border-slate-800 rounded-xl px-3 py-3 outline-none focus:border-indigo-500"
                          onChange={(e) => setMixVoiceId(e.target.value)}
                          value={mixVoiceId || ''}
                        >
                          <option value="">-- Load Voice --</option>
                          {generatedAssets.filter(a => !a.metadata?.isInstrumental).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black text-slate-500">
                              <span>GAIN</span>
                              <span>{Math.round(voiceVol * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="1" step="0.01" value={voiceVol} onChange={(e) => setVoiceVol(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-full appearance-none" />
                        </div>
                    </div>
                  </div>
              )}
          </div>
        )}

        {/* --- CENTER STAGE (Full Width in Gallery Mode) --- */}
        <div className={isGalleryMode ? "col-span-12 flex flex-col" : "col-span-6 flex flex-col"}>
           <div className="flex-1 bg-[#05091a] border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden relative">
              <SonicStudioPlayer 
                 assets={generatedAssets} 
                 onSetCover={(url) => {
                   setCoverImage(url);
                   toast.success("Cover Art Selected");
                 }}
                 exportFormat={exportFormat}
              />
           </div>
           
           {/* Mixer Transport Overlay (Only visible in Mixer Mode) */}
           {activeTab === 'MIXER' && (
              <div className="mt-6 flex justify-center">
                 <button 
                   onClick={() => setIsPlayingMix(!isPlayingMix)}
                   disabled={!mixMusicId && !mixVoiceId}
                   className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group border-4 border-slate-200 hover:border-white ring-4 ring-black/20"
                 >
                    {isPlayingMix ? (
                      <svg className="w-8 h-8 group-hover:text-rose-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-8 h-8 ml-1 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                 </button>
                 {/* Hidden Players */}
                 <audio ref={musicAudioRef} src={generatedAssets.find(a => a.id === mixMusicId)?.data} loop />
                 <audio ref={voiceAudioRef} src={generatedAssets.find(a => a.id === mixVoiceId)?.data} />
              </div>
           )}
        </div>

        {/* --- RIGHT RACK (Hidden in Gallery Mode) --- */}
        {!isGalleryMode && (
          <div className="col-span-3 flex flex-col gap-6">
              {activeTab === 'MUSIC' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SONIC PROMPT</label>
                            <div className="flex gap-1">
                              {isAutoPrompting && <span className="text-[8px] font-bold text-emerald-500 animate-pulse bg-emerald-500/10 px-2 rounded">AI DIRECTING...</span>}
                              <button onClick={handleMagicEnhance} className="text-[9px] font-bold text-indigo-400 hover:text-white uppercase tracking-widest flex items-center gap-1">
                                  ⚡ MAGIC WAND
                              </button>
                            </div>
                        </div>
                        <textarea 
                          value={musicPrompt}
                          onChange={(e) => setMusicPrompt(e.target.value)}
                          className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 h-40 resize-none shadow-inner custom-scrollbar"
                          placeholder={isAutoPrompting ? "AI is crafting your strategy..." : "Describe the sound..."}
                          disabled={isAutoPrompting}
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CONFIGURATION</label>
                        
                        {/* Duration */}
                        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                            {DURATIONS.map(d => (
                              <button
                                key={d.val}
                                onClick={() => setTargetDuration(d)}
                                className={`flex-1 py-2 text-[8px] font-black rounded transition-all ${targetDuration.val === d.val ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                {d.label.split(' ')[0]}
                              </button>
                            ))}
                        </div>

                        {/* Export */}
                        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-800">
                            {['MP3', 'WAV'].map((fmt) => (
                              <button
                                key={fmt}
                                onClick={() => setExportFormat(fmt as any)}
                                className={`flex-1 py-2 text-[8px] font-black rounded transition-all ${exportFormat === fmt ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                {fmt}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Cover Art Mini */}
                      <div 
                        onClick={() => coverInputRef.current?.click()}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-4 cursor-pointer group hover:border-emerald-500/50 transition-all"
                      >
                        <div className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-800 relative">
                            {coverImage ? <img src={coverImage} className="w-full h-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-lg grayscale opacity-50">💿</span>}
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-400">COVER ART</p>
                            <p className="text-[8px] text-slate-600 font-medium">CLICK TO CHANGE</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleGenerateCover(); }} className="text-[10px] p-2 hover:bg-slate-800 rounded-lg">🎨</button>
                        <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" />
                      </div>

                      <div className="mt-auto space-y-3 pt-6 border-t border-slate-800">
                        <button 
                          onClick={handleGenerateMusic}
                          disabled={isGeneratingMusic}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                          {isGeneratingMusic ? 'COMPOSING...' : 'GENERATE TRACK'}
                        </button>
                        <button 
                          onClick={handleWriteLyrics} 
                          disabled={isWritingLyrics}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-800"
                        >
                          {isWritingLyrics ? 'WRITING...' : 'LYRICSMITH AI'}
                        </button>
                      </div>
                  </div>
              )}

              {activeTab === 'VOICE' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-6">
                    <div className="flex-1 space-y-4 flex flex-col">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SCRIPT</label>
                        <textarea 
                          value={voiceText}
                          onChange={(e) => setVoiceText(e.target.value)}
                          className="flex-1 w-full bg-[#020617] border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 resize-none shadow-inner leading-relaxed custom-scrollbar"
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

              {activeTab === 'MIXER' && (
                  <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-6 shadow-xl h-full flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">DECK B: VOICE</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                        <select 
                          className="w-full bg-[#020617] text-[10px] font-bold text-white border border-slate-800 rounded-xl px-3 py-3 outline-none focus:border-indigo-500"
                          onChange={(e) => setMixVoiceId(e.target.value)}
                          value={mixVoiceId || ''}
                        >
                          <option value="">-- Load Voice --</option>
                          {generatedAssets.filter(a => !a.metadata?.isInstrumental).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black text-slate-500">
                              <span>GAIN</span>
                              <span>{Math.round(voiceVol * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="1" step="0.01" value={voiceVol} onChange={(e) => setVoiceVol(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-full appearance-none" />
                        </div>
                    </div>
                  </div>
              )}
          </div>
        )}

      </div>
    </div>
  );
};
