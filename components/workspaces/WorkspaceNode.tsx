import React, { useState } from 'react';
import { Lead } from '../../types';
import { openRouterChat } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';

interface WorkspaceNodeProps {
  leads: Lead[];
}

export const WorkspaceNode: React.FC<WorkspaceNodeProps> = ({ leads }) => {
  const [targetId, setTargetId] = useState<string>('general');
  const [task, setTask] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExecute = async () => {
    if (!task.trim()) return;
    setIsProcessing(true);
    setReport(null);

    try {
      const selectedLead = leads.find(l => l.id === targetId);
      const context = selectedLead ? `Context: Business ${selectedLead.businessName}, Niche ${selectedLead.niche}. ` : '';
      const response = await openRouterChat(`${context}\n\nTask: ${task}`);
      setReport(response || "Intelligence feed empty.");
    } catch (e) {
      console.error(e);
      setReport("CRITICAL_NODE_FAILURE: Gateway Error.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
            FLASH <span className="text-emerald-500 not-italic opacity-40 uppercase tracking-widest">WORKSPACE</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">OpenRouter Hard-Locked Hub</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-10">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">CONTEXT</h3>
                 <select 
                   value={targetId}
                   onChange={(e) => setTargetId(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-sm font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                 >
                    <option value="general">Universal Node</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
                 </select>
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">MISSION</h3>
                 <textarea 
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500 h-56 resize-none"
                 />
              </div>

              <button 
                onClick={handleExecute}
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/20"
              >
                {isProcessing ? 'PROCESSING...' : 'EXECUTE'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-8 bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[700px] flex flex-col shadow-2xl overflow-hidden p-12">
            {isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest animate-pulse">FLASH_INFERENCE_ACTIVE...</p>
                </div>
            ) : report ? (
                <FormattedOutput content={report} />
            ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <h4 className="text-4xl font-black italic text-slate-700 uppercase tracking-tighter">STANDBY</h4>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
