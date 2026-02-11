import { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { WidgetData, SeatingChartConfig, FurnitureItem } from '../../../types';
import { FURNITURE_TYPES } from './constants';

export const useSeatingChartLogic = (widget: WidgetData) => {
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

  const handleFurnitureClick = (e: React.MouseEvent, furnitureId: string) => {
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

  // Find students assigned to a specific furniture item
  const getAssignedStudents = (furnitureId: string) => {
    return Object.entries(assignments)
      .filter(([_, fId]) => fId === furnitureId)
      .map(([name]) => name);
  };

  const rotateFurniture = (id: string, angle: number) => {
    const item = furniture.find((f) => f.id === id);
    if (item) {
        updateFurniture(id, {
            rotation: (item.rotation + angle + 360) % 360,
        });
    }
  }

  return {
    furniture,
    gridSize,
    mode,
    setMode,
    selectedId,
    setSelectedId,
    selectedStudent,
    setSelectedStudent,
    bulkCount,
    setBulkCount,
    dragState,
    resizeState,
    randomHighlight,
    unassignedStudents,
    addFurniture,
    clearAllFurniture,
    updateFurniture,
    duplicateFurniture,
    removeFurniture,
    rotateFurniture,
    handleStudentClick,
    handleFurnitureClick,
    handlePointerDown,
    handleResizeStart,
    handleStudentDrop,
    handleRemoveAssignment,
    addAllRandomly,
    pickRandom,
    getAssignedStudents,
    isAnimating: !!animationIntervalRef.current,
  };
};
