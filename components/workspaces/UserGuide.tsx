
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
  { id: 'EXECUTIVE_DASHBOARD', mode: 'RESEARCH', title: 'Executive Dashboard', mission: 'The central operational nerve center. It provides a real-time, high-level aggregate view of all active prospects, system health metrics, and automated workflow status across your entire agency theater.', input: 'Market Ledger, System Health, Automation Logs', output: 'Unified Analytics & Live Feed', useCase: 'Continuous operational monitoring and situational awareness.', tags: ['Core', 'Management'] },
  { id: 'TRANSFORMATION_BLUEPRINT', mode: 'RESEARCH', title: 'Transformation Blueprint', mission: 'A strategic visualization of the agency\'s full capability matrix. It outlines the specific technical and creative vectors used to transition businesses from digital obscurity to market authority.', input: 'Internal Capability Logic', output: 'Value Roadmap', useCase: 'Establishing high-level strategy for agency-client alignment.', tags: ['Core', 'Sales'] },
  { id: 'USER_GUIDE', mode: 'RESEARCH', title: 'User Guide', mission: 'The master documentation repository. This module contains exhaustive architectural details and instructions for every tool integrated into the Prospector OS ecosystem.', input: 'System Registry Documentation', output: 'Knowledge Base', useCase: 'System mastery, team onboarding, and feature discovery.', tags: ['Manual', 'Reference'] },
  { id: 'MARKET_DISCOVERY', mode: 'RESEARCH', title: 'Market Discovery', mission: 'A regional scanning engine designed to locate high-value prospects within specific geographic sectors or industries by cross-referencing commercial signals and public records.', input: 'Location, Industry Keywords', output: 'Verified Lead Database', useCase: 'Aggressive regional business acquisition and niche expansion.', tags: ['Research', 'Leads'] },
  { id: 'AUTOMATED_SEARCH', mode: 'RESEARCH', title: 'Automated Search', mission: 'An autonomous agent-driven engine that continuously crawls the web for specific brand vulnerabilities, such as inactive social feeds or outdated digital infrastructure.', input: 'Vulnerability Directives & Signals', output: 'Real-time Opportunity Feed', useCase: 'Building a passive, high-velocity sales pipeline.', tags: ['Automation', 'Signals'] },
  { id: 'PROSPECT_DATABASE', mode: 'RESEARCH', title: 'Prospect Ledger', mission: 'The master command center for your contact data. It provides advanced sorting, filtering, and mass-engagement controls for every business identified by the discovery modules.', input: 'Discovery Data, Manual Imports', output: 'Structured Lead Records', useCase: 'Strategic CRM management and database synchronization.', tags: ['CRM', 'Data'] },
  { id: 'PIPELINE', mode: 'RESEARCH', title: 'Growth Pipeline', mission: 'A visual Kanban-style matrix tracking the progression of every prospect from initial reconnaissance through negotiation and final deal closure.', input: 'Engagement History & Status', output: 'Stage-Based Deal Matrix', useCase: 'Managing the lifecycle of high-ticket sales opportunities.', tags: ['Sales', 'Tracking'] },
  { id: 'STRATEGY_CENTER', mode: 'RESEARCH', title: 'Strategy Hub', mission: 'The primary workspace for individual lead analysis. It consolidates vulnerability audits and transformation opportunities into a single, actionable strategic interface.', input: 'Prospect Identity & Digital Footprint', output: 'Transformation Blueprint', useCase: 'Deep-dive preparation for high-stakes sales calls.', tags: ['Strategy', 'Audit'] },
  { id: 'STRATEGIC_REASONING', mode: 'RESEARCH', title: 'Deep Logic Lab', mission: 'An advanced cognitive engine optimized for solving complex strategic hurdles, objection handling, and architecting unique competitive advantages.', input: 'Business Challenges & Context', output: 'Structured Logical Solutions', useCase: 'Overcoming specific client roadblocks during closing.', tags: ['Reasoning', 'Logic'] },
  { id: 'WORKSPACE', mode: 'RESEARCH', title: 'Gemini Workspace', mission: 'A secure, unrestricted portal for direct interaction with neural models. Ideal for ad-hoc research, copy brainstorming, and technical documentation drafting.', input: 'Free-form Text & Directives', output: 'Contextual Intelligence', useCase: 'General research and high-speed asset drafting.', tags: ['Sandbox', 'AI'] },
  { id: 'MARKET_TRENDS', mode: 'RESEARCH', title: 'Trend Monitor', mission: 'A live intelligence stream that monitors global news and cultural shifts to ensure your outreach messaging remains grounded and relevant to current events.', input: 'Web Grounding & Industry Keywords', output: 'Market Insight Reports', useCase: 'Aligning marketing angles with real-time cultural signals.', tags: ['Viral', 'Grounding'] },
  { id: 'VISUAL_ANALYSIS', mode: 'RESEARCH', title: 'Vision Intel', mission: 'A multi-modal audit engine that analyzes website screenshots to grade design quality, brand authority, and visual conversion effectiveness.', input: 'Static Image / Site Screenshot', output: 'Design Grade & Sentiment Analysis', useCase: 'Identifying aesthetic deficits to sell creative revamps.', tags: ['Vision', 'Research'] },
  { id: 'VIDEO_INSIGHTS', mode: 'RESEARCH', title: 'Media Insights', mission: 'Deep temporal analysis of video content to deconstruct pacing, narrative structure, and hooks. It benchmarks content against industry-leading performance standards.', input: 'Video URL (YouTube/Vimeo)', output: 'Structural Deconstruction', useCase: 'Refining content strategy and identifying media gaps.', tags: ['Video', 'Intel'] },
  { id: 'CONTENT_ANALYSIS', mode: 'RESEARCH', title: 'Content Analysis', mission: 'Hyper-speed synthesis of long-form articles, whitepapers, and competitor documentation into concise executive summaries and strategic action items.', input: 'Source Text or Document URL', output: 'Executive Synthesis', useCase: 'Rapid gathering of competitive and industrial intelligence.', tags: ['Text', 'Synthesis'] },
  { id: 'BENCHMARK', mode: 'RESEARCH', title: 'Reverse Engineer', mission: 'A technical deconstruction tool that analyzes a competitor\'s tech stack, design system, and business model to highlight exploitable infrastructure gaps.', input: 'Competitor Digital Node', output: 'Comparative Gap Analysis', useCase: 'Competitive positioning and market disruption strategy.', tags: ['Analysis', 'Tech'] },
  { id: 'ANALYTICS_HUB', mode: 'RESEARCH', title: 'Market Intelligence', mission: 'Macro-level data evaluation across entire industry sectors to identify emerging patterns, high-growth niches, and geographic opportunity spikes.', input: 'Aggregated Ledger Data', output: 'Sector-Wide Opportunity Map', useCase: 'Large-scale strategic market evaluation.', tags: ['Macro', 'Data'] },

  // --- DESIGN ZONE ---
  { id: 'VISUAL_STUDIO', mode: 'DESIGN', title: 'Creative Studio', mission: 'A high-end asset generation engine producing professional brand imagery, commercial photography, and ad creatives from pure text descriptions.', input: 'Aesthetic Directives & Brand Style', output: '4K Commercial Renders', useCase: 'Producing unique, high-fidelity brand assets for ads.', tags: ['Creative', 'Assets'] },
  { id: 'BRAND_DNA', mode: 'DESIGN', title: 'Brand DNA', mission: 'Instantly extracts core identity markers—including colors, typography, and archetype—from any URL to ensure total visual consistency in new assets.', input: 'Target Website URL', output: 'Structured Identity Matrix', useCase: 'Ensuring new assets match a client\'s existing brand.', tags: ['Extraction', 'Branding'] },
  { id: 'MOCKUPS_4K', mode: 'DESIGN', title: 'Mockup Studio', mission: 'A commercial visualization forge that creates photorealistic 4K renders of products or services in premium environment settings.', input: 'Asset Plates & Directives', output: 'Premium Studio Renders', useCase: 'Providing visual proof of brand transformation.', tags: ['Product', '3D'] },
  { id: 'PRODUCT_SYNTHESIS', mode: 'DESIGN', title: 'Offer Architecture', mission: 'Synthesizes market data and client capabilities into high-ticket service bundles, defining price points and value-stack hierarchies.', input: 'Service Data & Niche Context', output: 'Structured Value Diagram', useCase: 'Re-engineering low-value offers into high-ticket sales.', tags: ['Offer', 'Design'] },
  { id: 'CONTENT_IDEATION', mode: 'DESIGN', title: 'Content Ideation', mission: 'A high-volume brainstorming engine that generates hundreds of creative hooks, viral themes, and editorial concepts for multi-platform social media.', input: 'Strategy Brief & Niche Data', output: 'Categorized Idea Matrix', useCase: 'Planning comprehensive editorial and social calendars.', tags: ['Viral', 'Ideas'] },
  { id: 'ASSET_LIBRARY', mode: 'DESIGN', title: 'Media Vault', mission: 'The persistent, locally-synchronized repository for every piece of content—images, videos, and scripts—created within the Prospector OS ecosystem.', input: 'Generated Project Assets', output: 'Categorized Media Reservoir', useCase: 'Digital asset management and archival.', tags: ['Storage', 'Management'] },

  // --- MEDIA ZONE ---
  { id: 'VIDEO_PRODUCTION', mode: 'MEDIA', title: 'Video Studio', mission: 'An ultra-high-resolution cinematic synthesis engine that converts text prompts and reference frames into professional video advertisements.', input: 'Cinematic Narrative & Ref Frames', output: 'High-Fidelity MP4 Payloads', useCase: 'Scalable production of short-form video ads.', tags: ['Motion', 'Veo'] },
  { id: 'SONIC_STUDIO', mode: 'MEDIA', title: 'Sonic Studio', mission: 'A comprehensive audio engineering lab for generating studio-quality voiceovers, background music, and original brand soundtracks.', input: 'Script, Genre, & Vocal Tones', output: 'PCM Audio / MP3 Files', useCase: 'Adding professional audio to videos and proposals.', tags: ['Audio', 'Suno'] },
  { id: 'MEETING_NOTES', mode: 'MEDIA', title: 'Note Scribe', mission: 'A high-speed transcription and synthesis engine that converts raw meeting audio or text into executive summaries and actionable mission checklists.', input: 'Raw Meeting Audio or Text', output: 'Executive Scribe Report', useCase: 'Post-meeting synchronization and task tracking.', tags: ['Workflow', 'Scribe'] },

  // --- OUTREACH ZONE ---
  { id: 'CAMPAIGN_ORCHESTRATOR', mode: 'OUTREACH', title: 'Campaign Architect', mission: 'The master engine for end-to-end campaign deployment. It synchronizes strategy, copy, visuals, and audio into a unified outreach machine.', input: 'Intelligence Dossier & Assets', output: 'Complete Campaign Suite', useCase: 'Launching full-scale agency service packages.', tags: ['Sales', 'Automation'] },
  { id: 'PROPOSALS', mode: 'OUTREACH', title: 'Proposal Builder', mission: 'Generates high-conversion, interactive sales blueprints delivered via secure "Magic Links," optimized for high-ticket closing scenarios.', input: 'Value Data & Deal Parameters', output: 'Interactive Sales Proposal', useCase: 'Closing complex, high-value agency agreements.', tags: ['Closing', 'Copy'] },
  { id: 'ROI_CALCULATOR', mode: 'OUTREACH', title: 'Value Projector', mission: 'A logic-based mathematical modeler that quantifies the projected financial impact and revenue lift of your AI transformation services.', input: 'LTV, Lead Volume, & Conv Rates', output: 'Projected ROI Report', useCase: 'Justifying high-ticket service fees to skeptics.', tags: ['Finance', 'Logic'] },
  { id: 'SEQUENCER', mode: 'OUTREACH', title: 'Outreach Builder', mission: 'Architects multi-day, multi-channel engagement flows designed to maintain continuous presence across Email, LinkedIn, and SMS.', input: 'Core Strategy & Narrative', output: 'Engagement Sequence Schedule', useCase: 'Automating the top-of-funnel outreach process.', tags: ['Drip', 'Email'] },
  { id: 'AI_CONCIERGE', mode: 'OUTREACH', title: 'Virtual Agent', mission: 'An interactive proof-of-concept for autonomous customer engagement. It demonstrates how an AI agent can handle inquiries and book meetings 24/7.', input: 'Agency/Business Knowledge Base', output: 'Nurture Dialogue Simulation', useCase: 'Demonstrating AI service value in a live environment.', tags: ['Agent', 'Demo'] },
  { id: 'ELEVATOR_PITCH', mode: 'OUTREACH', title: 'Pitch Generator', mission: 'Crafts high-impact, 30-second introductory scripts designed to rapidly communicate value and capture interest during cold outreach.', input: 'Business Profile & Offer DNA', output: 'Short-Form Value Script', useCase: 'Cold calling and introductory messaging.', tags: ['Hook', 'Intro'] },
  { id: 'FUNNEL_MAP', mode: 'OUTREACH', title: 'Funnel Mapper', mission: 'Visualizes the conversion geometry and intent journey for a campaign, mapping every step from initial ad to finalized contract.', input: 'Operational Logic & Conversion Goals', output: 'Visual Funnel Flowchart', useCase: 'Analyzing and optimizing conversion pathways.', tags: ['Map', 'Logic'] }
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

  const zones: { id: MainMode | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'MASTER_INDEX' },
    { id: 'RESEARCH', label: 'RESEARCH' },
    { id: 'DESIGN', label: 'DESIGN' },
    { id: 'MEDIA', label: 'MEDIA' },
    { id: 'OUTREACH', label: 'OUTREACH' },
    { id: 'ADMIN', label: 'ADMIN' }
  ];

  return (
    <div className="max-w-[1700px] mx-auto py-12 px-6 space-y-16 animate-in fade-in duration-1000 pb-40">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-2 border-emerald-500/20 pb-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="space-y-6 max-w-4xl relative z-10">
           <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official System Registry</span>
           </div>
           <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
             SYSTEM <span className="text-emerald-500 italic">MANUAL</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium leading-relaxed font-serif italic max-w-3xl">
             Explore the comprehensive library of Prospector OS capabilities. Every neural node and strategic module is documented below for agency mastery.
           </p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-3xl p-6 border-2 border-slate-800 rounded-[32px] flex flex-col md:flex-row gap-6 items-center shadow-2xl">
         <div className="flex-1 w-full relative">
            <input 
              value={filter} onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-[#0b1021] border border-slate-800 rounded-2xl px-12 py-5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all shadow-inner placeholder-slate-700"
              placeholder="SEARCH THE SYSTEM REGISTRY..."
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </div>
         <div className="flex bg-[#0b1021] border border-slate-800 rounded-2xl p-1 overflow-x-auto no-scrollbar max-w-full shadow-lg">
            {zones.map(z => (
              <button 
                key={z.id} 
                onClick={() => setActiveZone(z.id)} 
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeZone === z.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
              >
                {z.label}
              </button>
            ))}
         </div>
      </div>

      {/* MODULE GRID - UPDATED TO 3 COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
         {filtered.length === 0 ? (
           <div className="col-span-full py-40 text-center opacity-30 border-2 border-dashed border-slate-800 rounded-[56px] flex flex-col items-center justify-center">
              <span className="text-6xl mb-6">🔍</span>
              <h3 className="text-xl font-black uppercase tracking-[0.4em] text-slate-500 italic">No Registry Match Found</h3>
           </div>
         ) : filtered.map(m => (
           <div key={m.id} onClick={() => onNavigate(m.mode, m.id)} className="bg-[#0b1021] border-2 border-slate-800/80 rounded-[48px] p-10 flex flex-col group hover:border-emerald-500/50 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
              {/* Background ID Watermark */}
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-9xl font-black italic select-none group-hover:opacity-10 transition-opacity">
                {m.id.slice(0, 2)}
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                 <span className="px-3 py-1 bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest">{m.mode}</span>
                 <div className="flex flex-wrap gap-1.5 justify-end">
                    {m.tags.map(t => <span key={t} className="text-[7px] font-bold text-slate-600 uppercase border border-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">{t}</span>)}
                 </div>
              </div>

              <div className="mb-8 relative z-10 flex-1">
                 <h3 className="text-xl font-black italic text-white uppercase tracking-tighter leading-none group-hover:text-emerald-400 transition-colors">{m.title}</h3>
                 <p className="text-sm text-slate-400 font-medium italic mt-4 leading-relaxed">"{m.mission}"</p>
              </div>

              <div className="space-y-4 mt-auto relative z-10">
                 <div className="p-5 bg-slate-950/60 rounded-3xl border border-slate-800 group-hover:border-emerald-500/30 transition-all">
                    <span className="text-[8px] font-black text-slate-600 uppercase block mb-1.5 tracking-widest">INTELLIGENCE SOURCE</span>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate">{m.input}</p>
                 </div>
                 <div className="pt-6 border-t border-slate-800/60 group-hover:border-emerald-500/30 transition-colors">
                    <span className="text-[8px] font-black text-slate-600 uppercase block mb-1.5 tracking-widest">ENTERPRISE USE-CASE</span>
                    <p className="text-[11px] font-black text-white uppercase italic tracking-tight">{m.useCase}</p>
                 </div>
              </div>

              {/* Decorative architectural markers */}
              <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-slate-800 group-hover:border-emerald-500/30 transition-colors"></div>
              <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-slate-800 group-hover:border-emerald-500/30 transition-colors"></div>
           </div>
         ))}
      </div>
      
      {/* FOOTER CALL TO ACTION */}
      <div className="bg-[#0b1021] border-2 border-emerald-500/20 rounded-[84px] p-20 text-center space-y-10 shadow-[0_0_50px_rgba(16,185,129,0.05)] relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
         <div className="space-y-6 relative z-10">
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
              NEED <span className="text-emerald-500">ASSISTANCE?</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto italic font-serif">
              Master the Prospector OS workflow to maximize agency efficiency. Our technical advisors are available in the Strategy Lab for custom queries.
            </p>
         </div>
         <div className="flex flex-col md:flex-row justify-center items-center gap-6 relative z-10">
            <button 
               onClick={() => onNavigate('RESEARCH', 'EXECUTIVE_DASHBOARD')}
               className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all border-b-4 border-emerald-800"
            >
               Return to Mission Control
            </button>
         </div>
      </div>
    </div>
  );
};
