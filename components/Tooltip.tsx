
import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  width?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'top', width = 'w-64' }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3'
  };

  return (
    <div className="group relative flex shrink-0 z-50">
      {children}
      <div className={`pointer-events-none absolute ${positionClasses[side]} ${width} opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-1 z-[100]`}>
        <div className="bg-[#0f172a] border border-slate-700/80 text-slate-300 text-xs font-medium leading-relaxed p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl relative">
           {/* Subtle arrow based on side */}
           {side === 'top' && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-b border-r border-slate-700/80 rotate-45"></div>}
           {side === 'bottom' && <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-t border-l border-slate-700/80 rotate-45"></div>}
           {side === 'left' && <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#0f172a] border-t border-r border-slate-700/80 rotate-45"></div>}
           {side === 'right' && <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#0f172a] border-b border-l border-slate-700/80 rotate-45"></div>}
           
           <span className="block text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-1">Intelligence Note</span>
           {content}
        </div>
      </div>
    </div>
  );
};
