
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { SESSION_ASSETS, orchestrateBusinessPackage } from '../../services/geminiService';
import { dossierStorage } from '../../services/dossierStorage';
import { OutreachModal } from './OutreachModal';
import { toast } from '../../services/toastManager';
import { FormattedOutput } from '../common/FormattedOutput';

interface CampaignOrchestratorProps {
  leads: Lead[];
  lockedLead?: Lead;
  onNavigate: (mode: MainMode, mod: SubModule) => void;
  onLockLead: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

export const CampaignOrchestrator: React.FC<CampaignOrchestratorProps> = ({ leads, lockedLead, onNavigate, onLockLead, onUpdateLead }) => {
  const [packageData, setPackageData] = useState<any>(null);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'narrative' | 'content' | 'outreach' | 'visual' | 'funnel'>('strategy');
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  
  const leadAssets = useMemo(() => {
    if (!lockedLead) return [];
    return SESSION_ASSETS.filter(a => a.leadId === lockedLead.id);
  }, [lockedLead]);

  useEffect(() => {
    if (lockedLead) {
      const savedDossiers = dossierStorage.getAllByLead(lockedLead.id);
      if (savedDossiers.length > 0) {
        setPackageData(savedDossiers[0].data);
      } else {
        setPackageData(null);
      }
    }
  }, [lockedLead?.id]);

  const handleOrchestrate = async () => {
    if (!lockedLead) {
        toast.info("Target identification required.");
        return;
    }
    setIsOrchestrating(true);
    setPackageData(null); 
    
    try {
      toast.neural("FORGE: Initiating High-Density Intelligence Sweep...");
      const result = await orchestrateBusinessPackage(lockedLead, leadAssets);
      
      dossierStorage.save(lockedLead, result, leadAssets.map(a => a.id));
      setPackageData(result);
      toast.success("FORGE: Multi-Tab Intelligence Mesh Synchronized.");
    } catch (e: any) {
      console.error(e);
      toast.error(`NEURAL_FAULT: ${e.message || "Uplink timed out."}`);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handleLocalSelect = (id: string) => {
    if (!id) return;
    onLockLead(id);
  };

  if (!lockedLead) {
      return (
          <div className="max-w-4xl mx-auto py-40 text-center space-y-12 animate-in fade-in duration-700">
              <span className="text-8xl block grayscale opacity-20">🎯</span>
              <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Mission Target Selection</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] max-w-sm mx-auto">
                      Establish a primary prospect to initialize the high-density campaign forge.
                  </p>
              </div>
              <div className="max-w-md mx-auto">
                 <select 
                    onChange={(e) => handleLocalSelect(e.target.value)}
                    className="w-full bg-[#0b1021] border-2 border-slate-800 rounded-2xl px-6 py-5 text-sm font-bold text-slate-400 focus:border-emerald-500 outline-none appearance-none cursor-pointer uppercase italic text-center"
                 >
                    <option value="">-- SELECT TARGET FROM LEDGER --</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
                 </select>
                 <button 
                    onClick={() => onNavigate('RESEARCH', 'PROSPECT_DATABASE')}
                    className="mt-6 text-[9px] font-black text-slate-600 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                 >
                    OR OPEN MASTER LEDGER
                 </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-8 space-y-10 animate-in fade-in duration-700">
      
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
            CAMPAIGN <span className="text-emerald-500 not-italic">FORGE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            SECURED NEURAL CORE GATEWAY: {lockedLead.businessName.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-4">
            <select 
                value={lockedLead.id}
                onChange={(e) => handleLocalSelect(e.target.value)}
                className="bg-[#0b1021] border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-slate-400 uppercase outline-none focus:border-emerald-500"
            >
                {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
            </select>
            <button 
                onClick={handleOrchestrate}
                disabled={isOrchestrating}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800"
            >
                {isOrchestrating ? 'ORCHESTRATING...' : 'INITIATE CAMPAIGN FORGE'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] min-h-[700px] flex flex-col shadow-2xl relative overflow-hidden">
              {isOrchestrating && (
                 <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-8 p-20 text-center animate-in fade-in">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-emerald-900 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">NEURAL FORGE ACTIVE</h3>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.6em] animate-pulse">ARCHITECTING EXHAUSTIVE INTELLIGENCE MESH</p>
                    </div>
                 </div>
              )}

              {!packageData && !isOrchestrating ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 text-center space-y-6">
                    <span className="text-9xl font-black italic text-slate-700 uppercase tracking-tighter">STANDBY</span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em]">CLICK INITIATE FORGE ABOVE TO START</p>
                 </div>
              ) : (
                 <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
                    <div className="flex border-b border-slate-800 bg-slate-900/50">
                       {[
                         { id: 'strategy', label: 'STRATEGY' },
                         { id: 'narrative', label: 'NARRATIVE' },
                         { id: 'content', label: 'CONTENT' },
                         { id: 'funnel', label: 'FUNNEL' },
                         { id: 'outreach', label: 'OUTREACH' },
                         { id: 'visual', label: 'VISUALS' }
                       ].map(tab => (
                         <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id as any)}
                           className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                             activeTab === tab.id 
                               ? 'bg-emerald-600/10 text-emerald-400 border-b-2 border-emerald-500' 
                               : 'text-slate-500 hover:text-white hover:bg-slate-900'
                           }`}
                         >
                           {tab.label}
                         </button>
                       ))}
                    </div>

                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#020617]">
                       {activeTab === 'strategy' && (
                          <div className="space-y-10">
                             <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{packageData?.presentation?.title || "STRATEGY Blueprint"}</h2>
                             {packageData?.presentation?.slides ? (
                                <div className="grid gap-6">
                                    {packageData.presentation.slides.map((s: any, i: number) => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] group hover:border-emerald-500/30 transition-all">
                                        <h3 className="text-xl font-bold text-white uppercase mb-4">#{i+1}: {s?.title || 'Segment'}</h3>
                                        <ul className="space-y-3">
                                            {(s?.bullets || []).map((b: string, j: number) => (
                                            <li key={j} className="text-sm text-slate-400 flex items-start gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                                                {b}
                                            </li>
                                            ))}
                                        </ul>
                                    </div>
                                    ))}
                                </div>
                             ) : <FormattedOutput content={JSON.stringify(packageData)} />}
                          </div>
                       )}

                       {activeTab === 'narrative' && (
                          <div className="bg-slate-900 border border-slate-800 p-12 rounded-[40px] shadow-inner">
                             <h3 className="text-[10px] font-black text-emerald-500 uppercase mb-8 tracking-widest flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                EXECUTIVE_NARRATIVE
                             </h3>
                             <FormattedOutput content={packageData?.narrative || "Synthesis pending."} />
                          </div>
                       )}

                       {activeTab === 'outreach' && (
                          <div className="space-y-8">
                             {packageData?.outreach?.emailSequence ? (
                                packageData.outreach.emailSequence.map((e: any, i: number) => (
                                   <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4 shadow-xl">
                                       <div className="flex justify-between items-center">
                                           <p className="text-sm font-bold text-white uppercase tracking-tight">
                                           <span className="text-slate-500 font-black">SUBJECT:</span> {e?.subject || "Draft"}
                                           </p>
                                           <span className="text-[9px] font-black text-emerald-500 px-2 py-1 bg-emerald-900/20 rounded">EMAIL_{i+1}</span>
                                       </div>
                                       <FormattedOutput content={e?.body} />
                                   </div>
                                ))
                             ) : <FormattedOutput content={JSON.stringify(packageData?.outreach)} />}
                          </div>
                       )}

                       {activeTab === 'funnel' && (
                          <div className="space-y-8">
                            {packageData?.funnel ? (
                                packageData.funnel.map((f: any, i: number) => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] flex items-center gap-8 group hover:border-emerald-500/30 transition-all">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black italic">{i+1}</div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-black text-white uppercase tracking-widest">{f.title}</h4>
                                            <p className="text-sm text-slate-500 mt-1">{f.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black text-emerald-500 uppercase block">GOAL</span>
                                            <span className="text-xs font-bold text-white uppercase">{f.conversionGoal}</span>
                                        </div>
                                    </div>
                                ))
                            ) : <FormattedOutput content={JSON.stringify(packageData?.funnel)} />}
                          </div>
                       )}

                       {activeTab === 'visual' && (
                          <div className="space-y-8">
                            <div className="bg-emerald-950/20 border border-emerald-500/20 p-8 rounded-[32px]">
                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">MOOD & ART DIRECTION</h4>
                                <FormattedOutput content={packageData?.visualDirection?.brandMood} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {packageData?.visualDirection?.aiImagePrompts?.map((p: any, i: number) => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                                        <span className="text-[9px] font-black text-slate-500 uppercase">{p.use_case} PROMPT</span>
                                        <p className="text-[10px] text-emerald-400 font-mono italic leading-relaxed">"{p.prompt}"</p>
                                    </div>
                                ))}
                            </div>
                          </div>
                       )}

                       {activeTab === 'content' && (
                          <div className="space-y-6">
                            {packageData?.contentPack ? (
                                packageData.contentPack.map((c: any, i: number) => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4">
                                        <span className="px-3 py-1 bg-emerald-900/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{c.platform} // {c.type}</span>
                                        <p className="text-slate-300 text-sm italic">"{c.caption}"</p>
                                    </div>
                                ))
                            ) : <FormattedOutput content={JSON.stringify(packageData?.contentPack)} />}
                          </div>
                       )}
                    </div>
                    
                    <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                        <button 
                            onClick={() => setIsOutreachOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95"
                        >
                            DEPLOY OUTREACH HUB
                        </button>
                    </div>
                 </div>
              )}
           </div>
      </div>

      {packageData && lockedLead && (
        <OutreachModal 
          isOpen={isOutreachOpen}
          onClose={() => setIsOutreachOpen(false)}
          dossier={{ data: packageData }}
          lead={lockedLead}
          onUpdateLead={onUpdateLead}
        />
      )}
    </div>
  );
};
