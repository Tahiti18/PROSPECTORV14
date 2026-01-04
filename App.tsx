
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainMode, SubModule, Lead, ComputeStats, OutreachStatus } from './types';
import { Layout } from './components/Layout';
import { MissionControl } from './components/workspaces/MissionControl';
import { ScoringRubricView } from './components/workspaces/ScoringRubricView';
import { CreateWorkspace } from './components/workspaces/CreateWorkspace';
import { SellWorkspace } from './components/workspaces/SellWorkspace';
import { ControlWorkspace } from './components/workspaces/ControlWorkspace';
import { RadarRecon } from './components/workspaces/RadarRecon';
import { TargetList } from './components/workspaces/TargetList';
import { WarRoom } from './components/workspaces/WarRoom'; // Corrected path
import { CommandPalette } from './components/CommandPalette';
import { SonicStudio } from './components/workspaces/SonicStudio';
import { VisionLab } from './components/workspaces/VisionLab';
import { IntelNode } from './components/workspaces/IntelNode';
import { AutoCrawl } from './components/workspaces/AutoCrawl';
import { AnalyticsHub } from './components/workspaces/AnalyticsHub';
import { DeepLogic } from './components/workspaces/DeepLogic';
import { Pipeline } from './components/workspaces/Pipeline';
import { Heatmap } from './components/workspaces/Heatmap';
import { Sequencer } from './components/workspaces/Sequencer';
import { VideoPitch } from './components/workspaces/VideoPitch';
import { Mockups4K } from './components/workspaces/Mockups4K';
import { BenchmarkNode } from './components/workspaces/BenchmarkNode';
import { VoiceStrat } from './components/workspaces/VoiceStrat';
import { ProposalDrafting } from './components/workspaces/ProposalDrafting';
import { PromptAI } from './components/workspaces/PromptAI';
import { FactCheck } from './components/workspaces/FactCheck';
import { ProductSynth } from './components/workspaces/ProductSynth';
import { PitchGen } from './components/workspaces/PitchGen';
import { FunnelMap } from './components/workspaces/FunnelMap';
import { IdentityNode } from './components/workspaces/IdentityNode';
import { ModelTest } from './components/workspaces/ModelTest';
import { MotionLab } from './components/workspaces/MotionLab';
import { FlashSpark } from './components/workspaces/FlashSpark';
import { DeckArch } from './components/workspaces/DeckArch';
import { DemoSandbox } from './components/workspaces/DemoSandbox';
import { OSForge } from './components/workspaces/OSForge';
import { VideoAI } from './components/workspaces/VideoAI';
import { TranslatorNode } from './components/workspaces/TranslatorNode';
import { MediaVault } from './components/workspaces/MediaVault';
import { LiveScribe } from './components/workspaces/LiveScribe';
import { AIConcierge } from './components/workspaces/AIConcierge';
import { BillingNode } from './components/workspaces/BillingNode';
import { AffiliateNode } from './components/workspaces/AffiliateNode';
import { SettingsNode } from './components/workspaces/SettingsNode';
import { CipherNode } from './components/workspaces/CipherNode';
import { NexusGraph } from './components/workspaces/NexusGraph';
import { ChronosNode } from './components/workspaces/ChronosNode';
import { TasksNode } from './components/workspaces/TasksNode';
import { ViralPulse } from './components/workspaces/ViralPulse';
import { WorkspaceNode } from './components/workspaces/WorkspaceNode';
import { ExportNode } from './components/workspaces/ExportNode';
import { CalendarNode } from './components/workspaces/CalendarNode';
import { ProdLog } from './components/workspaces/ProdLog';
import { ThemeNode } from './components/workspaces/ThemeNode';
import { TokenNode } from './components/workspaces/TokenNode';
import { ArticleIntel } from './components/workspaces/ArticleIntel';
import { CinemaIntel } from './components/workspaces/CinemaIntel';
import { ROICalc } from './components/workspaces/ROICalc';
import { VisualStudio } from './components/workspaces/VisualStudio';
import { BusinessOrchestrator } from './components/workspaces/BusinessOrchestrator';
import { subscribeToCompute } from './services/computeTracker';

const STORAGE_KEY_LEADS = 'pomelli_os_leads_v14_final';
const STORAGE_KEY_THEATER = 'pomelli_os_theater_v14_final';
const STORAGE_KEY_THEME = 'pomelli_os_theme_v1';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<MainMode>('OPERATE');
  const [activeModule, setActiveModule] = useState<SubModule>('COMMAND');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [theater, setTheater] = useState<string>(() => localStorage.getItem(STORAGE_KEY_THEATER) || 'DUBAI');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem(STORAGE_KEY_THEME) as 'dark' | 'light') || 'dark');
  const [lockedLeadId, setLockedLeadId] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [compute, setCompute] = useState<ComputeStats | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    const savedLeads = localStorage.getItem(STORAGE_KEY_LEADS);
    const savedTheater = localStorage.getItem(STORAGE_KEY_THEATER);
    
    if (savedLeads) { 
      try { 
        const parsed = JSON.parse(savedLeads);
        if (Array.isArray(parsed)) setLeads(parsed);
      } catch (e) {
        console.error("Ledger Corruption Detected:", e);
      } 
    }
    if (savedTheater) setTheater(savedTheater);
    setIsHydrated(true);

    const unsubscribe = subscribeToCompute(setCompute);

    // Safe Resume Logic
    if (!didInitRef.current) {
      didInitRef.current = true;
      import('./services/automation/orchestrator').then(({ AutomationOrchestrator }) => {
        AutomationOrchestrator.getInstance().resumeInterruptedRuns();
      });
    }

    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY_THEATER, theater);
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
  }, [leads, theater, isHydrated]);

  const lockedLead = useMemo(() => leads.find(l => l.id === lockedLeadId), [leads, lockedLeadId]);
  
  // CRM FIX: Sync both status and outreachStatus
  const handleUpdateStatus = (id: string, status: OutreachStatus) => { 
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, outreachStatus: status } : l)); 
  };

  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const navigate = (mode: MainMode, mod: SubModule) => { setActiveMode(mode); setActiveModule(mod); };
  
  const manualSave = () => { 
    setSaveStatus('saving');
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 500);
  };

  const exportLeads = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `POMELLI_LEDGER_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const renderContent = () => {
    if (activeMode === 'OPERATE') {
      switch (activeModule) {
        case 'COMMAND': return <MissionControl leads={leads} theater={theater} onNavigate={navigate} />;
        case 'RADAR_RECON': return <RadarRecon theater={theater} onLeadsGenerated={(newLeads) => { setLeads(prev => [...prev, ...newLeads]); navigate('OPERATE', 'TARGET_LIST'); }} />;
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
        case 'TRANSLATOR': return <TranslatorNode />;
        case 'VIRAL_PULSE': return <ViralPulse lead={lockedLead} />;
        case 'WORKSPACE': return <WorkspaceNode leads={leads} />;
        case 'ARTICLE_INTEL': return <ArticleIntel lead={lockedLead} />;
        case 'ANALYTICS': return <AnalyticsHub leads={leads} />;
        default: return <IntelNode module={activeModule} lead={lockedLead} />;
      }
    }
    if (activeMode === 'CREATE') {
      switch (activeModule) {
        case 'VISION_LAB': return <VisionLab lead={lockedLead} />;
        case 'MOCKUPS_4K': return <Mockups4K lead={lockedLead} />;
        case 'PRODUCT_SYNTH': return <ProductSynth lead={lockedLead} />;
        case 'FLASH_SPARK': return <FlashSpark lead={lockedLead} />;
        case 'MEDIA_VAULT': return <MediaVault />;
        case 'VISUAL_STUDIO': return <VisualStudio leads={leads} lockedLead={lockedLead} />;
        default: return <CreateWorkspace activeModule={activeModule} leads={leads} lockedLead={lockedLead} />;
      }
    }
    if (activeMode === 'STUDIO') {
      switch (activeModule) {
        case 'VIDEO_PITCH': return <VideoPitch lead={lockedLead} />;
        case 'VIDEO_AI': return <VideoAI lead={lockedLead} />;
        case 'CINEMA_INTEL': return <CinemaIntel lead={lockedLead} />;
        case 'MOTION_LAB': return <MotionLab lead={lockedLead} />;
        case 'SONIC_STUDIO': return <SonicStudio lead={lockedLead} />;
        case 'LIVE_SCRIBE': return <LiveScribe />;
        default: return <CreateWorkspace activeModule={activeModule} leads={leads} lockedLead={lockedLead} />;
      }
    }
    if (activeMode === 'SELL') {
      switch (activeModule) {
        case 'BUSINESS_ORCHESTRATOR': return <BusinessOrchestrator leads={leads} lockedLead={lockedLead} onNavigate={navigate} onLockLead={setLockedLeadId} onUpdateLead={handleUpdateLead} />;
        case 'PROPOSALS': return <SellWorkspace activeModule={activeModule} leads={leads} lockedLead={lockedLead} />;
        case 'SEQUENCER': return <Sequencer lead={lockedLead} />;
        case 'VOICE_STRAT': return <VoiceStrat lead={lockedLead} />;
        case 'DRAFTING': return <ProposalDrafting lead={lockedLead} />;
        case 'PITCH_GEN': return <PitchGen lead={lockedLead} />;
        case 'FUNNEL_MAP': return <FunnelMap lead={lockedLead} />;
        case 'AI_CONCIERGE': return <AIConcierge lead={lockedLead} />;
        case 'ROI_CALC': return <ROICalc leads={leads} />;
        case 'DECK_ARCH': return <DeckArch lead={lockedLead} />;
        case 'DEMO_SANDBOX': return <DemoSandbox lead={lockedLead} />;
        default: return <IntelNode module={activeModule} lead={lockedLead} />;
      }
    }
    if (activeMode === 'CONTROL') {
      switch (activeModule) {
        case 'PLAYBOOK': return <ScoringRubricView />;
        case 'IDENTITY': return <IdentityNode />;
        case 'OS_FORGE': return <OSForge />;
        case 'BILLING': return <BillingNode />;
        case 'AFFILIATE': return <AffiliateNode />;
        case 'SETTINGS': return <SettingsNode />;
        case 'CIPHER_NODE': return <CipherNode />;
        case 'NEXUS_GRAPH': return <NexusGraph leads={leads} />;
        case 'CHRONOS': return <ChronosNode />;
        case 'TASKS': return <TasksNode lead={lockedLead} />;
        case 'EXPORT_DATA': return <ExportNode leads={leads} />;
        case 'CALENDAR': return <CalendarNode leads={leads} />;
        case 'PROD_LOG': return <ProdLog />;
        case 'THEME': return <ThemeNode />;
        case 'TOKENS': return <TokenNode />;
        default: return <ControlWorkspace activeModule={activeModule} />;
      }
    }
    return <MissionControl leads={leads} theater={theater} onNavigate={navigate} />;
  };

  return (
    <div className={`min-h-screen font-['Inter'] flex flex-col relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617] text-slate-300' : 'bg-slate-50 text-slate-900'}`}>
      <Layout 
        activeMode={activeMode} setActiveMode={setActiveMode}
        activeModule={activeModule} setActiveModule={setActiveModule}
        onSearchClick={() => setIsCommandOpen(true)}
        theater={theater} setTheater={setTheater}
        theme={theme} toggleTheme={toggleTheme}
      >
        <div className="max-w-[1450px] mx-auto p-4 md:p-8 animate-in fade-in duration-700 pb-32">
          {renderContent()}
        </div>
      </Layout>
      
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} onSelect={navigate} theme={theme} />
      
      <input type="file" ref={fileInputRef} onChange={(e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { 
          try { 
            const data = JSON.parse(ev.target?.result as string);
            if (Array.isArray(data)) {
               setLeads(prev => {
                 const existingIds = new Set(prev.map(p => p.id));
                 const uniqueNewLeads = data.filter((d: any) => !existingIds.has(d.id));
                 return [...prev, ...uniqueNewLeads];
               });
               alert(`SUCCESS: IMPORTED TARGETS MERGED INTO LEDGER.`);
            } else {
               alert("IMPORT ERROR: FILE MUST BE A VALID JSON ARRAY.");
            }
          } catch (err) { alert("IMPORT FAILED: INVALID JSON FORMAT."); } 
        };
        reader.readAsText(file);
      }} className="hidden" />
      
      <footer className={`fixed bottom-0 left-0 right-0 backdrop-blur-3xl border-t px-10 py-5 flex justify-between items-center z-[100] shadow-[0_-15px_40px_rgba(0,0,0,0.4)] transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b1021]/90 border-slate-800 shadow-black' : 'bg-white/90 border-slate-200 shadow-slate-200'}`}>
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${leads.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></div>
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{leads.length} TARGETS INDEXED</span>
          </div>
          <div className={`h-6 w-px hidden md:block ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          <span className={`hidden lg:inline text-[8px] font-bold uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>ENCRYPTION_LAYER: AES-256_ACTIVE</span>
        </div>

        <div className="flex items-center gap-5">
          <button 
            onClick={triggerImport}
            className={`px-7 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
          >
            <span className="text-sm">📥</span> IMPORT
          </button>
          
          <button 
            onClick={exportLeads}
            disabled={leads.length === 0}
            className={`px-7 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
          >
            <span className="text-sm">📤</span> EXPORT
          </button>

          <button 
            onClick={manualSave} 
            className={`px-12 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.2)] ${
              saveStatus === 'saved' 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-indigo-600 border-indigo-400/20 text-white hover:bg-indigo-500 active:scale-95'
            }`}
          >
            {saveStatus === 'idle' && <><span className="text-sm">💾</span> SAVE LEDGER</>}
            {saveStatus === 'saving' && <><span className="animate-spin text-sm">🔄</span> SAVING...</>}
            {saveStatus === 'saved' && <><span className="text-sm">✓</span> SAVED</>}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
