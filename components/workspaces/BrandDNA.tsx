import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { extractBrandDNA, generateVisual, saveAsset } from '../../services/geminiService';

interface BrandDNAProps {
  lead?: Lead;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
}

type ViewMode = 'IDLE' | 'SCANNING' | 'DASHBOARD' | 'CAMPAIGN' | 'EDITOR';

interface CampaignAsset {
  id: string;
  image: string;
  headline: string;
  subhead: string;
  cta: string;
  style: 'minimal' | 'luxury' | 'bold';
}

export const BrandDNA: React.FC<BrandDNAProps> = ({ lead, onUpdateLead }) => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState<ViewMode>('IDLE');
  const [targetUrl, setTargetUrl] = useState(lead?.websiteUrl || '');
  
  // Scanning State
  const [scanStep, setScanStep] = useState(0);
  const SCAN_STEPS = ["Analyzing visual hierarchy...", "Extracting color hex codes...", "Identifying typography...", "Writing brand tagline...", "Compiling DNA Matrix..."];

  // Campaign State
  const [campaignPrompt, setCampaignPrompt] = useState("");
  const [campaignAssets, setCampaignAssets] = useState<CampaignAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);

  // Data State
  const [adHocLead, setAdHocLead] = useState<Partial<Lead>>({
    id: 'temp-adhoc',
    businessName: 'AD-HOC TARGET',
    niche: 'Unclassified',
    brandIdentity: undefined
  });

  const activeEntity = lead || adHocLead as Lead;
  const activeIdentity = activeEntity.brandIdentity;

  // --- EFFECTS ---
  useEffect(() => {
    if (activeIdentity) {
      setView('DASHBOARD');
    }
  }, [activeIdentity]);

  // --- ACTIONS ---

  const handleExtract = async () => {
    if (!targetUrl.trim()) return;
    
    // 1. Normalize URL to prevent crashes (Auto-add https://)
    let safeUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(safeUrl)) {
        safeUrl = `https://${safeUrl}`;
    }
    setTargetUrl(safeUrl); // Update input to reflect fixed URL

    setView('SCANNING');
    setScanStep(0);

    // Simulate step progress while API runs
    const interval = setInterval(() => {
        setScanStep(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const brandData = await extractBrandDNA(activeEntity, safeUrl);
      
      clearInterval(interval);
      
      if (lead && onUpdateLead) {
        onUpdateLead(lead.id, { brandIdentity: brandData });
      } else {
        let name = "TARGET";
        try {
            name = new URL(safeUrl).hostname.replace('www.', '').split('.')[0].toUpperCase();
        } catch (e) {
            console.warn("URL Parsing failed, defaulting name.", e);
            name = safeUrl; // Fallback to raw string if URL parsing fails
        }
        setAdHocLead(prev => ({ ...prev, businessName: name, brandIdentity: brandData }));
      }
      setView('DASHBOARD');
    } catch (e) {
      clearInterval(interval);
      console.error("Extraction Flow Failed:", e);
      setView('IDLE');
      // Toast handled by service, we just reset UI safely
    }
  };

  const handleGenerateCampaign = async () => {
    if (!campaignPrompt) return;
    setIsGeneratingCampaign(true);
    
    // Simulate generation of 3 cards
    const newAssets: CampaignAsset[] = [];
    const prompts = [
        `Vertical social media post for ${activeEntity.businessName}, ${campaignPrompt}, close up product shot, ${activeEntity.brandIdentity?.visualTone}`,
        `Vertical story background for ${activeEntity.businessName}, ${campaignPrompt}, lifestyle context, ${activeEntity.brandIdentity?.visualTone}`,
        `Vertical luxury ad background for ${activeEntity.businessName}, ${campaignPrompt}, abstract texture, ${activeEntity.brandIdentity?.visualTone}`
    ];

    try {
        for (let i = 0; i < prompts.length; i++) {
            const img = await generateVisual(prompts[i], activeEntity);
            if (img) {
                newAssets.push({
                    id: `asset-${Date.now()}-${i}`,
                    image: img,
                    headline: i === 0 ? "A LEGACY REBORN." : i === 1 ? "PURE ELEGANCE." : "TIMELESS.",
                    subhead: activeEntity.brandIdentity?.tagline || "Discover the collection.",
                    cta: "SHOP NOW",
                    style: 'luxury'
                });
            }
        }
        setCampaignAssets(newAssets);
        setView('CAMPAIGN');
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingCampaign(false);
    }
  };

  const handleSaveAsset = (asset: CampaignAsset) => {
      saveAsset('IMAGE', `CAMPAIGN_${asset.headline}`, asset.image, 'BRAND_DNA', activeEntity.id);
  };

  // --- RENDERERS ---

  // 1. SCANNING UI (The Glowing Card)
  if (view === 'SCANNING') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-[#020617]">
         <div className="relative w-full max-w-md bg-[#0b1021] border border-slate-800 rounded-[32px] p-10 overflow-hidden shadow-2xl">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-emerald-500/10 blur-[60px] animate-pulse"></div>
            <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-[32px] animate-pulse"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
               <div className="space-y-4">
                  <h2 className="text-3xl font-serif text-white italic">Generating your Business DNA</h2>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                     We're researching and analyzing your business. <br/>It will take a few moments.
                  </p>
               </div>

               <div className="w-full bg-[#05091a] border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center gap-3 shadow-inner">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{SCAN_STEPS[scanStep]}</span>
               </div>

               <div className="w-full space-y-4">
                  <div className="aspect-video rounded-xl bg-black overflow-hidden relative border border-slate-800">
                     <iframe src={targetUrl} className="w-full h-full opacity-50 scale-150 pointer-events-none" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0b1021] to-transparent"></div>
                     <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="text-[9px] font-black text-white bg-black/50 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                           {activeEntity.businessName || 'TARGET SITE'}
                        </span>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                     <div className="w-3 h-3 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
                     About 30 seconds left
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  // 2. DASHBOARD UI (The Bento Box)
  if (view === 'DASHBOARD' && activeIdentity) {
    return (
      <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-10 animate-in fade-in zoom-in-95 duration-700">
         {/* Navigation */}
         <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('IDLE')} className="px-4 py-2 rounded-full border border-slate-700 text-[10px] font-bold text-slate-400 hover:text-white transition-colors">
               ← BACK
            </button>
            <div className="h-px flex-1 bg-slate-800"></div>
         </div>

         {/* Header */}
         <div className="text-center space-y-2">
            <span className="text-2xl mb-2 block">🧬</span>
            <h1 className="text-5xl font-serif text-white italic">Your Business DNA</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em]">Snapshot of {activeEntity.businessName}</p>
         </div>

         {/* BENTO GRID */}
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 bg-[#1a1a1a] rounded-[48px] border border-slate-800 shadow-2xl">
            
            {/* Brand Card */}
            <div className="md:col-span-6 bg-[#252525] rounded-[32px] p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px]"></div>
               <div>
                  <h2 className="text-4xl font-serif text-white">{activeEntity.businessName}</h2>
                  <a href={targetUrl} target="_blank" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono mt-2 block flex items-center gap-1">
                     🔗 {new URL(targetUrl || 'https://google.com').hostname}
                  </a>
               </div>
               <div className="mt-8">
                  <p className="text-lg text-slate-300 font-serif italic leading-relaxed">
                     "{activeIdentity.tagline}"
                  </p>
               </div>
            </div>

            {/* Typography Card */}
            <div className="md:col-span-3 bg-[#e8e8e3] rounded-[32px] p-8 flex flex-col items-center justify-center text-center text-[#1a1a1a]">
               <span className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60">Typography</span>
               <span className="text-7xl font-serif mb-2">Aa</span>
               <span className="text-xs font-bold uppercase tracking-wide">{activeIdentity.fontPairing?.split('/')[0] || 'Serif'}</span>
            </div>

            {/* Imagery Grid (Mini) */}
            <div className="md:col-span-3 grid grid-rows-2 gap-3">
               {activeIdentity.extractedImages?.slice(0, 2).map((img, i) => (
                  <div key={i} className="bg-black rounded-[24px] overflow-hidden relative group">
                     <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
               ))}
            </div>

            {/* Colors */}
            <div className="md:col-span-4 bg-[#252525] rounded-[32px] p-8">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6">PALETTE</span>
               <div className="flex gap-4">
                  {activeIdentity.colors?.slice(0, 4).map((c, i) => (
                     <div key={i} className="group relative">
                        <div className="w-12 h-12 rounded-full border border-white/10 shadow-lg" style={{ backgroundColor: c }}></div>
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{c}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Full Imagery Grid */}
            <div className="md:col-span-8 grid grid-cols-4 gap-3">
               {activeIdentity.extractedImages?.slice(2, 6).map((img, i) => (
                  <div key={i} className="bg-black rounded-[24px] overflow-hidden aspect-[3/4] relative group hover:scale-[1.02] transition-transform">
                     <img src={img} className="w-full h-full object-cover" />
                  </div>
               ))}
               {(!activeIdentity.extractedImages || activeIdentity.extractedImages.length < 3) && (
                  <div className="col-span-4 bg-[#252525] rounded-[24px] flex items-center justify-center">
                     <p className="text-[10px] font-bold text-slate-500 uppercase">Insufficient Imagery Extracted</p>
                  </div>
               )}
            </div>

         </div>

         {/* Action Bar */}
         <div className="flex justify-end">
            <button 
               onClick={() => setView('CAMPAIGN')}
               className="bg-[#d4ff5f] hover:bg-[#b8e645] text-black px-8 py-4 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-[#d4ff5f]/20 active:scale-95"
            >
               Create Campaign →
            </button>
         </div>
      </div>
    );
  }

  // 3. CAMPAIGN / EDITOR UI
  if (view === 'CAMPAIGN' || view === 'EDITOR') {
     const activeAsset = campaignAssets.find(a => a.id === activeAssetId);

     return (
       <div className="h-screen flex flex-col bg-[#0b1021] overflow-hidden">
          
          {/* Header */}
          <div className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-[#05091a]">
             <div className="flex items-center gap-4">
                <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">←</button>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                   {view === 'EDITOR' ? 'Creative Editor' : 'Campaign Studio'}
                </h2>
             </div>
             {view === 'EDITOR' && (
                <div className="flex gap-3">
                   <button 
                     onClick={() => handleSaveAsset(activeAsset!)}
                     className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-colors"
                   >
                      Save Asset
                   </button>
                </div>
             )}
          </div>

          <div className="flex-1 flex overflow-hidden">
             
             {/* EDITOR VIEW */}
             {view === 'EDITOR' && activeAsset ? (
                <div className="flex-1 flex">
                   
                   {/* Canvas */}
                   <div className="flex-1 bg-[#020617] flex items-center justify-center p-12 relative">
                      <div className="h-full aspect-[9/16] relative group overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-800">
                         <img src={activeAsset.image} className="w-full h-full object-cover" />
                         
                         {/* Overlay Text Layer */}
                         <div className="absolute inset-0 flex flex-col justify-between p-8 bg-gradient-to-b from-black/30 via-transparent to-black/80">
                            <div className="text-center mt-12">
                               <h2 className="text-4xl font-serif text-white italic drop-shadow-lg leading-tight">{activeAsset.headline}</h2>
                            </div>
                            <div className="text-center mb-8 space-y-4">
                               <p className="text-sm text-white font-medium uppercase tracking-widest drop-shadow-md">{activeAsset.subhead}</p>
                               <button className="bg-white text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-full">
                                  {activeAsset.cta}
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Editor Sidebar */}
                   <div className="w-80 border-l border-slate-800 bg-[#0b1021] p-6 space-y-8">
                      <div>
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Content Layers</h3>
                         <div className="space-y-4">
                            <div className="space-y-1">
                               <label className="text-[9px] font-bold text-slate-400">Headline</label>
                               <input 
                                 value={activeAsset.headline}
                                 onChange={(e) => setCampaignAssets(prev => prev.map(a => a.id === activeAsset.id ? {...a, headline: e.target.value} : a))}
                                 className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" 
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-bold text-slate-400">Subhead</label>
                               <input 
                                 value={activeAsset.subhead}
                                 onChange={(e) => setCampaignAssets(prev => prev.map(a => a.id === activeAsset.id ? {...a, subhead: e.target.value} : a))}
                                 className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" 
                               />
                            </div>
                         </div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-800">
                         <button className="w-full py-3 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                            <span>✨</span> Regenerate Visual
                         </button>
                      </div>
                   </div>
                </div>
             ) : (
                
                // CAMPAIGN VIEW (Carousel)
                <div className="flex-1 flex flex-col p-12 overflow-y-auto">
                   
                   {/* Prompt Bar */}
                   <div className="w-full max-w-2xl mx-auto mb-16 text-center space-y-6">
                      <div className="space-y-2">
                         <span className="text-4xl">📢</span>
                         <h2 className="text-4xl font-serif text-white italic">Campaign Studio</h2>
                      </div>
                      <div className="relative">
                         <input 
                           value={campaignPrompt}
                           onChange={(e) => setCampaignPrompt(e.target.value)}
                           className="w-full bg-[#1a1a1a] border border-slate-700 rounded-full px-8 py-5 text-sm text-white focus:outline-none focus:border-emerald-500 shadow-xl"
                           placeholder="Describe the campaign you want to create (e.g. 'Summer Collection Launch')..."
                         />
                         <button 
                           onClick={handleGenerateCampaign}
                           disabled={isGeneratingCampaign}
                           className="absolute right-2 top-2 bottom-2 bg-[#d4ff5f] hover:bg-[#b8e645] text-black px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                         >
                            {isGeneratingCampaign ? 'Generating...' : 'Suggest Ideas'}
                         </button>
                      </div>
                   </div>

                   {/* Suggestions / Assets */}
                   {campaignAssets.length > 0 && (
                      <div className="space-y-6">
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Suggestions based on Business DNA</h3>
                         <div className="flex justify-center gap-8 flex-wrap">
                            {campaignAssets.map((asset) => (
                               <div 
                                 key={asset.id} 
                                 className="w-[280px] aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all shadow-2xl"
                               >
                                  <img src={asset.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 bg-black/40">
                                     <h4 className="text-2xl font-serif text-white italic leading-tight mb-2">{asset.headline}</h4>
                                     <p className="text-[10px] text-white uppercase tracking-widest opacity-80">{asset.subhead}</p>
                                  </div>
                                  
                                  {/* Hover Actions */}
                                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); setActiveAssetId(asset.id); setView('EDITOR'); }}
                                       className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-colors"
                                     >
                                        ✎
                                     </button>
                                     <button className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-colors">
                                        ⬇
                                     </button>
                                  </div>
                               </div>
                            ))}
                            
                            {/* Add Creative Placeholder */}
                            <div className="w-[280px] aspect-[9/16] bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer">
                               <span className="text-4xl">+</span>
                               <span className="text-[10px] font-black uppercase tracking-widest">Add Creative</span>
                            </div>
                         </div>
                      </div>
                   )}

                </div>
             )}
          </div>
       </div>
     );
  }

  // DEFAULT / IDLE VIEW
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#020617]">
       <div className="max-w-xl space-y-8 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-[#1a1a1a] border border-slate-800 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl">
             <span className="text-5xl grayscale opacity-50">🧬</span>
          </div>
          <div className="space-y-4">
             <h1 className="text-5xl font-serif text-white italic">Brand DNA Studio</h1>
             <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Enter your website URL to extract your visual identity, typography, and voice. 
                We will use this DNA to generate high-fidelity campaign assets automatically.
             </p>
          </div>
          
          <div className="relative group">
             <input 
               value={targetUrl}
               onChange={(e) => setTargetUrl(e.target.value)}
               placeholder="https://yourbusiness.com"
               className="w-full bg-[#0b1021] border border-slate-700 text-white px-8 py-5 rounded-full text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-xl group-hover:shadow-emerald-500/10"
             />
             <button 
               onClick={handleExtract}
               className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
             >
               EXTRACT
             </button>
          </div>
       </div>
    </div>
  );
};