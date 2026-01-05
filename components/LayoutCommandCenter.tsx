
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
  Operate: <IconWrapper path={<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />} />,
  Create: <IconWrapper path={<path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" />} />,
  Studio: <IconWrapper path={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>} />,
  Sell: <IconWrapper path={<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />} />,
  Control: <IconWrapper path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>} />,
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
      { id: 'VIDEO_PITCH', label: 'Veo Pitch' },
      { id: 'VIDEO_AI', label: 'Video Audit' },
      { id: 'CINEMA_INTEL', label: 'Cinema Intel' },
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

const MODE_CONFIG: Record<MainMode, { color: string; bg: string; icon: React.ReactNode }> = {
  OPERATE: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: Icons.Operate },
  CREATE: { color: 'text-violet-500', bg: 'bg-violet-500/10', icon: Icons.Create },
  STUDIO: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Icons.Studio },
  SELL: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Icons.Sell },
  CONTROL: { color: 'text-cyan-500', bg: 'bg-cyan-500/10', icon: Icons.Control },
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
  
  const activeConfig = MODE_CONFIG[activeMode];
  const groups = MODULE_GROUPS[activeMode];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* --- PANE 1: MODE RAIL (Fixed Slim) --- */}
      <div className={`w-[80px] flex-shrink-0 flex flex-col items-center py-6 border-r z-50 ${theme === 'dark' ? 'bg-[#05091a] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="mb-8">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-black text-xl">
             P
           </div>
        </div>

        <nav className="flex-1 flex flex-col gap-6 w-full px-2">
          {(Object.keys(MODE_CONFIG) as MainMode[]).map((mode) => {
            const isActive = activeMode === mode;
            const config = MODE_CONFIG[mode];
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
                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-600'}`}>
                  {mode}
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

      {/* --- PANE 2: MODULE RAIL (Context Sidebar) --- */}
      <div className={`w-[210px] flex-shrink-0 flex flex-col border-r z-40 transition-colors ${theme === 'dark' ? 'bg-[#0b1021] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
         
         {/* Sidebar Header */}
         <div className="h-16 px-6 border-b border-dashed border-slate-800/50 flex items-center justify-between shrink-0">
            <h2 className={`text-sm font-black uppercase tracking-widest ${activeConfig.color}`}>{activeMode}</h2>
         </div>

         {/* Search Filter */}
         <div className="p-4 shrink-0">
            <div className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-[#020617] border-slate-800 focus-within:border-slate-600' : 'bg-white border-slate-200'}`}>
               <svg className="w-4 h-4 text-slate-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input 
                 className="bg-transparent w-full text-xs font-medium focus:outline-none placeholder-slate-600 text-slate-300"
                 placeholder="Filter modules..."
                 value={moduleFilter}
                 onChange={(e) => setModuleFilter(e.target.value)}
               />
            </div>
         </div>

         {/* Module List */}
         <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6">
            {Object.entries(groups).map(([groupName, modules]) => {
               // Filter logic
               const filteredModules = (modules as { id: SubModule; label: string }[]).filter(m => m.label.toLowerCase().includes(moduleFilter.toLowerCase()));
               if (filteredModules.length === 0) return null;

               return (
                 <div key={groupName} className="mb-6 animate-in slide-in-from-left-2 duration-300">
                    {/* TYPOGRAPHY INVERSION: Bigger Header */}
                    <h3 className="px-3 mb-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{groupName}</h3>
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

         {/* Bottom Actions */}
         <div className="p-4 border-t border-slate-800 bg-slate-900/30">
            <button 
              onClick={onSearchClick}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-[10px] font-black uppercase tracking-widest"
            >
               <span>⌘K</span> COMMAND PALETTE
            </button>
         </div>
      </div>

      {/* --- PANE 3: MAIN CONTENT STAGE --- */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-slate-950">
         
         {/* Top Bar (Context & Global Actions) */}
         <header className={`h-16 px-8 border-b flex items-center justify-between shrink-0 backdrop-blur-md z-30 transition-colors ${theme === 'dark' ? 'bg-[#020617]/80 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
            <div className="flex items-center gap-4">
               <span className="text-slate-500 text-sm">/</span>
               <span className={`text-xs font-black uppercase tracking-widest ${activeConfig.color}`}>{activeMode}</span>
               <span className="text-slate-500 text-sm">/</span>
               <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{activeModule.replace('_', ' ')}</span>
            </div>

            <div className="flex items-center gap-6">
               {/* Layout Switcher */}
               <div className="relative group">
                  <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                     <span>LAYOUT: {currentLayout.replace('_', ' ')}</span>
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#0b1021] border border-slate-800 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     <button onClick={() => setLayoutMode('LEGACY')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors border-b border-slate-800">
                        LEGACY (HORIZONTAL)
                     </button>
                     <button onClick={() => setLayoutMode('COMMAND')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors border-b border-slate-800">
                        COMMAND (SIDEBAR)
                     </button>
                     <button onClick={() => setLayoutMode('ZENITH')} className="w-full text-left px-4 py-3 text-[10px] font-bold text-indigo-400 bg-indigo-900/10 hover:bg-indigo-900/20 transition-colors">
                        ZENITH (TOP NAV)
                     </button>
                  </div>
               </div>

               <div className="h-4 w-px bg-slate-800"></div>

               <select 
                  value={theater} 
                  onChange={(e) => setTheater(e.target.value)}
                  className={`bg-transparent text-xs font-bold uppercase focus:outline-none cursor-pointer border-none max-w-[140px] truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}
               >
                  <option value="CYPRUS">CYPRUS</option>
                  <option value="DUBAI">DUBAI</option>
                  <option value="LONDON">LONDON</option>
                  <option value="NEW YORK">NEW YORK</option>
               </select>
            </div>
         </header>

         {/* Content Scroll Area */}
         <main className="flex-1 overflow-y-auto custom-scrollbar relative p-8">
            {/* Background Ambient Glow */}
            <div className={`fixed inset-0 pointer-events-none opacity-[0.02] transition-colors duration-1000 ${activeConfig.bg.replace('/10', '/5')}`}></div>
            
            <div className="max-w-[1920px] mx-auto pb-24">
               {children}
            </div>
         </main>

      </div>
    </div>
  );
};
