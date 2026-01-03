
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateTaskMatrix } from '../../services/geminiService';

interface TasksNodeProps {
  lead?: Lead;
}

export const TasksNode: React.FC<TasksNodeProps> = ({ lead }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const data = await generateTaskMatrix(lead);
        setTasks(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, [lead]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'complete' : 'pending' } : t));
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Mission Tasks</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">MISSION <span className="text-indigo-600 not-italic">TASKS</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Target Checklist: {lead.businessName}</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-6">
             <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] animate-pulse italic">Crystallizing Mission Objective Matrix...</p>
          </div>
        ) : (
          <div className="space-y-4">
             {tasks.map(t => (
               <div 
                key={t.id} 
                onClick={() => toggleTask(t.id)}
                className={`p-8 rounded-[32px] border cursor-pointer transition-all flex items-center justify-between group ${
                  t.status === 'complete' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-slate-900 border-slate-800 hover:border-indigo-500/40'
                }`}
               >
                  <div className="flex items-center gap-6">
                     <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                       t.status === 'complete' ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-700 group-hover:border-indigo-500'
                     }`}>
                        {t.status === 'complete' && <span className="text-white text-[10px]">✓</span>}
                     </div>
                     <span className={`text-sm font-black italic uppercase tracking-tighter ${t.status === 'complete' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {t.task}
                     </span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${t.status === 'complete' ? 'text-emerald-500' : 'text-slate-600'}`}>{t.status}</span>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
