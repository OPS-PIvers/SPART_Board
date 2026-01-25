import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { useInstructionalRoutines } from '../../../hooks/useInstructionalRoutines';
import { WidgetData, InstructionalRoutinesConfig } from '../../../types';
import {
  ROUTINES as DEFAULT_ROUTINES,
  InstructionalRoutine,
} from '../../../config/instructionalRoutines';
import { LibraryManager } from './LibraryManager';
import { LibraryView } from './LibraryView';
import { RoutineView } from './RoutineView';

export const InstructionalRoutinesWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { isAdmin } = useAuth();
  const { routines: cloudRoutines } = useInstructionalRoutines();
  const config = widget.config as InstructionalRoutinesConfig;
  const { selectedRoutineId } = config;

  // Merge cloud routines with defaults
  const ROUTINES = useMemo(() => {
    if (cloudRoutines.length === 0) return DEFAULT_ROUTINES;

    // Create a map by ID to ensure cloud ones override defaults if IDs match
    const routineMap = new Map<string, InstructionalRoutine>();
    DEFAULT_ROUTINES.forEach((r) => routineMap.set(r.id, r));
    cloudRoutines.forEach((r) => routineMap.set(r.id, r));

    return Array.from(routineMap.values());
  }, [cloudRoutines]);

  const [isManagingLibrary, setIsManagingLibrary] = useState(false);
  const [editingRoutine, setEditingRoutine] =
    useState<InstructionalRoutine | null>(null);

  const selectedRoutine = ROUTINES.find((r) => r.id === selectedRoutineId);

  if (isManagingLibrary && isAdmin) {
    return (
      <LibraryManager
        initialRoutine={editingRoutine}
        onClose={() => {
          setIsManagingLibrary(false);
          setEditingRoutine(null);
        }}
      />
    );
  }

  if (selectedRoutine) {
    return <RoutineView widget={widget} selectedRoutine={selectedRoutine} />;
  }

  return (
    <LibraryView
      widget={widget}
      routines={ROUTINES}
      onManage={(routine) => {
        setEditingRoutine(routine ?? null);
        setIsManagingLibrary(true);
      }}
    />
  );
};
