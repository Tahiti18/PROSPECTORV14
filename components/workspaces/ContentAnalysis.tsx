
import React, { useState } from 'react';
import { Lead } from '../../types';
import { synthesizeArticle } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

export const ContentAnalysis: React.FC<{ lead?: Lead }> = ({ lead }) => {
  const [source, setSource] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSynthesize = async () => {
    if (!source) return;
    setIsLoading(true);
    try {
      const result = await synthesizeArticle(source, "STRATEGY AUDIT");
      setOutput(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <h1 className="text-4xl font-bold uppercase text-white">CONTENT <span className="text-emerald-500">ANALYSIS</span></h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <textarea value={source} onChange={(e) => setSource(e.target.value)} className="bg-[#020617] border border-slate-800 rounded-3xl p-8 text-white h-64" placeholder="Input source data..." />
        <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-10">
          <button onClick={handleSynthesize} className="bg-emerald-600 px-8 py-4 rounded-xl text-xs font-black text-white mb-6">RUN ANALYSIS</button>
          {output && <FormattedOutput content={output} />}
        </div>
      </div>
    </div>
  );
};
