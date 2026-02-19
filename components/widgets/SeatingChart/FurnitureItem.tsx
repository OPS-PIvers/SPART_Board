import React from 'react';
import { FurnitureItem as FurnitureItemType } from '../../../types';
import {
  Monitor,
  LayoutGrid,
  Armchair,
  User,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { FloatingPanel } from '../../common/FloatingPanel';

interface Props {
  item: FurnitureItemType;
  mode: 'setup' | 'assign' | 'interact';
  selectedId: string | null;
  dragState: { id: string; x: number; y: number } | null;
  resizeState: { id: string; width: number; height: number } | null;
  randomHighlight: string | null;
  assignedStudents: string[];
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onClick: (e: React.MouseEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onResizeStart: (e: React.PointerEvent, id: string) => void;
  onRotate: (id: string, amount: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveAssignment: (studentName: string) => void;
}

export const FurnitureItem: React.FC<Props> = ({
  item,
  mode,
  selectedId,
  dragState,
  resizeState,
  randomHighlight,
  assignedStudents,
  onPointerDown,
  onClick,
  onDrop,
  onResizeStart,
  onRotate,
  onDuplicate,
  onRemove,
  onRemoveAssignment,
}) => {
  const getFurnitureStyle = () => {
    const isSelected = selectedId === item.id && mode === 'setup';
    const isHighlighted = randomHighlight === item.id;

    let bg = 'bg-white';
    let border = 'border-slate-300';

    if (item.type === 'desk') {
      bg = 'bg-white';
      border = 'border-slate-300';
    } else if (item.type === 'table-rect') {
      bg = 'bg-amber-100';
      border = 'border-amber-300';
    } else if (item.type === 'table-round') {
      bg = 'bg-amber-100';
      border = 'border-amber-300';
    } else if (item.type === 'rug') {
      bg = 'bg-indigo-100';
      border = 'border-indigo-300';
    } else if (item.type === 'teacher-desk') {
      bg = 'bg-slate-200';
      border = 'border-slate-400';
    }

    if (isHighlighted) {
      bg = 'bg-yellow-300';
      border = 'border-yellow-500';
    }

    return `absolute border-2 flex items-center justify-center transition-all ${bg} ${border} ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''} ${item.type === 'table-round' ? 'rounded-full' : 'rounded-lg'} shadow-sm`;
  };

  const displayX = dragState?.id === item.id ? dragState.x : item.x;
  const displayY = dragState?.id === item.id ? dragState.y : item.y;
  const displayW = resizeState?.id === item.id ? resizeState.width : item.width;
  const displayH =
    resizeState?.id === item.id ? resizeState.height : item.height;

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, item.id)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e, item.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => onDrop(e, item.id)}
      style={{
        left: displayX,
        top: displayY,
        width: displayW,
        height: displayH,
        transform: `rotate(${item.rotation}deg)`,
      }}
      className={`${getFurnitureStyle()} ${mode === 'setup' ? 'cursor-move' : ''}`}
    >
      {/* Resize Handle */}
      {mode === 'setup' && selectedId === item.id && (
        <div
          onPointerDown={(e) => onResizeStart(e, item.id)}
          className="absolute -bottom-2 -right-2 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-50 bg-white shadow rounded-full border border-slate-200 hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <Maximize2 className="w-3 h-3 rotate-90" />
        </div>
      )}

      {/* Floating Menu */}
      {mode === 'setup' &&
        selectedId === item.id &&
        !dragState &&
        !resizeState && (
          <FloatingPanel
            onPointerDown={(e) => e.stopPropagation()}
            shape="pill"
            padding="sm"
            className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRotate(item.id, -45);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
              title="Rotate Left"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRotate(item.id, 45);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(item.id);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </FloatingPanel>
        )}

      {/* Content */}
      <div className="flex flex-col items-center justify-center p-1 w-full h-full overflow-hidden pointer-events-none">
        {assignedStudents.length === 0 && (
          <div className="opacity-20">
            {item.type === 'desk' && <Monitor className="w-5 h-5" />}
            {item.type === 'teacher-desk' && <User className="w-5 h-5" />}
            {item.type.includes('table') && <LayoutGrid className="w-6 h-6" />}
            {item.type === 'rug' && <Armchair className="w-6 h-6" />}
          </div>
        )}
        {assignedStudents.length > 0 && (
          <div className="flex flex-col items-center justify-center gap-1 w-full h-full overflow-hidden">
            {assignedStudents.map((name) => (
              <div
                key={name}
                className={`bg-white px-1.5 rounded font-bold shadow-sm border border-slate-100 truncate w-full text-center pointer-events-auto flex items-center justify-center ${assignedStudents.length === 1 ? 'h-full text-xs' : 'py-1 text-xxs'}`}
              >
                <span className="truncate">{name}</span>
                {mode === 'assign' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAssignment(name);
                    }}
                    className="ml-1 text-red-400 hover:text-red-600"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
