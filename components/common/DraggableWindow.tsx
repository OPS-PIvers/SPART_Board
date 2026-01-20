import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  Minus,
  Pencil,
  Camera,
  Maximize,
  Minimize2,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { WidgetData, WidgetType, DEFAULT_GLOBAL_STYLE } from '@/types';
import { useDashboard } from '@/context/useDashboard';
import { useScreenshot } from '@/hooks/useScreenshot';
import { GlassCard } from './GlassCard';
import { useClickOutside } from '@/hooks/useClickOutside';

import { Z_INDEX } from '../../config/zIndex';

// Widgets that cannot be snapshotted due to CORS/Technical limitations
const SCREENSHOT_BLACKLIST: WidgetType[] = ['webcam', 'embed'];

interface DraggableWindowProps {
  widget: WidgetData;
  children: React.ReactNode;
  settings: React.ReactNode;
  title: string;
  style?: React.CSSProperties; // Added style prop
  skipCloseConfirmation?: boolean;
  headerActions?: React.ReactNode;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  widget,
  children,
  settings,
  title,
  style,
  skipCloseConfirmation = false,
  headerActions,
}) => {
  const {
    updateWidget,
    removeWidget,
    duplicateWidget,
    bringToFront,
    addToast,
    activeDashboard,
  } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;

  const [isDragging, setIsDragging] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(widget.customTitle ?? title);
  const windowRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dragDistanceRef = useRef(0);

  useClickOutside(menuRef, () => setShowTools(false), [windowRef]);

  // Ref specifically for the inner content we want to capture
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-generate filename: "Classroom-[WidgetType]-[Date]"
  // Use ISO format YYYY-MM-DD
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Classroom-${widget.type.charAt(0).toUpperCase() + widget.type.slice(1)}-${dateStr}`;

  const handleScreenshotSuccess = useCallback(() => {
    addToast('Screenshot saved', 'success');
  }, [addToast]);

  const handleScreenshotError = useCallback(
    (err: unknown) => {
      console.error('Screenshot error:', err);
      addToast('Failed to save screenshot', 'error');
    },
    [addToast]
  );

  const { takeScreenshot, isFlashing, isCapturing } = useScreenshot(
    contentRef,
    fileName,
    {
      onSuccess: handleScreenshotSuccess,
      onError: handleScreenshotError,
    }
  );

  const canScreenshot = !SCREENSHOT_BLACKLIST.includes(widget.type);
  const isMaximized = widget.maximized ?? false;

  const handleMouseDown = (_e: React.MouseEvent) => {
    bringToFront(widget.id);
  };

  const handleMaximizeToggle = () => {
    const newMaximized = !isMaximized;
    updateWidget(widget.id, { maximized: newMaximized });
    if (newMaximized) {
      bringToFront(widget.id);
    }
  };

  const saveTitle = () => {
    if (tempTitle.trim()) {
      updateWidget(widget.id, { customTitle: tempTitle.trim() });
    } else {
      // If empty, revert to default (remove custom title)
      updateWidget(widget.id, { customTitle: null });
      setTempTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;

    // Don't drag if clicking interactive elements or resize handle
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(
      'button, input, textarea, select, canvas, [role="button"], .resize-handle, [draggable="true"], [data-no-drag="true"]'
    );
    if (isInteractive) return;

    setIsDragging(true);
    document.body.classList.add('is-dragging-widget');
    const startX = e.clientX - widget.x;
    const startY = e.clientY - widget.y;
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      dragDistanceRef.current = Math.sqrt(
        Math.pow(moveEvent.clientX - initialMouseX, 2) +
          Math.pow(moveEvent.clientY - initialMouseY, 2)
      );

      updateWidget(widget.id, {
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('is-dragging-widget');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.stopPropagation();
    setIsResizing(true);
    document.body.classList.add('is-dragging-widget');
    const startW = widget.w;
    const startH = widget.h;
    const startX = e.clientX;
    const startY = e.clientY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      updateWidget(widget.id, {
        w: Math.max(150, startW + (moveEvent.clientX - startX)),
        h: Math.max(100, startH + (moveEvent.clientY - startY)),
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('is-dragging-widget');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const transparency = widget.transparency ?? globalStyle.windowTransparency;

  const handleWidgetClick = (e: React.MouseEvent) => {
    // Avoid triggering when clicking interactive elements
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(
      'button, input, textarea, select, canvas, [role="button"]'
    );
    if (isInteractive) return;

    // Only toggle tools if it wasn't a drag (less than 5px movement)
    if (!isEditingTitle && dragDistanceRef.current < 5) {
      setShowTools(!showTools);
    }
    dragDistanceRef.current = 0;
  };

  // TOOL MENU POSITIONING
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (showTools && windowRef.current) {
      const updatePosition = () => {
        const rect = windowRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (isMaximized) {
          setMenuStyle({
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: Z_INDEX.toolMenu,
          });
          return;
        }

        const spaceAbove = rect.top;
        const menuHeight = 56; // approximate height including spacing
        const shouldShowBelow = spaceAbove < menuHeight + 20;

        setMenuStyle({
          position: 'fixed',
          top: shouldShowBelow ? rect.bottom + 12 : rect.top - 56,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)',
          zIndex: Z_INDEX.toolMenu,
        });
      };

      updatePosition();
      // Update on scroll or resize just in case, though widgets are absolute
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
    return undefined;
  }, [showTools, widget.x, widget.y, widget.w, widget.h, isMaximized]);

  return (
    <>
      <GlassCard
        ref={windowRef}
        onMouseDown={handleMouseDown}
        onClick={handleWidgetClick}
        transparency={transparency}
        cornerRadius={isMaximized ? 'none' : undefined}
        className={`absolute select-none widget group will-change-transform ${
          isMaximized ? 'border-none !shadow-none' : ''
        } ${isDragging ? 'shadow-2xl ring-2 ring-blue-400/50' : ''}`}
        style={{
          left: isMaximized ? 0 : widget.x,
          top: isMaximized ? 0 : widget.y,
          width: isMaximized ? '100vw' : widget.w,
          height: isMaximized ? '100vh' : widget.h,
          zIndex: isMaximized ? Z_INDEX.maximized : widget.z,
          display: 'flex',
          flexDirection: 'column',
          opacity: widget.minimized ? 0 : 1,
          pointerEvents: widget.minimized ? 'none' : 'auto',
          ...style, // Merge custom styles
        }}
      >
        <div className="flip-container h-full rounded-[inherit] overflow-hidden">
          <div
            className={`flipper h-full ${widget.flipped ? 'flip-active' : ''}`}
          >
            {/* Front Face */}
            <div
              className="front absolute inset-0 w-full h-full flex flex-col"
              style={{
                pointerEvents: widget.flipped ? 'none' : 'auto',
              }}
              onMouseDown={handleDragStart}
            >
              {showConfirm && (
                <div
                  className="absolute inset-0 z-confirm-overlay bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200 backdrop-blur-sm rounded-[inherit]"
                  role="alertdialog"
                  aria-labelledby={`dialog-title-${widget.id}`}
                  aria-describedby={`dialog-desc-${widget.id}`}
                >
                  <p
                    id={`dialog-title-${widget.id}`}
                    className="text-white font-semibold mb-4 text-sm"
                  >
                    Close widget? Data will be lost.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirm(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWidget(widget.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <div
                ref={contentRef}
                className="flex-1 overflow-auto relative p-2"
              >
                {/* Flash Overlay */}
                {isFlashing && (
                  <div
                    data-screenshot="flash"
                    className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300 pointer-events-none isFlashing"
                  />
                )}
                {children}
              </div>
              <div
                onMouseDown={handleResizeStart}
                className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5"
              >
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-300 rounded-br-[2px]" />
              </div>
            </div>

            {/* Back Face (Settings) */}
            <div
              className="back absolute inset-0 w-full h-full rounded-3xl overflow-hidden flex flex-col bg-white/60 backdrop-blur-xl"
              style={{ pointerEvents: widget.flipped ? 'auto' : 'none' }}
            >
              <div className="flex items-center justify-between px-3 py-2 bg-white/50 border-b border-white/30">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Settings
                </span>
                <button
                  onClick={() => updateWidget(widget.id, { flipped: false })}
                  className="p-1 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1 text-[10px] font-bold px-2"
                >
                  DONE
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="mb-4 flex items-center gap-3 bg-white/40 px-3 py-2 rounded-xl border border-white/20">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Transparency
                  </span>
                  <div className="flex-1 flex items-center gap-2">
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
                    <span className="text-[10px] font-mono font-bold text-slate-600 w-8 text-right">
                      {Math.round(transparency * 100)}%
                    </span>
                  </div>
                </div>

                {settings && (
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Widget Options
                    </h4>
                    {settings}
                  </div>
                )}
              </div>
              <div
                onMouseDown={handleResizeStart}
                className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5"
              >
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 rounded-br-[2px]" />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* TOOL MENU PORTAL */}
      {showTools &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className={`flex items-center gap-1.5 p-1.5 bg-white/40 backdrop-blur-xl rounded-full border border-white/50 shadow-2xl font-${globalStyle.fontFamily}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center min-w-0 px-2">
              {isEditingTitle ? (
                <input
                  autoFocus
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') {
                      setTempTitle(widget.customTitle ?? title);
                      setIsEditingTitle(false);
                    }
                    e.stopPropagation();
                  }}
                  className="text-[10px] font-bold text-slate-800 bg-white/50 border border-white/50 rounded-full px-3 py-1 outline-none w-32 shadow-sm"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <div
                    className="flex items-center gap-2 group/title cursor-text px-2"
                    onClick={() => {
                      setTempTitle(widget.customTitle ?? title);
                      setIsEditingTitle(true);
                    }}
                  >
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider truncate max-w-[100px]">
                      {widget.customTitle ?? title}
                    </span>
                    <Pencil className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center -mr-1">
                    <button
                      onClick={() => {
                        updateWidget(widget.id, { flipped: true });
                        setShowTools(false);
                      }}
                      className="p-1 hover:bg-slate-800/10 rounded-full text-slate-600 transition-all"
                      title="Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
                      className={`p-1 hover:bg-slate-800/10 rounded-full text-slate-600 transition-all ${
                        isToolbarExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out ${
                isToolbarExpanded
                  ? 'max-w-[500px] opacity-100 ml-0'
                  : 'max-w-0 opacity-0 ml-0'
              }`}
            >
              <div className="h-4 w-px bg-slate-300/50" />

              <div className="flex items-center gap-1">
                {headerActions && (
                  <div className="flex items-center text-slate-700">
                    {headerActions}
                  </div>
                )}
                {canScreenshot && (
                  <button
                    onClick={takeScreenshot}
                    disabled={isCapturing}
                    className="p-1.5 hover:bg-slate-800/10 rounded-full text-slate-600 transition-all disabled:opacity-50"
                    title="Take Screenshot"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => duplicateWidget(widget.id)}
                  className="p-1.5 hover:bg-slate-800/10 rounded-full text-slate-600 transition-all"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleMaximizeToggle}
                  className="p-1.5 hover:bg-slate-800/10 rounded-full text-slate-600 transition-all"
                  title={isMaximized ? 'Restore' : 'Maximize'}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => updateWidget(widget.id, { minimized: true })}
                  className="p-1.5 hover:bg-slate-800/10 rounded-full text-slate-600 transition-all"
                  title="Minimize"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (skipCloseConfirmation) {
                      removeWidget(widget.id);
                    } else {
                      setShowConfirm(true);
                      setShowTools(false);
                    }
                  }}
                  className="p-1.5 hover:bg-red-500/20 text-red-600 rounded-full transition-all"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
