import React, { useState, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  RotateCw,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { WidgetData, StickerConfig } from '@/types';
import { useDashboard } from '@/context/useDashboard';
import { useClickOutside } from '@/hooks/useClickOutside';

interface DraggableStickerProps {
  widget: WidgetData;
  children: React.ReactNode;
}

export const DraggableSticker: React.FC<DraggableStickerProps> = ({
  widget,
  children,
}) => {
  const { updateWidget, removeWidget, bringToFront, moveWidgetLayer } =
    useDashboard();
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const nodeRef = useRef<HTMLDivElement>(null);

  useClickOutside(nodeRef, () => {
    if (!isDragging) {
      setIsSelected(false);
      setShowMenu(false);
    }
  });

  const config = widget.config as StickerConfig;
  const rotation = config.rotation ?? 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking menu or handles, don't drag
    if ((e.target as HTMLElement).closest('.sticker-control')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setIsSelected(true);
    // Select and bring this sticker to the front on click or drag start.
    bringToFront(widget.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = widget.x;
    const origY = widget.y;
    let hasMoved = false;

    const onMouseMove = (ev: MouseEvent) => {
      hasMoved = true;
      setIsDragging(true);
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      updateWidget(widget.id, { x: origX + dx, y: origY + dy });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (!hasMoved) {
        // Just a click
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (ev: MouseEvent) => {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
      const deg = angle * (180 / Math.PI) + 90;
      updateWidget(widget.id, {
        config: { ...config, rotation: deg },
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startW = widget.w;
    const startH = widget.h;
    const startX = e.clientX;
    const startY = e.clientY;

    // Rotation in radians
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      // Project screen delta onto local axes
      // For 0 deg (cos=1, sin=0): localDx = dx, localDy = dy.
      // For 90 deg (cos=0, sin=1): localDx = dy, localDy = -dx.

      const localDx = dx * cos + dy * sin;
      const localDy = -dx * sin + dy * cos;

      updateWidget(widget.id, {
        w: Math.max(50, startW + localDx),
        h: Math.max(50, startH + localDy),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={nodeRef}
      className="absolute group select-none"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
        zIndex: widget.z,
        transform: `rotate(${rotation}deg)`,
        cursor: 'move',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full relative">
        {children}

        {/* Selected Overlay/Border */}
        {isSelected && (
          <div className="absolute inset-0 border-2 rounded-lg pointer-events-none border-blue-400/50" />
        )}

        {/* Handles & Menu */}
        {isSelected && !isDragging && (
          <>
            {/* Rotate Handle */}
            <div
              className="sticker-control absolute -top-8 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
              onMouseDown={handleRotateStart}
            >
              <div className="p-1.5 bg-white shadow rounded-full text-blue-600 border border-blue-100">
                <RotateCw size={14} />
              </div>
              <div className="h-4 w-0.5 bg-blue-400 mx-auto" />
            </div>

            {/* Resize Handle (Corner) */}
            <div
              className="sticker-control absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-0.5"
              onMouseDown={handleResizeStart}
            >
              <div className="w-3 h-3 border-r-2 border-b-2 border-blue-500 bg-white/50 rounded-br-[2px]" />
            </div>

            {/* Menu Button (Top Right) */}
            <div
              className="sticker-control absolute -top-3 -right-3 z-[9999]"
              style={{ transform: `rotate(${-rotation}deg)` }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 shadow-md border border-slate-100 rounded-full transition-colors"
                  title="Sticker Options"
                >
                  <MoreVertical size={16} />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                      Layers
                    </div>
                    <button
                      onClick={() => {
                        moveWidgetLayer(widget.id, 'up');
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                    >
                      <ArrowUp size={14} />
                      Bring Forward
                    </button>
                    <button
                      onClick={() => {
                        moveWidgetLayer(widget.id, 'down');
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                    >
                      <ArrowDown size={14} />
                      Send Backward
                    </button>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
