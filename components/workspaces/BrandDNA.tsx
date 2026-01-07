
import React, { useState, useEffect, useRef } from 'react';
import { Lead, CreativeAsset, Campaign } from '../../types';
import { extractBrandDNA, generateVisual, saveAsset, generateVideoPayload } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

interface BrandDNAProps {
  lead?: Lead;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
}

type ViewMode = 'IDLE' | 'SCANNING' | 'DASHBOARD' | 'CAMPAIGN' | 'EDITOR';

const CREATIVE_ANGLES = [
  { id: 'PURIST', label: 'THE PURIST', desc: 'Minimalist product focus', prompt: 'Minimalist luxury product shot, clean background, soft lighting, 8k resolution' },
  { id: 'STORY', label: 'THE STORY', desc: 'Lifestyle context', prompt: 'Lifestyle context, model using the product, warm lighting, emotional connection' },
  { id: 'VALUE', label: 'THE VALUE', desc: 'Offer driven', prompt: 'Bold typographic layout, solid color background, high contrast, professional ad' },
  { id: 'ABSTRACT', label: 'THE ABSTRACT', desc: 'Brand texture', prompt: 'Abstract texture background, brand pattern, artistic, cinematic lighting' }
];

export const BrandDNA: React.FC<BrandDNAProps> = ({ lead, onUpdateLead }) => {
  // --- STATE ---
  const [view, setView] = useState<ViewMode>('IDLE');
  const [targetUrl, setTargetUrl] = useState(lead?.websiteUrl || '');
  
  // Scanning State
  const [scanStep, setScanStep] = useState(0);
  const SCAN_STEPS = ["Analyzing visual hierarchy...", "Extracting color hex codes...", "Identifying typography...", "Writing brand tagline...", "Compiling DNA Matrix..."];

  // Campaign State
  const [campaignPrompt, setCampaignPrompt] = useState("");
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  
  // Editor State
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [animatingAssetId, setAnimatingAssetId] = useState<string | null>(null);

  // Data State
  const [adHocLead, setAdHocLead] = useState<Partial<Lead>>({
    id: 'temp-adhoc',
    businessName: 'AD-HOC TARGET',
    niche: 'Unclassified',
    brandIdentity: undefined
  });

  const activeEntity = lead || adHocLead as Lead;
  const activeIdentity = activeEntity.brandIdentity;

  useEffect(() => {
    if (activeIdentity) {
      setView('DASHBOARD');
    }
  }, [activeIdentity]);

  // --- ACTIONS ---

  const handleExtract = async () => {
    if (!targetUrl.trim()) return;
    
    let safeUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(safeUrl)) {
        safeUrl = `https://${safeUrl}`;
    }
    setTargetUrl(safeUrl); 

    setView('SCANNING');
    setScanStep(0);

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
        try { name = new URL(safeUrl).hostname.replace('www.', '').split('.')[0].toUpperCase(); } catch (e) {}
        setAdHocLead(prev => ({ ...prev, businessName: name, brandIdentity: brandData }));
      }
      setView('DASHBOARD');
    } catch (e) {
      clearInterval(interval);
      console.error("Extraction Failed:", e);
      setView('IDLE');
    }
  };

  const handleGenerateCampaign = async () => {
    if (!campaignPrompt) return;
    setIsGeneratingCampaign(true);
    
    // We will generate 4 distinct assets based on angles
    const newAssets: CreativeAsset[] = [];
    const timestamp = Date.now();

    try {
        // Parallel generation for speed in this demo context
        // In prod, maybe sequential or batched to manage rate limits
        const promises = CREATIVE_ANGLES.map(async (angle, idx) => {
            // Incorporate extracted colors into prompt
            const brandColors = activeIdentity?.colors?.join(', ') || '';
            const basePrompt = `Vertical 9:16 social media background for ${activeEntity.businessName}, ${angle.prompt}. Context: ${campaignPrompt}. Brand colors: ${brandColors}. Style: ${activeIdentity?.visualTone || 'Luxury'}.`;
            
            // Try to use an extracted image as a base if available for the 'Purist' angle
            let baseImage = undefined;
            if (angle.id === 'PURIST' && activeIdentity?.extractedImages?.[0]) {
                // If we had a proxy to convert URL to base64 we'd use it here.
                // For now, we rely on text-to-image to simulate the composition.
            }

            const img = await generateVisual(basePrompt, activeEntity);
            
            if (img) {
                return {
                    id: `creative-${timestamp}-${idx}`,
                    type: 'static',
                    angle: angle.id,
                    imageUrl: img,
                    headline: idx === 0 ? "TIMELESS." : idx === 1 ? "PURE ELEGANCE." : idx === 2 ? "A LEGACY REBORN." : "THE FUTURE.",
                    subhead: activeIdentity?.tagline || "Discover the collection.",
                    cta: "SHOP NOW",
                    status: 'ready'
                } as CreativeAsset;
            }
            return null;
        });

        const results = await Promise.all(promises);
        const validAssets = results.filter(Boolean) as CreativeAsset[];
        
        const newCampaign: Campaign = {
            id: `camp-${timestamp}`,
            name: campaignPrompt,
            timestamp,
            creatives: validAssets
        };

        setActiveCampaign(newCampaign);
        setView('CAMPAIGN');

        // Save to lead history if possible
        if (lead && onUpdateLead) {
            const currentCampaigns = lead.campaigns || [];
            onUpdateLead(lead.id, { campaigns: [newCampaign, ...currentCampaigns] });
        }

    } catch (e) {
        console.error(e);
        toast.error("Campaign Generation Failed");
    } finally {
        setIsGeneratingCampaign(false);
    }
  };

  const handleAnimateAsset = async (asset: CreativeAsset) => {
      setAnimatingAssetId(asset.id);
      try {
          const videoUrl = await generateVideoPayload(
              `Cinematic slow motion animation of ${asset.angle.toLowerCase()} commercial, ${activeIdentity?.visualTone}`, 
              activeEntity.id, 
              asset.imageUrl // Base64
          );
          
          if (videoUrl && activeCampaign) {
              const updatedCreatives = activeCampaign.creatives.map(c => 
                  c.id === asset.id ? { ...c, type: 'motion', videoUrl: videoUrl } : c
              );
              const updatedCampaign = { ...activeCampaign, creatives: updatedCreatives as CreativeAsset[] }; // cast needed due to type narrowing
              setActiveCampaign(updatedCampaign);
              
              if (lead && onUpdateLead) {
                  const others = (lead.campaigns || []).filter(c => c.id !== activeCampaign.id);
                  onUpdateLead(lead.id, { campaigns: [updatedCampaign, ...others] });
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          setAnimatingAssetId(null);
      }
  };

  const handleSaveAssetToVault = (asset: CreativeAsset) => {
      const content = asset.type === 'motion' && asset.videoUrl ? asset.videoUrl : asset.imageUrl;
      const type = asset.type === 'motion' ? 'VIDEO' : 'IMAGE';
      saveAsset(type, `CAMPAIGN_${asset.headline}`, content, 'BRAND_DNA', activeEntity.id);
  };

  // --- RENDERERS ---

  // 1. SCANNING UI
  if (view === 'SCANNING') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-[#020617]">
         <div className="relative w-full max-w-md bg-[#0b1021] border border-slate-800 rounded-[32px] p-10 overflow-hidden shadow-2xl">
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
               </div>
            </div>
         </div>
      </div>
    );
  }

  // 2. DASHBOARD UI
  if (view === 'DASHBOARD' && activeIdentity) {
    return (
      <div className="max-w-[1600px] mx-auto py-8 px-6 space-y-10 animate-in fade-in zoom-in-95 duration-700">
         <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('IDLE')} className="px-4 py-2 rounded-full border border-slate-700 text-[10px] font-bold text-slate-400 hover:text-white transition-colors">← BACK</button>
            <div className="h-px flex-1 bg-slate-800"></div>
         </div>

         <div className="text-center space-y-2">
            <span className="text-2xl mb-2 block">🧬</span>
            <h1 className="text-5xl font-serif text-white italic">Your Business DNA</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em]">Snapshot of {activeEntity.businessName}</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 bg-[#1a1a1a] rounded-[48px] border border-slate-800 shadow-2xl">
            {/* Identity Card */}
            <div className="md:col-span-6 bg-[#252525] rounded-[32px] p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px]"></div>
               <div>
                  <h2 className="text-4xl font-serif text-white">{activeEntity.businessName}</h2>
                  <a href={targetUrl} target="_blank" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono mt-2 block flex items-center gap-1">
                     🔗 {new URL(targetUrl || 'https://google.com').hostname}
                  </a>
               </div>
               <div className="mt-8">
                  <p className="text-lg text-slate-300 font-serif italic leading-relaxed">"{activeIdentity.tagline}"</p>
               </div>
            </div>

            {/* Typography */}
            <div className="md:col-span-3 bg-[#e8e8e3] rounded-[32px] p-8 flex flex-col items-center justify-center text-center text-[#1a1a1a]">
               <span className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60">Typography</span>
               <span className="text-7xl font-serif mb-2">Aa</span>
               <span className="text-xs font-bold uppercase tracking-wide">{activeIdentity.fontPairing?.split('/')[0] || 'Serif'}</span>
            </div>

            {/* Color Palette */}
            <div className="md:col-span-3 bg-[#252525] rounded-[32px] p-8 flex flex-col justify-center">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6 text-center">PALETTE</span>
               <div className="flex flex-wrap justify-center gap-3">
                  {activeIdentity.colors?.slice(0, 5).map((c, i) => (
                     <div key={i} className="group relative">
                        <div className="w-10 h-10 rounded-full border border-white/10 shadow-lg cursor-pointer" style={{ backgroundColor: c }}></div>
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 rounded">{c}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Extracted Assets Grid */}
            <div className="md:col-span-12">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">DETECTED ASSETS</h3>
               <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {activeIdentity.extractedImages?.map((img, i) => (
                     <div key={i} className="aspect-square bg-black rounded-2xl overflow-hidden relative group border border-slate-800 hover:border-emerald-500 transition-colors cursor-pointer">
                        <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                           <span className="text-[8px] text-black font-bold">✓</span>
                        </div>
                     </div>
                  ))}
                  {(!activeIdentity.extractedImages || activeIdentity.extractedImages.length === 0) && (
                     <div className="col-span-6 bg-[#252525] rounded-2xl p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                        No assets detected via generic scan.
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Campaign Trigger */}
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
     const editingAsset = activeCampaign?.creatives.find(a => a.id === activeAssetId);

     return (
       <div className="h-screen flex flex-col bg-[#0b1021] overflow-hidden">
          
          {/* Header */}
          <div className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-[#05091a]">
             <div className="flex items-center gap-4">
                <button onClick={() => { setView('DASHBOARD'); setActiveAssetId(null); }} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">←</button>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                   {view === 'EDITOR' ? 'Creative Editor' : 'Campaign Studio'}
                </h2>
             </div>
             {view === 'EDITOR' && (
                <div className="flex gap-3">
                   <button 
                     onClick={() => handleSaveAssetToVault(editingAsset!)}
                     className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-colors"
                   >
                      Save Asset
                   </button>
                </div>
             )}
          </div>

          <div className="flex-1 flex overflow-hidden">
             
             {/* EDITOR VIEW */}
             {view === 'EDITOR' && editingAsset ? (
                <div className="flex-1 flex">
                   {/* Canvas */}
                   <div className="flex-1 bg-[#020617] flex items-center justify-center p-12 relative">
                      <div className="h-[80vh] aspect-[9/16] relative group overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-800 bg-black">
                         {editingAsset.type === 'motion' && editingAsset.videoUrl ? (
                            <video src={editingAsset.videoUrl} autoPlay loop muted className="w-full h-full object-cover" />
                         ) : (
                            <img src={editingAsset.imageUrl} className="w-full h-full object-cover" />
                         )}
                         
                         {/* Overlay Text Layer */}
                         <div className="absolute inset-0 flex flex-col justify-between p-8 bg-gradient-to-b from-black/30 via-transparent to-black/80">
                            <div className="text-center mt-12">
                               <h2 className="text-4xl font-serif text-white italic drop-shadow-lg leading-tight">{editingAsset.headline}</h2>
                            </div>
                            <div className="text-center mb-8 space-y-4">
                               <p className="text-sm text-white font-medium uppercase tracking-widest drop-shadow-md">{editingAsset.subhead}</p>
                               <button className="bg-white text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-full">
                                  {editingAsset.cta}
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Editor Sidebar */}
                   <div className="w-80 border-l border-slate-800 bg-[#0b1021] p-6 space-y-8 overflow-y-auto">
                      <div>
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Content Layers</h3>
                         <div className="space-y-4">
                            <div className="space-y-1">
                               <label className="text-[9px] font-bold text-slate-400">Headline</label>
                               <input 
                                 value={editingAsset.headline}
                                 onChange={(e) => setActiveCampaign(prev => prev ? ({ ...prev, creatives: prev.creatives.map(c => c.id === editingAsset.id ? {...c, headline: e.target.value} : c) }) : null)}
                                 className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" 
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-bold text-slate-400">Subhead</label>
                               <input 
                                 value={editingAsset.subhead}
                                 onChange={(e) => setActiveCampaign(prev => prev ? ({ ...prev, creatives: prev.creatives.map(c => c.id === editingAsset.id ? {...c, subhead: e.target.value} : c) }) : null)}
                                 className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" 
                               />
                            </div>
                         </div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-800 space-y-4">
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motion</h3>
                         <button 
                           onClick={() => handleAnimateAsset(editingAsset)}
                           disabled={animatingAssetId === editingAsset.id || editingAsset.type === 'motion'}
                           className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                         >
                            {animatingAssetId === editingAsset.id ? 'SYNTHESIZING VEO...' : (editingAsset.type === 'motion' ? 'MOTION ACTIVE ✓' : '⚡ ANIMATE (5s)')}
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

                   {/* Generated Assets */}
                   {activeCampaign && (
                      <div className="space-y-8 animate-in fade-in duration-700">
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Suggestions based on Business DNA</h3>
                         <div className="flex justify-center gap-8 flex-wrap">
                            {activeCampaign.creatives.map((asset) => (
                               <div 
                                 key={asset.id} 
                                 className="w-[280px] aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all shadow-2xl"
                               >
                                  {asset.type === 'motion' && asset.videoUrl ? (
                                     <video src={asset.videoUrl} autoPlay loop muted className="w-full h-full object-cover" />
                                  ) : (
                                     <img src={asset.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  )}
                                  
                                  {/* Badge */}
                                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-[7px] font-black text-white uppercase tracking-widest border border-white/10">
                                     {asset.angle}
                                  </div>

                                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 bg-black/20 group-hover:bg-black/40 transition-colors">
                                     <h4 className="text-2xl font-serif text-white italic leading-tight mb-2 drop-shadow-md">{asset.headline}</h4>
                                     <p className="text-[10px] text-white uppercase tracking-widest opacity-80 drop-shadow-sm">{asset.subhead}</p>
                                  </div>
                                  
                                  {/* Hover Actions */}
                                  <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); setActiveAssetId(asset.id); setView('EDITOR'); }}
                                       className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-colors"
                                     >
                                        ✎
                                     </button>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); handleSaveAssetToVault(asset); }}
                                       className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-colors"
                                     >
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

  // DEFAULT VIEW
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
             <button onClick={handleExtract} className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">EXTRACT</button>
          </div>
       </div>
    </div>
  );
};
