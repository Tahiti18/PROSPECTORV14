
import React from 'react';

export const AffiliateNode: React.FC = () => {
  const affiliates = [
    { id: 'AG-001', name: 'Alpha Strategic', leads: 42, revenue: '$14,200', status: 'TOP_TIER' },
    { id: 'AG-004', name: 'Vantage Point', leads: 12, revenue: '$4,100', status: 'ACTIVE' },
    { id: 'AG-009', name: 'Nexus Prime', leads: 8, revenue: '$2,800', status: 'STANDBY' }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">PARTNER <span className="text-indigo-600 not-italic">AFFILIATE</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">External Referral Infrastructure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800">
                       <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">AGENT_ID</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">IDENTITY</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">LEADS</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">YIELD</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/40">
                    {affiliates.map(a => (
                      <tr key={a.id} className="hover:bg-slate-900/40 transition-colors group">
                         <td className="px-8 py-8 text-[11px] font-black text-slate-500 font-mono tracking-tighter">{a.id}</td>
                         <td className="px-8 py-8">
                            <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{a.name}</p>
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{a.status}</span>
                         </td>
                         <td className="px-8 py-8 text-xl font-black italic text-slate-300 tracking-tighter">{a.leads}</td>
                         <td className="px-8 py-8 text-xl font-black italic text-emerald-400 tracking-tighter">{a.revenue}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[50px] rounded-full"></div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 relative z-10">Commission Matrix</h3>
              <div className="space-y-6 relative z-10">
                 {[
                   { l: 'Base Tier', v: '10%' },
                   { l: 'Mid Tier', v: '15%' },
                   { l: 'Elite Tier', v: '25%' }
                 ].map((m, i) => (
                   <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-800 last:border-0">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{m.l}</span>
                      <span className="text-xl font-black italic text-indigo-400 tracking-tighter">{m.v}</span>
                   </div>
                 ))}
              </div>
              <button className="w-full mt-8 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">GENERATE INVOICES</button>
           </div>
        </div>
      </div>
    </div>
  );
};
