
import React, { useState } from 'react';

export const CipherNode: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<number>(1);

  const layers = [
    { id: 1, name: 'ENCRYPTION LAYER', status: 'ACTIVE', integrity: '100%' },
    { id: 2, name: 'ACCESS LOGS', status: 'SECURE', integrity: '100%' },
    { id: 3, name: 'API GATEWAY', status: 'MONITORED', integrity: '99.9%' }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">CIPHER <span className="text-emerald-600 not-italic">NODE</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Security & Encryption Matrix</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative overflow-hidden flex flex-col items-center">
         <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {layers.map((l) => (
               <div 
                 key={l.id}
                 onClick={() => setActiveLayer(l.id)}
                 className={`p-6 rounded-[24px] border cursor-pointer transition-all ${
                   activeLayer === l.id 
                     ? 'bg-emerald-900/10 border-emerald-500/30' 
                     : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                 }`}
               >
                  <div className="flex justify-between items-start mb-4">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">