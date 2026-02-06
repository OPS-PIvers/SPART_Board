import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  children: React.ReactNode;
  activeClassName?: string;
}

export const DroppableZone: React.FC<DroppableZoneProps> = ({
  id,
  children,
  className,
  activeClassName,
  ...props
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? activeClassName : ''}`}
      {...props}
    >
      {children}
    </div>
  );
};
