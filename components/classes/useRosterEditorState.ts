import { useState, useMemo } from 'react';
import { Student, ClassRoster } from '@/types';
import {
  splitNames,
  mergeNames,
  generateStudentsList,
  findDuplicatePins,
} from '@/components/widgets/Classes/rosterUtils';

/**
 * Shared state hook for the roster editor UI.
 *
 * Consumed by both the in-widget RosterEditor (legacy) and the sidebar
 * RosterEditorModal (new). Keeps all state + compute in one place so the
 * two surfaces can't drift apart.
 */
export function useRosterEditorState(roster: ClassRoster | null) {
  const [name, setName] = useState(roster?.name ?? '');
  const [firsts, setFirsts] = useState(
    roster?.students.map((s) => s.firstName).join('\n') ?? ''
  );
  const [lasts, setLasts] = useState(
    roster?.students.map((s) => s.lastName).join('\n') ?? ''
  );
  const [pins, setPins] = useState(
    roster?.students.map((s) => s.pin).join('\n') ?? ''
  );
  const [showPins, setShowPins] = useState(
    roster?.students.some((s) => s.pin.trim() !== '') ?? false
  );
  const [showLastNames, setShowLastNames] = useState(
    roster?.students.some((s) => s.lastName.trim() !== '') ?? false
  );

  const handleToggleToLastNames = () => {
    if (!showLastNames) {
      const { firsts: newFirsts, lasts: newLasts } = splitNames(firsts);
      setFirsts(newFirsts.join('\n'));
      setLasts(newLasts.join('\n'));
      setShowLastNames(true);
    }
  };

  const handleToggleToSingleField = () => {
    if (showLastNames) {
      const merged = mergeNames(firsts, lasts);
      setFirsts(merged.join('\n'));
      setLasts('');
      setShowLastNames(false);
    }
  };

  const previewStudents: Student[] = useMemo(
    () =>
      generateStudentsList(
        firsts,
        lasts,
        roster?.students,
        showPins ? pins : undefined
      ),
    [firsts, lasts, pins, showPins, roster?.students]
  );

  const duplicatePins = useMemo(
    () => findDuplicatePins(previewStudents),
    [previewStudents]
  );

  return {
    name,
    setName,
    firsts,
    setFirsts,
    lasts,
    setLasts,
    pins,
    setPins,
    showPins,
    setShowPins,
    showLastNames,
    handleToggleToLastNames,
    handleToggleToSingleField,
    previewStudents,
    duplicatePins,
  };
}
