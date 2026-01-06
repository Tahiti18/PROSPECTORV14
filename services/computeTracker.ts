
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

// Default State: EMPIRE Tier (Unlocked) - KIE Credits Priority
let user: UserProfile = {
  tier: 'EMPIRE',
  xp: 15000,
  level: 50,
  credits: 9999.00
};

let economyMode = false;

const PRO_COST_PER_1M = 15.00;
const FLASH_COST_PER_1M = 0.10;

// --- LISTENERS ---
type Listener = (s: ComputeStats, user: UserProfile, eco: boolean) => void;
const listeners = new Set<Listener>();

// --- GETTERS ---
export const getBalance = () => user.credits;
export const isEconomyMode = () => economyMode;
export const getUserTier = () => user.tier;
export const getUserLevel = () => user.level;
export const getUserXP = () => user.xp;

// --- SETTERS ---
export const setEconomyMode = (enabled: boolean) => {
  economyMode = enabled;
  notify();
  toast.info(enabled ? "NEURAL ECONOMY: ON (High Speed, Low Cost)" : "NEURAL ECONOMY: OFF (Maximum Intelligence)");
};

export const upgradeTier = (newTier: Tier) => {
  user.tier = newTier;
  notify();
  toast.success(`SUBSCRIPTION UPGRADED: WELCOME TO ${newTier} TIER.`);
};

// --- GATING LOGIC ---
export const checkFeatureAccess = (feature: 'VEO' | 'PRO_MODEL' | 'BULK_OPS' | 'WHITE_LABEL'): boolean => {
  if (user.tier === 'EMPIRE') return true;
  
  if (feature === 'VEO' && user.tier === 'STARTER') return false;
  if (feature === 'PRO_MODEL' && user.tier === 'STARTER') return false; 
  
  if (feature === 'BULK_OPS') return false;
  if (feature === 'WHITE_LABEL') return false;
  
  return true;
};

// --- CORE LOGIC ---
export const deductCost = (model: string, estimatedChars: number): boolean => {
  const tokens = Math.ceil(estimatedChars / 4);
  
  // 1. Feature Gating Check
  const isPro = model.includes('pro') || model.includes('ultra');
  const isVeo = model.includes('veo');

  if (isVeo && !checkFeatureAccess('VEO')) {
    // If KIE key is being used for Veo, we shouldn't technically hit this if the caller bypasses deductCost,
    // but just in case, we warn about internal lock.
    toast.error("VEO VIDEO ENGINE LOCKED. CHECK SUBSCRIPTION.");
    return false;
  }
  if (isPro && !checkFeatureAccess('PRO_MODEL')) {
    toast.error("GEMINI PRO REASONING LOCKED. UPGRADE TO GROWTH TIER.");
    return false;
  }

  // 2. Cost Calculation
  const cost = isPro 
    ? (tokens / 1000000) * PRO_COST_PER_1M 
    : (tokens / 1000000) * FLASH_COST_PER_1M;

  // INTERNAL BYPASS: EMPIRE users are unrestricted
  if (user.tier === 'EMPIRE') {
      stats.sessionTokens += tokens;
      stats.sessionCostUsd += cost;
      notify();
      return true;
  }

  if (user.credits < cost) {
    toast.error("INSUFFICIENT FUNDS. PLEASE RECHARGE WALLET.");
    return false;
  }

  user.credits -= cost;
  
  stats.sessionTokens += tokens;
  stats.sessionCostUsd += cost;
  if (isPro) stats.proCalls++;
  else stats.flashCalls++;
  stats.projectedMonthlyUsd = stats.sessionCostUsd * 30;

  const xpGained = Math.ceil(cost * 100);
  addXP(xpGained > 0 ? xpGained : 1); 

  notify();
  return true;
};

const addXP = (amount: number) => {
  user.xp += amount;
  const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
  if (newLevel > user.level) {
    user.level = newLevel;
    toast.neural(`AGENCY RANK UP: LEVEL ${user.level} ACHIEVED.`);
  }
};

export const addCredits = (amount: number) => {
  user.credits += amount;
  notify();
  toast.success(`WALLET TOP-UP: +$${amount.toFixed(2)} CREDITS ADDED.`);
};

// --- SUBSCRIPTION ---
export const subscribeToCompute = (l: Listener): (() => void) => {
  listeners.add(l);
  l(stats, user, economyMode);
  return () => { listeners.delete(l); };
};

const notify = () => {
  listeners.forEach(l => l({ ...stats }, { ...user }, economyMode));
};
