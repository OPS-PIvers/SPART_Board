import React from 'react';
import { WidgetData } from '../types';

export const useWindowDrag = (
  widget: WidgetData,
  updateWidget: (id: string, updates: Partial<WidgetData>) => void,
  isMaximized: boolean,
  isAnnotating: boolean,
  setIsDragging: (isDragging: boolean) => void,
  dragDistanceRef: React.MutableRefObject<number>,
  dragBlockingSelector: string
) => {
  const handleDragStart = (e: React.PointerEvent) => {
    if (isMaximized) return;

    // Don't drag if clicking interactive elements or resize handle
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(dragBlockingSelector);
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

    const onPointerMove = (moveEvent: PointerEvent) => {
      // Only process the same pointer that started the drag
      if (moveEvent.pointerId !== e.pointerId) return;

      dragDistanceRef.current = Math.sqrt(
        Math.pow(moveEvent.clientX - initialMouseX, 2) +
          Math.pow(moveEvent.clientY - initialMouseY, 2)
      );

      updateWidget(widget.id, {
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;

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

  return { handleDragStart };
};
