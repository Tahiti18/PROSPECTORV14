
import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateLeads } from '../../services/geminiService';
import { Loader } from '../../services/Loader';
import { toast } from '../../services/toastManager';

export const MarketDiscovery: React.FC<{ market: string; onLeadsGenerated: (l: Lead[]) => void }> = ({ market, onLeadsGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [niche, setNiche] = useState('');
  const [volume, setVolume] = useState(6);

  const handleScan = async () => {
    setLoading(true);
    try {
      const result = await generateLeads(market, niche || 'Business', volume);
      const formatted = result.leads.map((l: any, i: number) => ({
        ...l, id: l.id || `L-${Date.now()}-${i}`, status: 'cold', outreachStatus: 'cold', rank: l.rank || i + 1, city: l.city || market, niche: l.niche || niche
      }));
      onLeadsGenerated(formatted);
      toast.success(`${formatted.length} Businesses identified and saved.`);
    } catch (e: any) {
      toast.error(`Discovery Interrupted: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20"><Loader /></div>;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
          LEAD <span className="text-emerald-500">DISCOVERY</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3">Target Region: {market}</p>
      </div>
      <div className="bg-[#0b1021]/80 border border-slate-800 rounded-[32px] p-10 space-y-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Focus Industry</label>
            <input value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-5 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Real Estate..."/>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sample Size</label>
            <div className="flex gap-2">
              {[6, 12, 18, 30].map(v => (
                <button key={v} onClick={() => setVolume(v)} className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${volume === v ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-[#020617] border-slate-800 text-slate-500'}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleScan} className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] text-white shadow-xl active:scale-95 border-b-4 border-emerald-800">INITIATE MARKET DISCOVERY</button>
      </div>
    </div>
  );
};
