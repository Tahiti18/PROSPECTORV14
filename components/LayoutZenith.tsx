
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
  COMMAND: <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  RADAR_RECON: <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />, 
  AUTO_CRAWL: <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />,
  VIRAL_PULSE: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
  
  // CRM
  TARGET_LIST: <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
  WAR_ROOM: <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
  PIPELINE: <path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />,
  ANALYTICS_HUB: <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />,
  
  // ANALYSIS
  BENCHMARK: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  VISION_LAB: <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />, 
  DEEP_LOGIC: <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  ARTICLE_INTEL: <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />,
  
  // UTILS
  WORKSPACE: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  PROMPT_AI: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />,
  MODEL_TEST: <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.641.32a2 2 0 01-1.76 0l-.641-.32a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V18a2 2 0 002 2h12a2 2 0 002-2v-2.572zM12 11V3.5l3 3m-3-3l-3 3" />,
  TRANSLATOR: <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />,

  // CREATE
  VISUAL_STUDIO: <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  MOCKUPS_4K: <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  PRODUCT_SYNTH: <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  FLASH_SPARK: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
  MEDIA_VAULT: <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />,

  // STUDIO
  CINEMA_INTEL: <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
  VIDEO_PITCH: <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />,
  VIDEO_AI: <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  MOTION_LAB: <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />,
  SONIC_STUDIO: <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />,
  LIVE_SCRIBE: <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />,

  // SELL
  BUSINESS_ORCHESTRATOR: <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />,
  DECK_ARCH: <path d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />,
  FUNNEL_MAP: <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />,
  PROPOSALS: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  SEQUENCER: <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
  PITCH_GEN: <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
  VOICE_STRAT: <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />,
  ROI_CALC: <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  DEMO_SANDBOX: <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />,
  AI_CONCIERGE: <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,

  // CONTROL
  PLAYBOOK: <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  IDENTITY: <path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />,
  BILLING: <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  AFFILIATE: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  SETTINGS: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  OS_FORGE: <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />,
  THEME: <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
  TOKENS: <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  EXPORT_DATA: <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
  PROD_LOG: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
  CHRONOS: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  NEXUS_GRAPH: <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
  TASKS: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      { id: 'WAR_ROOM', label: 'Account Strategy', desc: 'Deep dive on specific lead' },
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
      { id: 'VISUAL_STUDIO', label: 'Visual Studio', desc: 'Generate brand imagery' },
      { id: 'MOCKUPS_4K', label: 'Mockup Forge', desc: 'Create high-res product mockups' },
    ],
    "Assets": [
      { id: 'PRODUCT_SYNTH', label: 'Product Design', desc: 'Architect new offers' },
      { id: 'FLASH_SPARK', label: 'Flash Spark', desc: 'Viral content ideation' },
      { id: 'MEDIA_VAULT', label: 'Media Vault', desc: 'Manage generated assets' },
    ]
  },
  STUDIO: {
    "Video": [
      { id: 'VIDEO_PITCH', label: 'Veo Pitch', desc: 'AI Video Generation' },
      { id: 'VIDEO_AI', label: 'Video Audit', desc: 'Analyze video content' },
      { id: 'CINEMA_INTEL', label: 'Cinema Intel', desc: 'Deep video understanding' },
      { id: 'MOTION_LAB', label: 'Motion Lab', desc: 'Motion graphics concepts' },
    ],
    "Audio": [
      { id: 'SONIC_STUDIO', label: 'Sonic Studio', desc: 'AI Voice Generation' },
      { id: 'LIVE_SCRIBE', label: 'Live Scribe', desc: 'Real-time audio transcription' },
    ]
  },
  SELL: {
    "Strategy": [
      { id: 'BUSINESS_ORCHESTRATOR', label: 'Orchestrator', desc: 'Full campaign strategy' },
      { id: 'DECK_ARCH', label: 'Deck Architect', desc: 'Pitch deck builder' },
      { id: 'FUNNEL_MAP', label: 'Funnel Map', desc: 'Sales funnel visualization' },
    ],
    "Execution": [
      { id: 'PROPOSALS', label: 'Proposals', desc: 'Draft sales proposals' },
      { id: 'SEQUENCER', label: 'Sequencer', desc: 'Outreach campaigns' },
      { id: 'PITCH_GEN', label: 'Pitch Gen', desc: 'Elevator pitch generator' },
      { id: 'VOICE_STRAT', label: 'Voice Strat', desc: 'Real-time sales coaching' },
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
      { id: 'TOKENS', label: 'Tokens', desc: 'Usage stats' },
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
    // Set default module for each mode
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
                                 <div key={mod.id} className="w-full flex justify-center">
                                  <Tooltip content={mod.desc} side="right">
                                     <button
                                        onClick={() => setActiveModule(mod.id)}
                                        className={`w-full rounded-xl transition-all relative flex items-center group ${
                                           isSidebarExpanded 
                                             ? 'px-3 py-2.5 justify-between text-left' 
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
