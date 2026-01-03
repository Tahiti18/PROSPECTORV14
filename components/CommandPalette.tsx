
import React, { useState } from 'react';
import { MainMode, SubModule } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: MainMode, module: SubModule) => void;
  theme: 'dark' | 'light';
}

const MODULE_DATA: { mode: MainMode; mod: SubModule; label: string; zone: string }[] = [
  // OPERATE ZONE (INDIGO)
  { mode: 'OPERATE', mod: 'COMMAND', label: 'COMMAND', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'RADAR_RECON', label: 'RADAR RECON', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'AUTO_CRAWL', label: 'AUTO-CRAWL', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'TARGET_LIST', label: 'TARGET LIST', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'PIPELINE', label: 'PIPELINE', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'WAR_ROOM', label: 'WAR ROOM', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'DEEP_LOGIC', label: 'DEEP LOGIC', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'WORKSPACE', label: 'WORKSPACE', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'VIRAL_PULSE', label: 'VIRAL PULSE', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'VISION_LAB', label: 'VISION LAB', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'CINEMA_INTEL', label: 'CINEMA INTEL', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'ARTICLE_INTEL', label: 'ARTICLE INTEL', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'BENCHMARK', label: 'BENCHMARK', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'ANALYTICS', label: 'ANALYTICS', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'HEATMAP', label: 'HEATMAP', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'PROMPT_AI', label: 'PROMPT AI', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'MODEL_TEST', label: 'MODEL TEST', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'VIDEO_AI', label: 'VIDEO AI', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'FACT_CHECK', label: 'FACT CHECK', zone: 'OPERATE ZONE' },
  { mode: 'OPERATE', mod: 'TRANSLATOR', label: 'TRANSLATOR', zone: 'OPERATE ZONE' },
  // CREATE ZONE (ROSE - Screenshot 17)
  { mode: 'CREATE', mod: 'VIDEO_PITCH', label: 'VIDEO PITCH', zone: 'CREATE ZONE' },
  { mode: 'CREATE', mod: 'VISUAL_STUDIO', label: 'VISUAL STUDIO', zone: 'CREATE ZONE' },
  { mode: 'CREATE', mod: 'MOCKUPS_4K', label: '4K MOCKUPS', zone: 'CREATE ZONE' },
  { mode: 'CREATE', mod: 'SONIC_STUDIO', label: 'SONIC STUDIO', zone: 'CREATE ZONE' },
  { mode: 'CREATE', mod: 'PRODUCT_SYNTH', label: 'PRODUCT SYNTH', zone: 'CREATE ZONE' },
  { mode: 'CREATE', mod: 'MOTION_LAB', label: 'MOTION LAB', zone: 'CREATE ZONE' },
  { mode: 'CREATE', mod: 'FLASH_SPARK', label: 'FLASH SPARK', zone: 'CREATE ZONE' },
  { mode: 'CREATE', mod: 'MEDIA_VAULT', label: 'MEDIA VAULT', zone: 'CREATE ZONE' },
  // SELL ZONE (EMERALD - Screenshot 18)
  { mode: 'SELL', mod: 'PROPOSALS', label: 'PROPOSALS', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'ROI_CALC', label: 'ROI CALC', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'SEQUENCER', label: 'SEQUENCER', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'DECK_ARCH', label: 'DECK ARCH', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'DEMO_SANDBOX', label: 'DEMO SANDBOX', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'DRAFTING', label: 'DRAFTING', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'VOICE_STRAT', label: 'VOICE STRAT', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'LIVE_SCRIBE', label: 'LIVE SCRIBE', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'AI_CONCIERGE', label: 'AI CONCIERGE', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'PITCH_GEN', label: 'PITCH GEN', zone: 'SELL ZONE' },
  { mode: 'SELL', mod: 'FUNNEL_MAP', label: 'FUNNEL MAP', zone: 'SELL ZONE' },
  // CONTROL ZONE (AMBER - Screenshot 19)
  { mode: 'CONTROL', mod: 'PLAYBOOK', label: 'PLAYBOOK', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'BILLING', label: 'BILLING', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'AFFILIATE', label: 'AFFILIATE', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'IDENTITY', label: 'IDENTITY', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'OS_FORGE', label: 'OS FORGE', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'EXPORT_DATA', label: 'EXPORT DATA', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'CALENDAR', label: 'CALENDAR', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'PROD_LOG', label: 'PROD. LOG', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'SETTINGS', label: 'SETTINGS', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'CIPHER_NODE', label: 'CIPHER NODE', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'NEXUS_GRAPH', label: 'NEXUS GRAPH', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'CHRONOS', label: 'CHRONOS', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'TASKS', label: 'TASKS', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'THEME', label: 'THEME', zone: 'CONTROL ZONE' },
  { mode: 'CONTROL', mod: 'TOKENS', label: 'TOKENS', zone: 'CONTROL ZONE' },
];

const ZONE_COLORS: Record<string, string> = {
  'OPERATE ZONE': 'text-indigo-400 border-indigo-500/30',
  'CREATE ZONE': 'text-rose-400 border-rose-500/30',
  'SELL ZONE': 'text-emerald-400 border-emerald-500/30',
  'CONTROL ZONE': 'text-amber-400 border-amber-500/30',
};

const ZONE_BG_HOVERS: Record<string, string> = {
  'OPERATE ZONE': 'hover:bg-indigo-500/10 group-hover:text-indigo-400',
  'CREATE ZONE': 'hover:bg-rose-500/10 group-hover:text-rose-400',
  'SELL ZONE': 'hover:bg-emerald-500/10 group-hover:text-emerald-400',
  'CONTROL ZONE': 'hover:bg-amber-500/10 group-hover:text-amber-400',
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect, theme }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = MODULE_DATA.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.zone.toLowerCase().includes(query.toLowerCase())
  );

  const zones = Array.from(new Set(MODULE_DATA.map(f => f.zone)));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className={`relative w-full max-w-2xl border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-[#0b1021]' : 'bg-white'}`}>
        <div className="p-8 border-b border-slate-800/50 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" strokeLinecap="round"/></svg>
          </div>
          <input
            autoFocus
            className={`w-full bg-transparent placeholder-slate-600 text-xl outline-none font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}
            placeholder="SEARCH MODULES (E.G., 'RECON', 'VEO', 'PROPOSAL')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">ESC</div>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto p-4 custom-scrollbar">
          {zones.map(zone => {
            const items = filtered.filter(f => f.zone === zone);
            if (items.length === 0) return null;
            
            return (
              <div key={zone} className="mb-6">
                <div className={`px-4 py-1.5 border-b mb-3 ${ZONE_COLORS[zone]}`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">{zone}</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onSelect(item.mode, item.mod)}
                      className={`w-full text-left px-6 py-3 rounded-2xl transition-all flex items-center justify-between group ${ZONE_BG_HOVERS[zone]}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                          {item.mod === 'COMMAND' ? '📊' : item.zone.includes('CREATE') ? '🎨' : item.zone.includes('SELL') ? '💰' : '📁'}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-black uppercase tracking-widest group-hover:text-white transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">{item.mode} MODULE</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-opacity">
                        ENGAGE <span className="text-sm">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-20 text-center text-slate-600 font-black uppercase tracking-widest italic">Signal lost: no modules found</div>
          )}
        </div>

        <div className={`p-4 border-t border-slate-800/50 flex justify-between items-center ${theme === 'dark' ? 'bg-[#05091a]' : 'bg-slate-50'}`}>
           <div className="flex gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <span>↑↓ SELECT</span>
              <span className="mx-1">•</span>
              <span>ENTER OPEN</span>
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