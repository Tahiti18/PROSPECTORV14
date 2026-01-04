
import React, { useState, useEffect } from 'react';
import { Lead, OutreachStatus } from '../../types';
import { outreachService } from '../../services/outreachService';

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: any;
  lead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onSent?: () => void;
}

export const OutreachModal: React.FC<OutreachModalProps> = ({ isOpen, onClose, dossier, lead, onUpdateLead, onSent }) => {
  if (!isOpen) return null;

  const emailData = dossier.data.outreach?.emailSequence?.[0] || { subject: "Opportunity", body: "Hi there..." };
  const linkedinData = dossier.data.outreach?.linkedin || "Hi, I'd like to connect.";
  
  const [subject, setSubject] = useState(emailData.subject);
  const [body, setBody] = useState(emailData.body);
  const [channel, setChannel] = useState<'GMAIL' | 'LINKEDIN'>('GMAIL');
  const [isSending, setIsSending] = useState(false);

  // New: Admin/Test Mode State
  const [sendMode, setSendMode] = useState<'LIVE' | 'TEST'>('LIVE');
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('pomelli_admin_email') || 'admin@pomelli.agency');

  // Persist admin email preference
  useEffect(() => {
    localStorage.setItem('pomelli_admin_email', adminEmail);
  }, [adminEmail]);

  // Switch content based on channel
  const handleChannelSwitch = (c: 'GMAIL' | 'LINKEDIN') => {
    setChannel(c);
    if (c === 'GMAIL') {
      setSubject(emailData.subject);
      setBody(emailData.body);
    } else {
      setSubject("LinkedIn Note");
      setBody(linkedinData);
    }
  };

  const handleLaunch = async () => {
    setIsSending(true);
    
    // Determine Recipient
    const targetEmail = sendMode === 'TEST' ? adminEmail : (lead.email || '');
    
    // 1. Trigger the native client (V1 Logic)
    if (channel === 'GMAIL') {
      const mailto = outreachService.generateMailto(targetEmail, subject, body);
      window.open(mailto, '_blank');
    } else {
      // For LinkedIn, we copy to clipboard and attempt to open URL
      await outreachService.copyToClipboard(body);
      // Try to find LinkedIn URL or fallback to website
      const targetUrl = lead.contactUrl || lead.websiteUrl;
      window.open(targetUrl, '_blank');
      if (sendMode === 'TEST') alert(`[TEST MODE] Payload copied. Would open: ${targetUrl}`);
      else alert("Message copied to clipboard. Opening target URL...");
    }

    // 2. Log Interaction
    const logType = channel === 'GMAIL' ? 'EMAIL' : 'LINKEDIN';
    const logMode = sendMode === 'TEST' ? 'test' : 'live';
    
    const log = outreachService.logInteraction(lead.id, logType, subject, logMode, targetEmail);
    
    // 3. Update Lead Status (System of Record) - ONLY IF LIVE
    if (sendMode === 'LIVE') {
        const newHistory = [log, ...(lead.outreachHistory || [])];
        
        onUpdateLead(lead.id, {
          outreachStatus: 'sent',
          status: 'sent', // Legacy sync
          lastContactAt: Date.now(),
          outreachHistory: newHistory,
          nextFollowUpAt: Date.now() + (3 * 24 * 60 * 60 * 1000) // +3 days
        });
    }

    // Simulate brief processing for UX
    await new Promise(r => setTimeout(r, 600));
    
    setIsSending(false);
    if (onSent) onSent();
    // Don't close immediately on test so user can iterate
    if (sendMode === 'LIVE') onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-[#0b1021] border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
        
        {/* Left: Configuration */}
        <div className="flex-1 flex flex-col border-r border-slate-800">
            {/* Header */}
            <div className="p-8 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">CAMPAIGN <span className="text-emerald-500">PRE-FLIGHT</span></h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Target: {lead.businessName} ({lead.email || 'NO_EMAIL'})</p>
            </div>

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
               {/* Channel Selector */}
               <div className="flex gap-2">
                 <button 
                   onClick={() => handleChannelSwitch('GMAIL')}
                   className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${channel === 'GMAIL' ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
                 >
                   GMAIL
                 </button>
                 <button 
                   onClick={() => handleChannelSwitch('LINKEDIN')}
                   className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${channel === 'LINKEDIN' ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
                 >
                   LINKEDIN
                 </button>
               </div>

               {/* Editor Inputs */}
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject Line</label>
                     <input 
                       value={subject}
                       onChange={(e) => setSubject(e.target.value)}
                       className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Message Body</label>
                     <textarea 
                       value={body}
                       onChange={(e) => setBody(e.target.value)}
                       className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-emerald-500 h-64 resize-none leading-relaxed custom-scrollbar"
                     />
                  </div>
               </div>
            </div>
        </div>

        {/* Right: Preview & Launch */}
        <div className="w-full md:w-80 bg-slate-900/50 flex flex-col">
            <div className="p-6 border-b border-slate-800 space-y-4">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SEND MODE</label>
                  <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                     <button 
                       onClick={() => setSendMode('LIVE')}
                       className={`flex-1 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${sendMode === 'LIVE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       LIVE
                     </button>
                     <button 
                       onClick={() => setSendMode('TEST')}
                       className={`flex-1 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${sendMode === 'TEST' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       TEST
                     </button>
                  </div>
               </div>

               {sendMode === 'TEST' && (
                 <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest">ADMIN DESTINATION</label>
                    <input 
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                 </div>
               )}
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
               <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PAYLOAD PREVIEW</h3>
               <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                     <span className="text-[8px] font-bold text-slate-600 uppercase">RECIPIENT</span>
                     <p className="font-mono text-slate-300 truncate bg-slate-950 px-2 py-1 rounded border border-slate-800">
                       {sendMode === 'TEST' ? adminEmail : (lead.email || 'NO_EMAIL')}
                     </p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[8px] font-bold text-slate-600 uppercase">SUBJECT</span>
                     <p className="font-medium text-slate-300 truncate">{subject}</p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[8px] font-bold text-slate-600 uppercase">BODY SNIPPET</span>
                     <p className="text-slate-400 italic line-clamp-4 border-l-2 border-slate-700 pl-2">
                       "{body}"
                     </p>
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-800 space-y-3">
               <button 
                 onClick={handleLaunch}
                 disabled={isSending}
                 className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
                   sendMode === 'LIVE' 
                     ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' 
                     : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                 }`}
               >
                 {isSending ? (
                    <>
                      <div className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${sendMode === 'LIVE' ? 'border-white' : 'border-black'}`}></div>
                      <span>LOGGING...</span>
                    </>
                 ) : (
                    <>
                      <span>🚀</span> {sendMode === 'LIVE' ? 'LAUNCH LIVE' : 'SEND TEST'}
                    </>
                 )}
               </button>
               <button onClick={onClose} className="w-full py-3 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                 CANCEL FLIGHT
               </button>
            </div>
        </div>

      </div>
    </div>
  );
};
