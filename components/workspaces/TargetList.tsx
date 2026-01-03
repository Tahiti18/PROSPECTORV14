
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
        <div className="py-40 text-center bg-slate-100 dark:bg-[#0b1021]/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-[64px] text-slate-500 space-y-8">
          <div className="text-8xl opacity-20 animate-pulse grayscale">📡</div>
          <div className="space-y-3 px-10">
            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-600 dark:text-slate-400">Intelligence Reservoir Empty</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">Execute Radar Recon or Import Existing Data via Footer</p>
          </div>
        </div>
      </div>
    );
  }

  const HeaderItem = ({ label, id, width }: { label: string, id: SortKey, width?: string }) => (
    <th 
      onClick={() => handleSort(id)}
      className={`px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-all select-none ${width} ${sortKey === id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/[0.03]' : 'text-slate-500 dark:text-slate-200'}`}
    >
      <div className="flex items-center gap-2">
        {label}
        <div className="flex flex-col gap-0.5">
          <span className={`text-[8px] leading-none transition-all ${sortKey === id && sortOrder === 'asc' ? 'text-indigo-500 font-black scale-125' : 'text-slate-400 opacity-30'}`}>▲</span>
          <span className={`text-[8px] leading-none transition-all ${sortKey === id && sortOrder === 'desc' ? 'text-indigo-500 font-black scale-125' : 'text-slate-400 opacity-30'}`}>▼</span>
        </div>
      </div>
    </th>
  );

  return (
    <div className="space-y-10 py-6 max-w-[1550px] mx-auto relative px-4 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-[10px] font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-[0.7em] mb-2 italic">Global Target Indexing Hub</h2>
          <h3 className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none transition-colors">TARGET <span className="text-indigo-600 not-italic opacity-30">LEDGER</span></h3>
        </div>
        <div className="bg-white dark:bg-[#0b1021] border-2 border-slate-200 dark:border-slate-800 px-8 py-4 rounded-[24px] flex items-center gap-4 shadow-2xl transition-colors">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]"></div>
           <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.3em]">{leads.length} Entities Secured</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0b1021]/95 border border-slate-200 dark:border-slate-800 rounded-[48px] overflow-hidden shadow-2xl relative transition-colors">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#080d1e] transition-colors">
              <HeaderItem label="RANK" id="rank" width="w-36" />
              <HeaderItem label="IDENTITY" id="businessName" />
              <HeaderItem label="THEATER" id="niche" />
              <th className="px-10 py-8 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">VULNERABILITY</th>
              <HeaderItem label="SCORE" id="leadScore" width="w-44" />
              <th className="w-72 px-10 py-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {sortedLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className={`group transition-all duration-500 ${lockedLeadId === lead.id ? 'bg-indigo-600/[0.08] dark:bg-indigo-600/[0.12]' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
              >
                <td className="px-10 py-8 align-top">
                  <div className="flex flex-col gap-3">
                    <span className="text-xl font-black text-slate-900 dark:text-white italic group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">#{lead.rank}</span>
                    <span className={`w-fit px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border-2 ${
                      lead.assetGrade === 'A' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                      lead.assetGrade === 'B' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>
                      {lead.assetGrade} GRADE
                    </span>
                  </div>
                </td>
                <td className="px-10 py-8 align-top">
                  <div className="space-y-1.5">
                    <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">{lead.businessName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer truncate max-w-[280px] italic">
                      {lead.websiteUrl.replace(/^https?:\/\//, '')}
                    </p>
                  </div>
                </td>
                <td className="px-10 py-8 align-top">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em]">{lead.niche}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] italic">{lead.city}</p>
                  </div>
                </td>
                <td className="px-10 py-8 align-top">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-bold uppercase tracking-[0.1em] italic group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={lead.socialGap}>
                    "{lead.socialGap}"
                  </p>
                </td>
                <td className="px-10 py-8 text-right align-top">
                  <span className="text-4xl font-black italic text-slate-800 dark:text-white tracking-tighter opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 inline-block transition-all duration-500">{lead.leadScore}</span>
                </td>
                <td className="px-10 py-8 text-right align-top">
                  <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <button 
                      onClick={() => onLockLead(lead.id)}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all active:scale-90 ${
                        lockedLeadId === lead.id 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-200 dark:hover:border-slate-500'
                      }`}
                    >
                      {lockedLeadId === lead.id ? 'LOCKED' : 'LOCK TARGET'}
                    </button>
                    <button 
                      onClick={() => onInspect(lead.id)}
                      className="p-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-2xl active:scale-90 border-2 border-white/10"
                      title="Enter War Room"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="3"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="3"/></svg>
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
