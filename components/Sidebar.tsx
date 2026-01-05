
import React from 'react';
import { WorkspaceType } from '../types';
import { Tooltip } from './Tooltip';

interface SidebarProps {
  active: WorkspaceType;
  onNavigate: (w: WorkspaceType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate }) => {
  const navItems: { id: WorkspaceType; label: string; icon: string; category: string; description: string }[] = [
    { id: 'dashboard', label: 'Mission Control', icon: '🏠', category: 'Core', description: "Your main command center. See an overview of all active leads, stats, and system health." },
    { id: 'intelligence', label: 'Lead Discovery', icon: '📡', category: 'Intelligence', description: "The radar scanner. Use this to search for new businesses in specific cities that fit your criteria." },
    { id: 'war-room', label: 'Strategy Hub', icon: '⚔️', category: 'Strategy', description: "The strategy hub. Analyze a specific client deeply, view their weak spots, and plan your pitch." },
    { id: 'creative', label: 'Creative Studio', icon: '🎨', category: 'Production', description: "Your asset factory. Create high-end images, videos, and audio pitches to wow the client." },
    { id: 'outreach', label: 'Campaign Builder', icon: '🎯', category: 'Outreach', description: "The communications center. Plan and launch emails, LinkedIn messages, and follow-ups." },
    { id: 'identity', label: 'Agency Identity', icon: '🏢', category: 'Operations', description: "Define who YOU are. Set your agency's niche, branding, and core offer pitch." },
  ];

  const categories = Array.from(new Set(navItems.map(i => i.category)));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-[60]">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-black text-xl">P</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Pomelli</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lead Intelligence OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-8 overflow-y-auto pt-4 custom-scrollbar">
        {categories.map(cat => (
          <div key={cat} className="space-y-1">
            <h3 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{cat}</h3>
            {navItems.filter(i => i.category === cat).map(item => (
              <div key={item.id} className="w-full">
                <Tooltip content={item.description} side="right">
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      active === item.id 
                        ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`text-lg transition-transform group-hover:scale-110 ${active === item.id ? 'opacity-100' : 'opacity-60'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                    {active === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
                  </button>
                </Tooltip>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 border border-white/10 shrink-0"></div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">Agent Zero</p>
            <p className="text-[10px] text-slate-500 truncate">Lead Outreach Lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
