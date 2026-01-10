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
 * Global Markdown Stripper
 * Removes all markdown tokens while preserving the raw semantic text.
 */
const stripMarkdown = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s+/gm, '') // Headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/__(.*?)__/g, '$1') // Bold underscore
    .replace(/_(.*?)_/g, '$1') // Italic underscore
    .replace(/`{1,3}(.*?)`{1,3}/gs, '$1') // Code blocks/inline
    .replace(/^[*-]\s+/gm, '') // Bullets
    .replace(/^\d+\.\s+/gm, '') // Numbered lists
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, '') // Horizontal rules
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .trim();
};

export const FormattedOutput: React.FC<FormattedOutputProps> = ({ content, className = "" }) => {
  if (!content) return null;

  let uiData: UIBlocks | null = null;
  let isRawText = false;

  // Attempt to parse as UI Blocks JSON
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.format === 'ui_blocks' || parsed.sections) {
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

  // Helper to render a block
  const renderBlock = (block: UIBlock, idx: number) => {
    const cleanedContent = typeof block.content === 'string' ? stripMarkdown(block.content) : block.content;

    switch (block.type) {
      case 'heading':
        return <h4 key={idx} className="text-lg font-black text-white uppercase tracking-wider mt-6 mb-3">{cleanedContent}</h4>;
      case 'p':
        return <p key={idx} className="text-slate-300 leading-relaxed mb-4 text-sm">{cleanedContent}</p>;
      case 'bullets':
        return (
          <ul key={idx} className="space-y-2 mb-6 ml-4">
            {Array.isArray(block.content) && block.content.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="text-emerald-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{stripMarkdown(item)}</span>
              </li>
            ))}
          </ul>
        );
      case 'callout':
        return (
          <div key={idx} className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl mb-6 italic text-emerald-100 text-sm">
            {cleanedContent}
          </div>
        );
      case 'scorecard':
        return (
          <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.isArray(block.content) && block.content.map((item: any, i: number) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-xl font-black text-white italic">{item.value}</p>
              </div>
            ))}
          </div>
        );
      case 'steps':
        return (
          <div key={idx} className="space-y-4 mb-8">
            {Array.isArray(block.content) && block.content.map((item: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <span className="text-emerald-500 font-black italic text-lg">0{i + 1}</span>
                <div>
                  <p className="text-sm font-bold text-white uppercase">{stripMarkdown(item.title || item)}</p>
                  {item.desc && <p className="text-xs text-slate-500 mt-1">{stripMarkdown(item.desc)}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return <p key={idx} className="text-slate-400 text-xs mb-2">{JSON.stringify(cleanedContent)}</p>;
    }
  };

  if (uiData) {
    return (
      <div className={`ui-blocks-renderer space-y-12 ${className}`}>
        {(uiData.title || uiData.subtitle) && (
          <div className="border-b border-slate-800 pb-8">
            {uiData.title && <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">{stripMarkdown(uiData.title)}</h1>}
            {uiData.subtitle && <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">{stripMarkdown(uiData.subtitle)}</p>}
          </div>
        )}
        {uiData.sections.map((section, sIdx) => (
          <section key={sIdx} className="space-y-6">
            <h2 className="text-xl font-black text-emerald-500 uppercase tracking-widest border-l-4 border-emerald-500 pl-6 py-1">
              {stripMarkdown(section.heading)}
            </h2>
            <div className="space-y-4">
              {section.body.map((block, bIdx) => renderBlock(block, bIdx))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Fallback: Cleaned Raw Text Rendering
  const lines = content.split('\n');
  return (
    <div className={`raw-text-cleaner space-y-4 ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-4" />;
        
        // Semi-intelligent block detection for raw text
        if (trimmed.startsWith('#')) {
          return <h3 key={i} className="text-xl font-black text-white uppercase tracking-tight mt-8 mb-4">{stripMarkdown(trimmed)}</h3>;
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          return (
            <div key={i} className="flex gap-3 ml-4">
              <span className="text-emerald-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-slate-300 text-sm">{stripMarkdown(trimmed)}</p>
            </div>
          );
        }
        return <p key={i} className="text-slate-300 text-sm leading-relaxed mb-2">{stripMarkdown(trimmed)}</p>;
      })}
    </div>
  );
};
