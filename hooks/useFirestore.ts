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

/**
 * Singleton pattern for mock storage in bypass mode.
 * This prevents HMR (Hot Module Replacement) issues and ensures proper
 * lifecycle management during development and testing.
 */
class MockDashboardStore {
  private static instance: MockDashboardStore;
  private dashboards: Dashboard[] = [];
  private listeners = new Set<
    (dashboards: Dashboard[], hasPendingWrites: boolean) => void
  >();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): MockDashboardStore {
    if (!MockDashboardStore.instance) {
      MockDashboardStore.instance = new MockDashboardStore();
    }
    return MockDashboardStore.instance;
  }

  getDashboards(): Dashboard[] {
    return [...this.dashboards].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  }

  saveDashboard(dashboard: Dashboard): void {
    const index = this.dashboards.findIndex((d) => d.id === dashboard.id);
    if (index >= 0) {
      this.dashboards[index] = { ...dashboard };
    } else {
      this.dashboards.push({ ...dashboard });
    }
    this.notifyListeners();
  }

  deleteDashboard(dashboardId: string): void {
    const index = this.dashboards.findIndex((d) => d.id === dashboardId);
    if (index >= 0) {
      this.dashboards.splice(index, 1);
      this.notifyListeners();
    }
  }

  addListener(
    callback: (dashboards: Dashboard[], hasPendingWrites: boolean) => void
  ): void {
    this.listeners.add(callback);
  }

  removeListener(
    callback: (dashboards: Dashboard[], hasPendingWrites: boolean) => void
  ): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const sorted = this.getDashboards();
    this.listeners.forEach((callback) => callback(sorted, false));
  }

  /**
   * Reset the store - useful for testing and clearing state.
   */
  reset(): void {
    this.dashboards = [];
    this.listeners.clear();
  }
}

const mockStore = MockDashboardStore.getInstance();

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
      return mockStore.getDashboards();
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
        mockStore.saveDashboard(dashboard);
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
        mockStore.deleteDashboard(dashboardId);
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
        mockStore.addListener(callback);
        // Initial callback with current state
        callback(mockStore.getDashboards(), false);
        return () => {
          mockStore.removeListener(callback);
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
