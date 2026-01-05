
import React, { useState, useEffect, useRef } from 'react';
import { Lead, OutreachStatus, BrandIdentity } from '../../types';
import { extractBrandDNA, generateVisual } from '../../services/geminiService';

interface WarRoomProps {
  lead?: Lead;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
}

const STATUS_OPTIONS: OutreachStatus[] = ['cold', 'queued', 'sent', 'opened', 'replied', 'booked', 'won', 'lost', 'paused'];

export const WarRoom: React.FC<WarRoomProps> = ({ lead, onUpdateLead }) => {
  // Use a local "phantom" lead if none is selected to allow ad-hoc analysis
  const [adHocLead, setAdHocLead] = useState<Partial<Lead>>({
    id: 'temp-adhoc',
    businessName: 'AD-HOC TARGET',
    niche: 'Unclassified',
    city: 'Global',
    assetGrade: 'C',
    socialGap: 'Manual Analysis Required',
    visualProof: 'N/A',
    bestAngle: 'N/A'
  });

  const activeEntity = lead || adHocLead as Lead;

  const [localNotes, setLocalNotes] = useState('');
  const [localTag, setLocalTag] = useState('');
  const [targetUrl, setTargetUrl] = useState(lead?.websiteUrl || '');
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when/if real lead changes
  useEffect(() => {
    if (lead) {
      setLocalNotes(lead.notes || '');
      setTargetUrl(lead.websiteUrl || '');
      // Initialize with any previously extracted images + generated
      const extracted = lead.brandIdentity?.extractedImages || [];
      setGeneratedImages(extracted); 
    } else {
        setGeneratedImages(activeEntity.brandIdentity?.extractedImages || []);
    }
  }, [lead?.id, activeEntity.brandIdentity]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);
    if (lead && onUpdateLead) {
      onUpdateLead(lead.id, { notes: val });
    }
  };

  const addTag = () => {
    if (!lead || !onUpdateLead || !localTag.trim()) return;
    const currentTags = lead.tags || [];
    if (!currentTags.includes(localTag.trim())) {
      onUpdateLead(lead.id, { tags: [...currentTags, localTag.trim()] });
    }
    setLocalTag('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!lead || !onUpdateLead) return;
    const currentTags = lead.tags || [];
    onUpdateLead(lead.id, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const handleStatusChange = (newStatus: OutreachStatus) => {
    if (lead && onUpdateLead) {
      onUpdateLead(lead.id, { 
        status: newStatus, 
        outreachStatus: newStatus 
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
      
      // Auto-populate grid with extracted images immediately
      if (brandData.extractedImages && brandData.extractedImages.length > 0) {
          setGeneratedImages(prev => [...brandData.extractedImages!, ...prev]);
      }

      if (lead && onUpdateLead) {
        onUpdateLead(lead.id, { brandIdentity: brandData });
      } else {
        // Update local ad-hoc state if no real lead is selected
        setAdHocLead(prev => ({
            ...prev,
            businessName: new URL(targetUrl).hostname.replace('www.', '').split('.')[0].toUpperCase(),
            brandIdentity: brandData
        }));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to extract brand identity. Please check the URL and try again.");
    } finally {
      setIsExtractingBrand(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!activeEntity.brandIdentity) return;
    setIsGeneratingImages(true);
    const newImages: string[] = [];
    const prompts = [
      "Hero image for homepage, wide shot, professional, 4k, hyper-realistic",
      "Lifestyle shot featuring customers interacting with product, happy, bright, depth of field",
      "Product or service detail shot, close up, high quality, studio lighting, sharp focus",
      "Social media abstract background with brand colors, geometric, modern art style"
    ];

    // Generate images in parallel
    await Promise.all(prompts.map(async (p) => {
      try {
        const url = await generateVisual(p, activeEntity);
        if (url) newImages.push(url);
      } catch (e) {
        console.error("Image gen failed", e);
      }
    }));
    
    setGeneratedImages(prev => [...prev, ...newImages]);
    setIsGeneratingImages(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setGeneratedImages(prev => [ev.target?.result as string, ...prev]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDNA = () => {
    if (confirm("Are you sure you want to reset the Business DNA? This cannot be undone.")) {
        if (lead && onUpdateLead) {
            onUpdateLead(lead.id, { brandIdentity: undefined });
        } else {
            setAdHocLead(prev => ({ ...prev, brandIdentity: undefined }));
        }
        setGeneratedImages([]);
    }
  };

  const currentStatus = activeEntity.outreachStatus ?? activeEntity.status ?? 'cold';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
      
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
            {lead && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                activeEntity.assetGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                Grade {activeEntity.assetGrade}
                </span>
            )}
          </div>
          <p className="text-slate-400 mt-2 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {activeEntity.niche} Market — {activeEntity.city} Region
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
                    
                    {/* Left Column: Aesthetics & Values */}
                    <div className="md:col-span-7 space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Business Overview / Mission */}
                          <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl md:col-span-2 relative group hover:border-emerald-500/30 transition-all">
                             <div className="absolute top-6 right-6 text-emerald-500/20 text-4xl font-serif italic">"</div>
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">MISSION STATEMENT</p>
                             <p className="text-sm text-slate-200 leading-relaxed font-serif italic">
                                {activeEntity.brandIdentity.mission || "No mission statement extracted."}
                             </p>
                          </div>

                          {/* Tagline Card */}
                          <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl md:col-span-2">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">CORE TAGLINE</p>
                             <h4 className="text-2xl font-black text-[#d4ff5f] italic leading-tight uppercase tracking-tight">
                                {activeEntity.brandIdentity.tagline || "No tagline available."}
                             </h4>
                          </div>

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

                          {/* Tone of Voice */}
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

                          {/* Values */}
                          <div className="bg-[#12182b] border border-slate-800/60 p-6 rounded-3xl md:col-span-2">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">BRAND VALUES</p>
                             <div className="flex flex-wrap gap-3">
                                {activeEntity.brandIdentity.brandValues?.map((val, i) => (
                                   <span key={i} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-bold uppercase tracking-wide">
                                      {val}
                                   </span>
                                ))}
                             </div>
                          </div>

                          {/* Colors & Fonts */}
                          <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl md:col-span-2 flex flex-col md:flex-row gap-10">
                             <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">PALETTE</p>
                                <div className="flex gap-4">
                                   {activeEntity.brandIdentity.colors.map((c, i) => (
                                      <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                                         <div className="w-12 h-12 rounded-full border-4 border-[#0b1021] shadow-lg group-hover:scale-110 transition-transform ring-1 ring-slate-700" style={{ backgroundColor: c }}></div>
                                         <span className="text-[8px] text-slate-500 font-mono uppercase">{c}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                             <div className="flex-1 border-l border-slate-800 pl-10 md:block hidden">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">TYPOGRAPHY</p>
                                <div className="flex gap-10">
                                   <div>
                                      <span className="text-5xl font-serif text-white block">Aa</span>
                                      <span className="text-[9px] text-slate-500 uppercase font-black mt-2 block tracking-widest">{activeEntity.brandIdentity.fontPairing.split(' / ')[0] || 'Serif'}</span>
                                   </div>
                                   <div>
                                      <span className="text-5xl font-sans text-white block">Aa</span>
                                      <span className="text-[9px] text-slate-500 uppercase font-black mt-2 block tracking-widest">{activeEntity.brandIdentity.fontPairing.split(' / ')[1] || 'Sans'}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Right Column: Imagery Grid */}
                    <div className="md:col-span-5">
                       <div className="bg-[#12182b] border border-slate-800/60 p-8 rounded-3xl h-full flex flex-col">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 flex justify-between items-center">
                             <span>VISUAL ASSETS</span>
                             <span className="text-emerald-500">{generatedImages.length} ITEMS</span>
                          </p>
                          
                          <div className="grid grid-cols-2 gap-3 mb-6">
                             {/* Upload Button */}
                             <div 
                               onClick={() => uploadInputRef.current?.click()}
                               className="aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700 group"
                             >
                                <span className="text-2xl mb-2 text-slate-600 group-hover:text-white transition-colors">↑</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">UPLOAD</span>
                                <input type="file" ref={uploadInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                             </div>

                             {/* Generate Button */}
                             <div 
                               onClick={handleGenerateImages}
                               className={`aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700 group ${isGeneratingImages ? 'opacity-50 pointer-events-none' : ''}`}
                             >
                                <span className={`text-2xl mb-2 text-emerald-500 ${isGeneratingImages ? 'animate-spin' : ''}`}>✨</span>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                   {isGeneratingImages ? 'FORGING...' : 'GENERATE'}
                                </span>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 flex-1 content-start overflow-y-auto custom-scrollbar max-h-[500px] min-h-[300px]">
                             {generatedImages.map((img, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group border border-slate-700/50 shadow-lg">
                                   <img 
                                     src={img} 
                                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                     alt="Brand Asset" 
                                     onError={(e) => {
                                        // Hide image if it fails to load (common with scraped URLs)
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                     }}
                                   />
                                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <button className="text-xs">⬇️</button>
                                      <button className="text-xs">🗑️</button>
                                   </div>
                                </div>
                             ))}
                             {/* Placeholders if empty */}
                             {generatedImages.length === 0 && !isGeneratingImages && (
                                <>
                                   <div className="aspect-square rounded-2xl bg-slate-900/50 border border-slate-800"></div>
                                   <div className="aspect-square rounded-2xl bg-slate-900/50 border border-slate-800"></div>
                                   <div className="aspect-square rounded-2xl bg-slate-900/50 border border-slate-800"></div>
                                   <div className="aspect-square rounded-2xl bg-slate-900/50 border border-slate-800"></div>
                                </>
                             )}
                          </div>

                          <div className="mt-8 pt-6 border-t border-slate-800">
                             <button 
                               onClick={handleResetDNA}
                               className="w-full py-3 bg-slate-900 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-950 hover:text-rose-500 hover:border-rose-900 border border-transparent transition-all flex items-center justify-center gap-2"
                             >
                                <span>🗑️</span> FLUSH DNA
                             </button>
                          </div>
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

        {/* Bottom Section: CRM & Opportunity */}
        {/* Only show full CRM if we actually have a saved lead, otherwise simplified */}
        {lead ? (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] overflow-hidden shadow-xl">
                    <div className="p-8 border-b border-slate-800 flex items-center gap-3 bg-[#05091a]">
                    <span className="text-xl">📉</span>
                    <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs">Vulnerability Analysis</h3>
                    </div>
                    <div className="p-10">
                    <p className="text-slate-300 leading-relaxed text-xl italic font-serif">"{activeEntity.socialGap}"</p>
                    <div className="mt-10 grid grid-cols-2 gap-6">
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">VISUAL PROOF</p>
                        <p className="text-sm text-slate-300 font-medium">{activeEntity.visualProof}</p>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">VALUE ANGLE</p>
                        <p className="text-sm text-slate-300 font-medium">{activeEntity.bestAngle}</p>
                        </div>
                    </div>
                    </div>
                </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                <div className="bg-[#0b1021] border border-slate-800 rounded-[32px] p-8 shadow-xl">
                    <h3 className="font-black text-white mb-8 uppercase tracking-[0.2em] text-xs flex items-center gap-3">
                    <span className="text-lg">🗂️</span> CRM Command
                    </h3>
                    <div className="space-y-3 mb-8">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Status</p>
                        <select 
                        value={currentStatus} 
                        onChange={(e) => handleStatusChange(e.target.value as OutreachStatus)}
                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none uppercase appearance-none cursor-pointer"
                        >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                        </select>
                    </div>
                    <div className="space-y-3 mb-8">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tags</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                        {activeEntity.tags?.map((t, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-slate-900 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-slate-700">
                                {t}
                                <button onClick={() => removeTag(t)} className="text-slate-500 hover:text-rose-500 ml-1">×</button>
                            </span>
                        ))}
                        </div>
                        <div className="flex gap-2">
                        <input 
                            value={localTag}
                            onChange={(e) => setLocalTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                            placeholder="Add tag..."
                            className="flex-1 bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                        <button onClick={addTag} className="bg-slate-800 text-white px-4 rounded-xl hover:bg-slate-700 text-xs font-bold">+</button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Field Notes</p>
                        <textarea 
                        value={localNotes}
                        onChange={handleNotesChange}
                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-6 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none resize-none h-40"
                        placeholder="Record observations..."
                        />
                    </div>
                </div>
                </div>
            </div>
        ) : (
            <div className="lg:col-span-12 text-center p-8 opacity-50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    CRM FEATURES DISABLED IN AD-HOC MODE. SAVE TARGET TO LEDGER TO ENABLE FULL TRACKING.
                </p>
            </div>
        )}

      </div>
    </div>
  );
};
