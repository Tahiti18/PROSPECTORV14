
import React, { useState } from 'react';
import { MainMode, SubModule } from '../../types';

interface SystemProtocolProps {
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
  {
    id: 'EXECUTIVE_DASHBOARD',
    mode: 'RESEARCH',
    title: 'EXECUTIVE DASHBOARD',
    mission: 'Central nerve center for theater operations.',
    input: 'Lead Ledger, System Stats',
    output: 'Aggregate Dashboard',
    useCase: 'Daily situational awareness.',
    tags: ['Core', 'Ops']
  },
  {
    id: 'MARKET_DISCOVERY',
    mode: 'RESEARCH',
    title: 'LEAD DISCOVERY',
    mission: 'Deep research to identify high-ticket prospects.',
    input: 'Region, Niche Keywords',
    output: 'JSON Lead Array',
    useCase: 'Target acquisition.',
    tags: ['Intelligence', 'Search']
  },
  {
    id: 'AUTOMATED_SEARCH',
    mode: 'RESEARCH',
    title: 'AUTO SEARCH SWARM',
    mission: 'Autonomous agent-driven signal extraction.',
    input: 'Vulnerability Directives',
    output: 'Live Lead Feed',
    useCase: 'High-velocity lead gen.',
    tags: ['Automation', 'Signal']
  },
  {
    id: 'BENCHMARK',
    mode: 'RESEARCH',
    title: 'REVERSE ENGINEER HUB',
    mission: 'Exhaustive deconstruction of competitor digital stacks.',
    input: 'Target URL',
    output: 'Technical Audit Report',
    useCase: 'Competitive edge research.',
    tags: ['Analysis', 'Reverse-Eng']
  },
  {
    id: 'VISUAL_ANALYSIS',
    mode: 'RESEARCH',
    title: 'VISION INTEL LAB',
    mission: 'Multi-modal analysis of static brand assets.',
    input: 'Image Plate, Neural Directive',
    output: 'Feature/Sentiment Matrix',
    useCase: 'Site screenshot audit.',
    tags: ['Vision', 'Research']
  },
  {
    id: 'VISUAL_STUDIO',
    mode: 'DESIGN',
    title: 'CREATIVE STUDIO',
    mission: 'High-fidelity brand asset generation.',
    input: 'Style Guide, Text Prompt',
    output: '4K Diffusion Render',
    useCase: 'On-brand imagery.',
    tags: ['Production', 'Image']
  },
  {
    id: 'VIDEO_PRODUCTION',
    mode: 'MEDIA',
    title: 'VEO VIDEO FORGE',
    mission: 'Cinematic video synthesis for high-ticket ads.',
    input: 'Cinematic Prompt, Start Frame',
    output: 'MP4 Cinematic Sequence',
    useCase: 'Social ad production.',
    tags: ['Motion', 'Veo']
  },
  {
    id: 'SONIC_STUDIO',
    mode: 'MEDIA',
    title: 'SONIC STUDIO',
    mission: 'Neural audio synthesis and branding.',
    input: 'Lyrics, Genre, Voice Model',
    output: 'PCM Audio / MP3',
    useCase: 'Commercial beds & VO.',
    tags: ['Audio', 'Suno']
  },
  {
    id: 'CAMPAIGN_ORCHESTRATOR',
    mode: 'OUTREACH',
    title: 'CAMPAIGN FORGE',
    mission: 'Multi-layered strategic campaign construction.',
    input: 'Target Intelligence, Brand DNA',
    output: 'Orchestrated Dossier',
    useCase: 'Full agency service setup.',
    tags: ['Sales', 'Strategy']
  },
  {
    id: 'PROPOSALS',
    mode: 'OUTREACH',
    title: 'PROPOSAL ARCHITECT',
    mission: 'AI-driven high-conversion sales blueprints.',
    input: 'Lead Vulnerability Data',
    output: 'Interactive Magic Link',
    useCase: 'Closing high-ticket deals.',
    tags: ['Closing', 'Copy']
  },
  {
    id: 'ROI_CALCULATOR',
    mode: 'OUTREACH',
    title: 'ROI PROJECTION',
    mission: 'Mathematical valuation of AI transformation.',
    input: 'LTV, Conv Rate, Volume',
    output: 'Monetization Report',
    useCase: 'Justifying premium fees.',
    tags: ['Logic', 'Finance']
  },
  {
    id: 'BRAND_DNA',
    mode: 'DESIGN',
    title: 'BRAND DNA EXTRACTOR',
    mission: 'Establish visual/tonal core from existing sites.',
    input: 'Source URL',
    output: 'Identity Matrix',
    useCase: 'Onboarding new clients.',
    tags: ['Extraction', 'Branding']
  },
  {
    id: 'TIMELINE',
    mode: 'ADMIN',
    title: 'OPERATIONS TIMELINE',
    mission: 'Historical operational timeline tracking.',
    input: 'System Event Stream',
    output: 'Audit Trail',
    useCase: 'Operational transparency.',
    tags: ['Ops', 'Reporting']
  },
  {
    id: 'NEXUS_GRAPH',
    mode: 'ADMIN',
    title: 'NEXUS ENTITY GRAPH',
    mission: 'Visual relationship mapping of theater data.',
    input: 'Lead Ledger',
    output: 'Force-Directed Graph',
    useCase: 'Network effect analysis.',
    tags: ['Data', 'Network']
  },
  {
    // Fix: changed 'SYSTEM_OVERVIEW' to 'USER_GUIDE' to match SubModule type requirements
    id: 'USER_GUIDE',
    mode: 'RESEARCH',
    title: 'SYSTEM OVERVIEW',
    mission: 'Documentation of all operational nodes.',
    input: 'Registry',
    output: 'Knowledge Base',
    useCase: 'Mastering OS capabilities.',
    tags: ['Core', 'Reference']
  }
];

export const SystemProtocol: React.FC<SystemProtocolProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState('');
  const [activeZone, setActiveZone] = useState<MainMode | 'ALL'>('ALL');

  const filtered = MODULE_REGISTRY.filter(m => 
    (activeZone === 'ALL' || m.mode === activeZone) &&
    (m.title.toLowerCase().includes(filter.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(filter.toLowerCase())))
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
    <div className="max-w-[1600px] mx-auto py-12 px-6 space-y-16 animate-in fade-in duration-1000">
      
      {/* HERO SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-10 border-b border-slate-800 pb-16 relative">
        <div className="space-y-6 max-w-3xl">
           <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Operational Intelligence Database</span>
           </div>
           <h1 className="text-7xl font-black italic text-white uppercase tracking-tighter leading-none">
             SYSTEM <span className="text-emerald-500 not-italic">OVERVIEW</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium leading-relaxed font-serif italic">
             The comprehensive architectural manual for Prospector OS. Every module, every vector, documented for enterprise agency mastery.
           </p>
        </div>
        <div className="shrink-0">
           <div className="w-48 h-48 bg-slate-900 border-2 border-slate-800 rounded-[48px] flex items-center justify-center text-8xl grayscale opacity-20 rotate-12 shadow-2xl">
              📖
           </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-3xl p-6 border border-slate-800 rounded-[32px] flex flex-col md:flex-row gap-6 items-center shadow-2xl">
         <div className="flex-1 w-full relative">
            <input 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-[#0b1021] border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder-slate-700 outline-none focus:border-emerald-500 transition-all shadow-inner"
              placeholder="SEARCH MODULE SIGNATURES (e.g. 'analytics', 'research')..."
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700">⌘F</div>
         </div>
         <div className="flex bg-[#0b1021] border border-slate-800 rounded-2xl p-1 shrink-0 overflow-x-auto no-scrollbar max-w-full">
            {zones.map(z => (
              <button 
                key={z.id}
                onClick={() => setActiveZone(z.id)}
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeZone === z.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
              >
                {z.label}
              </button>
            ))}
         </div>
      </div>

      {/* MODULE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filtered.length === 0 ? (
           <div className="col-span-full py-40 text-center opacity-30 border-2 border-dashed border-slate-800 rounded-[56px]">
              <h3 className="text-2xl font-black uppercase tracking-[0.4em] text-slate-500 italic">No Registry Match</h3>
           </div>
         ) : filtered.map(m => (
           <div 
             key={m.id} 
             onClick={() => onNavigate(m.mode, m.id)}
             className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 flex flex-col group hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden shadow-2xl"
           >
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-9xl font-black italic select-none group-hover:opacity-10 transition-opacity">
                {m.id.slice(0, 1)}
              </div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <span className="px-3 py-1 bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest">{m.mode}</span>
                 <div className="flex gap-2">
                    {m.tags.map(t => <span key={t} className="text-[7px] font-bold text-slate-600 uppercase tracking-widest border border-slate-800 px-2 py-0.5 rounded-full">{t}</span>)}
                 </div>
              </div>

              <div className="mb-10 relative z-10">
                 <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none group-hover:text-emerald-500 transition-colors">{m.title}</h3>
                 <p className="text-sm text-slate-400 font-medium italic mt-3 leading-relaxed">"{m.mission}"</p>
              </div>

              <div className="space-y-6 mt-auto relative z-10">
                 <div className="p-5 bg-slate-950/50 rounded-3xl border border-slate-800 group-hover:border-emerald-500/20 transition-all">
                    <div className="flex justify-between mb-2">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">INPUT_SCHEMA</span>
                       <span className="text-[8px] font-black text-emerald-400">READY</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate">{m.input}</p>
                 </div>
                 
                 <div className="p-5 bg-slate-950/50 rounded-3xl border border-slate-800 group-hover:border-emerald-500/20 transition-all">
                    <div className="flex justify-between mb-2">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OUTPUT</span>
                       <span className="text-[8px] font-black text-emerald-400">SYNCED</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate">{m.output}</p>
                 </div>

                 <div className="pt-6 border-t border-slate-800 group-hover:border-emerald-500/20">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-2">ENTERPRISE USE-CASE</span>
                    <p className="text-11px font-black text-white uppercase italic tracking-tight">{m.useCase}</p>
                 </div>
              </div>

              <div className="absolute bottom-8 right-10 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                 <span className="text-emerald-500 text-2xl">→</span>
              </div>
           </div>
         ))}
      </div>

      {/* FOOTER NOTICE */}
      <div className="bg-[#05091a] border border-slate-800 rounded-[56px] p-16 flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="space-y-4 max-w-xl">
            <h4 className="text-xl font-black italic text-white uppercase tracking-tighter">TECHNICAL ADVISORY</h4>
            <p className="text-sm text-slate-500 leading-relaxed uppercase font-bold tracking-widest italic">
              ALL MODULES ARE OPTIMIZED FOR ENTERPRISE WORKFLOWS.
              MEDIA ASSETS ARE RENDERED VIA HIGH-PERFORMANCE CLOUD NODES.
            </p>
         </div>
         <div className="flex gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">OPERATIONAL_READY</span>
         </div>
      </div>

    </div>
  );
};
