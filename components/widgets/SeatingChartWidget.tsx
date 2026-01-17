import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, SeatingChartConfig, FurnitureItem } from '../../types';
import {
  Armchair,
  LayoutGrid,
  RotateCw,
  Trash2,
  Monitor,
  Dice5,
  User,
} from 'lucide-react';
import { Button } from '../common/Button';

// Furniture definitions for palette
const FURNITURE_TYPES: {
  type: FurnitureItem['type'];
  label: string;
  w: number;
  h: number;
  icon: React.ElementType;
}[] = [
  { type: 'desk', label: 'Desk', w: 60, h: 50, icon: Monitor },
  {
    type: 'table-rect',
    label: 'Table (Rect)',
    w: 120,
    h: 80,
    icon: LayoutGrid,
  },
  {
    type: 'table-round',
    label: 'Table (Round)',
    w: 100,
    h: 100,
    icon: LayoutGrid,
  }, // Using css radius
  { type: 'rug', label: 'Rug', w: 150, h: 100, icon: Armchair },
  { type: 'teacher-desk', label: 'Teacher', w: 100, h: 60, icon: User },
];

export const SeatingChartWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, rosters, activeRosterId, addToast } = useDashboard();
  const config = widget.config as SeatingChartConfig;
  const {
    furniture = [],
    assignments = {},
    gridSize = 20,
    rosterMode = 'class',
  } = config;

  const [mode, setMode] = useState<'setup' | 'assign' | 'interact'>('interact');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [randomHighlight, setRandomHighlight] = useState<string | null>(null); // Furniture ID

  const canvasRef = useRef<HTMLDivElement>(null);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Clear animation on unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  // Roster logic
  const activeRoster = useMemo(
    () => rosters.find((r) => r.id === activeRosterId),
    [rosters, activeRosterId]
  );

  const students = useMemo(() => {
    if (rosterMode === 'class' && activeRoster) {
      return activeRoster.students.map((s) =>
        `${s.firstName} ${s.lastName}`.trim()
      );
    }
    // TODO: Implement custom roster text area in settings if needed
    return [];
  }, [activeRoster, rosterMode]);

  // Determine unassigned students
  const assignedStudentNames = new Set(Object.keys(assignments));
  const unassignedStudents = students.filter(
    (s) => !assignedStudentNames.has(s)
  );

  // --- FURNITURE ACTIONS ---

  const addFurniture = (type: FurnitureItem['type']) => {
    const def = FURNITURE_TYPES.find((t) => t.type === type);
    if (!def) return;

    const newItem: FurnitureItem = {
      id: crypto.randomUUID(),
      type,
      x: widget.w / 2 - def.w / 2, // Center
      y: widget.h / 2 - def.h / 2,
      width: def.w,
      height: def.h,
      rotation: 0,
    };

    updateWidget(widget.id, {
      config: { ...config, furniture: [...furniture, newItem] },
    });
    setSelectedId(newItem.id);
  };

  const updateFurniture = (id: string, updates: Partial<FurnitureItem>) => {
    const next = furniture.map((f) => (f.id === id ? { ...f, ...updates } : f));
    updateWidget(widget.id, {
      config: { ...config, furniture: next },
    });
  };

  const removeFurniture = (id: string) => {
    const next = furniture.filter((f) => f.id !== id);
    // Remove assignments for this furniture
    const nextAssignments = { ...assignments };
    // Find students assigned to this furniture
    Object.entries(assignments).forEach(([student, furnId]) => {
      if (furnId === id) delete nextAssignments[student];
    });

    updateWidget(widget.id, {
      config: { ...config, furniture: next, assignments: nextAssignments },
    });
    setSelectedId(null);
  };

  // --- DRAG LOGIC (Furniture) ---

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (mode !== 'setup') return;
    e.stopPropagation();
    e.preventDefault();
    const item = furniture.find((f) => f.id === id);
    if (!item) return;

    setSelectedId(id);
    // Calculate offset from item top-left
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = item.x;
    const origY = item.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newX = origX + dx;
      let newY = origY + dy;

      // Snap to grid
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;

      updateFurniture(id, { x: newX, y: newY });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // --- ASSIGN LOGIC (Students) ---

  const handleStudentDrop = (e: React.DragEvent, furnitureId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode !== 'assign') return;

    const studentName = e.dataTransfer.getData('studentName');
    if (!studentName) return;

    // Check if moving from another furniture
    const prevFurnitureId = assignments[studentName];
    if (prevFurnitureId === furnitureId) return; // No change

    updateWidget(widget.id, {
      config: {
        ...config,
        assignments: { ...assignments, [studentName]: furnitureId },
      },
    });
  };

  const handleRemoveAssignment = (studentName: string) => {
    const next = { ...assignments };
    delete next[studentName];
    updateWidget(widget.id, {
      config: { ...config, assignments: next },
    });
  };

  // --- INTERACT LOGIC ---

  const pickRandom = () => {
    // Prevent multiple animations
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    const occupiedFurnitureIds = Object.values(assignments);
    if (occupiedFurnitureIds.length === 0) {
      addToast('No students assigned to seats!', 'info');
      return;
    }

    // Pick a random furniture ID that has a student
    const uniqueIds = [...new Set(occupiedFurnitureIds)];

    // Animate
    let count = 0;
    const max = 15;
    animationIntervalRef.current = setInterval(() => {
      const rnd = uniqueIds[Math.floor(Math.random() * uniqueIds.length)];
      setRandomHighlight(rnd);
      count++;
      if (count > max) {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }
        // Final pick
        const winner = uniqueIds[Math.floor(Math.random() * uniqueIds.length)];
        setRandomHighlight(winner);
      }
    }, 100);
  };

  // --- RENDERING ---

  const getFurnitureStyle = (item: FurnitureItem) => {
    const isSelected = selectedId === item.id && mode === 'setup';
    const isHighlighted = randomHighlight === item.id;

    let bg = 'bg-slate-100';
    let border = 'border-slate-300';

    if (item.type === 'desk') {
      bg = 'bg-white';
      border = 'border-slate-300';
    }
    if (item.type === 'table-rect') {
      bg = 'bg-amber-50';
      border = 'border-amber-200';
    }
    if (item.type === 'table-round') {
      bg = 'bg-amber-50';
      border = 'border-amber-200';
    }
    if (item.type === 'rug') {
      bg = 'bg-indigo-50';
      border = 'border-indigo-200';
    }
    if (item.type === 'teacher-desk') {
      bg = 'bg-slate-200';
      border = 'border-slate-400';
    }

    if (isHighlighted) {
      bg = 'bg-yellow-200';
      border = 'border-yellow-400';
    }

    return `absolute border-2 flex items-center justify-center transition-all ${bg} ${border} ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''} ${item.type === 'table-round' ? 'rounded-full' : 'rounded-lg'} shadow-sm`;
  };

  // Find students assigned to a specific furniture item
  const getAssignedStudents = (furnitureId: string) => {
    return Object.entries(assignments)
      .filter(([_, fId]) => fId === furnitureId)
      .map(([name]) => name);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center px-2 justify-between shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('interact')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'interact' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            Interact
          </button>
          <button
            onClick={() => setMode('assign')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'assign' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            Assign
          </button>
          <button
            onClick={() => setMode('setup')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'setup' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            Setup
          </button>
        </div>

        {mode === 'interact' && (
          <Button
            onClick={pickRandom}
            variant="primary"
            size="sm"
            icon={<Dice5 className="w-4 h-4" />}
            className="ml-auto"
            disabled={!!animationIntervalRef.current}
          >
            Pick Random
          </Button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {(mode === 'setup' || mode === 'assign') && (
          <div className="w-48 bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-left-4 duration-200">
            {mode === 'setup' && (
              <div className="p-3 grid grid-cols-2 gap-2">
                {FURNITURE_TYPES.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => addFurniture(t.type)}
                    className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors aspect-square"
                  >
                    <t.icon className="w-6 h-6 text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-500">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {mode === 'assign' && (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                  Unassigned Students
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {unassignedStudents.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-4 italic">
                      All assigned!
                    </div>
                  ) : (
                    unassignedStudents.map((student) => (
                      <div
                        key={student}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData('studentName', student)
                        }
                        className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-bold text-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
                      >
                        {student}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative bg-slate-50 overflow-hidden"
          onClick={() => setSelectedId(null)}
          style={{
            backgroundImage:
              mode === 'setup'
                ? 'radial-gradient(#cbd5e1 1px, transparent 1px)'
                : 'none',
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        >
          {furniture.map((item) => {
            const assigned = getAssignedStudents(item.id);

            return (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => handleStudentDrop(e, item.id)}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  transform: `rotate(${item.rotation}deg)`,
                }}
                className={`${getFurnitureStyle(item)} ${mode === 'setup' ? 'cursor-move' : ''}`}
              >
                {/* Rotation Handle (only in Setup & Selected) */}
                {mode === 'setup' && selectedId === item.id && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 bg-white shadow-md rounded-full p-1 border border-slate-200 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFurniture(item.id, {
                          rotation: (item.rotation + 45) % 360,
                        });
                      }}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-600"
                      title="Rotate"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFurniture(item.id);
                      }}
                      className="p-1 hover:bg-red-50 rounded-full text-red-500"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col items-center justify-center p-1 w-full h-full overflow-hidden pointer-events-none">
                  {/* Show type icon if empty or setup */}
                  {assigned.length === 0 && (
                    <div className="opacity-20">
                      {item.type === 'desk' && <Monitor className="w-5 h-5" />}
                      {item.type === 'teacher-desk' && (
                        <User className="w-5 h-5" />
                      )}
                      {item.type.includes('table') && (
                        <LayoutGrid className="w-6 h-6" />
                      )}
                      {item.type === 'rug' && <Armchair className="w-6 h-6" />}
                    </div>
                  )}

                  {/* Assigned Students */}
                  {assigned.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-1 w-full h-full overflow-hidden">
                      {assigned.map((name) => (
                        <div
                          key={name}
                          className="bg-white/90 px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm border border-slate-100 truncate max-w-full pointer-events-auto"
                        >
                          {name}
                          {mode === 'assign' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAssignment(name);
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
          })}

          {furniture.length === 0 && mode !== 'setup' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
              <LayoutGrid className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm font-bold uppercase tracking-widest">
                Empty Classroom
              </p>
              <p className="text-xs">
                Switch to &quot;Setup&quot; to arrange furniture.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};