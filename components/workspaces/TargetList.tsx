
import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { RunStatus } from '../automation/RunStatus';

export const TargetList: React.FC<{ leads: Lead[], lockedLeadId: string | null, onLockLead: (id: string) => void, onInspect: (id: string) => void }> = ({ leads, lockedLeadId, onLockLead, onInspect }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' }>({ key: 'leadScore', direction: 'desc' });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  
  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      // @ts-ignore
      const aVal = a[sortConfig.key] || '';
      // @ts-ignore
      const bVal = b[sortConfig.key] || '';
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [leads, sortConfig]);

  const handleSort = (key: keyof Lead) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleOneClickRun = async () => {
    try {
      const run = await AutomationOrchestrator.getInstance().startRun();
      setActiveRunId(run.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-[1550px] mx-auto relative px-4 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <h3 className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">TARGET <span className="text-indigo-600 not-italic opacity-50">LEDGER</span></h3>
        <button 
          onClick={handleOneClickRun}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 border-b-4 border-indigo-700 flex items-center gap-3"
        >
          <span className="text-xl">⚡</span>
          RUN BEST LEAD (AUTO)
        </button>
      </div>

      <div className="bg-white dark:bg-[#0b1021]/95 border border-slate-300 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-[#080d1e]">
                <th onClick={() => handleSort('rank')} className="cursor-pointer px-8 py-6 text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none whitespace-nowrap">
                  RANK {sortConfig.key === 'rank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('businessName')} className="cursor-pointer px-8 py-6 text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none whitespace-nowrap">
                  IDENTITY {sortConfig.key === 'businessName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('assetGrade')} className="cursor-pointer px-8 py-6 text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none text-center whitespace-nowrap">
                  GRADE {sortConfig.key === 'assetGrade' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="hidden lg:table-cell px-8 py-6 text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.2em] select-none whitespace-nowrap">
                  SOCIAL GAP / SIGNAL
                </th>
                <th onClick={() => handleSort('leadScore')} className="cursor-pointer px-8 py-6 text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none text-right whitespace-nowrap">
                  SCORE {sortConfig.key === 'leadScore' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="w-40 px-8 py-6"></th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
                <tr key={lead.id} className={`group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all border-b border-slate-100 dark:border-slate-800/50 last:border-0 ${lead.locked ? 'opacity-60 bg-slate-50 dark:bg-slate-900/30' : ''}`}>
                  
                  {/* RANK */}
                  <td className="px-8 py-6 text-xl font-black text-slate-800 dark:text-slate-200 italic group-hover:text-indigo-600 transition-colors">
                    #{lead.rank}
                  </td>
                  
                  {/* IDENTITY */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">
                        {lead.businessName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        {lead.city} • {lead.niche}
                      </span>
                      {lead.locked && (
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                          🔒 LOCKED BY RUN {lead.lockedByRunId?.slice(0,4)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* GRADE */}
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black border-2 ${
                      lead.assetGrade === 'A' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      lead.assetGrade === 'B' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' :
                      'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                    }`}>
                      {lead.assetGrade}
                    </span>
                  </td>

                  {/* SOCIAL GAP */}
                  <td className="hidden lg:table-cell px-8 py-6 max-w-xs">
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                      "{lead.socialGap}"
                    </p>
                  </td>

                  {/* SCORE */}
                  <td className="px-8 py-6 text-right">
                    <span className={`text-4xl font-black italic opacity-80 group-hover:opacity-100 transition-all ${
                      lead.leadScore >= 80 ? 'text-emerald-500' : 
                      lead.leadScore >= 60 ? 'text-indigo-500' : 
                      'text-slate-400'
                    }`}>
                      {lead.leadScore}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onInspect(lead.id)} 
                      className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      WAR ROOM
                    </button>
                  </td>
                </tr>
              ))}
              {sortedLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NO TARGETS INDEXED</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeRunId && <RunStatus runId={activeRunId} onClose={() => {
        setActiveRunId(null);
        window.location.reload(); 
      }} />}
    </div>
  );
};
