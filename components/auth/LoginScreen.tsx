import React from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();
  const [signingIn, setSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-4xl font-black text-slate-800 mb-4">
          Classroom Dashboard
        </h1>
        <p className="text-slate-600 mb-8">Sign in to access your dashboards</p>
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
        >
          {signingIn ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
};
