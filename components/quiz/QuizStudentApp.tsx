/**
 * QuizStudentApp — the student-facing quiz experience.
 * Accessible at /quiz?code=XXXXXX
 *
 * Flow:
 *  1. Student must sign in with Google (org email required)
 *  2. Student enters a quiz code (or picks it up from URL param)
 *  3. Student waits in lobby for teacher to start
 *  4. Questions are shown one by one as teacher advances
 *  5. Student submits answers; sees results at the end
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  LogIn,
  Loader2,
  CheckCircle2,
  Timer,
  ArrowRight,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { useQuizSessionStudent, gradeAnswer } from '@/hooks/useQuizSession';
import { QuizSession, QuizQuestion } from '@/types';

// ─── Root component ───────────────────────────────────────────────────────────

export const QuizStudentApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  if (authLoading) {
    return <FullPageLoader message="Loading…" />;
  }

  if (!user) {
    return <SignInScreen />;
  }

  return <QuizJoinFlow user={user} />;
};

// ─── Sign in screen ───────────────────────────────────────────────────────────

const SignInScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-6">
        <ClipboardList className="w-8 h-8 text-violet-400" />
      </div>
      <h1 className="text-3xl font-black text-white mb-2">Student Quiz</h1>
      <p className="text-slate-400 text-sm mb-8 max-w-xs">
        Sign in with your Google account to join your teacher&apos;s quiz.
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={() => void handleSignIn()}
        disabled={loading}
        className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-xl shadow-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <LogIn className="w-5 h-5" />
        )}
        Sign in with Google
      </button>
    </div>
  );
};

// ─── Join flow ────────────────────────────────────────────────────────────────

const QuizJoinFlow: React.FC<{ user: User }> = ({ user }) => {
  const params = new URLSearchParams(window.location.search);
  const urlCode = params.get('code') ?? '';

  const [code, setCode] = useState(urlCode);
  const [joined, setJoined] = useState(false);

  const {
    session,
    myResponse,
    loading,
    error,
    joinQuizSession,
    submitAnswer,
    completeQuiz,
  } = useQuizSessionStudent();

  const handleJoin = useCallback(
    async (joinCode: string) => {
      if (!user.email) {
        return;
      }
      await joinQuizSession(
        joinCode,
        user.displayName ?? user.email,
        user.email,
        user.uid
      );
      setJoined(true);
    },
    [user, joinQuizSession]
  );

  // Auto-join if code is in URL. handleJoin is async — setState runs after
  // await (not synchronously), so set-state-in-effect is a false positive here.
  useEffect(() => {
    if (urlCode && !joined && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void handleJoin(urlCode);
    }
  }, [urlCode, user, joined, handleJoin]);

  const handleSignOut = () => void signOut(auth);

  // Not yet joined
  if (!joined || !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-violet-400" />
              <span className="text-sm text-slate-300">
                {user.displayName ?? user.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Sign out
            </button>
          </div>

          <h1 className="text-2xl font-black text-white mb-2 text-center">
            Join Quiz
          </h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Enter the code your teacher shared.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleJoin(code);
            }}
            className="space-y-4"
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={8}
              className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-xl font-black font-mono tracking-widest text-center uppercase placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Join <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Waiting room
  if (session.status === 'waiting') {
    return (
      <WaitingRoom
        session={session}
        studentName={user.displayName ?? user.email ?? ''}
        onSignOut={handleSignOut}
      />
    );
  }

  // Active quiz
  if (session.status === 'active') {
    const sessionQuestions = session.questions ?? [];
    const currentQ =
      session.currentQuestionIndex >= 0
        ? sessionQuestions[session.currentQuestionIndex]
        : undefined;

    const alreadyAnswered = currentQ
      ? (myResponse?.answers ?? []).some((a) => a.questionId === currentQ.id)
      : false;

    return (
      <ActiveQuiz
        session={session}
        currentQuestion={currentQ}
        alreadyAnswered={alreadyAnswered}
        myResponse={myResponse}
        onAnswer={async (questionId, answer, question) => {
          await submitAnswer(questionId, answer, question);
        }}
        onComplete={async () => {
          await completeQuiz();
        }}
      />
    );
  }

  // Session ended
  return (
    <ResultsScreen
      myResponse={myResponse}
      questions={session.questions ?? []}
      studentName={user.displayName ?? user.email ?? ''}
      onSignOut={handleSignOut}
    />
  );
};

// ─── Waiting room ─────────────────────────────────────────────────────────────

const WaitingRoom: React.FC<{
  session: QuizSession;
  studentName: string;
  onSignOut: () => void;
}> = ({ session, studentName, onSignOut }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
      <ClipboardList className="w-8 h-8 text-violet-400" />
    </div>
    <h1 className="text-2xl font-black text-white mb-2">{session.quizTitle}</h1>
    <p className="text-slate-400 text-sm mb-2">
      Waiting for your teacher to start…
    </p>
    <p className="text-slate-500 text-xs mb-8">
      {session.totalQuestions} questions
    </p>
    <div className="p-4 bg-slate-800 rounded-xl">
      <p className="text-slate-300 text-sm">
        Signed in as{' '}
        <span className="font-semibold text-white">{studentName}</span>
      </p>
    </div>
    <button
      onClick={onSignOut}
      className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors"
    >
      Sign out
    </button>
  </div>
);

// ─── Active quiz ──────────────────────────────────────────────────────────────

const ActiveQuiz: React.FC<{
  session: QuizSession;
  currentQuestion: QuizQuestion | undefined;
  alreadyAnswered: boolean;
  myResponse: ReturnType<typeof useQuizSessionStudent>['myResponse'];
  onAnswer: (
    qId: string,
    answer: string,
    question: QuizQuestion
  ) => Promise<void>;
  onComplete: () => Promise<void>;
}> = ({
  session,
  currentQuestion,
  alreadyAnswered,
  myResponse,
  onAnswer,
  onComplete,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fibAnswer, setFibAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Reset state on new question
  useEffect(() => {
    const tl = currentQuestion?.timeLimit ?? 0;
    setTimeout(() => {
      setSelectedAnswer(null);
      setSubmitted(alreadyAnswered);
      setFibAnswer('');
      setTimeLeft(tl > 0 && !alreadyAnswered ? tl : null);
    }, 0);
  }, [currentQuestion?.id, currentQuestion?.timeLimit, alreadyAnswered]);

  // Countdown
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) {
      // Auto-submit empty answer when time runs out
      if (currentQuestion && !submitted) {
        setTimeout(() => setSubmitted(true), 0);
        void onAnswer(
          currentQuestion.id,
          selectedAnswer ?? fibAnswer ?? '',
          currentQuestion
        );
      }
      return;
    }
    const id = setInterval(
      () => setTimeLeft((t) => (t !== null ? t - 1 : null)),
      1000
    );
    return () => clearInterval(id);
  }, [
    timeLeft,
    submitted,
    currentQuestion,
    selectedAnswer,
    fibAnswer,
    onAnswer,
  ]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (answer: string) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    setSelectedAnswer(answer);
    await onAnswer(currentQuestion.id, answer, currentQuestion);
    setSubmitted(true);
    setSubmitting(false);

    // Auto-complete if on last question
    if (
      session.currentQuestionIndex >= session.totalQuestions - 1 &&
      myResponse?.status !== 'completed'
    ) {
      await onComplete();
    }
  };

  const progress =
    ((session.currentQuestionIndex + 1) / session.totalQuestions) * 100;
  const options =
    currentQuestion.type === 'MC'
      ? shuffleArray([
          currentQuestion.correctAnswer,
          ...currentQuestion.incorrectAnswers.filter(Boolean),
        ])
      : [];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-violet-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-slate-500">
            {session.currentQuestionIndex + 1} / {session.totalQuestions}
          </span>
          {timeLeft !== null && !submitted && (
            <div
              className={`flex items-center gap-1.5 text-sm font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-amber-400'}`}
            >
              <Timer className="w-4 h-4" />
              {timeLeft}s
            </div>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${
              currentQuestion.type === 'MC'
                ? 'bg-blue-500/20 text-blue-400'
                : currentQuestion.type === 'FIB'
                  ? 'bg-amber-500/20 text-amber-400'
                  : currentQuestion.type === 'Matching'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-teal-500/20 text-teal-400'
            }`}
          >
            {currentQuestion.type === 'MC'
              ? 'Multiple Choice'
              : currentQuestion.type === 'FIB'
                ? 'Fill in the Blank'
                : currentQuestion.type === 'Matching'
                  ? 'Matching'
                  : 'Ordering'}
          </span>
        </div>

        {/* Question */}
        <h2 className="text-xl font-bold text-white mb-8 leading-snug">
          {currentQuestion.text}
        </h2>

        {/* Answer area */}
        {currentQuestion.type === 'MC' && (
          <div className="space-y-3 flex-1">
            {options.map((opt) => {
              const isSelected = selectedAnswer === opt;
              let cls =
                'w-full text-left px-5 py-4 rounded-2xl border-2 text-sm font-medium transition-all ';
              if (!submitted) {
                cls += isSelected
                  ? 'border-violet-500 bg-violet-500/20 text-white'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50';
              } else {
                cls +=
                  'border-slate-700 bg-slate-800/50 text-slate-500 cursor-default';
              }
              return (
                <button
                  key={opt}
                  onClick={() => !submitted && void handleSubmit(opt)}
                  disabled={submitted || submitting}
                  className={cls}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'FIB' && (
          <div className="space-y-4 flex-1">
            <input
              type="text"
              value={fibAnswer}
              onChange={(e) => setFibAnswer(e.target.value)}
              disabled={submitted}
              placeholder="Type your answer…"
              className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:ring-0 focus:border-violet-500 disabled:opacity-50"
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                fibAnswer.trim() &&
                void handleSubmit(fibAnswer.trim())
              }
            />
            {!submitted && (
              <button
                onClick={() =>
                  fibAnswer.trim() && void handleSubmit(fibAnswer.trim())
                }
                disabled={!fibAnswer.trim() || submitting}
                className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Submit Answer'
                )}
              </button>
            )}
          </div>
        )}

        {(currentQuestion.type === 'Matching' ||
          currentQuestion.type === 'Ordering') && (
          <StructuredQuestionInput
            question={currentQuestion}
            submitted={submitted}
            onSubmit={(answer) => void handleSubmit(answer)}
            submitting={submitting}
          />
        )}

        {/* Submitted state */}
        {submitted && (
          <div className="mt-6 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-sm font-medium">
              Answer submitted! Waiting for the next question…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Structured question (Matching / Ordering) ───────────────────────────────

const StructuredQuestionInput: React.FC<{
  question: QuizQuestion;
  submitted: boolean;
  onSubmit: (answer: string) => void;
  submitting: boolean;
}> = ({ question, submitted, onSubmit, submitting }) => {
  const isMatching = question.type === 'Matching';

  // Parse the correct answer to get left items (we don't reveal right items)
  const leftItems = isMatching
    ? question.correctAnswer.split('|').map((p) => p.split(':')[0] ?? '')
    : question.correctAnswer.split('|');

  const rightItemsShuffled = isMatching
    ? shuffleArray(
        question.correctAnswer.split('|').map((p) => p.split(':')[1] ?? '')
      )
    : [];

  const [matchings, setMatchings] = useState<Record<string, string>>(() =>
    Object.fromEntries(leftItems.map((l) => [l, '']))
  );
  const [order, setOrder] = useState<string[]>(() =>
    shuffleArray([...leftItems])
  );

  const canSubmit = isMatching
    ? Object.values(matchings).every(Boolean)
    : order.length === leftItems.length;

  const handleSubmitStructured = () => {
    let answer: string;
    if (isMatching) {
      answer = leftItems.map((l) => `${l}:${matchings[l]}`).join('|');
    } else {
      answer = order.join('|');
    }
    onSubmit(answer);
  };

  if (submitted) return null;

  return (
    <div className="space-y-4 flex-1">
      {isMatching ? (
        <div className="space-y-3">
          {leftItems.map((left) => (
            <div key={left} className="flex items-center gap-3">
              <span className="text-sm text-slate-300 w-1/2">{left}</span>
              <select
                value={matchings[left]}
                onChange={(e) =>
                  setMatchings((m) => ({ ...m, [left]: e.target.value }))
                }
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">Select…</option>
                {rightItemsShuffled.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Drag or use arrows to set the correct order:
          </p>
          {order.map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
            >
              <span className="text-violet-400 font-bold text-sm w-5">
                {i + 1}.
              </span>
              <span className="flex-1 text-sm text-white">{item}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (i > 0) {
                      const newOrder = [...order];
                      [newOrder[i - 1], newOrder[i]] = [
                        newOrder[i],
                        newOrder[i - 1],
                      ];
                      setOrder(newOrder);
                    }
                  }}
                  disabled={i === 0}
                  className="p-1 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  ▲
                </button>
                <button
                  onClick={() => {
                    if (i < order.length - 1) {
                      const newOrder = [...order];
                      [newOrder[i], newOrder[i + 1]] = [
                        newOrder[i + 1],
                        newOrder[i],
                      ];
                      setOrder(newOrder);
                    }
                  }}
                  disabled={i === order.length - 1}
                  className="p-1 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmitStructured}
        disabled={!canSubmit || submitting}
        className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Submit Answer'
        )}
      </button>
    </div>
  );
};

// ─── Results screen ───────────────────────────────────────────────────────────

const ResultsScreen: React.FC<{
  myResponse: ReturnType<typeof useQuizSessionStudent>['myResponse'];
  questions: QuizQuestion[];
  studentName: string;
  onSignOut: () => void;
}> = ({ myResponse, questions, studentName, onSignOut }) => {
  // Compute score from gradeAnswer so that the display is correct even
  // though students no longer write isCorrect to Firestore.
  const correct = (myResponse?.answers ?? []).filter((a) => {
    const q = questions.find((qn) => qn.id === a.questionId);
    return q ? gradeAnswer(q, a.answer) : false;
  }).length;
  const total = questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <Trophy className="w-16 h-16 text-amber-400 mb-6" />
      <h1 className="text-3xl font-black text-white mb-2">Quiz Complete!</h1>
      <p className="text-slate-400 text-sm mb-8">Great job, {studentName}!</p>

      {score !== null && score !== undefined ? (
        <div className="mb-8">
          <p className="text-6xl font-black text-white mb-2">{score}%</p>
          <p className="text-slate-400 text-sm">
            {correct} correct out of {total} questions
          </p>
        </div>
      ) : (
        <p className="text-slate-400 mb-8">
          Your answers have been submitted. Ask your teacher for results.
        </p>
      )}

      <div
        className={`px-6 py-3 rounded-2xl text-sm font-bold mb-8 ${
          (score ?? 0) >= 80
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : (score ?? 0) >= 60
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}
      >
        {(score ?? 0) >= 90
          ? '🌟 Excellent!'
          : (score ?? 0) >= 80
            ? '🎉 Great work!'
            : (score ?? 0) >= 60
              ? '👍 Good effort!'
              : '📚 Keep practicing!'}
      </div>

      <button
        onClick={onSignOut}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const FullPageLoader: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
    <p className="text-slate-400 text-sm">{message}</p>
  </div>
);

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
