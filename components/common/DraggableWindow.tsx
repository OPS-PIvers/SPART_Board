import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Settings,
  Move,
  Minus,
  Pencil,
  Camera,
  Maximize,
  Minimize2,
} from 'lucide-react';
import { WidgetData, WidgetType } from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { useScreenshot } from '../../hooks/useScreenshot';

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
  const { updateWidget, removeWidget, bringToFront, addToast } = useDashboard();
  const [isDragging, setIsDragging] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(widget.customTitle ?? title);
  const windowRef = useRef<HTMLDivElement>(null);

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
      updateWidget(widget.id, { customTitle: undefined });
      setTempTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    setIsDragging(true);
    document.body.classList.add('is-dragging-widget');
    const startX = e.clientX - widget.x;
    const startY = e.clientY - widget.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
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

  return (
    <div
      ref={windowRef}
      onMouseDown={handleMouseDown}
      className={`absolute select-none widget group rounded-xl bg-white/95 backdrop-blur-md border border-white/50 shadow-xl overflow-hidden transition-shadow ${isDragging ? 'shadow-2xl ring-2 ring-blue-400/50' : ''}`}
      style={{
        left: isMaximized ? '1.5rem' : widget.x,
        top: isMaximized ? '4.5rem' : widget.y,
        width: isMaximized ? 'calc(100vw - 3rem)' : widget.w,
        height: isMaximized ? 'calc(100vh - 9rem)' : widget.h,
        zIndex: widget.z,
        display: 'flex',
        opacity: widget.minimized ? 0 : 1,
        pointerEvents: widget.minimized ? 'none' : 'auto',
        ...style, // Merge custom styles
      }}
    >
      <div className="flip-container">
        <div className={`flipper ${widget.flipped ? 'flip-active' : ''}`}>
          {/* Front Face */}
          <div
            className="front relative"
            style={{ pointerEvents: widget.flipped ? 'none' : 'auto' }}
          >
            {showConfirm && (
              <div
                className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200"
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
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            <div
              onMouseDown={handleDragStart}
              className={`flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 ${isMaximized ? '' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                <Move className="w-3 h-3 text-slate-400 flex-shrink-0" />
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
                      e.stopPropagation(); // Prevent triggering other listeners
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                    className="text-xs font-semibold text-slate-600 bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none w-full shadow-sm"
                    aria-label="Edit widget title"
                  />
                ) : (
                  <div
                    className="flex items-center gap-2 group/title cursor-text min-w-0 overflow-hidden"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent drag start
                      setTempTitle(widget.customTitle ?? title);
                      setIsEditingTitle(true);
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Allow click without drag
                  >
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider truncate">
                      {widget.customTitle ?? title}
                    </span>
                    <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* NEW HEADER ACTIONS */}
                {headerActions && <div className="mr-2">{headerActions}</div>}
                {canScreenshot && (
                  <button
                    onClick={takeScreenshot}
                    disabled={isCapturing}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                    title="Take Screenshot"
                    aria-label="Take screenshot"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleMaximizeToggle}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
                  title={isMaximized ? 'Restore' : 'Maximize'}
                  aria-label={
                    isMaximized ? 'Restore widget' : 'Maximize widget'
                  }
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => updateWidget(widget.id, { minimized: true })}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
                  aria-label="Minimize widget"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateWidget(widget.id, { flipped: true })}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (skipCloseConfirmation) {
                      removeWidget(widget.id);
                    } else {
                      setShowConfirm(true);
                    }
                  }}
                  className="p-1 hover:bg-red-100 hover:text-red-600 rounded-md text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div ref={contentRef} className="flex-1 overflow-auto relative p-2">
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
            className="back rounded-xl overflow-hidden relative"
            style={{ pointerEvents: widget.flipped ? 'auto' : 'none' }}
          >
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
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
            <div className="flex-1 p-4 overflow-y-auto">{settings}</div>
            <div
              onMouseDown={handleResizeStart}
              className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5"
            >
              <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 rounded-br-[2px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
