
import React, { useState, useEffect } from 'react';
import { MainMode, SubModule } from '../types';

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
  currentLayout: string;
  setLayoutMode: (mode: string) => void;
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
  { rank: 26, city: "SAN DIEGO, USA", tier: "C+", focus: "DEFENSE_BIO" }
];

// Reusable Icon Wrapper
const IconWrapper = ({ path, className = "w-5 h-5" }: { path: React.ReactNode, className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  Operate: <IconWrapper path={<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />} />,
  Create: <IconWrapper path={<path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" />} />,
  Studio: <IconWrapper path={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>} />,
  Sell: <IconWrapper path={<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />} />,
  Control: <IconWrapper path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>} />,
};

// --- 54 MODULE REGISTRY ---
const SUB_MODULES: Record<MainMode, { id: SubModule; label: string }[]> = {
  OPERATE: [
    { id: 'COMMAND', label: 'Mission Control' },
    { id: 'RADAR_RECON', label: 'Radar Recon' },
    { id: 'AUTO_CRAWL', label: 'Auto Crawl' },
    { id: 'TARGET_LIST', label: 'Target Ledger' },
    { id: 'PIPELINE', label: 'Pipeline' },
    { id: 'WAR_ROOM', label: 'War Room' },
    { id: 'DEEP_LOGIC', label: 'Deep Logic' },
    { id: 'WORKSPACE', label: 'Workspace' },
    { id: 'VIRAL_PULSE', label: 'Viral Pulse' },
    { id: 'VISION_LAB', label: 'Vision Lab' },
    { id: 'ARTICLE_INTEL', label: 'Article Intel' },
    { id: 'BENCHMARK', label: 'Benchmark' },
    { id: 'ANALYTICS', label: 'Analytics' },
    { id: 'ANALYTICS_HUB', label: 'Dominance Hub' },
    { id: 'HEATMAP', label: 'Heatmap' },
    { id: 'PROMPT_AI', label: 'Prompt Interface' },
    { id: 'MODEL_TEST', label: 'Model Test' },
    { id: 'FACT_CHECK', label: 'Fact Check' },
    { id: 'TRANSLATOR', label: 'Translator' }
  ],
  CREATE: [
    { id: 'VISUAL_STUDIO', label: 'Visual Studio' },
    { id: 'MOCKUPS_4K', label: '4K Mockups' },
    { id: 'PRODUCT_SYNTH', label: 'Product Synth' },
    { id: 'FLASH_SPARK', label: 'Flash Spark' },
    { id: 'MEDIA_VAULT', label: 'Media Vault' }
  ],
  STUDIO: [
    { id: 'VIDEO_PITCH', label: 'Veo Pitch' },
    { id: 'VIDEO_AI', label: 'Video Audit' },
    { id: 'CINEMA_INTEL', label: 'Cinema Intel' },
    { id: 'MOTION_LAB', label: 'Motion Lab' },
    { id: 'SONIC_STUDIO', label: 'Sonic Studio' },
    { id: 'LIVE_SCRIBE', label: 'Live Scribe' }
  ],
  SELL: [
    { id: 'BUSINESS_ORCHESTRATOR', label: 'Orchestrator' },
    { id: 'PROPOSALS', label: 'Proposals' },
    { id: 'ROI_CALC', label: 'ROI Calc' },
    { id: 'SEQUENCER', label: 'Sequencer' },
    { id: 'DECK_ARCH', label: 'Deck Architect' },
    { id: 'DEMO_SANDBOX', label: 'Demo Sandbox' },
    { id: 'DRAFTING', label: 'Drafting' },
    { id: 'VOICE_STRAT', label: 'Voice Strat' },
    { id: 'AI_CONCIERGE', label: 'AI Concierge' },
    { id: 'PITCH_GEN', label: 'Pitch Gen' },
    { id: 'FUNNEL_MAP', label: 'Funnel Map' }
  ],
  CONTROL: [
    { id: 'PLAYBOOK', label: 'Playbook' },
    { id: 'BILLING', label: 'Billing' },
    { id: 'AFFILIATE', label: 'Affiliate' },
    { id: 'IDENTITY', label: 'Identity' },
    { id: 'OS_FORGE', label: 'OS Forge' },
    { id: 'EXPORT_DATA', label: 'Export Data' },
    { id: 'CALENDAR', label: 'Calendar' },
    { id: 'PROD_LOG', label: 'Prod Log' },
    { id: 'SETTINGS', label: 'Settings' },
    { id: 'CIPHER_NODE', label: 'Cipher Node' },
    { id: 'NEXUS_GRAPH', label: 'Nexus Graph' },
    { id: 'CHRONOS', label: 'Chronos' },
    { id: 'TASKS', label: 'Tasks' },
    { id: 'THEME', label: 'Theme' },
    { id: 'TOKENS', label: 'Tokens' }
  ]
};

// HIGH CONTRAST VISUAL CONFIG
// Text is always white/off-white. These control Borders and Glows.
const MODE_CONFIG: Record<MainMode, { borderClass: string; bgClass: string; shadowClass: string; icon: React.ReactNode }> = {
  OPERATE: { 
    borderClass: 'border-indigo-500', 
    bgClass: 'bg-indigo-500/20', 
    shadowClass: 'shadow-indigo-500/20',
    icon: Icons.Operate 
  },
  CREATE: { 
    borderClass: 'border-violet-500', 
    bgClass: 'bg-violet-500/20', 
    shadowClass: 'shadow-violet-500/20',
    icon: Icons.Create 
  },
  STUDIO: { 
    borderClass: 'border-amber-500', 
    bgClass: 'bg-amber-500/20', 
    shadowClass: 'shadow-amber-500/20',
    icon: Icons.Studio 
  },
  SELL: { 
    borderClass: 'border-emerald-500', 
    bgClass: 'bg-emerald-500/20', 
    shadowClass: 'shadow-emerald-500/20',
    icon: Icons.Sell 
  },
  CONTROL: { 
    borderClass: 'border-cyan-500', 
    bgClass: 'bg-cyan-500/20', 
    shadowClass: 'shadow-cyan-500/20',
    icon: Icons.Control 
  },
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeMode, 
  setActiveMode,
  activeModule,
  setActiveModule,
  onSearchClick,
  theater,
  setTheater,
  theme,
  toggleTheme,
  currentLayout,
  setLayoutMode
}) => {
  const activeConfig = MODE_CONFIG[activeMode];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* --- TIER 1: STRATEGIC HEADER --- */}
      <header className={`h-24 border-b sticky top-0 z-50 backdrop-blur-xl transition-all duration-500 ${theme === 'dark' ? 'bg-[#0b1021]/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
         <div className="max-w-[1920px] mx-auto px-10 h-full flex items-center justify-between relative">
            
            {/* Logo */}
            <div className="flex items-center gap-4 w-64">
               <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <span className="text-white font-black text-3xl">P</span>
               </div>
               <div>
                  <h1 className={`text-2xl font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Prospector OS</h1>
               </div>
            </div>

            {/* Centered Main Navigation Tabs */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-2xl backdrop-blur-md">
               {(Object.keys(MODE_CONFIG) as MainMode[]).map((mode) => {
                 const isActive = activeMode === mode;
                 const config = MODE_CONFIG[mode];
                 return (
                   <button
                     key={mode}
                     onClick={() => setActiveMode(mode)}
                     className={`relative px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
                       isActive 
                         ? `text-white border-2 ${config.borderClass} ${config.bgClass} shadow-lg ${config.shadowClass}` 
                         : 'text-slate-400 hover:text-white border-2 border-transparent hover:bg-slate-900'
                     }`}
                   >
                     <span className={isActive ? 'opacity-100 text-white scale-110' : 'opacity-60'}>{config.icon}</span>
                     {mode}
                   </button>
                 );
               })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6 w-64 justify-end">
               {/* Layout Switcher */}
               <div className="relative group">
                  <button 
                    className={`p-4 rounded-2xl transition-all border-2 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'}`}
                    title="Switch Layout"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#0b1021] border border-slate-800 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     <button onClick={() => setLayoutMode('LEGACY')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-indigo-400 bg-indigo-900/10 hover:bg-indigo-900/20 transition-colors border-b border-slate-800">
                        LEGACY (HORIZONTAL)
                     </button>
                     <button onClick={() => setLayoutMode('COMMAND')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors border-b border-slate-800">
                        COMMAND (SIDEBAR)
                     </button>
                     <button onClick={() => setLayoutMode('ZENITH')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-indigo-400 bg-indigo-900/10 hover:bg-indigo-900/20 transition-colors">
                        ZENITH (TOP NAV)
                     </button>
                  </div>
               </div>

               <button 
                 onClick={onSearchClick}
                 className={`p-4 rounded-2xl transition-all border-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'}`}
                 title="Command K"
               >
                  <IconWrapper path={<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />} />
               </button>

               <div className="relative group">
                 <select 
                   value={theater} 
                   onChange={(e) => setTheater(e.target.value)}
                   className={`bg-transparent text-sm font-bold uppercase focus:outline-none cursor-pointer border-none max-w-[160px] truncate py-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                 >
                    {STRATEGIC_CITIES.map(c => (
                      <option key={c.city} value={c.city}>{c.city}</option>
                    ))}
                 </select>
                 <div className="absolute -bottom-1 left-0 w-full h-px bg-slate-800 group-hover:bg-indigo-500 transition-colors"></div>
               </div>

               <button
                 onClick={toggleTheme}
                 className={`p-4 rounded-2xl transition-all border-2 ${theme === 'dark' ? 'border-slate-800 hover:bg-slate-900 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 border-transparent'}`}
               >
                  {theme === 'dark' ? '🌙' : '☀️'}
               </button>
            </div>
         </div>
      </header>

      {/* --- TIER 2: TACTICAL SUB-MODULES (THE 54 BUTTONS) --- */}
      <div className={`border-b sticky top-24 z-40 transition-colors duration-500 shadow-md ${theme === 'dark' ? 'bg-[#05091a] border-slate-800' : 'bg-slate-50 border-slate-200'} backdrop-blur-md`}>
         <div className="max-w-[1920px] mx-auto px-10 py-5 flex items-center justify-start overflow-x-auto custom-scrollbar no-scrollbar">
            <div className="flex gap-3">
               {SUB_MODULES[activeMode].map((mod) => {
                 const isActive = activeModule === mod.id;
                 return (
                   <button
                     key={mod.id}
                     onClick={() => setActiveModule(mod.id)}
                     className={`px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                       isActive
                         ? `text-white ${activeConfig.borderClass} ${activeConfig.bgClass} shadow-lg ${activeConfig.shadowClass} scale-[1.02]`
                         : theme === 'dark' 
                           ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800' 
                           : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                     }`}
                   >
                     {mod.label}
                   </button>
                 );
               })}
            </div>
         </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="relative min-h-[calc(100vh-180px)]">
         {/* Background Ambient Glow based on Mode */}
         <div className={`fixed inset-0 pointer-events-none opacity-[0.03] transition-colors duration-1000 ${activeConfig.bgClass.replace('/20', '/10')}`}></div>
         {children}
      </main>
    </div>
  );
};
