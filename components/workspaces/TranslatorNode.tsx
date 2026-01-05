
import React, { useState } from 'react';
import { translateTactical } from '../../services/geminiService';

export const TranslatorNode: React.FC = () => {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('GERMAN');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text) return;
    setIsLoading(true);
    try {
      const translated = await translateTactical(text, lang);
      setResult(translated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">TRANS <span className="text-emerald-600 not-italic">LATOR</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Tactical Theater Localization</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-10 relative overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payload Source</label>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm font-bold text-slate-300 focus:outline-none focus:border-emerald-500 h-48 resize-none shadow-xl italic"
                    placeholder="Enter outreach copy..."
                  />
               </div>
               <div className="flex gap-4">
                  <select 
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-slate-300 focus:outline-none focus:border-emerald-500 uppercase tracking-widest"
                  >
                    <option value="GERMAN">GERMAN</option>
                    <option value="FRENCH">FRENCH</option>
                    <option value="ARABIC">ARABIC</option>
                    <option value="SPANISH">SPANISH</option>
                    <option value="JAPANESE">JAPANESE</option>
                  </select>
                  <button 
                    onClick={handleTranslate}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border border-emerald-400/20"
                  >
                    {isLoading ? 'SYNCING...' : 'LOCALIZE'}
                  </button>
               </div>
            </div>

            <div className="bg-[#020617] border border-slate-800 rounded-[32px] p-8 min-h-[250px] relative overflow-hidden">
               {isLoading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Linguistic Mesh processing...</p>
                 </div>
               ) : result ? (
                 <div className="text-slate-300 text-sm leading-relaxed font-medium italic">
                    {result}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                    <span className="text-4xl">🌐</span>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Target translation ready</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};
