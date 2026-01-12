
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateTaskMatrix } from '../../services/geminiService';

export const TaskManager: React.FC<{ lead?: Lead }> = ({ lead }) => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (lead) generateTaskMatrix(lead).then(setTasks);
  }, [lead]);

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black uppercase text-white">ACTION <span className="text-emerald-600">ITEMS</span></h1>
      <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-10 space-y-4">
         {tasks.map((t, i) => <div key={i} className="p-4 bg-slate-900 rounded-xl text-slate-300 font-bold uppercase text-[10px]">{t.task}</div>)}
      </div>
    </div>
  );
};
