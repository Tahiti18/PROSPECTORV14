
import React, { useState, useRef } from 'react';
import { Lead } from '../../types';
import { generateLeads } from '../../services/geminiService';
import { Loader } from '../../services/Loader';
import { toast } from '../../services/toastManager';
import { db } from '../../services/automation/db';

interface MarketDiscoveryProps {
  market: string;
  onLeadsGenerated: (l: Lead[]) => void;
}

export const MarketDiscovery: React.FC<MarketDiscoveryProps> = ({ market, onLeadsGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [niche, setNiche] = useState('');
  const [volume, setVolume] = useState(6);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async () => {
    if (!market) {
        toast.error("Please select a target market.");
        return;
    }
    setLoading(true);
    try {
      const result = await generateLeads(market, niche || 'Business', volume);
      if (!result.leads || !Array.isArray(result.leads)) {
          throw new Error("Invalid response structure from AI.");
      }

      const formatted: Lead[] = result.leads.map((l: any, i: number) => ({
        ...l, 
        id: l.id || `L-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`, 
        status: 'cold', 
        outreachStatus: 'cold', 
        rank: i + 1, 
        city: l.city || market, 
        niche: l.niche || niche || 'AI Transformation',
        leadScore: l.leadScore || 85,
        assetGrade: l.assetGrade || 'A'
      }));

      // Merging new findings into database with deduplication logic
      const mergedLeads = db.upsertLeads(formatted);
      
      onLeadsGenerated(formatted);
      toast.success(`${formatted.length} Businesses identified and synchronized with Ledger.`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Discovery Interrupted: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const leads = db.getLeads();
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
                db.saveLeads(imported);
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

  const handleManualCommit = () => {
    const currentLeads = db.getLeads();
    db.saveLeads(currentLeads);
    toast.success("DATABASE SYNCHRONIZED AND PERSISTED");
  };

  if (loading) return <div className="py-20"><Loader /></div>;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500 pb-40">
      <div className="text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
          LEAD <span className="text-emerald-500 italic">DISCOVERY</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3">Target Region: {market}</p>
      </div>

      <div className="bg-[#0b1021]/80 border-2 border-slate-800 rounded-[32px] p-10 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Focus Industry</label>
            <input 
              value={niche} 
              onChange={(e) => setNiche(e.target.value)} 
              className="w-full bg-[#020617] border-2 border-slate-800 rounded-xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-all shadow-inner" 
              placeholder="e.g. Real Estate..."
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sample Size</label>
            <div className="flex gap-2">
              {[6, 12, 18, 30].map(v => (
                <button 
                  key={v} 
                  onClick={() => setVolume(v)} 
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black border-2 transition-all ${volume === v ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-600'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button 
          onClick={handleScan} 
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800 transition-all relative z-10"
        >
          INITIATE MARKET SCAN
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-10 bg-[#0b1021]/80 border-2 border-slate-800 rounded-[32px] shadow-xl relative z-10">
         <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-slate-900 border-2 border-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <span>⬆️</span> IMPORT LEDGER
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            
            <button 
              onClick={handleExport}
              className="px-6 py-3 bg-slate-900 border-2 border-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <span>⬇️</span> EXPORT LEDGER
            </button>
         </div>

         <button 
            onClick={handleManualCommit}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800 flex items-center gap-3"
         >
            <span>💾</span> COMMIT ALL CHANGES
         </button>
      </div>
    </div>
  );
};
