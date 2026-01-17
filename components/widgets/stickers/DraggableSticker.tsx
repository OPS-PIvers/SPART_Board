import React, { useState, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
  RotateCw,
  Maximize2,
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
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const nodeRef = useRef<HTMLDivElement>(null);

  useClickOutside(nodeRef, () => {
    if (!isDragging) {
      setIsSelected(false);
      setIsEditing(false);
    }
  });

  const config = widget.config as StickerConfig;
  const rotation = config.rotation ?? 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking menu or handles, don't drag
    if ((e.target as HTMLElement).closest('.sticker-control') || isEditing) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setIsSelected(true);
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
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    const startW = widget.w;
    const startH = widget.h;

    const onMouseMove = (ev: MouseEvent) => {
      const currentDist = Math.hypot(
        ev.clientX - centerX,
        ev.clientY - centerY
      );
      const scale = currentDist / startDist;
      updateWidget(widget.id, {
        w: Math.max(50, startW * scale),
        h: Math.max(50, startH * scale),
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
        cursor: isEditing ? 'default' : 'move',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full relative">
        {children}

        {/* Selected Overlay/Border */}
        {(isSelected || isEditing) && (
          <div className="absolute inset-0 border-2 border-blue-400/50 rounded-lg pointer-events-none" />
        )}

        {/* Menu */}
        {isSelected && !isDragging && !isEditing && (
          <div
            className="sticker-control absolute -top-14 left-1/2 -translate-x-1/2 flex gap-1 bg-white/90 backdrop-blur-xl shadow-xl rounded-full p-1.5 z-[9999]"
            style={{ transform: `rotate(${-rotation}deg)` }} // Counter-rotate menu
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => moveWidgetLayer(widget.id, 'up')}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-700"
              title="Move Up Layer"
            >
              <ArrowUp size={16} />
            </button>
            <button
              onClick={() => moveWidgetLayer(widget.id, 'down')}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-700"
              title="Move Down Layer"
            >
              <ArrowDown size={16} />
            </button>
            <div className="w-px bg-slate-200 mx-1" />
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-full"
              title="Resize & Rotate"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => removeWidget(widget.id)}
              className="p-1.5 hover:bg-red-50 text-red-500 rounded-full"
              title="Remove"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Edit Controls */}
        {isEditing && (
          <>
            {/* Close Edit Mode */}
            <div
              className="sticker-control absolute -top-14 left-1/2 -translate-x-1/2"
              style={{ transform: `rotate(${-rotation}deg)` }}
            >
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 bg-white/90 backdrop-blur shadow rounded-full hover:bg-slate-100 text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

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

            {/* Resize Handles (Corners) */}
            <div
              className="sticker-control absolute -bottom-3 -right-3 cursor-nwse-resize p-1.5 bg-white shadow rounded-full text-blue-600 border border-blue-100"
              onMouseDown={handleResizeStart}
            >
              <Maximize2 size={14} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
