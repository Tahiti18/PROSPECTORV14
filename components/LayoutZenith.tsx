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
    case 'OPERATE': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16v7zm0 0v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5m18-6.5H3m10 4.5h.01m-4.01 0h.01m-4.01 0h.01" /></svg>; 
    case 'CREATE': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" /></svg>; 
    case 'STUDIO': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>; 
    case 'SELL': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20M17 5l-5-3-5 3M17 19l-5 3-5-3" /></svg>; 
    case 'CONTROL': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 6v6l4 2" /></svg>; 
  }
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  // OPERATE
  COMMAND: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
  RADAR_RECON: <><circle cx="12" cy="12" r="10" /><path d="M16.2 7.8l-2.4 6 3.2 3.2" /><path d="M12 12v-6" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /></>,
  AUTO_CRAWL: <><path d="M12 2c-3 0-5 2-5 5v2h10V7c0-3-2-5-5-5z" /><path d="M7 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9z" /><path d="M3 13h4" /><path d="M17 13h4" /><path d="M5 7l2 3" /><path d="M19 7l-2 3" /></>,
  TARGET_LIST: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
  PIPELINE: <><rect x="2" y="4" width="6" height="16" rx="1" /><rect x="10" y="4" width="6" height="16" rx="1" /><rect x="18" y="4" width="4" height="16" rx="1" /></>,
  WAR_ROOM: <><circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" /><circle cx="12" cy="12" r="2" /></>,
  DEEP_LOGIC: <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></>,
  WORKSPACE: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
  VIRAL_PULSE: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>,
  VISION_LAB: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  ARTICLE_INTEL: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></>,
  BENCHMARK: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  ANALYTICS: <><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  ANALYTICS_HUB: <><circle cx="12" cy="12" r="3" /><path d="M12 9V5" /><path d="M12 19v-4" /><path d="M19 12h-4" /><path d="M5 12h4" /><path d="m16.5 16.5-2-2" /><path d="m9.5 9.5-2-2" /><path d="m16.5 7.5-2 2" /><path d="m9.5 14.5-2 2" /></>,
  HEATMAP: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></>,
  PROMPT_AI: <><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></>,
  MODEL_TEST: <><path d="M9 3h6" /><path d="M10 3v4a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3V3" /><path d="m8 13 8 4" /></>,
  FACT_CHECK: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  TRANSLATOR: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,

  // CREATE
  VISUAL_STUDIO: <><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" /><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-1.33 2.69-1.33 2.69s1.36-1.33 2.69-1.33c1.67 0 3.01-1.35 3.01-3.02" /></>,
  MOCKUPS_4K: <><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><path d="m9 10 2 2 4-4" /></>,
  PRODUCT_SYNTH: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  FLASH_SPARK: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>,
  MEDIA_VAULT: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  BRAND_DNA: <><path d="M2 15c6.667-6 13.333 0 20-6" /><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" /><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" /><path d="m17 6-2.5-2.5" /><path d="m14 8-1-1" /><path d="m7 18 2.5 2.5" /><path d="m3.5 14.5.5.5" /><path d="m20 9 .5.5" /><path d="m6.5 12.5 1 1" /><path d="m16.5 10.5 1 1" /><path d="m10 16 1.5 1.5" /></>,

  // STUDIO
  VIDEO_PITCH: <><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z" /><rect x="3" y="6" width="12" height="12" rx="2" /></>,
  VIDEO_AI: <><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></>,
  CINEMA_INTEL: <><path d="M20.2 6 3 11l-.9-2.4c-.5-1.1.2-2.4 1.3-2.9L13.8 2c1.1-.5 2.4.2 2.9 1.3z" /><path d="m6.2 5.3 3.1 3.9" /><path d="m12.4 3.4 3.1 4" /><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></>,
  MOTION_LAB: <><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></>,
  SONIC_STUDIO: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>,
  LIVE_SCRIBE: <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></>,

  // SELL
  BUSINESS_ORCHESTRATOR: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  PROPOSALS: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>,
  ROI_CALC: <><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></>,
  SEQUENCER: <><line x1="6" y1="3" x2="6" y2="21" /><circle cx="6" cy="3" r="3" /><circle cx="6" cy="21" r="3" /><path d="M22 6H9" /><path d="M22 18H9" /><path d="M16 12H9" /></>,
  DECK_ARCH: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
  DEMO_SANDBOX: <><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></>,
  DRAFTING: <><path d="m15 15 6 6" /><path d="M4 4 15 15" /><path d="M4 20h16" /><path d="m20 4-5 5" /><path d="m4 20 5-5" /></>,
  VOICE_STRAT: <><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></>,
  AI_CONCIERGE: <><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></>,
  PITCH_GEN: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" /><path d="M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" /><path d="M16 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" /></>,
  FUNNEL_MAP: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></>,

  // CONTROL
  PLAYBOOK: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  BILLING: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>,
  AFFILIATE: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>,
  IDENTITY: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  OS_FORGE: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>,
  EXPORT_DATA: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
  CALENDAR: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  PROD_LOG: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></>,
  SETTINGS: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  NEXUS_GRAPH: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>,
  CHRONOS: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  TASKS: <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></>,
  THEME: <><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></>,
  TOKENS: <><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 10.5h20" /><path d="M2 21v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M18 11V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5" /><path d="M6 11V6" /><path d="M18 11V6" /></>
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