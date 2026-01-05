
import React, { useMemo, useState, useEffect } from 'react';
import { Lead } from '../../types';
import { analyzeLedger } from '../../services/geminiService';

interface AnalyticsHubProps {
  leads: Lead[];
}

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({ leads }) => {
  const [analysis, setAnalysis] = useState<{ risk: string; opportunity: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const gradeA = leads.filter(l => l.assetGrade === 'A').length;
    const pipelineValue = leads.reduce((acc, l) => {
      if (l.assetGrade === 'A') return acc + 50000;
      if (l.assetGrade === 'B') return acc + 20000;
      return acc + 5000;
    }, 0);
    const leakage = leads.reduce((acc, l) => acc + (100 - l.leadScore) * 1000, 0);
    const avgScore = totalLeads ? Math.round(leads.reduce((a, b) => a + b.leadScore, 0) / totalLeads) : 0;
    return {
      totalLeads,
      gradeA,
      pipelineValue: (pipelineValue / 1000000).toFixed(1),
      leakage: (leakage / 1000000).toFixed(1),
      dominance: avgScore
    };
  }, [leads]);

  useEffect(() => {
    if (leads.length > 0 && !analysis) {
      const runAnalysis = async () => {
        setIsLoading(true);
        try {
          const result = await analyzeLedger(leads);
          setAnalysis(result);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      runAnalysis();
    }
  }, [leads]);

  const metrics = [
    { label: 'TOTAL PIPELINE VALUE', val: `€${stats.pipelineValue}M`, sub: 'CALCULATED FROM DATABASE' },
    { label: 'TOTAL REVENUE GAP', val: `€${stats.leakage}M`, sub: 'EST. OPPORTUNITY COST' },
    { label: 'HIGH-PROB LEADS', val: stats.gradeA.toString(), sub: 'GRADE-A LEAD DENSITY', dark: true },
    { label: 'MARKET INDEX', val: `${stats.dominance}%`, sub: 'MEAN PROSPECT READINESS', indigo: true },
  ];

  return (
    <div className="max-w-[1550px] mx-auto py-10 space-y-16 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold uppercase tracking-tight text-white leading-none">MARKET <span className="text-emerald-500">ANALYTICS</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic">AGGREGATE INTELLIGENCE FOR {leads.length} ACTIVE RECORDS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {metrics.map((m, i) => (
          <div key={i} className={`p-10 rounded-[48px] border flex flex-col space-y-4 shadow-2xl transition-all hover:scale-[1.03] ${m.indigo ? 'bg-emerald-600 border-emerald-500' : m.dark ? 'bg-[#020617] border-slate-800' : 'bg-[#0b1021] border-slate-800'}`}>
             <p className={`text-[10px] font-black uppercase tracking-widest ${m.indigo ? 'text-emerald-200' : 'text-slate-500'}`}>{m.label}</p>
             <h3 className={`text-5xl font-black italic tracking-tighter ${m.indigo ? 'text-white' : 'text-white'}`}>{m.val}</h3>
             <p className={`text-[8px] font-black uppercase tracking-widest ${m.indigo ? 'text-emerald-300' : 'text-emerald-400'}`}>{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-12">
           <h3 className="text-lg font-black italic text-white uppercase tracking-widest">REVENUE CAPTURE PROJECTION</h3>
           <div className="space-y-12">
              {[
                { l: 'Q1 AI ONBOARDING', v: Math.min(stats.dominance + 10, 100), c: 'bg-emerald-600' },
                { l: 'Q2 FUNNEL OPTIMIZATION', v: Math.min(stats.dominance + 25, 100), c: 'bg-emerald-500' },
                { l: 'Q3 CATEGORY DOMINANCE', v: Math.min(stats.dominance + 40, 100), c: 'bg-emerald-400' }
              ].map((p, i) => (
                <div key={i} className="space-y-4 group">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">{p.l}</span>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{p.v}%</span>
                   </div>
                   <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${p.c}`} style={{ width: `${p.v}%` }}></div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-5 bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-12">
           <h3 className="text-lg font-black italic text-white uppercase tracking-widest">MARKET RISK ANALYSIS</h3>
           <div className="space-y-6">
              <div className="bg-[#020617] border border-slate-800 p-8 rounded-3xl flex gap-8 group hover:border-rose-500/30 transition-all">
                 <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all text-xl font-bold italic">
                    {isLoading ? <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div> : '!'}
                 </div>
                 <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                   {isLoading ? "CALCULATING RISK VECTOR..." : analysis?.risk || "DATA INSUFFICIENT FOR RISK ANALYSIS."}
                 </p>
              </div>
              <div className="bg-[#020617] border border-slate-800 p-8 rounded-3xl flex gap-8 group hover:border-emerald-500/30 transition-all">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all text-xl font-bold">
                    {isLoading ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : '✓'}
                 </div>
                 <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                   {isLoading ? "IDENTIFYING OPPORTUNITY..." : analysis?.opportunity || "DATA INSUFFICIENT FOR OPPORTUNITY."}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
