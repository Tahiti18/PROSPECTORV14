
import React, { useState, useEffect } from 'react';
import { MainMode, SubModule } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: MainMode, module: SubModule) => void;
  theme: 'dark' | 'light';
}

// FULL 54-MODULE REGISTRY MAPPED TO NEW COLOR ZONES
const MODULE_DATA: { mode: MainMode; mod: SubModule; label: string; zone: string; icon: string }[] = [
  // --- OPERATE ZONE (INDIGO) ---
  { mode: 'OPERATE', mod: 'COMMAND', label: 'MISSION CONTROL', zone: 'OPERATE ZONE', icon: '📊' },
  { mode: 'OPERATE', mod: 'RADAR_RECON', label: 'RADAR RECON', zone: 'OPERATE ZONE', icon: '📡' },
  { mode: 'OPERATE', mod: 'AUTO_CRAWL', label: 'AUTO CRAWL SWARM', zone: 'OPERATE ZONE', icon: '🕷️' },
  { mode: 'OPERATE', mod: 'TARGET_LIST', label: 'TARGET LEDGER', zone: 'OPERATE ZONE', icon: '🎯' },
  { mode: 'OPERATE', mod: 'PIPELINE', label: 'PIPELINE VIEW', zone: 'OPERATE ZONE', icon: '🔄' },
  { mode: 'OPERATE', mod: 'WAR_ROOM', label: 'WAR ROOM', zone: 'OPERATE ZONE', icon: '⚔️' },
  { mode: 'OPERATE', mod: 'DEEP_LOGIC', label: 'DEEP LOGIC LAB', zone: 'OPERATE ZONE', icon: '🧠' },
  { mode: 'OPERATE', mod: 'WORKSPACE', label: 'GEMINI WORKSPACE', zone: 'OPERATE ZONE', icon: '⚡' },
  { mode: 'OPERATE', mod: 'VIRAL_PULSE', label: 'VIRAL PULSE', zone: 'OPERATE ZONE', icon: '📈' },
  { mode: 'OPERATE', mod: 'VISION_LAB', label: 'VISION LAB', zone: 'OPERATE ZONE', icon: '👁️' },
  { mode: 'OPERATE', mod: 'ARTICLE_INTEL', label: 'ARTICLE INTEL', zone: 'OPERATE ZONE', icon: '📄' },
  { mode: 'OPERATE', mod: 'BENCHMARK', label: 'BENCHMARK REVERSE', zone: 'OPERATE ZONE', icon: '📏' },
  { mode: 'OPERATE', mod: 'ANALYTICS', label: 'ANALYTICS CORE', zone: 'OPERATE ZONE', icon: '📉' },
  { mode: 'OPERATE', mod: 'ANALYTICS_HUB', label: 'DOMINANCE HUB', zone: 'OPERATE ZONE', icon: '🏰' },
  { mode: 'OPERATE', mod: 'HEATMAP', label: 'HEATMAP', zone: 'OPERATE ZONE', icon: '🔥' },
  { mode: 'OPERATE', mod: 'PROMPT_AI', label: 'PROMPT INTERFACE', zone: 'OPERATE ZONE', icon: '💬' },
  { mode: 'OPERATE', mod: 'MODEL_TEST', label: 'MODEL BENCHMARK', zone: 'OPERATE ZONE', icon: '🧪' },
  { mode: 'OPERATE', mod: 'FACT_CHECK', label: 'FACT CHECKER', zone: 'OPERATE ZONE', icon: '✅' },
  { mode: 'OPERATE', mod: 'TRANSLATOR', label: 'TACTICAL TRANSLATOR', zone: 'OPERATE ZONE', icon: '🌐' },

  // --- CREATE ZONE (VIOLET) ---
  { mode: 'CREATE', mod: 'VISUAL_STUDIO', label: 'VISUAL STUDIO', zone: 'CREATE ZONE', icon: '🎨' },
  { mode: 'CREATE', mod: 'MOCKUPS_4K', label: '4K MOCKUP FORGE', zone: 'CREATE ZONE', icon: '🖥️' },
  { mode: 'CREATE', mod: 'PRODUCT_SYNTH', label: 'PRODUCT SYNTH', zone: 'CREATE ZONE', icon: '🧬' },
  { mode: 'CREATE', mod: 'FLASH_SPARK', label: 'FLASH SPARK', zone: 'CREATE ZONE', icon: '⚡' },
  { mode: 'CREATE', mod: 'MEDIA_VAULT', label: 'MEDIA VAULT', zone: 'CREATE ZONE', icon: '🔒' },

  // --- STUDIO ZONE (AMBER) ---
  { mode: 'STUDIO', mod: 'VIDEO_PITCH', label: 'VIDEO FAST', zone: 'STUDIO ZONE', icon: '📹' },
  { mode: 'STUDIO', mod: 'VIDEO_AI', label: 'VIDEO AUDIT', zone: 'STUDIO ZONE', icon: '🎥' },
  { mode: 'STUDIO', mod: 'CINEMA_INTEL', label: 'CINEMA INTEL', zone: 'STUDIO ZONE', icon: '🎬' },
  { mode: 'STUDIO', mod: 'MOTION_LAB', label: 'MOTION LAB', zone: 'STUDIO ZONE', icon: '🏃' },
  { mode: 'STUDIO', mod: 'SONIC_STUDIO', label: 'SONIC STUDIO', zone: 'STUDIO ZONE', icon: '🎵' },
  { mode: 'STUDIO', mod: 'LIVE_SCRIBE', label: 'LIVE SCRIBE', zone: 'STUDIO ZONE', icon: '✍️' },

  // --- SELL ZONE (EMERALD) ---
  { mode: 'SELL', mod: 'BUSINESS_ORCHESTRATOR', label: 'BUSINESS ORCHESTRATOR', zone: 'SELL ZONE', icon: '🎼' },
  { mode: 'SELL', mod: 'PROPOSALS', label: 'PROPOSAL ARCHITECT', zone: 'SELL ZONE', icon: '📝' },
  { mode: 'SELL', mod: 'ROI_CALC', label: 'ROI CALCULATOR', zone: 'SELL ZONE', icon: '💰' },
  { mode: 'SELL', mod: 'SEQUENCER', label: 'ATTACK SEQUENCER', zone: 'SELL ZONE', icon: '⛓️' },
  { mode: 'SELL', mod: 'DECK_ARCH', label: 'DECK ARCHITECT', zone: 'SELL ZONE', icon: '🏗️' },
  { mode: 'SELL', mod: 'DEMO_SANDBOX', label: 'DEMO SANDBOX', zone: 'SELL ZONE', icon: '🏖️' },
  { mode: 'SELL', mod: 'DRAFTING', label: 'DRAFTING PORTAL', zone: 'SELL ZONE', icon: '✏️' },
  { mode: 'SELL', mod: 'VOICE_STRAT', label: 'VOICE STRATEGIST', zone: 'SELL ZONE', icon: '🗣️' },
  { mode: 'SELL', mod: 'AI_CONCIERGE', label: 'AI CONCIERGE', zone: 'SELL ZONE', icon: '🤖' },
  { mode: 'SELL', mod: 'PITCH_GEN', label: 'PITCH GENERATOR', zone: 'SELL ZONE', icon: '📢' },
  { mode: 'SELL', mod: 'FUNNEL_MAP', label: 'FUNNEL MAPPER', zone: 'SELL ZONE', icon: '🗺️' },

  // --- CONTROL ZONE (SLATE) ---
  { mode: 'CONTROL', mod: 'PLAYBOOK', label: 'AGENCY PLAYBOOK', zone: 'CONTROL ZONE', icon: '📖' },
  { mode: 'CONTROL', mod: 'BILLING', label: 'THEATER BILLING', zone: 'CONTROL ZONE', icon: '💳' },
  { mode: 'CONTROL', mod: 'AFFILIATE', label: 'AFFILIATE MATRIX', zone: 'CONTROL ZONE', icon: '🤝' },
  { mode: 'CONTROL', mod: 'IDENTITY', label: 'AGENCY IDENTITY', zone: 'CONTROL ZONE', icon: '🏢' },
  { mode: 'CONTROL', mod: 'OS_FORGE', label: 'OS CONFIG FORGE', zone: 'CONTROL ZONE', icon: '⚒️' },
  { mode: 'CONTROL', mod: 'EXPORT_DATA', label: 'DATA EXPORT NODE', zone: 'CONTROL ZONE', icon: '📤' },
  { mode: 'CONTROL', mod: 'CALENDAR', label: 'COMBAT CALENDAR', zone: 'CONTROL ZONE', icon: '📅' },
  { mode: 'CONTROL', mod: 'PROD_LOG', label: 'PRODUCTION LOGS', zone: 'CONTROL ZONE', icon: '📋' },
  { mode: 'CONTROL', mod: 'SETTINGS', label: 'SYSTEM SETTINGS', zone: 'CONTROL ZONE', icon: '⚙️' },
  { mode: 'CONTROL', mod: 'CIPHER_NODE', label: 'CIPHER SECURITY', zone: 'CONTROL ZONE', icon: '🔑' },
  { mode: 'CONTROL', mod: 'NEXUS_GRAPH', label: 'NEXUS GRAPH', zone: 'CONTROL ZONE', icon: '🕸️' },
  { mode: 'CONTROL', mod: 'CHRONOS', label: 'CHRONOS LOGS', zone: 'CONTROL ZONE', icon: '⏳' },
  { mode: 'CONTROL', mod: 'TASKS', label: 'MISSION TASKS', zone: 'CONTROL ZONE', icon: '✅' },
  { mode: 'CONTROL', mod: 'THEME', label: 'UI THEME ENGINE', zone: 'CONTROL ZONE', icon: '🎨' },
  { mode: 'CONTROL', mod: 'TOKENS', label: 'TOKEN VAULT', zone: 'CONTROL ZONE', icon: '🎟️' },
];

// REFINED PASTEL PALETTE SYSTEM
const ZONE_STYLES: Record<string, { headerBg: string; headerText: string; hoverBg: string; hoverText: string; iconBg: string; border: string }> = {
  'OPERATE ZONE': {
    headerBg: 'bg-indigo-950/80',
    headerText: 'text-indigo-400',
    hoverBg: 'hover:bg-indigo-600/10',
    hoverText: 'group-hover:text-indigo-400',
    iconBg: 'group-hover:bg-indigo-600 group-hover:text-white',
    border: 'border-indigo-500/30'
  },
  'CREATE ZONE': {
    headerBg: 'bg-violet-950/80',
    headerText: 'text-violet-400',
    hoverBg: 'hover:bg-violet-600/10',
    hoverText: 'group-hover:text-violet-400',
    iconBg: 'group-hover:bg-violet-600 group-hover:text-white',
    border: 'border-violet-500/30'
  },
  'STUDIO ZONE': { // AMBER (Replaces Rose/Red)
    headerBg: 'bg-amber-950/80',
    headerText: 'text-amber-400',
    hoverBg: 'hover:bg-amber-600/10',
    hoverText: 'group-hover:text-amber-400',
    iconBg: 'group-hover:bg-amber-500 group-hover:text-black',
    border: 'border-amber-500/30'
  },
  'SELL ZONE': { // EMERALD (Kept green but matches layout)
    headerBg: 'bg-emerald-950/80',
    headerText: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-600/10',
    hoverText: 'group-hover:text-emerald-400',
    iconBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    border: 'border-emerald-500/30'
  },
  'CONTROL ZONE': { // SLATE (Replaces Cyan)
    headerBg: 'bg-slate-950/80',
    headerText: 'text-slate-400',
    hoverBg: 'hover:bg-slate-600/10',
    hoverText: 'group-hover:text-slate-400',
    iconBg: 'group-hover:bg-slate-600 group-hover:text-white',
    border: 'border-slate-500/30'
  }
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect, theme }) => {
  const [query, setQuery] = useState('');

  // Close on Escape
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

  // Group items by zone for rendering
  const zones = Array.from(new Set(filteredItems.map(f => f.zone)));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-3xl border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh] ${theme === 'dark' ? 'bg-[#0b1021]' : 'bg-white'}`}>
        
        {/* SEARCH HEADER */}
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-5 shrink-0">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0 animate-pulse">
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
               <span className="text-4xl mb-4">📡</span>
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 border border-slate-800 bg-slate-900 ${style.iconBg}`}>
                          {item.icon}
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
