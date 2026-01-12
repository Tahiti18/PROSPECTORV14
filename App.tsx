
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './services/automation/db';
import { MainMode, SubModule, Lead, WorkspaceType } from './types';
import { Layout } from './components/Layout';
import { LayoutCommandCenter } from './components/LayoutCommandCenter';
import { LayoutZenith } from './components/LayoutZenith';
import { CommandPalette } from './components/CommandPalette';
import { SecurityGateway } from './components/SecurityGateway';
import { ToastContainer } from './components/ToastContainer';
import { getStoredKeys } from './services/geminiService';

// Workspaces
import { MissionControl } from './components/workspaces/MissionControl';
import { MarketDiscovery } from './components/workspaces/MarketDiscovery';
import { StrategyCenter } from './components/workspaces/StrategyCenter';
import { VisualStudio } from './components/workspaces/VisualStudio';
import { CampaignOrchestrator } from './components/workspaces/CampaignOrchestrator';
import { IdentityNode } from './components/workspaces/IdentityNode';
import { ScoringRubricView } from './components/workspaces/ScoringRubricView';
import { Pipeline } from './components/workspaces/Pipeline';
import { UserGuide } from './components/workspaces/UserGuide';
import { TransformationBlueprint } from './components/workspaces/TransformationBlueprint';
import { AutoCrawl } from './components/workspaces/AutoCrawl';
import { ProspectDatabase } from './components/workspaces/ProspectDatabase';
import { StrategicReasoning } from './components/workspaces/StrategicReasoning';
import { WorkspaceNode } from './components/workspaces/WorkspaceNode';
import { MarketTrends } from './components/workspaces/MarketTrends';
import { VisualAnalysis } from './components/workspaces/VisualAnalysis';
import { VideoInsights } from './components/workspaces/VideoInsights';
import { ContentAnalysis } from './components/workspaces/ContentAnalysis';
import { BenchmarkNode } from './components/workspaces/BenchmarkNode';
import { AnalyticsHub } from './components/workspaces/AnalyticsHub';
import { Heatmap } from './components/workspaces/Heatmap';
import { PromptInterface } from './components/workspaces/PromptInterface';
import { ModelBench } from './components/workspaces/ModelBench';
import { FactCheck } from './components/workspaces/FactCheck';
import { TranslatorNode } from './components/workspaces/TranslatorNode';
import { VideoProduction } from './components/workspaces/VideoProduction';
import { VideoAudit } from './components/workspaces/VideoAudit';
import { MotionLab } from './components/workspaces/MotionLab';
import { SonicStudio } from './components/workspaces/SonicStudio';
import { ProductSynthesis } from './components/workspaces/ProductSynthesis';
import { ContentIdeation } from './components/workspaces/ContentIdeation';
import { AssetLibrary } from './components/workspaces/AssetLibrary';
import { BrandDNA } from './components/workspaces/BrandDNA';
import { ROICalc } from './components/workspaces/ROICalc';
import { Sequencer } from './components/workspaces/Sequencer';
import { DeckArch } from './components/workspaces/DeckArch';
import { DemoSandbox } from './components/workspaces/DemoSandbox';
import { ProposalDrafting } from './components/workspaces/ProposalDrafting';
import { VoiceStrat } from './components/workspaces/VoiceStrat';
import { LiveScribe } from './components/workspaces/LiveScribe';
import { AIConcierge } from './components/workspaces/AIConcierge';
import { PitchGen } from './components/workspaces/PitchGen';
import { FunnelMap } from './components/workspaces/FunnelMap';
import { ActivityLogs } from './components/workspaces/ActivityLogs';
import { TimelineNode } from './components/workspaces/TimelineNode';
import { TasksNode } from './components/workspaces/TasksNode';
import { ThemeNode } from './components/workspaces/ThemeNode';
import { UsageStats } from './components/workspaces/UsageStats';
import { BillingNode } from './components/workspaces/BillingNode';
import { AffiliateNode } from './components/workspaces/AffiliateNode';
import { SettingsNode } from './components/workspaces/SettingsNode';
import { ExportNode } from './components/workspaces/ExportNode';
import { CalendarNode } from './components/workspaces/CalendarNode';
import { NexusGraph } from './components/workspaces/NexusGraph';
import { TokenNode } from './components/workspaces/TokenNode';
import { SystemConfig } from './components/workspaces/SystemConfig';
import { ProdLog } from './components/workspaces/ProdLog';
import { ModelTest } from './components/workspaces/ModelTest';
import { ExecutiveDashboard } from './components/workspaces/ExecutiveDashboard';

// Fix: Define STORAGE_KEY_REGION
const STORAGE_KEY_REGION = 'pomelli_theater_v1';

const App: React.FC = () => {
  // Fix: Define all missing states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [region, setRegion] = useState('CYPRUS');
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeMode, setActiveMode] = useState<MainMode>('RESEARCH');
  const [activeModule, setActiveModule] = useState<SubModule>('EXECUTIVE_DASHBOARD');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isArmed, setIsArmed] = useState(() => {
    const keys = getStoredKeys();
    return !!keys.openRouter;
  });
  const [layoutMode, setLayoutMode] = useState<string>(() => localStorage.getItem('pomelli_layout_v14') || 'COMMAND');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lockedLeadId, setLockedLeadId] = useState<string | null>(null);

  const lockedLead = useMemo(() => leads.find(l => l.id === lockedLeadId), [leads, lockedLeadId]);

  useEffect(() => {
    try {
      // Fix: db is now imported correctly
      const savedLeads = db.getLeads();
      const savedRegion = localStorage.getItem(STORAGE_KEY_REGION);
      // Fix: setLeads, setRegion, setIsHydrated are now defined
      if (savedLeads.length > 0) setLeads(savedLeads);
      if (savedRegion) setRegion(savedRegion);
    } catch (e) { console.error("Hydration failed", e); }
    setIsHydrated(true);

    const unsubDb = db.subscribe((newLeads) => { setLeads([...newLeads]); });
    return () => { 
      unsubDb(); 
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REGION, region);
  }, [region]);

  useEffect(() => {
    localStorage.setItem('pomelli_layout_v14', layoutMode);
  }, [layoutMode]);

  const handleSelectLead = (id: string) => {
    setLockedLeadId(id);
    setActiveMode('RESEARCH');
    setActiveModule('STRATEGY_CENTER');
  };

  const handleNavigate = (mode: MainMode, mod: SubModule) => {
    setActiveMode(mode);
    setActiveModule(mod);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'EXECUTIVE_DASHBOARD': return <ExecutiveDashboard leads={leads} market={region} onNavigate={handleNavigate} />;
      case 'MARKET_DISCOVERY': return <MarketDiscovery market={region} onLeadsGenerated={(l) => setLeads([...leads, ...l])} />;
      case 'STRATEGY_CENTER': return <StrategyCenter lead={lockedLead} onUpdateLead={(id, updates) => db.saveLeads(leads.map(l => l.id === id ? { ...l, ...updates } : l))} onNavigate={handleNavigate} />;
      case 'VISUAL_STUDIO': return <VisualStudio leads={leads} lockedLead={lockedLead} />;
      case 'CAMPAIGN_ORCHESTRATOR': return <CampaignOrchestrator leads={leads} lockedLead={lockedLead} onNavigate={handleNavigate} onLockLead={setLockedLeadId} onUpdateLead={(id, updates) => db.saveLeads(leads.map(l => l.id === id ? { ...l, ...updates } : l))} />;
      case 'IDENTITY': return <IdentityNode />;
      case 'PROSPECT_DATABASE': return <ProspectDatabase leads={leads} lockedLeadId={lockedLeadId} onLockLead={setLockedLeadId} onInspect={handleSelectLead} />;
      case 'PIPELINE': return <Pipeline leads={leads} onUpdateStatus={(id, s) => db.saveLeads(leads.map(l => l.id === id ? { ...l, outreachStatus: s, status: s } : l))} />;
      case 'ANALYTICS_HUB': return <AnalyticsHub leads={leads} />;
      case 'MARKET_TRENDS': return <MarketTrends lead={lockedLead} />;
      case 'VISUAL_ANALYSIS': return <VisualAnalysis lead={lockedLead} />;
      case 'VIDEO_INSIGHTS': return <VideoInsights lead={lockedLead} />;
      case 'CONTENT_ANALYSIS': return <ContentAnalysis lead={lockedLead} />;
      case 'BENCHMARK': return <BenchmarkNode lead={lockedLead} />;
      case 'STRATEGIC_REASONING': return <StrategicReasoning lead={lockedLead} />;
      case 'WORKSPACE': return <WorkspaceNode leads={leads} />;
      case 'USER_GUIDE': return <UserGuide onNavigate={handleNavigate} />;
      case 'TRANSFORMATION_BLUEPRINT': return <TransformationBlueprint onNavigate={handleNavigate} />;
      case 'AUTOMATED_SEARCH': return <AutoCrawl theater={region} onNewLeads={(nl) => setLeads([...leads, ...nl])} />;
      case 'MODEL_BENCH': return <ModelBench />;
      case 'FACT_CHECK': return <FactCheck lead={lockedLead} />;
      case 'TRANSLATOR': return <TranslatorNode />;
      case 'VIDEO_PRODUCTION': return <VideoProduction lead={lockedLead} />;
      case 'VIDEO_AUDIT': return <VideoAudit lead={lockedLead} />;
      case 'MOTION_LAB': return <MotionLab lead={lockedLead} />;
      case 'SONIC_STUDIO': return <SonicStudio lead={lockedLead} />;
      case 'PRODUCT_SYNTHESIS': return <ProductSynthesis lead={lockedLead} />;
      case 'CONTENT_IDEATION': return <ContentIdeation lead={lockedLead} />;
      case 'ASSET_LIBRARY': return <AssetLibrary />;
      case 'ROI_CALCULATOR': return <ROICalc leads={leads} />;
      case 'SEQUENCER': return <Sequencer lead={lockedLead} />;
      case 'PRESENTATION_BUILDER': return <DeckArch lead={lockedLead} />;
      case 'DEMO_SANDBOX': return <DemoSandbox lead={lockedLead} />;
      case 'DRAFTING': return <ProposalDrafting lead={lockedLead} />;
      case 'SALES_COACH': return <VoiceStrat lead={lockedLead} />;
      case 'MEETING_NOTES': return <LiveScribe />;
      case 'AI_CONCIERGE': return <AIConcierge lead={lockedLead} />;
      case 'ELEVATOR_PITCH': return <PitchGen lead={lockedLead} />;
      case 'FUNNEL_MAP': return <FunnelMap lead={lockedLead} />;
      case 'AGENCY_PLAYBOOK': return <ScoringRubricView />;
      case 'BILLING': return <BillingNode />;
      case 'AFFILIATE': return <AffiliateNode />;
      case 'SETTINGS': return <SettingsNode />;
      case 'SYSTEM_CONFIG': return <SystemConfig />;
      case 'EXPORT_DATA': return <ExportNode leads={leads} />;
      case 'CALENDAR': return <CalendarNode leads={leads} />;
      case 'ACTIVITY_LOGS': return <ActivityLogs />;
      case 'TIMELINE': return <TimelineNode />;
      case 'TASK_MANAGER': return <TasksNode lead={lockedLead} />;
      case 'THEME': return <ThemeNode />;
      case 'USAGE_STATS': return <UsageStats />;
      case 'NEXUS_GRAPH': return <NexusGraph leads={leads} />;
      default: return <ExecutiveDashboard leads={leads} market={region} onNavigate={handleNavigate} />;
    }
  };

  if (!isArmed) return <SecurityGateway onArmed={() => setIsArmed(true)} />;
  if (!isHydrated) return null;

  const layoutProps = {
    activeMode, setActiveMode, activeModule, setActiveModule,
    onSearchClick: () => setIsCommandPaletteOpen(true),
    theater: region, setTheater: setRegion,
    theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
    currentLayout: layoutMode, setLayoutMode,
    children: renderModule()
  };

  return (
    <div className={theme}>
      {layoutMode === 'ZENITH' ? <LayoutZenith {...layoutProps} /> :
       layoutMode === 'COMMAND' ? <LayoutCommandCenter {...layoutProps} /> :
       <Layout {...layoutProps} />}
      
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onSelect={handleNavigate}
        theme={theme}
      />
      <ToastContainer />
    </div>
  );
};

export default App;
