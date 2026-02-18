import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  SeatingChartConfig,
  FurnitureItem,
  SeatingChartTemplate,
} from '../../types';
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
  RefreshCw,
  Rows3,
  Grip,
  LayoutTemplate,
} from 'lucide-react';
import { Button } from '../common/Button';
import { FloatingPanel } from '../common/FloatingPanel';

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
  },
  { type: 'rug', label: 'Rug', w: 150, h: 100, icon: Armchair },
  { type: 'teacher-desk', label: 'Teacher', w: 100, h: 60, icon: User },
];

const DESK_W = 60;
const DESK_H = 50;

// --- TEMPLATE GENERATION ---

function snapToGrid(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize;
}

function generateRowsLayout(
  numStudents: number,
  numRows: number,
  canvasW: number,
  canvasH: number,
  gridSize: number
): FurnitureItem[] {
  if (numStudents <= 0 || numRows <= 0) return [];

  const desksPerRow = Math.ceil(numStudents / numRows);
  const margin = 40;
  const availW = canvasW - margin * 2;
  const availH = canvasH - margin * 2;

  const colSpacing =
    numRows > 1 ? (availW - DESK_W) / (numRows - 1) : availW / 2;
  const rowSpacing =
    desksPerRow > 1 ? (availH - DESK_H) / (desksPerRow - 1) : availH / 2;

  const items: FurnitureItem[] = [];
  let count = 0;

  for (let col = 0; col < numRows && count < numStudents; col++) {
    const x = snapToGrid(
      numRows === 1 ? canvasW / 2 - DESK_W / 2 : margin + col * colSpacing,
      gridSize
    );
    for (let row = 0; row < desksPerRow && count < numStudents; row++) {
      const y = snapToGrid(
        desksPerRow === 1
          ? canvasH / 2 - DESK_H / 2
          : margin + row * rowSpacing,
        gridSize
      );
      items.push({
        id: crypto.randomUUID(),
        type: 'desk',
        x,
        y,
        width: DESK_W,
        height: DESK_H,
        rotation: 0,
      });
      count++;
    }
  }

  return items;
}

function generateHorseshoeLayout(
  numStudents: number,
  canvasW: number,
  canvasH: number,
  gridSize: number
): FurnitureItem[] {
  if (numStudents <= 0) return [];

  const MIN_INNER_HORSESHOE_COUNT = 3;
  const HORSESHOE_GAP = 90; // pixel gap between inner and outer U walls
  const TEACHER_AREA_MARGIN = 60; // vertical space reserved at top for teacher desk

  // Inner U is ~35% of students, outer U is ~65%
  const innerCount = Math.max(
    MIN_INNER_HORSESHOE_COUNT,
    Math.round(numStudents * 0.35)
  );
  const outerCount = numStudents - innerCount;

  // Distribute each U as left-bottom-right
  function distributeU(total: number): [number, number, number] {
    const side = Math.floor(total / 3);
    return [side, total - 2 * side, side]; // [left, bottom, right]
  }

  const [outerLeft, outerBottom, outerRight] = distributeU(outerCount);
  const [innerLeft, innerBottom, innerRight] = distributeU(innerCount);

  const margin = 30;
  const gap = HORSESHOE_GAP;
  const items: FurnitureItem[] = [];

  // Outer U — opens toward the top (teacher is at top)
  // Left arm: vertical column on left side
  // Right arm: vertical column on right side
  // Bottom: horizontal row at the bottom

  function placeVerticalArm(
    count: number,
    x: number,
    yStart: number,
    yEnd: number
  ) {
    if (count <= 0) return;
    const spacing = count > 1 ? (yEnd - yStart) / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      const y = snapToGrid(
        count === 1 ? (yStart + yEnd) / 2 : yStart + i * spacing,
        gridSize
      );
      items.push({
        id: crypto.randomUUID(),
        type: 'desk',
        x: snapToGrid(x, gridSize),
        y,
        width: DESK_W,
        height: DESK_H,
        rotation: 0,
      });
    }
  }

  function placeHorizontalRow(
    count: number,
    y: number,
    xStart: number,
    xEnd: number
  ) {
    if (count <= 0) return;
    const spacing = count > 1 ? (xEnd - xStart) / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      const x = snapToGrid(
        count === 1 ? (xStart + xEnd) / 2 : xStart + i * spacing,
        gridSize
      );
      items.push({
        id: crypto.randomUUID(),
        type: 'desk',
        x,
        y: snapToGrid(y, gridSize),
        width: DESK_W,
        height: DESK_H,
        rotation: 0,
      });
    }
  }

  // Outer U bounds
  const outerLeft_x = margin;
  const outerRight_x = canvasW - margin - DESK_W;
  const outerTop_y = margin + TEACHER_AREA_MARGIN;
  const outerBottom_y = canvasH - margin - DESK_H;

  placeVerticalArm(outerLeft, outerLeft_x, outerTop_y, outerBottom_y);
  placeVerticalArm(outerRight, outerRight_x, outerTop_y, outerBottom_y);
  placeHorizontalRow(
    outerBottom,
    outerBottom_y,
    outerLeft_x + DESK_W + 20,
    outerRight_x - 20
  );

  // Inner U bounds (inset by gap from outer)
  const innerLeft_x = outerLeft_x + DESK_W + gap;
  const innerRight_x = outerRight_x - gap;
  const innerTop_y = outerTop_y + 20;
  const innerBottom_y = outerBottom_y - gap;

  placeVerticalArm(innerLeft, innerLeft_x, innerTop_y, innerBottom_y);
  placeVerticalArm(innerRight, innerRight_x, innerTop_y, innerBottom_y);
  placeHorizontalRow(
    innerBottom,
    innerBottom_y,
    innerLeft_x + DESK_W + 20,
    innerRight_x - 20
  );

  return items;
}

function generatePodsLayout(
  numStudents: number,
  canvasW: number,
  canvasH: number,
  gridSize: number
): FurnitureItem[] {
  if (numStudents <= 0) return [];

  const fullPods = Math.floor(numStudents / 4);
  const remainder = numStudents % 4;
  const numPods = fullPods + (remainder > 0 ? 1 : 0);

  // Pod is 2x2 arrangement of desks
  const podGapInner = 10; // gap between desks within pod
  const podW = DESK_W * 2 + podGapInner;
  const podH = DESK_H * 2 + podGapInner;
  const podGapOuter = 40; // gap between pods

  const margin = 30;
  const availW = canvasW - margin * 2;

  const podsPerRow = Math.max(
    1,
    Math.floor((availW + podGapOuter) / (podW + podGapOuter))
  );

  const totalGridW = podsPerRow * podW + (podsPerRow - 1) * podGapOuter;
  const startX = Math.max(margin, (canvasW - totalGridW) / 2);
  const startY = margin + 40;

  // 2x2 desk offsets: top-left, top-right, bottom-left, bottom-right
  const podDeskOffsets = [
    { dx: 0, dy: 0 },
    { dx: DESK_W + podGapInner, dy: 0 },
    { dx: 0, dy: DESK_H + podGapInner },
    { dx: DESK_W + podGapInner, dy: DESK_H + podGapInner },
  ];

  const items: FurnitureItem[] = [];

  for (let pi = 0; pi < numPods; pi++) {
    const podRow = Math.floor(pi / podsPerRow);
    const podCol = pi % podsPerRow;
    const podX = startX + podCol * (podW + podGapOuter);
    const podY = startY + podRow * (podH + podGapOuter);

    const isLast = pi === numPods - 1 && remainder > 0;
    const desksInThisPod = isLast ? remainder : 4;

    for (let di = 0; di < desksInThisPod; di++) {
      items.push({
        id: crypto.randomUUID(),
        type: 'desk',
        x: snapToGrid(podX + podDeskOffsets[di].dx, gridSize),
        y: snapToGrid(podY + podDeskOffsets[di].dy, gridSize),
        width: DESK_W,
        height: DESK_H,
        rotation: 0,
      });
    }
  }

  return items;
}

// Template metadata for UI
const TEMPLATES: {
  id: SeatingChartTemplate;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: 'freeform',
    label: 'Freeform',
    icon: LayoutTemplate,
    description: 'Place desks freely',
  },
  {
    id: 'rows',
    label: 'Rows',
    icon: Rows3,
    description: 'Evenly spaced columns',
  },
  {
    id: 'horseshoe',
    label: 'Horseshoe',
    icon: Armchair,
    description: 'Inner & outer U',
  },
  {
    id: 'pods',
    label: 'Pods',
    icon: Grip,
    description: 'Groups of 4',
  },
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
    template = 'freeform',
    templateRows = 6,
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

    if (numStudents === 0) {
      addToast(
        'No students found. Set a class or custom roster first.',
        'error'
      );
      return;
    }

    if (template === 'freeform') {
      addToast('Freeform selected — add furniture manually below.', 'info');
      return;
    }

    const canvasEl = canvasRef.current;
    // Fallback: derive from widget dimensions minus known chrome (w-48 sidebar = 192px, h-12 toolbar = 48px)
    const canvasW = canvasEl ? canvasEl.offsetWidth : widget.w - 192;
    const canvasH = canvasEl ? canvasEl.offsetHeight : widget.h - 48;

    let newFurniture: FurnitureItem[] = [];

    if (template === 'rows') {
      const rows = Math.max(1, templateRows);
      newFurniture = generateRowsLayout(
        numStudents,
        rows,
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

  // --- RENDERING ---

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

  const studentCount = students.length;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-2 justify-between shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('interact')}
            className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'interact' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Interact
          </button>
          <button
            onClick={() => setMode('assign')}
            className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'assign' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Assign
          </button>
          <button
            onClick={() => setMode('setup')}
            className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'setup' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
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
          <div className="w-48 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-left-4 duration-200">
            {mode === 'setup' && (
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                {/* Template Picker */}
                <div className="p-3 border-b border-slate-200">
                  <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-2">
                    Template
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          updateWidget(widget.id, {
                            config: { ...config, template: t.id },
                          })
                        }
                        title={t.description}
                        className={`flex flex-col items-center justify-center gap-1 p-2 border rounded-lg transition-all text-xxs font-black uppercase leading-none ${
                          template === t.id
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-300'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <t.icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Rows count input */}
                  {template === 'rows' && (
                    <div className="mt-2">
                      <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-1">
                        # of Rows
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={templateRows}
                        onChange={(e) =>
                          updateWidget(widget.id, {
                            config: {
                              ...config,
                              templateRows: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                        className="w-full p-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black"
                      />
                    </div>
                  )}

                  {/* Student count hint */}
                  <p className="text-xxs text-slate-400 mt-2 text-center">
                    {studentCount > 0
                      ? `${studentCount} students`
                      : 'No roster set'}
                  </p>

                  {/* Apply button */}
                  <button
                    onClick={applyTemplate}
                    disabled={template === 'freeform' || studentCount === 0}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Apply Layout
                  </button>
                </div>

                {/* Manual Add */}
                <div className="p-3 border-b border-slate-200">
                  <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-2">
                    Add Manually
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={bulkCount}
                    onChange={(e) =>
                      setBulkCount(parseInt(e.target.value) || 1)
                    }
                    placeholder="Qty"
                    className="w-full p-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {FURNITURE_TYPES.map((t) => (
                      <button
                        key={t.type}
                        onClick={() => addFurniture(t.type)}
                        className="flex flex-col items-center justify-center gap-1 p-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors aspect-square shadow-sm"
                      >
                        <t.icon className="w-6 h-6 text-slate-600" />
                        <span className="text-xxs font-black uppercase text-slate-500">
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                <div className="mt-auto p-3">
                  <button
                    onClick={clearAllFurniture}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Canvas
                  </button>
                </div>
              </div>
            )}

            {mode === 'assign' && (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b border-slate-200 bg-slate-100 text-xxs font-black uppercase text-slate-600 tracking-widest text-center">
                  Unassigned Students
                </div>
                <div className="p-2 border-b border-slate-200">
                  <button
                    onClick={addAllRandomly}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add All Random
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {unassignedStudents.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-4 italic font-bold">
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
                        className={`p-2 bg-white border ${selectedStudent === student ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'} rounded-lg shadow-sm text-xs font-black text-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all`}
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
          className="flex-1 relative bg-white overflow-hidden"
          onClick={() => setSelectedId(null)}
          style={{
            backgroundImage:
              mode === 'setup'
                ? 'radial-gradient(rgba(203, 213, 225, 0.4) 1px, transparent 1px)'
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
                    <FloatingPanel
                      onPointerDown={(e) => e.stopPropagation()}
                      shape="pill"
                      padding="sm"
                      className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1"
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
                    </FloatingPanel>
                  )}

                {/* Content */}
                <div className="flex flex-col items-center justify-center p-1 w-full h-full overflow-hidden pointer-events-none">
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
                  {assigned.length > 0 && (
                    <div className="flex flex-col items-center justify-center gap-1 w-full h-full overflow-hidden">
                      {assigned.map((name) => (
                        <div
                          key={name}
                          className={`bg-white px-1.5 rounded font-bold shadow-sm border border-slate-100 truncate w-full text-center pointer-events-auto flex items-center justify-center ${assigned.length === 1 ? 'h-full text-xs' : 'py-1 text-xxs'}`}
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

          {furniture.length === 0 && mode === 'setup' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
              <LayoutTemplate className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm font-bold uppercase tracking-widest">
                No Furniture
              </p>
              <p className="text-xs">
                {template === 'freeform'
                  ? 'Add furniture from the sidebar.'
                  : 'Pick a template and click Apply Layout.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
