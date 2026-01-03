
import React from 'react';
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
}

const Icons = {
  Operate: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
  Create: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" /></svg>,
  Sell: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  Control: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>,
  Command: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Radar: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 12L19 19" /><path d="M12 12L5 5" /><circle cx="12" cy="12" r="3" /></svg>,
  Target: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeMode, setActiveMode, activeModule, setActiveModule, onSearchClick, theater, setTheater, theme, toggleTheme
}) => {
  const subModules: Record<MainMode, { id: SubModule; label: string; icon: string | React.ReactNode }[]> = {
    OPERATE: [
      { id: 'COMMAND', label: 'COMMAND', icon: Icons.Command },
      { id: 'RADAR_RECON', label: 'RADAR RECON', icon: Icons.Radar },
      { id: 'AUTO_CRAWL', label: 'AUTO CRAWL', icon: '📡' },
      { id: 'TARGET_LIST', label: 'TARGET LEDGER', icon: Icons.Target },
      { id: 'PIPELINE', label: 'PIPELINE', icon: '🔄' },
      { id: 'WAR_ROOM', label: 'WAR ROOM', icon: '⚔️' },
      { id: 'DEEP_LOGIC', label: 'DEEP LOGIC', icon: '🧠' },
      { id: 'VIRAL_PULSE', label: 'VIRAL PULSE', icon: '📈' },
      { id: 'VISION_LAB', label: 'VISION LAB', icon: '👁️' },
      { id: 'CINEMA_INTEL', label: 'CINEMA INTEL', icon: '🎬' },
      { id: 'ARTICLE_INTEL', label: 'ARTICLE INTEL', icon: '📄' },
      { id: 'BENCHMARK', label: 'BENCHMARK', icon: '📏' },
      { id: 'ANALYTICS', label: 'ANALYTICS', icon: '📉' },
      { id: 'HEATMAP', label: 'HEATMAP', icon: '🔥' },
      { id: 'PROMPT_AI', label: 'PROMPT AI', icon: '💬' },
      { id: 'MODEL_TEST', label: 'MODEL TEST', icon: '🧪' },
      { id: 'VIDEO_AI', label: 'VIDEO AI', icon: '🎥' },
      { id: 'FACT_CHECK', label: 'FACT CHECK', icon: '✅' },
      { id: 'TRANSLATOR', label: 'TRANSLATOR', icon: '🌐' },
    ],
    CREATE: [
      { id: 'VIDEO_PITCH', label: 'VIDEO PITCH', icon: '📹' },
      { id: 'VISUAL_STUDIO', label: 'VISUAL STUDIO', icon: '🎨' },
      { id: 'MOCKUPS_4K', label: '4K MOCKUPS', icon: '🖥️' },
      { id: 'SONIC_STUDIO', label: 'SONIC STUDIO', icon: '🎵' },
      { id: 'PRODUCT_SYNTH', label: 'PRODUCT SYNTH', icon: '🧬' },
      { id: 'MOTION_LAB', label: 'MOTION LAB', icon: '🏃' },
      { id: 'FLASH_SPARK', label: 'FLASH SPARK', icon: '⚡' },
      { id: 'MEDIA_VAULT', label: 'MEDIA VAULT', icon: '🔒' },
    ],
    SELL: [
      { id: 'PROPOSALS', label: 'PROPOSALS', icon: '📝' },
      { id: 'ROI_CALC', label: 'ROI CALC', icon: '💰' },
      { id: 'SEQUENCER', label: 'SEQUENCER', icon: '⛓️' },
      { id: 'DECK_ARCH', label: 'DECK ARCH', icon: '🏗️' },
      { id: 'DEMO_SANDBOX', label: 'DEMO SANDBOX', icon: '🏖️' },
      { id: 'DRAFTING', label: 'DRAFTING', icon: '✏️' },
      { id: 'VOICE_STRAT', label: 'VOICE STRAT', icon: '🗣️' },
      { id: 'LIVE_SCRIBE', label: 'LIVE SCRIBE', icon: '✍️' },
      { id: 'AI_CONCIERGE', label: 'AI CONCIERGE', icon: '🤖' },
      { id: 'PITCH_GEN', label: 'PITCH GEN', icon: '📢' },
      { id: 'FUNNEL_MAP', label: 'FUNNEL MAP', icon: '🗺️' },
    ],
    CONTROL: [
      { id: 'PLAYBOOK', label: 'PLAYBOOK', icon: '📖' },
      { id: 'BILLING', label: 'BILLING', icon: '💳' },
      { id: 'AFFILIATE', label: 'AFFILIATE', icon: '🤝' },
      { id: 'IDENTITY', label: 'IDENTITY', icon: '🏢' },
      { id: 'OS_FORGE', label: 'OS FORGE', icon: '⚒️' },
      { id: 'EXPORT_DATA', label: 'EXPORT DATA', icon: '📤' },
      { id: 'CALENDAR', label: 'CALENDAR', icon: '📅' },
      { id: 'PROD_LOG', label: 'PROD LOG', icon: '📋' },
      { id: 'SETTINGS', label: 'SETTINGS', icon: '⚙️' },
      { id: 'CIPHER_NODE', label: 'CIPHER NODE', icon: '🔑' },
      { id: 'NEXUS_GRAPH', label: 'NEXUS GRAPH', icon: '🕸️' },
      { id: 'CHRONOS', label: 'CHRONOS', icon: '⏳' },
      { id: 'TASKS', label: 'TASKS', icon: '✅' },
      { id: 'THEME', label: 'THEME', icon: '🎨' },
      { id: 'TOKENS', label: 'TOKENS', icon: '🎟️' },
    ],
  };

  const headerBg = theme === 'dark' ? 'bg-[#0b1021]/95 border-slate-800/60' : 'bg-white border-slate-200 shadow-sm';
  const labelColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const stripBg = theme === 'dark' ? 'bg-[#0b1021]/60 border-slate-800/30' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617]' : 'bg-white'}`}>
      <header className={`${headerBg} backdrop-blur-xl border-b px-6 py-3 flex items-center justify-between z-40 transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
             <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
               <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
             </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className={`text-[11px] font-black leading-none tracking-widest uppercase ${labelColor}`}>POMELLI <span className="text-indigo-500 italic">CORE</span></h1>
            <p className="text-[8px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1 italic opacity-60">LEAD INTEL ENGINE V13.2</p>
          </div>
        </div>

        <div className={`border rounded-lg p-0.5 flex ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          {(['OPERATE', 'CREATE', 'SELL', 'CONTROL'] as MainMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                activeMode === mode 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : theme === 'dark' ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode === 'OPERATE' && Icons.Operate}
              {mode === 'CREATE' && Icons.Create}
              {mode === 'SELL' && Icons.Sell}
              {mode === 'CONTROL' && Icons.Control}
              <span className="hidden lg:inline">{mode}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'}`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <div className="relative group hidden xl:block">
             <input 
              onClick={onSearchClick}
              readOnly
              className={`border rounded-lg pl-8 pr-10 py-2 text-[10px] w-48 focus:outline-none cursor-pointer font-black tracking-wider transition-colors ${theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100 group-hover:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 group-hover:border-slate-500'}`} 
              placeholder="QUICK SEARCH..." 
            />
            <span className="absolute left-3 inset-y-0 flex items-center text-[10px]">🔍</span>
            <span className="absolute right-2.5 inset-y-0 flex items-center text-[7px] font-black text-slate-500">⌘K</span>
          </div>

          <div className={`flex items-center gap-2 border rounded-lg px-4 py-2 hover:border-indigo-500 transition-colors ${theme === 'dark' ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
            <span className="text-[10px]">🌍</span>
            <input 
              type="text"
              value={theater}
              onChange={(e) => setTheater(e.target.value.toUpperCase())}
              className={`bg-transparent text-[10px] font-black uppercase tracking-[0.2em] w-24 focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
              placeholder="REGION"
            />
          </div>
        </div>
      </header>

      <div className={`${stripBg} border-b px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap z-30 shadow-inner transition-colors duration-300`}>
        {subModules[activeMode]?.map(mod => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all border group ${
              activeModule === mod.id 
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-sm' 
                : theme === 'dark' ? 'border-transparent text-slate-200 hover:text-white hover:bg-slate-800' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <span className={`text-xs transition-opacity group-hover:opacity-100 ${activeModule === mod.id ? 'opacity-100 font-bold' : 'opacity-70'}`}>{mod.icon}</span>
            <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${activeModule === mod.id ? 'text-indigo-400' : ''}`}>{mod.label}</span>
          </button>
        ))}
      </div>

      <main className={`flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        {children}
      </main>
    </div>
  );
};
