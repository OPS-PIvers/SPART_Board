import React, { useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, isAuthBypass } from '../config/firebase';
import {
  FeaturePermission,
  WidgetType,
  GlobalFeaturePermission,
  GlobalFeature,
} from '../types';
import { AuthContext } from './AuthContextValue';

/**
 * IMPORTANT: Authentication bypass / mock user mode
 *
 * This file supports a special "auth bypass" mode controlled by `isAuthBypass`
 * from `config/firebase.ts`. When that flag is enabled, the app skips the
 * normal Firebase Authentication flow and instead uses a local mock `User`
 * instance (`MOCK_USER`) as if a real Firebase user had signed in.
 *
 * SECURITY IMPLICATIONS
 * ---------------------
 * - This mechanism is intended ONLY for local development, automated tests,
 *   or tightly controlled demo environments.
 * - It MUST NOT be enabled in production, staging, or any environment exposed
 *   to untrusted users. Treat it like a "god mode" that removes real auth.
 * - The mock user is created entirely on the client. Any code that trusts
 *   client-side state alone (without verifying Firebase ID tokens and claims)
 *   would be insecure if auth bypass were accidentally enabled in production.
 *
 * FIRESTORE RULES AND SERVER-SIDE ENFORCEMENT
 * -------------------------------------------
 * - Firestore Security Rules remain the ultimate source of truth for data
 *   access. They must NEVER assume that auth bypass is active.
 * - Rules and any server-side logic (Cloud Functions, backend services) should
 *   always authorize based on verified Firebase Auth tokens and claims, not
 *   on any client-side flags or the presence of `MOCK_USER`.
 * - Do not grant privileged access solely because this context reports an
 *   authenticated user; backends must still validate the ID token issued by
 *   Firebase Auth. In bypass mode, any such token is mock data and MUST NOT
 *   be accepted by trusted backends.
 *
 * USAGE GUIDELINES
 * ----------------
 * - Ensure `isAuthBypass` is derived from a development-only configuration
 *   (e.g., dev env var) and defaults to `false`.
 * - Never commit or deploy configuration that enables auth bypass in
 *   production builds.
 * - Any future changes to auth or permissions logic should be reviewed with
 *   this bypass mode in mind to avoid accidentally weakening security.
 */

// Constants for mock data consistency
const MOCK_TOKEN = 'mock-token';
const MOCK_TIME = new Date().toISOString(); // Fixed time at module load

/**
 * Mock user object for bypass mode.
 * Defined at module level to ensure referential equality.
 * Timestamps are fixed at module load time for consistency.
 */
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
    creationTime: MOCK_TIME,
    lastSignInTime: MOCK_TIME,
  },
  tenantId: null,
  delete: () => {
    // No-op for mock user
    return Promise.resolve();
  },
  getIdToken: () => {
    // Return fixed mock token
    return Promise.resolve(MOCK_TOKEN);
  },
  getIdTokenResult: () => {
    // Return fixed mock token result with consistent timestamps
    return Promise.resolve({
      token: MOCK_TOKEN,
      expirationTime: new Date(
        new Date(MOCK_TIME).getTime() + 3600000
      ).toISOString(),
      authTime: MOCK_TIME,
      issuedAtTime: MOCK_TIME,
      signInProvider: 'google',
      signInSecondFactor: null,
      claims: {},
    });
  },
  reload: () => {
    // No-op for mock user
    return Promise.resolve();
  },
  toJSON: () => ({}),
} as unknown as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(
    isAuthBypass ? MOCK_USER : null
  );
  // Note: In bypass mode we initialize `loading` to false because the mock user
  // and admin status are set synchronously above. This makes the auth state
  // appear "ready" immediately for faster local development and testing.
  const [loading, setLoading] = useState(!isAuthBypass);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(
    isAuthBypass ? true : null
  ); // null = not yet checked
  const [featurePermissions, setFeaturePermissions] = useState<
    FeaturePermission[]
  >([]);
  const [globalPermissions, setGlobalPermissions] = useState<
    GlobalFeaturePermission[]
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
        const adminDoc = await getDoc(
          doc(db, 'admins', user.email.toLowerCase())
        );
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

    const globalUnsubscribe = onSnapshot(
      collection(db, 'global_permissions'),
      (snapshot) => {
        const permissions: GlobalFeaturePermission[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as GlobalFeaturePermission;
          // Ensure featureId is preserved
          if (!data.featureId) data.featureId = doc.id as GlobalFeature;
          permissions.push(data);
        });
        setGlobalPermissions(permissions);
      },
      (error) => {
        // Only log if we are still authenticated to avoid noise during sign-out
        if (auth.currentUser) {
          console.error('Error loading global permissions:', error);
        }
      }
    );

    return () => {
      unsubscribe();
      globalUnsubscribe();
    };
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
      // In bypass mode, always allow everything
      if (isAuthBypass) return true;

      if (!user) return false;

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

  const canAccessFeature = useCallback(
    (featureId: GlobalFeature): boolean => {
      if (isAuthBypass) return true;
      if (!user) return false;

      const permission = globalPermissions.find(
        (p) => p.featureId === featureId
      );

      if (!permission) return true;
      if (!permission.enabled) return false;
      if (isAdmin) return true;

      switch (permission.accessLevel) {
        case 'admin':
          return false;
        case 'beta':
          return permission.betaUsers.includes(user.email ?? '');
        case 'public':
          return true;
        default:
          return false;
      }
    },
    [user, globalPermissions, isAdmin]
  );

  const signInWithGoogle = async () => {
    if (isAuthBypass) {
      console.warn('Bypassing Google Sign In');
      setUser(MOCK_USER);
      setIsAdmin(true); // Restore admin status on sign in
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
      setIsAdmin(null); // Clear admin status on sign out (consistent with non-bypass behavior)
      setFeaturePermissions([]); // Clear feature permissions on sign out in bypass mode
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
        globalPermissions,
        canAccessWidget,
        canAccessFeature,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
