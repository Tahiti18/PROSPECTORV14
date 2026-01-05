
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainMode, SubModule, Lead, ComputeStats } from './types';
import { Layout } from './components/Layout';
import { LayoutCommandCenter } from './components/LayoutCommandCenter';
import { LayoutZenith } from './components/LayoutZenith';
import { MissionControl } from './components/workspaces/MissionControl';
import { ScoringRubricView } from './components/workspaces/ScoringRubricView';
import { CreateWorkspace } from './components/workspaces/CreateWorkspace';
import { SellWorkspace } from './components/workspaces/SellWorkspace';
import { ControlWorkspace } from './components/workspaces/ControlWorkspace';
import { RadarRecon } from './components/workspaces/RadarRecon';
import { TargetList } from './components/workspaces/TargetList';
import { WarRoom } from './components/workspaces/WarRoom';
import { Pipeline } from './components/workspaces/Pipeline';
import { Heatmap } from './components/workspaces/Heatmap';
import { DeepLogic } from './components/workspaces/DeepLogic';
import { WorkspaceNode } from './components/workspaces/WorkspaceNode';
import { ViralPulse } from './components/workspaces/ViralPulse';
import { VisionLab } from './components/workspaces/VisionLab';
import { ArticleIntel } from './components/workspaces/ArticleIntel';
import { BenchmarkNode } from './components/workspaces/BenchmarkNode';
import { AnalyticsHub } from './components/workspaces/AnalyticsHub';
import { PromptAI } from './components/workspaces/PromptAI';
import { ModelTest } from './components/workspaces/ModelTest';
import { FactCheck } from './components/workspaces/FactCheck';
import { TranslatorNode } from './components/workspaces/TranslatorNode';
import { VisualStudio } from './components/workspaces/VisualStudio';
import { Mockups4K } from './components/workspaces/Mockups4K';
import { ProductSynth } from './components/workspaces/ProductSynth';
import { FlashSpark } from './components/workspaces/FlashSpark';
import { MediaVault } from './components/workspaces/MediaVault';
import { VideoPitch } from './components/workspaces/VideoPitch';
import { VideoAI } from './components/workspaces/VideoAI';
import { CinemaIntel } from './components/workspaces/CinemaIntel';
import { MotionLab } from './components/workspaces/MotionLab';
import { SonicStudio } from './components/workspaces/SonicStudio';
import { LiveScribe } from './components/workspaces/LiveScribe';
import { BusinessOrchestrator } from './components/workspaces/BusinessOrchestrator';
import { BillingNode } from './components/workspaces/BillingNode';
import { AffiliateNode } from './components/workspaces/AffiliateNode';
import { IdentityNode } from './components/workspaces/IdentityNode';
import { OSForge } from './components/workspaces/OSForge';
import { ExportNode } from './components/workspaces/ExportNode';
import { CalendarNode } from './components/workspaces/CalendarNode';
import { ProdLog } from './components/workspaces/ProdLog';
import { SettingsNode } from './components/workspaces/SettingsNode';
import { NexusGraph } from './components/workspaces/NexusGraph';
import { ChronosNode } from './components/workspaces/ChronosNode';
import { TasksNode } from './components/workspaces/TasksNode';
import { ThemeNode } from './components/workspaces/ThemeNode';
import { TokenNode } from './components/workspaces/TokenNode';
import { CommandPalette } from './components/CommandPalette';
import { subscribeToCompute } from './services/computeTracker';
import { IntelNode } from './components/workspaces/IntelNode';
import { AutoCrawl } from './components/workspaces/AutoCrawl';

const STORAGE_KEY_LEADS = 'prospector_os_leads_v1';
const STORAGE_KEY_THEATER = 'prospector_os_theater_v1';
const STORAGE_KEY_LAYOUT = 'prospector_os_layout_pref_v1';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<MainMode>('OPERATE');
  const [activeModule, setActiveModule] = useState<SubModule>('COMMAND');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [theater, setTheater] = useState<string>('LOS ANGELES, USA');
  // FORCE DARK MODE
  const [theme] = useState<'dark'>('dark');
  // DEFAULT LAYOUT IS ZENITH
  const [layoutMode, setLayoutMode] = useState<string>('ZENITH'); 
  const [lockedLeadId, setLockedLeadId] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [compute, setCompute] = useState<ComputeStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydration
  useEffect(() => {
    try {
      const savedLeads = localStorage.getItem(STORAGE_KEY_LEADS);
      const savedTheater = localStorage.getItem(STORAGE_KEY_THEATER);
      const savedLayout = localStorage.getItem(STORAGE_KEY_LAYOUT);
      
      if (savedLeads) setLeads(JSON.parse(savedLeads));
      if (savedTheater) setTheater(savedTheater);
      if (savedLayout) setLayoutMode(savedLayout);
    } catch (e) {
      console.error("Hydration failed", e);
    }
    setIsHydrated(true);

    const unsubscribe = subscribeToCompute(setCompute);
    return () => { unsubscribe(); };
  }, []);

  // Persistence with Quota Protection
  useEffect(() => {
    if (!isHydrated) return;
    
    try {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
      localStorage.setItem(STORAGE_KEY_THEATER, theater);
      localStorage.setItem(STORAGE_KEY_LAYOUT, layoutMode);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn("Local storage full. Attempting to prune old leads...");
        const proneLeads = leads.slice(0, 50);
        setLeads(proneLeads); 
      }
    }
  }, [leads, theater, layoutMode, isHydrated]);

  const lockedLead = useMemo(() => leads.find(l => l.id === lockedLeadId), [leads, lockedLeadId]);
  
  const handleUpdateStatus = (id: string, status: any) => { 
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, outreachStatus: status } : l)); 
  };
  
  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const navigate = (mode: MainMode, mod: SubModule) => { setActiveMode(mode); setActiveModule(mod); };

  // --- GLOBAL ACTIONS ---
  const handleManualSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
      localStorage.setItem(STORAGE_KEY_THEATER, theater);
      alert("SYSTEM STATE SECURED: ALL DATA SAVED TO LOCAL CORE.");
    } catch (e) {
      alert("CRITICAL: STORAGE QUOTA EXCEEDED. UNABLE TO SAVE.");
    }
  };

  const handleExportLeads = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `PROSPECTOR_LEDGER_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportLeads = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setLeads(imported);
          alert(`LEDGER RESTORED: ${imported.length} TARGETS LOADED.`);
        } else {
          alert("INVALID LEDGER FORMAT: ARRAY REQUIRED.");
        }
      } catch (error) {
        alert("IMPORT FAILED: FILE CORRUPT.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset
  };
  
  const renderContent = () => {
    // --- OPERATE ---
    if (activeMode === 'OPERATE') {
      switch (activeModule) {
        case 'COMMAND': return <MissionControl leads={leads} theater={theater} onNavigate={navigate} />;
        case 'RADAR_RECON': return <RadarRecon theater={theater} onLeadsGenerated={(l) => { setLeads(l); navigate('OPERATE', 'TARGET_LIST'); }} />;
        case 'AUTO_CRAWL': return <AutoCrawl theater={theater} onNewLeads={(newL) => setLeads(prev => [...prev, ...newL])} />;
        case 'TARGET_LIST': return <TargetList leads={leads} lockedLeadId={lockedLeadId} onLockLead={setLockedLeadId} onInspect={(id) => { setLockedLeadId(id); navigate('OPERATE', 'WAR_ROOM'); }} />;
        case 'WAR_ROOM': return <WarRoom lead={lockedLead} onUpdateLead={handleUpdateLead} />;
        case 'PIPELINE': return <Pipeline leads={leads} onUpdateStatus={handleUpdateStatus} />;
        case 'HEATMAP': return <Heatmap leads={leads} theater={theater} />;
        case 'DEEP_LOGIC': return <DeepLogic lead={lockedLead} />;
        case 'BENCHMARK': return <BenchmarkNode lead={lockedLead} />;
        case 'PROMPT_AI': return <PromptAI lead={lockedLead} />;
        case 'FACT_CHECK': return <FactCheck lead={lockedLead} />;
        case 'MODEL_TEST': return <ModelTest />;
        case 'VIDEO_AI': return <VideoAI lead={lockedLead} />;
        case 'TRANSLATOR': return <TranslatorNode />;
        case 'VIRAL_PULSE': return <ViralPulse lead={lockedLead} />;
        case 'WORKSPACE': return <WorkspaceNode leads={leads} />;
        case 'ARTICLE_INTEL': return <ArticleIntel lead={lockedLead} />;
        case 'CINEMA_INTEL': return <CinemaIntel lead={lockedLead} />;
        case 'ANALYTICS': case 'ANALYTICS_HUB': return <AnalyticsHub leads={leads} />;
        default: return <IntelNode module={activeModule} lead={lockedLead} />;
      }
    }

    // --- CREATE ---
    if (activeMode === 'CREATE') {
      switch (activeModule) {
        case 'VISUAL_STUDIO': return <VisualStudio leads={leads} lockedLead={lockedLead} />;
        case 'MOCKUPS_4K': return <Mockups4K lead={lockedLead} />;
        case 'PRODUCT_SYNTH': return <ProductSynth lead={lockedLead} />;
        case 'FLASH_SPARK': return <FlashSpark lead={lockedLead} />;
        case 'MEDIA_VAULT': return <MediaVault />;
        default: return <CreateWorkspace activeModule={activeModule} leads={leads} lockedLead={lockedLead} />;
      }
    }

    // --- STUDIO ---
    if (activeMode === 'STUDIO') {
      switch (activeModule) {
        case 'VIDEO_PITCH': return <VideoPitch lead={lockedLead} />;
        case 'VIDEO_AI': return <VideoAI lead={lockedLead} />;
        case 'CINEMA_INTEL': return <CinemaIntel lead={lockedLead} />;
        case 'MOTION_LAB': return <MotionLab lead={lockedLead} />;
        case 'SONIC_STUDIO': return <SonicStudio lead={lockedLead} />;
        case 'LIVE_SCRIBE': return <LiveScribe />;
        default: return <IntelNode module={activeModule} lead={lockedLead} />;
      }
    }

    // --- SELL ---
    if (activeMode === 'SELL') {
      if (activeModule === 'BUSINESS_ORCHESTRATOR') {
        return <BusinessOrchestrator leads={leads} lockedLead={lockedLead} onNavigate={navigate} onLockLead={setLockedLeadId} onUpdateLead={handleUpdateLead} />;
      }
      return <SellWorkspace activeModule={activeModule} leads={leads} lockedLead={lockedLead} />;
    }

    // --- CONTROL ---
    if (activeMode === 'CONTROL') {
      switch (activeModule) {
        case 'PLAYBOOK': return <ScoringRubricView />;
        case 'BILLING': return <BillingNode />;
        case 'AFFILIATE': return <AffiliateNode />;
        case 'IDENTITY': return <IdentityNode />;
        case 'OS_FORGE': return <OSForge />;
        case 'EXPORT_DATA': return <ExportNode leads={leads} />;
        case 'CALENDAR': return <CalendarNode leads={leads} />;
        case 'PROD_LOG': return <ProdLog />;
        case 'SETTINGS': return <SettingsNode />;
        case 'NEXUS_GRAPH': return <NexusGraph leads={leads} />;
        case 'CHRONOS': return <ChronosNode />;
        case 'TASKS': return <TasksNode lead={lockedLead} />;
        case 'THEME': return <ThemeNode />;
        case 'TOKENS': return <TokenNode />;
        default: return <ControlWorkspace activeModule={activeModule} />;
      }
    }

    return null;
  };

  // LAYOUT ROUTER
  const LayoutComponent = 
    layoutMode === 'ZENITH' ? LayoutZenith :
    layoutMode === 'COMMAND' ? LayoutCommandCenter : 
    Layout;

  return (
    <LayoutComponent
      activeMode={activeMode} setActiveMode={setActiveMode}
      activeModule={activeModule} setActiveModule={setActiveModule}
      onSearchClick={() => setIsCommandOpen(true)}
      theater={theater} setTheater={setTheater}
      theme={theme} toggleTheme={() => {}} // No-op, dark forced
      currentLayout={layoutMode}
      setLayoutMode={setLayoutMode}
    >
      {renderContent()}
      
      {/* COMMAND PALETTE */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} onSelect={navigate} theme={theme} />
      
      {/* PERSISTENT FOOTER CONTROLS - ALWAYS VISIBLE */}
      <footer className={`fixed bottom-0 left-0 right-0 backdrop-blur-3xl border-t px-10 py-4 flex justify-between items-center z-[100] shadow-[0_-15px_40px_rgba(0,0,0,0.4)] transition-colors ${theme === 'dark' ? 'bg-[#0b1021]/95 border-slate-800 shadow-black' : 'bg-white/95 border-slate-200 shadow-slate-200'}`}>
          <div className="flex items-center gap-6">
             <button 
               onClick={() => fileInputRef.current?.click()}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
             >
               IMPORT
             </button>
             <button 
               onClick={handleExportLeads}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
             >
               EXPORT
             </button>
             <input type="file" ref={fileInputRef} onChange={handleImportLeads} className="hidden" accept=".json" />
             <div className="w-px h-8 bg-slate-800/50 mx-2"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-60">{leads.length} TARGETS INDEXED</span>
          </div>
          <div className="flex items-center gap-5">
             <button 
               onClick={handleManualSave}
               className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-3 border border-emerald-400/20"
             >
               <span>💾</span> SAVE ALL
             </button>
          </div>
      </footer>
    </LayoutComponent>
  );
};

export default App;
