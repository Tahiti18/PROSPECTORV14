
import React, { useState } from 'react';
import { MainMode, SubModule } from '../../types';

interface SystemOverviewProps {
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
  { id: 'EXECUTIVE_DASHBOARD', mode: 'RESEARCH', title: 'Executive Dashboard', mission: 'The central operational nerve center providing high-level situational awareness across all projects.', input: 'Project data, system health, regional metrics', output: 'Unified analytics and summary widgets', useCase: 'Daily project oversight.', tags: ['Core', 'Management'] },
  { id: 'USER_GUIDE', mode: 'RESEARCH', title: 'System Overview', mission: 'An exhaustive directory and manual explaining every professional tool within the OS.', input: 'Internal software registry', output: 'Tool catalog and documentation', useCase: 'Mastering platform capabilities.', tags: ['Manual', 'Directory'] },
  { id: 'MARKET_DISCOVERY', mode: 'RESEARCH', title: 'Market Discovery', mission: 'Identifies high-ticket prospects in specific geographic regions or industry niches.', input: 'City name, industry keywords', output: 'Verified lead database', useCase: 'Regional client acquisition.', tags: ['Search', 'Sales'] },
  { id: 'AUTOMATED_SEARCH', mode: 'RESEARCH', title: 'Automated Search', mission: 'Autonomous lead identification engine that scans for specific commercial signals.', input: 'Client criteria, intent signals', output: 'Live opportunity feed', useCase: 'Passive pipeline development.', tags: ['Automation', 'Leads'] },
  { id: 'PROSPECT_DATABASE', mode: 'RESEARCH', title: 'Prospect Ledger', mission: 'The master contact list and CRM for every identified potential client.', input: 'Discovery results, manual entries', output: 'Searchable database records', useCase: 'Managing client relationships.', tags: ['CRM', 'Database'] },
  { id: 'PIPELINE', mode: 'RESEARCH', title: 'Growth Pipeline', mission: 'Visualizes deal progression from identification through to successful closure.', input: 'Prospect status updates', output: 'Kanban board visualization', useCase: 'Tracking deal lifecycles.', tags: ['Sales', 'Tracking'] },
  { id: 'STRATEGY_CENTER', mode: 'RESEARCH', title: 'Strategy Hub', mission: 'Advanced auditing tool to analyze business weak spots and growth opportunities.', input: 'Client website and profile', output: 'Strategic audit and transformation map', useCase: 'Sales call preparation.', tags: ['Analysis', 'Strategy'] },
  { id: 'STRATEGIC_REASONING', mode: 'RESEARCH', title: 'Deep Logic Lab', mission: 'High-level brainstorming engine for solving complex strategic business hurdles.', input: 'Business challenges, objectives', output: 'Logical solution pathways', useCase: 'Solving specific client roadblocks.', tags: ['Logic', 'Problem Solving'] },
  { id: 'WORKSPACE', mode: 'RESEARCH', title: 'Strategic Workspace', mission: 'Direct interface for secure neural assistant interactions regarding business research.', input: 'Strategic queries, requests', output: 'Analytical responses and drafts', useCase: 'Ad-hoc research and copy drafting.', tags: ['Chat', 'AI'] },
  { id: 'MARKET_TRENDS', mode: 'RESEARCH', title: 'Market Trends', mission: 'Monitors global news and cultural signals to align outreach with current events.', input: 'Market keywords, web grounding', output: 'Trend summary and relevance reports', useCase: 'Timely sales engagement.', tags: ['News', 'Trends'] },
  { id: 'VISUAL_ANALYSIS', mode: 'RESEARCH', title: 'Visual Analysis', mission: 'Neural audit of website screenshots to grade design quality and brand authority.', input: 'Website image/URL', output: 'Design grade and sentiment matrix', useCase: 'Identifing design vulnerabilities.', tags: ['Design', 'Audit'] },
  { id: 'VIDEO_INSIGHTS', mode: 'RESEARCH', title: 'Media Insights', mission: 'Deep analysis of video content to deconstruct narratives and viral potential.', input: 'Video source, URL', output: 'Creative and technical breakdown', useCase: 'Content strategy refinement.', tags: ['Video', 'Marketing'] },
  { id: 'CONTENT_ANALYSIS', mode: 'RESEARCH', title: 'Content Analysis', mission: 'Hyper-speed synthesis of long-form articles for rapid competitive research.', input: 'Article URL or source text', output: 'Executive summary and key facts', useCase: 'Competitive intelligence gathering.', tags: ['Reading', 'Efficiency'] },
  { id: 'BENCHMARK', mode: 'RESEARCH', title: 'Benchmark Analysis', mission: 'Compares business infrastructure against industry leaders to highlight gaps.', input: 'Competitor URLs', output: 'Comparative analysis reports', useCase: 'Competitive positioning.', tags: ['Stats', 'Benchmarking'] },
  { id: 'ANALYTICS_HUB', mode: 'RESEARCH', title: 'Market Intel Hub', mission: 'Macro-level analysis of large datasets to identify emerging industry opportunities.', input: 'Aggregated market data', output: 'Strategic opportunity reports', useCase: 'Macro-strategy development.', tags: ['Data', 'Intelligence'] },

  // --- DESIGN ZONE ---
  { id: 'VISUAL_STUDIO', mode: 'DESIGN', title: 'Visual Studio', mission: 'Generates high-fidelity brand assets and commercial photography from descriptions.', input: 'Aesthetic directives, prompts', output: 'High-resolution professional imagery', useCase: 'Creative asset production.', tags: ['Creative', 'Design'] },
  { id: 'BRAND_DNA', mode: 'DESIGN', title: 'Brand DNA', mission: 'Extracts core identity markers from existing sites to maintain visual consistency.', input: 'Business website URL', output: 'Comprehensive brand identity matrix', useCase: 'Client brand alignment.', tags: ['Identity', 'Design'] },
  { id: 'MOCKUPS_4K', mode: 'DESIGN', title: 'Mockup Studio', mission: 'Creates photorealistic commercial mockups for products and advertisements.', input: 'Product and setting details', output: '4K commercial renders', useCase: 'High-end visual proof.', tags: ['3D', 'Sales'] },
  { id: 'PRODUCT_SYNTHESIS', mode: 'DESIGN', title: 'Offer Synthesis', mission: 'Architects high-value service bundles and product offers for clients.', input: 'Market needs, business goals', output: 'Structured value stack diagram', useCase: 'Refining client offer design.', tags: ['Offers', 'Pricing'] },
  { id: 'CONTENT_IDEATION', mode: 'DESIGN', title: 'Content Ideation', mission: 'Sparks creative hooks and viral themes for multi-platform social campaigns.', input: 'Brand objective, niche context', output: 'Categorized creative concepts', useCase: 'Editorial calendar planning.', tags: ['Ideas', 'Creative'] },
  { id: 'ASSET_LIBRARY', mode: 'DESIGN', title: 'Asset Library', mission: 'The central reservoir for all images, videos, and text files created in the OS.', input: 'Generated media assets', output: 'Organized asset repository', useCase: 'Digital asset management.', tags: ['Storage', 'Files'] },

  // --- MEDIA ZONE ---
  { id: 'VIDEO_PRODUCTION', mode: 'MEDIA', title: 'Video Studio', mission: 'Synthesizes high-quality cinematic video clips for advertisements.', input: 'Cinematic script or prompt', output: 'Professional video payloads', useCase: 'Social media ad creation.', tags: ['Video', 'Production'] },
  { id: 'VIDEO_AUDIT', mode: 'MEDIA', title: 'Video Audit', mission: 'Critiques existing video content for pacing, design, and engagement.', input: 'Video link or raw file', output: 'Professional creative audit', useCase: 'Improving client media quality.', tags: ['Critique', 'Media'] },
  { id: 'MOTION_LAB', mode: 'MEDIA', title: 'Motion Lab', mission: 'Architects animated storyboards and dynamic plans for video production.', input: 'Narrative script', output: 'Animated storyboard visualization', useCase: 'Pre-production architecture.', tags: ['Animation', 'Storyboard'] },
  { id: 'SONIC_STUDIO', mode: 'MEDIA', title: 'Sonic Studio', mission: 'Generates professional voiceovers and background soundtracks for media.', input: 'Script, genre, vocal directive', output: 'Studio-quality audio files', useCase: 'Media soundtracking.', tags: ['Audio', 'Music'] },
  { id: 'MEETING_NOTES', mode: 'MEDIA', title: 'Executive Scribe', mission: 'Converts raw meeting transcripts into organized action items and summaries.', input: 'Meeting transcript/audio', output: 'Executive summary and tasks', useCase: 'Post-meeting synchronization.', tags: ['Workflow', 'Scribe'] },

  // --- OUTREACH ZONE ---
  { id: 'CAMPAIGN_ORCHESTRATOR', mode: 'OUTREACH', title: 'Campaign Architect', mission: 'End-to-end orchestration of multi-touch sales campaigns.', input: 'Prospect identity, objectives', output: 'Complete outreach sequence', useCase: 'Scaling client acquisition.', tags: ['Campaigns', 'Automation'] },
  { id: 'PROPOSALS', mode: 'OUTREACH', title: 'Proposal Builder', mission: 'Generates strategic proposals via interactive high-conversion "Magic Links."', input: 'Deal terms, service scope', output: 'Interactive proposal link', useCase: 'Closing high-ticket deals.', tags: ['Closing', 'Agreements'] },
  { id: 'ROI_CALCULATOR', mode: 'OUTREACH', title: 'Value Projector', mission: 'Mathematical modeling to quantify the financial impact of transformation.', input: 'Business metrics (LTV, volume)', output: 'ROI and growth report', useCase: 'Financial value justification.', tags: ['Math', 'Finance'] },
  { id: 'SEQUENCER', mode: 'OUTREACH', title: 'Engagement Sequence', mission: 'Architects multi-channel follow-up flows for sustained engagement.', input: 'Initial outreach strategy', output: 'Multi-day engagement schedule', useCase: 'Nurture flow automation.', tags: ['Email', 'Outreach'] },
  { id: 'PRESENTATION_BUILDER', mode: 'OUTREACH', title: 'Deck Architect', mission: 'Structural design and narrative building for sales pitch presentations.', input: 'Core narrative, brand story', output: 'Pitch deck slide architecture', useCase: 'Client-facing presentations.', tags: ['Sales', 'Presentations'] },
  { id: 'DEMO_SANDBOX', mode: 'OUTREACH', title: 'Growth Simulator', mission: 'Predictive modeling environment for testing growth and market scenarios.', input: 'Market variables, growth levers', output: 'Predictive simulation data', useCase: 'Scenario-based selling.', tags: ['Simulation', 'Growth'] },
  { id: 'DRAFTING', mode: 'OUTREACH', title: 'Drafting Portal', mission: 'Focus-optimized writing environment for refining outbound communications.', input: 'AI-generated drafts', output: 'Polished sales copy', useCase: 'Copywriting and editing.', tags: ['Writing', 'Editing'] },
  { id: 'SALES_COACH', mode: 'OUTREACH', title: 'Strategic Coach', mission: 'Tactical guidance engine for handling objections and closing deals.', input: 'Sales obstacles, objections', output: 'Coach directives and scripts', useCase: 'Live negotiation support.', tags: ['Coaching', 'Strategy'] },
  { id: 'AI_CONCIERGE', mode: 'OUTREACH', title: 'Neural Agent', mission: 'Interactive proof-of-concept for autonomous customer engagement bots.', input: 'Business knowledge base', output: 'Interactive concierge demo', useCase: 'Demonstrating AI service value.', tags: ['Agent', 'Demo'] },
  { id: 'ELEVATOR_PITCH', mode: 'OUTREACH', title: 'Pitch Generator', mission: 'Crafts high-impact, short-form scripts for rapid value introduction.', input: 'Core offer, lead profile', output: '30-second value script', useCase: 'Cold calling and intros.', tags: ['Pitch', 'Script'] },
  { id: 'FUNNEL_MAP', mode: 'OUTREACH', title: 'Funnel Map', mission: 'Visualizes the conversion pathway and intent geometry for campaigns.', input: 'Sales steps, conversion goals', output: 'Visual funnel diagram', useCase: 'Conversion path analysis.', tags: ['Strategy', 'Visual'] },

  // --- ADMIN ZONE ---
  { id: 'AGENCY_PLAYBOOK', mode: 'ADMIN', title: 'Agency Playbook', mission: 'Centralized directory for agency standard operating procedures.', input: 'Company rules, SOPs', output: 'Internal guidance system', useCase: 'Scaling operational standards.', tags: ['Manual', 'SOP'] },
  { id: 'BILLING', mode: 'ADMIN', title: 'Financials', mission: 'Manage subscriptions, resource allocation, and budget oversight.', input: 'Usage data, payment info', output: 'Invoices and balance tracking', useCase: 'Agency budget control.', tags: ['Admin', 'Finance'] },
  { id: 'AFFILIATE', mode: 'ADMIN', title: 'Partner Program', mission: 'System for managing referral growth networks and commissions.', input: 'Partner data, performance', output: 'Commission and referral matrix', useCase: 'Referral network management.', tags: ['Growth', 'Partners'] },
  { id: 'IDENTITY', mode: 'ADMIN', title: 'Agency Identity', mission: 'Configure and maintain your own agency’s brand profile and output style.', input: 'Agency mission, branding', output: 'System-wide brand profile', useCase: 'Workspace personalization.', tags: ['Profile', 'Settings'] },
  { id: 'SYSTEM_CONFIG', mode: 'ADMIN', title: 'Core Config', mission: 'Technical backend parameters for optimizing system performance.', input: 'Technical specs, preferences', output: 'Optimized system state', useCase: 'Infrastructure optimization.', tags: ['Technical', 'Core'] },
  { id: 'EXPORT_DATA', mode: 'ADMIN', title: 'Data Management', mission: 'Secure local data synchronization and external backup nodes.', input: 'Lead ledger, app data', output: 'JSON backup manifests', useCase: 'Security and data portability.', tags: ['Security', 'Backup'] },
  { id: 'CALENDAR', mode: 'ADMIN', title: 'Schedule Hub', mission: 'Visualizes outreach schedule and milestones.', input: 'Sequencer Data', output: 'Ops Calendar', useCase: 'Timeline management.', tags: ['Time', 'Ops'] },
  { id: 'ACTIVITY_LOGS', mode: 'ADMIN', title: 'Activity Trace', mission: 'Trace of all OS activity.', input: 'Event Stream', output: 'Trace Table', useCase: 'Auditing system usage.', tags: ['Logs', 'Trace'] },
  { id: 'SETTINGS', mode: 'ADMIN', title: 'Global Settings', mission: 'Global preferences and API key management.', input: 'Auth Keys', output: 'System Readiness', useCase: 'Infrastructure setup.', tags: ['Key', 'Config'] },
  { id: 'NEXUS_GRAPH', mode: 'ADMIN', title: 'Nexus Graph', mission: 'Relationship mapping across the target ledger.', input: 'Ledger Data', output: 'Entity Graph', useCase: 'Network effect analysis.', tags: ['Data', 'Map'] },
  { id: 'TIMELINE', mode: 'ADMIN', title: 'Project Timeline', mission: 'Historical view of system operations.', input: 'Log Buffer', output: 'Timeline Feed', useCase: 'Historical review.', tags: ['History', 'Timeline'] },
  { id: 'TASK_MANAGER', mode: 'ADMIN', title: 'Task Manager', mission: 'Actionable checklist for team deployment.', input: 'Project Scope', output: 'Task Ledger', useCase: 'Execution tracking.', tags: ['Tasks', 'Checklist'] },
  { id: 'THEME', mode: 'ADMIN', title: 'Interface Theme', mission: 'UI customization and aesthetic control.', input: 'Aesthetic Prefs', output: 'Visual Style', useCase: 'Personalizing workspace.', tags: ['UI', 'Aesthetic'] },
  { id: 'USAGE_STATS', mode: 'ADMIN', title: 'Resource Stats', mission: 'Detailed reporting on token and API consumption.', input: 'API Usage', output: 'Cost Report', useCase: 'Monitoring ROI.', tags: ['Cost', 'Compute'] }
];

export const SystemOverview: React.FC<SystemOverviewProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState('');
  const [activeZone, setActiveZone] = useState<MainMode | 'ALL'>('ALL');

  const filtered = MODULE_REGISTRY.filter(m => 
    (activeZone === 'ALL' || m.mode === activeZone) &&
    (m.title.toLowerCase().includes(filter.toLowerCase()) || 
     m.tags.some(t => t.toLowerCase().includes(filter.toLowerCase())) ||
     m.mission.toLowerCase().includes(filter.toLowerCase()))
  );

  const zones: { id: MainMode | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'MASTER_INDEX' },
    { id: 'RESEARCH', label: 'RESEARCH' },
    { id: 'DESIGN', label: 'DESIGN' },
    { id: 'MEDIA', label: 'MEDIA' },
    { id: 'OUTREACH', label: 'OUTREACH' },
    { id: 'ADMIN', label: 'ADMIN' }
  ];

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 space-y-16 animate-in fade-in duration-1000 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-slate-800 pb-16 relative overflow-hidden">
        <div className="space-y-6 max-w-4xl relative z-10">
           <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official System Documentation</span>
           </div>
           <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
             SYSTEM <span className="text-emerald-500">OVERVIEW</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium leading-relaxed font-serif italic max-w-3xl">
             The comprehensive manual for Prospector OS. Learn how to master all neural modules for high-fidelity agency operations.
           </p>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-3xl p-6 border border-slate-800 rounded-[32px] flex flex-col md:flex-row gap-6 items-center shadow-2xl">
         <div className="flex-1 w-full relative">
            <input 
              value={filter} onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-[#0b1021] border border-slate-800 rounded-2xl px-12 py-5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all shadow-inner placeholder-slate-700"
              placeholder="SEARCH THE SYSTEM MANUAL..."
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </div>
         <div className="flex bg-[#0b1021] border border-slate-800 rounded-2xl p-1 overflow-x-auto no-scrollbar max-w-full">
            {zones.map(z => (
              <button key={z.id} onClick={() => setActiveZone(z.id)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeZone === z.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{z.label}</button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
         {filtered.map(m => (
           <div key={m.id} onClick={() => onNavigate(m.mode, m.id)} className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 flex flex-col group hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
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
