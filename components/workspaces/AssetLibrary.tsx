
import React, { useState, useEffect } from 'react';
import { AssetRecord, subscribeToAssets } from '../../services/geminiService';

export const AssetLibrary: React.FC = () => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAssets(setAssets);
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-bold uppercase text-white">ASSET <span className="text-emerald-600">LIBRARY</span></h1>
      <div className="grid grid-cols-3 gap-6">
         {assets.map(a => (
           <div key={a.id} className="bg-[#0b1021] border border-slate-800 p-6 rounded-3xl">
              <span className="text-[10px] font-black text-emerald-500 uppercase">{a.type}</span>
              <h4 className="text-white font-bold mt-2 truncate">{a.title}</h4>
           </div>
         ))}
      </div>
    </div>
  );
};
