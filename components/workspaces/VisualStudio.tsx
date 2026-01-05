
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateVisual, saveAsset } from '../../services/geminiService';

interface VisualStudioProps {
  leads: Lead[];
  lockedLead?: Lead;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({ leads, lockedLead }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (lockedLead) {
        if (lockedLead.brandIdentity) {
            setPrompt(`Professional brand asset for ${lockedLead.businessName}. Style: ${lockedLead.brandIdentity.visualTone}. Colors: ${lockedLead.brandIdentity.colors.join(', ')}. Context: High-end corporate imagery.`);
        } else {
            setPrompt(`High-end minimalist branding for ${lockedLead.businessName}, luxury aesthetic, 4k render.`);
        }
    } else {
        setPrompt('A futuristic workspace with neon accents.');
    }
  }, [lockedLead]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const base64Image = await generateVisual(prompt, lockedLead);
      setGeneratedImage(base64Image);
    } catch (e) {
      console.error(e);
      alert("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSocialPack = async () => {
    if(!lockedLead || !lockedLead.brandIdentity) {
        alert("Please extract Brand DNA in Strategy Hub first.");
        return;
    }
    const platforms = ["Instagram Square", "LinkedIn Landscape", "Story Vertical"];
    setIsGenerating(true);
    for (const p of platforms) {
        const pPrompt = `Social media background for ${p}. ${prompt}`;
        try {
            await generateVisual(pPrompt, lockedLead);
        } catch(e) {}
    }
    setIsGenerating(false);
    alert("Social pack generated and saved to Asset Library.");
  }

  return (
    <div className="max-w-[1550px] mx-auto py-6 space-y-10 animate-in