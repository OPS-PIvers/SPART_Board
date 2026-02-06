import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableStudentProps {
  id: string;
  name: string;
  className?: string;
  onClick?: () => void;
}

export const DraggableStudent: React.FC<DraggableStudentProps> = ({
  id,
  name,
  className,
  onClick,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
      data: {
        name,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Only trigger click if not dragging
        if (!transform) {
          onClick?.();
        }
        e.stopPropagation();
      }}
      className={`${className} ${isDragging ? 'opacity-50 grayscale cursor-grabbing' : 'cursor-grab'} touch-none`}
    >
      {name}
    </div>
  );
};
