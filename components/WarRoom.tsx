
import React, { useState, useEffect } from 'react';
import { Lead, OutreachStatus } from '../types';

interface WarRoomProps {
  lead?: Lead;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
}

const STATUS_OPTIONS: OutreachStatus[] = ['cold', 'queued', 'sent', 'opened', 'replied', 'booked', 'won', 'lost', 'paused'];

export const WarRoom: React.FC<WarRoomProps> = ({ lead, onUpdateLead }) => {
  const [localNotes, setLocalNotes] = useState('');
  const [localTag, setLocalTag] = useState('');

  // Sync local state when lead changes
  useEffect(() => {
    if (lead) {
      setLocalNotes(lead.notes || '');
    }
  }, [lead?.id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);
    if (lead && onUpdateLead) {
      onUpdateLead(lead.id, { notes: val });
    }
  };

  const addTag = () => {
    if (!lead || !onUpdateLead || !localTag.trim()) return;
    const currentTags = lead.tags || [];
    if (!currentTags.includes(localTag.trim())) {
      onUpdateLead(lead.id, { tags: [...currentTags, localTag.trim()] });
    }
    setLocalTag('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!lead || !onUpdateLead) return;
    const currentTags = lead.tags || [];
    onUpdateLead(lead.id, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  // Status handler writing to both legacy and new fields
  const handleStatusChange = (newStatus: OutreachStatus) => {
    if (lead && onUpdateLead) {
      onUpdateLead(lead.id, { 
        status: newStatus, 
        outreachStatus: newStatus 
      });
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <span className="text-5xl mb-6">♟️</span>
        <h3 className="text-xl font-bold text-slate-300">No Target Selected</h3>
        <p className="text-sm mt-2">Go to Lead Discovery to select a theater for operations.</p>
      </div>
    );
  }

  // Fallback for current status display
  const currentStatus = lead.outreachStatus ?? lead.status ?? 'cold';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black text-white tracking-tighter">{lead.businessName}</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
              lead.assetGrade === 'A' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              Grade {lead.assetGrade}
            </span>
          </div>
          <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {lead.niche} Theater — {lead.city} Command
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors">
            Extract Brand Kit
          </button>
          <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
            Deploy Attack Sequence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Intelligence & Analysis */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex items-center gap-2">
              <span className="text-xl">📉</span>
              <h3 className="font-bold text-white uppercase tracking-widest text-xs">Vulnerability Analysis (Social Gap)</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-300 leading-relaxed text-lg italic">"{lead.socialGap}"</p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Visual Proof</p>
                  <p className="text-sm text-slate-200">{lead.visualProof}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">High-Ticket Angle</p>
                  <p className="text-sm text-slate-200">{lead.bestAngle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
             <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
               <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
               AI Transformation Opportunities
             </h3>
             <div className="space-y-4">
                {[
                  "Automated Visual Content Engine (Reels/TikTok)",
                  "AI-Powered Booking Agent Integration",
                  "Digital Twin Virtual Tour",
                  "High-Ticket Retargeting Sequence"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <span className="text-slate-200 font-medium">{item}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Target Intelligence & CRM */}
        <div className="space-y-8">
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
            <h3 className="font-bold text-indigo-400 mb-4 uppercase tracking-widest text-xs">Target Intelligence</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Contact Protocol</p>
                <p className="text-sm text-slate-200">{lead.phone || 'Not found'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email Node</p>
                <p className="text-sm text-slate-200">{lead.email || 'Not found'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Combat Readiness</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${lead.leadScore}%` }}></div>
                  </div>
                  <span className="text-xs font-black text-white">{lead.leadScore}</span>
                </div>
              </div>

              {/* Mandatory Grounding Sources Display */}
              {lead.groundingSources && lead.groundingSources.length > 0 && (
                <div className="pt-4 border-t border-indigo-500/20 mt-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="text-indigo-400">📡</span> Intelligence Sources
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {lead.groundingSources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-2 bg-slate-950/50 rounded border border-slate-800 hover:border-indigo-500/50 transition-colors group"
                      >
                        <p className="text-[10px] font-bold text-slate-100 truncate group-hover:text-indigo-400">{source.title || 'Linked Source'}</p>
                        <p className="text-[8px] text-slate-500 truncate">{source.uri}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CRM COMMAND PANEL */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-6 shadow-xl">
             <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
               <span className="text-lg">🗂️</span> CRM Command
             </h3>
             
             {/* Status Switcher */}
             <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mission Status</p>
                <select 
                  value={currentStatus} 
                  onChange={(e) => handleStatusChange(e.target.value as OutreachStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none uppercase"
                >
                   {STATUS_OPTIONS.map(s => (
                     <option key={s} value={s}>{s.replace('_', ' ')}</option>
                   ))}
                </select>
             </div>

             {/* Tags */}
             <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tactical Tags</p>
                <div className="flex flex-wrap gap-2 mb-2">
                   {lead.tags?.map((t, i) => (
                     <span key={i} className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded border border-slate-700">
                        {t}
                        <button onClick={() => removeTag(t)} className="text-slate-500 hover:text-rose-500 ml-1">×</button>
                     </span>
                   ))}
                </div>
                <div className="flex gap-2">
                   <input 
                     value={localTag}
                     onChange={(e) => setLocalTag(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && addTag()}
                     placeholder="Add tag..."
                     className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                   />
                   <button onClick={addTag} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700 text-xs">+</button>
                </div>
             </div>

             {/* Notes */}
             <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Notes</p>
                <textarea 
                  value={localNotes}
                  onChange={handleNotesChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none resize-none h-32"
                  placeholder="Record tactical observations..."
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
