
import React, { useState } from 'react';
import { Lead } from '../../types';
import { outreachService } from '../../services/outreachService';

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: any;
  lead: Lead;
  onSent: () => void;
}

export const OutreachModal: React.FC<OutreachModalProps> = ({ isOpen, onClose, dossier, lead, onSent }) => {
  if (!isOpen) return null;

  const emailData = dossier.data.outreach.emailSequence[0] || { subject: "Opportunity", body: "Hi there..." };
  const [subject, setSubject] = useState(emailData.subject);
  const [body, setBody] = useState(emailData.body);
  const [channel, setChannel] = useState<'GMAIL' | 'LINKEDIN'>('GMAIL');

  const handleLaunch = () => {
    // 1. Trigger the native client
    if (channel === 'GMAIL') {
      const mailto = outreachService.generateMailto(lead.email || '', subject, body);
      window.open(mailto, '_blank');
    } else {
      // For LinkedIn, we copy to clipboard and open their profile
      navigator.clipboard.writeText(body);
      const url = lead.websiteUrl; // Fallback, assuming LinkedIn might be in contactUrl
      window.open(url, '_blank');
      alert("Message copied to clipboard. Opening target URL...");
    }

    // 2. Update System of Record
    outreachService.logInteraction(lead.id, channel === 'GMAIL' ? 'EMAIL' : 'LINKEDIN', subject);
    
    // 3. Close & Refresh
    onSent();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-[#0b1021] border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">CAMPAIGN <span className="text-emerald-500">PRE-FLIGHT</span></h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Target: {lead.businessName} ({lead.email || 'NO_EMAIL'})</p>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => setChannel('GMAIL')}
               className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${channel === 'GMAIL' ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
             >
               GMAIL
             </button>
             <button 
               onClick={() => setChannel('LINKEDIN')}
               className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${channel === 'LINKEDIN' ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
             >
               LINKEDIN
             </button>
          </div>
        </div>

        {/* Editor */}
        <div className="p-8 space-y-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject Line</label>
              <input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Message Body</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-emerald-500 h-64 resize-none leading-relaxed"
              />
           </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-4">
           <button onClick={onClose} className="px-6 py-3 rounded-xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">CANCEL</button>
           <button 
             onClick={handleLaunch}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-3"
           >
             <span>🚀</span> LAUNCH SEQUENCE
           </button>
        </div>

      </div>
    </div>
  );
};
