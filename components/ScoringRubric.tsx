
import React from 'react';
import { EngineResult } from '../types';

interface ScoringRubricProps {
  rubric: EngineResult['rubric'];
}

export const ScoringRubric: React.FC<ScoringRubricProps> = ({ rubric }) => {
  const criteria = [
    { title: 'Visual Richness (0–40)', desc: rubric.visual, icon: '🖼️' },
    { title: 'Social Deficit (0–30)', desc: rubric.social, icon: '📉' },
    { title: 'High-ticket Plausibility (0–20)', desc: rubric.highTicket, icon: '💎' },
    { title: 'Reachability (0–10)', desc: rubric.reachability, icon: '📞' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {criteria.map((c, i) => (
          <div key={i} className="bg-[#0b1021] p-5 rounded-xl border border-slate-800 shadow-lg">
            <div className="text-2xl mb-2">{c.icon}</div>
            <h4 className="font-bold text-white text-sm mb-1">{c.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0b1021] p-6 rounded-xl border border-slate-800 shadow-lg">
        <h4 className="font-bold text-white mb-4">Pomelli Asset Grade Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-emerald-900/20 text-emerald-400 flex items-center justify-center rounded-lg font-bold flex-shrink-0 border border-emerald-500/20">A</div>
            <div>
              <p className="text-xs font-bold text-white">Exceptional</p>
              <p className="text-xs text-slate-400 mt-1">{rubric.grades.A}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-indigo-900/20 text-indigo-400 flex items-center justify-center rounded-lg font-bold flex-shrink-0 border border-indigo-500/20">B</div>
            <div>
              <p className="text-xs font-bold text-white">Solid Viability</p>
              <p className="text-xs text-slate-400 mt-1">{rubric.grades.B}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-slate-800 text-slate-400 flex items-center justify-center rounded-lg font-bold flex-shrink-0 border border-slate-700">C</div>
            <div>
              <p className="text-xs font-bold text-white">Borderline</p>
              <p className="text-xs text-slate-400 mt-1">{rubric.grades.C}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
