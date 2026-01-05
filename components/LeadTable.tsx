
import React from 'react';
import { Lead } from '../types';

interface LeadTableProps {
  leads: Lead[];
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  return (
    <div className="bg-[#0b1021] shadow-2xl border border-slate-800 rounded-[24px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-[#05091a]">
            <tr>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Rank/Grade</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Business Identity</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Coordinates</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact Vector</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vulnerability</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-[#0b1021]">
            {leads.map((lead) => (
              <tr key={lead.rank} className="hover:bg-slate-900/50 transition-colors group">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-slate-600 group-hover:text-emerald-500 transition-colors italic">#{lead.rank}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mt-1 w-fit border ${
                      lead.assetGrade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      lead.assetGrade === 'B' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                      'bg-slate-800 text-slate-500 border-slate-700'}`}>
                      Grade {lead.assetGrade}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{lead.businessName}</div>
                  <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-white truncate block max-w-[150px] font-mono mt-1">
                    {lead.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{lead.niche}</div>
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">{lead.city}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-[10px] text-slate-400 space-y-1.5 font-medium">
                    <p className="flex items-center gap-2">
                      <span className="text-slate-600">PH:</span>
                      <span className="text-slate-300">{lead.phone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-slate-600">@:</span>
                      <span className="text-slate-300 truncate max-w-[120px]">{lead.email !== "Not found" ? lead.email : 'No email'}</span>
                    </p>
                  </div>
                </td>
                <td className="px-6 py-5 max-w-xs">
                  <div className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2 border-l-2 border-slate-800 pl-3 group-hover:border-emerald-500/50 transition-colors" title={lead.socialGap}>
                    {lead.socialGap}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {lead.instagram !== "Not found" && <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20 font-black tracking-widest">IG</span>}
                    {lead.tiktok !== "Not found" && <span className="text-[8px] bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-600 font-black tracking-widest">TK</span>}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    lead.leadScore >= 80 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}>
                    <span className="text-xs font-black">{lead.leadScore}</span>
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
