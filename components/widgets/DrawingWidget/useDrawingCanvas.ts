import { useCallback, useEffect, useRef, useState } from 'react';
import { Point, Path } from '@/types';

interface UseDrawingCanvasOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  color: string;
  width: number;
  paths: Path[];
  onPathComplete: (path: Path) => void;
  /** CSS transform scale applied to the canvas by a parent ScalableWidget.
   *  Pass `1` for full-viewport overlays where no parent scaling applies. */
  scale?: number;
  /** If true, pointer events are ignored (e.g. student read-only view). */
  disabled?: boolean;
  /** Internal canvas resolution. Re-applies on change. */
  canvasSize: { width: number; height: number };
}

interface UseDrawingCanvasResult {
  handleStart: (e: React.PointerEvent) => void;
  handleMove: (e: React.PointerEvent) => void;
  handleEnd: () => void;
  isDrawing: boolean;
}

/**
 * Shared canvas-drawing logic for the DrawingWidget and the AnnotationOverlay.
 * Handles stroke rendering, pointer handling, and history-on-path-complete.
 * The caller owns the paths state and history semantics.
 */
export const useDrawingCanvas = ({
  canvasRef,
  color,
  width,
  paths,
  onPathComplete,
  scale = 1,
  disabled = false,
  canvasSize,
}: UseDrawingCanvasOptions): UseDrawingCanvasResult => {
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);

  const setContextStyles = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (color === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
      }
      ctx.lineWidth = width;
    },
    [color, width]
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, allPaths: Path[], current: Point[]) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const renderPath = (p: Path) => {
        if (p.points.length < 2) return;
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (p.color === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = p.color;
        }

        ctx.lineWidth = p.width;
        ctx.moveTo(p.points[0].x, p.points[0].y);
        for (let i = 1; i < p.points.length; i++) {
          ctx.lineTo(p.points[i].x, p.points[i].y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      };

      allPaths.forEach(renderPath);
      if (current.length > 1) {
        renderPath({ points: current, color, width });
      }
    },
    [color, width]
  );

  // Apply canvas resolution + redraw on size or paths change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== canvasSize.width) canvas.width = canvasSize.width;
    if (canvas.height !== canvasSize.height) canvas.height = canvasSize.height;

    draw(ctx, paths, currentPathRef.current);
  }, [canvasRef, canvasSize.width, canvasSize.height, paths, draw]);

  const getPos = useCallback(
    (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
    },
    [canvasRef, scale]
  );

  const handleStart = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      setIsDrawing(true);
      const pos = getPos(e);
      currentPathRef.current = [pos];

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        setContextStyles(ctx);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    },
    [disabled, getPos, canvasRef, setContextStyles]
  );

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !isDrawing) return;
      const pos = getPos(e);
      currentPathRef.current.push(pos);

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && currentPathRef.current.length > 1) {
        setContextStyles(ctx);
        const prev = currentPathRef.current[currentPathRef.current.length - 2];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    },
    [disabled, isDrawing, getPos, canvasRef, setContextStyles]
  );

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPathRef.current.length > 1) {
      onPathComplete({
        points: currentPathRef.current,
        color,
        width,
      });
    }
    currentPathRef.current = [];
  }, [isDrawing, onPathComplete, color, width]);

  return { handleStart, handleMove, handleEnd, isDrawing };
};
