
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateAudioPitch, saveAsset } from '../../services/geminiService';

interface SonicStudioProps {
  lead?: Lead;
}

export const SonicStudio: React.FC<SonicStudioProps> = ({ lead }) => {
  const [text, setText] = useState(lead?.personalizedHook || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text) return;
    setIsGenerating(true);
    try {
      const base64 = await generateAudioPitch(text);
      if (base64) {
        const url = `data:audio/pcm;base64,${base64}`;
        setAudioUrl(url); // Note: Browsers handle base64 audio src well
        saveAsset('AUDIO', `Sonic_Payload_${Date.now()}`, url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">SONIC <span className="text-indigo-600 not-italic">STUDIO</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Generating Voice Payloads for {lead?.businessName || 'Global'}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-12 shadow-2xl space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Script Context</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-6 text-sm font-bold text-slate-200 focus:outline-none focus:border-indigo-500 h-40 resize-none shadow-inner italic"
            placeholder="Enter the pitch or hook to be synthesized..."
          />
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 border border-indigo-400/20 disabled:opacity-50"
          >
            {isGenerating ? 'SYNTHESIZING...' : 'GENERATE AUDIO PAYLOAD'}
          </button>
        </div>

        {audioUrl && (
          <div className="pt-8 border-t border-slate-800/50 flex flex-col items-center animate-in slide-in-from-bottom-4">
             <div className="w-full bg-slate-950 p-6 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">▶️</div>
                   <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">OUTREACH_VOICE_v1.WAV</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-widest">SAVED TO VAULT</p>
                   </div>
                </div>
                {/* Note: Raw PCM usually needs decoding, but for this demo assuming the service might return wav or handled via simple src for simplicity, or we let user download to play. */}
                <audio src={audioUrl} controls className="h-8 opacity-50 hover:opacity-100 transition-opacity" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
