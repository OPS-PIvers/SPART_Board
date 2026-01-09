import React, { useState } from 'react';
import { useLiveSession } from '../../hooks/useLiveSession';
import { StudentLobby } from './StudentLobby';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { Snowflake, Radio } from 'lucide-react';
import { WidgetData, WidgetConfig } from '../../types';

export const StudentApp = () => {
  const [joinedCode, setJoinedCode] = useState<string | null>(null);

  // Hook usage for 'student' role
  const { session, loading, joinSession, studentId } = useLiveSession(
    undefined,
    'student',
    joinedCode ?? undefined
  );

  const handleJoin = async (code: string, name: string) => {
    try {
      const sessionId = await joinSession(name, code);
      setJoinedCode(sessionId);
    } catch (error) {
      console.error('Join error:', error);
      alert('Could not join session. Check the code and try again.');
    }
  };

  // 1. Lobby State
  if (!joinedCode || !studentId) {
    return <StudentLobby onJoin={handleJoin} isLoading={loading} />;
  }

  // 2. Waiting State (Joined but no active widget)
  if (!session?.isActive || !session?.activeWidgetId) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-400 animate-in fade-in">
        <Radio className="w-12 h-12 mb-4 animate-pulse text-indigo-500" />
        <h2 className="text-xl font-bold text-white">Connected</h2>
        <p>Waiting for teacher to start an activity...</p>
      </div>
    );
  }

  // 3. Frozen State Overlay
  if (session.frozen) {
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
  const activeWidgetStub: WidgetData = {
    id: session.activeWidgetId,
    type: session.activeWidgetType ?? 'clock',
    x: 0,
    y: 0,
    w: 12,
    h: 12,
    z: 1,
    flipped: false,
    config: session.activeWidgetConfig ?? ({} as WidgetConfig),
    isLive: true,
  };

  return (
    <div className="h-screen w-screen bg-slate-100 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 z-50" />
      <div className="h-full w-full p-4">
        {/* Pass isStudentView to render content without window chrome */}
        <WidgetRenderer widget={activeWidgetStub} isStudentView={true} />
      </div>
    </div>
  );
};
