
import React, { useState } from 'react';
import { Lead } from '../../types';

export const AutomatedSearch: React.FC<{ market: string; onNewLeads: (leads: Lead[]) => void }> = ({ market }) => {
  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-bold uppercase text-white">AUTOMATED <span className="text-emerald-600">SEARCH</span></h1>
      <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-10 text-center opacity-30 italic">
        Autonomous signal scanning ready for {market}.
      </div>
    </div>
  );
};
