
import React, { useState, useRef, useEffect } from 'react';
import { MainMode, SubModule } from '../types';
import { Tooltip } from './Tooltip';

interface LayoutProps {
  children: React.ReactNode;
  activeMode: MainMode;
  setActiveMode: (m: MainMode) => void;
  activeModule: SubModule;
  setActiveModule: (m: SubModule) => void;
  onSearchClick: () => void;
  theater: string;
  setTheater: (t: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const STRATEGIC_CITIES = [
  { rank: 1, city: "NEW YORK, USA", tier: "S+", focus: "FINANCE_TECH" },
  { rank: 2, city: "LONDON, UK", tier: "S+", focus: "GLOBAL_BIZ" },
  { rank: 3, city: "DUBAI, UAE", tier: "S", focus: "WEALTH_CRYPTO" },
  { rank: 4, city: "SINGAPORE", tier: "S", focus: "ASIA_HQ" },
  { rank: 5, city: "AUSTIN, USA", tier: "A+", focus: "TECH_GROWTH" },
  { rank: 6, city: "MIAMI, USA", tier: "A+", focus: "WEB3_LUXURY" },
  { rank: 7, city: "SYDNEY, AUS", tier: "A+", focus: "APAC_FINANCE" },
  { rank: 8, city: "SAN FRANCISCO, USA", tier: "A+", focus: "DEEP_TECH" },
  { rank: 9, city: "TORONTO, CAN", tier: "A", focus: "NORTH_TECH" },
  { rank: 10, city: "LOS ANGELES, USA", tier: "A", focus: "MEDIA_TECH" },
  { rank: 11, city: "ZURICH, SWI", tier: "A", focus: "BANKING" },
  { rank: 12, city: "MELBOURNE, AUS", tier: "A", focus: "CULTURE_BIZ" },
  { rank: 13, city: "DUBLIN, IRE", tier: "A", focus: "EU_TECH_HQ" },
  { rank: 14, city: "CHICAGO, USA", tier: "B+", focus: "CORP_FINANCE" },
  { rank: 15, city: "DALLAS, USA", tier: "B+", focus: "ENERGY_BIZ" },
  { rank: 16, city: "MANCHESTER, UK", tier: "B+", focus: "UK_GROWTH" },
  { rank: 17, city: "SEATTLE, USA", tier: "B+", focus: "CLOUD_TECH" },
  { rank: 18, city: "VANCOUVER, CAN", tier: "B", focus: "LIFESTYLE_TECH" },
  { rank: 19, city: "BRISBANE, AUS", tier: "B", focus: "QLD_GROWTH" },
  { rank: 20, city: "HOUSTON, USA", tier: "B", focus: "INDUSTRIAL" },
  { rank: 21, city: "BOSTON, USA", tier: "B", focus: "BIO_ROBOTICS" },
  { rank: 22, city: "ATLANTA, USA", tier: "B", focus: "MEDIA_CORP" },
  { rank: 23, city: "HONG KONG", tier: "B", focus: "FINANCE_HUB" },
  { rank: 24, city: "EDINBURGH, UK", tier: "C+", focus: "FINTECH" },
  { rank: 25, city: "DENVER, USA", tier: "C+", focus: "STARTUP_HUB" },
  { rank: 26, city: "SAN DIEGO, USA", tier: "C+", focus: "DEFENSE_BIO" },
  { rank: 27, city: "GOLD COAST, AUS", tier: "C", focus: "TOURISM_WEALTH" },
  { rank: 28, city: "PERTH, AUS", tier: "C", focus: "MINING_WEALTH" },
  { rank: 29, city: "AUCKLAND, NZ", tier: "C", focus: "NZ_HUB" },
  { rank: 30, city: "PHOENIX, USA", tier: "C", focus: "MFG_TECH" }
];

// Reusable Icon Wrapper
const IconWrapper = ({ path, className = "w-3.5 h-3.5" }: { path: React.ReactNode, className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  // Main Categories
  Operate: <IconWrapper path={<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />} className="w-4 h-4" />,
  Create: <IconWrapper path={<path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" />} className="w-4 h-4" />,
  Studio: <IconWrapper path={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>} className="w-4 h-4" />,
  Sell: <IconWrapper path={<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />} className="w-4 h-4" />,
  Control: <IconWrapper path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>} className="w-4 h-4" />,
  
  // Operate Icons
  Command: <IconWrapper path={<><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>} />,
  Radar: <IconWrapper path={<><circle cx="12" cy="12" r="10" /><path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z" /></>} />,
  Swarm: <IconWrapper path={<><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>} />,
  Target: <IconWrapper path={<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>} />,
  Pipeline: <IconWrapper path={<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>} />,
  WarRoom: <IconWrapper path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>} />,
  Brain: <IconWrapper path={<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />} />,
  Pulse: <IconWrapper path={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />} />,
  Eye: <IconWrapper path={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>} />,
  FileText: <IconWrapper path={<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />} />,
  Ruler: <IconWrapper path={<path d="M2 12h20M2 12l5-5M2 12l5 5" />} />,
  Chart: <IconWrapper path={<path d="M18 20V10M12 20V4M6 20v-6" />} />,
  Map: <IconWrapper path={<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />} />,
  Terminal: <IconWrapper path={<><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></>} />,
  Test: <IconWrapper path={<path d="M8.5 2h7l-5 10 5 10h-7l5-10-5-10z" />} />,
  Check: <IconWrapper path={<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />} />,
  Globe: <IconWrapper path={<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>} />,

  // Create Icons
  Palette: <IconWrapper path={<><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></>} />,
  Monitor: <IconWrapper path={<><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>} />,
  Box: <IconWrapper path={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>} />,
  Zap: <IconWrapper path={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />} />,
  Lock: <IconWrapper path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>} />,

  // Studio Icons
  Video: <IconWrapper path={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>} />,
  Scan: <IconWrapper path={<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />} />,
  Film: <IconWrapper path={<><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></>} />,
  Move: <IconWrapper path={<polyline points="5 9 2 12 5 15" />} />,
  Music: <IconWrapper path={<path d="M9 18V5l12-2v13" />} />,
  Pen: <IconWrapper path={<path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" />} />,

  // Sell Icons
  Briefcase: <IconWrapper path={<><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>} />,
  Contract: <IconWrapper path={<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />} />,
  Calc: <IconWrapper path={<><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></>} />,
  Link: <IconWrapper path={<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />} />,
  Layout: <IconWrapper path={<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />} />,
  Sandbox: <IconWrapper path={<path d="M2 12h20" />} />,
  Edit: <IconWrapper path={<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />} />,
  Message: <IconWrapper path={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />,
  Bot: <IconWrapper path={<><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></>} />,
  Megaphone: <IconWrapper path={<path d="M22 8.35L3 2v20l19-6.35a2 2 0 0 0 0-3.3z" />} />,
  Filter: <IconWrapper path={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />} />,

  // Control Icons
  Book: <IconWrapper path={<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />} />,
  CreditCard: <IconWrapper path={<><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>} />,
  Users: <IconWrapper path={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
  Fingerprint: <IconWrapper path={<path d="M12 12c0-3 2.5-5.5 5.5-5.5S23 9 23 12" />} />,
  Cpu: <IconWrapper path={<><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /></>} />,
  Download: <IconWrapper path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>} />,
  Calendar: <IconWrapper path={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />,
  List: <IconWrapper path={<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>} />,
  Settings: <IconWrapper path={<circle cx="12" cy="12" r="3" />} />,
  Key: <IconWrapper path={<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />} />,
  Share: <IconWrapper path={<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>} />,
  Clock: <IconWrapper path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />,
  Ticket: <IconWrapper path={<path d="M3 6h18" />} />,
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeMode, setActiveMode, activeModule, setActiveModule, onSearchClick, theater, setTheater, theme, toggleTheme
}) => {
  const [showCities, setShowCities] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCities(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SMART DEFAULT NAVIGATOR
  const handleModeClick = (mode: MainMode) => {
    setActiveMode(mode);
    switch (mode) {
      case 'OPERATE': setActiveModule('COMMAND'); break;
      case 'CREATE': setActiveModule('VISUAL_STUDIO'); break;
      case 'STUDIO': setActiveModule('VIDEO_PITCH'); break;
      case 'SELL': setActiveModule('BUSINESS_ORCHESTRATOR'); break;
      case 'CONTROL': setActiveModule('PROD_LOG'); break;
    }
  };

  const subModules: Record<MainMode, { id: SubModule; label: string; icon: React.ReactNode; desc: string }[]> = {
    OPERATE: [
      { id: 'COMMAND', label: 'COMMAND', icon: Icons.Command, desc: "Central mission hub. Overview of active targets, system status, and recent intelligence." },
      { id: 'RADAR_RECON', label: 'RADAR RECON', icon: Icons.Radar, desc: "Broad-spectrum area scanner. Identify businesses in specific regions matching niche criteria." },
      { id: 'AUTO_CRAWL', label: 'AUTO CRAWL', icon: Icons.Swarm, desc: "Autonomous multi-vector crawler. Decompose regions into sectors and extract signals automatically." },
      { id: 'TARGET_LIST', label: 'TARGET LEDGER', icon: Icons.Target, desc: "The master ledger. Sort, filter, and manage all identified prospects and their scores." },
      { id: 'PIPELINE', label: 'PIPELINE', icon: Icons.Pipeline, desc: "Kanban-style visual workflow. Track leads from 'Cold' to 'Closed' with stage analytics." },
      { id: 'WAR_ROOM', label: 'WAR ROOM', icon: Icons.WarRoom, desc: "Deep-dive tactical center. Analyze a single target's vulnerabilities and plan the attack." },
      { id: 'DEEP_LOGIC', label: 'DEEP LOGIC', icon: Icons.Brain, desc: "System 2 reasoning engine. Solve complex strategic problems using high-compute AI chains." },
      { id: 'VIRAL_PULSE', label: 'VIRAL PULSE', icon: Icons.Pulse, desc: "Real-time trend monitor. Track viral topics and cultural currents relevant to the target." },
      { id: 'VISION_LAB', label: 'VISION LAB', icon: Icons.Eye, desc: "Static image intelligence. Extract data, sentiment, and design patterns from visual plates." },
      { id: 'ARTICLE_INTEL', label: 'ARTICLE INTEL', icon: Icons.FileText, desc: "Textual synthesis engine. Convert long-form articles into executive briefs or viral hooks." },
      { id: 'BENCHMARK', label: 'BENCHMARK', icon: Icons.Ruler, desc: "Competitive reverse-engineering. Deconstruct a target's tech stack, design system, and gaps." },
      { id: 'ANALYTICS', label: 'ANALYTICS', icon: Icons.Chart, desc: "Performance metrics. Visualization of system efficiency and success rates." },
      { id: 'HEATMAP', label: 'HEATMAP', icon: Icons.Map, desc: "Geospatial opportunity visualization. See where high-value targets cluster in the theater." },
      { id: 'PROMPT_AI', label: 'PROMPT AI', icon: Icons.Terminal, desc: "Direct neural interface. Execute raw tactical queries against the core AI models." },
      { id: 'MODEL_TEST', label: 'MODEL TEST', icon: Icons.Test, desc: "Engine benchmark arena. Compare output quality across different AI model versions." },
      { id: 'FACT_CHECK', label: 'FACT CHECK', icon: Icons.Check, desc: "Truth verification node. Cross-reference claims against grounded search data." },
      { id: 'TRANSLATOR', label: 'TRANSLATOR', icon: Icons.Globe, desc: "Linguistic adaptation matrix. Localize payloads for specific cultural theaters." },
    ],
    CREATE: [
      { id: 'VISUAL_STUDIO', label: 'VISUAL STUDIO', icon: Icons.Palette, desc: "High-fidelity image generation. Create bespoke brand assets and visual concepts." },
      { id: 'MOCKUPS_4K', label: '4K MOCKUPS', icon: Icons.Monitor, desc: "Ultra-premium product visualization. Generate photorealistic website or app mockups." },
      { id: 'PRODUCT_SYNTH', label: 'PRODUCT SYNTH', icon: Icons.Box, desc: "Offer architecture. Design hypothetic high-ticket products and feature sets." },
      { id: 'FLASH_SPARK', label: 'FLASH SPARK', icon: Icons.Zap, desc: "High-velocity content generator. Rapidly produce hooks, captions, and viral ideas." },
      { id: 'MEDIA_VAULT', label: 'MEDIA VAULT', icon: Icons.Lock, desc: "Secure asset reservoir. Manage and export all generated media and intelligence files." },
    ],
    STUDIO: [
      { id: 'VIDEO_PITCH', label: 'VIDEO FAST', icon: Icons.Video, desc: "Rapid prototype video generation. Create 4-5 iterations of a visual hook." },
      { id: 'VIDEO_AI', label: 'VIDEO AUDIT', icon: Icons.Scan, desc: "Video content auditor. Analyze target's existing video strategy for weaknesses." },
      { id: 'CINEMA_INTEL', label: 'CINEMA INTEL', icon: Icons.Film, desc: "Deep video decoding. Extract psychological hooks and metadata from video URLs." },
      { id: 'MOTION_LAB', label: 'MOTION LAB', icon: Icons.Move, desc: "Dynamic storyboard architect. Plan complex motion sequences and video narratives." },
      { id: 'SONIC_STUDIO', label: 'SONIC STUDIO', icon: Icons.Music, desc: "Audio synthesis lab. Generate voiceovers and sonic branding elements." },
      { id: 'LIVE_SCRIBE', label: 'LIVE SCRIBE', icon: Icons.Pen, desc: "Real-time combat transcription. Record and analyze sales calls or strategy sessions." },
    ],
    SELL: [
      { id: 'BUSINESS_ORCHESTRATOR', label: 'BUSINESS ORCHESTRATOR', icon: Icons.Briefcase, desc: "Master strategy builder. Assemble full dossiers combining all intelligence assets." },
      { id: 'PROPOSALS', label: 'PROPOSALS', icon: Icons.Contract, desc: "Smart contract architect. Draft high-converting proposals based on target data." },
      { id: 'ROI_CALC', label: 'ROI CALC', icon: Icons.Calc, desc: "Financial projection engine. Quantify the exact value of AI transformation for the client." },
      { id: 'SEQUENCER', label: 'SEQUENCER', icon: Icons.Link, desc: "Outreach cadence builder. Design multi-channel contact sequences (Email + LinkedIn)." },
      { id: 'DECK_ARCH', label: 'DECK ARCH', icon: Icons.Layout, desc: "Presentation logic. Structure compelling sales decks and narrative flows." },
      { id: 'DEMO_SANDBOX', label: 'DEMO SANDBOX', icon: Icons.Sandbox, desc: "Simulation environment. Model growth scenarios to prove upside to clients." },
      { id: 'DRAFTING', label: 'DRAFTING', icon: Icons.Edit, desc: "Copywriting workbench. Refine specific sales scripts and messaging." },
      { id: 'VOICE_STRAT', label: 'VOICE STRAT', icon: Icons.Message, desc: "Real-time sales coach. AI guidance for objection handling and closing." },
      { id: 'AI_CONCIERGE', label: 'AI CONCIERGE', icon: Icons.Bot, desc: "Autonomous agent simulation. Test nurture sequences with a simulated AI receptionist." },
      { id: 'PITCH_GEN', label: 'PITCH GEN', icon: Icons.Megaphone, desc: "Elevator hook generator. Create 30-second power pitches for immediate deployment." },
      { id: 'FUNNEL_MAP', label: 'FUNNEL MAP', icon: Icons.Filter, desc: "Conversion cartography. Visualize and optimize the client's customer journey." },
    ],
    CONTROL: [
      { id: 'PLAYBOOK', label: 'PLAYBOOK', icon: Icons.Book, desc: "Agency doctrine. Define and refine your core operating procedures and scoring rubrics." },
      { id: 'BILLING', label: 'BILLING', icon: Icons.CreditCard, desc: "Financial oversight. Track API usage costs and project operational expenditure." },
      { id: 'AFFILIATE', label: 'AFFILIATE', icon: Icons.Users, desc: "Partner matrix. Design and manage referral structures and commission tiers." },
      { id: 'IDENTITY', label: 'IDENTITY', icon: Icons.Fingerprint, desc: "Agency branding core. Define your own niche, voice, and visual identity." },
      { id: 'OS_FORGE', label: 'OS FORGE', icon: Icons.Cpu, desc: "System kernel. Configure low-level prompt injections and operational rules." },
      { id: 'EXPORT_DATA', label: 'EXPORT DATA', icon: Icons.Download, desc: "Data sovereignty. Export full system states and physical source code." },
      { id: 'CALENDAR', label: 'CALENDAR', icon: Icons.Calendar, desc: "Temporal command. Visualize deployment schedules and follow-up timelines." },
      { id: 'PROD_LOG', label: 'PROD LOG', icon: Icons.List, desc: "System trace. View raw operational logs and debug system events." },
      { id: 'SETTINGS', label: 'SETTINGS', icon: Icons.Settings, desc: "Global configuration. Adjust sensitivity, themes, and API connections." },
      { id: 'CIPHER_NODE', label: 'CIPHER NODE', icon: Icons.Key, desc: "Encryption suite. Manage cryptographic keys for secure data handling." },
      { id: 'NEXUS_GRAPH', label: 'NEXUS GRAPH', icon: Icons.Share, desc: "Entity relationship visualizer. See connections between niches and targets." },
      { id: 'CHRONOS', label: 'CHRONOS', icon: Icons.Clock, desc: "Historical timeline. Review past system actions and audit trails." },
      { id: 'TASKS', label: 'TASKS', icon: Icons.Check, desc: "Mission checklist. Track operational to-dos for specific targets." },
      { id: 'THEME', label: 'THEME', icon: Icons.Palette, desc: "Visual interface control. Switch between different OS aesthetic modes." },
      { id: 'TOKENS', label: 'TOKENS', icon: Icons.Ticket, desc: "Credit management. Monitor neural token consumption and quotas." },
    ],
  };

  const headerBg = theme === 'dark' ? 'bg-[#0b1021]/95 border-slate-800/60' : 'bg-white border-slate-200 shadow-sm';
  const labelColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const stripBg = theme === 'dark' ? 'bg-[#0b1021]/60 border-slate-800/30' : 'bg-slate-50 border-slate-200';

  // HELPER: MAIN NAVIGATION BUTTON STYLES
  const getModeStyles = (mode: MainMode, isActive: boolean) => {
    if (!isActive) {
      return theme === 'dark' ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-800';
    }
    switch (mode) {
      case 'OPERATE': return 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'; 
      case 'CREATE': return 'bg-violet-500 text-white shadow-lg shadow-violet-500/20';
      case 'STUDIO': return 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'; // Amber
      case 'SELL': return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
      case 'CONTROL': return 'bg-slate-500 text-white shadow-lg shadow-slate-500/20';
      default: return 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20';
    }
  };

  // HELPER: SUB-MODULE BUTTON STYLES
  const getSubModuleStyles = (mode: MainMode, isActive: boolean) => {
     if (!isActive) {
        return theme === 'dark' 
          ? 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white' 
          : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900';
     }
     
     const activeText = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';

     switch (mode) {
      case 'OPERATE': return `bg-indigo-600/20 border-indigo-500 ${activeText} shadow-sm`;
      case 'CREATE': return `bg-violet-600/20 border-violet-500 ${activeText} shadow-sm`;
      case 'STUDIO': return `bg-amber-600/20 border-amber-500 ${activeText} shadow-sm`; // Amber
      case 'SELL': return `bg-emerald-600/20 border-emerald-500 ${activeText} shadow-sm`;
      case 'CONTROL': return `bg-slate-600/20 border-slate-500 ${activeText} shadow-sm`;
      default: return `bg-indigo-600/20 border-indigo-500 ${activeText} shadow-sm`;
     }
  };
  
  // HELPER: SUB-MODULE ICON COLOR
  const getSubModuleIconColor = (mode: MainMode, isActive: boolean) => {
      if (!isActive) return '';
      switch (mode) {
          case 'OPERATE': return 'text-indigo-400';
          case 'CREATE': return 'text-violet-400';
          case 'STUDIO': return 'text-amber-400'; // Amber
          case 'SELL': return 'text-emerald-400';
          case 'CONTROL': return 'text-slate-400';
          default: return 'text-indigo-400';
      }
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617]' : 'bg-white'}`}>
      <header className={`${headerBg} backdrop-blur-xl border-b px-6 py-3 flex items-center justify-between z-40 transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
             <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
               <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
             </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className={`text-[11px] font-black leading-none tracking-widest uppercase ${labelColor}`}>POMELLI <span className="text-indigo-500 italic">CORE</span></h1>
            <p className="text-[8px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1 italic opacity-60">LEAD INTEL ENGINE V13.2</p>
          </div>
        </div>

        <div className={`border rounded-lg p-0.5 flex ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          {(['OPERATE', 'CREATE', 'STUDIO', 'SELL', 'CONTROL'] as MainMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => handleModeClick(mode)}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${getModeStyles(mode, activeMode === mode)}`}
            >
              {mode === 'OPERATE' && Icons.Operate}
              {mode === 'CREATE' && Icons.Create}
              {mode === 'STUDIO' && Icons.Studio}
              {mode === 'SELL' && Icons.Sell}
              {mode === 'CONTROL' && Icons.Control}
              <span className="hidden lg:inline">{mode}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'}`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <div className="relative group hidden xl:block">
             <input 
              onClick={onSearchClick}
              readOnly
              className={`border rounded-lg pl-8 pr-10 py-2 text-[10px] w-48 focus:outline-none cursor-pointer font-black tracking-wider transition-colors ${theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100 group-hover:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 group-hover:border-slate-500'}`} 
              placeholder="QUICK SEARCH..." 
            />
            <span className="absolute left-3 inset-y-0 flex items-center text-[10px]">🔍</span>
            <span className="absolute right-2.5 inset-y-0 flex items-center text-[7px] font-black text-slate-500">⌘K</span>
          </div>

          <div className="relative" ref={cityInputRef}>
            <div 
              className={`flex items-center gap-2 border rounded-lg px-4 py-2 hover:border-indigo-500 transition-colors cursor-pointer ${theme === 'dark' ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
              onClick={() => setShowCities(!showCities)}
            >
              <span className="text-[10px]">🌍</span>
              <input 
                type="text"
                value={theater}
                onChange={(e) => setTheater(e.target.value.toUpperCase())}
                className={`bg-transparent text-[10px] font-black uppercase tracking-[0.2em] w-32 focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                placeholder="REGION"
              />
              <span className="text-[8px] text-slate-500">▼</span>
            </div>

            {showCities && (
              <div className={`absolute top-full right-0 mt-2 w-72 rounded-2xl border shadow-2xl max-h-[400px] overflow-y-auto custom-scrollbar z-50 animate-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-[#020617] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`p-3 border-b sticky top-0 backdrop-blur-md z-10 flex justify-between items-center ${theme === 'dark' ? 'border-slate-800/80 bg-[#020617]/90' : 'border-slate-100 bg-white/90'}`}>
                   <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">STRATEGIC TARGETS</span>
                   <span className="text-[8px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">AI RANKED</span>
                </div>
                <div className="p-2 space-y-1">
                   {STRATEGIC_CITIES.map(c => (
                     <button
                       key={c.rank}
                       onClick={() => { setTheater(c.city); setShowCities(false); }}
                       className={`w-full text-left p-3 rounded-xl flex items-center justify-between group transition-all ${theme === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-50'}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border ${
                             c.tier.includes('S') ? 'bg-indigo-600 border-indigo-500 text-white' :
                             c.tier.includes('A') ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500' :
                             'bg-slate-800 border-slate-700 text-slate-500'
                           }`}>
                             {c.tier}
                           </div>
                           <div>
                              <p className={`text-[10px] font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-slate-200 group-hover:text-white' : 'text-slate-800'}`}>{c.city}</p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{c.focus.replace('_', ' ')}</p>
                           </div>
                        </div>
                        <span className="text-[8px] font-black text-slate-700 group-hover:text-indigo-500 transition-colors">#{c.rank}</span>
                     </button>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`${stripBg} border-b px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap z-30 shadow-inner transition-colors duration-300`}>
        {subModules[activeMode]?.map(mod => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all border group relative ${
                 getSubModuleStyles(activeMode, isActive)
              }`}
            >
              <span className={`text-xs transition-opacity ${isActive ? `opacity-100 font-bold ${getSubModuleIconColor(activeMode, true)}` : 'opacity-70 group-hover:opacity-100'}`}>{mod.icon}</span>
              <span className={`text-[10px] font-black tracking-widest uppercase transition-colors`}>{mod.label}</span>
              
              {/* TOOLTIP TRIGGER ICON */}
              <Tooltip content={mod.desc} side="bottom" width="w-56">
                <div className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700/50 hover:bg-indigo-500 text-white ml-1">
                  <span className="text-[8px] font-serif italic">i</span>
                </div>
              </Tooltip>
            </button>
          );
        })}
      </div>

      <main className={`flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        {children}
      </main>
    </div>
  );
};
