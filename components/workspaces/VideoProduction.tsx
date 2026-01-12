
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateVideoPayload } from '../../services/geminiService';

export const VideoProduction: React.FC<{ lead?: Lead }> = ({ lead }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleForge = async () => {
    setIsGenerating(true);
    try {
      await generateVideoPayload(prompt, lead?.id);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-700">
      <h1 className="text-4xl font-black uppercase text-white">VIDEO <span className="text-emerald-500">PRODUCTION</span></h1>
      <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full h-40 bg-slate-950 border border-slate-800 rounded-3xl p-6 text-white mb-6" placeholder="Direct the video..." />
        <button onClick={handleForge} className="bg-emerald-600 px-10 py-5 rounded-2xl text-xs font-black text-white">INITIATE PRODUCTION</button>
      </div>
    </div>
  );
};
