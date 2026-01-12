
import React, { useState } from 'react';
import { MainMode, SubModule } from '../../types';

interface CapabilityGuideProps {
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
  { id: 'EXECUTIVE_DASHBOARD', mode: 'RESEARCH', title: 'EXECUTIVE DASHBOARD', mission: 'Operational nerve center for agency activities.', input: 'Market Ledger, System Health', output: 'Unified Analytics View', useCase: 'High-level situational awareness.', tags: ['Core', 'Management'] },
  { id: 'MARKET_DISCOVERY', mode: 'RESEARCH', title: 'MARKET DISCOVERY', mission: 'Identifies high-value prospects within specific regions.', input: 'Geography, Industry Focus', output: 'Verified Lead Database', useCase: 'Target business expansion.', tags: ['Research', 'Leads'] },
  { id: 'STRATEGY_CENTER', mode: 'RESEARCH', title: 'STRATEGY HUB', mission: 'Deep-dive analysis of individual client opportunities.', input: 'Prospect Identity', output: 'Transformation Roadmap', useCase: 'Personalized sales engineering.', tags: ['Strategy', 'Audit'] },
  { id: 'VISUAL_STUDIO', mode: 'DESIGN', title: 'VISUAL STUDIO', mission: 'Generates high-fidelity brand imagery and assets.', input: 'Style Guidelines, Prompts', output: '4K Commercial Renders', useCase: 'High-end visual branding.', tags: ['Creative', 'Assets'] },
  { id: 'VIDEO_PRODUCTION', mode: 'MEDIA', title: 'VIDEO PRODUCTION', mission: 'High-resolution cinematic synthesis for digital ads.', input: 'Cinematic Directives, Scripts', output: 'Commercial Video Files', useCase: 'Social media ad campaigns.', tags: ['Motion', 'Production'] },
  { id: 'CAMPAIGN_ORCHESTRATOR', mode: 'OUTREACH', title: 'CAMPAIGN ENGINE', mission: 'End-to-end orchestration of marketing campaigns.', input: 'Strategy Brief, Asset Pack', output: 'Deployable Outreach Suite', useCase: 'Scaling agency client success.', tags: ['Sales', 'Automation'] },
  { id: 'ROI_CALCULATOR', mode: 'OUTREACH', title: 'ROI MODELER', mission: 'Financial projection of business transformation.', input: 'LTV, Conversions, Volume', output: 'Investment Analysis', useCase: 'Justifying premium service fees.', tags: ['Finance', 'Value'] },
  // Fix: changed 'SYSTEM_OVERVIEW' to 'USER_GUIDE' to satisfy SubModule type requirements
  { id: 'USER_GUIDE', mode: 'RESEARCH', title: 'CAPABILITY GUIDE', mission: 'Exhaustive documentation of the OS feature set.', input: 'Internal Registry', output: 'Feature Knowledge Base', useCase: 'System mastery and onboarding.', tags: ['Manual', 'Reference'] }
];

export const CapabilityGuide: React.FC<CapabilityGuideProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState('');
  const [activeZone, setActiveZone] = useState<MainMode | 'ALL'>('ALL');

  const filtered = MODULE_REGISTRY.filter(m => 
    (activeZone === 'ALL' || m.mode === activeZone) &&
    (m.title.toLowerCase().includes(filter.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(filter.toLowerCase())))
  );

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 space-y-16 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-center gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6 max-w-3xl">
           <h1 className="text-7xl font-black italic text-white uppercase tracking-tighter leading-none">
             CAPABILITY <span className="text-emerald-500 not-italic">GUIDE</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium leading-relaxed font-serif italic">
             The official architectural manual for Prospector OS. Every operational module documented for enterprise mastery.
           </p>
        </div>
        <div className="w-48 h-48 bg-slate-900 border-2 border-slate-800 rounded-[48px] flex items-center justify-center text-8xl grayscale opacity-20">📘</div>
      </div>

      <div className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-3xl p-6 border border-slate-800 rounded-[32px] flex flex-col md:flex-row gap-6 items-center shadow-2xl">
         <input 
           value={filter} onChange={(e) => setFilter(e.target.value)}
           className="flex-1 w-full bg-[#0b1021] border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all"
           placeholder="SEARCH SOLUTION CATALOG (e.g. 'analytics', 'video')..."
         />
         <div className="flex bg-[#0b1021] border border-slate-800 rounded-2xl p-1 overflow-x-auto no-scrollbar">
            {['ALL', 'RESEARCH', 'DESIGN', 'MEDIA', 'OUTREACH', 'ADMIN'].map(z => (
              <button key={z} onClick={() => setActiveZone(z as any)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeZone === z ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{z}</button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filtered.map(m => (
           <div key={m.id} onClick={() => onNavigate(m.mode, m.id)} className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 flex flex-col group hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <span className="px-3 py-1 bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest">{m.mode}</span>
                 <div className="flex gap-2">{m.tags.map(t => <span key={t} className="text-[7px] font-bold text-slate-600 uppercase border border-slate-800 px-2 py-0.5 rounded-full">{t}</span>)}</div>
              </div>
              <div className="mb-10 relative z-10">
                 <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none group-hover:text-emerald-500 transition-colors">{m.title}</h3>
                 <p className="text-sm text-slate-400 font-medium italic mt-3 leading-relaxed">"{m.mission}"</p>
              </div>
              <div className="space-y-6 mt-auto relative z-10">
                 <div className="p-5 bg-slate-950/50 rounded-3xl border border-slate-800 group-hover:border-emerald-500/20">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">INPUT DATA</span>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate">{m.input}</p>
                 </div>
                 <div className="p-5 bg-slate-950/50 rounded-3xl border border-slate-800 group-hover:border-emerald-500/20">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">SOLUTION OUTCOME</span>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate">{m.output}</p>
                 </div>
                 <div className="pt-6 border-t border-slate-800">
                    <span className="text-[8px] font-black text-slate-600 uppercase block mb-1">ENTERPRISE USE-CASE</span>
                    <p className="text-11px font-black text-white uppercase italic tracking-tight">{m.useCase}</p>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
