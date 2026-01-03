
import React from 'react';
import { Lead } from '../types';

interface LeadTableProps {
  leads: Lead[];
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank/Grade</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Niche/Location</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Social Gap</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Score</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.rank} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">#{lead.rank}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 w-fit
                      ${lead.assetGrade === 'A' ? 'bg-green-100 text-green-800' : 
                        lead.assetGrade === 'B' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      Grade {lead.assetGrade}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">{lead.businessName}</div>
                  <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline truncate block max-w-[150px]">
                    {lead.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.niche}</div>
                  <div className="text-xs text-gray-500">{lead.city}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {lead.phone}
                    </p>
                    <p className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {lead.email !== "Not found" ? lead.email : 'No email'}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="text-xs text-gray-600 line-clamp-2" title={lead.socialGap}>
                    {lead.socialGap}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {lead.instagram !== "Not found" && <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded border border-pink-100">IG</span>}
                    {lead.tiktok !== "Not found" && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded">TK</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-200">
                    <span className="text-sm font-bold text-indigo-700">{lead.leadScore}</span>
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
