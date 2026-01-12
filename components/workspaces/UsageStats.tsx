
import React, { useState, useEffect } from 'react';
import { subscribeToCompute } from '../../services/computeTracker';

export const UsageStats: React.FC = () => {
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    const unsub = subscribeToCompute((s) => setTokens(s.sessionTokens));
    return () => unsub();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black uppercase text-white">COMPUTE <span className="text-emerald-600">STATS</span></h1>
      <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-16 text-center">
         <span className="text-slate-500 font-black uppercase text-[10px]">Session Tokens</span>
         <p className="text-6xl font-black text-white mt-4">{tokens.toLocaleString()}</p>
      </div>
    </div>
  );
};
