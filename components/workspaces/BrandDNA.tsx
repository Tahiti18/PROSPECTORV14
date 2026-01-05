import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { extractBrandDNA, generateVisual, generateVideoPayload } from '../../services/geminiService';

interface BrandDNAProps {
  lead?: Lead;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
}

export const BrandDNA: React.FC<BrandDNAProps> = ({ lead, onUpdateLead }) => {
  // Use a local "phantom" lead if none is selected
  const [adHocLead, setAdHocLead] = useState<Partial<Lead>>({
    id: 'temp-adhoc',
    businessName: 'AD-HOC TARGET',
    niche: 'Unclassified',
    city: 'Global',
    brandIdentity: undefined
  });

  const activeEntity = lead || adHocLead as Lead;

  const [targetUrl, setTargetUrl] = useState(lead?.websiteUrl || '');
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  
  // Local state for images
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lead) {
      setTargetUrl(lead.websiteUrl || '');
      // Initialize with lead's images
      const extracted = lead.brandIdentity?.extractedImages || [];
      setGeneratedImages(extracted); 
    } else {
        const extracted = activeEntity.brandIdentity?.extractedImages || [];
        setGeneratedImages(extracted);
    }
  }, [lead?.id]);

  // --- PERSISTENCE HELPER ---
  const saveImagesToLead = (newImages: string[]) => {
    setGeneratedImages(newImages);
    
    if (lead && onUpdateLead) {
        const currentIdentity = lead.brandIdentity || {
            colors: [], fontPairing: '', archetype: '', visualTone: '', extractedImages: []
        };
        onUpdateLead(lead.id, { 
            brandIdentity: {
                ...currentIdentity,
                extractedImages: newImages
            }
        });
    } else {
        setAdHocLead(prev => {
            const currentIdentity = prev.brandIdentity || {
                colors: [], fontPairing: '', archetype: '', visualTone: '', extractedImages: []
            };
            return {
                ...prev,
                brandIdentity: {
                    ...currentIdentity,
                    extractedImages: newImages
                }
            };
        });
    }
  };

  const handleExtractBrand = async () => {
    if (!targetUrl) {
      alert("Please enter a website URL.");
      return;
    }
    setIsExtractingBrand(true);
    try {
      const brandData = await extractBrandDNA(activeEntity, targetUrl);
      
      // Force update the image grid
      if (brandData.extractedImages && brandData.extractedImages.length > 0) {
          saveImagesToLead(brandData.extractedImages);
      } else {
          // Fallback if no images found
          if (lead && onUpdateLead) onUpdateLead(lead.id, { brandIdentity: brandData });
      }

      if (lead && onUpdateLead) {
        onUpdateLead(lead.id, { brandIdentity: brandData });
      } else {
        setAdHocLead(prev => ({
            ...prev,
            businessName: new URL(targetUrl).hostname.replace('www.', '').split('.')[0].toUpperCase(),
            brandIdentity: brandData
        }));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to extract brand identity. The URL might be blocking scanners or invalid.");
    } finally {
      setIsExtractingBrand(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!activeEntity.brandIdentity) {
        alert("Please extract Brand DNA first.");
        return;
    }
    setIsGeneratingImages(true);
    const newImages: string[] = [];
    
    const prompts = [
      `Editorial style photography for ${activeEntity.businessName}, ${activeEntity.niche}, ${activeEntity.brandIdentity.visualTone} aesthetic, high resolution, soft natural lighting.`,
      `Product showcase background for ${activeEntity.businessName}, minimalist, premium texture, brand colors, 4k.`,
      `Lifestyle shot representing ${activeEntity.brandIdentity.brandValues?.[0] || 'quality'}, candid, authentic, warm lighting.`,
      `Abstract brand wallpaper using palette, geometric, modern, clean.`
    ];

    await Promise.all(prompts.map(async (p) => {
      try {
        const url = await generateVisual(p, activeEntity);
        if (url) newImages.push(url);
      } catch (e) {
        console.error("Image gen failed", e);
      }
    }));
    
    const updatedList = [...newImages, ...generatedImages];
    saveImagesToLead(updatedList);
    setIsGeneratingImages(false);
  };

  const handleAnimate = async (imgUrl: string, index: number) => {
    setAnimatingIndex(index);
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.aistudio) {
          // @ts-ignore
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
          }
      }

      let base64Image = "";
      if (imgUrl.startsWith("data:")) {
        base64Image = imgUrl; 
      } else {
        try {
            const res = await fetch(imgUrl);
            const blob = await res.blob();
            base64Image = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch(e) {
            alert("Cannot animate external URL. Download and re-upload first.");
            setAnimatingIndex(null);
            return;
        }
      }

      const prompt = "Cinematic slow motion pan, bringing the image to life, 4k high quality";
      const videoUrl = await generateVideoPayload(prompt, activeEntity.id, base64Image);
      
      if (videoUrl) {
        const updatedList = [videoUrl, ...generatedImages];
        saveImagesToLead(updatedList);
      }
    } catch(e) {
        console.error("Animation failed", e);
        alert("Animation failed.");
    } finally {
        setAnimatingIndex(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
            const updatedList = [result, ...generatedImages];
            saveImagesToLead(updatedList);
        }
      };
      reader.readAsDataURL(file);
    }
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const handleDeleteImage = (indexToDelete: number) => {
    if (confirm("Permanently delete this asset?")) {
        const updatedList = generatedImages.filter((_, i) => i !== indexToDelete);
        saveImagesToLead(updatedList);
    }
  };

  const handleDownloadImage = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASSET_${activeEntity.businessName}_${index + 1}.png`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetDNA = () => {
    if (confirm("Are you sure you want to reset the Business DNA? This cannot be undone.")) {
        saveImagesToLead([]); // Clear images
        if (lead && onUpdateLead) {
            onUpdateLead(lead.id, { brandIdentity: undefined });
        } else {
            setAdHocLead(prev => ({ ...prev, brandIdentity: undefined }));
        }
    }
  };

  const fonts = activeEntity.brandIdentity?.fontPairing ? activeEntity.brandIdentity.fontPairing.split(' / ') : ['Serif', 'Sans'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-20 max-w-[1600px] mx-auto py-8 px-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black uppercase tracking-tight text-white italic">
               {activeEntity.businessName}
            </h2>
            {!lead && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                    AD-HOC MODE
                </span>
            )}
          </div>
          <p className="text-slate-400 mt-2 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            BRAND DNA STUDIO — {activeEntity.city} Region
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* BRAND DNA STUDIO (Full Width) */}
        <div className="lg:col-span-12">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative">
              
              {/* DNA Header / Input */}
              <div className="p-8 border-b border-slate-800 bg-[#05091a] flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="text-center md:text-left">
                    <div className="flex justify-center md:justify-start mb-2">
                       <span className="text-3xl">🧬</span>
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Brand DNA Studio</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-lg">
                       Extraction Engine & Visual Synthesis Core
                    </p>
                 </div>
                 
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <input 
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="ENTER EXTERNAL URL..."
                      className="bg-[#0b1021] border border-slate-700 text-slate-200 px-6 py-4 rounded-xl text-xs font-bold w-full md:w-80 focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600"
                    />
                    <button 
                      onClick={handleExtractBrand}
                      disabled={isExtractingBrand}
                      className="bg-white text-black hover:bg-slate-200 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-white/10"
                    >
                      {isExtractingBrand ? 'ANALYZING...' : 'EXTRACT DNA'}
                    </button>
                 </div>
              </div>

              {/* DNA Content */}
              {activeEntity.brandIdentity ? (
                 <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-[#0b1021]">
                    
                    {/* LEFT COLUMN: STRATEGIC DNA (Text) */}
                    <div className="md:col-span-5 space-y-6">
                       
                       {/* Tagline */}
                       <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">CORE TAGLINE</p>
                          <h4 className="text-2xl font-black text-[#d4ff5f] italic leading-tight uppercase tracking-tight">
                             {activeEntity.brandIdentity.tagline || "No tagline extracted."}
                          </h4>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          {/* Aesthetic */}
                          <div className="bg-[#12182b] border border-slate-800/60 p-6 rounded-3xl">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">AESTHETIC</p>
                             <div className="flex flex-wrap gap-2">
                                {activeEntity.brandIdentity.aestheticTags?.map((tag, i) => (
                                   <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-widest">
                                      {tag}
                                   </span>
                                ))}
                             </div>
                          </div>

                          {/* Voice */}
                          <div className="bg-[#12182b] border border-slate-800/60 p-6 rounded-3xl">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">VOICE</p>
                             <div className="flex flex-wrap gap-2">
                                {activeEntity.brandIdentity.voiceTags?.map((tag, i) => (
                                   <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-widest">
                                      {tag}
                                   </span>
                                ))}
                             </div>
                          </div>
                       </div>

                       {/* Business Overview / Mission */}
                       <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">BUSINESS OVERVIEW</p>
                          <p className="text-sm text-slate-200 leading-relaxed font-serif italic">
                             {activeEntity.brandIdentity.mission || "No mission statement extracted."}
                          </p>
                       </div>

                       {/* Values */}
                       <div className="bg-[#12182b] border border-slate-800/60 p-6 rounded-3xl">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">BRAND VALUES</p>
                          <div className="flex flex-wrap gap-3">
                             {activeEntity.brandIdentity.brandValues?.map((val, i) => (
                                <span key={i} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-bold uppercase tracking-wide">
                                   {val}
                                </span>
                             ))}
                          </div>
                       </div>

                    </div>

                    {/* RIGHT COLUMN: VISUAL DNA (Images, Colors, Fonts) */}
                    <div className="md:col-span-7 space-y-6">
                       
                       {/* Visual Assets Grid */}
                       <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl h-auto">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 flex justify-between items-center">
                             <span>VISUAL ASSETS</span>
                             <span className="text-emerald-500">{generatedImages.length} ITEMS</span>
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             {/* Upload Card */}
                             <div 
                               onClick={() => uploadInputRef.current?.click()}
                               className="aspect-[3/4] bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700 group"
                             >
                                <span className="text-2xl mb-2 text-slate-600 group-hover:text-white transition-colors">↑</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors text-center">UPLOAD<br/>IMAGES</span>
                                <input type="file" ref={uploadInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                             </div>

                             {/* Generate Card */}
                             <div 
                               onClick={handleGenerateImages}
                               className={`aspect-[3/4] bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700 group ${isGeneratingImages ? 'opacity-50 pointer-events-none' : ''}`}
                             >
                                <span className={`text-2xl mb-2 text-emerald-500 ${isGeneratingImages ? 'animate-spin' : ''}`}>✨</span>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest text-center px-1">
                                   {isGeneratingImages ? 'FORGING...' : 'GENERATE\nSOCIAL PACK'}
                                </span>
                             </div>

                             {/* Image Items */}
                             {generatedImages.map((img, i) => (
                                <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden relative group border border-slate-700/50 shadow-lg bg-black">
                                   {/* If it looks like a video (base64 video mime or .mp4) render video */}
                                   {img.startsWith('data:video') || img.endsWith('.mp4') ? (
                                      <video src={img} controls className="w-full h-full object-cover" />
                                   ) : (
                                      <img 
                                        src={img} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        alt="Brand Asset" 
                                        onError={(e) => {
                                            // Hide image if it fails to load
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                        }}
                                      />
                                   )}
                                   
                                   {/* Hover Overlay */}
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                      <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDownloadImage(img, i); }}
                                            className="text-[10px] bg-white text-black px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-400 transition-colors"
                                            title="Download"
                                        >
                                            ⬇
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(i); }}
                                            className="text-[10px] bg-white text-black px-3 py-1.5 rounded-lg font-bold hover:bg-rose-500 hover:text-white transition-colors"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                      </div>
                                      
                                      {/* ANIMATE BUTTON - Veo Experimental */}
                                      {!(img.startsWith('data:video') || img.endsWith('.mp4')) && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleAnimate(img, i); }}
                                            disabled={animatingIndex === i}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
                                          >
                                            {animatingIndex === i ? (
                                                <>
                                                    <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    RENDERING...
                                                </>
                                            ) : (
                                                <>⚡ ANIMATE</>
                                            )}
                                          </button>
                                      )}
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Colors & Fonts Grid */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Palette */}
                          <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">PALETTE</p>
                             <div className="flex gap-4">
                                {activeEntity.brandIdentity.colors.map((c, i) => (
                                   <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                                      <div className="w-14 h-14 rounded-full border-4 border-[#0b1021] shadow-lg group-hover:scale-110 transition-transform ring-1 ring-slate-700" style={{ backgroundColor: c }}></div>
                                      <span className="text-[8px] text-slate-500 font-mono uppercase">{c}</span>
                                   </div>
                                ))}
                             </div>
                          </div>

                          {/* Typography */}
                          <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">TYPOGRAPHY</p>
                             <div className="flex gap-10">
                                <div>
                                   <span className="text-6xl font-serif text-white block">Aa</span>
                                   <span className="text-[10px] text-slate-400 font-medium mt-2 block">{fonts[0] || 'Primary'}</span>
                                </div>
                                <div>
                                   <span className="text-6xl font-sans text-white block">Aa</span>
                                   <span className="text-[10px] text-slate-400 font-medium mt-2 block">{fonts[1] || 'Secondary'}</span>
                                </div>
                             </div>
                          </div>

                       </div>

                       <div className="mt-4">
                          <button 
                            onClick={handleResetDNA}
                            className="w-full py-4 bg-slate-900 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-950 hover:text-rose-500 hover:border-rose-900 border border-transparent transition-all flex items-center justify-center gap-2"
                          >
                             <span>🗑️</span> RESET BUSINESS DNA
                          </button>
                       </div>

                    </div>

                 </div>
              ) : (
                 <div className="p-32 flex flex-col items-center justify-center text-center bg-[#0b1021]">
                    <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl border border-slate-800">
                        <span className="text-5xl grayscale opacity-50">🧬</span>
                    </div>
                    <h3 className="text-3xl font-black italic text-white mb-4 uppercase tracking-tighter">DNA Matrix Empty</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-md mb-8 leading-relaxed">
                       Enter a business URL above and click "EXTRACT DNA" to initialize the neural brand extraction engine.
                    </p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
