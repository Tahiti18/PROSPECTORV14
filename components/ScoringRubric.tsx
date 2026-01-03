
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
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-2xl mb-2">{c.icon}</div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">{c.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-4">Pomelli Asset Grade Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-green-100 text-green-600 flex items-center justify-center rounded-lg font-bold flex-shrink-0">A</div>
            <div>
              <p className="text-xs font-bold text-gray-900">Exceptional</p>
              <p className="text-xs text-gray-500 mt-1">{rubric.grades.A}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg font-bold flex-shrink-0">B</div>
            <div>
              <p className="text-xs font-bold text-gray-900">Solid Viability</p>
              <p className="text-xs text-gray-500 mt-1">{rubric.grades.B}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-gray-100 text-gray-600 flex items-center justify-center rounded-lg font-bold flex-shrink-0">C</div>
            <div>
              <p className="text-xs font-bold text-gray-900">Borderline</p>
              <p className="text-xs text-gray-500 mt-1">{rubric.grades.C}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
