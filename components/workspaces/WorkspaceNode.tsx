
import React, { useState } from 'react';
import { Lead } from '../../types';
import { GoogleGenAI } from "@google/genai";

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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const selectedLead = leads.find(l => l.id === targetId);
      const context = selectedLead ? `Context: Business ${selectedLead.businessName}, Niche ${selectedLead.niche}, Gap ${selectedLead.socialGap}. ` : '';
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `${context}\n\nTask: ${task}`,
      });
      setReport(response.text || "Intelligence feed empty.");
    } catch (e) {
      console.error(e);
      setReport("CRITICAL_NODE_FAILURE: Reasoning chain interrupted.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
            GEMINI 3 PRO <span className="text-emerald-500 not-italic opacity-40 uppercase tracking-widest">INTELLIGENCE WORKSPACE</span>
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center not-italic text-slate-500 font-black">i</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Execute complex reasoning and market analysis calibrated for Global theaters.
          </p>
        </div>
        <div className="bg-emerald-600/10 border border-emerald-500/20 px-6 py-2.5 rounded-full flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">REASONING NODE: UNIVERSAL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-10 relative overflow-hidden">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">CONTEXT TARGETING</h3>
                 <select 
                   value={targetId}
                   onChange={(e) => setTargetId(e.target.value)}
                   className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-sm font-bold text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                 >
                    <option value="general">No Specific Lead (General Task)</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
                 </select>
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">ADVANCED REASONING TASK</h3>
                 <textarea 
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-8 text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500 h-56 resize-none shadow-inner placeholder-slate-800 italic leading-relaxed"
                  placeholder="What complex task should Gemini perform?..."
                 />
              </div>

              <button 
                onClick={handleExecute}
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-600/20 border border-emerald-400/20"
              >
                <span className="text-xl">⚡</span>
                {isProcessing ? 'PROCESSING...' : 'EXECUTE INTELLIGENCE TASK'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] min-h-[800px] flex flex-col relative shadow-2xl overflow-hidden">
              <div className="p-10 border-b border-slate-800 flex items-center gap-6">
                 <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5"/></svg>
                 </div>
                 <div>
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">INTELLIGENCE REPORT</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">NODE: {leads.find(l=>l.id===targetId)?.businessName || 'UNIVERSAL'}</p>
                 </div>
              </div>

              <div className="flex-1 p-16 relative overflow-y-auto custom-scrollbar">
                 {isProcessing ? (
                   <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 animate-pulse">
                      <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-600 rounded-full animate-spin"></div>
                      <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">GEMINI_CORE_THINKING...</p>
                   </div>
                 ) : report ? (
                   <div className="prose prose-invert max-w-none text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                      {report}
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                      <div className="w-32 h-32 border-4 border-slate-800 rounded-full flex items-center justify-center mb-8">
                         <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.641.32a2 2 0 01-1.76 0l-.641-.32a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V18a2 2 0 002 2h12a2 2 0 002-2v-2.572zM12 11V3.5l3 3m-3-3l-3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <h4 className="text-4xl font-black italic text-slate-800 uppercase tracking-tighter">STANDBY FOR INTELLIGENCE</h4>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
