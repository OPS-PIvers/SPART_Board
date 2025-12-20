import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { FeaturePermission, WidgetType } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  featurePermissions: FeaturePermission[];
  canAccessWidget: (widgetType: WidgetType) => boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [featurePermissions, setFeaturePermissions] = useState<
    FeaturePermission[]
  >([]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.email));
        setIsAdmin(adminDoc.exists());
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    void checkAdminStatus();
  }, [user]);

  // Listen to feature permissions
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'feature_permissions'),
      (snapshot) => {
        const permissions: FeaturePermission[] = [];
        snapshot.forEach((doc) => {
          permissions.push(doc.data() as FeaturePermission);
        });
        setFeaturePermissions(permissions);
      },
      (error) => {
        console.error('Error loading feature permissions:', error);
      }
    );

    return unsubscribe;
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Check if user can access a specific widget
  const canAccessWidget = (widgetType: WidgetType): boolean => {
    if (!user) return false;

    const permission = featurePermissions.find(
      (p) => p.widgetType === widgetType
    );

    // If no permission record exists, allow access (default behavior)
    if (!permission) return true;

    // If the feature is disabled, no one can access it
    if (!permission.enabled) return false;

    // Admins can access everything
    if (isAdmin) return true;

    // Check access level
    switch (permission.accessLevel) {
      case 'admin':
        return false; // Only admins can access
      case 'beta':
        return permission.betaUsers.includes(user.email || '');
      case 'public':
        return true;
      default:
        return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        featurePermissions,
        canAccessWidget,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
