import { ComputeStats } from '../types';
import { toast } from './toastManager';

// --- TYPES ---
export type Tier = 'STARTER' | 'GROWTH' | 'EMPIRE';

interface UserProfile {
  tier: Tier;
  xp: number;
  level: number;
  credits: number;
}

// --- STATE ---
let stats: ComputeStats = {
  sessionTokens: 0,
  sessionCostUsd: 0,
  projectedMonthlyUsd: 0,
  proCalls: 0,
  flashCalls: 0
};

let user: UserProfile = {
  tier: 'EMPIRE',
  xp: 15000,
  level: 50,
  credits: 9999.00
};

// GLOBAL ECONOMY LOCK
let economyMode = true;

const OPENROUTER_FLASH_COST = 0.0001; // Extremely low for Flash

// --- LISTENERS ---
type Listener = (s: ComputeStats, user: UserProfile, eco: boolean) => void;
const listeners = new Set<Listener>();

// --- GETTERS ---
export const getBalance = () => user.credits;
export const isEconomyMode = () => true;
export const getUserTier = () => user.tier;
export const getUserLevel = () => user.level;
export const getUserXP = () => user.xp;

// --- SETTERS ---
export const setEconomyMode = () => {
  economyMode = true;
  notify();
};

export const upgradeTier = (newTier: Tier) => {
  user.tier = newTier;
  notify();
};

// --- GATING LOGIC ---
export const checkFeatureAccess = (feature: string): boolean => {
  if (feature === 'PRO_MODEL') return false; // Pro strictly blocked
  return true;
};

// --- CORE LOGIC ---
export const deductCost = (model: string, estimatedChars: number): boolean => {
  const tokens = Math.ceil(estimatedChars / 4);
  const effectiveCost = (tokens / 1000000) * OPENROUTER_FLASH_COST;

  stats.sessionTokens += tokens;
  stats.sessionCostUsd += effectiveCost;
  stats.flashCalls++;
  stats.projectedMonthlyUsd = stats.sessionCostUsd * 30;

  const xpGained = Math.ceil(effectiveCost * 100);
  user.xp += (xpGained > 0 ? xpGained : 1); 
  
  notify();
  return true;
};

// --- SUBSCRIPTION ---
export const subscribeToCompute = (l: Listener): (() => void) => {
  listeners.add(l);
  l(stats, user, true);
  return () => { listeners.delete(l); };
};

const notify = () => {
  listeners.forEach(l => l({ ...stats }, { ...user }, true));
};

export const addCredits = (amount: number) => {
  user.credits += amount;
  notify();
};
