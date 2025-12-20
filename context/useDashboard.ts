import { useContext } from 'react';
import { DashboardContext, DashboardContextType } from './DashboardContext';

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error('useDashboard must be used within DashboardProvider');
  return context;
};
