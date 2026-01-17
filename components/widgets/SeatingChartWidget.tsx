import React, { useState, useMemo, useRef } from 'react';
import { WidgetData, SeatingChartConfig, FurnitureItem } from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { Button } from '../common/Button';
import {
  LayoutGrid,
  Users,
  Move,
  RotateCw,
  Trash2,
  Dice5,
  Plus,
  Monitor,
  Armchair,
} from 'lucide-react';

const GRID_SIZE = 20;

type Mode = 'layout' | 'assign';

const FURNITURE_TYPES: {
  type: FurnitureItem['type'];
  label: string;
  w: number;
  h: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { type: 'desk', label: 'Student Desk', w: 60, h: 40, icon: Armchair },
  { type: 'table-rect', label: 'Rect Table', w: 120, h: 60, icon: LayoutGrid },
  { type: 'table-round', label: 'Round Table', w: 80, h: 80, icon: LayoutGrid }, // Using Grid for generic table
  { type: 'teacher-desk', label: 'Teacher Desk', w: 100, h: 50, icon: Monitor },
  { type: 'rug', label: 'Rug/Area', w: 140, h: 100, icon: LayoutGrid },
];

export const SeatingChartWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, rosters, activeRosterId, addToast } = useDashboard();
  const config = widget.config as SeatingChartConfig;
  const {
    furniture = [],
    assignments = {}, // studentId -> furnitureId
    rosterMode = 'class',
    customRoster = [],
  } = config;

  const [mode, setMode] = useState<Mode>('assign');
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(
    null
  );
  const [draggedFurniture, setDraggedFurniture] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Randomizer state
  const [highlightedFurnitureId, setHighlightedFurnitureId] = useState<
    string | null
  >(null);

  const activeRoster = useMemo(
    () => rosters.find((r) => r.id === activeRosterId),
    [rosters, activeRosterId]
  );

  const allStudents = useMemo(() => {
    if (rosterMode === 'class' && activeRoster) {
      return activeRoster.students.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`.trim(),
      }));
    }
    return customRoster.map((name, i) => ({ id: `custom-${i}`, name }));
  }, [activeRoster, rosterMode, customRoster]);

  // Derived state
  const assignedStudentIds = new Set(Object.keys(assignments));
  const unassignedStudents = allStudents.filter(
    (s) => !assignedStudentIds.has(s.id)
  );

  // Reverse map: furnitureId -> studentId
  const furnitureAssignments = useMemo(() => {
    const map: Record<string, string> = {}; // furnitureId -> studentName
    Object.entries(assignments).forEach(([studentId, furnId]) => {
      const student = allStudents.find((s) => s.id === studentId);
      if (student) map[furnId] = student.name;
    });
    return map;
  }, [assignments, allStudents]);

  // --- Furniture Dragging Logic ---

  const handleMouseDown = (
    e: React.MouseEvent,
    id: string,
    x: number,
    y: number
  ) => {
    if (mode !== 'layout') return;
    e.stopPropagation();
    setSelectedFurnitureId(id);
    setDraggedFurniture(id);
    setDragOffset({ x: e.clientX - x, y: e.clientY - y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedFurniture && containerRef.current) {
      const rawX = e.clientX - dragOffset.x;
      const rawY = e.clientY - dragOffset.y;

      // Snap to grid
      const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

      updateFurniture(draggedFurniture, { x: snappedX, y: snappedY });
    }
  };

  const handleMouseUp = () => {
    setDraggedFurniture(null);
  };

  // --- CRUD ---

  const addFurniture = (typeItem: (typeof FURNITURE_TYPES)[0]) => {
    const newId = crypto.randomUUID();
    const newItem: FurnitureItem = {
      id: newId,
      type: typeItem.type,
      x: 20,
      y: 20,
      width: typeItem.w,
      height: typeItem.h,
      rotation: 0,
      label: typeItem.label,
    };
    updateWidget(widget.id, {
      config: { ...config, furniture: [...furniture, newItem] },
    });
    setSelectedFurnitureId(newId);
  };

  const updateFurniture = (id: string, updates: Partial<FurnitureItem>) => {
    const updated = furniture.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    updateWidget(widget.id, { config: { ...config, furniture: updated } });
  };

  const rotateFurniture = (id: string) => {
    const f = furniture.find((item) => item.id === id);
    if (f) {
      const newRotation = (f.rotation + 90) % 360;
      // Swap width/height visually if needed, but rotation transforms handle it usually.
      updateFurniture(id, { rotation: newRotation });
    }
  };

  const deleteFurniture = (id: string) => {
    // Remove furniture and any assignments to it
    const newFurniture = furniture.filter((f) => f.id !== id);
    const newAssignments = { ...assignments };
    // Find student assigned to this furniture
    const studentId = Object.keys(assignments).find(
      (sid) => assignments[sid] === id
    );
    if (studentId) delete newAssignments[studentId];

    updateWidget(widget.id, {
      config: {
        ...config,
        furniture: newFurniture,
        assignments: newAssignments,
      },
    });
    setSelectedFurnitureId(null);
  };

  // --- Student Drop Logic ---

  const handleStudentDrop = (e: React.DragEvent, furnitureId: string) => {
    if (mode !== 'assign') return;
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    if (!studentId) return;

    // Remove student from any previous assignment
    const newAssignments = { ...assignments };

    // Assign to new furniture
    newAssignments[studentId] = furnitureId;

    updateWidget(widget.id, {
      config: { ...config, assignments: newAssignments },
    });
  };

  const handleUnassignDrop = (e: React.DragEvent) => {
    if (mode !== 'assign') return;
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    if (!studentId) return;

    if (assignments[studentId]) {
      const newAssignments = { ...assignments };
      delete newAssignments[studentId];
      updateWidget(widget.id, {
        config: { ...config, assignments: newAssignments },
      });
    }
  };

  // --- Randomizer ---

  const pickRandom = () => {
    // Pick from assigned furniture
    const occupiedFurnitureIds = Object.values(assignments);
    if (occupiedFurnitureIds.length === 0) {
      addToast('No students assigned to seats', 'info');
      return;
    }

    // Spin effect
    let count = 0;
    const max = 20;
    const interval = setInterval(() => {
      const randomId =
        occupiedFurnitureIds[
          Math.floor(Math.random() * occupiedFurnitureIds.length)
        ];
      setHighlightedFurnitureId(randomId);
      count++;
      if (count >= max) {
        clearInterval(interval);
        // Ensure we land on one
        const winner =
          occupiedFurnitureIds[
            Math.floor(Math.random() * occupiedFurnitureIds.length)
          ];
        setHighlightedFurnitureId(winner);
      }
    }, 100);
  };

  return (
    <div
      className="h-full flex flex-col bg-slate-50 relative select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center z-10">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('assign')}
            className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${mode === 'assign' ? 'bg-white shadow text-cyan-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users className="w-3.5 h-3.5" /> Assign
          </button>
          <button
            onClick={() => setMode('layout')}
            className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${mode === 'layout' ? 'bg-white shadow text-cyan-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Move className="w-3.5 h-3.5" /> Layout
          </button>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={pickRandom}
          icon={<Dice5 className="w-4 h-4" />}
          disabled={mode === 'layout' || Object.keys(assignments).length === 0}
        >
          Pick Random
        </Button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]"
          style={{ backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }}
          onDragOver={(e) => e.preventDefault()}
        >
          {furniture.map((item) => {
            const isSelected =
              selectedFurnitureId === item.id && mode === 'layout';
            const assignedName = furnitureAssignments[item.id];
            const isHighlighted = highlightedFurnitureId === item.id;

            return (
              <div
                key={item.id}
                onMouseDown={(e) => handleMouseDown(e, item.id, item.x, item.y)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === 'layout') setSelectedFurnitureId(item.id);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleStudentDrop(e, item.id)}
                style={{
                  position: 'absolute',
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  transform: `rotate(${item.rotation}deg)`,
                  transition:
                    draggedFurniture === item.id
                      ? 'none'
                      : 'transform 0.2s, box-shadow 0.2s',
                }}
                className={`
                  group rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer shadow-sm
                  ${mode === 'layout' ? 'cursor-move' : 'cursor-default'}
                  ${isSelected ? 'border-cyan-500 ring-2 ring-cyan-200 z-20' : 'border-slate-300 bg-white hover:border-cyan-300'}
                  ${isHighlighted ? 'ring-4 ring-yellow-400 border-yellow-500 scale-105 z-30 transition-all duration-100' : ''}
                  ${assignedName ? 'bg-indigo-50 border-indigo-200' : ''}
                  ${item.type === 'table-round' ? 'rounded-full' : 'rounded-lg'}
                `}
              >
                {/* Furniture Content */}
                {assignedName ? (
                  <div
                    className={`text-center font-bold text-indigo-700 leading-tight p-1 ${item.width < 80 ? 'text-[10px]' : 'text-xs'}`}
                  >
                    {assignedName}
                  </div>
                ) : (
                  <div className="opacity-20 flex flex-col items-center">
                    {/* Icon based on type? */}
                  </div>
                )}

                {/* Helper Label (Desk number etc - optionally added in future) */}

                {/* Layout Controls (Only visible when selected in Layout Mode) */}
                {isSelected && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-slate-800 p-1 rounded-lg shadow-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateFurniture(item.id);
                      }}
                      className="p-1 hover:bg-slate-700 rounded text-white"
                      title="Rotate"
                    >
                      <RotateCw size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFurniture(item.id);
                      }}
                      className="p-1 hover:bg-red-900 rounded text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div
          className="w-48 bg-white border-l border-slate-200 flex flex-col overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleUnassignDrop}
        >
          <div className="p-3 bg-slate-50 border-b border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">
            {mode === 'layout' ? 'Furniture' : 'Students'}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {mode === 'layout' ? (
              <div className="grid grid-cols-1 gap-2">
                {FURNITURE_TYPES.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => addFurniture(type)}
                    className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-cyan-500">
                      <type.icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-cyan-700">
                      {type.label}
                    </span>
                    <Plus
                      size={12}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-cyan-500"
                    />
                  </button>
                ))}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-[10px] text-blue-600 leading-relaxed">
                  <strong>Tip:</strong> Drag items to move. Click to select,
                  rotate, or delete.
                </div>
              </div>
            ) : (
              // Assign Mode: Student List
              <>
                {unassignedStudents.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    All students assigned!
                  </div>
                )}
                {unassignedStudents.map((student) => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('studentId', student.id);
                    }}
                    className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                      {student.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">
                      {student.name}
                    </span>
                  </div>
                ))}

                {mode === 'assign' && (
                  <div className="mt-auto pt-4 text-center">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      Drop here to unassign
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
