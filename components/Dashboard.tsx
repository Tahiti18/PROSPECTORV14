
import React from 'react';
import { Lead } from '../types';

interface DashboardProps {
  leads: Lead[];
  onSelectLead: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ leads, onSelectLead }) => {
  const metrics = [
    { label: 'Total Scanned', value: leads.length, icon: '🔍', color: 'emerald' },
    { label: 'High Potential', value: leads.filter(l => l.assetGrade === 'A').length, icon: '💎', color: 'emerald' },
    { label: 'Avg Lead Score', value: leads.length ? Math.round(leads.reduce((a, b) => a + b.leadScore, 0) / leads.length) : 0, icon: '📈', color: 'emerald' },
    { label: 'Active Missions', value: 4, icon: '⚔️', color: 'emerald' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Mission Control</h2>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Operational overview of current intelligence theater.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-[#0b1021] border border-slate-800 p-6 rounded-[24px] relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${m.color}-500/10 rounded-full blur-2xl group-hover:bg-${m.color}-500/20 transition-all duration-700`}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="text-3xl">{m.icon}</div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
                <p className="text-3xl font-black text-white mt-1 italic tracking-tighter">{m.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#05091a]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Recent High-Grade Targets
              </h3>
              <button className="text-[9px] text-emerald-400 font-black uppercase tracking-widest hover:text-white transition-colors">View All</button>
            </div>
            <div className="divide-y divide-slate-800">
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="p-5 hover:bg-slate-900/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500 transition-all">
                      {lead.businessName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200 group-hover:text-white uppercase tracking-tight">{lead.businessName}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{lead.niche} • {lead.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-sm font-black italic tracking-tighter ${lead.leadScore > 80 ? 'text-emerald-400' : 'text-slate-400'}`}>{lead.leadScore}</p>
                      <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Score</p>
                    </div>
                    <button 
                      onClick={() => onSelectLead(lead.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-6 py-2 bg-emerald-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                    >
                      Enter War Room
                    </button>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center justify-center opacity-30">
                  <span className="text-4xl mb-4">📡</span>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No intelligence gathered yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-xl">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Theater Status</h3>
            <div className="space-y-4">
              {[
                { label: 'Reconnaissance', status: 'Active', color: 'emerald' },
                { label: 'Strategic Drafting', status: 'Standby', color: 'slate' },
                { label: 'Production Pipeline', status: 'Generating', color: 'emerald' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest text-${s.color}-400 bg-${s.color}-900/20 px-3 py-1 rounded-lg border border-${s.color}-500/20`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
