import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, SeatingChartConfig, FurnitureItem } from '../../types';
import {
  Armchair,
  LayoutGrid,
  RotateCw,
  RotateCcw,
  Trash2,
  Monitor,
  Maximize2,
  Dice5,
  User,
  Copy,
  UserPlus,
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
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [bulkCount, setBulkCount] = useState<number>(1);
  const [dragState, setDragState] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    id: string;
    width: number;
    height: number;
  } | null>(null);
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

    if (rosterMode === 'custom' && config.names) {
      return config.names
        .split('\n')
        .map((n) => n.trim())
        .filter((n) => n !== '');
    }

    return [];
  }, [activeRoster, rosterMode, config.names]);

  // Determine unassigned students
  const assignedStudentNames = new Set(Object.keys(assignments));
  const unassignedStudents = students.filter(
    (s) => !assignedStudentNames.has(s)
  );

  // --- FURNITURE ACTIONS ---

  const addFurniture = (type: FurnitureItem['type']) => {
    const def = FURNITURE_TYPES.find((t) => t.type === type);
    if (!def) return;

    const newItems: FurnitureItem[] = [];
    const count = Math.max(1, Math.min(50, bulkCount));

    for (let i = 0; i < count; i++) {
      const offset = i * 10;
      newItems.push({
        id: crypto.randomUUID(),
        type,
        x: widget.w / 2 - def.w / 2 + offset, // Offset slightly so they aren't perfectly stacked
        y: widget.h / 2 - def.h / 2 + offset,
        width: def.w,
        height: def.h,
        rotation: 0,
      });
    }

    updateWidget(widget.id, {
      config: { ...config, furniture: [...furniture, ...newItems] },
    });

    if (newItems.length === 1) {
      setSelectedId(newItems[0].id);
    }
  };

  const clearAllFurniture = () => {
    if (
      window.confirm(
        'Are you sure you want to remove all furniture and assignments?'
      )
    ) {
      updateWidget(widget.id, {
        config: { ...config, furniture: [], assignments: {} },
      });
      setSelectedId(null);
    }
  };

  const updateFurniture = (id: string, updates: Partial<FurnitureItem>) => {
    const next = furniture.map((f) => (f.id === id ? { ...f, ...updates } : f));
    updateWidget(widget.id, {
      config: { ...config, furniture: next },
    });
  };

  const duplicateFurniture = (id: string) => {
    const item = furniture.find((f) => f.id === id);
    if (!item) return;

    const newItem: FurnitureItem = {
      ...item,
      id: crypto.randomUUID(),
      x: item.x + 20,
      y: item.y + 20,
    };

    // Snap new position to grid to be safe
    newItem.x = Math.round(newItem.x / gridSize) * gridSize;
    newItem.y = Math.round(newItem.y / gridSize) * gridSize;

    updateWidget(widget.id, {
      config: { ...config, furniture: [...furniture, newItem] },
    });
    setSelectedId(newItem.id);
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

  const handleStudentClick = (studentName: string) => {
    if (mode !== 'assign') return;
    if (selectedStudent === studentName) {
      setSelectedStudent(null);
    } else {
      setSelectedStudent(studentName);
    }
  };

  const handleFurnitureClick = (furnitureId: string) => {
    if (mode === 'setup') {
      setSelectedId(furnitureId);
      return;
    }

    if (mode === 'assign' && selectedStudent) {
      updateWidget(widget.id, {
        config: {
          ...config,
          assignments: { ...assignments, [selectedStudent]: furnitureId },
        },
      });
      setSelectedStudent(null);
      addToast(`Assigned ${selectedStudent}`, 'success');
    }
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
    const currentPos = { x: origX, y: origY };

    // Set initial drag state
    setDragState({ id, x: origX, y: origY });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newX = origX + dx;
      let newY = origY + dy;

      // Snap to grid
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;

      currentPos.x = newX;
      currentPos.y = newY;
      setDragState({ id, x: newX, y: newY });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      updateFurniture(id, { x: currentPos.x, y: currentPos.y });
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleResizeStart = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const item = furniture.find((f) => f.id === id);
    if (!item) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = item.width;
    const startH = item.height;
    const currentSize = { w: startW, h: startH };

    setResizeState({ id, width: startW, height: startH });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newW = startW + dx;
      let newH = startH + dy;

      // Snap to grid
      newW = Math.round(newW / gridSize) * gridSize;
      newH = Math.round(newH / gridSize) * gridSize;

      // Min size constraint
      if (newW < gridSize) newW = gridSize;
      if (newH < gridSize) newH = gridSize;

      currentSize.w = newW;
      currentSize.h = newH;
      setResizeState({ id, width: newW, height: newH });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      updateFurniture(id, { width: currentSize.w, height: currentSize.h });
      setResizeState(null);
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

  const addAllRandomly = () => {
    const targetFurniture = furniture.filter(
      (f) => f.type === 'desk' || f.type.startsWith('table')
    );

    if (targetFurniture.length === 0) {
      addToast('No desks or tables available!', 'error');
      return;
    }

    const unassigned = [...unassignedStudents];
    if (unassigned.length === 0) {
      addToast('All students are already assigned!', 'info');
      return;
    }

    // Shuffle students
    for (let i = unassigned.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unassigned[i], unassigned[j]] = [unassigned[j], unassigned[i]];
    }

    // Find empty target furniture
    const occupiedIds = new Set(Object.values(assignments));
    const emptySpots = targetFurniture
      .filter((f) => !occupiedIds.has(f.id))
      .map((f) => f.id);

    if (emptySpots.length === 0) {
      addToast('No empty spots available!', 'error');
      return;
    }

    // Shuffle empty spots too for true randomness
    for (let i = emptySpots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptySpots[i], emptySpots[j]] = [emptySpots[j], emptySpots[i]];
    }

    const nextAssignments = { ...assignments };
    let count = 0;
    while (unassigned.length > 0 && emptySpots.length > 0) {
      const student = unassigned.pop();
      const spotId = emptySpots.pop();
      if (student && spotId) {
        nextAssignments[student] = spotId;
        count++;
      }
    }

    updateWidget(widget.id, {
      config: { ...config, assignments: nextAssignments },
    });

    if (unassigned.length > 0) {
      addToast(
        `Assigned ${count} students. ${unassigned.length} still need spots.`,
        'info'
      );
    } else {
      addToast(`Randomly assigned ${count} students!`, 'success');
    }
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
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-slate-100">
                  <label className="text-xxs font-black text-slate-400 uppercase tracking-widest block mb-2">
                    Bulk Add Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={bulkCount}
                    onChange={(e) =>
                      setBulkCount(parseInt(e.target.value) || 1)
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>

                <div className="p-3 grid grid-cols-2 gap-2">
                  {FURNITURE_TYPES.map((t) => (
                    <button
                      key={t.type}
                      onClick={() => addFurniture(t.type)}
                      className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors aspect-square"
                    >
                      <t.icon className="w-6 h-6 text-slate-600" />
                      <span className="text-xxs font-bold text-slate-500">
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-auto p-3 border-t border-slate-100">
                  <button
                    onClick={clearAllFurniture}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {mode === 'assign' && (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b border-slate-100 bg-slate-50 text-xxs font-black uppercase text-slate-400 tracking-widest text-center">
                  Unassigned Students
                </div>

                <div className="p-2 border-b border-slate-100">
                  <button
                    onClick={addAllRandomly}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add All Random
                  </button>
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
                        onClick={() => handleStudentClick(student)}
                        className={`p-2 bg-white border ${selectedStudent === student ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'} rounded-lg shadow-sm text-xs font-bold text-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all`}
                        title="Drag or Click to assign"
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
            const displayX = dragState?.id === item.id ? dragState.x : item.x;
            const displayY = dragState?.id === item.id ? dragState.y : item.y;
            const displayW =
              resizeState?.id === item.id ? resizeState.width : item.width;
            const displayH =
              resizeState?.id === item.id ? resizeState.height : item.height;

            return (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFurnitureClick(item.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => handleStudentDrop(e, item.id)}
                style={{
                  left: displayX,
                  top: displayY,
                  width: displayW,
                  height: displayH,
                  transform: `rotate(${item.rotation}deg)`,
                }}
                className={`${getFurnitureStyle(item)} ${mode === 'setup' ? 'cursor-move' : ''}`}
              >
                {/* Resize Handle */}
                {mode === 'setup' && selectedId === item.id && (
                  <div
                    onPointerDown={(e) => handleResizeStart(e, item.id)}
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
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white shadow-xl rounded-full p-1.5 border border-slate-200 z-[60] animate-in fade-in zoom-in-95 duration-200"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFurniture(item.id, {
                            rotation: (item.rotation - 45 + 360) % 360,
                          });
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                        title="Rotate Left"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFurniture(item.id, {
                            rotation: (item.rotation + 45) % 360,
                          });
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
                          duplicateFurniture(item.id);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFurniture(item.id);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
                    <div className="flex flex-col items-center justify-center gap-1 w-full h-full overflow-hidden">
                      {assigned.map((name) => (
                        <div
                          key={name}
                          className={`bg-white/90 px-1.5 rounded font-bold shadow-sm border border-slate-100 truncate w-full text-center pointer-events-auto flex items-center justify-center ${assigned.length === 1 ? 'h-full text-xs' : 'py-1 text-xxs'}`}
                        >
                          <span className="truncate">{name}</span>
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
