
import React, { useState, useEffect } from 'react';
import { MainMode, SubModule } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: MainMode, module: SubModule) => void;
  theme: 'dark' | 'light';
}

const Icon = ({ name }: { name: string }) => {
  const paths: Record<string, React.ReactNode> = {
    'chart': <path d="M12 20V10M18 20V4M6 20v-4" />,
    'radar': <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-14a2 2 0 100 4 2 2 0 000-4z" />,
    'crawl': <path d="M4 14h6v6H4v-6zm10-4h6v6h-6v-6zM4 4h6v6H4V4zm10 0h6v6h-6V4z" />,
    'target': <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 16a6 6 0 110-12 6 6 0 010 12zm0-8a2 2 0 100 4 2 2 0 000-4z" />,
    'pipeline': <path d="M4 6h16M4 12h16M4 18h16" />,
    'war': <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />,
    'logic': <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
    'workspace': <path d="M3 3h18v18H3z" />,
    'pulse': <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    'eye': <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    'file': <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
    'ruler': <path d="M2 12h20M2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6" />,
    'hub': <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
    'heat': <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 000-5H12" />,
    'chat': <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
    'test': <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.641.32a2 2 0 01-1.76 0l-.641-.32a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V18a2 2 0 002 2h12a2 2 0 002-2v-2.572zM12 11V3.5l3 3m-3-3l-3 3" />,
    'check': <path d="M9 11l3 3L22 4" />,
    'globe': <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-14a2 2 0 100 4 2 2 0 000-4z" />,
    'art': <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" />,
    'monitor': <path d="M2 13h20M2 13v6a2 2 0 002 2h16a2 2 0 002-2v-6M2 13V5a2 2 0 012-2h16a2 2 0 012 2v8" />,
    'dna': <path d="M2 12h20" />,
    'vault': <path d="M12 2a10 10 0 0110 10v8H2v-8A10 10 0 0112 2z" />,
    'video': <path d="M23 7l-7 5 7 5V7z" />,
    'film': <path d="M4 2v20h16V2H4zm0 4h16" />,
    'run': <path d="M4 14h6v6H4v-6zm10-4h6v6h-6v-6z" />,
    'music': <path d="M9 18V5l12-2v13" />,
    'pen': <path d="M12 19l7-7 3 3-7 7-3-3z" />,
    'book': <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />,
    'money': <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
    'calc': <path d="M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm4 4h8M8 10h8M8 14h8M8 18h8" />,
    'link': <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />,
    'build': <path d="M2 22v-8h8v8H2zm12 0v-8h8v8h-8zM2 10V2h8v8H2zm12 0V2h8v8h-8z" />,
    'sandbox': <path d="M12 2L2 7l10 5 10-5-10-5z" />,
    'mic': <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />,
    'robot': <path d="M12 2a2 2 0 012 2v2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2v2a2 2 0 01-2 2 2 2 0 01-2-2v-2H8a2 2 0 01-2-2v-8a2 2 0 012-2h2V4a2 2 0 012-2z" />,
    'funnel': <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
    'settings': <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />,
    'key': <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
    'graph': <path d="M4 4h16v16H4z" />,
    'clock': <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />,
    'list': <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    'color': <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    'ticket': <path d="M3 6v12h18V6H3zm9 10a2 2 0 100-4 2 2 0 000 4z" />
  };

  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
};

const MODULE_DATA: { mode: MainMode; mod: SubModule; label: string; zone: string; icon: string }[] = [
  // --- OPERATE ZONE ---
  { mode: 'OPERATE', mod: 'COMMAND', label: 'MISSION CONTROL', zone: 'OPERATE ZONE', icon: 'chart' },
  { mode: 'OPERATE', mod: 'RADAR_RECON', label: 'RADAR RECON', zone: 'OPERATE ZONE', icon: 'radar' },
  { mode: 'OPERATE', mod: 'AUTO_CRAWL', label: 'AUTO CRAWL SWARM', zone: 'OPERATE ZONE', icon: 'crawl' },
  { mode: 'OPERATE', mod: 'TARGET_LIST', label: 'TARGET LEDGER', zone: 'OPERATE ZONE', icon: 'target' },
  { mode: 'OPERATE', mod: 'PIPELINE', label: 'PIPELINE VIEW', zone: 'OPERATE ZONE', icon: 'pipeline' },
  { mode: 'OPERATE', mod: 'WAR_ROOM', label: 'WAR ROOM', zone: 'OPERATE ZONE', icon: 'war' },
  { mode: 'OPERATE', mod: 'DEEP_LOGIC', label: 'DEEP LOGIC LAB', zone: 'OPERATE ZONE', icon: 'logic' },
  { mode: 'OPERATE', mod: 'WORKSPACE', label: 'GEMINI WORKSPACE', zone: 'OPERATE ZONE', icon: 'workspace' },
  { mode: 'OPERATE', mod: 'VIRAL_PULSE', label: 'VIRAL PULSE', zone: 'OPERATE ZONE', icon: 'pulse' },
  { mode: 'OPERATE', mod: 'VISION_LAB', label: 'VISION LAB', zone: 'OPERATE ZONE', icon: 'eye' },
  { mode: 'OPERATE', mod: 'ARTICLE_INTEL', label: 'ARTICLE INTEL', zone: 'OPERATE ZONE', icon: 'file' },
  { mode: 'OPERATE', mod: 'BENCHMARK', label: 'BENCHMARK REVERSE', zone: 'OPERATE ZONE', icon: 'ruler' },
  { mode: 'OPERATE', mod: 'ANALYTICS', label: 'ANALYTICS CORE', zone: 'OPERATE ZONE', icon: 'chart' },
  { mode: 'OPERATE', mod: 'ANALYTICS_HUB', label: 'DOMINANCE HUB', zone: 'OPERATE ZONE', icon: 'hub' },
  { mode: 'OPERATE', mod: 'HEATMAP', label: 'HEATMAP', zone: 'OPERATE ZONE', icon: 'heat' },
  { mode: 'OPERATE', mod: 'PROMPT_AI', label: 'PROMPT INTERFACE', zone: 'OPERATE ZONE', icon: 'chat' },
  { mode: 'OPERATE', mod: 'MODEL_TEST', label: 'MODEL BENCHMARK', zone: 'OPERATE ZONE', icon: 'test' },
  { mode: 'OPERATE', mod: 'FACT_CHECK', label: 'FACT CHECKER', zone: 'OPERATE ZONE', icon: 'check' },
  { mode: 'OPERATE', mod: 'TRANSLATOR', label: 'TACTICAL TRANSLATOR', zone: 'OPERATE ZONE', icon: 'globe' },

  // --- CREATE ZONE ---
  { mode: 'CREATE', mod: 'VISUAL_STUDIO', label: 'VISUAL STUDIO', zone: 'CREATE ZONE', icon: 'art' },
  { mode: 'CREATE', mod: 'MOCKUPS_4K', label: '4K MOCKUP FORGE', zone: 'CREATE ZONE', icon: 'monitor' },
  { mode: 'CREATE', mod: 'PRODUCT_SYNTH', label: 'PRODUCT SYNTH', zone: 'CREATE ZONE', icon: 'dna' },
  { mode: 'CREATE', mod: 'FLASH_SPARK', label: 'FLASH SPARK', zone: 'CREATE ZONE', icon: 'pulse' },
  { mode: 'CREATE', mod: 'MEDIA_VAULT', label: 'MEDIA VAULT', zone: 'CREATE ZONE', icon: 'vault' },

  // --- STUDIO ZONE ---
  { mode: 'STUDIO', mod: 'VIDEO_PITCH', label: 'VIDEO FAST', zone: 'STUDIO ZONE', icon: 'video' },
  { mode: 'STUDIO', mod: 'VIDEO_AI', label: 'VIDEO AUDIT', zone: 'STUDIO ZONE', icon: 'film' },
  { mode: 'STUDIO', mod: 'CINEMA_INTEL', label: 'CINEMA INTEL', zone: 'STUDIO ZONE', icon: 'video' },
  { mode: 'STUDIO', mod: 'MOTION_LAB', label: 'MOTION LAB', zone: 'STUDIO ZONE', icon: 'run' },
  { mode: 'STUDIO', mod: 'SONIC_STUDIO', label: 'SONIC STUDIO', zone: 'STUDIO ZONE', icon: 'music' },
  { mode: 'STUDIO', mod: 'LIVE_SCRIBE', label: 'LIVE SCRIBE', zone: 'STUDIO ZONE', icon: 'pen' },

  // --- SELL ZONE ---
  { mode: 'SELL', mod: 'BUSINESS_ORCHESTRATOR', label: 'BUSINESS ORCHESTRATOR', zone: 'SELL ZONE', icon: 'book' },
  { mode: 'SELL', mod: 'PROPOSALS', label: 'PROPOSAL ARCHITECT', zone: 'SELL ZONE', icon: 'file' },
  { mode: 'SELL', mod: 'ROI_CALC', label: 'ROI CALCULATOR', zone: 'SELL ZONE', icon: 'calc' },
  { mode: 'SELL', mod: 'SEQUENCER', label: 'ATTACK SEQUENCER', zone: 'SELL ZONE', icon: 'link' },
  { mode: 'SELL', mod: 'DECK_ARCH', label: 'DECK ARCHITECT', zone: 'SELL ZONE', icon: 'build' },
  { mode: 'SELL', mod: 'DEMO_SANDBOX', label: 'DEMO SANDBOX', zone: 'SELL ZONE', icon: 'sandbox' },
  { mode: 'SELL', mod: 'DRAFTING', label: 'DRAFTING PORTAL', zone: 'SELL ZONE', icon: 'pen' },
  { mode: 'SELL', mod: 'VOICE_STRAT', label: 'VOICE STRATEGIST', zone: 'SELL ZONE', icon: 'mic' },
  { mode: 'SELL', mod: 'AI_CONCIERGE', label: 'AI CONCIERGE', zone: 'SELL ZONE', icon: 'robot' },
  { mode: 'SELL', mod: 'PITCH_GEN', label: 'PITCH GENERATOR', zone: 'SELL ZONE', icon: 'chat' },
  { mode: 'SELL', mod: 'FUNNEL_MAP', label: 'FUNNEL MAPPER', zone: 'SELL ZONE', icon: 'funnel' },

  // --- CONTROL ZONE ---
  { mode: 'CONTROL', mod: 'PLAYBOOK', label: 'AGENCY PLAYBOOK', zone: 'CONTROL ZONE', icon: 'book' },
  { mode: 'CONTROL', mod: 'BILLING', label: 'THEATER BILLING', zone: 'CONTROL ZONE', icon: 'money' },
  { mode: 'CONTROL', mod: 'AFFILIATE', label: 'AFFILIATE MATRIX', zone: 'CONTROL ZONE', icon: 'hub' },
  { mode: 'CONTROL', mod: 'IDENTITY', label: 'AGENCY IDENTITY', zone: 'CONTROL ZONE', icon: 'build' },
  { mode: 'CONTROL', mod: 'OS_FORGE', label: 'OS CONFIG FORGE', zone: 'CONTROL ZONE', icon: 'settings' },
  { mode: 'CONTROL', mod: 'EXPORT_DATA', label: 'DATA EXPORT NODE', zone: 'CONTROL ZONE', icon: 'vault' },
  { mode: 'CONTROL', mod: 'CALENDAR', label: 'COMBAT CALENDAR', zone: 'CONTROL ZONE', icon: 'clock' },
  { mode: 'CONTROL', mod: 'PROD_LOG', label: 'PRODUCTION LOGS', zone: 'CONTROL ZONE', icon: 'list' },
  { mode: 'CONTROL', mod: 'SETTINGS', label: 'SYSTEM SETTINGS', zone: 'CONTROL ZONE', icon: 'settings' },
  { mode: 'CONTROL', mod: 'CIPHER_NODE', label: 'CIPHER SECURITY', zone: 'CONTROL ZONE', icon: 'key' },
  { mode: 'CONTROL', mod: 'NEXUS_GRAPH', label: 'NEXUS GRAPH', zone: 'CONTROL ZONE', icon: 'graph' },
  { mode: 'CONTROL', mod: 'CHRONOS', label: 'CHRONOS LOGS', zone: 'CONTROL ZONE', icon: 'clock' },
  { mode: 'CONTROL', mod: 'TASKS', label: 'MISSION TASKS', zone: 'CONTROL ZONE', icon: 'check' },
  { mode: 'CONTROL', mod: 'THEME', label: 'UI THEME ENGINE', zone: 'CONTROL ZONE', icon: 'color' },
  { mode: 'CONTROL', mod: 'TOKENS', label: 'TOKEN VAULT', zone: 'CONTROL ZONE', icon: 'ticket' },
];

const ZONE_STYLES: Record<string, { headerBg: string; headerText: string; hoverBg: string; hoverText: string; iconBg: string; border: string }> = {
  'OPERATE ZONE': {
    headerBg: 'bg-emerald-950/80',
    headerText: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-600/10',
    hoverText: 'group-hover:text-emerald-400',
    iconBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    border: 'border-emerald-500/30'
  },
  'CREATE ZONE': {
    headerBg: 'bg-emerald-950/80',
    headerText: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-600/10',
    hoverText: 'group-hover:text-emerald-400',
    iconBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    border: 'border-emerald-500/30'
  },
  'STUDIO ZONE': { 
    headerBg: 'bg-emerald-950/80',
    headerText: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-600/10',
    hoverText: 'group-hover:text-emerald-400',
    iconBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    border: 'border-emerald-500/30'
  },
  'SELL ZONE': { 
    headerBg: 'bg-emerald-950/80',
    headerText: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-600/10',
    hoverText: 'group-hover:text-emerald-400',
    iconBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    border: 'border-emerald-500/30'
  },
  'CONTROL ZONE': { 
    headerBg: 'bg-emerald-950/80',
    headerText: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-600/10',
    hoverText: 'group-hover:text-emerald-400',
    iconBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    border: 'border-emerald-500/30'
  }
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect, theme }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredItems = MODULE_DATA.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.zone.toLowerCase().includes(query.toLowerCase())
  );

  const zones = Array.from(new Set(filteredItems.map(f => f.zone)));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-3xl border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh] ${theme === 'dark' ? 'bg-[#0b1021]' : 'bg-white'}`}>
        
        {/* SEARCH HEADER */}
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-5 shrink-0">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" strokeLinecap="round"/></svg>
          </div>
          <input
            autoFocus
            className={`w-full bg-transparent placeholder-slate-600 text-2xl outline-none font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            placeholder="SEARCH NEURAL MODULES..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">ESC</button>
        </div>
        
        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto custom-scrollbar flex-1 relative">
          {filteredItems.length === 0 && (
            <div className="py-32 text-center flex flex-col items-center justify-center opacity-50">
               <svg className="w-12 h-12 mb-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-14a2 2 0 100 4 2 2 0 000-4z" strokeWidth="2"/></svg>
               <p className="text-slate-500 font-black uppercase tracking-widest">SIGNAL LOST: NO MODULES FOUND</p>
            </div>
          )}

          {zones.map((zone) => {
            const style = ZONE_STYLES[zone] || ZONE_STYLES['OPERATE ZONE'];
            const items = filteredItems.filter(f => f.zone === zone);
            
            return (
              <div key={zone} className="relative">
                {/* STICKY HEADER */}
                <div className={`sticky top-0 z-10 px-6 py-2 border-y ${style.border} ${style.headerBg} backdrop-blur-md flex justify-between items-center`}>
                  <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${style.headerText}`}>{zone}</span>
                  <span className={`text-[9px] font-bold ${style.headerText} opacity-60`}>{items.length} NODES</span>
                </div>

                <div className="p-2 space-y-1">
                  {items.map((item, i) => (
                    <button
                      key={item.mod}
                      onClick={() => { onSelect(item.mode, item.mod); onClose(); }}
                      className={`w-full text-left px-6 py-4 rounded-2xl transition-all flex items-center justify-between group ${style.hoverBg} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border border-slate-800 bg-slate-900 ${style.iconBg}`}>
                          <Icon name={item.icon} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black uppercase tracking-widest transition-colors ${style.hoverText} ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
                            {item.label}
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] group-hover:text-slate-500">
                            {item.mode} PROTOCOL
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all translate-x-2 group-hover:translate-x-0">
                        <span className={style.headerText}>INITIALIZE</span>
                        <span className="text-lg leading-none">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className={`p-4 border-t border-slate-800/50 flex justify-between items-center bg-slate-950/80 shrink-0`}>
           <div className="flex gap-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <span>↑↓ NAVIGATE</span>
              <span>ENTER SELECT</span>
              <span>ESC CLOSE</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SYSTEM 54 NODES ONLINE</span>
           </div>
        </div>
      </div>
    </div>
  );
};
