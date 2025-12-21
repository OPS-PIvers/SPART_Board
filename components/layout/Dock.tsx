import React, { useState, useMemo } from 'react';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { TOOLS } from '../../types';

export const Dock: React.FC = () => {
  const { addWidget, visibleTools } = useDashboard();
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => visibleTools.includes(tool.type));
  }, [visibleTools]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center">
      <div className="relative group/dock">
        {isExpanded ? (
          <>
            {/* The "little arrow" to minimize the toolbar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 p-2 bg-white/80 backdrop-blur shadow-xl rounded-full text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover/dock:opacity-100 hover:scale-110 active:scale-90"
              title="Minimize Toolbar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Expanded Toolbar with hover-to-reveal titles */}
            <div className="bg-white/80 backdrop-blur-2xl px-4 py-3 rounded-[2rem] shadow-2xl border border-white/50 flex items-center gap-1.5 md:gap-3 max-w-[95vw] overflow-x-auto no-scrollbar animate-in zoom-in-95 fade-in duration-300">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => addWidget(tool.type)}
                    className="group flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90"
                  >
                    <div
                      className={`${tool.color} p-2 md:p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-all duration-200`}
                    >
                      <tool.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter opacity-0 group-hover/dock:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      {tool.label}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-6 py-2 text-[10px] font-black uppercase text-slate-400 italic">
                  No apps selected in settings
                </div>
              )}
            </div>
          </>
        ) : (
          /* Compressed down to a single icon */
          <button
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:scale-110 active:scale-90 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] animate-in fade-in zoom-in duration-300"
            title="Open Tools"
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
