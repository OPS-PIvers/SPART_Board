import React, { useState, useEffect } from 'react';
import { signInAnonymously, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useLiveSession } from '../../hooks/useLiveSession';
import { StudentLobby } from './StudentLobby';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { Snowflake, Radio } from 'lucide-react';
import { WidgetData } from '../../types';
import { getDefaultWidgetConfig } from '../../utils/widgetHelpers';

export const StudentApp = () => {
  const [joinedCode, setJoinedCode] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign in anonymously when component mounts
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        setAuthInitialized(true);
      } catch (error) {
        // Log more detail to help debug restricted operation errors
        console.warn(
          'Anonymous auth failed. If this is a restricted operation error, please ensure "Anonymous" provider is enabled in Firebase Console -> Authentication -> Sign-in method.',
          error
        );
        // We set initialized to true even on failure so the student can still try to join.
        // The joinSession logic in useLiveSession will generate a client-side ID if auth fails.
        setAuthInitialized(true);
      }
    };

    void initAuth();

    // Cleanup anonymous session on unmount
    return () => {
      if (auth.currentUser?.isAnonymous) {
        void signOut(auth).catch((err) =>
          console.error('Failed to sign out on unmount:', err)
        );
      }
    };
  }, []);

  // Hook usage for 'student' role
  const { session, loading, joinSession, studentId, individualFrozen } =
    useLiveSession(undefined, 'student', joinedCode ?? undefined);

  const backgroundStyles = React.useMemo(() => {
    if (!session?.background) return {};
    const bg = session.background;

    if (bg.startsWith('http') || bg.startsWith('data:')) {
      return {
        backgroundImage: `url("${bg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return {};
  }, [session]);

  const backgroundClasses = React.useMemo(() => {
    if (!session?.background) return '';
    const bg = session.background;
    if (bg.startsWith('http') || bg.startsWith('data:')) return '';
    return bg;
  }, [session]);

  const handleJoin = async (code: string, name: string) => {
    setError(null);
    try {
      const sessionId = await joinSession(name, code);
      setJoinedCode(sessionId);
    } catch (error) {
      console.error('Join error:', error);
      let message: string;
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else {
        message = 'Failed to join session due to an unexpected error.';
      }

      if (message.toLowerCase().includes('session not found')) {
        setError('Session not found. Please check your join code.');
      } else if (
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('fetch')
      ) {
        setError('Connection error. Please check your internet.');
      } else {
        setError(message);
      }
    }
  };

  // Wait for auth to initialize before showing lobby
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Initializing...</div>
      </div>
    );
  }

  // 1. Lobby State
  if (!joinedCode || !studentId) {
    return (
      <StudentLobby onJoin={handleJoin} isLoading={loading} error={error} />
    );
  }

  // 2. Waiting State (Joined but no active widget)
  if (!session?.isActive || !session?.activeWidgetId) {
    return (
      <div
        id="dashboard-root"
        className={`h-screen w-screen overflow-hidden relative transition-all duration-1000 ${backgroundClasses}`}
        style={backgroundStyles}
      >
        <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-black/20 backdrop-blur-sm animate-in fade-in">
          <Radio className="w-12 h-12 mb-4 animate-pulse text-white" />
          <h2 className="text-xl font-bold text-white">Connected</h2>
          <p className="text-white/70 font-medium">
            Waiting for teacher to start an activity...
          </p>
        </div>
      </div>
    );
  }

  // 3. Frozen State Overlay (Global or Individual)
  if (session.frozen || individualFrozen) {
    return (
      <div className="fixed inset-0 z-50 bg-indigo-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <Snowflake className="w-20 h-20 mb-6 animate-spin-slow opacity-80" />
        <h1 className="text-4xl font-black mb-4">Eyes on Teacher</h1>
        <p className="text-indigo-200 text-lg">Your screen is paused.</p>
      </div>
    );
  }

  // 4. Active Widget State
  // We mock a Widget object here based on session data.
  // Widget dimensions are set as grid units based on widget type for optimal display
  const getWidgetDimensions = (
    widgetType: string
  ): { w: number; h: number } => {
    // Map widget types to appropriate dimensions in grid units
    // These are interpreted by the layout for full-screen student view
    switch (widgetType) {
      case 'timer':
      case 'stopwatch':
      case 'clock':
        return { w: 8, h: 8 }; // Square for time displays
      case 'text':
      case 'poll':
        return { w: 16, h: 12 }; // Wide for text content
      case 'drawing':
      case 'embed':
        return { w: 16, h: 16 }; // Large for interactive content
      case 'qr':
        return { w: 8, h: 10 }; // Compact for QR codes
      default:
        return { w: 12, h: 12 }; // Default balanced dimensions
    }
  };

  const dimensions = getWidgetDimensions(session.activeWidgetType ?? 'clock');
  const activeWidgetStub: WidgetData = {
    id: session.activeWidgetId,
    type: session.activeWidgetType ?? 'clock',
    x: 0,
    y: 0,
    w: dimensions.w,
    h: dimensions.h,
    z: 1,
    flipped: false,
    config:
      session.activeWidgetConfig ??
      getDefaultWidgetConfig(session.activeWidgetType ?? 'clock'),
    isLive: true,
  };

  return (
    <div
      id="dashboard-root"
      className={`h-screen w-screen overflow-hidden relative transition-all duration-1000 ${backgroundClasses}`}
      style={backgroundStyles}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 z-50" />
      <div className="h-full w-full">
        {/* Pass isStudentView to render content without window chrome */}
        <WidgetRenderer widget={activeWidgetStub} isStudentView={true} />
      </div>
    </div>
  );
};
