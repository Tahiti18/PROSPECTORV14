import React from 'react';

interface UIBlock {
  type: 'p' | 'bullets' | 'table' | 'callout' | 'scorecard' | 'steps' | 'heading';
  content?: string | string[] | any;
  label?: string;
  value?: string | number;
  status?: string;
}

interface UIBlocks {
  format: 'ui_blocks';
  title?: string;
  subtitle?: string;
  sections: Array<{
    heading: string;
    body: UIBlock[];
  }>;
}

interface FormattedOutputProps {
  content: string | null | undefined;
  className?: string;
}

/**
 * Global Executive Cleaner
 * Eradicates all JSON markers, markdown junk, and code-block garbage.
 */
const cleanExecutiveText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^#{1,6}\s+/gm, '') 
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[*-]\s+/gm, '') 
    .replace(/^\d+\.\s+/gm, '') 
    .replace(/^>\s+/gm, '') 
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\{"format".*?\}/gs, '') // Remove any raw JSON if it leaked into text
    .trim();
};

export const FormattedOutput: React.FC<FormattedOutputProps> = ({ content, className = "" }) => {
  if (!content) return null;

  let uiData: UIBlocks | null = null;
  let isRawText = false;

  // Attempt to parse as UI Blocks JSON, even if wrapped in markdown fences
  try {
    let cleanJson = content.trim();
    if (cleanJson.includes('```json')) {
      cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
    } else if (cleanJson.includes('```')) {
      cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
    }
    
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonSnippet = cleanJson.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonSnippet);
      if (parsed.sections || parsed.format === 'ui_blocks') {
        uiData = parsed;
      } else {
        isRawText = true;
      }
    } else {
      isRawText = true;
    }
  } catch (e) {
    isRawText = true;
  }

  const renderBlock = (block: UIBlock, idx: number) => {
    const cleanedContent = typeof block.content === 'string' ? cleanExecutiveText(block.content) : block.content;

    switch (block.type) {
      case 'heading':
        return <h4 key={idx} className="text-xl font-black text-white uppercase tracking-tighter italic mt-10 mb-4 border-b border-slate-800 pb-2">{cleanedContent}</h4>;
      case 'p':
        return <p key={idx} className="text-slate-300 leading-relaxed mb-6 text-sm font-medium">{cleanedContent}</p>;
      case 'bullets':
        return (
          <ul key={idx} className="space-y-4 mb-8 ml-2">
            {Array.isArray(block.content) && block.content.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-4 text-slate-300 text-sm">
                <span className="text-emerald-500 mt-1 w-2 h-2 rounded-sm bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)] rotate-45" />
                <span className="font-medium">{cleanExecutiveText(item)}</span>
              </li>
            ))}
          </ul>
        );
      case 'callout':
        return (
          <div key={idx} className="bg-emerald-900/10 border-l-4 border-emerald-500 p-8 rounded-r-2xl mb-8 italic text-emerald-100 text-lg font-serif">
            "{cleanedContent}"
          </div>
        );
      case 'scorecard':
        return (
          <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {Array.isArray(block.content) && block.content.map((item: any, i: number) => (
              <div key={i} className="bg-[#05091a] border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-emerald-500/30 transition-all">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400">{item.label}</p>
                <p className="text-2xl font-black text-white italic tracking-tighter">{item.value}</p>
              </div>
            ))}
          </div>
        );
      case 'steps':
        return (
          <div key={idx} className="space-y-4 mb-10">
            {Array.isArray(block.content) && block.content.map((item: any, i: number) => (
              <div key={i} className="flex gap-6 p-6 bg-[#05091a] border border-slate-800 rounded-3xl group hover:border-emerald-500/20 transition-all">
                <span className="text-emerald-500 font-black italic text-3xl opacity-40 group-hover:opacity-100 transition-opacity">0{i + 1}</span>
                <div className="space-y-1">
                  <p className="text-base font-black text-white uppercase tracking-tight">{cleanExecutiveText(item.title || item)}</p>
                  {item.desc && <p className="text-xs text-slate-500 font-medium leading-relaxed">{cleanExecutiveText(item.desc)}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (uiData) {
    return (
      <div className={`ui-blocks-renderer space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 ${className}`}>
        {(uiData.title || uiData.subtitle) && (
          <div className="border-b border-slate-800 pb-10 mb-10">
            {uiData.title && <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">{cleanExecutiveText(uiData.title)}</h1>}
            {uiData.subtitle && <p className="text-[11px] text-emerald-500 font-black uppercase tracking-[0.5em] mt-4">{cleanExecutiveText(uiData.subtitle)}</p>}
          </div>
        )}
        {uiData.sections.map((section, sIdx) => (
          <section key={sIdx} className="space-y-8">
            <div className="flex items-center gap-6">
                <h2 className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] bg-emerald-500/5 px-4 py-2 rounded-lg border border-emerald-500/10">
                {cleanExecutiveText(section.heading)}
                </h2>
                <div className="flex-1 h-px bg-slate-800/50"></div>
            </div>
            <div className="px-2">
              {section.body.map((block, bIdx) => renderBlock(block, bIdx))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Fallback: Cleaned High-Fidelity Text Rendering
  const lines = content.split('\n');
  return (
    <div className={`raw-text-cleaner space-y-6 animate-in fade-in duration-500 ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "```" || trimmed === "```json") return null;
        
        const cleanLine = cleanExecutiveText(trimmed);
        if (!cleanLine) return null;

        return (
          <p key={i} className="text-slate-300 text-base leading-relaxed font-medium">
            {cleanLine}
          </p>
        );
      })}
    </div>
  );
};