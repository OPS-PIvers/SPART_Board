import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { DashboardView } from './components/layout/DashboardView';
import { LogOut } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <DashboardProvider>
      <DashboardView />
      {/* User profile and sign-out button */}
      <div className="fixed top-6 left-6 z-[999] flex items-center gap-3">
        <img
          src={user.photoURL || ''}
          alt={user.displayName || 'User'}
          className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
        />
        <span className="text-white font-semibold text-sm drop-shadow-lg">
          {user.displayName}
        </span>
        <button
          onClick={signOut}
          className="p-3 bg-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
          title="Sign out"
        >
          <LogOut className="w-5 h-5 text-slate-700" />
        </button>
      </div>
    </DashboardProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default App;
