
import React from 'react';
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
  { rank: 1, city: "NEW YORK, USA" },
  { rank: 2, city: "LONDON, UK" },
  { rank: 3, city: "DUBAI, UAE" },
  { rank: 4, city: "SINGAPORE" },
  { rank: 5, city: "AUSTIN, USA" },
  { rank: 6, city: "MIAMI, USA" },
  { rank: 7, city: "SYDNEY, AUS" },
  { rank: 8, city: "SAN FRANCISCO, USA" },
  { rank: 9, city: "TORONTO, CAN" },
  { rank: 10, city: "LOS ANGELES, USA" },
  { rank: 11, city: "ZURICH, SWI" },
  { rank: 12, city: "MELBOURNE, AUS" },
  { rank: 13, city: "DUBLIN, IRE" },
  { rank: 14, city: "CHICAGO, USA" },
  { rank: 15, city: "DALLAS, USA" },
  { rank: 16, city: "MANCHESTER, UK" },
  { rank: 17, city: "SEATTLE, USA" },
  { rank: 18, city: "VANCOUVER, CAN" },
  { rank: 19, city: "BRISBANE, AUS" },
  { rank: 20, city: "HOUSTON, USA" },
  { rank: 21, city: "BOSTON, USA" },
  { rank: 22, city: "ATLANTA, USA" },
  { rank: 23, city: "HONG KONG" },
  { rank: 24, city: "EDINBURGH, UK" },
  { rank: 25, city: "DENVER, USA" },
  { rank: 26, city: "SAN DIEGO, USA" },
  { rank: 27, city: "TOKYO, JPN" },
  { rank: 28, city: "BERLIN, GER" },
  { rank: 29, city: "AMSTERDAM, NL" },
  { rank: 30, city: "PARIS, FRA" }
];

const IconWrapper = ({ path, className = "w-5 h-5" }: { path: React.ReactNode, className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  Operate: <IconWrapper path={<path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />} />,
  Create: <IconWrapper path={<path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" />} />,
  Studio: <IconWrapper path={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>} />,
  Sell: <IconWrapper path={<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />} />,
  Control: <IconWrapper path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>} />,
};

// Fix: Update SUB_MODULES to use valid MainMode and SubModule keys
const SUB_MODULES: Record<MainMode, { id: SubModule; label: string }[]> = {
  RESEARCH: [
    { id: 'EXECUTIVE_DASHBOARD', label: 'Mission Control' },
    { id: 'MARKET_DISCOVERY', label: 'Radar Recon' },
    { id: 'AUTOMATED_SEARCH', label: 'Auto Crawl' },
    { id: 'PROSPECT_DATABASE', label: 'Target Ledger' },
    { id: 'PIPELINE', label: 'Pipeline' },
    { id: 'STRATEGY_CENTER', label: 'War Room' },
    { id: 'STRATEGIC_REASONING', label: 'Deep Logic' },
    { id: 'WORKSPACE', label: 'Workspace' },
    { id: 'MARKET_TRENDS', label: 'Viral Pulse' },
    { id: 'VISUAL_ANALYSIS', label: 'Vision Lab' },
    { id: 'CONTENT_ANALYSIS', label: 'Article Intel' },
    { id: 'BENCHMARK', label: 'Benchmark' },
    { id: 'ANALYTICS', label: 'Analytics' },
    { id: 'ANALYTICS_HUB', label: 'Dominance Hub' },
    { id: 'HEATMAP', label: 'Heatmap' },
    { id: 'PROMPT_INTERFACE', label: 'Prompt Interface' },
    { id: 'MODEL_BENCH', label: 'Model Test' },
    { id: 'FACT_CHECK', label: 'Fact Check' },
    { id: 'TRANSLATOR', label: 'Translator' }
  ],
  DESIGN: [
    { id: 'VISUAL_STUDIO', label: 'Visual Studio' },
    { id: 'BRAND_DNA', label: 'Brand DNA' },
    { id: 'MOCKUPS_4K', label: '4K Mockups' },
    { id: 'PRODUCT_SYNTHESIS', label: 'Product Synth' },
    { id: 'CONTENT_IDEATION', label: 'Flash Spark' },
    { id: 'ASSET_LIBRARY', label: 'Media Vault' }
  ],
  MEDIA: [
    { id: 'VIDEO_PRODUCTION', label: 'Veo Pitch' },
    { id: 'VIDEO_AUDIT', label: 'Video Audit' },
    { id: 'VIDEO_INSIGHTS', label: 'Cinema Intel' },
    { id: 'MOTION_LAB', label: 'Motion Lab' },
    { id: 'SONIC_STUDIO', label: 'Sonic Studio' },
    { id: 'MEETING_NOTES', label: 'Live Scribe' }
  ],
  OUTREACH: [
    { id: 'CAMPAIGN_ORCHESTRATOR', label: 'Orchestrator' },
    { id: 'PROPOSALS', label: 'Proposals' },
    { id: 'ROI_CALCULATOR', label: 'ROI Calc' },
    { id: 'SEQUENCER', label: 'Sequencer' },
    { id: 'PRESENTATION_BUILDER', label: 'Deck Architect' },
    { id: 'DEMO_SANDBOX', label: 'Demo Sandbox' },
    { id: 'DRAFTING', label: 'Drafting' },
    { id: 'SALES_COACH', label: 'Voice Strat' },
    { id: 'AI_CONCIERGE', label: 'AI Concierge' },
    { id: 'ELEVATOR_PITCH', label: 'Pitch Gen' },
    { id: 'FUNNEL_MAP', label: 'Funnel Map' }
  ],
  ADMIN: [
    { id: 'AGENCY_PLAYBOOK', label: 'Playbook' },
    { id: 'BILLING', label: 'Billing' },
    { id: 'AFFILIATE', label: 'Affiliate' },
    { id: 'IDENTITY', label: 'Identity' },
    { id: 'SYSTEM_CONFIG', label: 'OS Forge' },
    { id: 'EXPORT_DATA', label: 'Export Data' },
    { id: 'CALENDAR', label: 'Calendar' },
    { id: 'ACTIVITY_LOGS', label: 'Prod Log' },
    { id: 'SETTINGS', label: 'Settings' },
    { id: 'NEXUS_GRAPH', label: 'Nexus Graph' },
    { id: 'TIMELINE', label: 'Chronos' },
    { id: 'TASK_MANAGER', label: 'Tasks' },
    { id: 'THEME', label: 'Theme' },
    { id: 'USAGE_STATS', label: 'Tokens' }
  ]
};

// UNIFIED EMERALD CONFIG
// Fix: Update MODE_CONFIG to use valid MainMode keys
const MODE_CONFIG: Record<MainMode, { borderClass: string; bgClass: string; shadowClass: string; icon: React.ReactNode }> = {
  RESEARCH: { borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.Operate },
  DESIGN: { borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.Create },
  MEDIA: { borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.Studio },
  OUTREACH: { borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.Sell },
  ADMIN: { borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.Control },
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeMode, setActiveMode, activeModule, setActiveModule, onSearchClick, theater, setTheater, theme, toggleTheme, currentLayout, setLayoutMode
}) => {
  const activeConfig = MODE_CONFIG[activeMode];

  return (
    <div className={`min-h-screen transition-colors duration-500 bg-[#020617] text-slate-100`}>
      <header className={`h-24 border-b sticky top-0 z-50 backdrop-blur-xl transition-all duration-500 bg-[#0b1021]/95 border-slate-800`}>
         <div className="max-w-[1920px] mx-auto px-10 h-full flex items-center justify-between relative">
            <div className="flex items-center gap-4 w-64">
               <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <span className="text-white font-black text-3xl">P</span>
               </div>
               <div><h1 className="text-2xl font-bold leading-none text-white">Prospector OS</h1></div>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-2xl backdrop-blur-md">
               {(Object.keys(MODE_CONFIG) as MainMode[]).map((mode) => {
                 const isActive = activeMode === mode;
                 const config = MODE_CONFIG[mode];
                 return (
                   <button
                     key={mode}
                     onClick={() => setActiveMode(mode)}
                     className={`relative px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
                       isActive ? `text-white border-2 ${config.borderClass} ${config.bgClass} shadow-lg ${config.shadowClass}` : 'text-slate-400 hover:text-white border-2 border-transparent hover:bg-slate-900'
                     }`}
                   >
                     <span className={isActive ? 'opacity-100 text-white scale-110' : 'opacity-60'}>{config.icon}</span>
                     {mode}
                   </button>
                 );
               })}
            </div>
            <div className="flex items-center gap-6 w-64 justify-end">
               <div className="relative group">
                  <button className="p-4 rounded-2xl transition-all border-2 bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#0b1021] border border-slate-800 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     <button onClick={() => setLayoutMode('LEGACY')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-emerald-400 bg-emerald-900/10 hover:bg-emerald-900/20 transition-colors border-b border-slate-800">LEGACY</button>
                     <button onClick={() => setLayoutMode('COMMAND')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors border-b border-slate-800">COMMAND</button>
                     <button onClick={() => setLayoutMode('ZENITH')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-emerald-400 bg-emerald-900/10 hover:bg-emerald-900/20 transition-colors">ZENITH</button>
                  </div>
               </div>
               <button onClick={onSearchClick} className="p-4 rounded-2xl transition-all border-2 bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600">
                  <IconWrapper path={<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />} />
               </button>
               <div className="relative group">
                 <select value={theater} onChange={(e) => setTheater(e.target.value)} className="bg-transparent text-sm font-bold uppercase focus:outline-none cursor-pointer border-none max-w-[1600px] truncate py-3 text-white">
                    {STRATEGIC_CITIES.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                 </select>
                 <div className="absolute -bottom-1 left-0 w-full h-px bg-slate-800 group-hover:bg-emerald-500 transition-colors"></div>
               </div>
            </div>
         </div>
      </header>
      <div className={`border-b sticky top-24 z-40 transition-colors duration-500 shadow-md bg-[#05091a] border-slate-800 backdrop-blur-md`}>
         <div className="max-w-[1920px] mx-auto px-10 py-5 flex items-center justify-start overflow-x-auto custom-scrollbar no-scrollbar">
            <div className="flex gap-3">
               {SUB_MODULES[activeMode].map((mod) => {
                 const isActive = activeModule === mod.id;
                 return (
                   <button key={mod.id} onClick={() => setActiveModule(mod.id)} className={`px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${isActive ? `text-white ${activeConfig.borderClass} ${activeConfig.bgClass} shadow-lg ${activeConfig.shadowClass} scale-[1.02]` : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800'}`}>
                     {mod.label}
                   </button>
                 );
               })}
            </div>
         </div>
      </div>
      <main className="relative min-h-[calc(100vh-180px)]">
         <div className={`fixed inset-0 pointer-events-none opacity-[0.03] transition-colors duration-1000 ${activeConfig.bgClass.replace('/20', '/10')}`}></div>
         {children}
      </main>
    </div>
  );
};
