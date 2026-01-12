
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
  { rank: 10, city: "LOS ANGELES, USA" }
];

const ModeIcon = ({ id, active }: { id: MainMode, active: boolean }) => {
  const cn = active ? "text-white" : "text-slate-400 group-hover:text-white";
  switch(id) {
    case 'RESEARCH': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; 
    case 'DESIGN': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>; 
    case 'MEDIA': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>; 
    case 'OUTREACH': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; 
    case 'ADMIN': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; 
  }
}

const MODULE_GROUPS: Record<MainMode, Record<string, { id: SubModule; label: string; desc: string }[]>> = {
  RESEARCH: {
    "Core": [
      { id: 'EXECUTIVE_DASHBOARD', label: 'Executive Dashboard', desc: 'Main operational overview' },
      { id: 'USER_GUIDE', label: 'User Guide', desc: 'Exhaustive feature directory' },
      { id: 'MARKET_DISCOVERY', label: 'Market Discovery', desc: 'Locate high-value prospects' },
      { id: 'AUTOMATED_SEARCH', label: 'Automated Search', desc: 'Autonomous lead identification' },
      { id: 'MARKET_TRENDS', label: 'Market Trends', desc: 'Real-time industry insights' },
    ],
    "CRM & Strategy": [
      { id: 'PROSPECT_DATABASE', label: 'Prospect Database', desc: 'Master contact ledger' },
      { id: 'STRATEGY_CENTER', label: 'Strategy Hub', desc: 'Deep-dive business audits' },
      { id: 'PIPELINE', label: 'Growth Pipeline', desc: 'Opportunity lifecycle tracking' },
      { id: 'ANALYTICS_HUB', label: 'Business Analytics', desc: 'Aggregate performance data' },
    ],
    "Analysis Tools": [
      { id: 'BENCHMARK', label: 'Benchmark Analysis', desc: 'Cross-industry comparison' },
      { id: 'VISUAL_ANALYSIS', label: 'Visual Audit', desc: 'Website and asset review' },
      { id: 'STRATEGIC_REASONING', label: 'Strategic Logic', desc: 'Advanced problem solving' },
    ]
  },
  DESIGN: {
    "Brand Studio": [
      { id: 'VISUAL_STUDIO', label: 'Visual Studio', desc: 'Identity asset generation' },
      { id: 'BRAND_DNA', label: 'Brand DNA', desc: 'Core style extraction' },
      { id: 'MOCKUPS_4K', label: 'High-Res Mockups', desc: 'Commercial visualization' },
    ],
    "Assets": [
      { id: 'PRODUCT_SYNTHESIS', label: 'Offer Synthesis', desc: 'Solution architecture' },
      { id: 'CONTENT_IDEATION', label: 'Content Ideation', desc: 'Campaign concept hooks' },
      { id: 'ASSET_LIBRARY', label: 'Asset Library', desc: 'Central media repository' },
    ]
  },
  MEDIA: {
    "Video Production": [
      { id: 'VIDEO_PRODUCTION', label: 'Video Studio', desc: 'Cinematic ad synthesis' },
      { id: 'VIDEO_AUDIT', label: 'Video Audit', desc: 'Digital presence review' },
      { id: 'VIDEO_INSIGHTS', label: 'Media Insights', desc: 'Content performance analysis' },
      { id: 'MOTION_LAB', label: 'Motion Lab', desc: 'Dynamic storyboard architecture' },
    ],
    "Audio": [
      { id: 'SONIC_STUDIO', label: 'Sonic Studio', desc: 'Voice and music engineering' },
      { id: 'MEETING_NOTES', label: 'Executive Scribe', desc: 'Meeting summary and tasks' },
    ]
  },
  OUTREACH: {
    "Campaign": [
      { id: 'CAMPAIGN_ORCHESTRATOR', label: 'Campaign Architect', desc: 'End-to-end deployment' },
      { id: 'PRESENTATION_BUILDER', label: 'Deck Architect', desc: 'Presentation design' },
      { id: 'FUNNEL_MAP', label: 'Funnel Map', desc: 'Conversion path visual' },
    ],
    "Execution": [
      { id: 'PROPOSALS', label: 'Proposal Builder', desc: 'Strategic agreement design' },
      { id: 'SEQUENCER', label: 'Engagement Sequence', desc: 'Multi-touch outreach' },
      { id: 'ELEVATOR_PITCH', label: 'Pitch Generator', desc: 'Concise value scripts' },
      { id: 'SALES_COACH', label: 'Strategic Coach', desc: 'Negotiation assistance' },
    ],
    "Modeling": [
      { id: 'ROI_CALCULATOR', label: 'Value Projector', desc: 'ROI and growth modeling' },
      { id: 'DEMO_SANDBOX', label: 'Growth Simulator', desc: 'Scenario analysis' },
      { id: 'AI_CONCIERGE', label: 'Neural Agent', desc: 'Autonomous POC demos' },
    ]
  },
  ADMIN: {
    "Operations": [
      { id: 'AGENCY_PLAYBOOK', label: 'Agency Playbook', desc: 'Operational SOPs' },
      { id: 'IDENTITY', label: 'Agency Profile', desc: 'Workspace branding' },
      { id: 'BILLING', label: 'Financials', desc: 'Resource management' },
      { id: 'AFFILIATE', label: 'Partners', desc: 'Growth network management' },
    ],
    "System": [
      { id: 'SETTINGS', label: 'System Settings', desc: 'Global configuration' },
      { id: 'SYSTEM_CONFIG', label: 'Core Config', desc: 'Technical tuning' },
      { id: 'THEME', label: 'Interface Theme', desc: 'UI aesthetic controls' },
      { id: 'USAGE_STATS', label: 'Resource Stats', desc: 'Usage and token tracking' },
    ],
    "Reporting": [
        { id: 'EXPORT_DATA', label: 'Data Management', desc: 'Portability and backups' },
        { id: 'ACTIVITY_LOGS', label: 'Activity Logs', desc: 'Operational history' },
        { id: 'TIMELINE', label: 'Project Timeline', desc: 'Workflow visualization' },
        { id: 'NEXUS_GRAPH', label: 'Nexus Graph', desc: 'Entity relationship map' },
        { id: 'TASK_MANAGER', label: 'Task Manager', desc: 'Operational checklists' },
    ]
  }
};

export const LayoutZenith: React.FC<LayoutProps> = ({ 
  children, activeMode, setActiveMode, activeModule, setActiveModule, onSearchClick, theater, setTheater
}) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [marketExpanded, setMarketExpanded] = useState(false);
  const marketRef = useRef<HTMLDivElement>(null);

  const groups = MODULE_GROUPS[activeMode];

  const handleModeClick = (mode: MainMode) => {
    setActiveMode(mode);
    switch (mode) {
      case 'RESEARCH': setActiveModule('EXECUTIVE_DASHBOARD'); break;
      case 'DESIGN': setActiveModule('VISUAL_STUDIO'); break;
      case 'MEDIA': setActiveModule('VIDEO_PRODUCTION'); break;
      case 'OUTREACH': setActiveModule('CAMPAIGN_ORCHESTRATOR'); break;
      case 'ADMIN': setActiveModule('AGENCY_PLAYBOOK'); break;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#020617] text-slate-100">
      <header className="h-20 flex-none border-b z-[100] flex items-center justify-between px-8 bg-[#030712] border-slate-800">
         <div className="flex items-center gap-4 w-80 pl-2">
            <h1 className="text-xl font-black tracking-tight leading-none text-white uppercase">
               PROSPECTOR <span className="text-emerald-500 italic">OS</span>
            </h1>
         </div>

         <div className="absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2 hidden xl:block pointer-events-auto">
            <nav className="flex items-center gap-1 p-1.5 rounded-full border shadow-2xl bg-[#0b1021] border-slate-800">
               {(Object.keys(MODULE_GROUPS) as MainMode[]).map((mode) => {
                  const isActive = activeMode === mode;
                  return (
                     <button
                        key={mode}
                        onClick={() => handleModeClick(mode)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                           isActive 
                              ? 'bg-emerald-600 text-white shadow-lg' 
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                     >
                        <ModeIcon id={mode} active={isActive} />
                        {mode}
                     </button>
                  );
               })}
            </nav>
         </div>

         <div className="flex items-center gap-4 w-auto justify-end">
            <button 
               onClick={onSearchClick}
               className="flex items-center gap-3 px-4 h-12 rounded-2xl border text-xs font-bold transition-all bg-[#0b1021] border-slate-800 text-slate-400 hover:text-white"
            >
               <span className="uppercase tracking-wider">COMMAND SEARCH</span>
               <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">⌘K</span>
            </button>

            <div ref={marketRef} className={`relative transition-all duration-300 ${marketExpanded ? 'w-64' : 'w-[120px]'}`}>
                <div
                   onClick={() => setMarketExpanded(true)}
                   className="flex items-center gap-3 px-4 h-12 rounded-full border cursor-pointer bg-[#0b1021] border-slate-800 hover:border-emerald-500/50 overflow-hidden"
                >
                   {marketExpanded ? (
                       <select
                          autoFocus
                          value={theater}
                          onChange={(e) => { setTheater(e.target.value); setMarketExpanded(false); }}
                          className="bg-transparent text-xs font-bold uppercase focus:outline-none w-full text-white"
                       >
                          {STRATEGIC_CITIES.map(c => <option key={c.city} value={c.city} className="text-slate-900 bg-white">{c.city}</option>)}
                       </select>
                   ) : (
                       <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest leading-none w-full text-center">MARKET</span>
                   )}
                </div>
            </div>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         <aside className={`flex-shrink-0 border-r flex flex-col z-40 transition-all duration-300 bg-[#0b1021] border-slate-800 ${isSidebarExpanded ? 'w-[240px]' : 'w-[80px]'}`}>
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-center shrink-0">
               <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 w-full text-center">
                 {isSidebarExpanded ? 'COLLAPSE' : 'EXPAND'}
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-6 pb-40">
               {Object.entries(groups).map(([groupName, modules]) => (
                  <div key={groupName}>
                     {isSidebarExpanded ? (
                       <h3 className="px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{groupName}</h3>
                     ) : (
                       <div className="mx-auto w-8 h-px bg-slate-800 mb-3"></div>
                     )}
                     <div className={`space-y-1 ${isSidebarExpanded ? 'px-4' : 'px-2'}`}>
                        {(modules as any[]).map(mod => {
                           const isActive = activeModule === mod.id;
                           return (
                              <button
                                 key={mod.id}
                                 onClick={() => setActiveModule(mod.id)}
                                 className={`w-full rounded-xl transition-all flex items-center group ${isSidebarExpanded ? 'px-3 py-2.5 justify-start' : 'p-3 justify-center'} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                              >
                                 <span className="text-[10px] font-bold uppercase truncate">{isSidebarExpanded ? mod.label : mod.label.charAt(0)}</span>
                              </button>
                           );
                        })}
                     </div>
                  </div>
               ))}
            </div>
         </aside>

         <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative bg-[#020617] p-8 md:p-12">
            <div className="max-w-[1920px] mx-auto pb-32">{children}</div>
         </main>
      </div>
    </div>
  );
};
