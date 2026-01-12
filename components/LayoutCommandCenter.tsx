
import React, { useState, useMemo } from 'react';
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

// --- ICONS ---
const IconWrapper = ({ path, className = "w-5 h-5" }: { path: React.ReactNode, className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  OPERATE: <IconWrapper path={<path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />} />,
  CREATE: <IconWrapper path={<path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />} />,
  STUDIO: <IconWrapper path={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>} />,
  SELL: <IconWrapper path={<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />} />,
  CONTROL: <IconWrapper path={<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />} />,
};

// Fix: Update MODULE_GROUPS to use valid MainMode and SubModule keys
const MODULE_GROUPS: Record<MainMode, Record<string, { id: SubModule; label: string }[]>> = {
  RESEARCH: {
    "Research": [
      { id: 'EXECUTIVE_DASHBOARD', label: 'Dashboard' },
      { id: 'MARKET_DISCOVERY', label: 'Lead Discovery' },
      { id: 'AUTOMATED_SEARCH', label: 'Auto Search' },
      { id: 'MARKET_TRENDS', label: 'Trend Monitor' },
    ],
    "CRM & Strategy": [
      { id: 'PROSPECT_DATABASE', label: 'Lead Database' },
      { id: 'STRATEGY_CENTER', label: 'Strategy Hub' },
      { id: 'PIPELINE', label: 'Sales Pipeline' },
      { id: 'ANALYTICS_HUB', label: 'Market Analytics' },
    ],
    "Analysis Tools": [
      { id: 'BENCHMARK', label: 'Reverse Engineer' },
      { id: 'VISUAL_ANALYSIS', label: 'Vision Analysis' },
      { id: 'STRATEGIC_REASONING', label: 'Deep Analysis' },
      { id: 'CONTENT_ANALYSIS', label: 'Content Analysis' },
    ],
    "Utilities": [
        { id: 'WORKSPACE', label: 'Gemini Workspace' },
        { id: 'PROMPT_INTERFACE', label: 'Prompt Interface' },
        { id: 'MODEL_BENCH', label: 'Model Bench' },
        { id: 'TRANSLATOR', label: 'Translator' }
    ]
  },
  DESIGN: {
    "Creative Studio": [
      { id: 'VISUAL_STUDIO', label: 'Creative Studio' },
      { id: 'BRAND_DNA', label: 'Brand DNA' },
      { id: 'MOCKUPS_4K', label: 'Mockup Generator' },
    ],
    "Assets": [
      { id: 'PRODUCT_SYNTHESIS', label: 'Product Design' },
      { id: 'CONTENT_IDEATION', label: 'Flash Spark' },
      { id: 'ASSET_LIBRARY', label: 'Asset Library' },
    ]
  },
  MEDIA: {
    "Video": [
      { id: 'VIDEO_PRODUCTION', label: 'Video Studio' },
      { id: 'VIDEO_AUDIT', label: 'Video Audit' },
      { id: 'VIDEO_INSIGHTS', label: 'Video Analysis' },
      { id: 'MOTION_LAB', label: 'Motion Design' },
    ],
    "Audio": [
      { id: 'SONIC_STUDIO', label: 'Audio Studio' },
      { id: 'MEETING_NOTES', label: 'Live Scribe' },
    ]
  },
  OUTREACH: {
    "Strategy": [
      { id: 'CAMPAIGN_ORCHESTRATOR', label: 'Campaign Builder' },
      { id: 'PRESENTATION_BUILDER', label: 'Deck Architect' },
      { id: 'FUNNEL_MAP', label: 'Funnel Map' },
    ],
    "Execution": [
      { id: 'PROPOSALS', label: 'Proposal Builder' },
      { id: 'SEQUENCER', label: 'Outreach Builder' },
      { id: 'ELEVATOR_PITCH', label: 'Pitch Generator' },
      { id: 'SALES_COACH', label: 'Sales Coach' },
    ],
    "Simulation": [
      { id: 'ROI_CALCULATOR', label: 'ROI Calculator' },
      { id: 'DEMO_SANDBOX', label: 'Growth Simulator' },
      { id: 'AI_CONCIERGE', label: 'AI Agent' },
    ]
  },
  ADMIN: {
    "Operations": [
      { id: 'AGENCY_PLAYBOOK', label: 'Playbook' },
      { id: 'IDENTITY', label: 'Identity' },
      { id: 'BILLING', label: 'Billing' },
      { id: 'AFFILIATE', label: 'Affiliate' },
    ],
    "System": [
      { id: 'SETTINGS', label: 'Settings' },
      { id: 'SYSTEM_CONFIG', label: 'System Config' },
      { id: 'THEME', label: 'Theme' },
      { id: 'USAGE_STATS', label: 'Credits' },
    ],
    "Logs": [
        { id: 'EXPORT_DATA', label: 'Data Export' },
        { id: 'ACTIVITY_LOGS', label: 'Activity Logs' },
        { id: 'TIMELINE', label: 'Timeline' },
        { id: 'NEXUS_GRAPH', label: 'Entity Graph' },
    ]
  }
};

// Fix: Update MODE_CONFIG to use valid MainMode keys
const MODE_CONFIG: Record<MainMode, { color: string; bg: string; shadowClass: string; icon: React.ReactNode }> = {
  RESEARCH: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.OPERATE },
  DESIGN: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.CREATE },
  MEDIA: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.STUDIO },
  OUTREACH: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.SELL },
  ADMIN: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', shadowClass: 'shadow-emerald-500/20', icon: Icons.CONTROL },
};

export const LayoutCommandCenter: React.FC<LayoutProps> = ({ 
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
  const [moduleFilter, setModuleFilter] = useState('');
  
  // Fix: activeMode values are already RESEARCH, MEDIA, etc.
  const displayMode = activeMode;

  const activeConfig = MODE_CONFIG[activeMode];
  const groups = MODULE_GROUPS[activeMode];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 bg-[#020617] text-slate-100`}>
      
      {/* --- PANE 1: MODE RAIL --- */}
      <div className={`w-[80px] flex-shrink-0 flex flex-col items-center py-6 border-r z-50 bg-[#05091a] border-slate-800`}>
        <div className="mb-8">
           <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white font-black text-xl">
             P
           </div>
        </div>

        <nav className="flex-1 flex flex-col gap-6 w-full px-2">
          {(Object.keys(MODE_CONFIG) as MainMode[]).map((mode) => {
            const isActive = activeMode === mode;
            const config = MODE_CONFIG[mode];
            const label = mode;

            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 group relative ${
                  isActive ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className={`p-2.5 rounded-lg transition-all ${isActive ? `${config.bg} ${config.color} shadow-inner` : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {config.icon}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-600'}`}>
                  {label}
                </span>
                {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${config.color.replace('text', 'bg')}`}></div>}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-4 mt-auto">
           <button onClick={toggleTheme} className="p-3 rounded-xl text-slate-500 hover:bg-slate-800 transition-all">
              {theme === 'dark' ? '🌙' : '☀️'}
           </button>
        </div>
      </div>

      {/* --- PANE 2: MODULE RAIL --- */}
      <div className={`w-[210px] flex-shrink-0 flex flex-col border-r z-40 transition-colors bg-[#0b1021] border-slate-800`}>
         
         {/* Sidebar Header */}
         <div className="h-16 px-6 border-b border-dashed border-slate-800/50 flex items-center justify-between shrink-0">
            <h2 className={`text-sm font-black uppercase tracking-widest ${activeConfig.color}`}>{displayMode}</h2>
         </div>

         {/* Search Filter */}
         <div className="p-4 shrink-0">
            <div className={`flex items-center px-3 py-2 rounded-lg border transition-colors bg-[#020617] border-slate-800 focus-within:border-slate-600`}>
               <svg className="w-4 h-4 text-slate-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input 
                 className="bg-transparent w-full text-xs font-medium focus:outline-none placeholder-slate-600 text-slate-300"
                 placeholder="Filter..."
                 value={moduleFilter}
                 onChange={(e) => setModuleFilter(e.target.value)}
               />
            </div>
         </div>

         {/* Module List */}
         <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6">
            {Object.entries(groups).map(([groupName, modules]) => {
               const filteredModules = (modules as { id: SubModule; label: string }[]).filter(m => m.label.toLowerCase().includes(moduleFilter.toLowerCase()));
               if (filteredModules.length === 0) return null;

               return (
                 <div key={groupName} className="mb-6 animate-in slide-in-from-left-2 duration-300">
                    <h3 className="px-3 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">{groupName}</h3>
                    <div className="space-y-0.5">
                       {filteredModules.map(mod => {
                         const isActive = activeModule === mod.id;
                         return (
                           <button
                             key={mod.id}
                             onClick={() => setActiveModule(mod.id)}
                             className={`w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all relative group flex items-center justify-between ${
                               isActive 
                                 ? `bg-slate-800 text-white shadow-lg` 
                                 : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                             }`}
                           >
                             <span className="truncate">{mod.label}</span>
                             {isActive && <div className={`w-1.5 h-1.5 rounded-full ${activeConfig.color.replace('text', 'bg')} shadow-lg shadow-current`}></div>}
                           </button>
                         );
                       })}
                    </div>
                 </div>
               );
            })}
         </div>

         <div className="p-4 border-t border-slate-800 bg-slate-900/30">
            <button 
              onClick={onSearchClick}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-[10px] font-black uppercase tracking-widest"
            >
               <span>⌘K</span> PALETTE
            </button>
         </div>
      </div>

      {/* --- PANE 3: MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-slate-950">
         
         <header className={`h-16 px-8 border-b flex items-center justify-between shrink-0 backdrop-blur-md z-30 transition-colors bg-[#020617]/80 border-slate-800`}>
            <div className="flex items-center gap-4">
               <span className="text-slate-500 text-sm">/</span>
               <span className={`text-xs font-black uppercase tracking-widest ${activeConfig.color}`}>{displayMode}</span>
               <span className="text-slate-500 text-sm">/</span>
               {/* Resolve Label Dynamically */}
               <span className={`text-xs font-black uppercase tracking-widest text-white`}>
                 {(Object.values(groups).flat() as { id: SubModule; label: string }[]).find(m => m.id === activeModule)?.label || activeModule}
               </span>
            </div>

            <div className="flex items-center gap-6">
               <div className="relative group">
                  <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                     <span>LAYOUT: {currentLayout}</span>
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#0b1021] border border-slate-800 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     <button onClick={() => setLayoutMode('LEGACY')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors border-b border-slate-800">
                        LEGACY (HORIZONTAL)
                     </button>
                     <button onClick={() => setLayoutMode('COMMAND')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-emerald-400 bg-emerald-900/10 hover:bg-emerald-900/20 transition-colors border-b border-slate-800">
                        COMMAND (SIDEBAR)
                     </button>
                     <button onClick={() => setLayoutMode('ZENITH')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
                        ZENITH (TOP NAV)
                     </button>
                  </div>
               </div>

               <div className="h-4 w-px bg-slate-800"></div>

               <select 
                  value={theater} 
                  onChange={(e) => setTheater(e.target.value)}
                  className={`bg-transparent text-xs font-bold uppercase focus:outline-none cursor-pointer border-none max-w-[140px] truncate text-slate-300`}
               >
                  <option value="CYPRUS">CYPRUS</option>
                  <option value="DUBAI">DUBAI</option>
                  <option value="LONDON">LONDON</option>
                  <option value="NEW YORK">NEW YORK</option>
               </select>
            </div>
         </header>

         <main className="flex-1 overflow-y-auto custom-scrollbar relative p-8">
            <div className={`fixed inset-0 pointer-events-none opacity-[0.02] transition-colors duration-1000 ${activeConfig.bg.replace('/10', '/5')}`}></div>
            <div className="max-w-[1920px] mx-auto pb-24">
               {children}
            </div>
         </main>

      </div>
    </div>
  );
};
