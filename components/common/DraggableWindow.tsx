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
  Eraser,
  Undo2,
  Trash2,
  Highlighter,
} from 'lucide-react';
import { WidgetData, WidgetType, GlobalStyle, Path } from '@/types';
import { useScreenshot } from '@/hooks/useScreenshot';
import { GlassCard } from './GlassCard';
import { useClickOutside } from '@/hooks/useClickOutside';
import { AnnotationCanvas } from './AnnotationCanvas';
import { WIDGET_PALETTE } from '@/config/colors';
import { Z_INDEX } from '../../config/zIndex';
import { UI_CONSTANTS } from '../../config/layout';

// Widgets that cannot be snapshotted due to CORS/Technical limitations
const SCREENSHOT_BLACKLIST: WidgetType[] = ['webcam', 'embed'];

const INTERACTIVE_ELEMENTS_SELECTOR =
  'button, input, textarea, select, canvas, iframe, label, a, summary, [role="button"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="switch"], .cursor-pointer, [contenteditable="true"]';

const DRAG_BLOCKING_SELECTOR = `${INTERACTIVE_ELEMENTS_SELECTOR}, .resize-handle, [draggable="true"], [data-no-drag="true"]`;

// Widgets that need continuous state updates for internal logic (e.g. specialized positioning)
const POSITION_AWARE_WIDGETS: WidgetType[] = [
  'catalyst',
  'catalyst-instruction',
  'catalyst-visual',
];

interface DraggableWindowProps {
  widget: WidgetData;
  children: React.ReactNode;
  settings: React.ReactNode;
  title: string;
  style?: React.CSSProperties; // Added style prop
  skipCloseConfirmation?: boolean;
  headerActions?: React.ReactNode;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  removeWidget: (id: string) => void;
  duplicateWidget: (id: string) => void;
  bringToFront: (id: string) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  globalStyle: GlobalStyle;
}

const ResizeHandleIcon = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M8 2L2 8" stroke="currentColor" strokeLinecap="round" />
    <path d="M8 5.5L5.5 8" stroke="currentColor" strokeLinecap="round" />
    <path d="M8 9L9 8" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  widget,
  children,
  settings,
  title,
  style,
  skipCloseConfirmation = false,
  headerActions,
  updateWidget,
  removeWidget,
  duplicateWidget,
  bringToFront,
  addToast,
  globalStyle,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(widget.customTitle ?? title);
  const [shouldRenderSettings, setShouldRenderSettings] = useState(
    widget.flipped
  );
  const [isAnimating, setIsAnimating] = useState(false);

  // OPTIMIZATION: Lazy initialization of settings
  // We only set this to true once the widget is flipped for the first time.
  // This prevents downloading and rendering the settings chunk for every widget on load.
  useEffect(() => {
    if (widget.flipped && !shouldRenderSettings) {
      setShouldRenderSettings(true);
    }
    // Set animating when flipped changes
    setIsAnimating(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.flipped]);

  // Annotation state
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationColor, setAnnotationColor] = useState(
    widget.annotation?.color ?? WIDGET_PALETTE[0]
  );
  const [annotationWidth, _setAnnotationWidth] = useState(
    widget.annotation?.width ?? 4
  );

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

  const isMaximized = widget.maximized ?? false;
  const canScreenshot = !SCREENSHOT_BLACKLIST.includes(widget.type);

  const handlePointerDown = (_e: React.PointerEvent) => {
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

  const handleDragStart = (e: React.PointerEvent) => {
    if (isMaximized) return;

    // Don't drag if clicking interactive elements or resize handle
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(DRAG_BLOCKING_SELECTOR);
    if (isInteractive) return;

    // Don't drag if annotating
    if (isAnnotating) return;

    // Prevent default browser behavior (like scroll or selection)
    e.preventDefault();

    setIsDragging(true);
    document.body.classList.add('is-dragging-widget');
    const startX = e.clientX - widget.x;
    const startY = e.clientY - widget.y;
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;

    // Use pointer capture to ensure we get events even if pointer leaves the element
    const targetElement = e.currentTarget as HTMLElement;
    try {
      targetElement.setPointerCapture(e.pointerId);
    } catch (_err) {
      console.warn('Failed to set pointer capture:', _err);
    }

    const isPositionAware = POSITION_AWARE_WIDGETS.includes(widget.type);

    const onPointerMove = (moveEvent: PointerEvent) => {
      // Only process the same pointer that started the drag
      if (moveEvent.pointerId !== e.pointerId) return;

      dragDistanceRef.current = Math.sqrt(
        Math.pow(moveEvent.clientX - initialMouseX, 2) +
          Math.pow(moveEvent.clientY - initialMouseY, 2)
      );

      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;

      if (isPositionAware) {
        updateWidget(widget.id, {
          x: newX,
          y: newY,
        });
      } else if (windowRef.current) {
        // OPTIMIZATION: Update DOM directly to avoid re-renders during drag
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;

      if (!isPositionAware) {
        const finalX = upEvent.clientX - startX;
        const finalY = upEvent.clientY - startY;
        updateWidget(widget.id, {
          x: finalX,
          y: finalY,
        });
      }

      setIsDragging(false);
      document.body.classList.remove('is-dragging-widget');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      try {
        if (targetElement.hasPointerCapture(e.pointerId)) {
          targetElement.releasePointerCapture(e.pointerId);
        }
      } catch (_err) {
        // Ignore capture release errors
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handleResizeStart = (e: React.PointerEvent, direction: string) => {
    if (isMaximized) return;
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    document.body.classList.add('is-dragging-widget');
    const startW = widget.w;
    const startH = widget.h;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = widget.x;
    const startPosY = widget.y;

    const targetElement = e.currentTarget as HTMLElement;
    try {
      targetElement.setPointerCapture(e.pointerId);
    } catch (_err) {
      console.warn('Failed to set pointer capture:', _err);
    }

    const isPositionAware = POSITION_AWARE_WIDGETS.includes(widget.type);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newW = startW;
      let newH = startH;
      let newX = startPosX;
      let newY = startPosY;

      if (direction.includes('e')) {
        newW = Math.max(150, startW + dx);
      }
      if (direction.includes('w')) {
        const potentialW = startW - dx;
        if (potentialW >= 150) {
          newW = potentialW;
          newX = startPosX + dx;
        }
      }
      if (direction.includes('s')) {
        newH = Math.max(100, startH + dy);
      }
      if (direction.includes('n')) {
        const potentialH = startH - dy;
        if (potentialH >= 100) {
          newH = potentialH;
          newY = startPosY + dy;
        }
      }

      if (isPositionAware) {
        updateWidget(widget.id, {
          w: newW,
          h: newH,
          x: newX,
          y: newY,
        });
      } else if (windowRef.current) {
        // OPTIMIZATION: Update DOM directly
        windowRef.current.style.width = `${newW}px`;
        windowRef.current.style.height = `${newH}px`;
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;

      if (!isPositionAware) {
        // Recalculate final dimensions/position for state update
        // We replicate the logic here to ensure state matches visual
        const dx = upEvent.clientX - startX;
        const dy = upEvent.clientY - startY;

        let newW = startW;
        let newH = startH;
        let newX = startPosX;
        let newY = startPosY;

        if (direction.includes('e')) {
          newW = Math.max(150, startW + dx);
        }
        if (direction.includes('w')) {
          const potentialW = startW - dx;
          if (potentialW >= 150) {
            newW = potentialW;
            newX = startPosX + dx;
          }
        }
        if (direction.includes('s')) {
          newH = Math.max(100, startH + dy);
        }
        if (direction.includes('n')) {
          const potentialH = startH - dy;
          if (potentialH >= 100) {
            newH = potentialH;
            newY = startPosY + dy;
          }
        }

        updateWidget(widget.id, {
          w: newW,
          h: newH,
          x: newX,
          y: newY,
        });
      }

      setIsResizing(false);
      document.body.classList.remove('is-dragging-widget');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      try {
        if (targetElement.hasPointerCapture(e.pointerId)) {
          targetElement.releasePointerCapture(e.pointerId);
        }
      } catch (_err) {
        // Ignore capture release errors
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const transparency = widget.transparency ?? globalStyle.windowTransparency;
  const isSelected = !isMaximized && (showTools || isDragging || isResizing);

  const handleWidgetClick = (e: React.MouseEvent) => {
    // Avoid triggering when clicking interactive elements
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(INTERACTIVE_ELEMENTS_SELECTOR);
    if (isInteractive) return;

    // Only toggle tools if it wasn't a drag (less than 15px movement)
    if (!isEditingTitle && dragDistanceRef.current < 15) {
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

  useEffect(() => {
    const handleEscapePress = (e: Event) => {
      const customEvent = e as CustomEvent<{ widgetId: string }>;
      if (customEvent.detail?.widgetId !== widget.id) return;

      if (showConfirm) {
        setShowConfirm(false);
      } else if (widget.flipped) {
        updateWidget(widget.id, { flipped: false });
      } else {
        if (skipCloseConfirmation) {
          removeWidget(widget.id);
        } else {
          setShowConfirm(true);
          setShowTools(false);
        }
      }
    };

    window.addEventListener('widget-escape-press', handleEscapePress);
    return () =>
      window.removeEventListener('widget-escape-press', handleEscapePress);
  }, [
    widget.id,
    widget.flipped,
    showConfirm,
    skipCloseConfirmation,
    removeWidget,
    updateWidget,
  ]);

  return (
    <>
      <GlassCard
        globalStyle={globalStyle}
        ref={windowRef}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onClick={handleWidgetClick}
        transparency={transparency}
        allowInvisible={true}
        disableBlur={isAnimating}
        selected={isSelected}
        cornerRadius={isMaximized ? 'none' : undefined}
        className={`absolute select-none widget group will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
          isMaximized ? 'border-none !shadow-none' : ''
        } `}
        style={{
          left: isMaximized ? 0 : widget.x,
          top: isMaximized ? 0 : widget.y,
          width: isMaximized ? '100vw' : widget.w,
          height: isMaximized ? '100vh' : widget.h,
          zIndex: isMaximized ? Z_INDEX.maximized : widget.z,
          display: 'flex',
          flexDirection: 'column',
          containerType: 'size',
          opacity: widget.minimized ? 0 : 1,
          pointerEvents: widget.minimized ? 'none' : 'auto',
          touchAction: 'none', // Critical for preventing scroll interference
          ...style, // Merge custom styles
        }}
      >
        <div className="flip-container h-full rounded-[inherit] overflow-hidden">
          <div
            className={`flipper h-full ${widget.flipped ? 'flip-active' : ''}`}
            onTransitionEnd={() => setIsAnimating(false)}
          >
            {/* Front Face */}
            <div
              className="front absolute inset-0 w-full h-full flex flex-col"
              onPointerDown={handleDragStart}
              style={{
                pointerEvents: widget.flipped ? 'none' : 'auto',
                touchAction: 'none',
              }}
            >
              {/* Universal Drag Handle */}
              <div
                className="w-full flex-shrink-0 flex items-center px-3 cursor-move group/drag-handle hover:bg-slate-400/5 transition-colors"
                style={{ height: UI_CONSTANTS.WIDGET_HEADER_HEIGHT }}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover/drag-handle:opacity-100 transition-opacity truncate pointer-events-none">
                  {widget.customTitle ?? title}
                </span>
              </div>

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
                className="flex-1 overflow-hidden relative p-0"
              >
                {/* Flash Overlay */}
                {isFlashing && (
                  <div
                    data-screenshot="flash"
                    className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300 pointer-events-none isFlashing"
                  />
                )}
                {children}

                {isAnnotating && (
                  <>
                    <AnnotationCanvas
                      className="absolute inset-0 z-40 pointer-events-auto"
                      paths={widget.annotation?.paths ?? []}
                      color={annotationColor}
                      width={annotationWidth}
                      canvasWidth={isMaximized ? window.innerWidth : widget.w}
                      canvasHeight={isMaximized ? window.innerHeight : widget.h}
                      onPathsChange={(newPaths: Path[]) => {
                        updateWidget(widget.id, {
                          annotation: {
                            mode: 'window',
                            paths: newPaths,
                            color: annotationColor,
                            width: annotationWidth,
                          },
                        });
                      }}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 bg-white/90 backdrop-blur shadow-lg rounded-full border border-slate-200 animate-in slide-in-from-bottom-2 fade-in duration-200">
                      <div className="flex items-center gap-1 px-1">
                        {WIDGET_PALETTE.slice(0, 5).map((c) => (
                          <button
                            key={c}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnnotationColor(c);
                            }}
                            className={`w-5 h-5 rounded-full border border-slate-100 transition-transform ${annotationColor === c ? 'scale-125 ring-2 ring-slate-400 z-10' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="w-px h-4 bg-slate-300 mx-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnnotationColor('eraser');
                        }}
                        className={`p-1.5 rounded-full transition-colors ${annotationColor === 'eraser' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        title="Eraser"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const paths = widget.annotation?.paths ?? [];
                          if (paths.length > 0) {
                            updateWidget(widget.id, {
                              annotation: {
                                ...widget.annotation,
                                mode: 'window',
                                paths: paths.slice(0, -1),
                              },
                            });
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                        title="Undo"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateWidget(widget.id, {
                            annotation: {
                              mode: 'window',
                              paths: [],
                              color: annotationColor,
                              width: annotationWidth,
                            },
                          });
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Clear All"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-4 bg-slate-300 mx-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAnnotating(false);
                        }}
                        className="px-2 py-0.5 text-xxs font-bold bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                      >
                        DONE
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Resize Handles (Corners Only) */}
              <div
                onPointerDown={(e) => handleResizeStart(e, 'nw')}
                className="resize-handle absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-[60] touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart(e, 'ne')}
                className="resize-handle absolute top-0 right-0 w-6 h-6 cursor-ne-resize z-[60] touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart(e, 'sw')}
                className="resize-handle absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize z-[60] touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart(e, 'se')}
                className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1.5 z-[60] touch-none"
              >
                <ResizeHandleIcon
                  className="text-slate-400"
                  style={{ opacity: isSelected ? 1 : transparency }}
                />
              </div>
            </div>

            {/* Back Face (Settings) */}
            <div
              className="back absolute inset-0 w-full h-full rounded-3xl overflow-hidden flex flex-col bg-white/60 backdrop-blur-xl"
              onPointerDown={handleDragStart}
              style={{ pointerEvents: widget.flipped ? 'auto' : 'none' }}
            >
              <div className="flex items-center justify-between px-3 py-2 bg-white/50 border-b border-white/30 relative z-30">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Settings
                </span>
                <button
                  onClick={() => updateWidget(widget.id, { flipped: false })}
                  className="p-1 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1 text-xxs font-bold px-2"
                >
                  DONE
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {shouldRenderSettings && settings && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Widget Options
                    </h4>
                    {settings}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200">
                  <div className="flex flex-col gap-2 bg-white/40 px-3 py-2 rounded-xl border border-white/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Transparency{' '}
                        {widget.transparency === undefined ? '(Global)' : ''}
                      </span>
                      {widget.transparency !== undefined && (
                        <button
                          onClick={() =>
                            updateWidget(widget.id, { transparency: undefined })
                          }
                          className="text-xxs font-black text-indigo-600 hover:text-indigo-700 uppercase"
                        >
                          Reset to Global
                        </button>
                      )}
                    </div>
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
                      <span className="text-xxs font-mono font-bold text-slate-600 w-8 text-right">
                        {Math.round(transparency * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resize Handles (Settings Face) */}
              <div
                onPointerDown={(e) => handleResizeStart(e, 'nw')}
                className="resize-handle absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-[60] touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart(e, 'ne')}
                className="resize-handle absolute top-0 right-0 w-6 h-6 cursor-ne-resize z-[60] touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart(e, 'sw')}
                className="resize-handle absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize z-[60] touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart(e, 'se')}
                className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1.5 z-[60] touch-none"
              >
                <ResizeHandleIcon
                  className="text-slate-500"
                  style={{ opacity: isSelected ? 1 : transparency }}
                />
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
            onPointerDown={(e) => e.stopPropagation()}
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
                  className="text-xxs font-bold text-slate-800 bg-white/50 border border-white/50 rounded-full px-3 py-1 outline-none w-32 shadow-sm"
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
                    <span className="text-xxs font-bold text-slate-700 uppercase tracking-wider truncate max-w-[100px]">
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
                      onClick={() => {
                        if (skipCloseConfirmation) {
                          removeWidget(widget.id);
                        } else {
                          setShowConfirm(true);
                          setShowTools(false);
                        }
                      }}
                      className="p-1 hover:bg-red-500/20 text-red-600 rounded-full transition-all"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
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
                    onClick={() => void takeScreenshot()}
                    disabled={isCapturing}
                    className="p-1.5 hover:bg-slate-800/10 rounded-full text-slate-600 transition-all disabled:opacity-50"
                    title="Take Screenshot"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsAnnotating(!isAnnotating);
                    setShowTools(false);
                  }}
                  className={`p-1.5 hover:bg-slate-800/10 rounded-full transition-all ${isAnnotating ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`}
                  title="Annotate"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
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
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
