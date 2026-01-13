
import React, { useState, useMemo, useRef } from 'react';
import { Lead, OutreachStatus } from '../../types';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { RunStatus } from '../automation/RunStatus';
import { HyperLaunchModal } from '../automation/HyperLaunchModal';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';

const STATUS_FILTER_OPTIONS: (OutreachStatus | 'ALL')[] = ['ALL', 'cold', 'queued', 'sent', 'opened', 'replied', 'booked', 'won', 'lost', 'paused'];

export const ProspectDatabase: React.FC<{ leads: Lead[], lockedLeadId: string | null, onLockLead: (id: string) => void, onInspect: (id: string) => void }> = ({ leads, lockedLeadId, onLockLead, onInspect }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' }>({ key: 'leadScore', direction: 'desc' });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OutreachStatus | 'ALL'>('ALL');
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
      toast.error(e.message);
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

  const handleDelete = (id: string) => {
    if (confirm("Permanently remove this target from the ledger?")) {
        db.deleteLead(id);
        toast.info("Target removed.");
    }
  };

  const handlePurge = () => {
    if (confirm("CRITICAL: Wipe all leads from the ledger? This cannot be undone.")) {
        db.saveLeads([]);
        toast.info("Ledger purged.");
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROSPECTOR_LEDGER_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("DATABASE_EXPORTED_SUCCESSFULLY");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target?.result as string);
            if (Array.isArray(imported)) {
                db.upsertLeads(imported);
                toast.success(`IMPORTED ${imported.length} RECORDS`);
            } else {
                toast.error("INVALID_FILE_STRUCTURE");
            }
        } catch (err) {
            toast.error("PARSE_FAILURE");
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAll = () => {
    db.saveLeads(leads);
    toast.success("LEDGER_COMMIT_SUCCESSFUL");
  };

  return (
    <div className="space-y-6 py-6 max-w-[1600px] mx-auto relative px-6 pb-40 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
            PROSPECT <span className="text-emerald-500">LEDGER</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">RECORDS: {leads.length}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#0b1021] border-2 border-slate-800 rounded-lg px-4 flex items-center">
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
             <button onClick={() => setShowHyperLaunch(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 transition-all active:scale-95 border-b-4 border-emerald-800">
               LAUNCH CAMPAIGNS ({selectedIds.size})
             </button>
          ) : (
             <button onClick={handleOneClickRun} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 border-slate-700 flex items-center gap-2">
               AUTO-ENGAGE NEXT
             </button>
          )}
        </div>
      </div>

      <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[24px] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-[#05091a]">
                <th className="px-6 py-4 w-12 text-center">
                    <input type="checkbox" checked={selectedIds.size === sortedLeads.length && sortedLeads.length > 0} onChange={toggleSelectAll} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
                </th>
                <th onClick={() => handleSort('rank')} className="cursor-pointer px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors">RANK</th>
                <th onClick={() => handleSort('businessName')} className="cursor-pointer px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors">BUSINESS IDENTITY</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">STATUS</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">GROWTH OPPORTUNITY</th>
                <th onClick={() => handleSort('leadScore')} className="cursor-pointer px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white text-right">SCORE</th>
                <th className="w-48 px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800/50">
              {sortedLeads.map((lead) => {
                const displayStatus = lead.outreachStatus ?? lead.status ?? 'cold';
                return (
                  <tr key={lead.id} className={`group hover:bg-white/5 transition-all ${selectedIds.has(lead.id) ? 'bg-emerald-900/10' : ''}`}>
                    <td className="px-6 py-4 text-center">
                        <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4"><span className="text-lg font-black text-slate-600 italic group-hover:text-emerald-500 transition-colors">#{lead.rank}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span onClick={() => onInspect(lead.id)} className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors cursor-pointer">{lead.businessName}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{lead.city}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[8px] font-black border uppercase tracking-widest ${displayStatus === 'sent' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-sm"><p className="text-[10px] font-medium text-slate-400 line-clamp-1 italic">"{lead.socialGap}"</p></td>
                    <td className="px-6 py-4 text-right"><span className="text-2xl font-black italic text-emerald-500">{lead.leadScore}</span></td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => onInspect(lead.id)} className="px-4 py-2 bg-white text-black hover:bg-emerald-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">AUDIT</button>
                        <button onClick={() => handleDelete(lead.id)} className="p-2 text-slate-700 hover:text-rose-500 transition-colors">×</button>
                    </td>
                  </tr>
                );
              })}
              {sortedLeads.length === 0 && (
                <tr>
                    <td colSpan={7} className="py-20 text-center text-slate-600 italic uppercase tracking-widest text-xs">
                        Ledger Empty. Use Market Discovery to identify prospects.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DATA MANAGEMENT FOOTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 p-10 bg-[#0b1021]/80 border-2 border-slate-800 rounded-[32px] shadow-xl">
         <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-slate-900 border-2 border-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              IMPORT
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            
            <button 
              onClick={handleExport}
              className="px-6 py-3 bg-slate-900 border-2 border-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              EXPORT
            </button>

            <button 
              onClick={handlePurge}
              className="px-6 py-3 bg-rose-950/20 border-2 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              PURGE
            </button>
         </div>

         <button 
            onClick={handleSaveAll}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800 flex items-center gap-3"
         >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            FORCE COMMIT ALL
         </button>
      </div>

      {activeRunId && <RunStatus runId={activeRunId} onClose={() => setActiveRunId(null)} />}
      <HyperLaunchModal isOpen={showHyperLaunch} onClose={() => setShowHyperLaunch(false)} selectedLeads={leads.filter(l => selectedIds.has(l.id))} onComplete={() => setShowHyperLaunch(false)} />
    </div>
  );
};
