import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { SESSION_ASSETS, orchestrateBusinessPackage, saveAsset, AssetRecord } from '../../services/geminiService';
import { dossierStorage, StrategicDossier } from '../../services/dossierStorage';
import { OutreachModal } from './OutreachModal';

interface BusinessOrchestratorProps {
  leads: Lead[];
  lockedLead?: Lead;
  onNavigate: (mode: MainMode, mod: SubModule) => void;
  onLockLead: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

export const BusinessOrchestrator: React.FC<BusinessOrchestratorProps> = ({ leads, lockedLead, onNavigate, onLockLead, onUpdateLead }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lockedLead?.id || '');
  const [packageData, setPackageData] = useState<any>(null);
  const [currentDossier, setCurrentDossier] = useState<StrategicDossier | null>(null);
  const [history, setHistory] = useState<StrategicDossier[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'narrative' | 'content' | 'outreach' | 'visual'>('strategy');
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  
  const [refreshKey, setRefreshKey] = useState(0); 

  const targetLead = leads.find(l => l.id === selectedLeadId);
  
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 2000);
    return () => clearInterval(interval);
  }, []);
  
  const leadAssets = useMemo(() => {
    if (!targetLead) return [];
    return SESSION_ASSETS.filter(a => a.leadId === targetLead.id);
  }, [targetLead, refreshKey]);

  const assetCounts = {
    TEXT: leadAssets.filter(a => a.type === 'TEXT').length,
    IMAGE: leadAssets.filter(a => a.type === 'IMAGE').length,
    VIDEO: leadAssets.filter(a => a.type === 'VIDEO').length,
    AUDIO: leadAssets.filter(a => a.type === 'AUDIO').length,
  };

  useEffect(() => {
    if (targetLead) {
      const savedDossiers = dossierStorage.getAllByLead(targetLead.id);
      setHistory(savedDossiers);
      if (savedDossiers.length > 0) {
        setCurrentDossier(savedDossiers[0]);
        setPackageData(savedDossiers[0].data);
      } else {
        setCurrentDossier(null);
        setPackageData(null);
      }
    }
  }, [targetLead?.id]);

  const handleOrchestrate = async () => {
    if (!targetLead) return;
    setIsOrchestrating(true);
    try {
      const result = await orchestrateBusinessPackage(targetLead, leadAssets);
      if (!result) throw new Error("Empty orchestration result.");
      const saved = dossierStorage.save(targetLead, result, leadAssets.map(a => a.id));
      setPackageData(result);
      setCurrentDossier(saved);
      setHistory(prev => [saved, ...prev]);
    } catch (e: any) {
      console.error(e);
      alert(`Forge Interrupted: ${e.message || "Model timeout. Please retry."}`);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const EmptyState = ({ section }: { section: string }) => (
    <div className="py-20 flex flex-col items-center justify-center opacity-30 border border-dashed border-slate-800 rounded-[32px] text-center px-10">
       <span className="text-4xl mb-4 grayscale">📦</span>
       <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">{section} STAGING</h4>
       <p className="text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs leading-relaxed">
          THE NEURAL CORE HAS RESERVED THIS SPACE. RE-FORGE TO ATTEMPT ASSET POPULATION.
       </p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-8 space-y-10 animate-in fade-in duration-700">
      
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white leading-none">
            CAMPAIGN <span className="text-emerald-500">BUILDER</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            SECURED NEURAL CORE GATEWAY
          </p>
        </div>
        <div className="flex items-center gap-4">
           {currentDossier && (
             <div className="bg-emerald-900/20 border border-emerald-500/20 px-6 py-2 rounded-xl flex items-center gap-3">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">VERSION: V{currentDossier.version}</span>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-1">TARGET_ENTITY</label>
                 <select 
                   value={selectedLeadId}
                   onChange={(e) => setSelectedLeadId(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none uppercase"
                 >
                    <option value="">-- SELECT TARGET --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.businessName}</option>
                    ))}
                 </select>
              </div>

              {targetLead && (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      {Object.entries(assetCounts).map(([type, count]) => (
                        <div key={type} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{type}</span>
                           <span className="text-xl font-black italic text-emerald-400">{count}</span>
                        </div>
                      ))}
                   </div>
                   
                   <button 
                     onClick={handleOrchestrate}
                     disabled={isOrchestrating}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800 mt-2"
                   >
                     {isOrchestrating ? 'ORCHESTRATING...' : 'INITIATE CAMPAIGN FORGE'}
                   </button>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] min-h-[700px] flex flex-col shadow-2xl relative overflow-hidden">
              
              {!packageData ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 text-center space-y-6">
                    <span className="text-8xl grayscale">📁</span>
                    <h3 className="text-4xl font-bold uppercase tracking-tight text-slate-700">NODE STANDBY</h3>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">INITIATE FORGE TO LOAD DATA</p>
                 </div>
              ) : (
                 <div className="flex flex-col h-full animate-in fade-in duration-500">
                    <div className="flex border-b border-slate-800 bg-[#0b1021]">
                       {[
                         { id: 'strategy', label: 'STRATEGY' },
                         { id: 'narrative', label: 'NARRATIVE' },
                         { id: 'content', label: 'CONTENT' },
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

                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar relative bg-[#020617]">
                       {activeTab === 'strategy' && (
                          <div className="space-y-12">
                             {(packageData?.presentation?.slides?.length ?? 0) > 0 ? (
                                <>
                                   <h2 className="text-3xl font-bold text-white uppercase">{packageData?.presentation?.title || "STRATEGY Blueprint"}</h2>
                                   <div className="grid gap-6">
                                      {packageData.presentation.slides.map((slide: any, i: number) => (
                                        <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] group hover:border-emerald-500/30 transition-all">
                                           <h3 className="text-xl font-bold text-white uppercase mb-4">#{i+1}: {slide?.title || 'Segment'}</h3>
                                           <ul className="space-y-2 mb-4">
                                              {(slide?.bullets || []).map((b: string, j: number) => (
                                                <li key={j} className="text-sm text-slate-400 pl-4 border-l-2 border-slate-700 font-medium italic">{b}</li>
                                              ))}
                                           </ul>
                                           {slide?.visualRef && <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest pt-4 border-t border-slate-800">VISUAL_ASSET: {slide.visualRef}</p>}
                                        </div>
                                      ))}
                                   </div>
                                </>
                             ) : <EmptyState section="STRATEGY" />}
                          </div>
                       )}

                       {activeTab === 'visual' && (
                          <div className="space-y-12">
                             {packageData?.visualDirection ? (
                                <>
                                   <div className="bg-slate-900 p-10 rounded-[40px] border border-slate-800 shadow-xl">
                                      <h3 className="text-[10px] font-black text-emerald-500 uppercase mb-4 tracking-widest">BRAND_MOOD</h3>
                                      <p className="text-2xl font-black italic text-white uppercase italic tracking-tight">"{packageData.visualDirection.brandMood || 'Not Defined'}"</p>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div className="space-y-6">
                                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">COLOR_PSYCH</h4>
                                         {(packageData.visualDirection.colorPsychology || []).map((cp: any, i: number) => (
                                            <div key={i} className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                               <div className="w-8 h-8 rounded-full border border-white/10 shadow-lg" style={{ backgroundColor: cp?.color || '#333' }}></div>
                                               <div>
                                                  <p className="text-[10px] font-black text-white">{cp?.color}</p>
                                                  <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{cp?.purpose}</p>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                      <div className="space-y-6">
                                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">NEURAL_PROMPTS</h4>
                                         {(packageData.visualDirection.aiImagePrompts || []).map((p: any, i: number) => (
                                            <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                                               <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">{p?.use_case}</p>
                                               <p className="text-[10px] font-bold text-slate-400 italic">"{p?.prompt}"</p>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                </>
                             ) : <EmptyState section="VISUAL_DNA" />}
                          </div>
                       )}

                       {activeTab === 'narrative' && (
                          <div className="bg-slate-900 p-12 rounded-[40px] border border-slate-800 shadow-xl">
                             <h3 className="text-[10px] font-black text-emerald-500 uppercase mb-8 tracking-widest flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                EXECUTIVE_NARRATIVE
                             </h3>
                             <p className="text-xl text-slate-300 leading-relaxed font-serif italic whitespace-pre-wrap">{packageData?.narrative || "Narrative synthesis pending re-generation..."}</p>
                          </div>
                       )}

                       {activeTab === 'content' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {(packageData?.contentPack?.length ?? 0) > 0 ? (
                                packageData.contentPack.map((post: any, i: number) => (
                                  <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4 hover:border-emerald-500/30 transition-all">
                                     <div className="flex justify-between items-center">
                                        <span className="px-3 py-1 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest">{post?.platform}</span>
                                        <span className="text-[9px] font-black text-slate-600 uppercase">{post?.type}</span>
                                     </div>
                                     <p className="text-sm text-slate-200 font-medium italic leading-relaxed">"{post?.caption}"</p>
                                  </div>
                                ))
                             ) : <EmptyState section="SOCIAL_CONTENT" />}
                          </div>
                       )}

                       {activeTab === 'outreach' && (
                          <div className="space-y-8">
                             {(packageData?.outreach?.emailSequence?.length ?? 0) > 0 ? (
                                <>
                                   {packageData.outreach.emailSequence.map((email: any, i: number) => (
                                     <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-lg">
                                        <p className="text-sm font-bold text-white mb-4 uppercase tracking-tight flex items-center gap-3">
                                           <span className="text-slate-500">SUBJECT:</span> {email?.subject}
                                        </p>
                                        <p className="text-xs text-slate-400 whitespace-pre-wrap font-mono bg-black/20 p-6 rounded-2xl border border-slate-800/50 leading-relaxed">{email?.body}</p>
                                     </div>
                                   ))}
                                   {packageData?.outreach?.linkedin && (
                                      <div className="bg-emerald-900/10 border border-emerald-500/20 p-10 rounded-[32px] shadow-inner">
                                          <h3 className="text-[10px] font-black text-emerald-400 uppercase mb-4 tracking-widest">LINKEDIN_CONNECT</h3>
                                          <p className="text-sm text-slate-200 italic font-medium leading-relaxed">"{packageData.outreach.linkedin}"</p>
                                      </div>
                                   )}
                                </>
                             ) : <EmptyState section="OUTREACH_SEQUENCE" />}
                          </div>
                       )}
                    </div>
                 </div>
              )}
           </div>
        </div>

      </div>

      {currentDossier && targetLead && (
        <OutreachModal 
          isOpen={isOutreachOpen}
          onClose={() => setIsOutreachOpen(false)}
          dossier={currentDossier}
          lead={targetLead}
          onUpdateLead={onUpdateLead}
          onSent={() => {}} 
        />
      )}
    </div>
  );
};