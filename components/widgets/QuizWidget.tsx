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

  // ─── Guard: not signed in ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 p-6 text-center">
        <LogIn className="w-8 h-8 opacity-40" />
        <p className="text-sm font-medium text-slate-300">Sign in required</p>
        <p className="text-xs text-slate-500">
          Sign in with Google to use the Quiz widget.
        </p>
      </div>
    );
  }

  // ─── Guard: no Drive access ────────────────────────────────────────────────
  if (!isDriveConnected && !googleAccessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 p-6 text-center">
        <AlertTriangle className="w-8 h-8 opacity-40" />
        <p className="text-sm font-medium text-slate-300">
          Drive access needed
        </p>
        <p className="text-xs text-slate-500">
          Sign out and sign in again to grant Google Drive and Sheets access for
          quiz storage.
        </p>
      </div>
    );
  }

  // ─── Loading overlay ───────────────────────────────────────────────────────
  if (loadingQuizData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Loading quiz…</span>
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

  if (view === 'monitor' && liveSession && loadedQuizData) {
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
      onImport={() => setView('import')}
      onEdit={async (meta) => {
        const data = await loadQuiz(meta);
        if (data) setView('editor');
      }}
      onPreview={async (meta) => {
        const data = await loadQuiz(meta);
        if (data) setView('preview');
      }}
      onGoLive={async (meta) => {
        const data = await loadQuiz(meta);
        if (!data) return;
        try {
          const code = await startQuizSession(data);
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
  const { updateWidget } = useDashboard();
  const config = widget.config as QuizConfig;

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
