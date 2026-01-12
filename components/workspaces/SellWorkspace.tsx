
import React, { useState } from 'react';
import { SubModule, Lead } from '../../types';
import { generateProposalDraft } from '../../services/geminiService';
import { ROICalc } from './ROICalc';
import { Sequencer } from './Sequencer';
import { DeckArch } from './DeckArch';
import { DemoSandbox } from './DemoSandbox';
import { ProposalDrafting } from './ProposalDrafting';
import { VoiceStrat } from './VoiceStrat';
import { LiveScribe } from './LiveScribe';
import { AIConcierge } from './AIConcierge';
import { PitchGen } from './PitchGen';
import { FunnelMap } from './FunnelMap';
import { FormattedOutput } from '../common/FormattedOutput';

interface SellWorkspaceProps {
  activeModule: SubModule;
  leads: Lead[];
  lockedLead?: Lead;
}

export const SellWorkspace: React.FC<SellWorkspaceProps> = ({ activeModule, leads, lockedLead }) => {
  const [proposal, setProposal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateProposal = async () => {
    if (!lockedLead) return;
    setIsLoading(true);
    try {
      const text = await generateProposalDraft(lockedLead);
      setProposal(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Route submodules
  if (activeModule === 'PROPOSALS') {
    return (
      <div className="space-y-12 py-8 max-w-[1550px] mx-auto px-6 animate-in fade-in duration-700">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">MAGIC LINK <span className="text-emerald-600 not-italic">ARCHITECT</span></h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Generate high-value proposal assets for {lockedLead?.businessName || 'Target'}.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {/* Blueprint Viewer */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[600px] flex flex-col relative shadow-2xl group overflow-hidden">
            {isLoading ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">ARCHITECTING DEAL STRUCTURE...</p>
               </div>
            ) : proposal ? (
               <div className="flex-1 p-16 overflow-y-auto custom-scrollbar">
                  <FormattedOutput content={proposal} />
               </div>
            ) : (
               <div className="absolute inset-0 flex items-center justify-center p-20 text-center opacity-30">
                  <div className="space-y-8">
                     <svg className="w-32 h-32 mx-auto text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                     <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                       {lockedLead ? `READY TO ARCHITECT FOR ${lockedLead.businessName.toUpperCase()}` : 'SELECT A TARGET FROM LEDGER'}
                     </p>
                  </div>
               </div>
            )}
          </div>

          {/* Blueprint Controls */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 space-y-12 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-[14px] font-black text-white shadow-2xl shadow-emerald-600/30">QR</div>
              <div>
                <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em] mb-1">
                  {lockedLead ? lockedLead.businessName : 'Proposal Blueprint'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Agency Preview Node</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 relative z-10 space-y-6">
               <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 w-full text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">INCLUDED MODULES</p>
                  <div className="space-y-3">
                     <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div><span className="text-xs font-bold text-slate-300">ROI PROJECTION</span></div>
                     <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div><span className="text-xs font-bold text-slate-300">COMPETITIVE GAP ANALYSIS</span></div>
                     <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div><span className="text-xs font-bold text-slate-300">AI IMPLEMENTATION ROADMAP</span></div>
                  </div>
               </div>
            </div>

            <div className="pt-4 flex gap-6 relative z-10">
              <button 
                onClick={handleGenerateProposal}
                disabled={!lockedLead || isLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/30 transition-all active:scale-95 border-b-4 border-emerald-700"
              >
                {isLoading ? 'GENERATING...' : 'GENERATE PROPOSAL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Router for other Sell Modules - Sync with canonical SubModule types
  switch (activeModule) {
    case 'ROI_CALCULATOR': return <ROICalc leads={leads} />;
    case 'SEQUENCER': return <Sequencer lead={lockedLead} />;
    case 'PRESENTATION_BUILDER': return <DeckArch lead={lockedLead} />;
    case 'DEMO_SANDBOX': return <DemoSandbox lead={lockedLead} />;
    case 'DRAFTING': return <ProposalDrafting lead={lockedLead} />;
    case 'SALES_COACH': return <VoiceStrat lead={lockedLead} />;
    case 'MEETING_NOTES': return <LiveScribe />;
    case 'AI_CONCIERGE': return <AIConcierge lead={lockedLead} />;
    case 'ELEVATOR_PITCH': return <PitchGen lead={lockedLead} />;
    case 'FUNNEL_MAP': return <FunnelMap lead={lockedLead} />;
    default: return null;
  }
};
