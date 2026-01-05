
import React, { useState } from 'react';
import { OutreachAssets } from '../types';

interface OutreachSectionProps {
  assets: OutreachAssets;
}

export const OutreachSection: React.FC<OutreachSectionProps> = ({ assets }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Email Section */}
      <div className="space-y-6">
        <div className="bg-[#0b1021] p-6 rounded-xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Email Templates
          </h3>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Opener Options</h4>
            {assets.emailOpeners.map((opener, i) => (
              <div key={i} className="group relative">
                <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 italic">
                  "{opener}"
                </p>
                <button 
                  onClick={() => copyToClipboard(opener, `opener-${i}`)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-800 border border-slate-700 rounded shadow-sm hover:bg-slate-700"
                >
                  <span className="text-[10px] font-bold text-emerald-400">{copied === `opener-${i}` ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            ))}

            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-6">Full Cold Email</h4>
            <div className="group relative">
              <pre className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg border border-slate-800 whitespace-pre-wrap font-sans">
                {assets.fullEmail}
              </pre>
              <button 
                onClick={() => copyToClipboard(assets.fullEmail, 'full-email')}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-slate-800 border border-slate-700 rounded shadow-sm hover:bg-slate-700 flex items-center gap-1"
              >
                <span className="text-[10px] font-bold text-emerald-400">{copied === 'full-email' ? 'COPIED' : 'COPY TEMPLATE'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice/Text Section */}
      <div className="space-y-6">
        <div className="bg-[#0b1021] p-6 rounded-xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Voice & SMS
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cold Call Script (20s)</h4>
              <div className="bg-emerald-900/10 border-l-4 border-emerald-500 p-3 italic text-sm text-slate-300">
                "{assets.callOpener}"
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Voicemail curiosity-hook</h4>
              <div className="bg-emerald-900/10 border-l-4 border-emerald-500 p-3 italic text-sm text-slate-300">
                "{assets.voicemail}"
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">SMS/WhatsApp Follow-up</h4>
              <div className="group relative">
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-sm text-slate-300 flex gap-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">W</div>
                  <p>{assets.smsFollowup}</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(assets.smsFollowup, 'sms')}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-800 border border-slate-700 rounded shadow-sm hover:bg-slate-700"
                >
                  <span className="text-[10px] font-bold text-emerald-400">{copied === 'sms' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
