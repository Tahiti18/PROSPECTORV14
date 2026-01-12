
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateFlashSparks } from '../../services/geminiService';

export const ContentIdeation: React.FC<{ lead?: Lead }> = ({ lead }) => {
  const [sparks, setSparks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleForge = async () => {
    if (!lead) return;
    setIsLoading(true);
    try {
      const result = await generateFlashSparks(lead);
      setSparks(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black uppercase text-white">CONTENT <span className="text-emerald-600">IDEATION</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sparks.map((s, i) => (
          <div key={i} className="bg-[#0b1021] border border-slate-800 p-8 rounded-3xl text-slate-300 font-bold italic">"{s}"</div>
        ))}
      </div>
      <button onClick={handleForge} className="bg-emerald-600 px-10 py-5 rounded-2xl text-xs font-black text-white">SPARK IDEAS</button>
    </div>
  );
};
