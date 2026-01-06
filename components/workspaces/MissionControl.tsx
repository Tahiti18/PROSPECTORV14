
import React, { useEffect, useState, useMemo } from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { Tooltip } from '../Tooltip';
import { outreachService } from '../../services/outreachService';
import { db } from '../../services/automation/db';
import { subscribeToCompute, addCredits, getBalance } from '../../services/computeTracker';

interface MissionControlProps {
  leads: Lead[];
  theater: string;
  onNavigate: (mode: MainMode, mod: SubModule) => void;
}

const ControlIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'IDENTIFIED':
      return (
        <React.Fragment>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
        </React.Fragment>
      );
    case 'RADAR':
      return (
        <React.Fragment>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20" />
        </React.Fragment>
      );
    case 'ASSET':
      return (
        <React.Fragment>
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </React.Fragment>
      );
    default:
      return null;
  }
};

export const MissionControl: React.FC<MissionControlProps> = ({ leads, theater, onNavigate }) => {
  const [activeRuns, setActiveRuns] = useState(0);
  const [outreachCount, setOutreachCount] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const [balance, setBalance] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  // Real-time Poll
  useEffect(() => {
    const refresh = () => {
      // 1. Get Active Automations
      const runs = db.listRuns();
      const active = runs.filter(r => r.status === 'running' || r.status === 'queued').length;
      setActiveRuns(active);

      // 2. Get 24h Outreach
      const logs = outreachService.getHistory();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recent = logs.filter(l => l.timestamp > oneDayAgo);
      setOutreachCount(recent.length);

      // 3. Merge Logs for Feed
      const runLogs = runs.slice(0, 5).map(r => ({
        type: 'AUTO',
        msg: `AUTOMATION ${r.status}: ${r.leadName}`,
        time: r.createdAt,
        status: r.status
      }));
      
      const commsLogs = logs.slice(0, 5).map(l => ({
        type: 'COMM',
        msg: `${l.channel.toUpperCase()} SENT: ${l.to || 'Unknown'}`,
        time: l.timestamp,
        status: 'success'
      }));

      const merged = [...runLogs, ...commsLogs].sort((a,b) => b.time - a.time).slice(0, 6);
      setRecentLogs(merged);
    };

    refresh();
    const interval = setInterval(refresh, 2000);
    
    // Initial Hydration
    setBalance(getBalance());

    const unsubCompute = subscribeToCompute((s, user) => {
        setSessionCost(s.sessionCostUsd);
        setBalance(user.credits || 0);
    });

    return () => {
        clearInterval(interval);
        unsubCompute();
    };
  }, []);

  const stats = [
    { 
      label: 'ACTIVE AGENTS', 
      status: activeRuns > 0 ? `${activeRuns} RUNNING` : 'IDLE', 
      icon: <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.641.32a2 2 0 01-1.76 0l-.641-.32a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V18a2 2 0 002 2h12a2 2 0 002-2v-2.572zM12 11V3.5l3 3m-3-3l-3 3" />, 
      color: activeRuns > 0 ? 'emerald' : 'slate', 
      desc: "Background automation protocols currently executing." 
    },
    { 
      label: 'TARGETS LOCKED', 
      status: `${leads.length} RECORDS`, 
      icon: <ControlIcon type="IDENTIFIED" />, 
      color: leads.length > 0 ? 'emerald' : 'slate', 
      desc: "Total number of leads identified in the current theater." 
    },
    { 
      label: 'OUTREACH (24H)', 
      status: `${outreachCount} SENT`, 
      icon: <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, 
      color: outreachCount > 0 ? 'emerald' : 'slate', 
      desc: "Communications dispatched in the last 24 hours." 
    },
    { 
      label: 'SESSION COST', 
      status: `$${sessionCost.toFixed(2)}`, 
      icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, 
      color: 'emerald', 
      desc: "Estimated API cost for current session." 
    },
  ];

  const actions = [
    { id: 'RADAR_RECON', mode: 'OPERATE' as MainMode, title: 'LEAD DISCOVERY', desc: 'INITIATE MARKET SCAN', icon: <ControlIcon type="RADAR" />, theme: 'emerald', help: "Start here! Use the radar to scan a specific city and find businesses that match your criteria." },
    { id: 'TARGET_LIST', mode: 'OPERATE' as MainMode, title: 'LEAD DATABASE', desc: 'ACCESS RECORDS', icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v10H6.5" />, theme: 'emerald', help: "View your saved list of potential clients. Sort them by score and pick who to contact." },
    { id: 'VIDEO_PITCH', mode: 'STUDIO' as MainMode, title: 'ASSET STUDIO', desc: 'GENERATE CONTENT', icon: <ControlIcon type="ASSET" />, theme: 'emerald', help: "Go to the creative studio to generate custom videos or images to send to your leads." }
  ];

  return (
    <div className="space-y-8 py-4 max-w-6xl mx-auto animate-in fade-in duration-700 relative">
      
      {/* WALLET BADGE */}
      <div className="absolute top-0 right-0 z-20">
          <button 
            onClick={() => addCredits(50)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-900/10 hover:bg-emerald-900/30 transition-all group"
            title="Click to Simulate Top-Up"
          >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest group-hover:text-emerald-300">
                  CREDITS: ${(typeof balance === 'number' ? balance : 0).toFixed(2)}
              </span>
          </button>
      </div>

      <div className="text-center relative py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Neural Core Synchronized</span>
        </div>
        
        <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
          MISSION <span className="text-emerald-600 opacity-70">CONTROL</span>
        </h1>
        <p className="mt-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.6em]">ACTIVE MARKET: <span className="text-emerald-400 italic">{theater}</span></p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((node, i) => (
          <Tooltip key={i} content={node.desc} side="bottom">
            <div className="bg-[#0b1021]/60 border border-slate-800/80 p-5 rounded-[24px] flex flex-col items-center group hover:border-emerald-500/40 transition-all cursor-default w-full shadow-lg relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-16 h-16 bg-${node.color}-500/5 rounded-full blur-xl -mr-8 -mt-8`}></div>
              <svg className={`w-5 h-5 mb-3 text-${node.color}-500 transition-all`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {node.icon}
              </svg>
              <span className="text-[9px] font-black text-slate-600 tracking-[0.2em] uppercase mb-1">{node.label}</span>
              <span className={`text-sm font-black text-${node.color}-400 tracking-[0.05em] uppercase`}>{node.status}</span>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* LIVE FEED & ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT: LIVE INTELLIGENCE FEED */}
         <div className="lg:col-span-2 bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">LIVE INTELLIGENCE STREAM</h3>
            </div>
            
            <div className="flex-1 space-y-3 min-h-[200px]">
               {recentLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                     NO RECENT ACTIVITY DETECTED
                  </div>
               ) : (
                  recentLogs.map((log, i) => (
                     <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/40 rounded-xl border border-slate-800/50 hover:bg-slate-900/80 transition-colors">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${log.type === 'AUTO' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                           {log.type}
                        </span>
                        <span className="text-[10px] font-medium text-slate-300 truncate flex-1 font-mono">{log.msg}</span>
                        <span className="text-[9px] font-bold text-slate-600">{new Date(log.time).toLocaleTimeString()}</span>
                     </div>
                  ))
               )}
            </div>
         </div>

         {/* RIGHT: QUICK ACTIONS */}
         <div className="flex flex-col gap-4">
            {actions.map((action, i) => (
              <div 
                key={i}
                onClick={() => onNavigate(action.mode, action.id as SubModule)}
                className={`flex-1 bg-[#0b1021] border border-slate-800 p-6 rounded-[24px] relative overflow-hidden group hover:border-${action.theme}-500/40 transition-all cursor-pointer shadow-lg hover:bg-slate-900/40 flex items-center gap-5`}
              >
                <div className={`w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-${action.theme}-500 group-hover:scale-110 transition-transform shadow-inner`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {action.icon}
                  </svg>
                </div>
                <div>
                   <h2 className={`text-xs font-black uppercase tracking-wide text-white mb-1 group-hover:text-${action.theme}-400 transition-colors`}>{action.title}</h2>
                   <p className="text-[8px] font-bold text-slate-600 tracking-[0.2em] uppercase">{action.desc}</p>
                </div>
              </div>
            ))}
         </div>

      </div>
    </div>
  );
};
