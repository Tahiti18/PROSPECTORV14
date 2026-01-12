
import React from 'react';
import { MainMode, SubModule } from '../../types';

interface TransformationBlueprintProps {
  onNavigate: (mode: MainMode, mod: SubModule) => void;
}

interface CapabilitySection {
  title: string;
  subtitle: string;
  points: { title: string; desc: string }[];
  iconPaths: string[];
  color: string;
}

const CAPABILITIES: CapabilitySection[] = [
  {
    title: "Intelligence & Opportunity Detection",
    subtitle: "Finding the Gaps",
    iconPaths: ["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", "M10 7v3m0 0v3m0-3h3m-3 0H7"],
    color: "emerald",
    points: [
      { title: "Deep-Layer Social Audit", desc: "Scans Instagram, TikTok, and Facebook feeds to identify 'Social Deficits' that kill trust." },
      { title: "Visual Authority Analysis", desc: "Uses neural vision to grade design hierarchy, pinpointing exactly where a brand looks 'cheap'." },
      { title: "Competitor Reverse-Engineering", desc: "Deconstructs tech stacks and marketing strategies of market leaders." },
      { title: "Real-Time Trend Alignment", desc: "Monitors global news to suggest marketing angles that feel current and relevant." },
      { title: "Fact-Checking & Credibility", desc: "Verifies grounded data to ensure marketing claims build 'unshakable' trust." }
    ]
  },
  {
    title: "High-End Creative & Brand Revamp",
    subtitle: "The Aesthetic Transformation",
    iconPaths: ["M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"],
    color: "emerald",
    points: [
      { title: "Brand DNA Extraction", desc: "Instantly pulls core colors, fonts, and vibes from existing assets for 100% consistency." },
      { title: "4K Visual Studio", desc: "Generates ultra-high-fidelity commercial photography for websites and ads." },
      { title: "Photorealistic Mockups", desc: "Creates 'After' visuals—showing products or services as a finished premium brand." },
      { title: "Creative Hook Generation", desc: "Sparks hundreds of punchy headlines designed to stop the scroll on social media." }
    ]
  },
  {
    title: "Cinematic Media & Sonic Identity",
    subtitle: "The Brand Voice",
    iconPaths: ["M23 7l-7 5 7 5V7z", "M1 5h15v14H1z"],
    color: "emerald",
    points: [
      { title: "Cinematic Video Production", desc: "Forges professional video ads for TikTok, Reels, and YouTube Shorts via text descriptions." },
      { title: "Dynamic Storyboarding", desc: "Maps out narrative arcs before production starts to ensure conversion goals." },
      { title: "Sonic Branding", desc: "Composes original, high-fidelity background music and brand sounds." },
      { title: "Neural Voiceover Synthesis", desc: "Generates professional-grade human speech in multiple languages and tones." }
    ]
  },
  {
    title: "Automated Outreach & Sales Engine",
    subtitle: "The Closing Protocol",
    iconPaths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M12 8v4"],
    color: "emerald",
    points: [
      { title: "Multi-Channel Architecture", desc: "Builds 5-day engagement sequences across Email and LinkedIn." },
      { title: "Copy Optimization", desc: "Drafts personalized, high-conversion email templates addressing specific pains." },
      { title: "Interactive Proposals", desc: "Generates beautiful, web-based proposals that replace traditional boring PDFs." },
      { title: "ROI Value Projector", desc: "Uses mathematical modeling to show exactly how much more revenue AI will generate." },
      { title: "Pitch Deck Architecture", desc: "Designs slide-by-slide narratives focusing on Visual Proof and Transformation Logic." }
    ]
  },
  {
    title: "Conversion & Automation Strategy",
    subtitle: "The Scaling Vector",
    iconPaths: ["M12 20V10", "M18 20V4", "M6 20v-4"],
    color: "emerald",
    points: [
      { title: "Funnel Geometry Mapping", desc: "Visualizes the entire journey from TikTok ad to high-ticket client." },
      { title: "Autonomous AI Concierge", desc: "Creates proof-of-concept AI chat agents to book meetings 24/7." },
      { title: "Offer Synthesis", desc: "Re-architects service bundles into high-value, 'no-brainer' offers." },
      { title: "Regional Market Discovery", desc: "Scans entire cities to find businesses most likely to buy transformation services." }
    ]
  }
];

export const TransformationBlueprint: React.FC<TransformationBlueprintProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6 space-y-24 animate-in fade-in duration-1000 pb-60">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-2 border-emerald-500/20 pb-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="space-y-6 max-w-4xl relative z-10">
           <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official Capability Matrix</span>
           </div>
           <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
             TRANSFORMATION <span className="text-emerald-500 italic">BLUEPRINT</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium leading-relaxed font-serif italic max-w-2xl">
             A comprehensive deconstruction of the AI Transformation Engine. We bridge the gap between digital obscurity and market authority.
           </p>
        </div>
        <button 
          onClick={() => onNavigate('RESEARCH', 'MARKET_DISCOVERY')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all border-b-4 border-emerald-800 relative z-10"
        >
          Begin Discovery →
        </button>
      </div>

      {/* CAPABILITY GRID */}
      <div className="space-y-32">
        {CAPABILITIES.map((cap, i) => (
          <div key={i} className={`flex flex-col ${i % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-20 items-center`}>
            {/* Illustration side */}
            <div className="flex-1 w-full">
              <div className={`aspect-square md:aspect-video rounded-[64px] bg-[#0b1021] border-2 border-slate-800/80 p-16 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group transition-all hover:border-emerald-500/50`}>
                 <div className={`absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                 
                 {/* Resized high-contrast icons */}
                 <div className="relative z-10 mb-8 transition-transform group-hover:scale-110 duration-700">
                    <svg className="w-20 h-20 text-emerald-500/50 group-hover:text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {cap.iconPaths.map((d, di) => <path key={di} d={d} />)}
                    </svg>
                 </div>
                 
                 <div className="text-center relative z-10">
                   <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">{cap.title}</h3>
                   <p className="text-[10px] font-black text-slate-500 group-hover:text-emerald-500/60 transition-colors uppercase tracking-[0.5em]">{cap.subtitle}</p>
                 </div>

                 {/* Decorative architectural markers */}
                 <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-slate-800 group-hover:border-emerald-500/30 transition-colors"></div>
                 <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-slate-800 group-hover:border-emerald-500/30 transition-colors"></div>
              </div>
            </div>

            {/* List side */}
            <div className="flex-1 space-y-10">
               <div className="space-y-4">
                  <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] block">VECTOR 0{i+1}</span>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">{cap.title}</h2>
               </div>
               <div className="space-y-8">
                  {cap.points.map((point, pi) => (
                    <div key={pi} className="flex gap-6 group">
                       <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:scale-150 transition-all"></div>
                       <div className="space-y-1">
                          <h4 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors">{point.title}</h4>
                          <p className="text-sm text-slate-400 font-medium leading-relaxed italic opacity-80">{point.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER CTA */}
      <div className="bg-[#0b1021] border-2 border-emerald-500/20 rounded-[84px] p-24 text-center space-y-12 shadow-[0_0_50px_rgba(16,185,129,0.05)] relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
         <div className="space-y-6 relative z-10">
            <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
              READY TO <span className="text-emerald-500">REVAMP?</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto italic font-serif">
              Every tool mentioned above is fully operational and integrated into the Prospector OS neural core. Start your first transformation mission today.
            </p>
         </div>
         <div className="flex flex-col md:flex-row justify-center items-center gap-6 relative z-10">
            <button 
               onClick={() => onNavigate('RESEARCH', 'MARKET_DISCOVERY')}
               className="px-16 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl text-[14px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all border-b-4 border-emerald-800"
            >
               Deploy Discovery Scan
            </button>
            <button 
               onClick={() => onNavigate('RESEARCH', 'USER_GUIDE')}
               className="px-16 py-6 bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white rounded-3xl text-[14px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
            >
               Read User Manual
            </button>
         </div>
      </div>

    </div>
  );
};
