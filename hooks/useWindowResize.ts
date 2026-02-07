import React from 'react';
import { WidgetData } from '../types';

export const useWindowResize = (
  widget: WidgetData,
  updateWidget: (id: string, updates: Partial<WidgetData>) => void,
  isMaximized: boolean,
  setIsResizing: (isResizing: boolean) => void
) => {
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

      updateWidget(widget.id, {
        w: newW,
        h: newH,
        x: newX,
        y: newY,
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;

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

  return { handleResizeStart };
};
