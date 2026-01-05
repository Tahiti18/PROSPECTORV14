import React, { useState, useRef, useEffect } from 'react';
import { MainMode, SubModule } from '../types';
import { Tooltip } from './Tooltip';

interface LayoutProps {
  children: React.ReactNode;
  activeMode: MainMode;
  setActiveMode: (m: MainMode) => void;
  activeModule: SubModule;
  setActiveModule: (m: SubModule) => void;
  onSearchClick: () => void;
  theater: string;
  setTheater: (t: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const STRATEGIC_CITIES = [
  { rank: 1, city: "NEW YORK, USA", tier: "S+", focus: "FINANCE_TECH" },
  { rank: 2, city: "LONDON, UK", tier: "S+", focus: "GLOBAL_BIZ" },
  { rank: 3, city: "DUBAI, UAE", tier: "S", focus: "WEALTH_CRYPTO" },
  { rank: 4, city: "SINGAPORE", tier: "S", focus: "ASIA_HQ" },
  { rank: 5, city: "AUSTIN, USA", tier: "A+", focus: "TECH_GROWTH" },
  { rank: 6, city: "MIAMI, USA", tier: "A+", focus: "WEB3_LUXURY" },
  { rank: 7, city: "SYDNEY, AUS", tier: "A+", focus: "APAC_FINANCE" },
  { rank: 8, city: "SAN FRANCISCO, USA", tier: "A+", focus: "DEEP_TECH" },
  { rank: 9, city: "TORONTO, CAN", tier: "A", focus: "NORTH_TECH" },
  { rank: 10, city: "LOS ANGELES, USA", tier: "A", focus: "MEDIA_TECH" },
  { rank: 11, city: "ZURICH, SWI", tier: "A", focus: "BANKING" },
  { rank: 12, city: "MELBOURNE, AUS", tier: "A", focus: "CULTURE_BIZ" },
  { rank: 13, city: "DUBLIN, IRE", tier: "A", focus: "EU_TECH_HQ" },
  { rank: 14, city: "CHICAGO, USA", tier: "B+", focus: "CORP_FINANCE" },
  { rank: 15, city: "DALLAS, USA", tier: "B+", focus: "ENERGY_BIZ" },
  { rank: 16, city: "MANCHESTER, UK", tier: "B+", focus: "UK_GROWTH" },
  { rank: 17, city: "SEATTLE, USA", tier: "B+", focus: "CLOUD_TECH" },
  { rank: 18, city: "VANCOUVER, CAN", tier: "B", focus: "LIFESTYLE_TECH" },
  { rank: 19, city: "BRISBANE, AUS", tier: "B", focus: "QLD_GROWTH" },
  { rank: 20, city: "HOUSTON, USA", tier: "B", focus: "INDUSTRIAL" },
  { rank: 21, city: "BOSTON, USA", tier: "B", focus: "BIO_ROBOTICS" },
  { rank: 22, city: "ATLANTA, USA", tier: "B", focus: "MEDIA_CORP" },
  { rank: 23, city: "HONG KONG", tier: "B", focus: "FINANCE_HUB" },
  { rank: 24, city: "EDINBURGH, UK", tier: "C+", focus: "FINTECH" },
  { rank: 25, city: "DENVER, USA", tier: "C+", focus: "STARTUP_HUB" },
  { rank: 26, city: "SAN DIEGO, USA", tier: "C+", focus: "DEFENSE_BIO" },
  { rank: 27, city: "GOLD COAST, AUS", tier: "C", focus: "TOURISM_WEALTH" },
  { rank: 28, city: "PERTH, AUS", tier: "C", focus: "MINING_WEALTH" },
  { rank: 29, city: "AUCKLAND, NZ", tier: "C", focus: "NZ_HUB" },
  { rank: 30, city: "PHOENIX, USA", tier: "C", focus: "MFG_TECH" }
];

// Reusable Icon Wrapper
const IconWrapper = ({ path, className = "w-3.5 h-3.5" }: { path: React.ReactNode, className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  // Main Categories
  Operate: <IconWrapper path={<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />} className="w-4 h-4" />,
  Create: <IconWrapper path={<path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" />} className="w-4 h-4" />,
  Studio: <IconWrapper path={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>} className="w-4 h-4" />,
  Sell: <IconWrapper path={<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />} className="w-4 h-4" />,
  Control: <IconWrapper path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>} className="w-4 h-4" />,
  
  // Operate Icons
  Command: <IconWrapper path={<><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>} />,
  Radar: <IconWrapper path={<><circle cx="12" cy="12" r="10" /><path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z" /></>} />,
  Swarm: <IconWrapper path={<><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>} />,
  Target: <IconWrapper path={<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>} />,
  Pipeline: <IconWrapper path={<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>} />,
  WarRoom: <IconWrapper path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>} />,
  Brain: <IconWrapper path={<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />} />,
  Pulse: <IconWrapper path={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />} />,
  Eye: <IconWrapper path={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>} />,
  FileText: <IconWrapper path={<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />} />,
  Ruler: <IconWrapper path={<path d="M2 12h20M2 12l5-5M2 12l5 5" />} />,
  Chart: <IconWrapper path={<path d="M18 20V10M12 20V4M6 20v-6" />} />,
  Map: <IconWrapper path={<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />} />,
  Terminal: <IconWrapper path={<><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></>} />,
  Test: <IconWrapper path={<path d="M8.5 2h7l-5 10 5 10h-7l5-10-5-10z" />} />,
  Check: <IconWrapper path={<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />} />,
  Globe: <IconWrapper path={<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>} />,

  // Create Icons
  Palette: <IconWrapper path={<><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></>} />,
  Monitor: <IconWrapper path={<><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>} />,
  Box: <IconWrapper path={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>} />,
  Zap: <IconWrapper path={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />} />,
  Lock: <IconWrapper path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>} />,

  // Studio Icons
  Video: <IconWrapper path={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>} />,
  Scan: <IconWrapper path={<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />} />,
  Film: <IconWrapper path={<><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></>} />,
  Move: <IconWrapper path={<polyline points="5 9 2 12 5 15" />} />,
  Music: <IconWrapper path={<path d="M9 18V5l12-2v13" />} />,
  Pen: <IconWrapper path={<path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" />} />,

  // Sell Icons
  Briefcase: <IconWrapper path={<><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>} />,
  Contract: <IconWrapper path={<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />} />,
  Calc: <IconWrapper path={<><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M16 18h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /><path d="M16 14h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /></>} />,
  Link: <IconWrapper path={<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />} />,
  Columns: <IconWrapper path={<path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />} />,
  Sandbox: <IconWrapper path={<path d="M12 2l9 4.9V17L12 22l-9-4.9V7z" />} />,
  Edit: <IconWrapper path={<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />} />,
  Mic: <IconWrapper path={<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />} />,
  Bot: <IconWrapper path={<rect x="3" y="11" width="18" height="10" rx="2" />} />,
  Megaphone: <IconWrapper path={<path d="M22 8.35V2.36a1 1 0 0 0-1.42-.86l-7.1 3.53a3 3 0 0 0-1.63 2.68v7.58a3 3 0 0 0 1.63 2.68l7.1 3.53a1 1 0 0 0 1.42-.86v-5.99" />} />,
  Flow: <IconWrapper path={<polyline points="16 18 22 12 16 6" />} />,

  // Control Icons
  Book: <IconWrapper path={<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />} />,
  Card: <IconWrapper path={<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />} />,
  Handshake: <IconWrapper path={<path d="M12 12l8-8V2" />} />,
  Building: <IconWrapper path={<path d="M12 12V2" />} />,
  Cog: <IconWrapper path={<circle cx="12" cy="12" r="3" />} />,
  Key: <IconWrapper path={<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />} />,
  Network: <IconWrapper path={<circle cx="12" cy="12" r="10" />} />,
  Clock: <IconWrapper path={<circle cx="12" cy="12" r="10" />} />,
  List: <IconWrapper path={<line x1="8" y1="6" x2="21" y2="6" />} />,
  Theme: <IconWrapper path={<circle cx="12" cy="12" r="10" />} />,
  Token: <IconWrapper path={<circle cx="12" cy="12" r="10" />} />,
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeMode, 
  setActiveMode,
  activeModule,
  onSearchClick,
  theater,
  setTheater,
  theme,
  toggleTheme
}) => {
  // Sidebar items corresponding to MainMode
  const navItems: { mode: MainMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'OPERATE', label: 'OPERATE', icon: Icons.Operate },
    { mode: 'CREATE', label: 'CREATE', icon: Icons.Create },
    { mode: 'STUDIO', label: 'STUDIO', icon: Icons.Studio },
    { mode: 'SELL', label: 'SELL', icon: Icons.Sell },
    { mode: 'CONTROL', label: 'CONTROL', icon: Icons.Control },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617] text-slate-300' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`w-full md:w-64 flex-shrink-0 flex flex-col border-r transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b1021] border-slate-800' : 'bg-white border-slate-200'}`}>
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <div>
              <h1 className={`text-lg font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Pomelli</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">OS V13.2</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => setActiveMode(item.mode)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                activeMode === item.mode
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 ${activeMode === item.mode ? 'text-white' : 'text-current'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              {activeMode === item.mode && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/50 space-y-3">
           <button 
             onClick={onSearchClick}
             className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
           >
              <span className="text-lg">🔍</span>
              <span className="text-[10px] font-black uppercase tracking-widest">COMMAND K</span>
           </button>
           
           <button
             onClick={toggleTheme}
             className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-slate-900 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400'}`}
           >
              <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{theme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'}</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-20 border-b flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-xl ${theme === 'dark' ? 'bg-[#020617]/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
           <div className="flex items-center gap-4">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${theme === 'dark' ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-300'}`}>
                 {activeMode} / {activeModule.replace('_', ' ')}
              </span>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">THEATER:</span>
                 <select 
                   value={theater} 
                   onChange={(e) => setTheater(e.target.value)}
                   className={`bg-transparent text-[10px] font-bold uppercase focus:outline-none cursor-pointer border-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                 >
                    {STRATEGIC_CITIES.map(c => (
                      <option key={c.city} value={c.city}>{c.city} [{c.tier}]</option>
                    ))}
                 </select>
              </div>
              
              <div className="w-px h-6 bg-slate-800/50 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white/10 shadow-lg"></div>
                 <div className="hidden sm:block text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AGENT ZERO</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">COMMANDER</p>
                 </div>
              </div>
           </div>
        </header>

        <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
           {children}
        </main>
      </div>
    </div>
  );
};
