import { useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isAuthBypass } from '../config/firebase';
import { Dashboard } from '../types';

// Mock in-memory storage for bypass mode
// Using a module-level variable ensures persistence across re-renders
const mockDashboards: Dashboard[] = [];
const listeners = new Set<
  (dashboards: Dashboard[], hasPendingWrites: boolean) => void
>();

const notifyListeners = () => {
  // Sort by createdAt desc to match Firestore query
  const sorted = [...mockDashboards].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );
  listeners.forEach((callback) => callback(sorted, false));
};

export const useFirestore = (userId: string | null) => {
  const dashboardsRef = useMemo(
    () =>
      !isAuthBypass && userId
        ? collection(db, 'users', userId, 'dashboards')
        : null,
    [userId]
  );

  const loadDashboards = useCallback(async (): Promise<Dashboard[]> => {
    if (isAuthBypass) {
      return [...mockDashboards].sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
    }
    if (!dashboardsRef) return [];
    const snapshot = await getDocs(
      query(dashboardsRef, orderBy('createdAt', 'desc'))
    );
    return snapshot.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id }) as Dashboard
    );
  }, [dashboardsRef]);

  const saveDashboard = useCallback(
    async (dashboard: Dashboard): Promise<void> => {
      if (isAuthBypass) {
        const index = mockDashboards.findIndex((d) => d.id === dashboard.id);
        if (index >= 0) {
          mockDashboards[index] = { ...dashboard };
        } else {
          mockDashboards.push({ ...dashboard });
        }
        notifyListeners();
        return Promise.resolve();
      }

      if (!dashboardsRef) throw new Error('User not authenticated');
      const docRef = doc(dashboardsRef, dashboard.id);
      await setDoc(docRef, {
        ...dashboard,
        updatedAt: Date.now(),
      });
    },
    [dashboardsRef]
  );

  const deleteDashboard = useCallback(
    async (dashboardId: string): Promise<void> => {
      if (isAuthBypass) {
        const index = mockDashboards.findIndex((d) => d.id === dashboardId);
        if (index >= 0) {
          mockDashboards.splice(index, 1);
          notifyListeners();
        }
        return Promise.resolve();
      }

      if (!dashboardsRef) throw new Error('User not authenticated');
      await deleteDoc(doc(dashboardsRef, dashboardId));
    },
    [dashboardsRef]
  );

  const subscribeToDashboards = useCallback(
    (
      callback: (dashboards: Dashboard[], hasPendingWrites: boolean) => void
    ) => {
      if (isAuthBypass) {
        listeners.add(callback);
        // Initial callback
        const sorted = [...mockDashboards].sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        callback(sorted, false);
        return () => {
          listeners.delete(callback);
        };
      }

      if (!dashboardsRef)
        return () => {
          /* no-op */
        };
      return onSnapshot(
        query(dashboardsRef, orderBy('createdAt', 'desc')),
        (snapshot) => {
          const dashboards = snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as Dashboard
          );
          callback(dashboards, snapshot.metadata.hasPendingWrites);
        }
      );
    },
    [dashboardsRef]
  );

  return {
    loadDashboards,
    saveDashboard,
    deleteDashboard,
    subscribeToDashboards,
  };
};
