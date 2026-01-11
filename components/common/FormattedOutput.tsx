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

/**
 * EXECUTIVE SANITIZER v4
 * Aggressively purges programmatic noise, list markers, and internal labels.
 */
const executiveSanitize = (text: string): string => {
  if (!text) return "";
  if (typeof text !== 'string') return String(text);
  
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^([\s\-\*\d\.]+)*[A-Z0-9_]+:\s*/gm, '')
    .replace(/^[\s\-\*•\d\.]+\s*/gm, '')
    .replace(/,$/gm, '')
    .replace(/[{}"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseTimeline = (lines: string[]): UIBlock | null => {
  const timestampRegex = /(\d{1,2}:\d{2}(:\d{2})?)/;
  const timestampedLines = lines.filter(l => timestampRegex.test(l));
  
  if (timestampedLines.length < 2) return null;

  return {
    type: 'timeline',
    content: timestampedLines.map(l => {
      const match = l.match(timestampRegex);
      return {
        time: match ? match[1] : '--:--',
        text: executiveSanitize(l.replace(timestampRegex, '').replace(/^[\s\-:]+/, ''))
      };
    })
  };
};

const promoteToStrategicReport = (text: string): UIBlocks => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const title = lines[0]?.length < 100 ? lines[0] : "INTELLIGENCE DOSSIER";
  const bodyLines = lines.slice(1);

  const timelineBlock = parseTimeline(bodyLines);
  const bullets = bodyLines.filter(l => l.includes(':') || l.startsWith('-') || l.startsWith('*'));
  const narrative = bodyLines.filter(l => !bullets.includes(l));

  const sections: any[] = [
    {
      heading: "EXECUTIVE SUMMARY",
      body: narrative.slice(0, 2).map(p => ({ type: 'hero', content: p }))
    }
  ];

  if (timelineBlock) {
    sections.push({
        heading: "TEMPORAL ANALYSIS",
        body: [timelineBlock]
    });
  }

  sections.push({
    heading: "STRATEGIC LEVERAGE",
    body: [
      { type: 'bullets', content: bullets.length > 0 ? bullets : narrative.slice(2) }
    ]
  });

  return {
    format: 'ui_blocks',
    title: title.toUpperCase(),
    subtitle: "GROUNDED NEURAL AUDIT",
    sections
  };
};

export const FormattedOutput: React.FC<FormattedOutputProps> = ({ content, className = "" }) => {
  if (!content) return null;

  let uiData: UIBlocks | null = null;

  try {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonStr = content.substring(start, end + 1);
      const parsed = JSON.parse(jsonStr);
      if (parsed.sections || parsed.format === 'ui_blocks') {
        uiData = parsed;
      }
    }
  } catch (e) {}

  if (!uiData) {
    uiData = promoteToStrategicReport(content);
  }

  const renderBlock = (block: UIBlock, idx: number) => {
    if (!block) return null;
    const cleaned = typeof block.content === 'string' ? executiveSanitize(block.content) : block.content;

    switch (block.type) {
      case 'hero':
        return (
          <div key={idx} className="mb-16 p-14 bg-emerald-600 rounded-[64px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 text-9xl font-black italic uppercase select-none">CORE</div>
            <p className="text-3xl font-black text-white italic tracking-tight leading-tight relative z-10">"{cleaned}"</p>
          </div>
        );
      case 'p':
        return <p key={idx} className="text-slate-300 leading-relaxed mb-12 text-xl font-medium opacity-90">{cleaned}</p>;
      case 'bullets':
        return (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {(Array.isArray(block.content) ? block.content : []).map((item: string, i: number) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] flex items-start gap-6 group hover:border-emerald-500/40 transition-all">
                <div className="mt-1 w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.8)] group-hover:scale-125 transition-transform" />
                <span className="font-bold text-slate-100 leading-relaxed uppercase tracking-wide text-sm">{executiveSanitize(item)}</span>
              </div>
            ))}
          </div>
        );
      case 'timeline':
        return (
          <div key={idx} className="space-y-6 mb-16 ml-2">
            {(Array.isArray(block.content) ? block.content : []).map((item: any, i: number) => (
              <div key={i} className="flex gap-8 group">
                 <div className="w-24 shrink-0 text-right pt-1">
                    <span className="text-[11px] font-black text-emerald-500 tracking-widest">{item?.time || '--:--'}</span>
                 </div>
                 <div className="flex-1 border-l-2 border-slate-800 pl-8 pb-8 group-last:pb-0 relative">
                    <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-slate-800 border-2 border-emerald-500 group-hover:bg-emerald-500 transition-colors"></div>
                    <p className="text-lg font-bold text-slate-200 tracking-tight">{executiveSanitize(item?.text || 'Point')}</p>
                 </div>
              </div>
            ))}
          </div>
        );
      case 'scorecard':
        return (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {(Array.isArray(block.content) ? block.content : []).map((item: any, i: number) => (
              <div key={i} className="bg-[#0b1021] border-2 border-slate-800 p-10 rounded-[40px] flex flex-col items-center justify-center text-center group hover:border-emerald-500/50 transition-all shadow-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 group-hover:text-emerald-400">{executiveSanitize(item?.label || 'METRIC')}</p>
                <p className="text-5xl font-black text-white italic tracking-tighter">{executiveSanitize(String(item?.value || '0'))}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`strategic-report-viewer space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 ${className}`}>
      {/* APEX HEADER */}
      {(uiData?.title || uiData?.subtitle) && (
        <div className="border-b-4 border-slate-800/60 pb-20 mb-20">
          {uiData.title && (
            <h1 className="text-8xl font-black text-white uppercase tracking-tighter italic leading-[0.85] drop-shadow-2xl mb-8">
              {executiveSanitize(uiData.title)}
            </h1>
          )}
          {uiData.subtitle && (
            <div className="flex items-center gap-10">
                <div className="w-20 h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                <p className="text-[14px] font-black text-emerald-500 uppercase tracking-[1em]">
                    {executiveSanitize(uiData.subtitle)}
                </p>
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC SECTIONS */}
      {(uiData?.sections || []).map((section, sIdx) => (
        <section key={sIdx} className="space-y-16">
          <div className="flex items-center gap-12">
              <h2 className="text-[13px] font-black text-emerald-400 uppercase tracking-[0.8em] bg-emerald-500/5 px-10 py-4 rounded-full border border-emerald-500/10 shadow-inner italic">
                {executiveSanitize(section?.heading || 'SECTION')}
              </h2>
              <div className="flex-1 h-[2px] bg-gradient-to-r from-slate-800 to-transparent opacity-40"></div>
          </div>
          <div className="px-8">
            {(section?.body || []).map((block, bIdx) => renderBlock(block, bIdx))}
          </div>
        </section>
      ))}

      {/* FOOTER CERTS */}
      <div className="pt-40 pb-20 opacity-20 flex justify-center items-center gap-12">
         <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">PROSPECTOR_AUTH_LAYER</span>
         </div>
         <div className="w-px h-10 bg-slate-800"></div>
         <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">HI_FIDELITY_RENDER</span>
         </div>
      </div>
    </div>
  );
};