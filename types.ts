
// PHASE 1: Canonical Status Definition
export type OutreachStatus = 'cold' | 'queued' | 'sent' | 'opened' | 'replied' | 'booked' | 'won' | 'lost' | 'paused';

export type MainMode = 'RESEARCH' | 'DESIGN' | 'MEDIA' | 'OUTREACH' | 'ADMIN';

export type SubModule = 
  | 'EXECUTIVE_DASHBOARD' | 'USER_GUIDE' | 'MARKET_DISCOVERY' | 'AUTOMATED_SEARCH' | 'PROSPECT_DATABASE' | 'PIPELINE' | 'STRATEGY_CENTER' 
  | 'STRATEGIC_REASONING' | 'WORKSPACE' | 'MARKET_TRENDS' | 'VISUAL_ANALYSIS' | 'VIDEO_INSIGHTS' 
  | 'CONTENT_ANALYSIS' | 'BENCHMARK' | 'ANALYTICS' | 'HEATMAP' | 'PROMPT_INTERFACE' | 'MODEL_BENCH' 
  | 'VIDEO_AUDIT' | 'FACT_CHECK' | 'TRANSLATOR' | 'ANALYTICS_HUB'
  | 'VIDEO_PRODUCTION' | 'VISUAL_STUDIO' | 'MOCKUPS_4K' | 'SONIC_STUDIO' | 'PRODUCT_SYNTHESIS' 
  | 'MOTION_LAB' | 'CONTENT_IDEATION' | 'ASSET_LIBRARY' | 'BRAND_DNA'
  | 'CAMPAIGN_ORCHESTRATOR' | 'PROPOSALS' | 'ROI_CALCULATOR' | 'SEQUENCER' | 'PRESENTATION_BUILDER' 
  | 'DEMO_SANDBOX' | 'DRAFTING' | 'SALES_COACH' | 'MEETING_NOTES' | 'AI_CONCIERGE' 
  | 'ELEVATOR_PITCH' | 'FUNNEL_MAP'
  | 'AGENCY_PLAYBOOK' | 'BILLING' | 'AFFILIATE' | 'IDENTITY' | 'SYSTEM_CONFIG' | 'EXPORT_DATA' 
  | 'CALENDAR' | 'ACTIVITY_LOGS' | 'SETTINGS' | 'NEXUS_GRAPH' | 'TIMELINE' 
  | 'TASK_MANAGER' | 'THEME' | 'USAGE_STATS';

export type WorkspaceType = 'dashboard' | 'intelligence' | 'strategy' | 'creative' | 'campaign' | 'identity';

export interface ComputeStats {
  sessionTokens: number;
  sessionCostUsd: number;
  projectedMonthlyUsd: number;
  proCalls: number;
  flashCalls: number;
}

export type OutreachChannel = 'email' | 'linkedin';
export type OutreachMode = 'live' | 'test';

export interface OutreachLog {
  id: string;
  timestamp: number;
  channel: OutreachChannel;
  mode: OutreachMode;
  leadId?: string;
  to?: string;
  subject?: string;
  contentSnippet?: string;
  status?: 'SENT' | 'FAILED'; 
}

export interface BrandIdentity {
  colors: string[];
  fontPairing: string;
  archetype: string;
  visualTone: string;
  tagline?: string;
  brandValues?: string[];
  aestheticTags?: string[];
  voiceTags?: string[];
  mission?: string;
  logoUrl?: string;
  extractedImages?: string[];
}

export interface CreativeAsset {
  id: string;
  type: 'static' | 'motion';
  angle: 'PURIST' | 'STORY' | 'VALUE' | 'ABSTRACT' | 'PRODUCT' | 'LIFESTYLE';
  imageUrl: string;
  videoUrl?: string;
  headline: string;
  subhead: string;
  cta: string;
  status: 'draft' | 'animating' | 'ready';
}

export interface Campaign {
  id: string;
  name: string;
  timestamp: number;
  creatives: CreativeAsset[];
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
  brandIdentity?: BrandIdentity;
  campaigns?: Campaign[];
  status?: OutreachStatus;
  outreachStatus?: OutreachStatus;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  contactUrl?: string;
  groundingSources?: Array<{ title?: string; uri?: string }>;
  outreachHistory?: OutreachLog[];
  lastContactAt?: number;
  lastContactedAt?: number;
  nextFollowUpAt?: number;
  owner?: string;
  notes?: string;
  tags?: string[];
  locked?: boolean;
  lockedAt?: number;
  lockedByRunId?: string;
  lockExpiresAt?: number;
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
