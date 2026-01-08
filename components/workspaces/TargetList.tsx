
import React, { useState, useMemo, useRef } from 'react';
import { Lead, OutreachStatus } from '../../types';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { RunStatus } from '../automation/RunStatus';
import { HyperLaunchModal } from '../automation/HyperLaunchModal';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';

const STATUS_FILTER_OPTIONS: (OutreachStatus | 'ALL')[] = ['ALL', 'cold', 'queued', 'sent', 'opened', 'replied', 'booked', 'won', 'lost', 'paused'];

export const TargetList: React.FC<{ leads: Lead[], lockedLeadId: string | null, onLockLead: (id: string) => void, onInspect: (id: string) => void }> = ({ leads, lockedLeadId, onLockLead, onInspect }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' }>({ key: 'leadScore', direction: 'desc' });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OutreachStatus | 'ALL'>('ALL');
  
  // NEW: Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showHyperLaunch, setShowHyperLaunch] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedLeads = useMemo(() => {
    let filtered = leads;
    if (statusFilter !== 'ALL') filtered = leads.filter(l => (l.outreachStatus ?? l.status ?? 'cold') === statusFilter);
    return [...filtered].sort((a, b) => {
      // @ts-ignore
      const aVal = a[sortConfig.key] ?? '';
      // @ts-ignore
      const bVal = b[sortConfig.key] ?? '';
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [leads, sortConfig, statusFilter]);

  const handleSort = (key: keyof Lead) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleOneClickRun = async () => {
    try {
      const run = await AutomationOrchestrator.getInstance().startRun();
      setActiveRunId(run.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedLeads.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(sortedLeads.map(l => l.id)));
    }
  };

  // --- DATA MANAGEMENT HANDLERS ---

  const handleExport = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROSPECTOR_LEADS_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Leads exported successfully.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target?.result as string);
            if (Array.isArray(imported)) {
                // Merge logic: append new, keep existing if ID matches
                const currentIds = new Set(leads.map(l => l.id));
                const newLeads = imported.filter((l: any) => !currentIds.has(l.id));
                const merged = [...leads, ...newLeads];
                db.saveLeads(merged);
                toast.success(`Imported ${newLeads.length} new leads.`);
            } else {
                toast.error("Invalid file format. Expected JSON array.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to parse import file.");
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAll = () => {
    db.saveLeads(leads);
    toast.success("Database synchronized manually.");
  };

  return (
    <div className="space-y-6 py-6 max-w-[1600px] mx-auto relative px-6 pb-32 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold text-white uppercase tracking-tight leading-none drop-shadow-2xl">
            LEAD <span className="text-emerald-600">DATABASE</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">RECORDS: {leads.length}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#0b1021] border border-slate-800 rounded-lg px-4 flex items-center">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-3">FILTER:</span>
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value as any)}
               className="bg-transparent text-[10px] font-bold text-white uppercase focus:outline-none py-2 cursor-pointer"
             >
               {STATUS_FILTER_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
             </select>
          </div>
          
          {selectedIds.size > 0 ? (
             <button 
               onClick={() => setShowHyperLaunch(true)}
               className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/30 transition-all active:scale-95 border border-emerald-500/20 flex items-center gap-2 animate-in slide-in-from-right-4"
             >
               <span className="text-sm">🚀</span>
               LAUNCH SWARM ({selectedIds.size})
             </button>
          ) : (
             <button 
               onClick={handleOneClickRun}
               className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-700 flex items-center gap-2"
             >
               <span className="text-sm">⚡</span>
               AUTO-ENGAGE (NEXT)
             </button>
          )}
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[24px] overflow-hidden shadow-2xl relative ring-1 ring-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#05091a]">
                <th className="px-6 py-4 w-12 text-center">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.size === sortedLeads.length && sortedLeads.length > 0} 
                        onChange={toggleSelectAll}
                        className="accent-emerald-500 cursor-pointer w-4 h-4"
                    />
                </th>
                <th onClick={() => handleSort('rank')} className="cursor-pointer px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors select-none whitespace-nowrap group">
                  <div className="flex items-center gap-2">
                    RANK <span className={`text-emerald-500 transition-opacity ${sortConfig.key === 'rank' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  </div>
                </th>
                <th onClick={() => handleSort('businessName')} className="cursor-pointer px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors select-none whitespace-nowrap group">
                  <div className="flex items-center gap-2">
                    IDENTITY <span className={`text-emerald-500 transition-opacity ${sortConfig.key === 'businessName' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  </div>
                </th>
                <th onClick={() => handleSort('status')} className="cursor-pointer px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors select-none text-center whitespace-nowrap group">
                  <div className="flex items-center gap-2 justify-center">
                    STATUS <span className={`text-emerald-500 transition-opacity ${sortConfig.key === 'status' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] select-none whitespace-nowrap">SOCIAL GAP / SIGNAL</th>
                <th onClick={() => handleSort('leadScore')} className="cursor-pointer px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors select-none text-right whitespace-nowrap group">
                  <div className="flex items-center gap-2 justify-end">
                    SCORE <span className={`text-emerald-500 transition-opacity ${sortConfig.key === 'leadScore' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  </div>
                </th>
                <th className="w-32 px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedLeads.map((lead) => {
                const displayStatus = lead.outreachStatus ?? lead.status ?? 'cold';
                return (
                  <tr key={lead.id} className={`group hover:bg-white/5 transition-all ${lead.locked ? 'opacity-50 bg-slate-900/50' : 'bg-[#0b1021]'} ${selectedIds.has(lead.id) ? 'bg-emerald-900/10' : ''}`}>
                    <td className="px-6 py-4 text-center">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.has(lead.id)}
                            onChange={() => toggleSelect(lead.id)}
                            className="accent-emerald-500 cursor-pointer w-4 h-4"
                        />
                    </td>
                    <td className="px-6 py-4"><span className="text-lg font-black text-slate-600 italic group-hover:text-emerald-500 transition-colors">#{lead.rank}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span onClick={() => onInspect(lead.id)} className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors leading-none cursor-pointer">{lead.businessName}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">{lead.city}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{lead.niche}</span>
                        </div>
                        {lead.locked && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1.5 flex items-center gap-1 animate-pulse"><span>🔒</span> LOCKED BY PROTOCOL {lead.lockedByRunId?.slice(0,4)}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-[8px] font-black border uppercase tracking-widest ${
                        displayStatus === 'cold' ? 'bg-slate-800 border-slate-700 text-slate-500' :
                        displayStatus === 'sent' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        displayStatus === 'won' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <p className="text-[10px] font-medium text-slate-400 line-clamp-1 italic leading-relaxed border-l-2 border-emerald-500/30 pl-3">"{lead.socialGap}"</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-3xl font-black italic tracking-tighter ${lead.leadScore >= 80 ? 'text-emerald-500' : lead.leadScore >= 60 ? 'text-emerald-500' : 'text-slate-600'}`}>
                        {lead.leadScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => onInspect(lead.id)} className="px-4 py-2 bg-white text-black hover:bg-emerald-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">STRATEGY</button>
                    </td>
                  </tr>
                );
              })}
              {sortedLeads.length === 0 && (
                <tr><td colSpan={7} className="py-20 text-center bg-[#0b1021]"><span className="text-4xl block mb-4 grayscale opacity-20">📂</span><p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">DATABASE EMPTY</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* STATIC CONTROL BAR (Replaces Floating Footer) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-8 p-6 bg-[#0b1021] border border-slate-800 rounded-[24px] shadow-lg">
         {/* Left: Import/Export */}
         <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-800 transition-all flex items-center gap-2"
            >
              <span>⬆️</span> IMPORT
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            
            <button 
              onClick={handleExport}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-800 transition-all flex items-center gap-2"
            >
              <span>⬇️</span> EXPORT
            </button>
         </div>

         {/* Right: Save All */}
         <div>
            <button 
              onClick={handleSaveAll}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>💾</span> SAVE DATABASE
            </button>
         </div>
      </div>

      {activeRunId && <RunStatus runId={activeRunId} onClose={() => { setActiveRunId(null); window.location.reload(); }} />}
      
      <HyperLaunchModal 
        isOpen={showHyperLaunch} 
        onClose={() => setShowHyperLaunch(false)} 
        selectedLeads={leads.filter(l => selectedIds.has(l.id))}
        onComplete={() => {
            setShowHyperLaunch(false);
            setSelectedIds(new Set());
            // Implicit reload or refresh via polling will catch updates
        }}
      />
    </div>
  );
};
