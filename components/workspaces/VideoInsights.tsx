
import React, { useState } from 'react';
import { Lead } from '../../types';
import { analyzeVideoUrl } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

export const VideoInsights: React.FC<{ lead?: Lead }> = ({ lead }) => {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsLoading(true);
    try {
      const result = await analyzeVideoUrl(url, "EXECUTIVE DECONSTRUCTION", lead?.id);
      setAnalysis(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <h1 className="text-4xl font-bold uppercase text-white">VIDEO <span className="text-emerald-500">INSIGHTS</span></h1>
      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-10 shadow-2xl">
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-8 py-6 text-white mb-6" placeholder="Video URL..." />
        <button onClick={handleAnalyze} className="bg-emerald-600 px-8 py-4 rounded-xl text-xs font-black text-white">GENERATE INSIGHTS</button>
        {analysis && <div className="mt-8 p-10 bg-slate-900 rounded-3xl"><FormattedOutput content={analysis} /></div>}
      </div>
    </div>
  );
};
