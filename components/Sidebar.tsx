
import React, { useState, useEffect } from 'react';
import { WorkspaceType } from '../types';
import { Tooltip } from './Tooltip';
import { getUserTier, getUserLevel, getUserXP, subscribeToCompute } from '../services/computeTracker';

interface SidebarProps {
  active: WorkspaceType;
  onNavigate: (w: WorkspaceType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate }) => {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [tier, setTier] = useState('STARTER');

  useEffect(() => {
    // Initial Hydration
    setLevel(getUserLevel());
    setXp(getUserXP());
    setTier(getUserTier());

    // Subscription
    const unsub = subscribeToCompute((s, user) => {
        setLevel(user.level);
        setXp(user.xp);
        setTier(user.tier);
    });
    return () => { unsub(); };
  }, []);

  // Calculate XP Progress
  const currentLevelBase = Math.pow(level - 1, 2) * 100;
  const nextLevelBase = Math.pow(level, 2) * 100;
  const progress = Math.min(100, Math.max(0, ((xp - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100));

  const navItems: { id: WorkspaceType; label: string; icon: string; category: string; description: string }[] = [
    { id: 'dashboard', label: 'Mission Control', icon: '🏠', category: 'Core', description: "Your main command center. See an overview of all active leads, stats, and system health." },
    { id: 'intelligence', label: 'Lead Discovery', icon: '📡', category: 'Intelligence', description: "The radar scanner. Use this to search for new businesses in specific cities that fit your criteria." },
    // Fix: 'war-room' is not a valid WorkspaceType, using 'strategy' instead
    { id: 'strategy', label: 'Strategy Hub', icon: '⚔️', category: 'Strategy', description: "The strategy hub. Analyze a specific client deeply, view their weak spots, and plan your pitch." },
    { id: 'creative', label: 'Creative Studio', icon: '🎨', category: 'Production', description: "Your asset factory. Create high-end images, videos, and audio pitches to wow the client." },
    // Fix: 'outreach' is not a valid WorkspaceType, using 'campaign' instead
    { id: 'campaign', label: 'Campaign Builder', icon: '🎯', category: 'Outreach', description: "The communications center. Plan and launch emails, LinkedIn messages, and follow-ups." },
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
        <div className="bg-slate-800/50 p-4 rounded-xl space-y-3">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 border-2 border-slate-700 shrink-0 flex items-center justify-center font-black text-xs text-white">
                 {level}
              </div>
              <div className="min-w-0 flex-1">
                 <p className="text-xs font-bold text-slate-100 truncate">AGENCY RANK</p>
                 <p className="text-[10px] text-emerald-400 font-black truncate uppercase tracking-widest">{tier} TIER</p>
              </div>
           </div>
           
           <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-slate-500">
                 <span>XP PROGRESS</span>
                 <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
           </div>
        </div>
      </div>
    </aside>
  );
};
