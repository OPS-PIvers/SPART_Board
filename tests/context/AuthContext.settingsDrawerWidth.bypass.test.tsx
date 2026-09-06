import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/context/useAuth';
import type { AuthContextType } from '@/context/AuthContextValue';

/**
 * §4.6 under `VITE_AUTH_BYPASS`: `settingsDrawerWidth` must stay in memory
 * only — no userProfile document exists for the mock user, so a write would
 * either no-op or throw. Forces `isAuthBypass` true via a config/firebase
 * mock; kept in its own file since that module-level flag can't be toggled
 * per-test within a shared module registry.
 */

vi.mock('@/config/firebase', () => ({
  isAuthBypass: true,
  isConfigured: true,
  auth: { currentUser: null },
  googleProvider: {},
  db: {},
  functions: {},
  GOOGLE_OAUTH_SCOPES: [],
  GOOGLE_DRIVE_FILE_SCOPE: 'drive.file',
  GOOGLE_SHEETS_SCOPE: 'sheets',
  GOOGLE_CALENDAR_READONLY_SCOPE: 'calendar.readonly',
}));

vi.mock('firebase/auth', async () => {
  const actual =
    await vi.importActual<typeof import('firebase/auth')>('firebase/auth');
  return {
    ...actual,
    onAuthStateChanged: vi.fn(() => () => undefined),
    signInWithPopup: vi.fn(),
    // Reject anonymous sign-in so AuthContext falls back to its synchronous
    // MOCK_USER path rather than a real anon-auth round trip.
    signInAnonymously: vi
      .fn()
      .mockRejectedValue(new Error('anonymous auth disabled in test')),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({
    __path: segments.join('/'),
  })),
  collection: vi.fn((_db: unknown, ...segments: string[]) => ({
    __path: segments.join('/'),
  })),
  getDoc: vi
    .fn()
    .mockResolvedValue({ exists: () => false, data: () => undefined }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn(() => () => undefined),
}));

const ctxHolder: { current: AuthContextType | null } = { current: null };

const Probe: React.FC = () => {
  const ctx = useAuth();
  React.useEffect(() => {
    ctxHolder.current = ctx;
  });
  return null;
};

function getCtx(): AuthContextType {
  if (!ctxHolder.current) {
    throw new Error('AuthContext was never captured by the Probe');
  }
  return ctxHolder.current;
}

beforeEach(() => {
  ctxHolder.current = null;
});

describe('AuthContext — settingsDrawerWidth under auth bypass', () => {
  it('defaults to 400 and stays in memory only on write (no Firestore call)', async () => {
    const firestore = await import('firebase/firestore');

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(ctxHolder.current?.user).not.toBeNull();
    });
    expect(getCtx().settingsDrawerWidth).toBe(400);

    vi.mocked(firestore.setDoc).mockClear();
    await act(async () => {
      await getCtx().updateUserPreference('settingsDrawerWidth', 480);
    });

    expect(getCtx().settingsDrawerWidth).toBe(480);
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });
});
