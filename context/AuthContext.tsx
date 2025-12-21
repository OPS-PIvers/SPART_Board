import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
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
  isAdmin: boolean | null; // null = admin status not yet determined
  featurePermissions: FeaturePermission[];
  canAccessWidget: (widgetType: WidgetType) => boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check for auth bypass flag
const isAuthBypass = import.meta.env.VITE_AUTH_BYPASS === 'true';

// Mock user for bypass mode
const MOCK_USER = {
  uid: 'mock-user-id',
  email: 'mock@example.com',
  displayName: 'Mock User',
  emailVerified: true,
  isAnonymous: false,
  photoURL: null,
  phoneNumber: null,
  providerData: [],
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  tenantId: null,
  delete: async () => {
    // Mock delete
    await Promise.resolve();
  },
  getIdToken: async () => {
    // Mock token
    await Promise.resolve();
    return 'mock-token';
  },
  getIdTokenResult: async () => {
    // Mock token result
    await Promise.resolve();
    return {
      token: 'mock-token',
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      signInProvider: 'google',
      signInSecondFactor: null,
      claims: {},
    };
  },
  reload: async () => {
    // Mock reload
    await Promise.resolve();
  },
  toJSON: () => ({}),
} as unknown as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(
    isAuthBypass ? MOCK_USER : null
  );
  const [loading, setLoading] = useState(!isAuthBypass);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(
    isAuthBypass ? true : null
  ); // null = not yet checked
  const [featurePermissions, setFeaturePermissions] = useState<
    FeaturePermission[]
  >([]);

  // Check if user is admin
  useEffect(() => {
    if (isAuthBypass) return;

    const checkAdminStatus = async () => {
      if (!user?.email) {
        setIsAdmin(null);
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

  // Listen to feature permissions (only when authenticated)
  useEffect(() => {
    if (isAuthBypass) return;

    // Don't set up listener if user is not authenticated
    if (!user) {
      // Don't call setState synchronously in an effect - let it happen naturally
      return;
    }

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
  }, [user]);

  // Auth state listener
  useEffect(() => {
    if (isAuthBypass) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Check if user can access a specific widget
  // Wrapped in useCallback to prevent unnecessary re-renders since this function
  // is passed through context and used in component dependencies
  const canAccessWidget = useCallback(
    (widgetType: WidgetType): boolean => {
      if (!user) return false;

      // In bypass mode, allow everything if no permissions are set
      if (isAuthBypass && featurePermissions.length === 0) return true;

      const permission = featurePermissions.find(
        (p) => p.widgetType === widgetType
      );

      // Default behavior: If no permission record exists, allow public access
      // This means new widgets are accessible to all authenticated users until
      // an admin explicitly configures permissions
      if (!permission) return true;

      // If the feature is disabled, no one can access it (including admins)
      if (!permission.enabled) return false;

      // Admins can access everything (except disabled features)
      if (isAdmin) return true;

      // Check access level for non-admin users
      switch (permission.accessLevel) {
        case 'admin':
          return false; // Only admins can access
        case 'beta':
          return permission.betaUsers.includes(user.email ?? '');
        case 'public':
          return true;
        default:
          return false;
      }
    },
    [user, featurePermissions, isAdmin]
  );

  const signInWithGoogle = async () => {
    if (isAuthBypass) {
      console.warn('Bypassing Google Sign In');
      setUser(MOCK_USER);
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
    if (isAuthBypass) {
      console.warn('Bypassing Sign Out');
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
