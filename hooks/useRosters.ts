import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { deleteField } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { ClassRoster, ClassRosterMeta, Student } from '../types';
import { db, isAuthBypass } from '../config/firebase';
import { useGoogleDrive } from './useGoogleDrive';

/**
 * Assigns zero-padded sequential PINs to students that don't have one yet.
 * Returns a new array — does not mutate the input.
 */
function assignPins(students: Student[]): Student[] {
  return students.map((s, i) => ({
    ...s,
    pin: s.pin ?? String(i + 1).padStart(2, '0'),
  }));
}

/**
 * Drive folder path for per-roster student files.
 * Structure: SPART Board/Data/Rosters/{rosterId}.json → Student[]
 */
const ROSTER_DRIVE_FOLDER = 'Data/Rosters';

/**
 * localStorage key used to track whether the one-time PII migration
 * (moving students[] from Firestore docs into Drive files) has run.
 */
const MIGRATION_KEY = 'spart_roster_pii_migrated_v1';

// ─── Mock store (auth-bypass mode) ────────────────────────────────────────────

/**
 * Singleton pattern for mock roster storage in bypass mode.
 * Students are stored in memory alongside roster metadata.
 */
class MockRosterStore {
  private static instance: MockRosterStore;
  private rosters: ClassRoster[] = [];
  private listeners = new Set<(rosters: ClassRoster[]) => void>();

  private constructor() {
    // Singleton — use getInstance()
  }

  static getInstance(): MockRosterStore {
    if (!MockRosterStore.instance) {
      MockRosterStore.instance = new MockRosterStore();
    }
    return MockRosterStore.instance;
  }

  getRosters(): ClassRoster[] {
    return [...this.rosters].sort((a, b) => a.name.localeCompare(b.name));
  }

  addRoster(id: string, name: string, students: Student[]): void {
    const withPins = assignPins(students);
    const newRoster: ClassRoster = {
      id,
      name,
      students: withPins,
      driveFileId: null,
      studentCount: withPins.length,
      createdAt: Date.now(),
    };
    this.rosters.push(newRoster);
    this.notifyListeners();
  }

  updateRoster(id: string, updates: Partial<ClassRoster>): void {
    const index = this.rosters.findIndex((r) => r.id === id);
    if (index >= 0) {
      const updated = { ...this.rosters[index], ...updates };
      if (updates.students !== undefined) {
        updated.students = assignPins(updates.students);
        updated.studentCount = updated.students.length;
      }
      this.rosters[index] = updated;
      this.notifyListeners();
    }
  }

  deleteRoster(id: string): void {
    const index = this.rosters.findIndex((r) => r.id === id);
    if (index >= 0) {
      this.rosters.splice(index, 1);
      this.notifyListeners();
    }
  }

  addListener(callback: (rosters: ClassRoster[]) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (rosters: ClassRoster[]) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const sorted = this.getRosters();
    this.listeners.forEach((callback) => callback(sorted));
  }

  reset(): void {
    this.rosters = [];
    this.listeners.clear();
  }
}

const mockRosterStore = MockRosterStore.getInstance();

// ─── Firestore validation ──────────────────────────────────────────────────────

/**
 * Validates and normalises a raw Firestore document into ClassRosterMeta.
 * Note: the `students` field is intentionally ignored — it lives in Drive.
 */
const validateRosterMeta = (
  id: string,
  data: unknown
): ClassRosterMeta | null => {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (typeof d.name !== 'string') return null;

  return {
    id,
    name: d.name,
    driveFileId: typeof d.driveFileId === 'string' ? d.driveFileId : null,
    studentCount: typeof d.studentCount === 'number' ? d.studentCount : 0,
    createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
  };
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useRosters = (user: User | null) => {
  // In-memory rosters include the students array loaded from Drive.
  const [rosters, setRosters] = useState<ClassRoster[]>([]);
  const { driveService } = useGoogleDrive();
  const [activeRosterId, setActiveRosterIdState] = useState<string | null>(() =>
    localStorage.getItem('spart_active_roster_id')
  );

  // Cache of rosterId → Student[] already loaded from Drive (avoids re-fetching)
  const studentsCacheRef = useRef<Map<string, Student[]>>(new Map());
  // Roster metadata from Firestore snapshot (no students)
  const metaListRef = useRef<ClassRosterMeta[]>([]);

  // ─── Helper: upload Student[] to Drive and return the file ID ─────────────

  const uploadStudentsToDrive = useCallback(
    async (rosterId: string, students: Student[]): Promise<string> => {
      if (!driveService) throw new Error('Drive not available');
      const blob = new Blob([JSON.stringify(students)], {
        type: 'application/json',
      });
      const file = await driveService.uploadFile(
        blob,
        `${rosterId}.json`,
        ROSTER_DRIVE_FOLDER
      );
      return file.id;
    },
    [driveService]
  );

  // ─── Helper: load Student[] from Drive by file ID ─────────────────────────

  const loadStudentsFromDrive = useCallback(
    async (driveFileId: string): Promise<Student[]> => {
      if (!driveService) return [];
      try {
        const blob = await driveService.downloadFile(driveFileId);
        const text = await blob.text();
        const parsed = JSON.parse(text) as unknown;
        if (!Array.isArray(parsed)) return [];
        return (parsed as unknown[])
          .map((s) => {
            if (!s || typeof s !== 'object') return null;
            const student = s as Record<string, unknown>;
            if (
              typeof student.id === 'string' &&
              typeof student.firstName === 'string' &&
              typeof student.lastName === 'string'
            ) {
              const hasValidPin =
                typeof student.pin === 'string' && student.pin.trim() !== '';
              if (!hasValidPin) {
                console.warn(
                  'Student loaded from Drive without valid PIN; will be reassigned on save:',
                  `id=${String(student.id)}, name=${String(student.firstName)} ${String(student.lastName)}`
                );
              }
              return {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                pin: hasValidPin ? (student.pin as string) : '',
              };
            }
            return null;
          })
          .filter((s): s is Student => s !== null);
      } catch (err) {
        console.error('Failed to load students from Drive:', err);
        return [];
      }
    },
    [driveService]
  );

  // ─── Helper: merge metadata + Drive students into full ClassRoster[] ───────

  const buildRosters = useCallback(
    async (metaList: ClassRosterMeta[]): Promise<ClassRoster[]> => {
      const results: ClassRoster[] = [];
      for (const meta of metaList) {
        let students: Student[] = [];
        if (meta.driveFileId) {
          const cached = studentsCacheRef.current.get(meta.id);
          if (cached) {
            students = cached;
          } else {
            students = await loadStudentsFromDrive(meta.driveFileId);
            studentsCacheRef.current.set(meta.id, students);
          }
        }
        results.push({ ...meta, students });
      }
      return results;
    },
    [loadStudentsFromDrive]
  );

  // ─── One-time migration: move students[] from Firestore docs to Drive ──────

  const runMigrationIfNeeded = useCallback(
    async (
      metaList: ClassRosterMeta[],
      rawSnapDocs: { id: string; data: () => unknown }[]
    ) => {
      if (!driveService || !user) return;
      if (localStorage.getItem(MIGRATION_KEY)) return;

      let didMigrate = false;

      for (const docSnap of rawSnapDocs) {
        const raw = docSnap.data() as Record<string, unknown>;

        // Only migrate docs that still have a students[] array in Firestore
        if (!Array.isArray(raw.students) || raw.students.length === 0) continue;

        const rawStudents = raw.students as Record<string, unknown>[];
        const students: Student[] = rawStudents
          .map((s) => {
            if (
              typeof s.id === 'string' &&
              typeof s.firstName === 'string' &&
              typeof s.lastName === 'string'
            ) {
              return {
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                pin: typeof s.pin === 'string' ? s.pin : '',
              };
            }
            return null;
          })
          .filter((s): s is Student => s !== null);

        const withPins = assignPins(students);

        try {
          const driveFileId = await uploadStudentsToDrive(docSnap.id, withPins);
          await updateDoc(doc(db, 'users', user.uid, 'rosters', docSnap.id), {
            driveFileId,
            studentCount: withPins.length,
            students: deleteField(), // Remove PII from Firestore
          });
          studentsCacheRef.current.set(docSnap.id, withPins);
          // Update local meta
          const idx = metaListRef.current.findIndex((m) => m.id === docSnap.id);
          if (idx >= 0) {
            metaListRef.current[idx] = {
              ...metaListRef.current[idx],
              driveFileId,
              studentCount: withPins.length,
            };
          }
          didMigrate = true;
          console.warn(
            `[PII Migration] Moved students for roster ${docSnap.id} to Drive`
          );
        } catch (err) {
          console.error(
            `[PII Migration] Failed for roster ${docSnap.id}:`,
            err
          );
        }
      }

      if (
        didMigrate ||
        rawSnapDocs.every((d) => {
          const raw = d.data() as Record<string, unknown>;
          return !Array.isArray(raw.students) || raw.students.length === 0;
        })
      ) {
        localStorage.setItem(MIGRATION_KEY, '1');
      }
    },
    [driveService, user, uploadStudentsToDrive]
  );

  // ─── Firestore snapshot listener ──────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setRosters([]), 0);
      return () => clearTimeout(timer);
    }

    if (isAuthBypass) {
      const callback = (updatedRosters: ClassRoster[]) =>
        setRosters(updatedRosters);
      mockRosterStore.addListener(callback);
      callback(mockRosterStore.getRosters());
      return () => mockRosterStore.removeListener(callback);
    }

    const rostersRef = collection(db, 'users', user.uid, 'rosters');
    const q = query(rostersRef, orderBy('name'));

    let innerUnsubscribe: (() => void) | null = null;

    const handleSnapshot = (rawDocs: { id: string; data: () => unknown }[]) => {
      const metaList = rawDocs
        .map((d) => validateRosterMeta(d.id, d.data()))
        .filter((m): m is ClassRosterMeta => m !== null);

      metaListRef.current = metaList;

      // Run one-time migration (async, fire-and-forget)
      void runMigrationIfNeeded(metaList, rawDocs);

      // Invalidate cache for any roster whose driveFileId changed
      for (const meta of metaList) {
        const cached = studentsCacheRef.current.get(meta.id);
        // If cache exists but driveFileId changed, bust it
        if (cached && !meta.driveFileId) {
          studentsCacheRef.current.delete(meta.id);
        }
      }

      void buildRosters(metaList).then((full) => setRosters(full));
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => handleSnapshot(snapshot.docs),
      (error) => {
        console.error('Roster subscription error:', error);
        if (error.code === 'failed-precondition') {
          innerUnsubscribe = onSnapshot(rostersRef, (innerSnapshot) =>
            handleSnapshot(innerSnapshot.docs)
          );
        }
      }
    );

    return () => {
      unsubscribe();
      if (innerUnsubscribe) innerUnsubscribe();
    };
  }, [user, buildRosters, runMigrationIfNeeded]);

  // ─── CRUD actions ─────────────────────────────────────────────────────────

  const addRoster = useCallback(
    async (name: string, students: Student[] = []) => {
      if (!user) throw new Error('No user');

      if (isAuthBypass) {
        const id = 'mock-roster-id-' + Date.now();
        mockRosterStore.addRoster(id, name, students);
        return id;
      }

      const withPins = assignPins(students);

      // Write metadata-only to Firestore first to get the document ID
      const firestoreData: Omit<ClassRosterMeta, 'id'> = {
        name,
        driveFileId: null,
        studentCount: withPins.length,
        createdAt: Date.now(),
      };
      const ref = await addDoc(
        collection(db, 'users', user.uid, 'rosters'),
        firestoreData
      );

      // Upload students to Drive (if Drive is available)
      if (driveService && withPins.length > 0) {
        try {
          const driveFileId = await uploadStudentsToDrive(ref.id, withPins);
          await updateDoc(doc(db, 'users', user.uid, 'rosters', ref.id), {
            driveFileId,
          });
          studentsCacheRef.current.set(ref.id, withPins);
        } catch (err) {
          console.error('Failed to upload roster students to Drive:', err);
          // Roster is still usable — Drive sync will retry next time
        }
      } else if (withPins.length > 0) {
        studentsCacheRef.current.set(ref.id, withPins);
      }

      return ref.id;
    },
    [user, driveService, uploadStudentsToDrive]
  );

  const updateRoster = useCallback(
    async (id: string, updates: Partial<ClassRoster>) => {
      if (!user) return;

      if (isAuthBypass) {
        mockRosterStore.updateRoster(id, updates);
        return;
      }

      // Separate student data from metadata
      const { students, ...metaUpdates } = updates;

      if (students !== undefined) {
        const withPins = assignPins(students);

        // Optimistically update cache
        studentsCacheRef.current.set(id, withPins);

        // Reflect in local state immediately
        setRosters((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, students: withPins, studentCount: withPins.length }
              : r
          )
        );

        // Upload to Drive
        if (driveService) {
          try {
            const driveFileId = await uploadStudentsToDrive(id, withPins);
            await updateDoc(doc(db, 'users', user.uid, 'rosters', id), {
              ...metaUpdates,
              driveFileId,
              studentCount: withPins.length,
            });
          } catch (err) {
            console.error('Failed to upload updated roster to Drive:', err);
            // Fall through — Firestore metadata still updated without driveFileId change
            if (Object.keys(metaUpdates).length > 0) {
              await updateDoc(
                doc(db, 'users', user.uid, 'rosters', id),
                metaUpdates
              );
            }
          }
        } else {
          // Drive unavailable — update count in Firestore at least
          await updateDoc(doc(db, 'users', user.uid, 'rosters', id), {
            ...metaUpdates,
            studentCount: withPins.length,
          });
        }
      } else if (Object.keys(metaUpdates).length > 0) {
        // No student changes — just update metadata fields
        await updateDoc(doc(db, 'users', user.uid, 'rosters', id), metaUpdates);
      }
    },
    [user, driveService, uploadStudentsToDrive]
  );

  const setActiveRoster = useCallback((id: string | null) => {
    setActiveRosterIdState(id);
    if (id) localStorage.setItem('spart_active_roster_id', id);
    else localStorage.removeItem('spart_active_roster_id');
  }, []);

  const deleteRoster = useCallback(
    async (id: string) => {
      if (!user) return;

      if (isAuthBypass) {
        mockRosterStore.deleteRoster(id);
        if (activeRosterId === id) setActiveRoster(null);
        return;
      }

      // Delete Drive file if we know its ID
      const meta = metaListRef.current.find((m) => m.id === id);
      if (meta?.driveFileId && driveService) {
        driveService.deleteFile(meta.driveFileId).catch((err) => {
          console.error('Failed to delete Drive roster file:', err);
        });
      }

      await deleteDoc(doc(db, 'users', user.uid, 'rosters', id));
      studentsCacheRef.current.delete(id);
      if (activeRosterId === id) setActiveRoster(null);
    },
    [user, activeRosterId, setActiveRoster, driveService]
  );

  return useMemo(
    () => ({
      rosters,
      activeRosterId,
      addRoster,
      updateRoster,
      deleteRoster,
      setActiveRoster,
    }),
    [
      rosters,
      activeRosterId,
      addRoster,
      updateRoster,
      deleteRoster,
      setActiveRoster,
    ]
  );
};
