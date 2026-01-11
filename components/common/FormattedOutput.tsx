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
  if (!content) return null;

  try {
    let uiData: UIBlocks | null = null;

    // Aggressive JSON isolation
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        const jsonStr = content.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed.sections || parsed.format === 'ui_blocks' || parsed.presentation) {
          uiData = parsed;
        }
      } catch (e) {
        // Fallback to text
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
          return <p key={idx} className="text-slate-400 text-xs mb-4 italic opacity-50">{JSON.stringify(cleaned)}</p>;
      }
    };

    return (
      <div className={`space-y-16 animate-in fade-in duration-1000 ${className}`}>
        {uiData?.title && (
          <div className="border-b-2 border-slate-800 pb-10">
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">{executiveSanitize(uiData.title)}</h1>
            {uiData.subtitle && <p className="text-emerald-500 font-black uppercase tracking-[0.6em] text-[10px]">{executiveSanitize(uiData.subtitle)}</p>}
          </div>
        )}

        {(uiData?.sections || []).map((section, sIdx) => (
          <section key={sIdx} className="space-y-8">
            <h2 className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] italic opacity-50">{executiveSanitize(section?.heading || "INTEL SEGMENT")}</h2>
            <div className="px-4">
              {(section?.body || []).map((block, bIdx) => renderBlock(block, bIdx))}
            </div>
          </section>
        ))}
      </div>
    );
  } catch (fatalError) {
    console.error("NEURAL_RENDER_CRITICAL_FAILURE", fatalError);
    return (
      <div className="p-12 border-2 border-dashed border-rose-500/20 rounded-[40px] text-center bg-rose-500/5 space-y-6">
        <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 text-4xl mx-auto shadow-xl">!</div>
        <div>
          <p className="text-rose-400 font-black uppercase tracking-[0.4em] mb-2">NEURAL RENDERING EXCEPTION</p>
          <p className="text-[10px] text-slate-500 uppercase font-bold italic">REASON: MALFORMED DATA STRUCTURE DETECTED. RE-GENERATE RECOMMENDED.</p>
        </div>
        <div className="bg-black/50 p-8 rounded-3xl text-slate-500 font-mono text-[9px] whitespace-pre-wrap text-left border border-slate-800 leading-relaxed overflow-hidden max-h-64">
          {content}
        </div>
      </div>
    );
  }
};
