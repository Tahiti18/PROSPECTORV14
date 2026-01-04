
import React from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { Tooltip } from '../Tooltip';

interface MissionControlProps {
  leads: Lead[];
  theater: string;
  onNavigate: (mode: MainMode, mod: SubModule) => void;
}

/**
 * ICON REGISTRY
 */
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
    case 'PAYLOAD':
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
  const stats = [
    { label: 'API NODES', status: 'STABLE', icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />, color: 'emerald', desc: "The connection to the AI Brain (Gemini) is working perfectly." },
    { label: 'IDENTIFIED', status: `${leads.length} TARGETS`, icon: <ControlIcon type="IDENTIFIED" />, color: 'indigo', desc: "The total number of potential clients you have found and saved so far." },
    { label: 'THREAT SCAN', status: 'OPTIMAL', icon: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />, color: 'cyan', desc: "No system errors detected. The engine is running at full speed." },
    { label: 'OS VERSION', status: 'V13.1.2', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, color: 'slate', desc: "The current version of the Pomelli software you are running." },
  ];

  const actions = [
    { id: 'RADAR_RECON', mode: 'OPERATE' as MainMode, title: 'RADAR RECON', desc: 'INITIATE THEATER SCAN', icon: <ControlIcon type="RADAR" />, theme: 'indigo', help: "Start here! Use the radar to scan a specific city and find businesses that match your criteria." },
    { id: 'TARGET_LIST', mode: 'OPERATE' as MainMode, title: 'TARGET LEDGER', desc: 'DATABASE ACCESS', icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v10H6.5" />, theme: 'emerald', help: "View your saved list of potential clients. Sort them by score and pick who to contact." },
    { id: 'VIDEO_PITCH', mode: 'CREATE' as MainMode, title: 'PAYLOAD FORGE', desc: 'GENERATE ASSETS', icon: <ControlIcon type="PAYLOAD" />, theme: 'cyan', help: "Go to the creative studio to generate custom videos or images to send to your leads." }
  ];

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="text-center relative py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mb-6">
          <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></div>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Neural Core Synchronized</span>
        </div>
        
        <h1 className="text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
          MISSION <span className="text-indigo-600 not-italic opacity-70">CONTROL</span>
        </h1>
        <p className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">ACTIVE INTELLIGENCE THEATER: <span className="text-indigo-400 italic">{theater}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((node, i) => (
          <Tooltip key={i} content={node.desc} side="bottom">
            <div className="bg-[#0b1021]/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col items-center group hover:border-indigo-500/40 transition-all cursor-default w-full">
              <svg className="w-5 h-5 mb-2.5 opacity-40 group-hover:opacity-100 group-hover:text-indigo-400 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {node.icon}
              </svg>
              <span className="text-[8px] font-black text-slate-600 tracking-[0.2em] uppercase mb-1">{node.label}</span>
              <span className={`text-[10px] font-black text-${node.color}-400 tracking-[0.1em] uppercase`}>{node.status}</span>
            </div>
          </Tooltip>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {actions.map((action, i) => (
          <Tooltip key={i} content={action.help} side="bottom">
            <div 
              onClick={() => onNavigate(action.mode, action.id as SubModule)}
              className="bg-[#0b1021] border border-slate-800/80 p-10 rounded-[48px] relative overflow-hidden group hover:border-indigo-600/40 transition-all cursor-pointer shadow-xl hover:bg-slate-900/40 group flex flex-col items-center text-center w-full"
            >
              <div className={`absolute inset-0 bg-${action.theme}-600/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform shadow-inner group-hover:border-indigo-500/50">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {action.icon}
                </svg>
              </div>
              <h2 className="text-xl font-black italic text-white tracking-tighter mb-1 uppercase group-hover:text-indigo-400 transition-colors">{action.title}</h2>
              <p className="text-[9px] font-black text-slate-600 tracking-[0.4em] uppercase">{action.desc}</p>
              
              <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-slate-800/50 group-hover:border-indigo-500/30 transition-colors"></div>
              <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-slate-800/50 group-hover:border-indigo-500/30 transition-colors"></div>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
