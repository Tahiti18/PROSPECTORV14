
import { Lead, OutreachLog, OutreachStatus } from '../types';
import { db } from './automation/db'; // Re-use the existing DB logic for persistence

export const outreachService = {
  
  // Log an interaction and update lead status
  logInteraction: (leadId: string, type: OutreachLog['type'], contentSnippet: string): Lead | null => {
    const leads = db.getLeads();
    const leadIndex = leads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) return null;
    
    const log: OutreachLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      type,
      contentSnippet: contentSnippet.slice(0, 50) + '...',
      status: 'SENT'
    };

    const updatedLead = { ...leads[leadIndex] };
    
    // Init history array if missing
    if (!updatedLead.outreachHistory) updatedLead.outreachHistory = [];
    
    updatedLead.outreachHistory.unshift(log);
    updatedLead.status = 'sent'; // Auto-move pipeline stage
    updatedLead.lastContactAt = Date.now();
    
    // Set default follow-up to 3 days
    updatedLead.nextFollowUp = Date.now() + (3 * 24 * 60 * 60 * 1000);

    leads[leadIndex] = updatedLead;
    db.saveLeads(leads);
    
    return updatedLead;
  },

  // Generate a mailto link for V1 quick sending
  generateMailto: (email: string, subject: string, body: string): string => {
    const encSubject = encodeURIComponent(subject);
    const encBody = encodeURIComponent(body);
    return `mailto:${email}?subject=${encSubject}&body=${encBody}`;
  },

  // Update status manually (e.g., if user marked as Replied)
  updateStatus: (leadId: string, status: OutreachStatus) => {
    const leads = db.getLeads();
    const idx = leads.findIndex(l => l.id === leadId);
    if (idx !== -1) {
      leads[idx].status = status;
      db.saveLeads(leads);
    }
  }
};
