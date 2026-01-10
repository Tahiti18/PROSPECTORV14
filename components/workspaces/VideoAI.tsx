import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { critiqueVideoPresence } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface VideoAIProps {
  lead?: Lead;
}

export const VideoAI: React.FC<VideoAIProps> = ({ lead }) => {
  const [audit, setAudit] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const runAudit = async () => {
      setIsLoading(true);
      try {
        const result = await critiqueVideoPresence(lead);
        setAudit(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    runAudit();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Required for Video Audit Initiation</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white">VIDEO <span className="text-emerald-600">AUDIT</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Cinematic Audit for {lead.businessName}</p>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-12 shadow-2xl relative min-h-[500px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
             <div className="w-1.5 h-16 bg-emerald-500/20 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500 animate-[progress_2s_infinite]"></div>
             </div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse">Scouring Global Video Indexes...</p>
          </div>
        ) : (
          <FormattedOutput content={audit} />
        )}
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
};
