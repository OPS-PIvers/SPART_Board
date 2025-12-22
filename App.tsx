import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { DashboardProvider } from './context/DashboardContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { DashboardView } from './components/layout/DashboardView';
import { AdminSettings } from './components/admin/AdminSettings';
import { LogOut, Settings } from 'lucide-react';
import { isConfigured } from './config/firebase';

const AuthenticatedApp: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [showAdminSettings, setShowAdminSettings] = useState(false);

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <DashboardProvider>
      <DashboardView />
      {/* User profile and sign-out button */}
      <div className="fixed top-6 left-6 z-[999] flex items-center gap-3">
        <img
          src={user.photoURL ?? ''}
          alt={user.displayName ?? 'User'}
          className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
        />
        <span className="text-white font-semibold text-sm drop-shadow-lg">
          {user.displayName}
        </span>
        {isAdmin && (
          <button
            onClick={() => setShowAdminSettings(true)}
            className="p-3 bg-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
            title="Admin Settings"
          >
            <Settings className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <button
          onClick={signOut}
          className="p-3 bg-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
          title="Sign out"
        >
          <LogOut className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Admin Settings Modal */}
      {showAdminSettings && (
        <AdminSettings onClose={() => setShowAdminSettings(false)} />
      )}
    </DashboardProvider>
  );
};

const App: React.FC = () => {
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
