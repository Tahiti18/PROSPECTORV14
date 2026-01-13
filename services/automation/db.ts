
import { AutomationRun, isAutomationRun } from './types';
import { Lead } from '../../types';
import { toast } from '../toastManager';

const DB_KEY = 'pomelli_automation_db_v1';
const STORAGE_KEY_LEADS = 'pomelli_os_leads_v14_final';
const MUTEX_KEY = 'pomelli_automation_mutex_v1';

type DbV1 = { version: 1; runs: Record<string, AutomationRun> };

// Event Bus for Leads
type Listener = (leads: Lead[]) => void;
const listeners = new Set<Listener>();

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function normalizeRunsMap(maybeRuns: unknown): Record<string, AutomationRun> {
  if (!isRecord(maybeRuns)) return {};
  const out: Record<string, AutomationRun> = {};
  for (const [id, val] of Object.entries(maybeRuns)) {
    if (isAutomationRun(val)) out[id] = val;
  }
  return out;
}

function writeDb(db: DbV1) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e: any) {
    console.error("[AutoDB] Write failed", e);
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      toast.error("STORAGE FULL: Cannot save automation run.");
    }
  }
}

const getDbInternal = (): DbV1 => {
  const raw = localStorage.getItem(DB_KEY);
  const parsed = safeParse(raw);

  if (isRecord(parsed) && "runs" in parsed) {
    const runs = normalizeRunsMap((parsed as any).runs);
    const normalized: DbV1 = { version: 1, runs };
    return normalized;
  }

  if (isRecord(parsed)) {
    const legacyRuns = normalizeRunsMap(parsed);
    return { version: 1, runs: legacyRuns };
  }

  return { version: 1, runs: {} };
};

export const db = {
  acquireMutex: async (ownerId: string, ttlMs: number = 5000): Promise<boolean> => {
    await sleep(Math.random() * 30 + 10);
    const now = Date.now();
    const raw = localStorage.getItem(MUTEX_KEY);
    if (raw) {
      try {
        const lock = JSON.parse(raw);
        if (lock.expiresAt > now && lock.ownerId !== ownerId) return false;
      } catch (e) {}
    }
    const newLock = { ownerId, expiresAt: now + ttlMs };
    localStorage.setItem(MUTEX_KEY, JSON.stringify(newLock));
    await sleep(25);
    const verify = localStorage.getItem(MUTEX_KEY);
    if (!verify) return false;
    try {
      const verifyLock = JSON.parse(verify);
      return verifyLock.ownerId === ownerId;
    } catch { return false; }
  },

  releaseMutex: (ownerId: string) => {
    const raw = localStorage.getItem(MUTEX_KEY);
    if (raw) {
      try {
        const lock = JSON.parse(raw);
        if (lock.ownerId === ownerId) localStorage.removeItem(MUTEX_KEY);
      } catch (e) { localStorage.removeItem(MUTEX_KEY); }
    }
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    // Immediately emit current state to new subscriber
    listener(db.getLeads());
    return () => { listeners.delete(listener); };
  },

  getLeads: (): Lead[] => {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS);
    const data = safeParse(raw);
    return Array.isArray(data) ? data as Lead[] : [];
  },

  saveLeads: (leads: Lead[]) => {
    if (!leads || !Array.isArray(leads)) {
      console.warn("Attempted to save invalid leads array to DB.");
      return;
    }
    try {
        localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
        // Broadcast to all active listeners (App.tsx state)
        listeners.forEach(l => l([...leads]));
        console.log(`[Persistence] ${leads.length} records committed to local storage.`);
    } catch (e: any) {
        console.error("Save Leads Failed", e);
        if (e.name === 'QuotaExceededError') {
            toast.error("STORAGE FULL: Export data to free up space.");
        }
    }
  },

  upsertLeads: (newLeads: Lead[]) => {
    const current = db.getLeads();
    const currentMap = new Map(current.map(l => [l.id, l]));
    
    newLeads.forEach(nl => {
      // Use businessName + website as a secondary key if ID is generic
      const existing = current.find(e => 
        e.id === nl.id || 
        (e.businessName === nl.businessName && e.websiteUrl === nl.websiteUrl)
      );

      if (existing) {
        currentMap.set(existing.id, { ...existing, ...nl, id: existing.id });
      } else {
        currentMap.set(nl.id, nl);
      }
    });

    const merged = Array.from(currentMap.values());
    db.saveLeads(merged);
    return merged;
  },

  deleteLead: (id: string) => {
    const current = db.getLeads();
    const updated = current.filter(l => l.id !== id);
    db.saveLeads(updated);
  },

  clearStaleLocks: () => {
    const leads = db.getLeads();
    const now = Date.now();
    let updated = false;
    const cleaned = leads.map(l => {
      if (l.locked) {
        const isExpired = !l.lockExpiresAt || l.lockExpiresAt < now;
        if (isExpired) {
          updated = true;
          return { ...l, locked: false, lockedByRunId: undefined };
        }
      }
      return l;
    });
    if (updated) db.saveLeads(cleaned);
  },

  forceUnlockAll: () => {
    const leads = db.getLeads();
    const cleaned = leads.map(l => ({ ...l, locked: false, lockedByRunId: undefined }));
    db.saveLeads(cleaned);
    toast.success(`SYSTEM OVERRIDE: ${leads.length} TARGETS UNLOCKED.`);
  },

  getRun: (id: string): AutomationRun | null => {
    const dbObj = getDbInternal();
    return dbObj.runs[id] || null;
  },

  saveRun: (run: AutomationRun) => {
    const dbObj = getDbInternal();
    dbObj.runs[run.id] = run;
    writeDb(dbObj);
  },

  listRuns: (): AutomationRun[] => {
    const dbObj = getDbInternal();
    return Object.values(dbObj.runs).sort((a, b) => b.createdAt - a.createdAt);
  },

  clearRunsDB: () => {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(MUTEX_KEY);
    toast.success("Automation Database Cleared.");
  }
};
