import { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, SeatingChartConfig, FurnitureItem } from '../../types';
import {
  generateColumnsLayout,
  generateHorseshoeLayout,
  generatePodsLayout,
} from './seatingChartLayouts';
import {
  FURNITURE_TYPES,
  SETUP_SIDEBAR_W,
  TOOLBAR_H,
  MIN_CANVAS_DIM,
} from './seatingChartConstants';

export const useSeatingChartLogic = (widget: WidgetData) => {
  const { updateWidget, rosters, activeRosterId, addToast } = useDashboard();
  const config = widget.config as SeatingChartConfig;
  // Fall back to the legacy templateRows field so existing Firestore widgets
  // preserve their saved column count after the rename to templateColumns.
  const legacyTemplateRows = (
    config as SeatingChartConfig & { templateRows?: number }
  ).templateRows;
  const {
    furniture = [],
    assignments = {},
    gridSize = 20,
    rosterMode = 'class',
    template = 'freeform',
    templateColumns = legacyTemplateRows ?? 6,
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
  const [randomHighlight, setRandomHighlight] = useState<string | null>(null);
  // Local state for the columns-count input so users can clear/type freely
  // without the field snapping back to the previous valid value on each keystroke.
  const [localTemplateColumns, setLocalTemplateColumns] = useState(
    String(templateColumns)
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  // Keep local input in sync when templateColumns changes from outside
  // (e.g. a different client updates the config via Firestore).
  useEffect(() => {
    setLocalTemplateColumns(String(templateColumns));
  }, [templateColumns]);

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

  const assignedStudentNames = new Set(Object.keys(assignments));
  const unassignedStudents = students.filter(
    (s) => !assignedStudentNames.has(s)
  );

  // --- SCALE HELPER ---
  // Returns the ratio of screen pixels to canvas coordinate units.
  // The canvas is inside a CSS-transformed ScalableWidget, so 1 canvas unit
  // may not equal 1 screen pixel. Dividing pointer deltas by this factor keeps
  // drag movement 1-to-1 with the cursor.
  const getCanvasScale = (): number => {
    const el = canvasRef.current;
    if (!el || el.offsetWidth === 0) return 1;
    return el.getBoundingClientRect().width / el.offsetWidth;
  };

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
        x: widget.w / 2 - def.w / 2 + offset,
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
      x: Math.round((item.x + 20) / gridSize) * gridSize,
      y: Math.round((item.y + 20) / gridSize) * gridSize,
    };

    updateWidget(widget.id, {
      config: { ...config, furniture: [...furniture, newItem] },
    });
    setSelectedId(newItem.id);
  };

  const removeFurniture = (id: string) => {
    const next = furniture.filter((f) => f.id !== id);
    const nextAssignments = { ...assignments };
    Object.entries(assignments).forEach(([student, furnId]) => {
      if (furnId === id) delete nextAssignments[student];
    });
    updateWidget(widget.id, {
      config: { ...config, furniture: next, assignments: nextAssignments },
    });
    setSelectedId(null);
  };

  // --- TEMPLATE ACTIONS ---

  const applyTemplate = () => {
    const numStudents = students.length;

    // Horseshoe always places a fixed 32-desk layout regardless of roster size.
    // All other templates require students to know how many desks to generate.
    if (numStudents === 0 && template !== 'horseshoe') {
      addToast(
        'No students found. Set a class or custom roster first.',
        'error'
      );
      return;
    }

    const canvasEl = canvasRef.current;
    const rawCanvasW = canvasEl
      ? canvasEl.offsetWidth
      : widget.w - SETUP_SIDEBAR_W;
    const rawCanvasH = canvasEl ? canvasEl.offsetHeight : widget.h - TOOLBAR_H;
    // Clamp to a minimum safe size so generators never receive zero or
    // negative dimensions, which would cause division-by-zero in spacing math.
    const canvasW = Math.max(MIN_CANVAS_DIM, rawCanvasW);
    const canvasH = Math.max(MIN_CANVAS_DIM, rawCanvasH);

    let newFurniture: FurnitureItem[] = [];

    if (template === 'rows') {
      const cols = Math.max(1, templateColumns);
      newFurniture = generateColumnsLayout(
        numStudents,
        cols,
        canvasW,
        canvasH,
        gridSize
      );
    } else if (template === 'horseshoe') {
      newFurniture = generateHorseshoeLayout(
        numStudents,
        canvasW,
        canvasH,
        gridSize
      );
    } else if (template === 'pods') {
      newFurniture = generatePodsLayout(
        numStudents,
        canvasW,
        canvasH,
        gridSize
      );
    }

    updateWidget(widget.id, {
      config: { ...config, furniture: newFurniture, assignments: {} },
    });
    setSelectedId(null);
    addToast(
      `Applied ${template} layout with ${newFurniture.length} desks.`,
      'success'
    );
  };

  const handleStudentClick = (studentName: string) => {
    if (mode !== 'assign') return;
    setSelectedStudent(selectedStudent === studentName ? null : studentName);
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

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = item.x;
    const origY = item.y;
    const currentPos = { x: origX, y: origY };

    // Capture scale at drag start so it stays consistent during the drag
    const canvasScale = getCanvasScale();

    setDragState({ id, x: origX, y: origY });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / canvasScale;
      const dy = (moveEvent.clientY - startY) / canvasScale;

      const newX = Math.round((origX + dx) / gridSize) * gridSize;
      const newY = Math.round((origY + dy) / gridSize) * gridSize;

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

    const canvasScale = getCanvasScale();

    setResizeState({ id, width: startW, height: startH });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / canvasScale;
      const dy = (moveEvent.clientY - startY) / canvasScale;

      let newW = Math.round((startW + dx) / gridSize) * gridSize;
      let newH = Math.round((startH + dy) / gridSize) * gridSize;

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

    if (assignments[studentName] === furnitureId) return;

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
    updateWidget(widget.id, { config: { ...config, assignments: next } });
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

    for (let i = unassigned.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unassigned[i], unassigned[j]] = [unassigned[j], unassigned[i]];
    }

    const occupiedIds = new Set(Object.values(assignments));
    const emptySpots = targetFurniture
      .filter((f) => !occupiedIds.has(f.id))
      .map((f) => f.id);

    if (emptySpots.length === 0) {
      addToast('No empty spots available!', 'error');
      return;
    }

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
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    const occupiedFurnitureIds = Object.values(assignments);
    if (occupiedFurnitureIds.length === 0) {
      addToast('No students assigned to seats!', 'info');
      return;
    }

    const uniqueIds = [...new Set(occupiedFurnitureIds)];

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
        const winner = uniqueIds[Math.floor(Math.random() * uniqueIds.length)];
        setRandomHighlight(winner);
      }
    }, 100);
  };

  // --- RENDERING HELPERS ---

  const getFurnitureStyle = (item: FurnitureItem) => {
    const isSelected = selectedId === item.id && mode === 'setup';
    const isHighlighted = randomHighlight === item.id;

    let bg = 'bg-white';
    let border = 'border-slate-300';

    if (item.type === 'desk') {
      bg = 'bg-white';
      border = 'border-slate-300';
    }
    if (item.type === 'table-rect') {
      bg = 'bg-amber-100';
      border = 'border-amber-300';
    }
    if (item.type === 'table-round') {
      bg = 'bg-amber-100';
      border = 'border-amber-300';
    }
    if (item.type === 'rug') {
      bg = 'bg-indigo-100';
      border = 'border-indigo-300';
    }
    if (item.type === 'teacher-desk') {
      bg = 'bg-slate-200';
      border = 'border-slate-400';
    }
    if (isHighlighted) {
      bg = 'bg-yellow-300';
      border = 'border-yellow-500';
    }

    return `absolute border-2 flex items-center justify-center transition-all ${bg} ${border} ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''} ${item.type === 'table-round' ? 'rounded-full' : 'rounded-lg'} shadow-sm`;
  };

  const getAssignedStudents = (furnitureId: string) => {
    return Object.entries(assignments)
      .filter(([, fId]) => fId === furnitureId)
      .map(([name]) => name);
  };

  return {
    // State
    config,
    mode,
    selectedId,
    selectedStudent,
    bulkCount,
    dragState,
    resizeState,
    randomHighlight,
    localTemplateColumns,
    unassignedStudents,
    students,
    furniture,
    assignments,
    canvasRef,
    isRandomPicking: !!animationIntervalRef.current,

    // Actions
    setMode,
    setBulkCount,
    setLocalTemplateColumns,
    setSelectedId,
    updateWidget,

    // Handlers
    addFurniture,
    clearAllFurniture,
    updateFurniture,
    duplicateFurniture,
    removeFurniture,
    applyTemplate,
    handleStudentClick,
    handleFurnitureClick,
    handlePointerDown,
    handleResizeStart,
    handleStudentDrop,
    handleRemoveAssignment,
    addAllRandomly,
    pickRandom,

    // Helpers
    getFurnitureStyle,
    getAssignedStudents,
  };
};
