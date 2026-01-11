
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { SESSION_ASSETS, orchestrateBusinessPackage } from '../../services/geminiService';
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
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'narrative' | 'content' | 'outreach' | 'visual'>('strategy');
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  
  const targetLead = leads.find(l => l.id === selectedLeadId);
  
  const leadAssets = useMemo(() => {
    if (!targetLead) return [];
    return SESSION_ASSETS.filter(a => a.leadId === targetLead.id);
  }, [targetLead]);

  useEffect(() => {
    if (targetLead) {
      const savedDossiers = dossierStorage.getAllByLead(targetLead.id);
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
      if (!result) throw new Error("Recalibration required.");
      const saved = dossierStorage.save(targetLead, result, leadAssets.map(a => a.id));
      setPackageData(result);
      setCurrentDossier(saved);
    } catch (e: any) {
      console.error(e);
      alert(`NEURAL_INTERRUPT: ${e.message || "Model timeout."}`);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const EmptyState = ({ section }: { section: string }) => (
    <div className="py-20 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-slate-800 rounded-[40px] text-center px-10">
       <span className="text-5xl mb-6">📦</span>
       <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">{section} READY</h4>
       <p className="text-[10px] font-bold uppercase tracking-widest mt-3 text-slate-600">INITIATE FORGE TO COMPILE DATA</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-8 space-y-10 animate-in fade-in duration-700">
      
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
            STRATEGY <span className="text-emerald-500 not-italic">FORGE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            SECURED NEURAL ARCHITECTURE
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-10">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">MISSION_TARGET</label>
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
                <button 
                  onClick={handleOrchestrate}
                  disabled={isOrchestrating}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800"
                >
                  {isOrchestrating ? 'ORCHESTRATING...' : 'INITIATE STRATEGY FORGE'}
                </button>
              )}
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] min-h-[700px] flex flex-col shadow-2xl relative overflow-hidden">
              {!packageData ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 text-center space-y-6">
                    <span className="text-9xl font-black italic text-white uppercase tracking-tighter">IDLE</span>
                 </div>
              ) : (
                 <div className="flex flex-col h-full">
                    <div className="flex border-b border-slate-800 bg-slate-900/50">
                       {['strategy', 'narrative', 'content', 'outreach', 'visual'].map(tab => (
                         <button
                           key={tab}
                           onClick={() => setActiveTab(tab as any)}
                           className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                             activeTab === tab 
                               ? 'bg-emerald-600/10 text-emerald-400 border-b-2 border-emerald-500' 
                               : 'text-slate-500 hover:text-white'
                           }`}
                         >
                           {tab}
                         </button>
                       ))}
                    </div>

                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#020617]">
                       {activeTab === 'strategy' && (
                          <div className="space-y-10">
                             {packageData.presentation?.slides?.length > 0 ? (
                                <>
                                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{packageData.presentation.title}</h2>
                                   <div className="grid gap-6">
                                      {packageData.presentation.slides.map((s: any, i: number) => (
                                        <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px]">
                                           <h3 className="text-xl font-bold text-white uppercase mb-4">#{i+1}: {s.title}</h3>
                                           <ul className="space-y-3">
                                              {(s.bullets || []).map((b: string, j: number) => (
                                                <li key={j} className="text-sm text-slate-400 flex items-start gap-3">
                                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                                                   {b}
                                                </li>
                                              ))}
                                           </ul>
                                        </div>
                                      ))}
                                   </div>
                                </>
                             ) : <EmptyState section="STRATEGY" />}
                          </div>
                       )}

                       {activeTab === 'narrative' && (
                          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px]">
                             <p className="text-xl text-slate-300 italic font-medium leading-relaxed font-serif">{packageData.narrative || "Recalibrating narrative..."}</p>
                          </div>
                       )}

                       {activeTab === 'outreach' && (
                          <div className="space-y-8">
                             {packageData.outreach?.emailSequence?.length > 0 ? (
                                packageData.outreach.emailSequence.map((e: any, i: number) => (
                                   <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4">
                                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">EMAIL_0{i+1}: {e.subject}</p>
                                      <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-black/30 p-6 rounded-2xl">{e.body}</p>
                                   </div>
                                ))
                             ) : <EmptyState section="OUTREACH" />}
                          </div>
                       )}
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
