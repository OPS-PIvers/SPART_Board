import React, { useState, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
  RotateCw,
  Layers,
  Check,
  Trash2,
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
  const [showLayerControls, setShowLayerControls] = useState(false);

  const nodeRef = useRef<HTMLDivElement>(null);

  useClickOutside(nodeRef, () => {
    if (!isDragging) {
      setIsSelected(false);
      setIsEditing(false);
      setShowLayerControls(false);
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
    // Reset layer controls if selecting a different widget (though this component unmounts/remounts usually)
    // or if just clicking to focus.
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
        cursor: isEditing ? 'default' : 'move',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full relative">
        {children}

        {/* Selected Overlay/Border */}
        {(isSelected || isEditing) && (
          <div
            className={`absolute inset-0 border-2 rounded-lg pointer-events-none ${isEditing ? 'border-dashed border-blue-400' : 'border-blue-400/50'}`}
          />
        )}

        {/* Menu */}
        {isSelected && !isDragging && (
          <div
            className="sticker-control absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-xl shadow-xl rounded-full p-1.5 z-[9999]"
            style={{ transform: `rotate(${-rotation}deg)` }} // Counter-rotate menu
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                title="Done Editing"
              >
                <Check size={16} />
              </button>
            ) : (
              <>
                {/* Resize / Rotate */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-full"
                  title="Resize / Rotate"
                >
                  <RefreshCw size={16} />
                </button>

                <div className="w-px bg-slate-200 mx-1" />

                {/* Layer Controls */}
                {showLayerControls ? (
                  <>
                    <button
                      onClick={() => moveWidgetLayer(widget.id, 'up')}
                      className="p-1.5 hover:bg-slate-100 rounded-full text-slate-700"
                      title="Move Forward"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => moveWidgetLayer(widget.id, 'down')}
                      className="p-1.5 hover:bg-slate-100 rounded-full text-slate-700"
                      title="Move Backward"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => setShowLayerControls(false)}
                      className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowLayerControls(true)}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-700"
                    title="Layers"
                  >
                    <Layers size={16} />
                  </button>
                )}

                <div className="w-px bg-slate-200 mx-1" />

                {/* Delete */}
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-full"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Edit Controls */}
        {isEditing && (
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
              className="sticker-control absolute -bottom-0 -right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-0.5"
              onMouseDown={handleResizeStart}
            >
              <div className="w-3 h-3 border-r-2 border-b-2 border-blue-500 bg-white/50 rounded-br-[2px]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
