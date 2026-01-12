
import React, { useEffect, useState } from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { Tooltip } from '../Tooltip';
import { outreachService } from '../../services/outreachService';
import { db } from '../../services/automation/db';
import { subscribeToCompute, getBalance } from '../../services/computeTracker';

interface DashboardProps {
  leads: Lead[];
  market: string;
  onNavigate: (mode: MainMode, mod: SubModule) => void;
}

export const ExecutiveDashboard: React.FC<DashboardProps> = ({ leads, market, onNavigate }) => {
  const [activeWorkflows, setActiveWorkflows] = useState(0);
  const [outreachCount, setOutreachCount] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const [balance, setBalance] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  useEffect(() => {
    const refresh = () => {
      const runs = db.listRuns();
      setActiveWorkflows(runs.filter(r => r.status === 'running' || r.status === 'queued').length);
      const logs = outreachService.getHistory();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      setOutreachCount(logs.filter(l => l.timestamp > oneDayAgo).length);

      const merged = [...runs.slice(0, 5).map(r => ({ type: 'AUTO', msg: `WORKFLOW ${r.status}: ${r.leadName}`, time: r.createdAt })),
                      ...logs.slice(0, 5).map(l => ({ type: 'COMM', msg: `${l.channel.toUpperCase()} SENT: ${l.to || 'Unknown'}`, time: l.timestamp }))]
                      .sort((a,b) => b.time - a.time).slice(0, 6);
      setRecentLogs(merged);
    };

    refresh();
    const interval = setInterval(refresh, 2000);
    setBalance(getBalance());
    const unsub = subscribeToCompute((s, user) => { setSessionCost(s.sessionCostUsd); setBalance(user.credits || 0); });
    return () => { clearInterval(interval); unsub(); };
  }, []);

  const stats = [
    { label: 'ACTIVE WORKFLOWS', status: activeWorkflows > 0 ? `${activeWorkflows} RUNNING` : 'IDLE', icon: '📊', desc: "Ongoing automated agency tasks." },
    { label: 'SAVED PROSPECTS', status: `${leads.length} RECORDS`, icon: '💾', desc: "Total database volume." },
    { label: 'MESSAGES (24H)', status: `${outreachCount} SENT`, icon: '✉️', desc: "Outreach activity." },
    { label: 'OPERATING COST', status: `$${sessionCost.toFixed(2)}`, icon: '💰', desc: "Current session expenses." },
  ];

  const actions = [
    { id: 'MARKET_DISCOVERY', mode: 'RESEARCH' as MainMode, title: 'SEARCH REGION', desc: 'FIND NEW CLIENTS', icon: '🔍' },
    { id: 'PROSPECT_DATABASE', mode: 'RESEARCH' as MainMode, title: 'PROSPECT LEDGER', desc: 'VIEW DATABASE', icon: '🗂️' },
    { id: 'VISUAL_STUDIO', mode: 'DESIGN' as MainMode, title: 'CREATIVE STUDIO', desc: 'CREATE ASSETS', icon: '🎨' }
  ];

  return (
    <div className="space-y-8 py-4 max-w-6xl mx-auto animate-in fade-in duration-700 relative">
      <div className="absolute top-0 right-0 z-20">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-900/10">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">BALANCE: ${balance.toFixed(2)}</span>
          </div>
      </div>

      <div className="text-center relative py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Agency System Operational</span>
        </div>
        
        <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
          AGENCY <span className="text-emerald-600 opacity-70">OVERVIEW</span>
        </h1>
        <p className="mt-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.6em]">ACTIVE MARKET: <span className="text-emerald-400 italic">{market}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((node, i) => (
          <Tooltip key={i} content={node.desc} side="bottom">
            <div className="bg-[#0b1021]/60 border border-slate-800 p-5 rounded-[24px] flex flex-col items-center group hover:border-emerald-500/40 transition-all cursor-default w-full shadow-lg">
              <span className="text-2xl mb-2">{node.icon}</span>
              <span className="text-[9px] font-black text-slate-600 tracking-[0.2em] uppercase mb-1">{node.label}</span>
              <span className="text-sm font-black text-emerald-400 uppercase">{node.status}</span>
            </div>
          </Tooltip>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-2xl flex flex-col">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               LIVE ACTIVITY FEED
            </h3>
            <div className="flex-1 space-y-3">
               {recentLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase text-slate-500">NO RECENT ACTIVITY</div>
               ) : (
                  recentLogs.map((log, i) => (
                     <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/40 rounded-xl border border-slate-800/50">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${log.type === 'AUTO' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{log.type}</span>
                        <span className="text-[10px] font-medium text-slate-300 truncate flex-1 font-mono uppercase">{log.msg}</span>
                        <span className="text-[9px] font-bold text-slate-600">{new Date(log.time).toLocaleTimeString()}</span>
                     </div>
                  ))
               )}
            </div>
         </div>

         <div className="flex flex-col gap-4">
            {actions.map((action, i) => (
              <div key={i} onClick={() => onNavigate(action.mode, action.id as SubModule)} className="flex-1 bg-[#0b1021] border border-slate-800 p-6 rounded-[24px] group hover:border-emerald-500/40 transition-all cursor-pointer flex items-center gap-5">
                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-xl shadow-inner">{action.icon}</div>
                <div>
                   <h2 className="text-xs font-black uppercase text-white mb-1 group-hover:text-emerald-400 transition-colors">{action.title}</h2>
                   <p className="text-[8px] font-bold text-slate-600 tracking-[0.2em] uppercase">{action.desc}</p>
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
