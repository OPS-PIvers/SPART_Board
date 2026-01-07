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

export const useFirestore = (userId: string | null) => {
  const dashboardsRef = userId
    ? collection(db, 'users', userId, 'dashboards')
    : null;

  const loadDashboards = async (): Promise<Dashboard[]> => {
    if (!dashboardsRef) return [];
    const snapshot = await getDocs(
      query(dashboardsRef, orderBy('createdAt', 'desc'))
    );
    return snapshot.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id }) as Dashboard
    );
  };

  const saveDashboard = async (dashboard: Dashboard): Promise<void> => {
    if (!dashboardsRef) throw new Error('User not authenticated');
    const docRef = doc(dashboardsRef, dashboard.id);
    await setDoc(docRef, {
      ...dashboard,
      updatedAt: Date.now(),
    });
  };

  const deleteDashboard = async (dashboardId: string): Promise<void> => {
    if (!dashboardsRef) throw new Error('User not authenticated');
    await deleteDoc(doc(dashboardsRef, dashboardId));
  };

  const subscribeToDashboards = (
    callback: (dashboards: Dashboard[], hasPendingWrites: boolean) => void
  ) => {
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
  };

  return {
    loadDashboards,
    saveDashboard,
    deleteDashboard,
    subscribeToDashboards,
  };
};
