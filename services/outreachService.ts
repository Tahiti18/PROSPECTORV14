
import { OutreachLog, OutreachChannel, OutreachMode } from '../types';

const LOG_STORAGE_KEY = 'outreachLog'; 
const LOG_CAP = 200;
const SNIPPET_MAX = 240;

type GenerateMailtoArgs = {
  to: string;
  subject: string;
  body: string;
  cc?: string;
};

export type LogInteractionArgs = {
  leadId?: string;
  channel: OutreachChannel;
  mode: OutreachMode;
  to?: string;
  subject?: string;
  body?: string; // used ONLY to derive contentSnippet
};

function mkId() {
  try {
    // @ts-ignore
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeSnippet(body?: string) {
  const v = (body ?? "").replace(/\s+/g, " ").trim();
  if (!v) return undefined;
  // Polish: Append ellipsis if truncated
  return v.length > SNIPPET_MAX ? v.slice(0, SNIPPET_MAX - 1) + '…' : v;
}

export const outreachService = {
  
  // Log interactions to a global persistent log (System of Record)
  // Enforces strict object signature and body truncation
  logInteraction: (args: LogInteractionArgs): OutreachLog => {
    
    const log: OutreachLog = {
      id: mkId(),
      timestamp: Date.now(),
      
      channel: args.channel,
      mode: args.mode,
      
      leadId: args.leadId?.trim() || undefined,
      to: args.to?.trim() || undefined,
      subject: args.subject?.trim() || undefined,
      
      // Body never stored; only a short snippet is persisted.
      contentSnippet: makeSnippet(args.body),
      
      status: 'SENT' // Default status for UI compat
    };

    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      const prev: OutreachLog[] = raw ? JSON.parse(raw) : [];
      // Unshift to add to top, slice to cap
      const next = [log, ...prev].slice(0, LOG_CAP);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist outreach log", e);
    }

    return log;
  },

  getHistory: (): OutreachLog[] => {
    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  generateMailto: ({ to, subject, body, cc }: GenerateMailtoArgs): { url: string; isTruncated: boolean; bodyForMailto: string } => {
    const MAILTO_BODY_LIMIT = 1800;
    const isTruncated = body.length > MAILTO_BODY_LIMIT;
    const bodyForMailto = isTruncated ? body.slice(0, MAILTO_BODY_LIMIT) + '...' : body;

    const params = new URLSearchParams();
    params.append('subject', subject || "");
    params.append('body', bodyForMailto || "");
    if (cc && cc.trim()) params.append('cc', cc.trim());

    // Clean space encoding for mailto compatibility
    const qs = params.toString().replace(/\+/g, '%20');

    return {
      url: `mailto:${encodeURIComponent(to)}?${qs}`,
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
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed"; 
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (err) {
        return false;
      }
    }
  }
};
