import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Path, Point } from '../../types';

interface AnnotationCanvasProps {
  paths: Path[];
  color: string;
  width: number;
  canvasWidth: number;
  canvasHeight: number;
  onPathsChange: (paths: Path[]) => void;
  className?: string;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  paths,
  color,
  width,
  canvasWidth,
  canvasHeight,
  onPathsChange,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // Draw function
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, allPaths: Path[], current: Point[]) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const renderPath = (p: Path) => {
        if (p.points.length === 0) return;
        ctx.beginPath();

        if (p.color === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.fillStyle = 'rgba(0,0,0,1)';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = p.color;
          ctx.fillStyle = p.color;
        }

        ctx.lineWidth = p.width;

        if (p.points.length === 1) {
          ctx.arc(p.points[0].x, p.points[0].y, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.moveTo(p.points[0].x, p.points[0].y);
          for (let i = 1; i < p.points.length; i++) {
            ctx.lineTo(p.points[i].x, p.points[i].y);
          }
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      };

      allPaths.forEach(renderPath);
      if (current.length > 0) {
        renderPath({ points: current, color, width });
      }
    },
    [color, width]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resolution
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    draw(ctx, paths, currentPath);
  }, [paths, currentPath, canvasWidth, canvasHeight, draw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent dragging the window (parent DraggableWindow)
    e.stopPropagation();

    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentPath([pos]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isDrawing) return;
    const pos = getPos(e);
    setCurrentPath((prev) => [...prev, pos]);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 0) {
      const newPath: Path = { points: currentPath, color, width };
      onPathsChange([...paths, newPath]);
    }
    setCurrentPath([]);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`touch-none cursor-crosshair ${className ?? ''}`}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
};
