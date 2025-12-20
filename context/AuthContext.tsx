import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
      // Initialize with a mock user
      setUser({
        uid: 'mock-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://ui-avatars.com/api/?name=Test+User',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({
          token: 'mock-token',
          signInProvider: 'google',
          claims: {},
          authTime: Date.now().toString(),
          issuedAtTime: Date.now().toString(),
          expirationTime: (Date.now() + 3600000).toString(),
        }),
        reload: async () => {},
        toJSON: () => ({}),
      } as unknown as User);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
      setUser({
        uid: 'mock-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://ui-avatars.com/api/?name=Test+User',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({
          token: 'mock-token',
          signInProvider: 'google',
          claims: {},
          authTime: Date.now().toString(),
          issuedAtTime: Date.now().toString(),
          expirationTime: (Date.now() + 3600000).toString(),
        }),
        reload: async () => {},
        toJSON: () => ({}),
      } as unknown as User);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
      setUser(null);
      return;
    }

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
