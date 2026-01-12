
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { fetchViralPulseData, queryRealtimeAgent } from '../../services/geminiService';

export const MarketTrends: React.FC<{ lead?: Lead }> = ({ lead }) => {
  const [query, setQuery] = useState('');
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  const handleRunAgent = async () => {
    if (!query.trim()) return;
    setIsAgentThinking(true);
    try {
        const result = await queryRealtimeAgent(query);
        setAgentResponse(result.text || "No data returned.");
    } catch(e) {
        setAgentResponse("Search failed.");
    } finally {
        setIsAgentThinking(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in fade-in duration-700">
      <h1 className="text-4xl font-bold uppercase text-white">MARKET <span className="text-emerald-500">TRENDS</span></h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl">
          <textarea value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-6 text-white h-24 mb-4" placeholder="Audit current trends..." />
          <button onClick={handleRunAgent} className="bg-emerald-600 px-8 py-4 rounded-xl text-xs font-black uppercase text-white">SCAN TRENDS</button>
          {agentResponse && <div className="mt-8 p-8 bg-slate-900 rounded-3xl text-slate-300">{agentResponse}</div>}
        </div>
      </div>
    </div>
  );
};
