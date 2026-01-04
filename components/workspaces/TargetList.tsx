
import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { RunStatus } from '../automation/RunStatus';

export const TargetList: React.FC<{ leads: Lead[], lockedLeadId: string | null, onLockLead: (id: string) => void, onInspect: (id: string) => void }> = ({ leads, lockedLeadId, onLockLead, onInspect }) => {
  const [sortKey, setSortKey] = useState('rank');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  
  const sortedLeads = useMemo(() => [...leads].sort((a, b) => (a as any)[sortKey] > (b as any)[sortKey] ? 1 : -1), [leads, sortKey]);

  const handleOneClickRun = async () => {
    try {
      const run = await AutomationOrchestrator.getInstance().startRun();
      setActiveRunId(run.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-10 py-6 max-w-[1550px] mx-auto relative px-4 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <h3 className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">TARGET <span className="text-indigo-600 not-italic opacity-30">LEDGER</span></h3>
        <button 
          onClick={handleOneClickRun}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 border-b-4 border-indigo-700 flex items-center gap-3"
        >
          <span className="text-xl">⚡</span>
          RUN BEST LEAD (AUTO)
        </button>
      </div>

      <div className="bg-white dark:bg-[#0b1021]/95 border border-slate-200 dark:border-slate-800 rounded-[48px] overflow-hidden shadow-2xl relative transition-colors">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#080d1e]">
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">RANK</th>
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">IDENTITY</th>
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">SCORE</th>
              <th className="w-72 px-10 py-8"></th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead) => (
              <tr key={lead.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-500 ${lead.locked ? 'opacity-50 grayscale' : ''}`}>
                <td className="px-10 py-8 text-xl font-black text-slate-900 dark:text-white italic group-hover:text-indigo-600 transition-colors">#{lead.rank}</td>
                <td className="px-10 py-8">
                  <div className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{lead.businessName}</div>
                  {lead.locked && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">LOCKED BY RUN {lead.lockedByRunId?.slice(0,6)}</span>}
                </td>
                <td className="px-10 py-8 text-4xl font-black italic text-slate-800 dark:text-white opacity-70 group-hover:opacity-100 transition-all">{lead.leadScore}</td>
                <td className="px-10 py-8 text-right">
                  <button onClick={() => onInspect(lead.id)} className="p-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl hover:bg-indigo-600 transition-all shadow-2xl active:scale-90 border-2 border-white/10">WAR ROOM</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeRunId && <RunStatus runId={activeRunId} onClose={() => {
        setActiveRunId(null);
        // Force simple reload to reflect lock status since we modified localStorage directly
        window.location.reload(); 
      }} />}
    </div>
  );
};
