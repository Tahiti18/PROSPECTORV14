
import React from 'react';

interface HeaderProps {
  onRun: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRun, isLoading }) => {
  return (
    <header className="bg-[#0b1021] border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold">P</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Pomelli <span className="text-emerald-500">LeadEngine</span></h1>
          </div>
          <button
            onClick={onRun}
            disabled={isLoading}
            className={`flex items-center px-6 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all
              ${isLoading 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-emerald-500/20'
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Run Lead Engine'
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
