
import React from 'react';

interface UIBlock {
  type: 'p' | 'bullets' | 'table' | 'callout' | 'scorecard' | 'steps' | 'heading' | 'hero' | 'timeline';
  content?: string | string[] | any;
  label?: string;
  value?: string | number;
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

const executiveSanitize = (text: string): string => {
  if (!text) return "";
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
};

const promoteToStrategicReport = (text: string): UIBlocks => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const title = lines[0] || "INTELLIGENCE REPORT";
  return {
    format: 'ui_blocks',
    title: title.toUpperCase(),
    subtitle: "NEURAL SYNTHESIS",
    sections: [
      {
        heading: "RAW INTELLIGENCE",
        body: [{ type: 'p', content: text }]
      }
    ]
  };
};

export const FormattedOutput: React.FC<FormattedOutputProps> = ({ content, className = "" }) => {
  // CRASH GUARD: If there's no content, return nothing
  if (!content) return null;

  try {
    let uiData: UIBlocks | null = null;

    // Try to find a JSON block in the text
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        const jsonStr = content.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed.sections || parsed.format === 'ui_blocks') {
          uiData = parsed;
        }
      } catch (e) {
        // Not a structured UI block
      }
    }

    if (!uiData) {
      uiData = promoteToStrategicReport(content);
    }

    const renderBlock = (block: UIBlock, idx: number) => {
      if (!block) return null;
      const cleaned = typeof block.content === 'string' ? executiveSanitize(block.content) : block.content;

      switch (block.type) {
        case 'hero':
          return (
            <div key={idx} className="mb-12 p-10 bg-emerald-600 rounded-[40px] shadow-2xl relative overflow-hidden">
              <p className="text-2xl font-black text-white italic tracking-tight leading-tight relative z-10">"{cleaned}"</p>
            </div>
          );
        case 'p':
          return <p key={idx} className="text-slate-300 leading-relaxed mb-8 text-lg font-medium opacity-90">{cleaned}</p>;
        case 'bullets':
          const list = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {list.map((item: string, i: number) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] flex items-start gap-4">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="font-bold text-slate-100 uppercase tracking-wide text-xs">{item}</span>
                </div>
              ))}
            </div>
          );
        default:
          return <p key={idx} className="text-slate-400 text-xs mb-4 italic">{JSON.stringify(cleaned)}</p>;
      }
    };

    return (
      <div className={`space-y-16 animate-in fade-in duration-1000 ${className}`}>
        {uiData.title && (
          <div className="border-b-2 border-slate-800 pb-10">
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">{executiveSanitize(uiData.title)}</h1>
            {uiData.subtitle && <p className="text-emerald-500 font-black uppercase tracking-[0.6em] text-[10px]">{executiveSanitize(uiData.subtitle)}</p>}
          </div>
        )}

        {(uiData.sections || []).map((section, sIdx) => (
          <section key={sIdx} className="space-y-8">
            <h2 className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] italic opacity-50">{executiveSanitize(section.heading)}</h2>
            <div className="px-4">
              {(section.body || []).map((block, bIdx) => renderBlock(block, bIdx))}
            </div>
          </section>
        ))}
      </div>
    );
  } catch (fatalError) {
    console.error("FORMATTED_OUTPUT_CRASHED", fatalError);
    return (
      <div className="p-10 border-2 border-dashed border-rose-500/20 rounded-[40px] text-center bg-rose-500/5">
        <p className="text-rose-400 font-black uppercase tracking-widest mb-4">NEURAL RENDERING EXCEPTION</p>
        <div className="bg-black/50 p-6 rounded-2xl text-slate-500 font-mono text-[10px] whitespace-pre-wrap text-left">
          {content}
        </div>
      </div>
    );
  }
};
