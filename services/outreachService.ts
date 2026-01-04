
import { Lead, OutreachLog } from '../types';

const LOG_STORAGE_KEY = 'pomelli_outreach_log_v1';

export const outreachService = {
  
  // Log interactions to a global persistent log (System of Record)
  logInteraction: (leadId: string, type: OutreachLog['type'], contentSnippet: string): OutreachLog => {
    const log: OutreachLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type,
      contentSnippet: contentSnippet.slice(0, 100) + '...',
      status: 'SENT'
    };

    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      const history: OutreachLog[] = raw ? JSON.parse(raw) : [];
      history.unshift(log);
      // Keep last 500 logs globally
      if (history.length > 500) history.pop();
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to persist outreach log", e);
    }

    return log;
  },

  generateMailto: (email: string, subject: string, body: string): string => {
    const encSubject = encodeURIComponent(subject);
    const encBody = encodeURIComponent(body);
    return `mailto:${email}?subject=${encSubject}&body=${encBody}`;
  },

  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; 
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch (err) {
        document.body.removeChild(ta);
        return false;
      }
    }
  }
};
