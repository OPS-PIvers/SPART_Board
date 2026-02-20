/**
 * QuizWidget — teacher-facing quiz management and live session controller.
 *
 * Views:
 *  manager  → list of saved quizzes
 *  import   → Google Sheet importer
 *  editor   → question editor
 *  preview  → interactive question preview
 *  results  → aggregated session results
 *  monitor  → live session teacher monitor
 */

import React, { useState, useCallback } from 'react';
import { WidgetData, QuizConfig, QuizMetadata, QuizData } from '@/types';
import { useDashboard } from '@/context/useDashboard';
import { useAuth } from '@/context/useAuth';
import { useQuiz } from '@/hooks/useQuiz';
import { useQuizSessionTeacher } from '@/hooks/useQuizSession';
import { QuizManager } from './quiz/QuizManager';
import { QuizImporter } from './quiz/QuizImporter';
import { QuizEditor } from './quiz/QuizEditor';
import { QuizPreview } from './quiz/QuizPreview';
import { QuizResults } from './quiz/QuizResults';
import { QuizLiveMonitor } from './quiz/QuizLiveMonitor';
import { Loader2, AlertTriangle, LogIn } from 'lucide-react';

export const QuizWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, addToast } = useDashboard();
  const { user, googleAccessToken } = useAuth();
  const config = widget.config as QuizConfig;

  const {
    quizzes,
    loading: quizzesLoading,
    error: quizzesError,
    saveQuiz,
    loadQuizData,
    deleteQuiz,
    importFromSheet,
    importFromCSV,
    isDriveConnected,
  } = useQuiz(user?.uid);

  const {
    session: liveSession,
    responses,
    startQuizSession,
    advanceQuestion,
    endQuizSession,
  } = useQuizSessionTeacher(user?.uid);

  // Local state for views that need loaded data
  const [loadedQuizData, setLoadedQuizData] = useState<QuizData | null>(null);
  const [loadingQuizData, setLoadingQuizData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<QuizMetadata | null>(null);

  const setView = useCallback(
    (view: QuizConfig['view']) => {
      updateWidget(widget.id, { config: { ...config, view } as QuizConfig });
    },
    [updateWidget, widget.id, config]
  );

  const loadQuiz = useCallback(
    async (meta: QuizMetadata): Promise<QuizData | null> => {
      setLoadingQuizData(true);
      setDataError(null);
      try {
        const data = await loadQuizData(meta.driveFileId);
        setLoadedQuizData(data);
        setSelectedMeta(meta);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load quiz';
        setDataError(msg);
        addToast(msg, 'error');
        return null;
      } finally {
        setLoadingQuizData(false);
      }
    },
    [loadQuizData, addToast]
  );

  // Auto-load quiz data if we are in monitor view or have an active session, but data is missing
  // This allows for seamless resumption after page reload.
  React.useEffect(() => {
    if (
      !loadedQuizData &&
      !loadingQuizData &&
      quizzes.length > 0 &&
      liveSession &&
      liveSession.status !== 'ended'
    ) {
      // Prioritize the quiz from the live session document itself
      const meta = quizzes.find((q) => q.id === liveSession.quizId);
      if (meta) {
        void loadQuiz(meta);
      } else if (quizzesLoading === false) {
        // If the session exists but the quiz is not in our library (deleted),
        // we should auto-end the session to avoid being stuck.
        console.warn('Active session found for deleted quiz. Auto-ending.');
        void endQuizSession();
        setView('manager');
      }
    }
  }, [
    liveSession,
    loadedQuizData,
    loadingQuizData,
    quizzes,
    loadQuiz,
    quizzesLoading,
    endQuizSession,
    setView,
  ]);

  // ─── Guard: not signed in ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-slate-400 text-center"
        style={{ gap: 'min(12px, 3cqmin)', padding: 'min(24px, 6cqmin)' }}
      >
        <LogIn
          className="opacity-40"
          style={{ width: 'min(32px, 8cqmin)', height: 'min(32px, 8cqmin)' }}
        />
        <p
          className="font-medium text-slate-300"
          style={{ fontSize: 'min(13px, 4.5cqmin)' }}
        >
          Sign in required
        </p>
        <p
          className="text-slate-500"
          style={{ fontSize: 'min(11px, 3.5cqmin)' }}
        >
          Sign in with Google to use the Quiz widget.
        </p>
      </div>
    );
  }

  // ─── Guard: no Drive access ────────────────────────────────────────────────
  if (!isDriveConnected && !googleAccessToken) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-slate-400 text-center"
        style={{ gap: 'min(12px, 3cqmin)', padding: 'min(24px, 6cqmin)' }}
      >
        <AlertTriangle
          className="opacity-40"
          style={{ width: 'min(32px, 8cqmin)', height: 'min(32px, 8cqmin)' }}
        />
        <p
          className="font-medium text-slate-300"
          style={{ fontSize: 'min(13px, 4.5cqmin)' }}
        >
          Drive access needed
        </p>
        <p
          className="text-slate-500"
          style={{ fontSize: 'min(11px, 3.5cqmin)' }}
        >
          Sign out and sign in again to grant Google Drive and Sheets access for
          quiz storage.
        </p>
      </div>
    );
  }

  // ─── Loading overlay ───────────────────────────────────────────────────────
  if (loadingQuizData) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-slate-400"
        style={{ gap: 'min(12px, 3cqmin)' }}
      >
        <Loader2
          className="animate-spin"
          style={{ width: 'min(32px, 8cqmin)', height: 'min(32px, 8cqmin)' }}
        />
        <span style={{ fontSize: 'min(13px, 4.5cqmin)' }}>Loading quiz…</span>
      </div>
    );
  }

  // ─── Views ─────────────────────────────────────────────────────────────────

  const view = config.view ?? 'manager';

  if (view === 'import') {
    return (
      <QuizImporter
        onBack={() => setView('manager')}
        importFromSheet={importFromSheet}
        importFromCSV={importFromCSV}
        onSave={async (quiz) => {
          try {
            await saveQuiz(quiz);
            addToast('Quiz saved to Drive!', 'success');
            setView('manager');
          } catch (err) {
            addToast(
              err instanceof Error ? err.message : 'Save failed',
              'error'
            );
          }
        }}
      />
    );
  }

  if (view === 'editor' && loadedQuizData) {
    return (
      <QuizEditor
        quiz={loadedQuizData}
        onBack={() => {
          setLoadedQuizData(null);
          setView('manager');
        }}
        onSave={async (updated) => {
          await saveQuiz(updated, selectedMeta?.driveFileId);
          setLoadedQuizData(updated);
          addToast('Quiz updated!', 'success');
          setView('manager');
        }}
      />
    );
  }

  if (view === 'preview' && loadedQuizData) {
    return (
      <QuizPreview
        quiz={loadedQuizData}
        onBack={() => {
          setLoadedQuizData(null);
          setView('manager');
        }}
      />
    );
  }

  if (view === 'results' && loadedQuizData) {
    // NOTE: responses here come from the teacher's current quiz_sessions/{uid} document.
    // This means results are only available while the session data is in Firestore
    // (immediately after or during a session). Historical sessions are not yet persisted
    // separately; config.resultsSessionId is reserved for future per-session history.
    return (
      <QuizResults
        quiz={loadedQuizData}
        responses={responses}
        onBack={() => {
          setLoadedQuizData(null);
          setView('manager');
        }}
      />
    );
  }

  if (view === 'monitor' && liveSession) {
    if (!loadedQuizData) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full text-slate-400"
          style={{ gap: 'min(12px, 3cqmin)' }}
        >
          <Loader2
            className="animate-spin"
            style={{ width: 'min(32px, 8cqmin)', height: 'min(32px, 8cqmin)' }}
          />
          <span style={{ fontSize: 'min(13px, 4.5cqmin)' }}>
            Resuming session…
          </span>
        </div>
      );
    }
    return (
      <QuizLiveMonitor
        session={liveSession}
        responses={responses}
        quizData={loadedQuizData}
        onAdvance={async () => {
          await advanceQuestion();
        }}
        onEnd={async () => {
          await endQuizSession();
          setView('manager');
        }}
      />
    );
  }

  // Default: manager view
  return (
    <QuizManager
      quizzes={quizzes}
      loading={quizzesLoading}
      error={quizzesError ?? dataError}
      hasActiveSession={!!(liveSession && liveSession.status !== 'ended')}
      activeQuizId={liveSession?.quizId ?? null}
      onImport={() => setView('import')}
      onResume={() => setView('monitor')}
      onEndSession={async () => {
        await endQuizSession();
        addToast('Session ended.', 'success');
      }}
      onEdit={async (meta) => {
        const data = await loadQuiz(meta);
        if (data) setView('editor');
      }}
      onPreview={async (meta) => {
        const data = await loadQuiz(meta);
        if (data) setView('preview');
      }}
      onGoLive={async (meta, mode) => {
        const data = await loadQuiz(meta);
        if (!data) return;
        try {
          const code = await startQuizSession(data, mode);
          updateWidget(widget.id, {
            config: {
              ...config,
              view: 'monitor',
              selectedQuizId: meta.id,
              selectedQuizTitle: meta.title,
              activeLiveSessionCode: code,
            } as QuizConfig,
          });
        } catch (err) {
          addToast(
            err instanceof Error ? err.message : 'Failed to start session',
            'error'
          );
        }
      }}
      onResults={async (meta) => {
        const data = await loadQuiz(meta);
        if (data) setView('results');
      }}
      onDelete={async (meta) => {
        try {
          await deleteQuiz(meta.id, meta.driveFileId);
          addToast('Quiz deleted.', 'success');
        } catch (err) {
          addToast(
            err instanceof Error ? err.message : 'Delete failed',
            'error'
          );
        }
      }}
    />
  );
};

// Settings panel (back of the widget) — minimal since all management is front-facing
export const QuizWidgetSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast } = useDashboard();
  const { user } = useAuth();
  const { session, endQuizSession } = useQuizSessionTeacher(user?.uid);
  const config = widget.config as QuizConfig;
  const hasActiveSession = !!(session && session.status !== 'ended');

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm font-semibold text-white">Quiz Widget Settings</p>
      <div className="p-3 bg-blue-500/15 border border-blue-500/30 rounded-xl text-xs text-blue-300">
        All quiz management (import, edit, preview, live sessions) is available
        on the front of this widget. Flip back to access it.
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Widget Label
        </label>
        <input
          type="text"
          value={widget.customTitle ?? ''}
          onChange={(e) =>
            updateWidget(widget.id, { customTitle: e.target.value || null })
          }
          placeholder="Quiz"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {hasActiveSession && (
        <button
          onClick={async () => {
            await endQuizSession();
            addToast('Active session ended.', 'success');
          }}
          className="w-full py-2 bg-brand-red-primary hover:bg-brand-red-dark text-white text-sm rounded-xl transition-colors font-bold"
        >
          Force End Active Session
        </button>
      )}

      <button
        onClick={() =>
          updateWidget(widget.id, {
            config: {
              ...config,
              view: 'manager',
              selectedQuizId: null,
              selectedQuizTitle: null,
              activeLiveSessionCode: null,
              resultsSessionId: null,
            } as QuizConfig,
          })
        }
        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition-colors"
      >
        Reset to Manager View
      </button>
    </div>
  );
};
