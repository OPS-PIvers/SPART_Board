import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';
import App from '../App';

// Mock Firebase config
vi.mock('../config/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
  isConfigured: true,
  isAuthBypass: false,
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    callback(null);
    return () => undefined;
  }),
  setPersistence: vi.fn(),
  browserLocalPersistence: 'LOCAL',
}));

// Mock Auth Context
vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isAdmin: false,
    signInWithGoogle: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Dashboard Context
vi.mock('../context/DashboardContext', () => ({
  useDashboard: () => ({
    activeDashboard: null,
    dashboards: [],
    toasts: [],
  }),
  DashboardProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Student Context
vi.mock('../components/student/StudentContexts', () => ({
  StudentProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Lazy Components
vi.mock('../components/student/StudentApp', () => ({
  StudentApp: () => <div data-testid="student-app">Student App</div>,
}));

vi.mock('../components/auth/LoginScreen', () => ({
  LoginScreen: () => <div data-testid="login-screen">Login Screen</div>,
}));

vi.mock('../components/layout/DashboardView', () => ({
  DashboardView: () => <div data-testid="dashboard-view">Dashboard View</div>,
}));

vi.mock('../components/layout/UpdateNotification', () => ({
  UpdateNotification: () => null,
}));

vi.mock('../components/admin/AdminWeatherFetcher', () => ({
  AdminWeatherFetcher: () => null,
}));

describe('App Component', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location mock
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, pathname: '/' },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders LoginScreen when not authenticated', async () => {
    render(<App />);

    // Should show fallback initially or resolve quickly
    // Since we mocked the modules, the lazy load should resolve

    await waitFor(() => {
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    });
  });

  it('renders StudentApp when on join route', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, pathname: '/join' },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('student-app')).toBeInTheDocument();
    });
  });
});
