
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  width?: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'top', width = 'w-64', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      // Calculate position relative to viewport + scroll
      if (side === 'bottom') {
        top = rect.bottom + scrollY + 8;
        left = rect.left + scrollX + (rect.width / 2);
      } else if (side === 'top') {
        top = rect.top + scrollY - 8;
        left = rect.left + scrollX + (rect.width / 2);
      } else if (side === 'right') {
        top = rect.top + scrollY + (rect.height / 2);
        left = rect.right + scrollX + 8;
      } else { // left
        top = rect.top + scrollY + (rect.height / 2);
        left = rect.left + scrollX - 8;
      }
      
      setCoords({ top, left });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Close on scroll to prevent detached floating tooltips
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) setIsVisible(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isVisible]);

  return (
    <>
      <div 
        ref={triggerRef} 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center justify-center cursor-help ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevent triggering parent button click
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div 
          className={`fixed z-[9999] pointer-events-none ${width}`}
          style={{ 
            top: coords.top - window.scrollY, // Adjust for fixed position
            left: coords.left - window.scrollX,
            transform: side === 'top' ? 'translate(-50%, -100%)' : 
                       side === 'bottom' ? 'translate(-50%, 0)' : 
                       side === 'left' ? 'translate(-100%, -50%)' : 
                       'translate(0, -50%)'
          }}
        >
           <div className="bg-[#0f172a] border border-slate-700/80 text-slate-300 text-xs font-medium leading-relaxed p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 relative">
             {content}
             
             {/* Arrows */}
             {side === 'top' && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-b border-r border-slate-700/80 rotate-45"></div>}
             {side === 'bottom' && <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-t border-l border-slate-700/80 rotate-45"></div>}
             {side === 'left' && <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#0f172a] border-t border-r border-slate-700/80 rotate-45"></div>}
             {side === 'right' && <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#0f172a] border-b border-l border-slate-700/80 rotate-45"></div>}
           </div>
        </div>,
        document.body
      )}
    </>
  );
};
