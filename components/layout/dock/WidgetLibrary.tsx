import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, Plus, X } from 'lucide-react';
import { GlassCard } from '../../common/GlassCard';
import { TOOLS } from '../../../config/tools';
import { WidgetType, GlobalStyle, InternalToolType } from '../../../types';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface WidgetLibraryProps {
  onToggle: (type: WidgetType | InternalToolType) => void;
  visibleTools: (WidgetType | InternalToolType)[];
  canAccess: (type: WidgetType | InternalToolType) => boolean;
  onClose: () => void;
  globalStyle: GlobalStyle;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  onToggle,
  visibleTools,
  canAccess,
  onClose,
  globalStyle,
  triggerRef,
}) => {
  const libraryRef = useRef<HTMLDivElement>(null);
  useClickOutside(libraryRef, onClose, triggerRef ? [triggerRef] : []);

  return createPortal(
    <GlassCard
      ref={libraryRef}
      globalStyle={globalStyle}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl max-h-[60vh] overflow-hidden flex flex-col p-0 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 z-modal"
    >
      <div className="bg-white/50 px-6 py-4 border-b border-white/30 flex justify-between items-center shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-brand-blue-primary" />
          <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
            Widget Library
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {TOOLS.map((tool) => {
            if (!canAccess(tool.type)) return null;
            const isActive = visibleTools.includes(tool.type);
            return (
              <button
                key={tool.type}
                onClick={() => onToggle(tool.type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all group active:scale-95 border-2 ${
                  isActive
                    ? 'bg-white/80 border-brand-blue-primary shadow-md'
                    : 'bg-white/20 border-transparent opacity-40 grayscale hover:opacity-60 hover:grayscale-0'
                }`}
              >
                <div
                  className={`${tool.color} p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform relative`}
                >
                  <tool.icon className="w-6 h-6" />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                      <Plus className="w-2.5 h-2.5 rotate-45" />
                    </div>
                  )}
                </div>
                <span className="text-xxs font-black uppercase text-slate-700 tracking-tight text-center leading-tight">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-slate-50/50 px-6 py-3 border-t border-white/30 text-center backdrop-blur-xl">
        <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest">
          Tap a widget to add or remove it from your dock
        </p>
      </div>
    </GlassCard>,
    document.body
  );
};
