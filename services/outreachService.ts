
import { Lead, OutreachLog } from '../types';

const LOG_STORAGE_KEY = 'pomelli_outreach_log_v1';

type GenerateMailtoArgs = {
  to: string;
  subject: string;
  body: string;
  cc?: string;
};

export const outreachService = {
  
  // Log interactions to a global persistent log (System of Record)
  // Refactored to accept structured options for clarity
  logInteraction: (
    leadId: string, 
    type: OutreachLog['type'], 
    details: {
      subject?: string;
      body?: string;
      mode?: 'live' | 'test';
      to?: string;
    }
  ): OutreachLog => {
    const { subject, body, mode = 'live', to = '' } = details;
    
    // Auto-generate snippet from body, fallback to subject
    const contentSnippet = body 
      ? (body.slice(0, 100) + (body.length > 100 ? '...' : '')) 
      : (subject || 'No Content');

    const log: OutreachLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type,
      channel: type, // Explicitly map type to channel for consistency
      mode,
      to,
      subject,
      contentSnippet,
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

  generateMailto: ({ to, subject, body, cc }: GenerateMailtoArgs): { url: string; isTruncated: boolean; bodyForMailto: string } => {
    const MAILTO_BODY_LIMIT = 1800;
    const isTruncated = body.length > MAILTO_BODY_LIMIT;
    const bodyForMailto = isTruncated ? body.slice(0, MAILTO_BODY_LIMIT) + '...' : body;

    const params: string[] = [];
    params.push(`subject=${encodeURIComponent(subject || "")}`);
    params.push(`body=${encodeURIComponent(bodyForMailto || "")}`);
    if (cc && cc.trim()) params.push(`cc=${encodeURIComponent(cc.trim())}`);

    return {
      url: `mailto:${encodeURIComponent(to)}?${params.join("&")}`,
      isTruncated,
      bodyForMailto
    };
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
