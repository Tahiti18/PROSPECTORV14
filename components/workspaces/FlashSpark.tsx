import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateFlashSparks, saveAsset } from '../../services/geminiService';

interface FlashSparkProps {
  lead?: Lead;
}

export const FlashSpark: React.FC<FlashSparkProps> = ({ lead }) => {
  const [sparks, setSparks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedIndexes, setSavedIndexes] = useState<number[]>([]);

  const handleForge = async () => {
    if (!lead) return;
    setIsLoading(true);
    setSavedIndexes([]); // Reset saved status on new gen
    try {
      const result = await generateFlashSparks(lead);
      setSparks(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSpark = (spark: string, index: number) => {
    if (!lead) return;
    saveAsset('TEXT', `SPARK_${index+1}: ${spark.slice(0, 20)}...`, spark, 'FLASH_SPARK', lead.id);
    setSavedIndexes(prev => [...prev, index]);
  };

  useEffect(() => {
    if (lead && sparks.length === 0) handleForge();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Flash Sparks</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">FLASH <span className="text-emerald-600 not-italic">SPARK</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Rapid Content Velocity for {lead.businessName}</p>
        </div>
        <button 
          onClick={handleForge}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border border-emerald-400/20"
        >
          {isLoading ? 'SPARKING...' : 'RE-GENERATE SPARKS'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3,4,5,6].map(i => (
            <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse"></div>
          ))
        ) : sparks.map((s, i) => (
          <div key={i} className="bg-[#0b1021] border border-slate-800 p-8 rounded-[32px] hover:border-emerald-500/40 transition-all group relative overflow-hidden flex flex-col">
             <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-600/5 blur-[30px] rounded-full"></div>
             <div className="flex flex-col h-full justify-between flex-1">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">SPARK_ID: {i+1}</span>
                <p className="text-slate-200 text-lg font-black italic tracking-tight uppercase leading-snug group-hover:text-white transition-colors flex-1">
                  "{s}"
                </p>
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="text-[8px] font-black text-emerald-400 hover:text-white uppercase tracking-widest">DEPLOY →</button>
                   <button 
                     onClick={() => handleSaveSpark(s, i)}
                     disabled={savedIndexes.includes(i)}
                     className={`text-[8px] font-black uppercase tracking-widest transition-colors ${savedIndexes.includes(i) ? 'text-emerald-500' : 'text-slate-600 hover:text-white'}`}
                   >
                     {savedIndexes.includes(i) ? 'SAVED ✓' : 'SAVE TO VAULT'}
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};