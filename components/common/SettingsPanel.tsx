import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { WidgetData, GlobalStyle } from '@/types';
import { Z_INDEX } from '@/config/zIndex';

interface SettingsPanelProps {
  widget: WidgetData;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  settings: React.ReactNode;
  shouldRenderSettings: boolean;
  onClose: () => void;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  globalStyle: GlobalStyle;
  title: string;
}

const PANEL_WIDTH = 380;
const PANEL_MARGIN = 12;

/** Hook that returns current viewport dimensions, updating on resize. */
function useViewportSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  widget,
  widgetRef,
  settings,
  shouldRenderSettings,
  onClose,
  updateWidget,
  globalStyle,
  title,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const viewport = useViewportSize();

  const transparency = widget.transparency ?? globalStyle.windowTransparency;

  // Compute panel position from widget props + viewport (no DOM measurement)
  const position = useMemo(() => {
    const { width: vw, height: vh } = viewport;
    const panelMaxH = vh * 0.8;

    // Maximized widgets: center the panel
    if (widget.maximized) {
      return {
        top: Math.max(PANEL_MARGIN, (vh - panelMaxH) / 2),
        left: Math.max(PANEL_MARGIN, (vw - PANEL_WIDTH) / 2),
      };
    }

    const widgetRight = widget.x + widget.w;
    const widgetLeft = widget.x;
    const widgetTop = widget.y;

    // Vertical: align top with widget, clamped to viewport
    const top = Math.max(
      PANEL_MARGIN,
      Math.min(widgetTop, vh - panelMaxH - PANEL_MARGIN)
    );

    // Try right side of widget
    const rightX = widgetRight + PANEL_MARGIN;
    if (rightX + PANEL_WIDTH + PANEL_MARGIN <= vw) {
      return { top, left: rightX };
    }

    // Try left side of widget
    const leftX = widgetLeft - PANEL_MARGIN - PANEL_WIDTH;
    if (leftX >= PANEL_MARGIN) {
      return { top, left: leftX };
    }

    // Fallback: center horizontally
    return {
      top,
      left: Math.max(PANEL_MARGIN, (vw - PANEL_WIDTH) / 2),
    };
  }, [widget.x, widget.y, widget.w, widget.h, widget.maximized, viewport]);

  // Animate in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Click outside to close (exclude widget itself and tool menu)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        widgetRef.current &&
        !widgetRef.current.contains(target) &&
        !target.closest('[data-settings-exclude]')
      ) {
        onClose();
      }
    };

    // Small delay to avoid closing on the same click that opened
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose, widgetRef]);

  return createPortal(
    <div
      ref={panelRef}
      className={`font-${globalStyle.fontFamily}`}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: PANEL_WIDTH,
        maxHeight: '80vh',
        zIndex: Z_INDEX.popover,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm font-bold text-slate-800 truncate">
              {widget.customTitle ?? title}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              Settings
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            title="Close settings (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Widget-specific settings */}
          {shouldRenderSettings && settings && (
            <div className="px-5 py-4">{settings}</div>
          )}

          {/* Universal: Transparency */}
          <div className="px-5 pb-4">
            <div className="pt-4 border-t border-slate-100">
              <div className="flex flex-col gap-2 bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Transparency{' '}
                    {widget.transparency === undefined ? '(Global)' : ''}
                  </span>
                  {widget.transparency !== undefined && (
                    <button
                      onClick={() =>
                        updateWidget(widget.id, { transparency: undefined })
                      }
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={transparency}
                    onChange={(e) =>
                      updateWidget(widget.id, {
                        transparency: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1 accent-indigo-600 h-1.5"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500 w-10 text-right">
                    {Math.round(transparency * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
