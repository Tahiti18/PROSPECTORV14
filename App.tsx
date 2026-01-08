
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
import { BrandDNA } from './components/workspaces/BrandDNA';
import { SmokeTest } from './components/SmokeTest';
import { ToastContainer } from './components/ToastContainer';
import { db } from './services/automation/db';
import { SESSION_ASSETS, importVault } from './services/geminiService';
import { toast } from './services/toastManager';

const STORAGE_KEY_LEADS = 'prospector_os_leads_v14_final';
const STORAGE_KEY_THEATER = 'prospector_os_theater_v1';
const STORAGE_KEY_LAYOUT = 'prospector_os_layout_pref_v1';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<MainMode>('OPERATE');
  const [activeModule, setActiveModule] = useState<SubModule>('COMMAND');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [theater, setTheater] = useState<string>('LOS ANGELES, USA');
  const [theme] = useState<'dark'>('dark');
  const [layoutMode, setLayoutMode] = useState<string>('ZENITH'); 
  const [lockedLeadId, setLockedLeadId] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [compute, setCompute] = useState<ComputeStats | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- SMOKE TEST INTERCEPT ---
  if (typeof window !== 'undefined' && window.location.pathname === '/__smoketest_phase1') {
    return <SmokeTest />;
  }

  // Hydration & Subscription
  useEffect(() => {
    try {
      const savedLeads = db.getLeads();
      const savedTheater = localStorage.getItem(STORAGE_KEY_THEATER);
      const savedLayout = localStorage.getItem(STORAGE_KEY_LAYOUT);
      
      if (savedLeads.length > 0) setLeads(savedLeads);
      if (savedTheater) setTheater(savedTheater);
      if (savedLayout) setLayoutMode(savedLayout);
    } catch (e) {
      console.error("Hydration failed", e);
    }
    setIsHydrated(true);

    const unsubCompute = subscribeToCompute((s) => setCompute(s));
    
    // Subscribe to DB updates (Replaces polling)
    const unsubDb = db.subscribe((newLeads) => {
        setLeads(newLeads);
    });

    return () => { 
        unsubCompute(); 
        unsubDb();
    };
  }, []);

  // Persistence (Settings Only - Leads handled by DB service)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_THEATER, theater);
      localStorage.setItem(STORAGE_KEY_LAYOUT, layoutMode);
    } catch (e: any) {
      console.error("Settings save failed", e);
    }
  }, [theater, layoutMode, isHydrated]);

  const lockedLead = useMemo(() => leads.find(l => l.id === lockedLeadId), [leads, lockedLeadId]);
  
  const handleUpdateStatus = (id: string, status: any) => { 
    const currentLeads = db.getLeads();
    const updated = currentLeads.map(l => l.id === id ? { ...l, status, outreachStatus: status } : l);
    db.saveLeads(updated); 
  };
  
  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    const currentLeads = db.getLeads();
    const updated = currentLeads.map(l => l.id === id ? { ...l, ...updates } : l);
    db.saveLeads(updated);
  };

  const navigate = (mode: MainMode, mod: SubModule) => { setActiveMode(mode); setActiveModule(mod); };

  // --- FOOTER ACTIONS ---
  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);
        let count = 0;
        
        // Support multiple formats: Full Backup or Ledger Export
        if (Array.isArray(data)) {
            // Raw Ledger array
            db.saveLeads(data);
            count = data.length;
        } else {
            // System Backup Object
            if (data.leads && Array.isArray(data.leads)) {
                db.saveLeads(data.leads);
                count = data.leads.length;
            }
            if (data.assets && Array.isArray(data.assets)) {
                importVault(data.assets);
            }
            if (data.settings?.theater) {
                setTheater(data.settings.theater);
            }
        }
        
        toast.success(`SYSTEM RESTORED: ${count} LEADS LOADED`);
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        console.error(err);
        toast.error("IMPORT FAILED: INVALID OR CORRUPT FILE");
      }
    };
    reader.readAsText(file);
    // Reset
    e.target.value = '';
  };

  const handleExport = () => {
    const data = db.getLeads();
    downloadJson(data, "PROSPECTOR_LEDGER");
    toast.success("LEAD DATABASE EXPORTED");
  };

  const handleSaveAll = () => {
    const fullBackup = {
        meta: {
            version: "14.2.0",
            timestamp: Date.now(),
            user: "ADMIN"
        },
        settings: {
            theater,
            layoutMode
        },
        leads: db.getLeads(),
        assets: SESSION_ASSETS,
        automation: db.listRuns() // Include automation history
    };
    
    downloadJson(fullBackup, "PROSPECTOR_SYSTEM_BACKUP");
    toast.success("FULL SYSTEM SNAPSHOT SAVED");
  };

  const renderContent = () => {
    // --- OPERATE ---
    if (activeMode === 'OPERATE') {
      switch (activeModule) {
        case 'COMMAND': return <MissionControl leads={leads} theater={theater} onNavigate={navigate} />;
        case 'RADAR_RECON': return <RadarRecon theater={theater} onLeadsGenerated={(l) => { db.saveLeads(l); navigate('OPERATE', 'TARGET_LIST'); }} />;
        case 'AUTO_CRAWL': return <AutoCrawl theater={theater} onNewLeads={(newL) => { /* handled by db inside autocrawl */ }} />;
        case 'TARGET_LIST': return <TargetList leads={leads} lockedLeadId={lockedLeadId} onLockLead={setLockedLeadId} onInspect={(id) => { setLockedLeadId(id); navigate('OPERATE', 'WAR_ROOM'); }} />;
        case 'WAR_ROOM': return <WarRoom lead={lockedLead} onUpdateLead={handleUpdateLead} onNavigate={navigate} />;
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
        case 'BRAND_DNA': return <BrandDNA lead={lockedLead} onUpdateLead={handleUpdateLead} />;
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
    <>
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
        
        {/* PERSISTENT FOOTER - NOW INTERACTIVE */}
        <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-3xl border-t border-slate-800/80 px-8 py-3 flex justify-between items-center z-[100] bg-[#020617]/90 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-2xl">
            
            {/* LEFT: DATA I/O */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                >
                    <span className="text-emerald-500 group-hover:text-emerald-400">⬆</span> IMPORT
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                
                <div className="w-px h-4 bg-slate-800"></div>
                
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                >
                    <span className="text-indigo-500 group-hover:text-indigo-400">⬇</span> EXPORT
                </button>
            </div>

            {/* CENTER: SYSTEM STATUS */}
            <div className="flex gap-6 opacity-50 select-none">
                <span>SYSTEM: ONLINE</span>
                <span className="hidden md:inline">V14.2.0 (STABLE)</span>
                <span className="hidden md:inline">LATENCY: 12ms</span>
            </div>

            {/* RIGHT: SAVE ALL */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleSaveAll}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                    <span>💾</span> SAVE ALL
                </button>
            </div>
        </footer>
      </LayoutComponent>
      
      <ToastContainer />
    </>
  );
};

export default App;
