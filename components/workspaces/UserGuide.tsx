
import React, { useState } from 'react';
import { MainMode, SubModule } from '../../types';

interface UserGuideProps {
  onNavigate: (mode: MainMode, mod: SubModule) => void;
}

interface ModuleDetail {
  id: SubModule;
  mode: MainMode;
  title: string;
  mission: string;
  input: string;
  output: string;
  useCase: string;
  tags: string[];
}

const MODULE_REGISTRY: ModuleDetail[] = [
  // --- RESEARCH ZONE ---
  { id: 'EXECUTIVE_DASHBOARD', mode: 'RESEARCH', title: 'EXECUTIVE DASHBOARD', mission: 'The operational nerve center providing high-level visibility across agency activities.', input: 'Market Ledger, System Health', output: 'Unified Analytics View', useCase: 'Daily agency oversight.', tags: ['Core', 'Management'] },
  { id: 'USER_GUIDE', mode: 'RESEARCH', title: 'USER GUIDE', mission: 'The comprehensive architectural manual for the entire OS.', input: 'Internal Registry', output: 'Knowledge Base', useCase: 'System mastery and onboarding.', tags: ['Manual', 'Reference'] },
  { id: 'MARKET_DISCOVERY', mode: 'RESEARCH', title: 'MARKET DISCOVERY', mission: 'Identifies high-value prospects within specific geographic markets.', input: 'Location, Industry Focus', output: 'Verified Lead Database', useCase: 'Regional business acquisition.', tags: ['Research', 'Leads'] },
  { id: 'AUTOMATED_SEARCH', mode: 'RESEARCH', title: 'AUTOMATED SEARCH', mission: 'Autonomous scanning for growth signals and brand vulnerabilities.', input: 'Market Search Parameters', output: 'Real-time Opportunity Feed', useCase: 'Rapid pipeline development.', tags: ['Automation', 'Signals'] },
  { id: 'PROSPECT_DATABASE', mode: 'RESEARCH', title: 'PROSPECT LEDGER', mission: 'The master database of all identified potential clients.', input: 'Discovery Data', output: 'Categorized Lead Records', useCase: 'CRM and list management.', tags: ['CRM', 'Data'] },
  { id: 'PIPELINE', mode: 'RESEARCH', title: 'GROWTH PIPELINE', mission: 'Visualizes the engagement stage for every active prospect.', input: 'Outreach History', output: 'Kanban Stage Matrix', useCase: 'Tracking deal progression.', tags: ['Sales', 'Tracking'] },
  { id: 'STRATEGY_CENTER', mode: 'RESEARCH', title: 'STRATEGY HUB', mission: 'Deep-dive analysis of individual client transformation opportunities.', input: 'Prospect Identity', output: 'Transformation Roadmap', useCase: 'Personalized sales engineering.', tags: ['Strategy', 'Audit'] },
  { id: 'STRATEGIC_REASONING', mode: 'RESEARCH', title: 'DEEP LOGIC LAB', mission: 'Advanced reasoning for complex business hurdles.', input: 'Business Context', output: 'Logical Solution Path', useCase: 'Solving specific client roadblocks.', tags: ['Reasoning', 'Logic'] },
  { id: 'WORKSPACE', mode: 'RESEARCH', title: 'GEMINI WORKSPACE', mission: 'A sandbox for direct interaction with neural models.', input: 'Free-form Text', output: 'Contextual Insights', useCase: 'Ad-hoc research and drafting.', tags: ['Sandbox', 'AI'] },
  { id: 'MARKET_TRENDS', mode: 'RESEARCH', title: 'TREND MONITOR', mission: 'Real-time monitoring of industry and cultural signals.', input: 'Web Grounding', output: 'Market Insight Reports', useCase: 'Aligning outreach with news.', tags: ['Viral', 'Grounding'] },
  { id: 'VISUAL_ANALYSIS', mode: 'RESEARCH', title: 'VISION INTEL', mission: 'Neural extraction of data from website assets.', input: 'Image/Screenshot', output: 'Design/Sentiment Matrix', useCase: 'Auditing brand authority.', tags: ['Vision', 'Research'] },
  { id: 'VIDEO_INSIGHTS', mode: 'RESEARCH', title: 'VIDEO ANALYSIS', mission: 'Deep temporal understanding of media content.', input: 'Video URL', output: 'Strategic Deconstruction', useCase: 'Analyzing client media assets.', tags: ['Video', 'Intel'] },
  { id: 'CONTENT_ANALYSIS', mode: 'RESEARCH', title: 'CONTENT ANALYSIS', mission: 'Hyper-speed synthesis of long-form articles.', input: 'Source Text/URL', output: 'Executive Summary', useCase: 'Rapid competitive research.', tags: ['Text', 'Synthesis'] },
  { id: 'BENCHMARK', mode: 'RESEARCH', title: 'REVERSE ENGINEER', mission: 'Deconstructs competitor digital infrastructure.', input: 'Competitor URL', output: 'Stack/Gap Assessment', useCase: 'Identifying business vulnerabilities.', tags: ['Analysis', 'Tech'] },
  { id: 'ANALYTICS', mode: 'RESEARCH', title: 'ANALYTICS CORE', mission: 'Internal performance metrics for agency operations.', input: 'System Logs', output: 'Operations Charts', useCase: 'Monitoring team efficiency.', tags: ['Stats', 'Performance'] },
  { id: 'ANALYTICS_HUB', mode: 'RESEARCH', title: 'MARKET INTELLIGENCE', mission: 'Aggregate data insights across entire markets.', input: 'Ledger Data', output: 'Macro Opportunity Map', useCase: 'Evaluating market sectors.', tags: ['Macro', 'Data'] },
  { id: 'HEATMAP', mode: 'RESEARCH', title: 'OPPORTUNITY HEATMAP', mission: 'Visual density mapping of high-value targets.', input: 'Lead Score/Geo', output: 'Interactive Map', useCase: 'Prioritizing outreach zones.', tags: ['Visual', 'Geo'] },
  { id: 'PROMPT_INTERFACE', mode: 'RESEARCH', title: 'PROMPT SECURED', mission: 'Professional interface for secure prompt engineering.', input: 'Model Parameters', output: 'Optimized Responses', useCase: 'Refining agency system behavior.', tags: ['Secure', 'Chat'] },
  { id: 'MODEL_BENCH', mode: 'RESEARCH', title: 'MODEL BENCHMARK', mission: 'Compares performance across various neural engines.', input: 'Test Prompts', output: 'Fidelity Scorecard', useCase: 'Optimizing resource selection.', tags: ['Testing', 'Quality'] },
  { id: 'FACT_CHECK', mode: 'RESEARCH', title: 'FACT CHECKER', mission: 'Grounded verification of business claims.', input: 'Specific Claim', output: 'Verified/Disputed Verdict', useCase: 'Vetting prospect legitimacy.', tags: ['Trust', 'Search'] },
  { id: 'TRANSLATOR', mode: 'RESEARCH', title: 'TACTICAL TRANSLATOR', mission: 'Localized outreach for international markets.', input: 'Source Copy', output: 'Localized Tonal Match', useCase: 'Entering foreign markets.', tags: ['Language', 'Global'] },

  // --- DESIGN ZONE ---
  { id: 'VISUAL_STUDIO', mode: 'DESIGN', title: 'CREATIVE STUDIO', mission: 'Generates high-fidelity brand imagery and photography.', input: 'Style Guidelines', output: '4K Commercial Renders', useCase: 'High-end visual branding.', tags: ['Creative', 'Assets'] },
  { id: 'BRAND_DNA', mode: 'DESIGN', title: 'BRAND DNA', mission: 'Extracts core identity markers from existing sites.', input: 'Prospect URL', output: 'Identity Matrix', useCase: 'Establishing visual alignment.', tags: ['Extraction', 'Branding'] },
  { id: 'MOCKUPS_4K', mode: 'DESIGN', title: 'MOCKUP STUDIO', mission: 'Creates photorealistic product and ad visualizations.', input: 'Asset Pack', output: 'Studio Plate Renders', useCase: 'Visualizing transformation.', tags: ['Product', '3D'] },
  { id: 'PRODUCT_SYNTHESIS', mode: 'DESIGN', title: 'OFFER ARCHITECTURE', mission: 'Designs high-ticket service bundles and product offers.', input: 'Niche Data', output: 'Value Stack Diagram', useCase: 'Refining agency offers.', tags: ['Offer', 'Design'] },
  { id: 'CONTENT_IDEATION', mode: 'DESIGN', title: 'CONTENT IDEATION', mission: 'Sparks creative hooks and social concepts.', input: 'Strategy Brief', output: 'Idea Grid', useCase: 'Editorial planning.', tags: ['Viral', 'Ideas'] },
  { id: 'ASSET_LIBRARY', mode: 'DESIGN', title: 'MEDIA VAULT', mission: 'Persistent repository for all generated media assets.', input: 'Project Outputs', output: 'Organized Assets', useCase: 'Media management.', tags: ['Storage', 'Management'] },

  // --- MEDIA ZONE ---
  { id: 'VIDEO_PRODUCTION', mode: 'MEDIA', title: 'VIDEO STUDIO', mission: 'Cinematic synthesis for commercial advertisements.', input: 'Visual Directive', output: 'MP4 Video Payloads', useCase: 'Social media ad campaigns.', tags: ['Motion', 'Veo'] },
  { id: 'VIDEO_AUDIT', mode: 'MEDIA', title: 'VIDEO AUDIT', mission: 'Critiques existing client video presence.', input: 'YouTube/Vimeo', output: 'Fidelity Audit', useCase: 'Evaluating media quality.', tags: ['Critique', 'Sales'] },
  { id: 'VIDEO_INSIGHTS', mode: 'MEDIA', title: 'TEMPORAL INSEL', mission: 'Deconstructs media narratives for performance patterns.', input: 'Social Video', output: 'Engagement Breakdown', useCase: 'Content engineering.', tags: ['Temporal', 'Intel'] },
  { id: 'MOTION_LAB', mode: 'MEDIA', title: 'MOTION LAB', mission: 'Designs dynamic storyboard concepts for animation.', input: 'Script', output: 'Visual Storyboard', useCase: 'Production planning.', tags: ['Storyboard', 'Animation'] },
  { id: 'SONIC_STUDIO', mode: 'MEDIA', title: 'SONIC STUDIO', mission: 'Neural audio and voice synthesis for branding.', input: 'Script/Genre', output: 'PCM Audio', useCase: 'Commercial voiceover.', tags: ['Audio', 'Suno'] },
  { id: 'MEETING_NOTES', mode: 'MEDIA', title: 'NOTE SCRIBE', mission: 'Summarizes transcripts into actionable summaries.', input: 'Raw Transcript', output: 'Executive Summary', useCase: 'Post-meeting alignment.', tags: ['Workflow', 'Scribe'] },

  // --- OUTREACH ZONE ---
  { id: 'CAMPAIGN_ORCHESTRATOR', mode: 'OUTREACH', title: 'CAMPAIGN ARCHITECT', mission: 'End-to-end strategy management and orchestration.', input: 'Lead Dossier', output: 'Deployment Suite', useCase: 'Scaling client success.', tags: ['Sales', 'Automation'] },
  { id: 'PROPOSALS', mode: 'OUTREACH', title: 'PROPOSAL BUILDER', mission: 'AI-driven high-conversion sales blueprints.', input: 'Value Data', output: 'Magic Link Proposal', useCase: 'Finalizing agreements.', tags: ['Closing', 'Copy'] },
  { id: 'ROI_CALCULATOR', mode: 'OUTREACH', title: 'VALUE PROJECTOR', mission: 'Financial projection of transformation ROI.', input: 'Business Metrics', output: 'Investment Analysis', useCase: 'Justifying premium fees.', tags: ['Finance', 'Logic'] },
  { id: 'SEQUENCER', mode: 'OUTREACH', title: 'OUTREACH BUILDER', mission: 'Multi-day, multi-channel engagement flows.', input: 'Strategy', output: 'Sequence Schedule', useCase: 'Engagement automation.', tags: ['Drip', 'Email'] },
  { id: 'PRESENTATION_BUILDER', mode: 'OUTREACH', title: 'DECK ARCHITECT', mission: 'Architects structural sales pitch deck blueprints.', input: 'Narrative', output: 'Slide Matrix', useCase: 'Sales presentations.', tags: ['Deck', 'Sales'] },
  { id: 'DEMO_SANDBOX', mode: 'OUTREACH', title: 'DEMO SANDBOX', mission: 'Predictive growth modeling and simulation.', input: 'Variables', output: 'Scenario Forecast', useCase: 'Demonstrating future growth.', tags: ['Simulation', 'Growth'] },
  { id: 'DRAFTING', mode: 'OUTREACH', title: 'DRAFTING PORTAL', mission: 'Workspace for fine-tuning outbound communications.', input: 'AI Drafts', output: 'Polished Outreach', useCase: 'Human-in-the-loop editing.', tags: ['Editor', 'Copy'] },
  { id: 'SALES_COACH', mode: 'OUTREACH', title: 'STRATEGY COACH', mission: 'Tactical advice for negotiation and engagement.', input: 'Project Obstacle', output: 'Advisor Directives', useCase: 'Live deal assistance.', tags: ['Coaching', 'Strategy'] },
  { id: 'AI_CONCIERGE', mode: 'OUTREACH', title: 'VIRTUAL AGENT', mission: 'Autonomous POC for customer engagement.', input: 'Knowledge Base', output: 'Nurture Dialogue', useCase: 'Demonstrating AI services.', tags: ['Agent', 'Demo'] },
  { id: 'ELEVATOR_PITCH', mode: 'OUTREACH', title: 'PITCH GENERATOR', mission: 'Short-form hooks for rapid engagement.', input: 'Lead Bio', output: '30s Script', useCase: 'Introductory outreach.', tags: ['Hook', 'Intro'] },
  { id: 'FUNNEL_MAP', mode: 'OUTREACH', title: 'FUNNEL MAPPER', mission: 'Visualizes the conversion geometry for a lead.', input: 'Business Logic', output: 'Funnel Diagram', useCase: 'Conversion path analysis.', tags: ['Map', 'Logic'] },

  // --- ADMIN ZONE ---
  { id: 'AGENCY_PLAYBOOK', mode: 'ADMIN', title: 'PLAYBOOK', mission: 'Internal guide to agency standard operating procedures.', input: 'SOPs', output: 'Team Guidance', useCase: 'Standardizing delivery.', tags: ['SOP', 'Manual'] },
  { id: 'BILLING', mode: 'ADMIN', title: 'FINANCIALS', mission: 'Financial control and resource management.', input: 'Usage Data', output: 'Financial Health', useCase: 'Managing budget.', tags: ['Finance', 'Admin'] },
  { id: 'AFFILIATE', mode: 'ADMIN', title: 'PARTNER PROGRAM', mission: 'Manages growth networks and referral partners.', input: 'Partner Data', output: 'Partner Matrix', useCase: 'Scaling referral channels.', tags: ['Growth', 'Partners'] },
  { id: 'IDENTITY', mode: 'ADMIN', title: 'AGENCY IDENTITY', mission: 'Configuration of the agency brand profile.', input: 'Agency Mission', output: 'Brand Signature', useCase: 'Workspace personalization.', tags: ['Profile', 'Config'] },
  { id: 'SYSTEM_CONFIG', mode: 'ADMIN', title: 'CORE CONFIG', mission: 'Core OS parameter and technical adjustments.', input: 'Specs', output: 'System State', useCase: 'Infrastructure setup.', tags: ['Settings', 'Core'] },
  { id: 'EXPORT_DATA', mode: 'ADMIN', title: 'DATA MANAGEMENT', mission: 'Backup and synchronization of local data nodes.', input: 'Lead Ledger', output: 'JSON Backups', useCase: 'Security and portability.', tags: ['Backup', 'Security'] },
  { id: 'CALENDAR', mode: 'ADMIN', title: 'SCHEDULE HUB', mission: 'Visualizes project schedule and milestones.', input: 'Sequence Data', output: 'Project Calendar', useCase: 'Timeline management.', tags: ['Time', 'Ops'] },
  { id: 'ACTIVITY_LOGS', mode: 'ADMIN', title: 'ACTIVITY TRACE', mission: 'Low-level trace of all OS activity.', input: 'Event Stream', output: 'Trace Table', useCase: 'Auditing system usage.', tags: ['Logs', 'Trace'] },
  { id: 'SETTINGS', mode: 'ADMIN', title: 'GLOBAL SETTINGS', mission: 'Global preferences and API key management.', input: 'Auth Keys', output: 'Ready State', useCase: 'Infrastructure setup.', tags: ['Key', 'Config'] },
  { id: 'NEXUS_GRAPH', mode: 'ADMIN', title: 'NEXUS GRAPH', mission: 'Relationship mapping across the target database.', input: 'Ledger Data', output: 'Entity Graph', useCase: 'Network effect analysis.', tags: ['Data', 'Map'] },
  { id: 'TIMELINE', mode: 'ADMIN', title: 'PROJECT TIMELINE', mission: 'Historical view of system operations.', input: 'Log Buffer', output: 'History Feed', useCase: 'Reviewing past activity.', tags: ['History', 'Timeline'] },
  { id: 'TASK_MANAGER', mode: 'ADMIN', title: 'TASK MANAGER', mission: 'Actionable checklist for team deployment.', input: 'Project Scope', output: 'Task Ledger', useCase: 'Execution tracking.', tags: ['Tasks', 'Checklist'] },
  { id: 'THEME', mode: 'ADMIN', title: 'INTERFACE THEME', mission: 'UI customization and aesthetic control.', input: 'Visual Prefs', output: 'Visual Style', useCase: 'Personalizing workspace.', tags: ['UI', 'Aesthetic'] },
  { id: 'USAGE_STATS', mode: 'ADMIN', title: 'RESOURCE STATS', mission: 'Detailed reporting on token and API consumption.', input: 'API Usage', output: 'Resource Report', useCase: 'Monitoring ROI.', tags: ['Cost', 'Compute'] }
];

export const UserGuide: React.FC<UserGuideProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState('');
  const [activeZone, setActiveZone] = useState<MainMode | 'ALL'>('ALL');

  const filtered = MODULE_REGISTRY.filter(m => 
    (activeZone === 'ALL' || m.mode === activeZone) &&
    (m.title.toLowerCase().includes(filter.toLowerCase()) || 
     m.tags.some(t => t.toLowerCase().includes(filter.toLowerCase())) ||
     m.mission.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="max-w-[1700px] mx-auto py-12 px-6 space-y-16 animate-in fade-in duration-1000 pb-40">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-slate-800 pb-16 relative">
        <div className="space-y-6 max-w-4xl relative z-10">
           <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official Agency Documentation</span>
           </div>
           <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
             USER <span className="text-emerald-500">GUIDE</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium leading-relaxed font-serif italic max-w-3xl">
             The comprehensive manual for Prospector OS. Learn how to master all 54 neural modules for high-fidelity agency operations.
           </p>
        </div>
        <div className="hidden lg:block relative mb-4 grayscale opacity-10 scale-150">📖</div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-3xl p-6 border border-slate-800 rounded-[32px] flex flex-col md:flex-row gap-6 items-center shadow-2xl">
         <div className="flex-1 w-full relative">
            <input 
              value={filter} onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-[#0b1021] border border-slate-800 rounded-2xl px-12 py-5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all"
              placeholder="SEARCH THE USER MANUAL..."
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </div>
         <div className="flex bg-[#0b1021] border border-slate-800 rounded-2xl p-1 overflow-x-auto no-scrollbar max-w-full">
            {['ALL', 'RESEARCH', 'DESIGN', 'MEDIA', 'OUTREACH', 'ADMIN'].map(z => (
              <button key={z} onClick={() => setActiveZone(z as any)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeZone === z ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{z}</button>
            ))}
         </div>
      </div>

      {/* MODULE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
         {filtered.map(m => (
           <div key={m.id} onClick={() => onNavigate(m.mode, m.id)} className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 flex flex-col group hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
              {/* Background ID Watermark */}
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-9xl font-black italic select-none group-hover:opacity-10 transition-opacity">
                {m.id.slice(0, 2)}
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                 <span className="px-3 py-1 bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest">{m.mode}</span>
                 <div className="flex flex-wrap gap-1.5 justify-end">
                    {m.tags.slice(0,2).map(t => <span key={t} className="text-[7px] font-bold text-slate-600 uppercase border border-slate-800 px-2 py-0.5 rounded-full">{t}</span>)}
                 </div>
              </div>

              <div className="mb-8 relative z-10 flex-1">
                 <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none group-hover:text-emerald-500 transition-colors">{m.title}</h3>
                 <p className="text-xs text-slate-400 font-medium italic mt-3 leading-relaxed line-clamp-3">"{m.mission}"</p>
              </div>

              <div className="space-y-4 mt-auto relative z-10">
                 <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 group-hover:border-emerald-500/20 transition-all">
                    <span className="text-[8px] font-black text-slate-600 uppercase block mb-1">INPUT VECTORS</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate">{m.input}</p>
                 </div>
                 <div className="pt-4 border-t border-slate-800 group-hover:border-emerald-500/20">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-widest">USE-CASE</span>
                    <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{m.useCase}</p>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
