import { createContext } from 'react';
import { User } from 'firebase/auth';
import { FeaturePermission, WidgetType } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean | null; // null = admin status not yet determined
  featurePermissions: FeaturePermission[];
  canAccessWidget: (widgetType: WidgetType) => boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
