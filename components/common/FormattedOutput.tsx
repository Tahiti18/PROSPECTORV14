import React from 'react';

interface FormattedOutputProps {
  content: string | null | undefined;
  className?: string;
}

export const FormattedOutput: React.FC<FormattedOutputProps> = ({ content, className = "" }) => {
  if (!content) return null;

  // Step 1: Normalize content (handle common artifacts/noise)
  const normalized = content
    .replace(/```markdown/g, '')
    .replace(/```/g, '')
    .trim();

  // Step 2: Split into blocks
  const lines = normalized.split('\n');
  const blocks: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (currentList.length > 0) {
      const listKey = `list-${blocks.length}`;
      if (isNumberedList) {
        blocks.push(<ol key={listKey} className="list-decimal ml-6 space-y-2 mb-6 text-slate-300">{currentList}</ol>);
      } else {
        blocks.push(<ul key={listKey} className="list-disc ml-6 space-y-2 mb-6 text-slate-300">{currentList}</ul>);
      }
      currentList = [];
    }
  };

  // Helper to parse inline styles (Bold/Italic)
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-emerald-400/90 font-medium">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      blocks.push(<hr key={index} className="border-slate-800 my-8" />);
      return;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(<h1 key={index} className="text-3xl font-black text-white uppercase tracking-tighter mt-10 mb-4 border-b border-slate-800 pb-2 italic">{parseInline(trimmed.slice(2))}</h1>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(<h2 key={index} className="text-xl font-black text-emerald-500 uppercase tracking-widest mt-8 mb-4">{parseInline(trimmed.slice(3))}</h2>);
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(<h3 key={index} className="text-lg font-black text-white uppercase tracking-wider mt-6 mb-3">{parseInline(trimmed.slice(4))}</h3>);
      return;
    }

    // Unordered List
    const bulletMatch = trimmed.match(/^[-*+]\s+(.*)/);
    if (bulletMatch) {
      if (isNumberedList) flushList();
      isNumberedList = false;
      currentList.push(<li key={`${index}-li`} className="leading-relaxed pl-2">{parseInline(bulletMatch[1])}</li>);
      return;
    }

    // Numbered List
    const numberMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (numberMatch) {
      if (!isNumberedList) flushList();
      isNumberedList = true;
      currentList.push(<li key={`${index}-li`} className="leading-relaxed pl-2">{parseInline(numberMatch[1])}</li>);
      return;
    }

    // Paragraph (default)
    if (trimmed === '') {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={index} className="text-slate-300 leading-[1.8] text-sm mb-6 font-medium font-sans">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  // Final flush
  flushList();

  return (
    <div className={`formatted-output-container ${className}`}>
      {blocks}
    </div>
  );
};
