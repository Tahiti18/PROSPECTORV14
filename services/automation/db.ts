
import { AutomationRun, isAutomationRun } from './types';
import { Lead } from '../../types';
import { toast } from '../toastManager';

const DB_KEY = 'pomelli_automation_db_v1';
const STORAGE_KEY_LEADS = 'pomelli_os_leads_v14_final';
const MUTEX_KEY = 'pomelli_automation_mutex_v1';

type DbV1 = { version: 1; runs: Record<string, AutomationRun> };

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Drops invalid runs silently during read
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
      toast.error("STORAGE FULL: Cannot save automation run. Please export and clear old data.");
    }
  }
}

/**
 * CORE DB LOGIC
 * Strategy: Strict on Write, Tolerant on Read.
 */
const getDbInternal = (): DbV1 => {
  const raw = localStorage.getItem(DB_KEY);
  const parsed = safeParse(raw);

  // Case 1: Modern shape: { version: 1, runs: {...} }
  if (isRecord(parsed) && "runs" in parsed) {
    const runs = normalizeRunsMap((parsed as any).runs);
    const normalized: DbV1 = { version: 1, runs };

    const versionOk = (parsed as any).version === 1;
    const runsSameSize = isRecord((parsed as any).runs) && Object.keys((parsed as any).runs).length === Object.keys(runs).length;

    // Persist only if we normalized something (fixes missing version or filters invalid runs)
    if (!versionOk || !runsSameSize) writeDb(normalized);
    return normalized;
  }

  // Case 2: Legacy root-map: { [runId]: AutomationRun } (Parsed object, no 'runs' key)
  if (isRecord(parsed)) {
    console.warn("[AutoDB] Migrating legacy DB structure to v1 schema");
    const legacyRuns = normalizeRunsMap(parsed);
    const migrated: DbV1 = { version: 1, runs: legacyRuns };
    writeDb(migrated); // one-time fix
    return migrated;
  }

  // Case 3: Empty/corrupt/missing
  const fresh: DbV1 = { version: 1, runs: {} };
  // Only write fresh if we had data that was corrupt to self-heal
  if (raw) writeDb(fresh);
  return fresh;
};

export const db = {
  // --- MUTEX LOCKING (Jitter + Read-Back) ---
  
  acquireMutex: async (ownerId: string, ttlMs: number = 5000): Promise<boolean> => {
    // 1. Random Jitter (10-40ms) to desync competing tabs
    await sleep(Math.random() * 30 + 10);

    const now = Date.now();
    const raw = localStorage.getItem(MUTEX_KEY);
    
    // 2. Read Existing & Check TTL
    if (raw) {
      try {
        const lock = JSON.parse(raw);
        if (lock.expiresAt > now && lock.ownerId !== ownerId) {
          return false; // Valid lock by someone else
        }
      } catch (e) {
        // Corrupt lock, treat as free
      }
    }

    // 3. Attempt Write
    const newLock = { ownerId, expiresAt: now + ttlMs };
    try {
        localStorage.setItem(MUTEX_KEY, JSON.stringify(newLock));
    } catch (e) {
        return false; // Write failed (quota?)
    }
    
    // 4. Sleep to allow race conditions to settle
    await sleep(25);
    
    // 5. Read-back Verification
    const verify = localStorage.getItem(MUTEX_KEY);
    if (!verify) return false;
    
    try {
      const verifyLock = JSON.parse(verify);
      return verifyLock.ownerId === ownerId;
    } catch {
      return false;
    }
  },

  releaseMutex: (ownerId: string) => {
    const raw = localStorage.getItem(MUTEX_KEY);
    if (raw) {
      try {
        const lock = JSON.parse(raw);
        if (lock.ownerId === ownerId) {
          localStorage.removeItem(MUTEX_KEY);
        }
      } catch (e) {
        localStorage.removeItem(MUTEX_KEY); 
      }
    }
  },

  // --- LEAD MANAGEMENT ---

  getLeads: (): Lead[] => {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS);
    const data = safeParse(raw);
    return Array.isArray(data) ? data as Lead[] : [];
  },

  saveLeads: (leads: Lead[]) => {
    try {
        localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    } catch (e: any) {
        console.error("Save Leads Failed", e);
        if (e.name === 'QuotaExceededError') {
            toast.error("STORAGE FULL: Leads not saved. Export data to free up space.");
        }
    }
  },

  clearStaleLocks: () => {
    const leads = db.getLeads();
    const now = Date.now();
    let updated = false;

    const cleaned = leads.map(l => {
      if (l.locked) {
        const isExpired = !l.lockExpiresAt || !Number.isFinite(l.lockExpiresAt) || l.lockExpiresAt! < now;
        if (isExpired) {
          console.warn(`[AutoDB] Clearing stale lock on lead ${l.id}`);
          updated = true;
          return { 
            ...l, 
            locked: false, 
            lockedByRunId: undefined, 
            lockedAt: undefined, 
            lockExpiresAt: undefined 
          };
        }
      }
      return l;
    });

    if (updated) db.saveLeads(cleaned);
  },

  forceUnlockAll: () => {
    const leads = db.getLeads();
    const cleaned = leads.map(l => ({
        ...l,
        locked: false,
        lockedByRunId: undefined,
        lockedAt: undefined,
        lockExpiresAt: undefined
    }));
    db.saveLeads(cleaned);
    toast.success(`SYSTEM OVERRIDE: ${leads.length} TARGETS UNLOCKED.`);
  },

  // --- RUN MANAGEMENT (Normalized) ---

  getRun: (id: string): AutomationRun | null => {
    const dbObj = getDbInternal();
    const run = dbObj.runs[id];
    return run ? run : null;
  },

  saveRun: (run: AutomationRun) => {
    const dbObj = getDbInternal();
    dbObj.runs[run.id] = run;
    writeDb(dbObj); // Always strict write V1 shape
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
