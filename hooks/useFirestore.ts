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
import { db } from '../config/firebase';
import { Dashboard } from '../types';

import { useCallback, useMemo } from 'react';

export const useFirestore = (userId: string | null) => {
  const dashboardsRef = useMemo(
    () => (userId ? collection(db, 'users', userId, 'dashboards') : null),
    [userId]
  );

  const loadDashboards = useCallback(async (): Promise<Dashboard[]> => {
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
      if (!dashboardsRef) throw new Error('User not authenticated');
      await deleteDoc(doc(dashboardsRef, dashboardId));
    },
    [dashboardsRef]
  );

  const subscribeToDashboards = useCallback(
    (callback: (dashboards: Dashboard[]) => void) => {
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
          callback(dashboards);
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
