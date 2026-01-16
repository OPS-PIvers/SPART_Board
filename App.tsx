import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { DashboardProvider } from './context/DashboardContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { DashboardView } from './components/layout/DashboardView';
import { UpdateNotification } from './components/layout/UpdateNotification';
import { isConfigured } from './config/firebase';
import { StudentApp } from './components/student/StudentApp';
import { StudentProvider } from './components/student/StudentContexts';
import { AdminWeatherFetcher } from './components/admin/AdminWeatherFetcher';

const AuthenticatedApp: React.FC = () => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <DashboardProvider>
      {isAdmin && <AdminWeatherFetcher />}
      <DashboardView />
      <UpdateNotification />
    </DashboardProvider>
  );
};

const App: React.FC = () => {
  // Simple routing for Student View
  const pathname = window.location.pathname;
  const isStudentRoute = pathname === '/join' || pathname.startsWith('/join/');

  if (isStudentRoute) {
    return (
      <StudentProvider>
        <StudentApp />
      </StudentProvider>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Configuration Required
          </h1>
          <p className="text-slate-600 mb-6">
            The application is missing Firebase configuration credentials.
            Please check your environment variables or <code>.env</code> file.
          </p>
          <div className="bg-slate-100 p-4 rounded-lg text-left overflow-x-auto">
            <code className="text-sm text-slate-700">
              VITE_FIREBASE_API_KEY=...
              <br />
              VITE_FIREBASE_AUTH_DOMAIN=...
              <br />
              VITE_FIREBASE_PROJECT_ID=...
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default App;
