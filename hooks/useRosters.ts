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
import { User } from 'firebase/auth';
import { ClassRoster, Student } from '../types';
import { db, isAuthBypass } from '../config/firebase';
import { useGoogleDrive } from './useGoogleDrive';
import { useAuth } from '../context/useAuth';

/**
 * Singleton pattern for mock roster storage in bypass mode.
 * This ensures rosters created in bypass mode are properly stored and
 * accessible in the UI, following the same pattern as mockDashboards.
 */
class MockRosterStore {
  private static instance: MockRosterStore;
  private rosters: ClassRoster[] = [];
  private listeners = new Set<(rosters: ClassRoster[]) => void>();

  private constructor() {
    // Private constructor for singleton
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
    const newRoster: ClassRoster = {
      id,
      name,
      students,
      createdAt: Date.now(),
    };
    this.rosters.push(newRoster);
    this.notifyListeners();
  }

  updateRoster(id: string, updates: Partial<ClassRoster>): void {
    const index = this.rosters.findIndex((r) => r.id === id);
    if (index >= 0) {
      this.rosters[index] = { ...this.rosters[index], ...updates };
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

  /**
   * Reset the store - useful for testing and clearing state.
   */
  reset(): void {
    this.rosters = [];
    this.listeners.clear();
  }
}

const mockRosterStore = MockRosterStore.getInstance();

// Helper to validate roster data from Firestore
const validateRoster = (id: string, data: unknown): ClassRoster | null => {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  if (typeof d.name !== 'string') return null;

  const rawStudents = d.students;

  const students: Student[] = Array.isArray(rawStudents)
    ? rawStudents
        .map((s: unknown) => {
          if (!s || typeof s !== 'object') return null;

          const student = s as Record<string, unknown>;

          if (
            typeof student.id === 'string' &&
            typeof student.firstName === 'string' &&
            typeof student.lastName === 'string'
          ) {
            return {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
            };
          }

          return null;
        })
        .filter((s): s is Student => s !== null)
    : [];

  return {
    id,
    name: d.name,
    students,
    createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
  };
};

export const useRosters = (user: User | null) => {
  const [rosters, setRosters] = useState<ClassRoster[]>([]);
  const { isAdmin } = useAuth();
  const { driveService } = useGoogleDrive();
  const [activeRosterId, setActiveRosterIdState] = useState<string | null>(
    () => {
      return localStorage.getItem('spart_active_roster_id');
    }
  );

  const lastExportedRostersRef = useRef<string>('');

  // --- DRIVE SYNC EFFECT ---
  useEffect(() => {
    if (!user || isAdmin || !driveService || rosters.length === 0) return;

    const rostersJson = JSON.stringify(rosters);
    if (rostersJson === lastExportedRostersRef.current) return;

    const timer = setTimeout(() => {
      void driveService
        .uploadFile(
          new Blob([rostersJson], { type: 'application/json' }),
          'rosters.json'
        )
        .then(() => {
          lastExportedRostersRef.current = rostersJson;
        })
        .catch((err) => {
          console.error('Failed to sync rosters to Drive:', err);
        });
    }, 2000); // Debounce roster export

    return () => clearTimeout(timer);
  }, [user, isAdmin, driveService, rosters]);

  // --- ROSTER EFFECT ---
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setRosters([]), 0);
      return () => clearTimeout(timer);
    }

    if (isAuthBypass) {
      // Use mock roster store in bypass mode
      const callback = (rosters: ClassRoster[]) => {
        setRosters(rosters);
      };
      mockRosterStore.addListener(callback);
      // Initial callback with current state
      callback(mockRosterStore.getRosters());
      return () => {
        mockRosterStore.removeListener(callback);
      };
    }

    const rostersRef = collection(db, 'users', user.uid, 'rosters');
    const q = query(rostersRef, orderBy('name'));

    // Track the current subscription to allow fallback cleanup
    let innerUnsubscribe: (() => void) | null = null;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ClassRoster[] = [];
        snapshot.forEach((doc) => {
          const validated = validateRoster(doc.id, doc.data());
          if (validated) loaded.push(validated);
        });
        setRosters(loaded);
      },
      (error) => {
        console.error('Roster subscription error:', error);
        // Fallback if index isn't created yet: try without orderBy
        if (error.code === 'failed-precondition') {
          innerUnsubscribe = onSnapshot(rostersRef, (innerSnapshot) => {
            const innerLoaded: ClassRoster[] = [];
            innerSnapshot.forEach((doc) => {
              const validated = validateRoster(doc.id, doc.data());
              if (validated) innerLoaded.push(validated);
            });
            innerLoaded.sort((a, b) => a.name.localeCompare(b.name));
            setRosters(innerLoaded);
          });
        }
      }
    );

    return () => {
      unsubscribe();
      if (innerUnsubscribe) innerUnsubscribe();
    };
  }, [user]);

  // --- ROSTER ACTIONS ---
  const addRoster = useCallback(
    async (name: string, students: Student[] = []) => {
      if (!user) throw new Error('No user');

      if (isAuthBypass) {
        const id = 'mock-roster-id-' + Date.now();
        mockRosterStore.addRoster(id, name, students);
        return id;
      }

      const newRoster = { name, students, createdAt: Date.now() };
      const ref = await addDoc(
        collection(db, 'users', user.uid, 'rosters'),
        newRoster
      );
      return ref.id;
    },
    [user]
  );

  const updateRoster = useCallback(
    async (id: string, updates: Partial<ClassRoster>) => {
      if (!user) return;

      if (isAuthBypass) {
        mockRosterStore.updateRoster(id, updates);
        return;
      }

      await updateDoc(doc(db, 'users', user.uid, 'rosters', id), updates);
    },
    [user]
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

      await deleteDoc(doc(db, 'users', user.uid, 'rosters', id));
      if (activeRosterId === id) setActiveRoster(null);
    },
    [user, activeRosterId, setActiveRoster]
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
