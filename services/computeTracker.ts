
import { ComputeStats } from '../types';

let stats: ComputeStats = {
  sessionTokens: 0,
  sessionCostUsd: 0,
  projectedMonthlyUsd: 0,
  proCalls: 0,
  flashCalls: 0
};

const PRO_COST_PER_1M = 15.00;
const FLASH_COST_PER_1M = 0.10;

type Listener = (s: ComputeStats) => void;
const listeners = new Set<Listener>();

export const trackCall = (model: string, estimatedChars: number) => {
  // Estimate tokens (roughly 1 token per 4 chars)
  const tokens = Math.ceil(estimatedChars / 4);
  const isPro = model.includes('pro');
  
  stats.sessionTokens += tokens;
  const cost = isPro 
    ? (tokens / 1000000) * PRO_COST_PER_1M 
    : (tokens / 1000000) * FLASH_COST_PER_1M;
  
  stats.sessionCostUsd += cost;
  if (isPro) stats.proCalls++;
  else stats.flashCalls++;
  
  // Very rough projection based on 30 days of this session activity
  stats.projectedMonthlyUsd = stats.sessionCostUsd * 30;
  
  notify();
};

export const getComputeStats = () => stats;

export const subscribeToCompute = (l: Listener) => {
  listeners.add(l);
  l(stats);
  return () => listeners.delete(l);
};

const notify = () => {
  listeners.forEach(l => l({ ...stats }));
};
