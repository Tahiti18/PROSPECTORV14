export type UserRole = "FOUNDER" | "INTERNAL" | "CLIENT" | "PUBLIC";
export type ReasoningDepth = "LOW" | "MEDIUM" | "HIGH";
export type LogStatus = "SUCCESS" | "FAILURE";
export type ModelClass = "FLASH" | "PRO" | "OTHER";

export interface AiOperationLog {
  logId: string;
  timestamp: string;
  requestId?: string;
  traceId?: string;

  userId: string;
  userRole: UserRole;

  module: string;
  isClientFacing: boolean;

  model: string;
  modelClass: ModelClass;
  reasoningDepth: ReasoningDepth;

  moduleWeight: number;
  effectiveWeight: number;

  latencyMs: number;
  status: LogStatus;
  errorMessage?: string;
}

/**
 * Non-blocking logger:
 * - Always prints a single-line console message
 * - In Node (Railway), also appends JSONL to ./data/ai-usage.jsonl
 * - Never throws if file I/O fails
 */
const isNodeRuntime = (): boolean => {
  try {
    const p: any = typeof process !== "undefined" ? (process as any) : undefined;
    return !!(p && p.versions && p.versions.node);
  } catch {
    return false;
  }
};

const safeConsoleLine = (log: AiOperationLog) => {
  const w = log.effectiveWeight ?? log.moduleWeight;
  const line = `[AI_USAGE] ${log.module} ${log.modelClass} w=${w} ${log.status} ${log.latencyMs}ms`;
  // eslint-disable-next-line no-console
  console.log(line);
};

export const logAiOperation = async (log: AiOperationLog) => {
  // Always console log (cheap + immediate)
  safeConsoleLine(log);

  // File append only in Node runtime
  if (!isNodeRuntime()) return;

  try {
    // Dynamic imports avoid bundlers pulling fs into browser builds
    const fs = await import("node:fs");
    const path = await import("node:path");

    const base = (process as any)?.cwd ? (process as any).cwd() : ".";
    const dir = path.join(base, "data");
    const filePath = path.join(dir, "ai-usage.jsonl");

    // Ensure dir exists (sync is okay here as it's rare/once)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const line = JSON.stringify(log) + "\n";

    // Non-blocking append
    fs.appendFile(filePath, line, (err: any) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.warn("[AI_USAGE] file append failed:", err?.message || err);
      }
    });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.warn("[AI_USAGE] logger error:", e?.message || e);
  }
};

export const uuidLike = (): string => {
  // No external dependency: safe UUID-like identifier
  const s = Math.random().toString(16).slice(2);
  return `log_${Date.now()}_${s}`;
};

/**
 * MONETIZATION ENFORCEMENT SWITCH
 * Default: TRUE (Founder Mode = No Limits)
 * Set FOUNDER_MODE=false in env to enable credit checks.
 */
export const isFounderMode = (): boolean => {
  if (typeof process === 'undefined') return true;
  return process.env.FOUNDER_MODE !== 'false';
};

/**
 * CREDIT BALANCE STUB
 * @param userId - The user to check
 * @returns number - Available credits (Infinity by default)
 */
export const getAvailableCredits = (userId: string): number => {
  // TODO: Connect to real ledger/database
  return Infinity;
};
