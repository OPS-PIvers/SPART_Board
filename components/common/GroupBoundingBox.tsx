import React, { useRef, useCallback } from 'react';
import { WidgetData } from '@/types';
import { widgetRefRegistry } from './widgetRefRegistry';
import { useDashboard } from '@/context/useDashboard';

interface GroupBoundingBoxProps {
  groupWidgets: WidgetData[];
  zoom: number;
}

const PADDING = 12; // px padding around the bounding box
const HANDLE_SIZE = 44; // minimum touch target size

/** Computes the pixel bounding box of a set of widgets */
function computeBBox(widgets: WidgetData[]) {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const w of widgets) {
    left = Math.min(left, w.x);
    top = Math.min(top, w.y);
    right = Math.max(right, w.x + w.w);
    bottom = Math.max(bottom, w.y + w.h);
  }
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

export const GroupBoundingBox: React.FC<GroupBoundingBoxProps> = ({
  groupWidgets,
  zoom,
}) => {
  const { updateWidgets } = useDashboard();
  const resizeState = useRef<{
    anchorX: number;
    anchorY: number;
    bboxW: number;
    bboxH: number;
    startPointerX: number;
    startPointerY: number;
    widgets: Array<{
      id: string;
      startX: number;
      startY: number;
      startW: number;
      startH: number;
      el: HTMLDivElement | null;
    }>;
  } | null>(null);

  const bbox = computeBBox(groupWidgets);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
      e.stopPropagation();
      e.preventDefault();

      const target = e.currentTarget as HTMLElement;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      // Anchor is the opposite corner of the resize handle
      const currentBbox = computeBBox(groupWidgets);
      let anchorX: number;
      let anchorY: number;
      if (corner === 'se') {
        anchorX = currentBbox.left;
        anchorY = currentBbox.top;
      } else if (corner === 'sw') {
        anchorX = currentBbox.right;
        anchorY = currentBbox.top;
      } else if (corner === 'ne') {
        anchorX = currentBbox.left;
        anchorY = currentBbox.bottom;
      } else {
        anchorX = currentBbox.right;
        anchorY = currentBbox.bottom;
      }

      resizeState.current = {
        anchorX,
        anchorY,
        bboxW: currentBbox.width,
        bboxH: currentBbox.height,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        widgets: groupWidgets.map((w) => ({
          id: w.id,
          startX: w.x,
          startY: w.y,
          startW: w.w,
          startH: w.h,
          el: widgetRefRegistry.get(w.id) ?? null,
        })),
      };

      document.body.classList.add('is-dragging-widget');

      let animFrame: number | null = null;

      const onMove = (me: PointerEvent) => {
        if (me.pointerId !== e.pointerId) return;
        if (animFrame !== null) cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(() => {
          const rs = resizeState.current;
          if (!rs) return;

          const dx = (me.clientX - rs.startPointerX) / zoom;
          const dy = (me.clientY - rs.startPointerY) / zoom;

          // Uniform scale: use the diagonal ratio
          let scaleX = 1;
          let scaleY = 1;
          if (corner === 'se') {
            scaleX = (rs.bboxW + dx) / rs.bboxW;
            scaleY = (rs.bboxH + dy) / rs.bboxH;
          } else if (corner === 'sw') {
            scaleX = (rs.bboxW - dx) / rs.bboxW;
            scaleY = (rs.bboxH + dy) / rs.bboxH;
          } else if (corner === 'ne') {
            scaleX = (rs.bboxW + dx) / rs.bboxW;
            scaleY = (rs.bboxH - dy) / rs.bboxH;
          } else {
            scaleX = (rs.bboxW - dx) / rs.bboxW;
            scaleY = (rs.bboxH - dy) / rs.bboxH;
          }

          // Uniform: average of x and y scale, clamped
          const scale = Math.max(0.2, (scaleX + scaleY) / 2);

          // Apply to each widget via direct DOM manipulation
          for (const w of rs.widgets) {
            const relX = w.startX - rs.anchorX;
            const relY = w.startY - rs.anchorY;
            const newX = rs.anchorX + relX * scale;
            const newY = rs.anchorY + relY * scale;
            const newW = Math.max(150, w.startW * scale);
            const newH = Math.max(100, w.startH * scale);
            if (w.el) {
              w.el.style.left = `${newX}px`;
              w.el.style.top = `${newY}px`;
              w.el.style.width = `${newW}px`;
              w.el.style.height = `${newH}px`;
            }
          }
        });
      };

      const onUp = (ue: PointerEvent) => {
        if (ue.pointerId !== e.pointerId) return;
        if (animFrame !== null) cancelAnimationFrame(animFrame);
        document.body.classList.remove('is-dragging-widget');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);

        try {
          if (target.hasPointerCapture(e.pointerId)) {
            target.releasePointerCapture(e.pointerId);
          }
        } catch {
          // ignore
        }

        const rs = resizeState.current;
        if (!rs) return;

        const fdx = (ue.clientX - rs.startPointerX) / zoom;
        const fdy = (ue.clientY - rs.startPointerY) / zoom;
        let fScaleX = 1;
        let fScaleY = 1;
        if (corner === 'se') {
          fScaleX = (rs.bboxW + fdx) / rs.bboxW;
          fScaleY = (rs.bboxH + fdy) / rs.bboxH;
        } else if (corner === 'sw') {
          fScaleX = (rs.bboxW - fdx) / rs.bboxW;
          fScaleY = (rs.bboxH + fdy) / rs.bboxH;
        } else if (corner === 'ne') {
          fScaleX = (rs.bboxW + fdx) / rs.bboxW;
          fScaleY = (rs.bboxH - fdy) / rs.bboxH;
        } else {
          fScaleX = (rs.bboxW - fdx) / rs.bboxW;
          fScaleY = (rs.bboxH - fdy) / rs.bboxH;
        }
        const finalScale = Math.max(0.2, (fScaleX + fScaleY) / 2);

        // Commit all positions+dimensions in one batch
        updateWidgets(
          rs.widgets.map((w) => {
            const relX = w.startX - rs.anchorX;
            const relY = w.startY - rs.anchorY;
            return {
              id: w.id,
              changes: {
                x: rs.anchorX + relX * finalScale,
                y: rs.anchorY + relY * finalScale,
                w: Math.max(150, w.startW * finalScale),
                h: Math.max(100, w.startH * finalScale),
              },
            };
          })
        );
        resizeState.current = null;
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [groupWidgets, zoom, updateWidgets]
  );

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: '50%',
    background: 'rgba(59, 130, 246, 0.3)',
    border: '2px solid rgba(59, 130, 246, 0.7)',
    cursor: 'nwse-resize',
    touchAction: 'none',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: (bbox.left - PADDING) * zoom,
        top: (bbox.top - PADDING) * zoom,
        width: (bbox.width + PADDING * 2) * zoom,
        height: (bbox.height + PADDING * 2) * zoom,
        border: '2px dashed rgba(59, 130, 246, 0.5)',
        borderRadius: 8,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      {/* Corner resize handles — pointer events enabled */}
      {(['se', 'sw', 'ne', 'nw'] as const).map((corner) => {
        const isRight = corner.includes('e');
        const isBottom = corner.includes('s');
        return (
          <div
            key={corner}
            style={{
              ...handleStyle,
              pointerEvents: 'auto',
              ...(isRight
                ? { right: -HANDLE_SIZE / 2 }
                : { left: -HANDLE_SIZE / 2 }),
              ...(isBottom
                ? { bottom: -HANDLE_SIZE / 2 }
                : { top: -HANDLE_SIZE / 2 }),
              cursor:
                corner === 'se' || corner === 'nw'
                  ? 'nwse-resize'
                  : 'nesw-resize',
            }}
            onPointerDown={(e) => handleResizeStart(e, corner)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 10L10 2M5 10L10 5M8 10L10 8"
                stroke="rgba(59,130,246,0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};
