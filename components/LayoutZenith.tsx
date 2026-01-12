
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

const SubModuleIcon = ({ id, active }: { id: SubModule; active: boolean }) => {
  const cn = active ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-300 transition-colors";
  const p = (paths: string[]) => (
    <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );

  switch(id) {
    case 'EXECUTIVE_DASHBOARD': return p(["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"]);
    case 'TRANSFORMATION_BLUEPRINT': return p(["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]);
    case 'USER_GUIDE': return p(["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"]);
    case 'MARKET_DISCOVERY': return p(["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M12 8v4", "M12 16h.01"]);
    case 'AUTOMATED_SEARCH': return p(["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", "M12 7v5l3 3"]);
    case 'PROSPECT_DATABASE': return p(["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"]);
    case 'PIPELINE': return p(["M12 20V10", "M18 20V4", "M6 20v-4"]);
    case 'STRATEGY_CENTER': return p(["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"]);
    case 'ANALYTICS_HUB': return p(["M21.21 15.89A10 10 0 118 2.83", "M22 12A10 10 0 0012 2v10z"]);
    case 'BENCHMARK': return p(["M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6", "M15 3h6v6", "M10 14L21 3"]);
    case 'VISUAL_ANALYSIS': return p(["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z"]);
    case 'STRATEGIC_REASONING': return p(["M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"]);
    case 'MARKET_TRENDS': return p(["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"]);
    case 'VISUAL_STUDIO': return p(["M12 19l7-7 3 3-7 7-3-3z", "M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"]);
    case 'BRAND_DNA': return p(["M4.5 16.5c-1.5 1.26-2 3.5-2 3.5s2.24-.5 3.5-2L16.5 7.5L13.5 4.5z", "M15 6l3 3"]);
    case 'MOCKUPS_4K': return p(["M2 8a2 2 0 012-2h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8z", "M6 14h12"]);
    case 'PRODUCT_SYNTHESIS': return p(["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5"]);
    case 'CONTENT_IDEATION': return p(["M9.663 17h4.673", "M12 3v1", "M21 12h-1", "M4 12H3", "M12 18v2"]);
    case 'ASSET_LIBRARY': return p(["M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"]);
    case 'VIDEO_PRODUCTION': return p(["M23 7l-7 5 7 5V7z", "M1 5h15v14H1z"]);
    case 'VIDEO_AUDIT': return p(["M15 10l5 5-5 5", "M4 4v16h16V4H4z"]);
    case 'VIDEO_INSIGHTS': return p(["M2 12h20", "M12 2v20"]);
    case 'MOTION_LAB': return p(["M13 2L3 14h9l-1 8 10-12h-9l1-8z"]);
    case 'SONIC_STUDIO': return p(["M9 18V5l12-2v13", "M9 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"]);
    case 'MEETING_NOTES': return p(["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", "M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"]);
    case 'CAMPAIGN_ORCHESTRATOR': return p(["M22 2L11 13", "M22 2l-7 20-4-9-9-4 20-7z"]);
    case 'PROPOSALS': return p(["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"]);
    case 'SEQUENCER': return p(["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"]);
    case 'ROI_CALCULATOR': return p(["M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm4 4h8", "M8 10h8", "M8 14h8", "M8 18h8"]);
    case 'PRESENTATION_BUILDER': return p(["M2 16h20", "M2 16v2a2 2 0 002 2h16a2 2 0 002-2v-2", "M2 16V4a2 2 0 012-2h16a2 2 0 012 2v12"]);
    case 'DEMO_SANDBOX': return p(["M5 3v18l15-9L5 3z"]);
    case 'AI_CONCIERGE': return p(["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 7a4 4 0 100-8 4 4 0 000 8z"]);
    case 'ELEVATOR_PITCH': return p(["M18 8a3 3 0 100-6 3 3 0 000 6z", "M6 15a3 3 0 100-6 3 3 0 000 6z"]);
    case 'FUNNEL_MAP': return p(["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"]);
    case 'AGENCY_PLAYBOOK': return p(["M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5z"]);
    case 'BILLING': return p(["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]);
    case 'SETTINGS': return p(["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33"]);
    case 'EXPORT_DATA': return p(["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"]);
    case 'CALENDAR': return p(["M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z", "M16 2v4", "M8 2v4", "M3 10h18"]);
    case 'TIMELINE': return p(["M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"]);
    case 'TASK_MANAGER': return p(["M9 11l3 3L22 4", "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"]);
    case 'USAGE_STATS': return p(["M18 20V10", "M12 20V4", "M6 20v-7"]);
    default: return p(["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"]);
  }
};

const MODULE_GROUPS: Record<MainMode, Record<string, { id: SubModule; label: string; desc: string }[]>> = {
  RESEARCH: {
    "CORE INTELLIGENCE": [
      { id: 'EXECUTIVE_DASHBOARD', label: 'Executive Dashboard', desc: 'Main operational overview' },
      { id: 'TRANSFORMATION_BLUEPRINT', label: 'Capability Matrix', desc: 'Full-scale marketing blueprint' },
      { id: 'USER_GUIDE', label: 'User Guide', desc: 'Exhaustive feature directory' },
      { id: 'MARKET_DISCOVERY', label: 'Lead Discovery', desc: 'Locate high-value prospects' },
      { id: 'AUTOMATED_SEARCH', label: 'Automated Search', desc: 'Autonomous lead identification' },
      { id: 'MARKET_TRENDS', label: 'Market Trends', desc: 'Real-time industry insights' },
    ],
    "CRM & STRATEGY": [
      { id: 'PROSPECT_DATABASE', label: 'Prospect Database', desc: 'Master contact ledger' },
      { id: 'STRATEGY_CENTER', label: 'Strategy Hub', desc: 'Deep-dive business audits' },
      { id: 'PIPELINE', label: 'Growth Pipeline', desc: 'Opportunity lifecycle tracking' },
      { id: 'ANALYTICS_HUB', label: 'Business Analytics', desc: 'Aggregate performance data' },
    ],
    "ANALYSIS TOOLS": [
      { id: 'BENCHMARK', label: 'Benchmark Analysis', desc: 'Cross-industry comparison' },
      { id: 'VISUAL_ANALYSIS', label: 'Visual Audit', desc: 'Website and asset review' },
      { id: 'STRATEGIC_REASONING', label: 'Strategic Logic', desc: 'Advanced problem solving' },
    ]
  },
  DESIGN: {
    "BRAND STUDIO": [
      { id: 'VISUAL_STUDIO', label: 'Visual Studio', desc: 'Identity asset generation' },
      { id: 'BRAND_DNA', label: 'Brand DNA', desc: 'Core style extraction' },
      { id: 'MOCKUPS_4K', label: 'High-Res Mockups', desc: 'Commercial visualization' },
    ],
    "ASSETS": [
      { id: 'PRODUCT_SYNTHESIS', label: 'Offer Synthesis', desc: 'Solution architecture' },
      { id: 'CONTENT_IDEATION', label: 'Content Ideation', desc: 'Campaign concept hooks' },
      { id: 'ASSET_LIBRARY', label: 'Asset Library', desc: 'Central media repository' },
    ]
  },
  MEDIA: {
    "VIDEO PRODUCTION": [
      { id: 'VIDEO_PRODUCTION', label: 'Video Studio', desc: 'Cinematic ad synthesis' },
      { id: 'VIDEO_AUDIT', label: 'Video Audit', desc: 'Digital presence review' },
      { id: 'VIDEO_INSIGHTS', label: 'Media Insights', desc: 'Content performance analysis' },
      { id: 'MOTION_LAB', label: 'Motion Lab', desc: 'Dynamic storyboard architecture' },
    ],
    "AUDIO": [
      { id: 'SONIC_STUDIO', label: 'Sonic Studio', desc: 'Voice and music engineering' },
      { id: 'MEETING_NOTES', label: 'Executive Scribe', desc: 'Meeting summary and tasks' },
    ]
  },
  OUTREACH: {
    "CAMPAIGN": [
      { id: 'CAMPAIGN_ORCHESTRATOR', label: 'Campaign Architect', desc: 'End-to-end deployment' },
      { id: 'PRESENTATION_BUILDER', label: 'Deck Architect', desc: 'Presentation design' },
      { id: 'FUNNEL_MAP', label: 'Funnel Map', desc: 'Conversion path visual' },
    ],
    "EXECUTION": [
      { id: 'PROPOSALS', label: 'Proposal Builder', desc: 'Strategic agreement design' },
      { id: 'SEQUENCER', label: 'Engagement Sequence', desc: 'Multi-touch outreach' },
      { id: 'ELEVATOR_PITCH', label: 'Pitch Generator', desc: 'Concise value scripts' },
      { id: 'SALES_COACH', label: 'Strategic Coach', desc: 'Negotiation assistance' },
    ],
    "MODELING": [
      { id: 'ROI_CALCULATOR', label: 'Value Projector', desc: 'ROI and growth modeling' },
      { id: 'DEMO_SANDBOX', label: 'Growth Simulator', desc: 'Scenario analysis' },
      { id: 'AI_CONCIERGE', label: 'Neural Agent', desc: 'Autonomous POC demos' },
    ]
  },
  ADMIN: {
    "OPERATIONS": [
      { id: 'AGENCY_PLAYBOOK', label: 'Agency Playbook', desc: 'Operational SOPs' },
      { id: 'IDENTITY', label: 'Agency Profile', desc: 'Workspace branding' },
      { id: 'BILLING', label: 'Financials', desc: 'Resource management' },
      { id: 'AFFILIATE', label: 'Partners', desc: 'Growth network management' },
    ],
    "SYSTEM": [
      { id: 'SETTINGS', label: 'System Settings', desc: 'Global configuration' },
      { id: 'SYSTEM_CONFIG', label: 'Core Config', desc: 'Technical tuning' },
      { id: 'THEME', label: 'Interface Theme', desc: 'UI aesthetic controls' },
      { id: 'USAGE_STATS', label: 'Resource Stats', desc: 'Usage and token tracking' },
    ],
    "REPORTING": [
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
               <span className="uppercase tracking-wider text-[10px]">COMMAND SEARCH</span>
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
         <aside className={`flex-shrink-0 border-r flex flex-col z-40 transition-all duration-300 bg-[#0b1021] border-slate-800 ${isSidebarExpanded ? 'w-[260px]' : 'w-[80px]'}`}>
            <div className="p-4 border-b-2 border-emerald-500/20 flex items-center justify-center shrink-0">
               <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 rounded-lg hover:bg-slate-800 text-emerald-500/50 w-full text-center text-[10px] font-black uppercase tracking-widest">
                 {isSidebarExpanded ? 'COLLAPSE INTERFACE' : 'EXPAND'}
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-10 pb-40">
               {Object.entries(groups).map(([groupName, modules]) => (
                  <div key={groupName} className="mb-2">
                     {isSidebarExpanded ? (
                       <h3 className="px-6 text-[12px] font-black text-white uppercase tracking-[0.25em] mb-4 mt-2 border-b-2 border-emerald-500/30 pb-2">{groupName}</h3>
                     ) : (
                       <div className="mx-auto w-8 h-1 bg-emerald-500/20 mb-3 rounded-full"></div>
                     )}
                     <div className={`space-y-1 ${isSidebarExpanded ? 'px-4' : 'px-2'}`}>
                        {(modules as any[]).map(mod => {
                           const isActive = activeModule === mod.id;
                           return (
                              <button
                                 key={mod.id}
                                 onClick={() => setActiveModule(mod.id)}
                                 className={`w-full rounded-xl transition-all flex items-center group ${isSidebarExpanded ? 'px-3 py-2.5 justify-start gap-3' : 'p-3 justify-center'} ${isActive ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                              >
                                 <SubModuleIcon id={mod.id} active={isActive} />
                                 {isSidebarExpanded && (
                                   <span className="text-[10px] font-black uppercase truncate tracking-widest">{mod.label}</span>
                                 )}
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
