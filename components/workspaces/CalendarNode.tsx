
import React, { useMemo } from 'react';
import { Lead } from '../../types';

interface CalendarNodeProps {
  leads: Lead[];
}

export const CalendarNode: React.FC<CalendarNodeProps> = ({ leads }) => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Distribute active leads across a mock 28-day calendar
  const calendarData = useMemo(() => {
    const activeLeads = leads.filter(l => l.status !== 'cold');
    const schedule: Record<number, Lead[]> = {};
    
    activeLeads.forEach((lead, i) => {
      const day = (i % 20) + 1; // Distribute over first 20 days
      if (!schedule[day]) schedule[day] = [];
      schedule[day].push(lead);
    });
    return schedule;
  }, [leads]);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-6">
        <div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">SCHEDULE <span className="text-emerald-600 not-italic">HUB</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1 italic italic">Deployment Synchronization</p>
        </div>
        <div className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-lg">
           <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Ops: {leads.length} Nodes</span>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
         <div className="grid grid-cols-7 gap-3">
            {days.map(d => (
              <div key={d} className="text-center py-2 border-b border-slate-800 mb-2">
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{d}</span>
              </div>
            ))}
            
            {[...Array(28)].map((_, i) => {
              const date = i + 1;
              const scheduled = calendarData[date] || [];
              return (
                <div key={i} className={`aspect-square bg-slate-950 border rounded-xl p-2 flex flex-col justify-between transition-all cursor-pointer group ${scheduled.length > 0 ? 'border-emerald-500/30 hover:bg-emerald-900/10' : 'border-slate-800/40 hover:border-slate-700'}`}>
                   <span className="text-[9px] font-black text-slate-700 group-hover:text-slate-500">{date}</span>
                   
                   {scheduled.length > 0 ? (
                     <div className="space-y-1">
                        <div className="h-1 w-full bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <p className="text-[7px] font-black text-emerald-400 uppercase truncate leading-none">
                          {scheduled.length} TARGETS
                        </p>
                     </div>
                   ) : (
                     i === 14 && (
                       <div className="space-y-1">
                          <div className="h-1 w-full bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                          <p className="text-[7px] font-black text-indigo-400 uppercase truncate leading-none">PIPELINE REVIEW</p>
                       </div>
                     )
                   )}
                </div>
              );
            })}
         </div>

         <div className="mt-8 pt-6 border-t border-slate-800/50 flex gap-8">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Outreach Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Milestone</span>
            </div>
         </div>
      </div>
    </div>
  );
};
