
export const CREDIT_WEIGHTS: Record<string, number> = {
  // Tier A — Closers
  PROPOSALS: 13,
  BENCHMARK: 13,

  // Tier B — Strategists
  FUNNEL_MAP: 8,
  DECK_ARCH: 8,
  DEEP_LOGIC: 8,
  PLAYBOOK: 8,
  PRODUCT_SYNTH: 8,

  // Tier C
  SEQUENCER: 5,
  PITCH_GEN: 5,
  DEMO_SANDBOX: 5,
  WORKSPACE: 5,
  VIDEO_AI: 5,
  CINEMA_INTEL: 5,
  GENERATE_VISUAL_ASSETS: 5,

  // Tier D
  VISION_LAB: 3,
  ARTICLE_INTEL: 3,
  ROI_CALC: 3,

  // Near-free
  ANALYTICS_HUB: 1,
  ANALYTICS: 1,
  FACT_CHECK: 1,
  VIRAL_PULSE: 1,
  RADAR_RECON: 1,
  AUTO_CRAWL: 1,
  TASKS: 1,
};

export const getModuleWeight = (module: string): number => {
  return CREDIT_WEIGHTS[module] ?? 1;
};
