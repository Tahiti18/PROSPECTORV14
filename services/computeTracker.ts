
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

// Default State: Starter Tier, Level 1
let user: UserProfile = {
  tier: 'STARTER',
  xp: 0,
  level: 1,
  credits: 50.00
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
  if (feature === 'PRO_MODEL' && user.tier === 'STARTER') return false; // Starter is Flash only
  
  // EMPIRE only features (if we are here, we are not EMPIRE)
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
    toast.error("VEO VIDEO ENGINE LOCKED. UPGRADE TO GROWTH TIER.");
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

  if (user.credits < cost) {
    toast.error("INSUFFICIENT FUNDS. PLEASE RECHARGE WALLET.");
    return false;
  }

  // 3. Transaction
  user.credits -= cost;
  
  // 4. Update Stats
  stats.sessionTokens += tokens;
  stats.sessionCostUsd += cost;
  if (isPro) stats.proCalls++;
  else stats.flashCalls++;
  stats.projectedMonthlyUsd = stats.sessionCostUsd * 30;

  // 5. Gamification: Add XP based on spend ($1 = 100 XP)
  const xpGained = Math.ceil(cost * 100);
  addXP(xpGained > 0 ? xpGained : 1); // Min 1 XP per action

  notify();
  return true;
};

const addXP = (amount: number) => {
  user.xp += amount;
  // Simple Level Formula: Level = sqrt(XP / 100)
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
  // Explicitly return void to satisfy EffectCallback
  return () => { listeners.delete(l); };
};

const notify = () => {
  listeners.forEach(l => l({ ...stats }, { ...user }, economyMode));
};
