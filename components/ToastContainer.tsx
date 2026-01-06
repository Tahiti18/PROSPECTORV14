
import React, { useState, useEffect } from 'react';
import { toast, ToastType } from '../services/toastManager';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = toast.subscribe((id, type, message) => {
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    });
    return () => { unsub(); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`
            pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-10 duration-300
            ${t.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100' : ''}
            ${t.type === 'error' ? 'bg-rose-950/80 border-rose-500/50 text-rose-100' : ''}
            ${t.type === 'info' ? 'bg-slate-900/80 border-slate-700 text-slate-100' : ''}
            ${t.type === 'neural' ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-100' : ''}
          `}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">
              {t.type === 'success' && '✅'}
              {t.type === 'error' && '🛑'}
              {t.type === 'info' && 'ℹ️'}
              {t.type === 'neural' && '🧠'}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
                {t.type === 'neural' ? 'SYSTEM INTELLIGENCE' : t.type}
              </p>
              <p className="text-xs font-medium leading-relaxed">{t.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
