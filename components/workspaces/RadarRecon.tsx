import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateLeads } from '../../services/geminiService';
import { Loader } from '../../services/Loader';
import { toast } from '../../services/toastManager';

interface RadarReconProps {
  theater: string;
  onLeadsGenerated: (leads: Lead[]) => void;
}

export const RadarRecon: React.FC<RadarReconProps> = ({ theater, onLeadsGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [niche, setNiche] = useState('');
  const [leadCount, setLeadCount] = useState(6);

  const handleScan = async () => {
    if (!theater) {
        toast.error("Please select a target market.");
        return;
    }
    
    setLoading(true);
    try {
      // Direct call - removed the 8s sleep which caused UX breakage
      const result = await generateLeads(theater, niche || 'High-Ticket Business', leadCount);
      
      if (!result.leads || result.leads.length === 0) {
          toast.info("Market scan complete, but no new targets identified in this vector.");
          return;
      }

      const formattedLeads: Lead[] = result.leads.map((l: any, i: number) => ({
        ...l,
        id: l.id || `L-${Date.now()}-${i}`,
        status: 'cold',
        outreachStatus: 'cold',
        rank: l.rank || i + 1,
        businessName: l.businessName || 'UNIDENTIFIED_TARGET',
        websiteUrl: l.websiteUrl || '#',
        leadScore: l.leadScore || 50,
        assetGrade: l.assetGrade || 'C',
        city: l.city || theater,
        niche: l.niche || niche || 'AI Transformation',
        socialGap: l.socialGap || 'Social deficiency detected.',
        groundingSources: result.groundingSources || []
      }));

      onLeadsGenerated(formattedLeads);
      toast.success(`${formattedLeads.length} Targets synchronized with Ledger.`);
      
    } catch (e: any) {
      console.error(e);
      toast.error(`Neural Link Interrupted: ${e.message || 'Check connection'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20"><Loader /></div>;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] mb-4">Market Discovery Initiation</h2>
        <h1 className="text-4xl font-bold uppercase tracking-tight text-white leading-none">LEAD <span className="text-emerald-600">DISCOVERY</span></h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3">Active Market: {theater}</p>
      </div>

      <div className="bg-[#0b1021]/80 border border-slate-800 rounded-[32px] p-10 space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Niche</label>
            <input 
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 rounded-xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
              placeholder="e.g. Luxury Real Estate..."
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Scan Volume</label>
            <div className="flex gap-2">
              {[6, 12, 18, 30].map(count => (
                <button
                  key={count}
                  onClick={() => setLeadCount(count)}
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${
                    leadCount === count 
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' 
                      : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button 
          onClick={handleScan}
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3 border border-emerald-400/20"
        >
          <span className="text-xl">📡</span>
          START MARKET SCAN
        </button>
      </div>
    </div>
  );
};
