
import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';

interface TargetListProps {
  leads: Lead[];
  lockedLeadId: string | null;
  onLockLead: (id: string) => void;
  onInspect: (id: string) => void;
}

type SortKey = 'rank' | 'businessName' | 'niche' | 'leadScore';

export const TargetList: React.FC<TargetListProps> = ({ 
  leads, 
  lockedLeadId, 
  onLockLead, 
  onInspect
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'leadScore' ? 'desc' : 'asc'); 
    }
  };

  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      
      return sortOrder === 'asc' 
        ? (valA as number) - (valB as number) 
        : (valB as number) - (valA as number);
    });
  }, [leads, sortKey, sortOrder]);

  if (leads.length === 0) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto py-24 animate-in fade-in duration-700">
        <div className="py-40 text-center bg-[#0b1021]/40 border border-dashed border-slate-800 rounded-[32px] text-slate-500 space-y-8">
          <div className="text-6xl opacity-20 animate-pulse grayscale">📡</div>
          <div className="space-y-3 px-10">
            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400">Intelligence Reservoir Empty</p>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Execute Radar Recon or Import Existing Data via Footer</p>
          </div>
        </div>
      </div>
    );
  }

  const HeaderItem = ({ label, id, width }: { label: string, id: SortKey, width?: string }) => (
    <th 
      onClick={() => handleSort(id)}
      className={`px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] cursor-pointer hover:bg-slate-800 transition-all select-none ${width} ${sortKey === id ? 'text-indigo-400 bg-indigo-500/[0.05]' : 'text-slate-500'}`}
    >
      <div className="flex items-center gap-2">
        {label}
        <div className="flex flex-col gap-0.5">
          <span className={`text-[6px] leading-none transition-all ${sortKey === id && sortOrder === 'asc' ? 'text-indigo-500 font-black scale-125' : 'text-slate-700 opacity-30'}`}>▲</span>
          <span className={`text-[6px] leading-none transition-all ${sortKey === id && sortOrder === 'desc' ? 'text-indigo-500 font-black scale-125' : 'text-slate-700 opacity-30'}`}>▼</span>
        </div>
      </div>
    </th>
  );

  return (
    <div className="space-y-8 py-6 max-w-[1550px] mx-auto relative px-4 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-2 italic">Global Target Indexing Hub</h2>
          <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">TARGET <span className="text-indigo-600 not-italic opacity-50">LEDGER</span></h3>
        </div>
        <div className="bg-[#0b1021] border border-slate-800 px-6 py-3 rounded-xl flex items-center gap-3 shadow-xl">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"></div>
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{leads.length} Entities Secured</span>
        </div>
      </div>

      <div className="bg-[#05091a] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-slate-800 bg-[#020617]">
              <HeaderItem label="RANK" id="rank" width="w-24" />
              <HeaderItem label="IDENTITY" id="businessName" width="w-64" />
              <HeaderItem label="THEATER" id="niche" width="w-48" />
              <th className="px-6 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">VULNERABILITY</th>
              <HeaderItem label="SCORE" id="leadScore" width="w-32" />
              <th className="w-48 px-6 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className={`group transition-all duration-300 ${lockedLeadId === lead.id ? 'bg-indigo-900/20' : 'hover:bg-[#0b1021]'}`}
              >
                <td className="px-6 py-6 align-middle">
                  <div className="flex flex-col gap-2 items-start">
                    <span className="text-sm font-black text-slate-400 italic group-hover:text-indigo-400 transition-colors">#{lead.rank}</span>
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg border border-white/5 ${
                      lead.assetGrade === 'A' ? 'bg-emerald-500 text-black shadow-emerald-500/40' : 
                      lead.assetGrade === 'B' ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {lead.assetGrade} GRADE
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 align-middle">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200 uppercase tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">{lead.businessName}</p>
                    <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors block truncate max-w-[200px] font-mono">
                      {lead.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-6 align-middle">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate">{lead.niche}</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider italic">{lead.city}</p>
                  </div>
                </td>
                <td className="px-6 py-6 align-middle">
                  <p className="text-[10px] text-slate-400 font-medium leading-snug italic group-hover:text-slate-200 transition-colors line-clamp-2 border-l-2 border-slate-800 pl-3 group-hover:border-indigo-500" title={lead.socialGap}>
                    "{lead.socialGap}"
                  </p>
                </td>
                <td className="px-6 py-6 align-middle">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black italic tracking-tighter opacity-90 transition-all ${
                      lead.leadScore > 80 ? 'text-emerald-400' : lead.leadScore > 60 ? 'text-indigo-400' : 'text-slate-500'
                    }`}>
                      {lead.leadScore}
                    </span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">/ 100</span>
                  </div>
                </td>
                <td className="px-6 py-6 align-middle text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => onLockLead(lead.id)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        lockedLeadId === lead.id 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {lockedLeadId === lead.id ? 'LOCKED' : 'LOCK'}
                    </button>
                    <button 
                      onClick={() => onInspect(lead.id)}
                      className="p-2.5 bg-slate-100 text-black rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg active:scale-95"
                      title="Enter War Room"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2.5"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
