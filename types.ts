
export type MainMode = 'OPERATE' | 'CREATE' | 'SELL' | 'CONTROL';

export type WorkspaceType = 'dashboard' | 'intelligence' | 'war-room' | 'creative' | 'outreach' | 'identity';

export type SubModule = 
  // OPERATE ZONE
  | 'COMMAND' | 'RADAR_RECON' | 'AUTO_CRAWL' | 'TARGET_LIST' | 'PIPELINE' | 'WAR_ROOM' | 'DEEP_LOGIC' | 'WORKSPACE' | 'VIRAL_PULSE'
  | 'VISION_LAB' | 'CINEMA_INTEL' | 'ARTICLE_INTEL' | 'BENCHMARK' | 'ANALYTICS' | 'HEATMAP' | 'PROMPT_AI' | 'MODEL_TEST' | 'VIDEO_AI' | 'FACT_CHECK' | 'TRANSLATOR'
  // CREATE ZONE
  | 'VIDEO_PITCH' | 'VISUAL_STUDIO' | 'MOCKUPS_4K' | 'SONIC_STUDIO' | 'PRODUCT_SYNTH' | 'MOTION_LAB' | 'FLASH_SPARK' | 'MEDIA_VAULT'
  // SELL ZONE
  | 'PROPOSALS' | 'ROI_CALC' | 'SEQUENCER' | 'DECK_ARCH' | 'DEMO_SANDBOX' | 'DRAFTING' | 'VOICE_STRAT' | 'LIVE_SCRIBE' | 'AI_CONCIERGE' | 'PITCH_GEN' | 'FUNNEL_MAP' | 'BUSINESS_ORCHESTRATOR'
  // CONTROL ZONE
  | 'PLAYBOOK' | 'BILLING' | 'AFFILIATE' | 'IDENTITY' | 'OS_FORGE' | 'EXPORT_DATA' | 'CALENDAR' | 'PROD_LOG' | 'SETTINGS' | 'CIPHER_NODE' | 'NEXUS_GRAPH' | 'CHRONOS' | 'TASKS' | 'THEME' | 'TOKENS';

export interface ComputeStats {
  sessionTokens: number;
  sessionCostUsd: number;
  projectedMonthlyUsd: number;
  proCalls: number;
  flashCalls: number;
}

// PHASE 1: Canonical Status Definition
export type OutreachStatus = 'cold' | 'queued' | 'sent' | 'opened' | 'replied' | 'booked' | 'won' | 'lost' | 'paused';

export interface OutreachLog {
  id: string;
  timestamp: number;
  type: 'EMAIL' | 'LINKEDIN' | 'CALL'; // Legacy channel field
  channel?: 'EMAIL' | 'LINKEDIN' | 'CALL'; // Explicit channel
  contentSnippet: string;
  subject?: string;
  status: 'SENT' | 'FAILED';
  outcome?: string;
  stepIndex?: number;
  error?: string;
}

export interface Lead {
  id: string;
  rank: number;
  businessName: string;
  websiteUrl: string;
  niche: string;
  city: string;
  phone: string;
  email: string;
  leadScore: number;
  assetGrade: 'A' | 'B' | 'C';
  socialGap: string;
  visualProof: string;
  bestAngle: string;
  personalizedHook: string;
  status: OutreachStatus;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  contactUrl?: string;
  groundingSources?: Array<{ title?: string; uri?: string }>;
  
  // Outreach CRM Data
  outreachHistory?: OutreachLog[];
  lastContactAt?: number;
  nextFollowUp?: number; // legacy alias for nextFollowUpAt
  nextFollowUpAt?: number;
  
  // Phase 1 CRM Fields
  owner?: string;
  notes?: string;
  tags?: string[];
  
  // Automation Locking Fields (Strict Numeric Timestamps)
  locked?: boolean;
  lockedAt?: number;       // ms since epoch
  lockedByRunId?: string;  // ID of the run holding the lock
  lockExpiresAt?: number;  // ms since epoch
}

export interface OutreachAssets {
  emailOpeners: string[];
  fullEmail: string;
  callOpener: string;
  voicemail: string;
  smsFollowup: string;
}

export interface EngineResult {
  leads: Lead[];
  rubric: {
    visual: string;
    social: string;
    highTicket: string;
    reachability: string;
    grades: {
      A: string;
      B: string;
      C: string;
    };
  };
  assets: OutreachAssets;
  groundingSources?: Array<{ title?: string; uri?: string }>;
}
