
export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface AutomationArtifact {
  id: string;
  runId: string;
  stepName: string;
  type: 'json' | 'markdown' | 'text';
  content: string;
  createdAt: number;
}

export interface RunStep {
  name: string;
  status: StepStatus;
  attempts: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  outputArtifactIds?: string[];
}

export interface AutomationRun {
  id: string;
  leadId: string;
  leadName?: string;
  status: RunStatus;
  leadScore?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  errorSummary?: string;
  steps: RunStep[];
  artifacts: AutomationArtifact[];
}

// --- TYPE GUARDS (Tolerant Read: Required fields must exist, extras ignored) ---

const isRecord = (v: unknown): v is Record<string, unknown> => 
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === 'string';
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const RUN_STATUSES: RunStatus[] = ['queued', 'running', 'succeeded', 'failed', 'canceled'];
const isRunStatus = (v: unknown): v is RunStatus => isString(v) && RUN_STATUSES.includes(v as RunStatus);

const STEP_STATUSES: StepStatus[] = ['pending', 'running', 'success', 'failed', 'skipped'];
const isStepStatus = (v: unknown): v is StepStatus => isString(v) && STEP_STATUSES.includes(v as StepStatus);

export const isRunStep = (v: unknown): v is RunStep => {
  if (!isRecord(v)) return false;
  
  // Optional array validation: strict if present, but field is optional
  const outputIdsOk = v.outputArtifactIds === undefined || 
    (Array.isArray(v.outputArtifactIds) && v.outputArtifactIds.every(isString));

  // We check only canonical fields. Extra fields like 'goal' are ignored, not rejected.
  return (
    isString(v.name) &&
    isStepStatus(v.status) &&
    isFiniteNumber(v.attempts) &&
    (v.startedAt === undefined || isFiniteNumber(v.startedAt)) &&
    (v.completedAt === undefined || isFiniteNumber(v.completedAt)) &&
    (v.error === undefined || isString(v.error)) &&
    outputIdsOk
  );
};

export const isAutomationArtifact = (v: unknown): v is AutomationArtifact => {
  if (!isRecord(v)) return false;
  // Label is removed. We only validate core fields.
  return (
    isString(v.id) &&
    isString(v.runId) &&
    isString(v.stepName) &&
    (v.type === 'json' || v.type === 'markdown' || v.type === 'text') &&
    isString(v.content) &&
    isFiniteNumber(v.createdAt)
  );
};

export const isAutomationRun = (v: unknown): v is AutomationRun => {
  if (!isRecord(v)) return false;
  
  // Arrays must be valid arrays of valid items
  const stepsOk = Array.isArray(v.steps) && v.steps.every(isRunStep);
  const artifactsOk = Array.isArray(v.artifacts) && v.artifacts.every(isAutomationArtifact);

  return (
    isString(v.id) &&
    isString(v.leadId) &&
    isRunStatus(v.status) &&
    isFiniteNumber(v.createdAt) &&
    (v.leadName === undefined || isString(v.leadName)) &&
    (v.leadScore === undefined || isFiniteNumber(v.leadScore)) &&
    (v.startedAt === undefined || isFiniteNumber(v.startedAt)) &&
    (v.completedAt === undefined || isFiniteNumber(v.completedAt)) &&
    (v.errorSummary === undefined || isString(v.errorSummary)) &&
    stepsOk &&
    artifactsOk
  );
};
