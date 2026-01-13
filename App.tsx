
import React, { useState, useEffect, useMemo } from 'react';
import { MainMode, SubModule, Lead } from './types';
import { LayoutZenith } from './components/LayoutZenith';
import { ExecutiveDashboard } from './components/workspaces/ExecutiveDashboard';
import { MarketDiscovery } from './components/workspaces/MarketDiscovery';
import { ProspectDatabase } from './components/workspaces/ProspectDatabase';
import { StrategyCenter } from './components/workspaces/StrategyCenter';
import { Pipeline } from './components/workspaces/Pipeline';
import { Heatmap } from './components/workspaces/Heatmap';
import { StrategicReasoning } from './components/workspaces/StrategicReasoning';
import { WorkspaceNode } from './components/workspaces/WorkspaceNode';
import { MarketTrends } from './components/workspaces/MarketTrends';
import { VisualAnalysis } from './components/workspaces/VisualAnalysis';
import { ContentAnalysis } from './components/workspaces/ContentAnalysis';
import { BenchmarkNode } from './components/workspaces/BenchmarkNode';
import { AnalyticsHub } from './components/workspaces/AnalyticsHub';
import { PromptInterface } from './components/workspaces/PromptInterface';
import { ModelBench } from './components/workspaces/ModelBench';
import { FactCheck } from './components/workspaces/FactCheck';
import { TranslatorNode } from './components/workspaces/TranslatorNode';
import { VisualStudio } from './components/workspaces/VisualStudio';
import { Mockups4K } from './components/workspaces/Mockups4K';
import { ProductSynthesis } from './components/workspaces/ProductSynthesis';
import { ContentIdeation } from './components/workspaces/ContentIdeation';
import { AssetLibrary } from './components/workspaces/AssetLibrary';
import { VideoProduction } from './components/workspaces/VideoProduction';
import { VideoAudit } from './components/workspaces/VideoAudit';
import { VideoInsights } from './components/workspaces/VideoInsights';
import { MotionLab } from './components/workspaces/MotionLab';
import { SonicStudio } from './components/workspaces/SonicStudio';
import { MeetingNotes } from './components/workspaces/MeetingNotes';
import { CampaignOrchestrator } from './components/workspaces/CampaignOrchestrator';
import { SellWorkspace } from './components/workspaces/SellWorkspace';
import { IdentityNode } from './components/workspaces/IdentityNode';
import { SystemConfig } from './components/workspaces/SystemConfig';
import { ExportNode } from './components/workspaces/ExportNode';
import { CalendarNode } from './components/workspaces/CalendarNode';
import { ActivityLogs } from './components/workspaces/ActivityLogs';
import { SettingsNode } from './components/workspaces/SettingsNode';
import { NexusGraph } from './components/workspaces/NexusGraph';
import { TimelineNode } from './components/workspaces/TimelineNode';
import { TaskManager } from './components/workspaces/TaskManager';
import { ThemeNode } from './components/workspaces/ThemeNode';
import { UsageStats } from './components/workspaces/UsageStats';
import { CommandPalette } from './components/CommandPalette';
import { IntelNode } from './components/workspaces/IntelNode';
import { AutomatedSearch } from './components/workspaces/AutomatedSearch';
import { BrandDNA } from './components/workspaces/BrandDNA';
import { ToastContainer } from './components/ToastContainer';
import { db } from './services/automation/db';
import { UserGuide } from './components/workspaces/UserGuide';
import { TransformationBlueprint } from './components/workspaces/TransformationBlueprint';
import { BillingNode } from './components/workspaces/BillingNode';
import { AffiliateNode } from './components/workspaces/AffiliateNode';

const STORAGE_KEY_REGION = 'prospector_os_region_v1';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<MainMode>('RESEARCH');
  const [activeModule, setActiveModule] = useState<SubModule>('EXECUTIVE_DASHBOARD');
  const [leads, setLeads] = useState<Lead[]>(() => db.getLeads());
  const [region, setRegion] = useState<string>(() => localStorage.getItem(STORAGE_KEY_REGION) || 'LOS ANGELES, USA');
  const [lockedLeadId, setLockedLeadId] = useState<string | null>(() => localStorage.getItem('pomelli_locked_lead_id'));
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubDb = db.subscribe((newLeads) => { setLeads([...newLeads]); });
    setIsHydrated(true);
    return () => unsubDb();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY_REGION, region);
  }, [region, isHydrated]);

  useEffect(() => {
    if (lockedLeadId) localStorage.setItem('pomelli_locked_lead_id', lockedLeadId);
    else localStorage.removeItem('pomelli_locked_lead_id');
  }, [lockedLeadId]);

  const lockedLead = useMemo(() => leads.find(l => l.id === lockedLeadId), [leads, lockedLeadId]);
  
  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    const currentLeads = db.getLeads();
    const updated = currentLeads.map(l => l.id === id ? { ...l, ...updates } : l);
    db.saveLeads(updated);
  };

  const navigate = (mode: MainMode, mod: SubModule) => { setActiveMode(mode); setActiveModule(mod); };

  const handleLockLead = (id: string) => {
    setLockedLeadId(id);
    const updated = db.getLeads().map(l => ({ ...l, locked: l.id === id }));
    db.saveLeads(updated);
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'EXECUTIVE_DASHBOARD': return <ExecutiveDashboard leads={leads} market={region} onNavigate={navigate} />;
      case 'USER_GUIDE': return <UserGuide onNavigate={navigate} />;
      case 'TRANSFORMATION_BLUEPRINT': return <TransformationBlueprint onNavigate={navigate} />;
      case 'MARKET_DISCOVERY': return <MarketDiscovery market={region} onLeadsGenerated={(l) => { navigate('RESEARCH', 'PROSPECT_DATABASE'); }} />;
      case 'AUTOMATED_SEARCH': return <AutomatedSearch market={region} onNewLeads={(newL) => {}} />;
      case 'PROSPECT_DATABASE': return <ProspectDatabase leads={leads} lockedLeadId={lockedLeadId} onLockLead={handleLockLead} onInspect={(id) => { handleLockLead(id); navigate('RESEARCH', 'STRATEGY_CENTER'); }} />;
      case 'STRATEGY_CENTER': return <StrategyCenter lead={lockedLead} onUpdateLead={handleUpdateLead} onNavigate={navigate} />;
      case 'PIPELINE': return <Pipeline leads={leads} onUpdateStatus={(id, s) => handleUpdateLead(id, { outreachStatus: s })} />;
      case 'HEATMAP': return <Heatmap leads={leads} market={region} />;
      case 'STRATEGIC_REASONING': return <StrategicReasoning lead={lockedLead} />;
      case 'BENCHMARK': return <BenchmarkNode lead={lockedLead} />;
      case 'PROMPT_INTERFACE': return <PromptInterface lead={lockedLead} />;
      case 'FACT_CHECK': return <FactCheck lead={lockedLead} />;
      case 'MODEL_BENCH': return <ModelBench />;
      case 'VIDEO_AUDIT': return <VideoAudit lead={lockedLead} />;
      case 'TRANSLATOR': return <TranslatorNode />;
      case 'MARKET_TRENDS': return <MarketTrends lead={lockedLead} />;
      case 'WORKSPACE': return <WorkspaceNode leads={leads} />;
      case 'CONTENT_ANALYSIS': return <ContentAnalysis lead={lockedLead} />;
      case 'VIDEO_INSIGHTS': return <VideoInsights lead={lockedLead} />;
      case 'ANALYTICS': case 'ANALYTICS_HUB': return <AnalyticsHub leads={leads} />;
      case 'VISUAL_STUDIO': return <VisualStudio leads={leads} lockedLead={lockedLead} />;
      case 'MOCKUPS_4K': return <Mockups4K lead={lockedLead} />;
      case 'PRODUCT_SYNTHESIS': return <ProductSynthesis lead={lockedLead} />;
      case 'CONTENT_IDEATION': return <ContentIdeation lead={lockedLead} />;
      case 'ASSET_LIBRARY': return <AssetLibrary />;
      case 'BRAND_DNA': return <BrandDNA lead={lockedLead} onUpdateLead={handleUpdateLead} />;
      case 'VIDEO_PRODUCTION': return <VideoProduction lead={lockedLead} />;
      case 'MOTION_LAB': return <MotionLab lead={lockedLead} />;
      case 'SONIC_STUDIO': return <SonicStudio lead={lockedLead} />;
      case 'MEETING_NOTES': return <MeetingNotes />;
      case 'CAMPAIGN_ORCHESTRATOR': return <CampaignOrchestrator leads={leads} lockedLead={lockedLead} onNavigate={navigate} onLockLead={handleLockLead} onUpdateLead={handleUpdateLead} />;
      case 'PROPOSALS': case 'ROI_CALCULATOR': case 'SEQUENCER': case 'PRESENTATION_BUILDER': case 'DEMO_SANDBOX': case 'DRAFTING': case 'SALES_COACH': case 'AI_CONCIERGE': case 'ELEVATOR_PITCH': case 'FUNNEL_MAP': 
        return <SellWorkspace activeModule={activeModule} leads={leads} lockedLead={lockedLead} />;
      case 'BILLING': return <BillingNode />;
      case 'AFFILIATE': return <AffiliateNode />;
      case 'IDENTITY': return <IdentityNode />;
      case 'SYSTEM_CONFIG': return <SystemConfig />;
      case 'EXPORT_DATA': return <ExportNode leads={leads} />;
      case 'CALENDAR': return <CalendarNode leads={leads} />;
      case 'ACTIVITY_LOGS': return <ActivityLogs />;
      case 'SETTINGS': return <SettingsNode />;
      case 'NEXUS_GRAPH': return <NexusGraph leads={leads} />;
      case 'TIMELINE': return <TimelineNode />;
      case 'TASK_MANAGER': return <TaskManager lead={lockedLead} />;
      case 'THEME': return <ThemeNode />;
      case 'USAGE_STATS': return <UsageStats />;
      default: return <IntelNode module={activeModule} lead={lockedLead} />;
    }
  };

  return (
    <>
      <LayoutZenith
        activeMode={activeMode} setActiveMode={setActiveMode}
        activeModule={activeModule} setActiveModule={setActiveModule}
        onSearchClick={() => setIsCommandOpen(true)}
        theater={region} setTheater={setRegion}
        currentLayout="ZENITH"
        setLayoutMode={() => {}}
      >
        {renderContent()}
        <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} onSelect={navigate} theme="dark" />
        <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-3xl border-t border-slate-800/50 px-10 py-2 flex justify-between items-center z-[100] bg-[#020617]/80 text-[9px] font-black uppercase tracking-widest text-slate-600 pointer-events-none">
            <div className="flex gap-4"><span>SYSTEM: OPERATIONAL</span><span>V14.8 (STRIPE_RESTORED)</span></div>
            <div className="flex gap-4">
                <span>CORE: GEMINI_3_FLASH</span>
                <span>TARGET: {lockedLead ? lockedLead.businessName.toUpperCase() : 'NO TARGET LOCKED'}</span>
            </div>
        </footer>
      </LayoutZenith>
      <ToastContainer />
    </>
  );
};

export default App;
