
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
    <div className="space-y-8 py-6 max-w-[1600px] mx-auto relative px-6 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <h3 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">
          TARGET <span className="text-indigo-600 not-italic">LEDGER</span>
        </h3>
        <button 
          onClick={handleOneClickRun}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 border-b-4 border-indigo-800 flex items-center gap-3"
        >
          <span className="text-xl">⚡</span>
          RUN BEST LEAD (AUTO)
        </button>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl relative ring-1 ring-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#05091a]">
                <th 
                  onClick={() => handleSort('rank')} 
                  className="cursor-pointer px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors select-none whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    RANK 
                    <span className={`text-indigo-500 transition-opacity ${sortConfig.key === 'rank' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('businessName')} 
                  className="cursor-pointer px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors select-none whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    IDENTITY
                    <span className={`text-indigo-500 transition-opacity ${sortConfig.key === 'businessName' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('assetGrade')} 
                  className="cursor-pointer px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors select-none text-center whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2 justify-center">
                    GRADE
                    <span className={`text-indigo-500 transition-opacity ${sortConfig.key === 'assetGrade' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] select-none whitespace-nowrap">
                  SOCIAL GAP / SIGNAL
                </th>
                <th 
                  onClick={() => handleSort('leadScore')} 
                  className="cursor-pointer px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors select-none text-right whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2 justify-end">
                    SCORE
                    <span className={`text-indigo-500 transition-opacity ${sortConfig.key === 'leadScore' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th className="w-40 px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedLeads.map((lead) => (
                <tr key={lead.id} className={`group hover:bg-white/5 transition-all ${lead.locked ? 'opacity-50 bg-slate-900/50' : 'bg-[#0b1021]'}`}>
                  
                  {/* RANK */}
                  <td className="px-8 py-6">
                    <span className="text-2xl font-black text-slate-600 italic group-hover:text-indigo-500 transition-colors">
                      #{lead.rank}
                    </span>
                  </td>
                  
                  {/* IDENTITY */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span 
                        onClick={() => onInspect(lead.id)}
                        className="text-xl font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors leading-none cursor-pointer"
                      >
                        {lead.businessName}
                      </span>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">
                          {lead.city}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {lead.niche}
                        </span>
                      </div>
                      {lead.locked && (
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 flex items-center gap-2 animate-pulse">
                          <span>🔒</span> LOCKED BY PROTOCOL {lead.lockedByRunId?.slice(0,4)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* GRADE */}
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-black border-2 shadow-lg ${
                      lead.assetGrade === 'A' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10' :
                      lead.assetGrade === 'B' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-blue-500/10' :
                      'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                      {lead.assetGrade}
                    </span>
                  </td>

                  {/* SOCIAL GAP */}
                  <td className="px-8 py-6 max-w-sm">
                    <p className="text-[12px] font-medium text-slate-400 line-clamp-2 italic leading-relaxed border-l-2 border-indigo-500/30 pl-4">
                      "{lead.socialGap}"
                    </p>
                  </td>

                  {/* SCORE */}
                  <td className="px-8 py-6 text-right">
                    <span className={`text-5xl font-black italic tracking-tighter ${
                      lead.leadScore >= 80 ? 'text-emerald-500' : 
                      lead.leadScore >= 60 ? 'text-indigo-500' : 
                      'text-slate-600'
                    }`}>
                      {lead.leadScore}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onInspect(lead.id)} 
                      className="px-8 py-4 bg-white text-black hover:bg-indigo-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                    >
                      WAR ROOM
                    </button>
                  </td>
                </tr>
              ))}
              {sortedLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-32 text-center bg-[#0b1021]">
                    <span className="text-6xl block mb-4 grayscale opacity-20">📂</span>
                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.4em]">LEDGER EMPTY // INITIATE SCAN</p>
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
