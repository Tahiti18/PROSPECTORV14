import React, { useState } from 'react';
import { Lead } from '../../types';
import { performFactCheck } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface FactCheckProps {
  lead?: Lead;
}

export const FactCheck: React.FC<FactCheckProps> = ({ lead }) => {
  const [claim, setClaim] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!lead || !claim) return;
    setIsLoading(true);
    try {
      const data = await performFactCheck(lead, claim);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Verification Node</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">FACT <span className="text-emerald-600 not-italic">CHECK</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Grounded Verification for {lead.businessName}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-12 space-y-10 shadow-2xl">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Claim to Verify</label>
          <div className="flex gap-4">
            <input 
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
              placeholder="e.g. They recently expanded to a second location, They are struggling with bad PR..."
            />
            <button 
              onClick={handleVerify}
              disabled={isLoading || !claim}
              className="bg-emerald-600 hover:bg-emerald-500 px-10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'VERIFYING...' : 'INITIATE SCAN'}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="h-64 bg-slate-950/50 border border-slate-800 border-dashed rounded-[32px] flex flex-col items-center justify-center space-y-6">
             <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
             <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] animate-pulse">Consulting Grounded Search Vectors...</p>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-6">
                <div className={`px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest border ${
                  result.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                  result.status === 'Disputed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {result.status}
                </div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Status Assessment</h3>
             </div>

             <div className="bg-slate-950 p-10 rounded-[32px] border border-slate-800/60 overflow-hidden">
                <FormattedOutput content={result.evidence} />
             </div>

             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Verifiable Sources</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {result.sources?.map((s: any, i: number) => (
                     <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/40 transition-all group">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest truncate group-hover:text-emerald-400 transition-colors">{s.title}</p>
                        <p className="text-[8px] text-slate-600 font-bold truncate mt-1 italic">{s.uri}</p>
                     </a>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
