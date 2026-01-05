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
    case 'OPERATE': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>; // Stack
    case 'CREATE': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>; // Pen
    case 'STUDIO': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>; // Camera
    case 'SELL': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>; // Dollar
    case 'CONTROL': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>; // Lock
  }
}

// --- SIDEBAR MODULE ICONS ---
const ModuleIcon = ({ id, className = "w-5 h-5" }: { id: SubModule; className?: string }) => {
  const getPath = () => {
    switch (id) {
      // OPERATE
      case 'COMMAND': return <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
      case 'WORKSPACE': return <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />;
      case 'TARGET_LIST': return <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />;
      case 'RADAR_RECON': return <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'AUTO_CRAWL': return <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
      case 'VIRAL_PULSE': return <path d="M13 10V3L4 14h7v7l9-11h-7z" />;
      case 'HEATMAP': return <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />;
      case 'DEEP_LOGIC': return <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />;
      case 'BENCHMARK': return <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />;
      case 'VISION_LAB': return <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />;
      case 'ARTICLE_INTEL': return <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />;
      case 'FACT_CHECK': return <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'WAR_ROOM': return <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'PIPELINE': return <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
      case 'ANALYTICS': return <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />;
      case 'ANALYTICS_HUB': return <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />;
      case 'PROMPT_AI': return <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />;
      case 'MODEL_TEST': return <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.641.32a2 2 0 01-1.76 0l-.641-.32a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V18a2 2 0 002 2h12a2 2 0 002-2v-2.572zM12 11V3.5l3 3m-3-3l-3 3" />;
      case 'TRANSLATOR': return <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />;
      
      // CREATE
      case 'VISUAL_STUDIO': return <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />;
      case 'MOCKUPS_4K': return <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
      case 'PRODUCT_SYNTH': return <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />;
      case 'FLASH_SPARK': return <path d="M13 10V3L4 14h7v7l9-11h-7z" />;
      case 'MEDIA_VAULT': return <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />;
      
      // STUDIO
      case 'VIDEO_PITCH': return <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />; // Camera
      case 'VIDEO_AI': return <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />;
      case 'CINEMA_INTEL': return <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />;
      case 'MOTION_LAB': return <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'SONIC_STUDIO': return <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />;
      case 'LIVE_SCRIBE': return <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />;
      
      // SELL
      case 'BUSINESS_ORCHESTRATOR': return <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />;
      case 'DECK_ARCH': return <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />;
      case 'FUNNEL_MAP': return <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />;
      case 'PROPOSALS': return <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
      case 'SEQUENCER': return <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />;
      case 'PITCH_GEN': return <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />;
      case 'VOICE_STRAT': return <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />;
      case 'ROI_CALC': return <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'DEMO_SANDBOX': return <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'AI_CONCIERGE': return <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
      
      // CONTROL
      case 'PLAYBOOK': return <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />;
      case 'BILLING': return <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />;
      case 'AFFILIATE': return <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />;
      case 'IDENTITY': return <path d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'SETTINGS': return <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />;
      case 'OS_FORGE': return <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />;
      case 'THEME': return <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />;
      case 'TOKENS': return <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'EXPORT_DATA': return <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />;
      case 'PROD_LOG': return <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
      case 'CHRONOS': return <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'CIPHER_NODE': return <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />;
      case 'NEXUS_GRAPH': return <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />;
      default: return <circle cx="12" cy="12" r="2" />;
    }
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {getPath()}
    </svg>
  );
};

// --- GROUPING LOGIC ---
const MODULE_GROUPS: Record<MainMode, Record<string, { id: SubModule; label: string }[]>> = {
  OPERATE: {
    "Core Command": [
      { id: 'COMMAND', label: 'Mission Control' },
      { id: 'WORKSPACE', label: 'Gemini Workspace' },
      { id: 'TARGET_LIST', label: 'Target Ledger' },
    ],
    "Reconnaissance": [
      { id: 'RADAR_RECON', label: 'Radar Recon' },
      { id: 'AUTO_CRAWL', label: 'Auto Crawl' },
      { id: 'VIRAL_PULSE', label: 'Viral Pulse' },
      { id: 'HEATMAP', label: 'Theater Heatmap' },
    ],
    "Intelligence": [
      { id: 'DEEP_LOGIC', label: 'Deep Logic' },
      { id: 'BENCHMARK', label: 'Reverse Engineer' },
      { id: 'VISION_LAB', label: 'Vision Lab' },
      { id: 'ARTICLE_INTEL', label: 'Article Intel' },
      { id: 'FACT_CHECK', label: 'Fact Checker' },
    ],
    "War Room": [
        { id: 'WAR_ROOM', label: 'Active War Room' },
        { id: 'PIPELINE', label: 'Pipeline View' },
        { id: 'ANALYTICS', label: 'Analytics Core' },
        { id: 'ANALYTICS_HUB', label: 'Dominance Hub' },
    ],
    "Utilities": [
        { id: 'PROMPT_AI', label: 'Prompt Interface' },
        { id: 'MODEL_TEST', label: 'Model Bench' },
        { id: 'TRANSLATOR', label: 'Translator' }
    ]
  },
  CREATE: {
    "Visual Forge": [
      { id: 'VISUAL_STUDIO', label: 'Visual Studio' },
      { id: 'MOCKUPS_4K', label: '4K Mockups' },
    ],
    "Content Synth": [
      { id: 'PRODUCT_SYNTH', label: 'Product Synth' },
      { id: 'FLASH_SPARK', label: 'Flash Spark' },
    ],
    "Storage": [
      { id: 'MEDIA_VAULT', label: 'Media Vault' },
    ]
  },
  STUDIO: {
    "Video Production": [
      { id: 'CINEMA_INTEL', label: 'Cinema Intel' },
      { id: 'VIDEO_PITCH', label: 'Veo Pitch' },
      { id: 'VIDEO_AI', label: 'Video Audit' },
      { id: 'MOTION_LAB', label: 'Motion Lab' },
    ],
    "Audio": [
      { id: 'SONIC_STUDIO', label: 'Sonic Studio' },
      { id: 'LIVE_SCRIBE', label: 'Live Scribe' },
    ]
  },
  SELL: {
    "Strategy": [
      { id: 'BUSINESS_ORCHESTRATOR', label: 'Orchestrator' },
      { id: 'DECK_ARCH', label: 'Deck Architect' },
      { id: 'FUNNEL_MAP', label: 'Funnel Map' },
    ],
    "Execution": [
      { id: 'PROPOSALS', label: 'Proposals' },
      { id: 'SEQUENCER', label: 'Sequencer' },
      { id: 'PITCH_GEN', label: 'Pitch Generator' },
      { id: 'VOICE_STRAT', label: 'Voice Strat' },
    ],
    "Simulation": [
      { id: 'ROI_CALC', label: 'ROI Calculator' },
      { id: 'DEMO_SANDBOX', label: 'Demo Sandbox' },
      { id: 'AI_CONCIERGE', label: 'AI Concierge' },
    ]
  },
  CONTROL: {
    "Agency Ops": [
      { id: 'PLAYBOOK', label: 'Playbook' },
      { id: 'IDENTITY', label: 'Identity' },
      { id: 'BILLING', label: 'Billing' },
      { id: 'AFFILIATE', label: 'Affiliate' },
    ],
    "System": [
      { id: 'SETTINGS', label: 'Settings' },
      { id: 'OS_FORGE', label: 'OS Forge' },
      { id: 'THEME', label: 'Theme Engine' },
      { id: 'TOKENS', label: 'Token Vault' },
    ],
    "Data": [
        { id: 'EXPORT_DATA', label: 'Export Data' },
        { id: 'PROD_LOG', label: 'Prod Log' },
        { id: 'CHRONOS', label: 'Chronos' },
        { id: 'CIPHER_NODE', label: 'Cipher Node' },
        { id: 'NEXUS_GRAPH', label: 'Nexus Graph' },
    ]
  }
};

const MODE_COLORS: Record<MainMode, string> = {
  OPERATE: 'text-indigo-500',
  CREATE: 'text-violet-500',
  STUDIO: 'text-amber-500',
  SELL: 'text-emerald-500',
  CONTROL: 'text-cyan-500',
};

const MODE_CONFIG: Record<MainMode, any> = {
  OPERATE: {},
  CREATE: {},
  STUDIO: {},
  SELL: {},
  CONTROL: {},
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const groups = MODULE_GROUPS[activeMode];
  const activeColor = MODE_COLORS[activeMode];
  const mainRef = useRef<HTMLDivElement>(null);

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

  return (
    // FIX: Main container is now h-screen and flex-col to force header separation
    <div className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* --- COMMAND CENTER HEADER (Flex Item, Not Fixed) --- */}
      <header className={`h-20 flex-none border-b z-50 flex items-center justify-between px-8 transition-colors ${theme === 'dark' ? 'bg-[#030712] border-slate-800' : 'bg-white border-slate-200'}`}>
         
         {/* LEFT: IDENTITY (Cleaner) */}
         <div className="flex items-center gap-4 w-80 pl-2">
            <h1 className={`text-xl font-black tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
               PROSPECTOR <span className="text-indigo-500 italic">OS</span>
            </h1>
         </div>

         {/* CENTER: PILL NAVIGATION (Relative positioning context is header) */}
         <div className="absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2 hidden xl:block pointer-events-auto">
            <nav className={`flex items-center gap-1 p-1.5 rounded-full border shadow-2xl ${theme === 'dark' ? 'bg-[#0b1021] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
               {(Object.keys(MODE_CONFIG) as MainMode[]).map((mode) => {
                  const isActive = activeMode === mode;
                  return (
                     <button
                        key={mode}
                        onClick={() => handleModeClick(mode)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all group ${
                           isActive 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
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

         {/* RIGHT: UTILITIES (High Z-Index, Solid BG) */}
         <div className={`flex items-center gap-4 w-auto justify-end z-50 pl-4 py-2 ${theme === 'dark' ? 'bg-[#030712]' : 'bg-white'}`}>
            
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-[#0b1021] border-slate-800 text-amber-400 hover:border-slate-700' : 'bg-white border-slate-200 text-amber-500'}`}>
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </button>

            {/* Quick Search */}
            <button 
               onClick={onSearchClick}
               className={`flex items-center gap-3 px-4 h-12 rounded-2xl border text-xs font-bold transition-all group ${theme === 'dark' ? 'bg-[#0b1021] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700' : 'bg-white border-slate-200 text-slate-500'}`}
            >
               <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <span className="uppercase tracking-wider hidden md:block">SEARCH</span>
               <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-600'}`}>⌘K</span>
            </button>

            {/* Location Selector (Refined Pill) */}
            <div className="relative group">
                <div className={`flex items-center gap-3 pl-4 pr-6 h-12 rounded-full border cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/10 ${theme === 'dark' ? 'bg-[#0b1021] border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200'}`}>
                   <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <div className="flex flex-col relative">
                       <span className="text-[8px] font-black text-indigo-400/80 uppercase tracking-widest leading-none mb-0.5">THEATER</span>
                       <select 
                          value={theater} 
                          onChange={(e) => setTheater(e.target.value)}
                          className={`bg-transparent text-xs font-bold uppercase focus:outline-none cursor-pointer border-none w-full appearance-none leading-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'} pr-4`}
                       >
                          {STRATEGIC_CITIES.map(c => (
                              <option key={c.city} value={c.city} className="text-slate-900 bg-white">{c.city}</option>
                          ))}
                       </select>
                       <div className="absolute right-0 bottom-0.5 pointer-events-none">
                          <svg className="w-2 h-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                       </div>
                   </div>
                </div>
            </div>

         </div>
      </header>

      {/* --- 2. MAIN WORKSPACE CONTAINER --- */}
      {/* Takes remaining height, Sidebar and Main scroll independently */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* LEFT SIDEBAR (Contextual Modules Only) */}
         <aside className={`flex-shrink-0 border-r flex flex-col z-40 h-full overflow-hidden transition-all duration-300 ease-in-out ${theme === 'dark' ? 'bg-[#0b1021] border-slate-800' : 'bg-slate-50 border-slate-200'} ${isSidebarExpanded ? 'w-[240px]' : 'w-[80px]'}`}>
            
            {/* Sidebar Expand/Collapse Control */}
            <div className={`p-4 border-b border-slate-800/50 flex items-center justify-center shrink-0`}>
               <button 
                 onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                 className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors w-full flex items-center justify-center"
                 title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   {isSidebarExpanded ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                   ) : (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                   )}
                 </svg>
               </button>
            </div>

            {/* Modules List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-6">
               {Object.entries(groups).map(([groupName, modules]) => {
                  const filtered = (modules as { id: SubModule; label: string }[]).filter(m => m.label.toLowerCase().includes(moduleFilter.toLowerCase()));
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
                              
                              const buttonContent = (
                                 <button
                                    key={mod.id}
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
                                    
                                    {isActive && isSidebarExpanded && <div className={`w-1.5 h-1.5 rounded-full ${activeColor.replace('text', 'bg')}`}></div>}
                                 </button>
                              );

                              // Only wrap in Tooltip if collapsed
                              if (!isSidebarExpanded) {
                                return (
                                  <div key={mod.id} className="w-full flex justify-center">
                                    <Tooltip content={mod.label} side="right">
                                      {buttonContent}
                                    </Tooltip>
                                  </div>
                                );
                              }

                              return buttonContent;
                           })}
                        </div>
                     </div>
                  );
               })}
            </div>
         </aside>

         {/* MAIN STAGE */}
         <main 
            ref={mainRef}
            className="flex-1 h-full overflow-y-auto custom-scrollbar relative bg-[#020617] p-8 md:p-12"
         >
            {/* Ambient Background Glow */}
            <div className={`fixed inset-0 pointer-events-none opacity-[0.03] transition-colors duration-1000 ${activeColor.replace('text', 'bg')}`}></div>
            
            <div className="max-w-[1920px] mx-auto pb-32">
               {children}
            </div>
         </main>

      </div>
    </div>
  );
};