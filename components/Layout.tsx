
import React, { useState, useRef, useEffect } from 'react';
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
}

const STRATEGIC_CITIES = [
  { rank: 1, city: "NEW YORK, USA", tier: "S+", focus: "FINANCE_TECH" },
  { rank: 2, city: "LONDON, UK", tier: "S+", focus: "GLOBAL_BIZ" },
  { rank: 3, city: "DUBAI, UAE", tier: "S", focus: "WEALTH_CRYPTO" },
  { rank: 4, city: "SINGAPORE", tier: "S", focus: "ASIA_HQ" },
  { rank: 5, city: "AUSTIN, USA", tier: "A+", focus: "TECH_GROWTH" },
  { rank: 6, city: "MIAMI, USA", tier: "A+", focus: "WEB3_LUXURY" },
  { rank: 7, city: "SYDNEY, AUS", tier: "A+", focus: "APAC_FINANCE" },
  { rank: 8, city: "SAN FRANCISCO, USA", tier: "A+", focus: "DEEP_TECH" },
  { rank: 9, city: "TORONTO, CAN", tier: "A", focus: "NORTH_TECH" },
  { rank: 10, city: "LOS ANGELES, USA", tier: "A", focus: "MEDIA_TECH" },
  { rank: 11, city: "ZURICH, SWI", tier: "A", focus: "BANKING" },
  { rank: 12, city: "MELBOURNE, AUS", tier: "A", focus: "CULTURE_BIZ" },
  { rank: 13, city: "DUBLIN, IRE", tier: "A", focus: "EU_TECH_HQ" },
  { rank: 14, city: "CHICAGO, USA", tier: "B+", focus: "CORP_FINANCE" },
  { rank: 15, city: "DALLAS, USA", tier: "B+", focus: "ENERGY_BIZ" },
  { rank: 16, city: "MANCHESTER, UK", tier: "B+", focus: "UK_GROWTH" },
  { rank: 17, city: "SEATTLE, USA", tier: "B+", focus: "CLOUD_TECH" },
  { rank: 18, city: "VANCOUVER, CAN", tier: "B", focus: "LIFESTYLE_TECH" },
  { rank: 19, city: "BRISBANE, AUS", tier: "B", focus: "QLD_GROWTH" },
  { rank: 20, city: "HOUSTON, USA", tier: "B", focus: "INDUSTRIAL" },
  { rank: 21, city: "BOSTON, USA", tier: "B", focus: "BIO_ROBOTICS" },
  { rank: 22, city: "ATLANTA, USA", tier: "B", focus: "MEDIA_CORP" },
  { rank: 23, city: "HONG KONG", tier: "B", focus: "FINANCE_HUB" },
  { rank: 24, city: "EDINBURGH, UK", tier: "C+", focus: "FINTECH" },
  { rank: 25, city: "DENVER, USA", tier: "C+", focus: "STARTUP_HUB" },
  { rank: 26, city: "SAN DIEGO, USA", tier: "C+", focus: "DEFENSE_BIO" },
  { rank: 27, city: "GOLD COAST, AUS", tier: "C", focus: "TOURISM_WEALTH" },
  { rank: 28, city: "PERTH, AUS", tier: "C", focus: "MINING_WEALTH" },
  { rank: 29, city: "AUCKLAND, NZ", tier: "C", focus: "NZ_HUB" },
  { rank: 30, city: "PHOENIX, USA", tier: "C", focus: "MFG_TECH" }
];

const Icons = {
  Operate: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
  Create: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" /></svg>,
  Studio: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>,
  Sell: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  Control: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>,
  Command: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Radar: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 12L19 19" /><path d="M12 12L5 5" /><circle cx="12" cy="12" r="3" /></svg>,
  Target: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeMode, setActiveMode, activeModule, setActiveModule, onSearchClick, theater, setTheater, theme, toggleTheme
}) => {
  const [showCities, setShowCities] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCities(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const subModules: Record<MainMode, { id: SubModule; label: string; icon: string | React.ReactNode; desc: string }[]> = {
    OPERATE: [
      { id: 'COMMAND', label: 'COMMAND', icon: Icons.Command, desc: "Central mission hub. Overview of active targets, system status, and recent intelligence." },
      { id: 'RADAR_RECON', label: 'RADAR RECON', icon: Icons.Radar, desc: "Broad-spectrum area scanner. Identify businesses in specific regions matching niche criteria." },
      { id: 'AUTO_CRAWL', label: 'AUTO CRAWL', icon: '📡', desc: "Autonomous multi-vector crawler. Decompose regions into sectors and extract signals automatically." },
      { id: 'TARGET_LIST', label: 'TARGET LEDGER', icon: Icons.Target, desc: "The master ledger. Sort, filter, and manage all identified prospects and their scores." },
      { id: 'PIPELINE', label: 'PIPELINE', icon: '🔄', desc: "Kanban-style visual workflow. Track leads from 'Cold' to 'Closed' with stage analytics." },
      { id: 'WAR_ROOM', label: 'WAR ROOM', icon: '⚔️', desc: "Deep-dive tactical center. Analyze a single target's vulnerabilities and plan the attack." },
      { id: 'DEEP_LOGIC', label: 'DEEP LOGIC', icon: '🧠', desc: "System 2 reasoning engine. Solve complex strategic problems using high-compute AI chains." },
      { id: 'VIRAL_PULSE', label: 'VIRAL PULSE', icon: '📈', desc: "Real-time trend monitor. Track viral topics and cultural currents relevant to the target." },
      { id: 'VISION_LAB', label: 'VISION LAB', icon: '👁️', desc: "Static image intelligence. Extract data, sentiment, and design patterns from visual plates." },
      { id: 'ARTICLE_INTEL', label: 'ARTICLE INTEL', icon: '📄', desc: "Textual synthesis engine. Convert long-form articles into executive briefs or viral hooks." },
      { id: 'BENCHMARK', label: 'BENCHMARK', icon: '📏', desc: "Competitive reverse-engineering. Deconstruct a target's tech stack, design system, and gaps." },
      { id: 'ANALYTICS', label: 'ANALYTICS', icon: '📉', desc: "Performance metrics. Visualization of system efficiency and success rates." },
      { id: 'HEATMAP', label: 'HEATMAP', icon: '🔥', desc: "Geospatial opportunity visualization. See where high-value targets cluster in the theater." },
      { id: 'PROMPT_AI', label: 'PROMPT AI', icon: '💬', desc: "Direct neural interface. Execute raw tactical queries against the core AI models." },
      { id: 'MODEL_TEST', label: 'MODEL TEST', icon: '🧪', desc: "Engine benchmark arena. Compare output quality across different AI model versions." },
      { id: 'FACT_CHECK', label: 'FACT CHECK', icon: '✅', desc: "Truth verification node. Cross-reference claims against grounded search data." },
      { id: 'TRANSLATOR', label: 'TRANSLATOR', icon: '🌐', desc: "Linguistic adaptation matrix. Localize payloads for specific cultural theaters." },
    ],
    CREATE: [
      { id: 'VISUAL_STUDIO', label: 'VISUAL STUDIO', icon: '🎨', desc: "High-fidelity image generation. Create bespoke brand assets and visual concepts." },
      { id: 'MOCKUPS_4K', label: '4K MOCKUPS', icon: '🖥️', desc: "Ultra-premium product visualization. Generate photorealistic website or app mockups." },
      { id: 'PRODUCT_SYNTH', label: 'PRODUCT SYNTH', icon: '🧬', desc: "Offer architecture. Design hypothetic high-ticket products and feature sets." },
      { id: 'FLASH_SPARK', label: 'FLASH SPARK', icon: '⚡', desc: "High-velocity content generator. Rapidly produce hooks, captions, and viral ideas." },
      { id: 'MEDIA_VAULT', label: 'MEDIA VAULT', icon: '🔒', desc: "Secure asset reservoir. Manage and export all generated media and intelligence files." },
    ],
    STUDIO: [
      { id: 'VIDEO_PITCH', label: 'VEO FORGE', icon: '📹', desc: "Veo cinematic forge. Generate high-end video intros and mood boards." },
      { id: 'VIDEO_AI', label: 'VIDEO AUDIT', icon: '🎥', desc: "Video content auditor. Analyze target's existing video strategy for weaknesses." },
      { id: 'CINEMA_INTEL', label: 'CINEMA INTEL', icon: '🎬', desc: "Deep video decoding. Extract psychological hooks and metadata from video URLs." },
      { id: 'MOTION_LAB', label: 'MOTION LAB', icon: '🏃', desc: "Dynamic storyboard architect. Plan complex motion sequences and video narratives." },
      { id: 'SONIC_STUDIO', label: 'SONIC STUDIO', icon: '🎵', desc: "Audio synthesis lab. Generate voiceovers and sonic branding elements." },
      { id: 'LIVE_SCRIBE', label: 'LIVE SCRIBE', icon: '✍️', desc: "Real-time combat transcription. Record and analyze sales calls or strategy sessions." },
    ],
    SELL: [
      { id: 'BUSINESS_ORCHESTRATOR', label: 'BUSINESS ORCHESTRATOR', icon: '🎼', desc: "Master strategy builder. Assemble full dossiers combining all intelligence assets." },
      { id: 'PROPOSALS', label: 'PROPOSALS', icon: '📝', desc: "Smart contract architect. Draft high-converting proposals based on target data." },
      { id: 'ROI_CALC', label: 'ROI CALC', icon: '💰', desc: "Financial projection engine. Quantify the exact value of AI transformation for the client." },
      { id: 'SEQUENCER', label: 'SEQUENCER', icon: '⛓️', desc: "Outreach cadence builder. Design multi-channel contact sequences (Email + LinkedIn)." },
      { id: 'DECK_ARCH', label: 'DECK ARCH', icon: '🏗️', desc: "Presentation logic. Structure compelling sales decks and narrative flows." },
      { id: 'DEMO_SANDBOX', label: 'DEMO SANDBOX', icon: '🏖️', desc: "Simulation environment. Model growth scenarios to prove upside to clients." },
      { id: 'DRAFTING', label: 'DRAFTING', icon: '✏️', desc: "Copywriting workbench. Refine specific sales scripts and messaging." },
      { id: 'VOICE_STRAT', label: 'VOICE STRAT', icon: '🗣️', desc: "Real-time sales coach. AI guidance for objection handling and closing." },
      { id: 'AI_CONCIERGE', label: 'AI CONCIERGE', icon: '🤖', desc: "Autonomous agent simulation. Test nurture sequences with a simulated AI receptionist." },
      { id: 'PITCH_GEN', label: 'PITCH GEN', icon: '📢', desc: "Elevator hook generator. Create 30-second power pitches for immediate deployment." },
      { id: 'FUNNEL_MAP', label: 'FUNNEL MAP', icon: '🗺️', desc: "Conversion cartography. Visualize and optimize the client's customer journey." },
    ],
    CONTROL: [
      { id: 'PLAYBOOK', label: 'PLAYBOOK', icon: '📖', desc: "Agency doctrine. Define and refine your core operating procedures and scoring rubrics." },
      { id: 'BILLING', label: 'BILLING', icon: '💳', desc: "Financial oversight. Track API usage costs and project operational expenditure." },
      { id: 'AFFILIATE', label: 'AFFILIATE', icon: '🤝', desc: "Partner matrix. Design and manage referral structures and commission tiers." },
      { id: 'IDENTITY', label: 'IDENTITY', icon: '🏢', desc: "Agency branding core. Define your own niche, voice, and visual identity." },
      { id: 'OS_FORGE', label: 'OS FORGE', icon: '⚒️', desc: "System kernel. Configure low-level prompt injections and operational rules." },
      { id: 'EXPORT_DATA', label: 'EXPORT DATA', icon: '📤', desc: "Data sovereignty. Export full system states and physical source code." },
      { id: 'CALENDAR', label: 'CALENDAR', icon: '📅', desc: "Temporal command. Visualize deployment schedules and follow-up timelines." },
      { id: 'PROD_LOG', label: 'PROD LOG', icon: '📋', desc: "System trace. View raw operational logs and debug system events." },
      { id: 'SETTINGS', label: 'SETTINGS', icon: '⚙️', desc: "Global configuration. Adjust sensitivity, themes, and API connections." },
      { id: 'CIPHER_NODE', label: 'CIPHER NODE', icon: '🔑', desc: "Encryption suite. Manage cryptographic keys for secure data handling." },
      { id: 'NEXUS_GRAPH', label: 'NEXUS GRAPH', icon: '🕸️', desc: "Entity relationship visualizer. See connections between niches and targets." },
      { id: 'CHRONOS', label: 'CHRONOS', icon: '⏳', desc: "Historical timeline. Review past system actions and audit trails." },
      { id: 'TASKS', label: 'TASKS', icon: '✅', desc: "Mission checklist. Track operational to-dos for specific targets." },
      { id: 'THEME', label: 'THEME', icon: '🎨', desc: "Visual interface control. Switch between different OS aesthetic modes." },
      { id: 'TOKENS', label: 'TOKENS', icon: '🎟️', desc: "Credit management. Monitor neural token consumption and quotas." },
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
          {(['OPERATE', 'CREATE', 'STUDIO', 'SELL', 'CONTROL'] as MainMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                activeMode === mode 
                  ? mode === 'STUDIO' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : theme === 'dark' ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode === 'OPERATE' && Icons.Operate}
              {mode === 'CREATE' && Icons.Create}
              {mode === 'STUDIO' && Icons.Studio}
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

          <div className="relative" ref={cityInputRef}>
            <div 
              className={`flex items-center gap-2 border rounded-lg px-4 py-2 hover:border-indigo-500 transition-colors cursor-pointer ${theme === 'dark' ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
              onClick={() => setShowCities(!showCities)}
            >
              <span className="text-[10px]">🌍</span>
              <input 
                type="text"
                value={theater}
                onChange={(e) => setTheater(e.target.value.toUpperCase())}
                className={`bg-transparent text-[10px] font-black uppercase tracking-[0.2em] w-32 focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                placeholder="REGION"
              />
              <span className="text-[8px] text-slate-500">▼</span>
            </div>

            {showCities && (
              <div className={`absolute top-full right-0 mt-2 w-72 rounded-2xl border shadow-2xl max-h-[400px] overflow-y-auto custom-scrollbar z-50 animate-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-[#020617] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`p-3 border-b sticky top-0 backdrop-blur-md z-10 flex justify-between items-center ${theme === 'dark' ? 'border-slate-800/80 bg-[#020617]/90' : 'border-slate-100 bg-white/90'}`}>
                   <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">STRATEGIC TARGETS</span>
                   <span className="text-[8px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">AI RANKED</span>
                </div>
                <div className="p-2 space-y-1">
                   {STRATEGIC_CITIES.map(c => (
                     <button
                       key={c.rank}
                       onClick={() => { setTheater(c.city); setShowCities(false); }}
                       className={`w-full text-left p-3 rounded-xl flex items-center justify-between group transition-all ${theme === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-50'}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border ${
                             c.tier.includes('S') ? 'bg-indigo-600 border-indigo-500 text-white' :
                             c.tier.includes('A') ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500' :
                             'bg-slate-800 border-slate-700 text-slate-500'
                           }`}>
                             {c.tier}
                           </div>
                           <div>
                              <p className={`text-[10px] font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-slate-200 group-hover:text-white' : 'text-slate-800'}`}>{c.city}</p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{c.focus.replace('_', ' ')}</p>
                           </div>
                        </div>
                        <span className="text-[8px] font-black text-slate-700 group-hover:text-indigo-500 transition-colors">#{c.rank}</span>
                     </button>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`${stripBg} border-b px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap z-30 shadow-inner transition-colors duration-300`}>
        {subModules[activeMode]?.map(mod => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all border group relative ${
              activeModule === mod.id 
                ? activeMode === 'STUDIO' ? 'bg-amber-600/20 border-amber-500/50 text-amber-400 shadow-sm' : 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-sm' 
                : theme === 'dark' ? 'border-transparent text-slate-200 hover:text-white hover:bg-slate-800' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <span className={`text-xs transition-opacity group-hover:opacity-100 ${activeModule === mod.id ? 'opacity-100 font-bold' : 'opacity-70'}`}>{mod.icon}</span>
            <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${activeModule === mod.id ? (activeMode === 'STUDIO' ? 'text-amber-400' : 'text-indigo-400') : ''}`}>{mod.label}</span>
            
            {/* TOOLTIP TRIGGER ICON */}
            <Tooltip content={mod.desc} side="bottom" width="w-56">
              <div className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700/50 hover:bg-indigo-500 text-white ml-1">
                <span className="text-[8px] font-serif italic">i</span>
              </div>
            </Tooltip>
          </button>
        ))}
      </div>

      <main className={`flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        {children}
      </main>
    </div>
  );
};
