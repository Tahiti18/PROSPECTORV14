import React, { useState } from 'react';
import { Lead } from '../../types';
import { generateLeads } from '../../services/geminiService';
import { Loader } from '../../services/Loader';

interface RadarReconProps {
  theater: string;
  onLeadsGenerated: (leads: Lead[]) => void;
}

export const RadarRecon: React.FC<RadarReconProps> = ({ theater, onLeadsGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [niche, setNiche] = useState('');
  const [leadCount, setLeadCount] = useState(6);

  const handleScan = async () => {
    if (!process.env.API_KEY) {
      alert("SYSTEM ERROR: API Key is missing.\n\nFOR RAILWAY:\nGo to Settings > Variables and add API_KEY.\n\nFOR LOCAL/DEV:\nCreate a .env file in the root with: API_KEY=your_key");
      return;
    }
    
    setLoading(true);
    try {
      const [result] = await Promise.all([
        generateLeads(theater, niche, leadCount),
        new Promise(resolve => setTimeout(resolve, 8000))
      ]);
      
      if (!result || !result.leads || !Array.isArray(result.leads)) {
        throw new Error("The AI returned an invalid data structure. This usually happens if search citations interfere with the JSON.");
      }

      const formattedLeads: Lead[] = result.leads.map((l: any, i: number) => ({
        ...l,
        id: l.id || `L-${Date.now()}-${i}`,
        status: 'cold',
        rank: l.rank || i + 1,
        businessName: l.businessName || 'UNIDENTIFIED_TARGET',
        websiteUrl: l.websiteUrl || '#',
        leadScore: l.leadScore || 50,
        assetGrade: l.assetGrade || 'C',
        city: l.city || theater,
        niche: l.niche || niche || 'AI Transformation',
        socialGap: l.socialGap || 'No manual social gap detected yet.',
        groundingSources: result.groundingSources || []
      }));

      onLeadsGenerated(formattedLeads);
    } catch (e) {
      console.error("Discovery Engine Error:", e);
      alert(`CRITICAL ERROR: Intelligence gathering failed.\n\nPotential Causes:\n1. Invalid API Key or Quota Exceeded\n2. AI returned unstructured text\n3. Network Timeout\n\nCheck 'Prod Log' in the sidebar for technical trace.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20"><Loader /></div>;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-4">Area Scan Initiation</h2>
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">RADAR <span className="text-indigo-600 not-italic">RECON</span></h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3">Active Theater: {theater}</p>
      </div>

      <div className="bg-[#0b1021]/80 border border-slate-800 rounded-[32px] p-10 space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Niche</label>
            <input 
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 rounded-xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              placeholder="e.g. Luxury Real Estate..."
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Scan Intensity</label>
            <div className="flex gap-2">
              {[6, 12, 18, 30].map(count => (
                <button
                  key={count}
                  onClick={() => setLeadCount(count)}
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${
                    leadCount === count 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
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
          className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 border border-indigo-400/20"
        >
          <span className="text-xl">📡</span>
          INITIATE AREA SWEEP
        </button>
      </div>
    </div>
  );
};