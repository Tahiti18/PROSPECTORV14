
import React, { useState, useMemo, useEffect } from 'react';
import { Lead } from '../../types';
import { SESSION_ASSETS, orchestrateBusinessPackage } from '../../services/geminiService';
import { dossierStorage, StrategicDossier } from '../../services/dossierStorage';

interface BusinessOrchestratorProps {
  leads: Lead[];
  lockedLead?: Lead;
}

export const BusinessOrchestrator: React.FC<BusinessOrchestratorProps> = ({ leads, lockedLead }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lockedLead?.id || '');
  const [packageData, setPackageData] = useState<any>(null);
  const [currentDossier, setCurrentDossier] = useState<StrategicDossier | null>(null);
  const [history, setHistory] = useState<StrategicDossier[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'narrative' | 'content' | 'outreach'>('strategy');

  // Filter Vault for selected lead
  const targetLead = leads.find(l => l.id === selectedLeadId);
  
  const leadAssets = useMemo(() => {
    if (!targetLead) return [];
    const searchTerms = targetLead.businessName.toLowerCase().split(' ');
    return SESSION_ASSETS.filter(a => {
      const titleLower = a.title.toLowerCase();
      return searchTerms.some(term => term.length > 3 && titleLower.includes(term));
    });
  }, [targetLead]);

  const assetCounts = {
    TEXT: leadAssets.filter(a => a.type === 'TEXT').length,
    IMAGE: leadAssets.filter(a => a.type === 'IMAGE').length,
    VIDEO: leadAssets.filter(a => a.type === 'VIDEO').length,
    AUDIO: leadAssets.filter(a => a.type === 'AUDIO').length,
  };

  // Re-hydration Effect
  useEffect(() => {
    if (targetLead) {
      const savedDossiers = dossierStorage.getAllByLead(targetLead.id);
      setHistory(savedDossiers);
      
      if (savedDossiers.length > 0) {
        // Auto-load the latest
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
      
      // PERSISTENCE LAYER: Auto-Save
      const saved = dossierStorage.save(targetLead, result, leadAssets.map(a => a.id));
      
      setPackageData(result);
      setCurrentDossier(saved);
      setHistory(prev => [saved, ...prev]);
      
    } catch (e) {
      console.error(e);
      alert("Orchestration failed. Check API connectivity.");
    } finally {
      setIsOrchestrating(false);
    }
  };

  const loadVersion = (dossier: StrategicDossier) => {
    setCurrentDossier(dossier);
    setPackageData(dossier.data);
  };

  const handleExportMarkdown = () => {
    if (!currentDossier) return;
    const md = dossierStorage.exportToMarkdown(currentDossier);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DOSSIER_${targetLead?.businessName}_v${currentDossier.version}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-[1600px] mx-auto py-8 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-6xl font-black italic text-white uppercase tracking-tighter leading-none">
            BUSINESS <span className="text-emerald-500 not-italic">ORCHESTRATOR</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            STRATEGIC ASSET COMPILATION & SYNTHESIS
          </p>
        </div>
        <div className="flex items-center gap-4">
           {currentDossier && (
             <div className="bg-emerald-900/20 border border-emerald-500/20 px-6 py-2 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                  LOADED: V{currentDossier.version} ({new Date(currentDossier.timestamp).toLocaleTimeString()})
                </span>
             </div>
           )}
           <div className="bg-slate-900 border border-slate-800 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400">
              VAULT LINK: ONLINE
           </div>
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: SELECTION & ASSET MONITOR */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">SELECT TARGET</label>
                 <select 
                   value={selectedLeadId}
                   onChange={(e) => setSelectedLeadId(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none uppercase"
                 >
                    <option value="">-- SELECT LEAD FROM LEDGER --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.businessName}</option>
                    ))}
                 </select>
              </div>

              {targetLead && (
                <div className="space-y-6 animate-in slide-in-from-left-4">
                   {/* History Selector */}
                   {history.length > 0 && (
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">VERSION HISTORY</label>
                        <div className="flex flex-wrap gap-2">
                           {history.map(ver => (
                             <button
                               key={ver.id}
                               onClick={() => loadVersion(ver)}
                               className={`px-3 py-1 rounded-lg text-[9px] font-black border transition-all ${
                                 currentDossier?.id === ver.id 
                                   ? 'bg-emerald-600 border-emerald-500 text-white' 
                                   : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                               }`}
                             >
                               V{ver.version}
                             </button>
                           ))}
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-4">
                      {Object.entries(assetCounts).map(([type, count]) => (
                        <div key={type} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{type}</span>
                           <span className={`text-xl font-black italic ${count > 0 ? 'text-emerald-400' : 'text-slate-700'}`}>{count}</span>
                        </div>
                      ))}
                   </div>
                   
                   <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {leadAssets.map(a => (
                        <div key={a.id} className="text-[9px] font-bold text-slate-400 truncate bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/50 flex justify-between">
                           <span className="truncate max-w-[180px]">{a.title}</span>
                           <span className="text-emerald-600 ml-2">{a.module?.split('_')[0]}</span>
                        </div>
                      ))}
                      {leadAssets.length === 0 && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest text-center py-4">NO ASSETS FOUND IN VAULT</p>}
                   </div>

                   <button 
                     onClick={handleOrchestrate}
                     disabled={isOrchestrating}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800"
                   >
                     {isOrchestrating ? 'SYNTHESIZING...' : (currentDossier ? 'GENERATE NEW VERSION' : 'ASSEMBLE DOSSIER')}
                   </button>
                </div>
              )}
           </div>
        </div>

        {/* RIGHT: OUTPUT DOSSIER */}
        <div className="lg:col-span-8">
           <div className="bg-[#05091a] border border-slate-800 rounded-[48px] min-h-[700px] flex flex-col shadow-2xl relative overflow-hidden">
              
              {!packageData ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 text-center space-y-6">
                    <span className="text-8xl grayscale">📁</span>
                    <h3 className="text-4xl font-black italic text-slate-700 uppercase tracking-tighter">WAITING FOR INTEL</h3>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">SELECT A TARGET AND ASSEMBLE</p>
                 </div>
              ) : (
                 <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
                    {/* TABS */}
                    <div className="flex border-b border-slate-800 bg-[#0b1021]">
                       {[
                         { id: 'strategy', label: 'STRATEGY DECK' },
                         { id: 'narrative', label: 'PITCH SCRIPT' },
                         { id: 'content', label: 'CONTENT PACK' },
                         { id: 'outreach', label: 'OUTREACH SEQ' }
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

                    {/* CONTENT AREA */}
                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar relative">
                       
                       {activeTab === 'strategy' && (
                          <div className="space-y-12">
                             <div className="text-center space-y-4 mb-12">
                                <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">{packageData.presentation.title}</h2>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] border border-emerald-500/30 px-4 py-1 rounded-full">CONFIDENTIAL</span>
                             </div>
                             <div className="grid gap-8">
                                {packageData.presentation.slides.map((slide: any, i: number) => (
                                  <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] flex gap-8 group hover:border-emerald-500/30 transition-all">
                                     <div className="text-6xl font-black italic text-slate-800 group-hover:text-emerald-500/20 transition-colors select-none">
                                        {String(i + 1).padStart(2, '0')}
                                     </div>
                                     <div className="space-y-4 flex-1">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">{slide.title}</h3>
                                        <ul className="space-y-2">
                                           {slide.bullets.map((b: string, j: number) => (
                                             <li key={j} className="text-sm text-slate-400 font-medium pl-4 border-l-2 border-slate-700">{b}</li>
                                           ))}
                                        </ul>
                                        {slide.visualRef && (
                                           <div className="mt-4 p-4 bg-black/40 rounded-xl border border-dashed border-slate-700 flex items-center gap-3">
                                              <span className="text-lg">🖼️</span>
                                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{slide.visualRef}</p>
                                           </div>
                                        )}
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                       )}

                       {activeTab === 'narrative' && (
                          <div className="max-w-3xl mx-auto space-y-8">
                             <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] shadow-xl">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">EXECUTIVE NARRATIVE</h3>
                                <div className="prose prose-invert max-w-none">
                                   <p className="text-lg text-slate-300 leading-relaxed font-serif italic whitespace-pre-wrap">
                                      {packageData.narrative}
                                   </p>
                                </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'content' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {packageData.contentPack.map((post: any, i: number) => (
                               <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4 hover:border-emerald-500/30 transition-all">
                                  <div className="flex justify-between items-center">
                                     <span className="px-3 py-1 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest">{post.platform}</span>
                                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{post.type}</span>
                                  </div>
                                  <p className="text-sm text-slate-200 font-medium italic">"{post.caption}"</p>
                                  {post.assetRef && (
                                     <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest pt-4 border-t border-slate-800">
                                        LINKED: {post.assetRef}
                                     </p>
                                  )}
                               </div>
                             ))}
                          </div>
                       )}

                       {activeTab === 'outreach' && (
                          <div className="space-y-8">
                             <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">EMAIL SEQUENCE</h3>
                                {packageData.outreach.emailSequence.map((email: any, i: number) => (
                                  <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px]">
                                     <p className="text-sm font-bold text-white mb-4"><span className="text-slate-500">SUBJECT:</span> {email.subject}</p>
                                     <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-mono bg-black/20 p-6 rounded-2xl border border-slate-800/50">
                                        {email.body}
                                     </p>
                                  </div>
                                ))}
                             </div>
                             <div className="bg-indigo-900/10 border border-indigo-500/20 p-8 rounded-[32px]">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">LINKEDIN CONNECT</h3>
                                <p className="text-sm text-slate-300 italic">"{packageData.outreach.linkedin}"</p>
                             </div>
                          </div>
                       )}

                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-slate-800 p-6 flex justify-between items-center bg-[#05091a]">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          DOSSIER ID: {currentDossier.id}
                       </p>
                       <button 
                         onClick={handleExportMarkdown}
                         className="flex items-center gap-2 text-[9px] font-black text-emerald-400 hover:text-white uppercase tracking-widest transition-colors"
                       >
                          <span>↓</span> EXPORT MARKDOWN
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};
