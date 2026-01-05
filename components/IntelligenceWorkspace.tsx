
import React, { useState } from 'react';
import { Lead } from '../types';
import { generateLeads } from '../services/geminiService';
import { LeadTable } from './LeadTable';
import { Loader } from '../services/Loader';

interface IntelligenceWorkspaceProps {
  leads: Lead[];
  onLeadsGenerated: (leads: Lead[]) => void;
}

export const IntelligenceWorkspace: React.FC<IntelligenceWorkspaceProps> = ({ leads, onLeadsGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState('Cyprus');
  const [nicheHint, setNicheHint] = useState('');

  const handleRunDiscovery = async () => {
    setLoading(true);
    try {
      const result = await generateLeads(region, nicheHint, 10);
      // Map result.leads to our component-friendly Lead objects
      const formattedLeads: Lead[] = result.leads.map((l: any, i: number) => ({
        ...l,
        id: `lead-${Date.now()}-${i}`,
        status: 'cold'
      }));
      onLeadsGenerated(formattedLeads);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Target Region</label>
            <input 
              type="text" 
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Cyprus, Dubai, London..."
            />
          </div>
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Specific Niche (Optional)</label>
            <input 
              type="text" 
              value={nicheHint}
              onChange={(e) => setNicheHint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Plastic Surgery, Yacht Charters..."
            />
          </div>
          <button 
            onClick={handleRunDiscovery}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? 'Scanning Theater...' : 'Initiate Discovery'}
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : leads.length > 0 ? (
        <div className="animate-in fade-in zoom-in-95 duration-700">
           <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Scanned Lead Assets</h3>
                <div className="flex gap-2">
                    <span className="text-[10px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded font-bold uppercase">30 Targets Locked</span>
                </div>
           </div>
           <LeadTable leads={leads} />
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-slate-500">
          <span className="text-4xl mb-4">📡</span>
          <p className="text-sm font-medium">Ready for regional data sweep.</p>
        </div>
      )}
    </div>
  );
};