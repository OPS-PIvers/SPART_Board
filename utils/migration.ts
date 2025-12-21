import { Dashboard } from '../types';

export const migrateLocalStorageToFirestore = async (
  userId: string,
  saveDashboard: (dashboard: Dashboard) => Promise<void>
): Promise<number> => {
  const localData = localStorage.getItem('classroom_dashboards');
  if (!localData) return 0;

  try {
    const dashboards = JSON.parse(localData) as Dashboard[];

    for (const dashboard of dashboards) {
      await saveDashboard(dashboard);
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('classroom_dashboards');

    return dashboards.length;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
