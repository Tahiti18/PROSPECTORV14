import React, { useState, useEffect, useRef } from 'react';
import { Lead, CreativeAsset, Campaign, BrandIdentity } from '../../types';
import { extractBrandDNA, generateVisual, saveAsset, generateVideoPayload, loggedGenerateContent } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

interface BrandDNAProps {
  lead?: Lead;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
}

// UI Modes matching the Pomelli flow
type ViewMode = 'IDLE' | 'SCANNING' | 'DASHBOARD' | 'STRATEGY_SELECT' | 'CAMPAIGN' | 'EDITOR';

interface CampaignConcept {
  id: string;
  title: string;
  hook: string;
  visualDirection: string;
}

export const BrandDNA: React.FC<BrandDNAProps> = ({ lead, onUpdateLead }) => {
  // --- STATE ---
  const [view, setView] = useState<ViewMode>('IDLE');
  const [targetUrl, setTargetUrl] = useState(lead?.websiteUrl || '');
  
  // Data State
  const [adHocLead, setAdHocLead] = useState<Partial<Lead>>({
    id: 'temp-adhoc',
    businessName: 'TARGET BRAND',
    niche: 'Unclassified',
    brandIdentity: undefined
  });

  const activeEntity = lead || adHocLead as Lead;
  const activeIdentity = activeEntity.brandIdentity;

  // Flow State
  const [concepts, setConcepts] = useState<CampaignConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<CampaignConcept | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  
  // Loading States
  const [scanStep, setScanStep] = useState(0);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  const [isGeneratingCreatives, setIsGeneratingCreatives] = useState(false);
  
  // Editor
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [animatingAssetId, setAnimatingAssetId] = useState<string | null>(null);

  const SCAN_STEPS = [
    "Establishing uplink to visual cortex...",
    "Extracting typographic hierarchy...",
    "Sampling chromatic values...",
    "Analyzing brand archetype...",
    "Compiling DNA Matrix..."
  ];

  useEffect(() => {
    if (activeIdentity) {
      setView('DASHBOARD');
    }
  }, [activeIdentity]);

  // --- ACTIONS ---

  const handleExtract = async () => {
    if (!targetUrl.trim()) return;
    
    let safeUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(safeUrl)) safeUrl = `https://${safeUrl}`;
    setTargetUrl(safeUrl); 

    setView('SCANNING');
    setScanStep(0);

    // Simulated scanning progress
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
      toast.error("Extraction failed. Please try again.");
      setView('IDLE');
    }
  };

  const generateConcepts = async () => {
    setIsGeneratingConcepts(true);
    try {
        const prompt = `
            Analyze the brand "${activeEntity.businessName}" (${activeIdentity?.visualTone}).
            Generate 3 distinct, high-end social media campaign concepts.
            
            Return JSON:
            [
                { 
                    "title": "Campaign Title", 
                    "hook": "Emotional hook description", 
                    "visualDirection": "Visual style instructions" 
                }
            ]
        `;
        
        const response = await loggedGenerateContent({
            module: 'BRAND_DNA', contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(response);
        const newConcepts = parsed.map((c: any, i: number) => ({ ...c, id: `concept-${i}` }));
        setConcepts(newConcepts);
        setView('STRATEGY_SELECT');

    } catch (e) {
        console.error(e);
        toast.error("Failed to generate concepts.");
    } finally {
        setIsGeneratingConcepts(false);
    }
  };

  const handleSelectConcept = async (concept: CampaignConcept) => {
      setSelectedConcept(concept);
      setIsGeneratingCreatives(true);
      setView('CAMPAIGN');

      const timestamp = Date.now();
      const angles = ['STORY', 'PRODUCT', 'LIFESTYLE', 'ABSTRACT'];
      
      try {
          const promises = angles.map(async (angle, idx) => {
              const prompt = `Vertical 9:16 social for ${activeEntity.businessName}. Theme: ${concept.title}. Angle: ${angle}. Colors: ${activeIdentity?.colors.join(', ')}.`;
              const imgUrl = await generateVisual(prompt, activeEntity);
              
              if (!imgUrl) return null;

              // Explicitly cast to resolve type compatibility errors
              return {
                  id: `creative-${timestamp}-${idx}`,
                  type: 'static' as const,
                  angle: angle as any,
                  imageUrl: imgUrl,
                  headline: idx === 0 ? concept.title : activeEntity.businessName,
                  subhead: concept.hook.slice(0, 40) + "...",
                  cta: "Shop Now",
                  status: 'ready' as const
              } as CreativeAsset;
          });

          const results = await Promise.all(promises);
          const validAssets = results.filter((r): r is CreativeAsset => r !== null);

          const newCampaign: Campaign = {
              id: `camp-${timestamp}`,
              name: concept.title,
              timestamp,
              creatives: validAssets
          };

          setActiveCampaign(newCampaign);
          
          if (lead && onUpdateLead) {
              const current = lead.campaigns || [];
              onUpdateLead(lead.id, { campaigns: [newCampaign, ...current] });
          }

      } catch (e) {
          console.error(e);
          toast.error("Asset generation failed.");
      } finally {
          setIsGeneratingCreatives(false);
      }
  };

  const handleSaveAssetToVault = (asset: CreativeAsset) => {
      saveAsset(
          asset.type === 'motion' ? 'VIDEO' : 'IMAGE',
          `${asset.headline} - ${asset.angle}`,
          asset.type === 'motion' && asset.videoUrl ? asset.videoUrl : asset.imageUrl,
          'BRAND_DNA',
          activeEntity.id
      );
  };

  const handleAnimateAsset = async (asset: CreativeAsset) => {
      setAnimatingAssetId(asset.id);
      try {
          const videoUrl = await generateVideoPayload(
              `Cinematic animation of ${asset.angle} shot`, 
              activeEntity.id, 
              asset.imageUrl 
          );
          
          if (videoUrl && activeCampaign) {
              const updatedCreatives = activeCampaign.creatives.map(c => 
                  c.id === asset.id ? { ...c, type: 'motion' as const, videoUrl: videoUrl } : c
              );
              setActiveCampaign({ ...activeCampaign, creatives: updatedCreatives });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setAnimatingAssetId(null);
      }
  };

  // --- RENDERERS ---

  if (view === 'IDLE') {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-[#0b0c0f]">
            <div className="max-w-2xl w-full text-center space-y-12 animate-in fade-in duration-700">
                <div className="space-y-6">
                    <span className="text-6xl animate-pulse">🧬</span>
                    <h1 className="text-6xl font-serif text-[#e2e2e2] italic tracking-tight">Welcome to Pomelli</h1>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">
                        Easily generate on-brand social media campaigns.
                    </p>
                </div>

                <div className="relative group max-w-lg mx-auto">
                    <input 
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://yourbrand.com"
                        className="w-full bg-[#1a1a1a] border border-slate-800 text-[#e2e2e2] px-8 py-6 rounded-full text-center text-sm font-medium focus:outline-none focus:border-[#d4ff5f] transition-all shadow-2xl"
                    />
                    <button 
                        onClick={handleExtract}
                        className="mt-8 bg-[#d4ff5f] hover:bg-[#b8e645] text-black px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-transform active:scale-95 shadow-[0_0_20px_rgba(212,255,95,0.3)]"
                    >
                        Generate Business DNA
                    </button>
                </div>
            </div>
        </div>
    );
  }

  if (view === 'SCANNING') {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-[#0b0c0f]">
            <div className="relative w-full max-w-md bg-[#161616] rounded-[32px] p-12 text-center shadow-2xl border border-slate-800/50">
                <div className="absolute inset-0 bg-gradient-to-b from-[#d4ff5f]/5 to-transparent rounded-[32px] pointer-events-none"></div>
                <div className="space-y-8 relative z-10">
                    <h2 className="text-3xl font-serif text-[#e2e2e2] italic">Generating your Business DNA</h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                        We're researching and analyzing your business.<br/>
                        It will take several minutes. Feel free to come back later.
                    </p>
                    
                    <div className="flex justify-center py-8">
                        <div className="relative">
                            <div className="w-16 h-16 border-2 border-slate-800 rounded-full animate-[spin_3s_linear_infinite]"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-[#d4ff5f] rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#1a1a1a] rounded-full border border-slate-800">
                        <span className="text-[#d4ff5f] text-lg">✨</span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{SCAN_STEPS[scanStep]}</span>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  if (view === 'DASHBOARD' && activeIdentity) {
      return (
          <div className="max-w-[1400px] mx-auto py-12 px-6 space-y-12 animate-in fade-in zoom-in-95 duration-700 bg-[#0b0c0f] min-h-screen">
              <div className="text-center space-y-4">
                  <span className="text-3xl">🧬</span>
                  <h1 className="text-5xl font-serif text-[#e2e2e2] italic">Your Business DNA</h1>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">Snapshot of {activeEntity.businessName}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Identity Info */}
                  <div className="lg:col-span-5 space-y-6">
                      <div className="bg-[#1a1a1a] rounded-[32px] p-10 border border-slate-800 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
                          <div className="relative z-10">
                              <h2 className="text-4xl font-serif text-white mb-2">{activeEntity.businessName}</h2>
                              <a href={targetUrl} target="_blank" className="text-[10px] text-[#d4ff5f] font-mono hover:underline flex items-center gap-2">
                                  🔗 {new URL(targetUrl || 'https://google.com').hostname}
                              </a>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-8">
                              <div className="bg-[#222] p-6 rounded-[24px]">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 block">COLORS</span>
                                  <div className="flex -space-x-2">
                                      {activeIdentity.colors.slice(0,4).map((c, i) => (
                                          <div key={i} className="w-10 h-10 rounded-full border-2 border-[#222]" style={{ backgroundColor: c }}></div>
                                      ))}
                                  </div>
                              </div>
                              <div className="bg-[#e8e8e3] p-6 rounded-[24px] text-black flex flex-col justify-center items-center text-center">
                                  <span className="text-[9px] font-black opacity-50 uppercase tracking-widest mb-1">FONT</span>
                                  <span className="text-3xl font-serif">Aa</span>
                                  <span className="text-[8px] font-bold mt-1 uppercase">{activeIdentity.fontPairing.split('/')[0]}</span>
                              </div>
                          </div>
                      </div>

                      <div className="bg-[#1a1a1a] rounded-[32px] p-8 border border-slate-800">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 block">BRAND VOICE</span>
                          <div className="flex flex-wrap gap-2">
                              <span className="px-4 py-2 rounded-full border border-slate-700 text-slate-300 text-xs font-serif italic">{activeIdentity.visualTone}</span>
                              <span className="px-4 py-2 rounded-full border border-slate-700 text-slate-300 text-xs font-serif italic">Luxury</span>
                              <span className="px-4 py-2 rounded-full border border-slate-700 text-slate-300 text-xs font-serif italic">Timeless</span>
                          </div>
                      </div>
                  </div>

                  <div className="lg:col-span-7 bg-[#1a1a1a] rounded-[32px] p-8 border border-slate-800">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DETECTED ASSETS</h3>
                          <span className="text-[10px] text-slate-600">{activeIdentity.extractedImages?.length || 0} ITEMS</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                          {activeIdentity.extractedImages?.map((img, i) => (
                              <div key={i} className="aspect-[3/4] bg-black rounded-2xl overflow-hidden relative group border border-slate-800 hover:border-[#d4ff5f] transition-all cursor-pointer">
                                  <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#d4ff5f] text-black rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                      +
                                  </div>
                              </div>
                          ))}
                          {(!activeIdentity.extractedImages || activeIdentity.extractedImages.length === 0) && (
                              <div className="col-span-3 py-20 text-center opacity-30">No assets found.</div>
                          )}
                      </div>
                  </div>
              </div>

              <div className="flex justify-end pt-8">
                  <button 
                      onClick={generateConcepts}
                      disabled={isGeneratingConcepts}
                      className="bg-[#d4ff5f] hover:bg-[#b8e645] text-black px-12 py-5 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-all shadow-[0_0_30px_rgba(212,255,95,0.2)] active:scale-95"
                  >
                      {isGeneratingConcepts ? 'Analyzing Strategy...' : 'Get Campaign Ideas →'}
                  </button>
              </div>
          </div>
      );
  }

  if (view === 'STRATEGY_SELECT') {
      return (
          <div className="max-w-6xl mx-auto py-16 px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-[#0b0c0f] min-h-screen">
              <div className="text-center space-y-4 mb-16">
                  <span className="text-3xl block mb-4">📢</span>
                  <h1 className="text-5xl font-serif text-[#e2e2e2] italic">Select a Campaign Direction</h1>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-[0.2em]">
                      Based on your DNA, here are 3 recommended strategies.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {concepts.map((concept, i) => (
                      <div 
                          key={concept.id} 
                          onClick={() => handleSelectConcept(concept)}
                          className="bg-[#1a1a1a] border border-slate-800 rounded-[32px] p-8 hover:border-[#d4ff5f] hover:shadow-[0_0_30px_rgba(212,255,95,0.1)] transition-all cursor-pointer group flex flex-col min-h-[400px]"
                      >
                          <div className="flex-1 space-y-6">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-full">CONCEPT 0{i+1}</span>
                              <h3 className="text-3xl font-serif text-white italic leading-tight group-hover:text-[#d4ff5f] transition-colors">{concept.title}</h3>
                              <p className="text-sm text-slate-400 leading-relaxed">{concept.hook}</p>
                          </div>
                          <div className="mt-8 pt-8 border-t border-slate-800">
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">VISUAL DIRECTION</p>
                              <p className="text-xs text-slate-500 italic">{concept.visualDirection}</p>
                              
                              <div className="mt-6 w-full py-4 bg-slate-900 group-hover:bg-[#d4ff5f] rounded-2xl flex items-center justify-center transition-colors">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-black">Generate Assets</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  if (view === 'CAMPAIGN' || view === 'EDITOR') {
      return (
          <div className="h-screen bg-[#0b0c0f] flex flex-col overflow-hidden">
              <header className="h-20 px-8 flex items-center justify-between border-b border-slate-800 shrink-0 bg-[#0b0c0f] z-20">
                  <button onClick={() => setView('STRATEGY_SELECT')} className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      ← Back to Concepts
                  </button>
                  <h2 className="font-serif text-white italic text-xl">{activeCampaign?.name || 'New Campaign'}</h2>
                  <div className="w-20"></div>
              </header>

              <div className="flex-1 overflow-y-auto p-12 bg-[#0b0c0f]">
                  {isGeneratingCreatives ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-8">
                          <div className="w-20 h-20 border-4 border-slate-800 border-t-[#d4ff5f] rounded-full animate-spin"></div>
                          <p className="text-xs font-black text-[#d4ff5f] uppercase tracking-[0.3em] animate-pulse">Forging Visual Assets...</p>
                      </div>
                  ) : (
                      <div className="max-w-[1600px] mx-auto">
                          <div className="text-center mb-16 space-y-4">
                              <span className="text-2xl">✨</span>
                              <h2 className="text-4xl font-serif text-white italic">Campaign Assets</h2>
                              <p className="text-xs text-slate-500 uppercase tracking-widest">Ready to deploy. Click to Edit or Animate.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                              {activeCampaign?.creatives.map((asset) => (
                                  <div key={asset.id} className="group relative aspect-[9/16] bg-[#1a1a1a] rounded-[24px] overflow-hidden shadow-2xl border border-slate-800 hover:border-[#d4ff5f] transition-all cursor-pointer">
                                      {asset.type === 'motion' && asset.videoUrl ? (
                                          <video src={asset.videoUrl} autoPlay loop muted className="w-full h-full object-cover" />
                                      ) : (
                                          <img src={asset.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105" />
                                      )}
                                      
                                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                          <span className="text-[8px] font-black text-[#d4ff5f] uppercase tracking-widest mb-2 border border-[#d4ff5f] px-2 py-1 rounded-full w-fit">{asset.angle}</span>
                                          <h3 className="text-2xl font-serif text-white italic leading-none mb-2">{asset.headline}</h3>
                                          <p className="text-[10px] text-slate-300 uppercase tracking-wide line-clamp-2">{asset.subhead}</p>
                                          
                                          <div className="flex gap-2 mt-4">
                                              <button 
                                                  onClick={() => handleSaveAssetToVault(asset)}
                                                  className="flex-1 bg-white text-black py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#d4ff5f] transition-colors"
                                              >
                                                  Save
                                              </button>
                                              <button 
                                                  onClick={() => handleAnimateAsset(asset)}
                                                  className="bg-black/50 backdrop-blur border border-white/20 text-white p-3 rounded-full hover:bg-black transition-colors"
                                                  title="Animate with Veo"
                                              >
                                                  {animatingAssetId === asset.id ? '...' : '⚡'}
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return <div>Error State</div>;
};