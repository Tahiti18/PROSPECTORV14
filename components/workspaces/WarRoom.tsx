
import React, { useState, useEffect } from 'react';
import { Lead, OutreachStatus, BrandIdentity } from '../../types';
import { extractBrandDNA, generateVisual } from '../../services/geminiService';
import { Tooltip } from '../Tooltip';

interface WarRoomProps {
  lead?: Lead;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
}

const STATUS_OPTIONS: OutreachStatus[] = ['cold', 'queued', 'sent', 'opened', 'replied', 'booked', 'won', 'lost', 'paused'];

export const WarRoom: React.FC<WarRoomProps> = ({ lead, onUpdateLead }) => {
  const [localNotes, setLocalNotes] = useState('');
  const [localTag, setLocalTag] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Sync local state when lead changes
  useEffect(() => {
    if (lead) {
      setLocalNotes(lead.notes || '');
      setTargetUrl(lead.websiteUrl || '');
      setGeneratedImages([]); // Reset on lead change
    }
  }, [lead?.id]);

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
    if (!lead || !onUpdateLead) return;
    if (!targetUrl) {
      alert("Please enter a website URL.");
      return;
    }
    setIsExtractingBrand(true);
    try {
      const brandData = await extractBrandDNA(lead, targetUrl);
      onUpdateLead(lead.id, { brandIdentity: brandData });
    } catch (e) {
      console.error(e);
      alert("Failed to extract brand identity. Please try again.");
    } finally {
      setIsExtractingBrand(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!lead?.brandIdentity) return;
    setIsGeneratingImages(true);
    const newImages: string[] = [];
    const prompts = [
      "Hero image for homepage, wide shot, professional",
      "Lifestyle shot featuring customers, happy, bright",
      "Product or service detail shot, close up, high quality",
      "Social media abstract background with brand colors"
    ];

    // Generate 4 images sequentially or parallel
    for (const p of prompts) {
      try {
        const url = await generateVisual(p, lead);
        if (url) newImages.push(url);
      } catch (e) {}
    }
    
    setGeneratedImages(newImages);
    setIsGeneratingImages(false);
  };

  const handleResetDNA = () => {
    if (!lead || !onUpdateLead) return;
    if (confirm("Are you sure you want to reset the Business DNA? This cannot be undone.")) {
        onUpdateLead(lead.id, { brandIdentity: undefined });
        setGeneratedImages([]);
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <span className="text-5xl mb-6">📂</span>
        <h3 className="text-xl font-bold text-slate-300">No Account Selected</h3>
        <p className="text-sm mt-2">Go to Lead Database to select a prospect.</p>
      </div>
    );
  }

  const currentStatus = lead.outreachStatus ?? lead.status ?? 'cold';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-bold uppercase tracking-tight text-white">{lead.businessName}</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
              lead.assetGrade === 'A' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              Grade {lead.assetGrade}
            </span>
          </div>
          <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {lead.niche} Market — {lead.city} Region
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* BRAND DNA STUDIO (Full Width like Pomelli) */}
        <div className="lg:col-span-12">
           <div className="bg-[#1a1a1a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
              
              {/* Header */}
              <div className="p-8 border-b border-slate-800 bg-[#111] flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="text-center md:text-left">
                    <div className="flex justify-center md:justify-start mb-2">
                       <span className="text-2xl">🧬</span>
                    </div>
                    <h3 className="text-3xl font-serif text-white italic">Your Business DNA</h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-lg">
                       Here is a snapshot of your business that we'll use to create social media campaigns. 
                       Feel free to edit this at any time.
                    </p>
                 </div>
                 
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <input 
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="Enter Website URL..."
                      className="bg-[#222] border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs w-full md:w-64 focus:outline-none focus:border-white transition-colors"
                    />
                    <button 
                      onClick={handleExtractBrand}
                      disabled={isExtractingBrand}
                      className="bg-white text-black hover:bg-slate-200 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {isExtractingBrand ? 'Analyzing...' : 'Extract DNA'}
                    </button>
                 </div>
              </div>

              {/* DNA Content */}
              {lead.brandIdentity ? (
                 <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-[#111]">
                    
                    {/* Left Column: Aesthetics & Values */}
                    <div className="md:col-span-8 space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Tagline Card */}
                          <div className="bg-[#1a1a1a] border border-slate-800 p-6 rounded-2xl md:col-span-2">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Tagline</p>
                             <h4 className="text-xl font-serif text-[#d4ff5f] italic leading-snug">
                                {lead.brandIdentity.tagline}
                             </h4>
                          </div>

                          {/* Aesthetic */}
                          <div className="bg-[#1a1a1a] border border-slate-800 p-6 rounded-2xl">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Brand Aesthetic</p>
                             <div className="flex flex-wrap gap-2">
                                {lead.brandIdentity.aestheticTags?.map((tag, i) => (
                                   <span key={i} className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-[11px] uppercase tracking-wide">
                                      {tag}
                                   </span>
                                ))}
                             </div>
                          </div>

                          {/* Tone of Voice */}
                          <div className="bg-[#1a1a1a] border border-slate-800 p-6 rounded-2xl">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Brand Tone of Voice</p>
                             <div className="flex flex-wrap gap-2">
                                {lead.brandIdentity.voiceTags?.map((tag, i) => (
                                   <span key={i} className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-[11px] uppercase tracking-wide">
                                      {tag}
                                   </span>
                                ))}
                             </div>
                          </div>

                          {/* Values */}
                          <div className="bg-[#1a1a1a] border border-slate-800 p-6 rounded-2xl md:col-span-2">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Brand Values</p>
                             <div className="flex flex-wrap gap-2">
                                {lead.brandIdentity.brandValues?.map((val, i) => (
                                   <span key={i} className="px-4 py-2 rounded-xl bg-[#252525] border border-slate-700 text-slate-200 text-xs font-medium">
                                      {val}
                                   </span>
                                ))}
                             </div>
                          </div>

                          {/* Colors & Fonts */}
                          <div className="bg-[#1a1a1a] border border-slate-800 p-6 rounded-2xl md:col-span-2 flex flex-col md:flex-row gap-8">
                             <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Colors</p>
                                <div className="flex gap-3">
                                   {lead.brandIdentity.colors.map((c, i) => (
                                      <div key={i} className="flex flex-col items-center gap-2">
                                         <div className="w-12 h-12 rounded-full border-2 border-white/10 shadow-lg" style={{ backgroundColor: c }}></div>
                                         <span className="text-[9px] text-slate-500 font-mono uppercase">{c}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                             <div className="flex-1 border-l border-slate-800 pl-8 md:block hidden">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Typography</p>
                                <div className="flex gap-8">
                                   <div>
                                      <span className="text-4xl font-serif text-white block">Aa</span>
                                      <span className="text-[10px] text-slate-500 uppercase mt-1 block">{lead.brandIdentity.fontPairing.split(' ')[0] || 'Serif'}</span>
                                   </div>
                                   <div>
                                      <span className="text-4xl font-sans text-white block">Aa</span>
                                      <span className="text-[10px] text-slate-500 uppercase mt-1 block">Sans</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Right Column: Imagery */}
                    <div className="md:col-span-4 space-y-6">
                       <div className="bg-[#1a1a1a] border border-slate-800 p-6 rounded-2xl h-full flex flex-col">
                          <div className="flex justify-between items-center mb-6">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brand Imagery</p>
                             <button 
                               onClick={handleGenerateImages}
                               disabled={isGeneratingImages}
                               className="text-[10px] font-bold text-[#d4ff5f] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
                             >
                               {isGeneratingImages ? (
                                 <span className="animate-pulse">✨ Generating...</span>
                               ) : (
                                 <><span>✨</span> Generate Images</>
                               )}
                             </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 flex-1">
                             {generatedImages.length > 0 ? (
                                generatedImages.map((img, i) => (
                                   <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                                      <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Generated Brand Asset" />
                                   </div>
                                ))
                             ) : (
                                [1,2,3,4].map((i) => (
                                   <div key={i} className="aspect-square rounded-xl bg-[#222] flex items-center justify-center border border-slate-800/50">
                                      <span className="text-2xl grayscale opacity-20">🖼️</span>
                                   </div>
                                ))
                             )}
                          </div>
                          <div className="mt-6 flex justify-center">
                             <button 
                               onClick={handleResetDNA}
                               className="px-4 py-2 bg-[#d4ff5f] text-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2"
                             >
                                <span className="text-xs">🗑️</span> Reset Business DNA
                             </button>
                          </div>
                       </div>
                    </div>

                 </div>
              ) : (
                 <div className="p-20 flex flex-col items-center justify-center text-center bg-[#111]">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-4xl">🧬</div>
                    <h3 className="text-xl font-bold text-white mb-2">No DNA Extracted Yet</h3>
                    <p className="text-sm text-slate-400 max-w-md mb-8">
                       Enter the business website URL above and click "Extract DNA" to generate a full brand profile using our neural engine.
                    </p>
                 </div>
              )}
           </div>
        </div>

        {/* Bottom Section: CRM & Opportunity (Legacy) */}
        <div className="lg:col-span-8 space-y-8">
           {/* Opportunity Analysis */}
           <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex items-center gap-2">
              <span className="text-xl">📉</span>
              <h3 className="font-bold text-white uppercase tracking-widest text-xs">Opportunity Analysis</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-300 leading-relaxed text-lg italic">"{lead.socialGap}"</p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Visual Proof</p>
                  <p className="text-sm text-slate-200">{lead.visualProof}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Value Angle</p>
                  <p className="text-sm text-slate-200">{lead.bestAngle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           {/* CRM Command */}
           <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-6 shadow-xl">
             <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
               <span className="text-lg">🗂️</span> CRM Command
             </h3>
             <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status</p>
                <select 
                  value={currentStatus} 
                  onChange={(e) => handleStatusChange(e.target.value as OutreachStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none uppercase"
                >
                   {STATUS_OPTIONS.map(s => (
                     <option key={s} value={s}>{s.replace('_', ' ')}</option>
                   ))}
                </select>
             </div>
             <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags</p>
                <div className="flex flex-wrap gap-2 mb-2">
                   {lead.tags?.map((t, i) => (
                     <span key={i} className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded border border-slate-700">
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
                     className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                   />
                   <button onClick={addTag} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700 text-xs">+</button>
                </div>
             </div>
             <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Notes</p>
                <textarea 
                  value={localNotes}
                  onChange={handleNotesChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none resize-none h-32"
                  placeholder="Record observations..."
                />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
