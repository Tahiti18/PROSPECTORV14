
import React, { useState, useRef } from 'react';
import { Lead } from '../../types';
import { analyzeVisual } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

export const VisualAnalysis: React.FC<{ lead?: Lead }> = ({ lead }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const base64 = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const result = await analyzeVisual(base64, mimeType, "Audit this asset.");
      setAnalysis(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <h1 className="text-4xl font-bold uppercase text-white">VISUAL <span className="text-emerald-500">ANALYSIS</span></h1>
      <div className="grid grid-cols-2 gap-10">
         <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 rounded-3xl aspect-video flex items-center justify-center cursor-pointer overflow-hidden">
            {image ? <img src={image} className="w-full h-full object-cover" /> : "Upload Image"}
            <input type="file" ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => setImage(ev.target?.result as string);
                reader.readAsDataURL(file);
              }
            }} className="hidden" />
         </div>
         <div className="bg-[#0b1021] p-10 rounded-3xl border border-slate-800 min-h-[400px]">
            <button onClick={handleAnalyze} className="mb-6 bg-emerald-600 px-6 py-3 rounded-lg text-xs font-black text-white">START AUDIT</button>
            {analysis && <FormattedOutput content={analysis} />}
         </div>
      </div>
    </div>
  );
};
