
import React from 'react';
import { Lead } from '../types';

interface DashboardProps {
  leads: Lead[];
  onSelectLead: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ leads, onSelectLead }) => {
  const metrics = [
    { label: 'Total Scanned', value: leads.length, icon: '🔍', color: 'indigo' },
    { label: 'High Potential', value: leads.filter(l => l.assetGrade === 'A').length, icon: '💎', color: 'amber' },
    { label: 'Avg Lead Score', value: leads.length ? Math.round(leads.reduce((a, b) => a + b.leadScore, 0) / leads.length) : 0, icon: '📈', color: 'emerald' },
    { label: 'Active Missions', value: 4, icon: '⚔️', color: 'rose' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Mission Control</h2>
        <p className="text-slate-400 mt-1">Operational overview of current intelligence theater.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${m.color}-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="text-3xl">{m.icon}</div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{m.label}</p>
                <p className="text-3xl font-black text-white mt-1">{m.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Recent High-Grade Targets
              </h3>
              <button className="text-xs text-indigo-400 font-bold hover:underline">View All</button>
            </div>
            <div className="divide-y divide-slate-800">
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                      {lead.businessName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">{lead.businessName}</p>
                      <p className="text-xs text-slate-500">{lead.niche} • {lead.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-100">{lead.leadScore}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Score</p>
                    </div>
                    <button 
                      onClick={() => onSelectLead(lead.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500"
                    >
                      Enter War Room
                    </button>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="p-20 text-center text-slate-500 italic">
                  No intelligence gathered yet. Start a Discovery Mission.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Theater Status</h3>
            <div className="space-y-4">
              {[
                { label: 'Reconnaissance', status: 'Active', color: 'indigo' },
                { label: 'Strategic Drafting', status: 'Standby', color: 'slate' },
                { label: 'Production Pipeline', status: 'Generating', color: 'amber' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs font-medium text-slate-400">{s.label}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest text-${s.color}-400 bg-${s.color}-400/10 px-2 py-1 rounded`}>
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
