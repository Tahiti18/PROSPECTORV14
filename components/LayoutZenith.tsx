
import React, { useState, useEffect, useRef } from 'react';
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

// --- TOP NAV MODE ICONS ---
const ModeIcon = ({ id, active }: { id: MainMode, active: boolean }) => {
  const cn = active ? "text-white" : "text-slate-400 group-hover:text-white";
  switch(id) {
    case 'OPERATE': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>; 
    case 'CREATE': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>; 
    case 'STUDIO': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>; 
    case 'SELL': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>; 
    case 'CONTROL': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>; 
  }
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  // OPERATE
  COMMAND: <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
};

const ModuleIcon = ({ id, className }: { id: string, className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {MODULE_ICONS[id] || <circle cx="12" cy="12" r="10" />}
  </svg>
);

const MODULE_GROUPS: Record<MainMode, Record<string, { id: SubModule; label: string; desc: string }[]>> = {
  OPERATE: {
    "Research": [
      { id: 'COMMAND', label: 'Dashboard', desc: 'Mission Control Overview' },
      { id: 'RADAR_RECON', label: 'Lead Discovery', desc: 'Find new targets in specific regions' },
      { id: 'AUTO_CRAWL', label: 'Auto Search', desc: 'Automated signal extraction' },
      { id: 'VIRAL_PULSE', label: 'Trend Monitor', desc: 'Real-time trend analysis' },
    ],
    "CRM & Strategy": [
      { id: 'TARGET_LIST', label: 'Lead Database', desc: 'Manage your prospects' },
      { id: 'WAR_ROOM', label: 'Strategy Hub', desc: 'Deep dive on specific lead' },
      { id: 'PIPELINE', label: 'Sales Pipeline', desc: 'Kanban view of deals' },
      { id: 'ANALYTICS_HUB', label: 'Market Analytics', desc: 'Aggregate data insights' },
    ],
    "Analysis Tools": [
      { id: 'BENCHMARK', label: 'Reverse Engineer', desc: 'Deconstruct competitor sites' },
      { id: 'VISION_LAB', label: 'Vision Analysis', desc: 'AI image analysis' },
      { id: 'DEEP_LOGIC', label: 'Deep Analysis', desc: 'Complex reasoning tasks' },
      { id: 'ARTICLE_INTEL', label: 'Content Analysis', desc: 'Summarize and analyze text' },
    ],
    "Utilities": [
        { id: 'WORKSPACE', label: 'Gemini Workspace', desc: 'General AI task runner' },
        { id: 'PROMPT_AI', label: 'Prompt Interface', desc: 'Direct LLM interaction' },
        { id: 'MODEL_TEST', label: 'Model Bench', desc: 'Compare model performance' },
        { id: 'TRANSLATOR', label: 'Translator', desc: 'Language localization' }
    ]
  },
  CREATE: {
    "Creative Studio": [
      { id: 'VISUAL_STUDIO', label: 'Creative Studio', desc: 'Generate brand imagery' },
      { id: 'BRAND_DNA', label: 'Brand DNA', desc: 'Extract Visual Identity' },
      { id: 'MOCKUPS_4K', label: 'Mockup Forge', desc: 'Create high-res product mockups' },
    ],
    "Assets": [
      { id: 'PRODUCT_SYNTH', label: 'Product Design', desc: 'Architect new offers' },
      { id: 'FLASH_SPARK', label: 'Flash Spark', desc: 'Viral content ideation' },
      { id: 'MEDIA_VAULT', label: 'Asset Library', desc: 'Manage generated assets' },
    ]
  },
  STUDIO: {
    "Video": [
      { id: 'VIDEO_PITCH', label: 'Video Studio', desc: 'AI Video Generation' },
      { id: 'VIDEO_AI', label: 'Video Audit', desc: 'Analyze video content' },
      { id: 'CINEMA_INTEL', label: 'Video Analysis', desc: 'Deep video understanding' },
      { id: 'MOTION_LAB', label: 'Motion Lab', desc: 'Motion graphics concepts' },
    ],
    "Audio": [
      { id: 'SONIC_STUDIO', label: 'Audio Studio', desc: 'AI Voice Generation' },
      { id: 'LIVE_SCRIBE', label: 'Live Scribe', desc: 'Real-time audio transcription' },
    ]
  },
  SELL: {
    "Strategy": [
      { id: 'BUSINESS_ORCHESTRATOR', label: 'Campaign Builder', desc: 'Full campaign strategy' },
      { id: 'DECK_ARCH', label: 'Deck Architect', desc: 'Pitch deck builder' },
      { id: 'FUNNEL_MAP', label: 'Funnel Map', desc: 'Sales funnel visualization' },
    ],
    "Execution": [
      { id: 'PROPOSALS', label: 'Proposals', desc: 'Draft sales proposals' },
      { id: 'SEQUENCER', label: 'Outreach Builder', desc: 'Outreach campaigns' },
      { id: 'PITCH_GEN', label: 'Pitch Gen', desc: 'Elevator pitch generator' },
      { id: 'VOICE_STRAT', label: 'Sales Coach', desc: 'Real-time sales coaching' },
    ],
    "Simulation": [
      { id: 'ROI_CALC', label: 'ROI Calc', desc: 'Value projection' },
      { id: 'DEMO_SANDBOX', label: 'Demo Sandbox', desc: 'Growth simulation' },
      { id: 'AI_CONCIERGE', label: 'AI Concierge', desc: 'Chatbot simulation' },
    ]
  },
  CONTROL: {
    "Operations": [
      { id: 'PLAYBOOK', label: 'Playbook', desc: 'Agency methodology' },
      { id: 'IDENTITY', label: 'Identity', desc: 'Brand identity configuration' },
      { id: 'BILLING', label: 'Billing', desc: 'Cost management' },
      { id: 'AFFILIATE', label: 'Affiliate', desc: 'Partner program setup' },
    ],
    "System": [
      { id: 'SETTINGS', label: 'Settings', desc: 'Global configuration' },
      { id: 'OS_FORGE', label: 'OS Forge', desc: 'System prompts' },
      { id: 'THEME', label: 'Theme', desc: 'UI customization' },
      { id: 'TOKENS', label: 'Credits', desc: 'Usage stats' },
    ],
    "Logs": [
        { id: 'EXPORT_DATA', label: 'Export Data', desc: 'Backup and export' },
        { id: 'PROD_LOG', label: 'Prod Log', desc: 'System logs' },
        { id: 'CHRONOS', label: 'Chronos', desc: 'Timeline view' },
        { id: 'NEXUS_GRAPH', label: 'Nexus Graph', desc: 'Entity relationship view' },
        { id: 'TASKS', label: 'Tasks', desc: 'Mission checklist' },
    ]
  }
};

const MODE_CONFIG: Record<MainMode, any> = {
  OPERATE: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  CREATE: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  STUDIO: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  SELL: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  CONTROL: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

export const LayoutZenith: React.FC<LayoutProps> = ({ 
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [marketExpanded, setMarketExpanded] = useState(false);
  
  const groups = MODULE_GROUPS[activeMode];
  const activeConfig = MODE_CONFIG[activeMode];
  const mainRef = useRef<HTMLDivElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);

  const handleModeClick = (mode: MainMode) => {
    setActiveMode(mode);
    switch (mode) {
      case 'OPERATE': setActiveModule('COMMAND'); break;
      case 'CREATE': setActiveModule('VISUAL_STUDIO'); break;
      case 'STUDIO': setActiveModule('CINEMA_INTEL'); break;
      case 'SELL': setActiveModule('BUSINESS_ORCHESTRATOR'); break;
      case 'CONTROL': setActiveModule('PLAYBOOK'); break;
    }
  };

  useEffect(() => {
    if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeModule]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (marketRef.current && !marketRef.current.contains(event.target as Node)) {
        setMarketExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden bg-[#020617] text-slate-100`}>
      <header className={`h-20 flex-none border-b z-[100] flex items-center justify-between px-8 bg-[#030712] border-slate-800`}>
         <div className="flex items-center gap-4 w-80 pl-2">
            <h1 className={`text-xl font-black tracking-tight leading-none text-white`}>
               PROSPECTOR <span className="text-emerald-500 italic">OS</span>
            </h1>
         </div>

         <div className="absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2 hidden xl:block pointer-events-auto">
            <nav className={`flex items-center gap-1 p-1.5 rounded-full border shadow-2xl bg-[#0b1021] border-slate-800`}>
               {(Object.keys(MODE_CONFIG) as MainMode[]).map((mode) => {
                  const isActive = activeMode === mode;
                  const label = mode === 'OPERATE' ? 'RESEARCH' : 
                                mode === 'STUDIO' ? 'MEDIA' : 
                                mode === 'SELL' ? 'OUTREACH' : 
                                mode === 'CONTROL' ? 'ADMIN' : mode;
                  return (
                     <button
                        key={mode}
                        onClick={() => handleModeClick(mode)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all group ${
                           isActive 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25' 
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                     >
                        <ModeIcon id={mode} active={isActive} />
                        {label}
                     </button>
                  );
               })}
            </nav>
         </div>

         <div className={`flex items-center gap-4 w-auto justify-end z-50 pl-4 py-2 bg-[#030712]`}>
            <button 
               onClick={onSearchClick}
               className={`flex items-center gap-3 px-4 h-12 rounded-2xl border text-xs font-bold transition-all group bg-[#0b1021] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700`}
            >
               <span className="uppercase tracking-wider hidden md:block">SEARCH</span>
               <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-500`}>⌘K</span>
            </button>

            <div ref={marketRef} className={`relative transition-all duration-300 ease-out ${marketExpanded ? 'w-64' : 'w-[120px]'}`}>
                <div
                   onClick={() => setMarketExpanded(true)}
                   className={`flex items-center gap-3 pl-4 pr-4 h-12 rounded-full border cursor-pointer transition-all shadow-lg hover:shadow-emerald-500/10 bg-[#0b1021] border-slate-800 hover:border-emerald-500/50 overflow-hidden`}
                >
                   {marketExpanded ? (
                       <select
                          autoFocus
                          value={theater}
                          onChange={(e) => {
                              setTheater(e.target.value);
                              setMarketExpanded(false);
                          }}
                          className={`bg-transparent text-xs font-bold uppercase focus:outline-none cursor-pointer border-none w-full appearance-none leading-none text-white`}
                       >
                          {STRATEGIC_CITIES.map(c => (
                              <option key={c.city} value={c.city} className="text-slate-900 bg-white">{c.city}</option>
                          ))}
                       </select>
                   ) : (
                       <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest leading-none whitespace-nowrap w-full text-center">MARKET</span>
                   )}
                </div>
            </div>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         <aside className={`flex-shrink-0 border-r flex flex-col z-40 h-full overflow-hidden transition-all duration-300 ease-in-out bg-[#0b1021] border-slate-800 ${isSidebarExpanded ? 'w-[240px]' : 'w-[80px]'}`}>
            <div className={`p-4 border-b border-slate-800/50 flex items-center justify-center shrink-0`}>
               <button 
                 onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                 className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors w-full flex items-center justify-center"
               >
                 {isSidebarExpanded ? '«' : '»'}
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-6 pb-40">
               {Object.entries(groups).map(([groupName, modules]) => {
                  const filtered = (modules as { id: SubModule; label: string; desc: string }[]).filter(m => m.label.toLowerCase().includes(moduleFilter.toLowerCase()));
                  if (filtered.length === 0) return null;

                  return (
                     <div key={groupName} className="animate-in slide-in-from-left-2 duration-300">
                        {isSidebarExpanded ? (
                          <h3 className="px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{groupName}</h3>
                        ) : (
                          <div className="mx-auto w-8 h-px bg-slate-800 mb-3"></div>
                        )}
                        
                        <div className={`space-y-1 ${isSidebarExpanded ? 'px-4' : 'px-2'}`}>
                           {filtered.map(mod => {
                              const isActive = activeModule === mod.id;
                              return (
                                 <div key={mod.id} className="w-full">
                                  <Tooltip content={mod.desc} side="right" className="w-full flex">
                                     <button
                                        onClick={() => setActiveModule(mod.id)}
                                        className={`w-full rounded-xl transition-all relative flex items-center group ${
                                           isSidebarExpanded 
                                             ? 'px-3 py-2.5 justify-start text-left' 
                                             : 'p-3 justify-center'
                                        } ${
                                           isActive 
                                              ? 'bg-slate-800 text-white shadow-md' 
                                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                        }`}
                                     >
                                        <div className={`flex items-center ${isSidebarExpanded ? 'gap-3' : ''}`}>
                                          <ModuleIcon id={mod.id} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} ${isSidebarExpanded ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                          {isSidebarExpanded && (
                                            <span className="text-[10px] font-bold uppercase tracking-wide truncate">{mod.label}</span>
                                          )}
                                        </div>
                                     </button>
                                  </Tooltip>
                                </div>
                              );
                           })}
                        </div>
                     </div>
                  );
               })}
            </div>
         </aside>

         <main 
            ref={mainRef}
            className="flex-1 h-full overflow-y-auto custom-scrollbar relative bg-[#020617] p-8 md:p-12"
         >
            <div className={`fixed inset-0 pointer-events-none opacity-[0.03] transition-colors duration-1000 ${activeConfig.bg}`}></div>
            <div className="max-w-[1920px] mx-auto pb-32">
               {children}
            </div>
         </main>
      </div>
    </div>
  );
};
