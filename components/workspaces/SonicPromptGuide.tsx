
import React from 'react';

interface SonicPromptGuideProps {
  onClose: () => void;
  onSelect: (template: string) => void;
}

export const SonicPromptGuide: React.FC<SonicPromptGuideProps> = ({ onClose, onSelect }) => {
  const TEMPLATES = [
    {
      label: 'The "Sticky" Jingle',
      desc: '15s-30s | Brand Intros, TikTok Hooks',
      prompt: 'Short catchy [Genre] jingle, bright and punchy, distinct melody, [Instrument] lead, positive resolution, radio-ready advertising style.'
    },
    {
      label: 'Retail/Office Ambiance',
      desc: 'Looping | Background, Website Beds',
      prompt: 'Lo-fi [Genre] background music, repetitive and hypnotic, unobtrusive, [Texture] textures, steady rhythm, relax/study vibe, warm EQ.'
    },
    {
      label: 'The "High-Ticket" Luxury',
      desc: 'Slow | Real Estate, Consulting, Fashion',
      prompt: 'Sophisticated [Genre], minimal and elegant, sparse instrumentation, [Instrument] solo, expensive atmosphere, cinematic swelling, slow tempo.'
    },
    {
      label: 'High-Energy Promo',
      desc: 'Fast | Hype, Trailers, Flash Sales',
      prompt: 'High-octane [Genre], aggressive and driving, heavy [Instrument], fast tempo [BPM], epic drops, stadium anthem style, motivation.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-[#0b1021] border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-[#05091a]">
          <div>
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
              SONIC <span className="text-emerald-500">ARCHITECTURE</span> GUIDE
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">
              PROSPECTOR OS AUDIO DIRECTIVE
            </p>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
            CLOSE GUIDE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          
          {/* Section 1: Formula */}
          <div className="space-y-4">
            <h3 className="text-[12px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              THE PERFECT PROMPT FORMULA
            </h3>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-2 text-sm font-mono text-slate-300">
              <span className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-1 rounded text-indigo-300">[Genre/Sub-genre]</span>
              <span>+</span>
              <span className="bg-purple-900/30 border border-purple-500/30 px-3 py-1 rounded text-purple-300">[Mood/Vibe]</span>
              <span>+</span>
              <span className="bg-emerald-900/30 border border-emerald-500/30 px-3 py-1 rounded text-emerald-300">[Key Instruments]</span>
              <span>+</span>
              <span className="bg-amber-900/30 border border-amber-500/30 px-3 py-1 rounded text-amber-300">[Tempo]</span>
              <span>+</span>
              <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded text-slate-300">[Production Style]</span>
            </div>
          </div>

          {/* Section 2: Strategic Templates */}
          <div className="space-y-4">
            <h3 className="text-[12px] font-black text-white uppercase tracking-widest">STRATEGIC TEMPLATES</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((t, i) => (
                <div 
                  key={i} 
                  onClick={() => onSelect(t.prompt)}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-900/10 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400">{t.label}</h4>
                    <span className="text-[8px] font-black bg-slate-950 px-2 py-1 rounded text-slate-500 uppercase tracking-widest">{t.desc}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed group-hover:text-slate-300">
                    "{t.prompt}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Parameters */}
          <div className="space-y-4">
            <h3 className="text-[12px] font-black text-white uppercase tracking-widest">SONIC PARAMETER RANGES</h3>
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Parameter</th>
                    <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Low Range Keywords</th>
                    <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">High Range Keywords</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-[10px] font-medium text-slate-300">
                  <tr>
                    <td className="p-4 font-bold text-emerald-400">TEMPO</td>
                    <td className="p-4">Downtempo, Ballad, Lento, 70 BPM</td>
                    <td className="p-4">Breakneck, Speed, Drum & Bass, 170 BPM</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-emerald-400">DENSITY</td>
                    <td className="p-4">Sparse, Minimal, Acoustic, Stripped-back</td>
                    <td className="p-4">Wall of sound, Orchestral, Chaos, Dense</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-emerald-400">TEXTURE</td>
                    <td className="p-4">Dry, Clean, Studio, Tight</td>
                    <td className="p-4">Wet, Reverb-heavy, Ethereal, Lo-fi</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Good vs Weak */}
          <div className="space-y-4">
            <h3 className="text-[12px] font-black text-white uppercase tracking-widest">QUALITY CONTROL</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 opacity-60">
                <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                  <span>❌</span> WEAK PROMPT
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 italic">
                  "Jazz music for a coffee shop."
                </div>
                <p className="text-[9px] text-slate-600">Result: Generic, elevator music.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  <span>✅</span> STRONG PROMPT
                </div>
                <div className="p-4 bg-emerald-900/10 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-100 italic">
                  "Smoky Parisian jazz cafe ambiance, brush drums, upright bass, acoustic piano trio, warm and cozy atmosphere, vintage recording style."
                </div>
                <p className="text-[9px] text-slate-500">Result: Specific, atmospheric, character-rich.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
