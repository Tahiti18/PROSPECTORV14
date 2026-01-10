import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateROIReport } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface ROICalcProps {
  leads: Lead[];
}

export const ROICalc: React.FC<ROICalcProps> = ({ leads }) => {
  const [ltv, setLtv] = useState(5000);
  const [leadsCount, setLeadsCount] = useState(100);
  const [convRate, setConvRate] = useState(2);
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const revenue = (leadsCount * (convRate / 100)) * ltv;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const text = await generateROIReport(ltv, leadsCount, convRate);
      setReport(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">ROI <span className="text-emerald-600 not-italic">PROJECTION</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Quantifying AI Transformation Value</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-12 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avg Product/Service LTV ($)</label>
             <input type="number" value={ltv} onChange={e => setLtv(parseInt(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Lead Volume</label>
             <input type="number" value={leadsCount} onChange={e => setLeadsCount(parseInt(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">AI Conv. Lift (%)</label>
             <input type="range" min="0.5" max="15" step="0.5" value={convRate} onChange={e => setConvRate(parseFloat(e.target.value))} className="w-full accent-emerald-600" />
             <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1"><span>{convRate}% TARGETED LIFT</span></div>
          </div>
        </div>

        <div className="bg-[#05091a] rounded-[32px] border border-slate-800/60 p-10 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">PROJECTED REVENUE INCREASE</span>
           <h2 className="text-5xl font-black italic text-emerald-400 tracking-tighter relative z-10">${revenue.toLocaleString()}</h2>
           
           <button 
             onClick={handleGenerateReport}
             disabled={isGenerating}
             className="mt-8 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all relative z-10 disabled:opacity-50"
           >
             {isGenerating ? 'ANALYZING...' : 'GENERATE AI REPORT'}
           </button>

           {/* Background glow for effect */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        </div>
      </div>

      {report && (
        <div className="mt-8 bg-slate-900 border border-slate-800 p-8 rounded-[32px] animate-in slide-in-from-bottom-4 duration-700">
           <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">EXECUTIVE SUMMARY</h3>
           <FormattedOutput content={report} />
        </div>
      )}
    </div>
  );
};
