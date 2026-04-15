/**
 * useQuizSession hooks
 *
 * Manages live quiz sessions in Firestore.
 *
 * useQuizSessionTeacher — Teacher creates/controls a live session.
 * useQuizSessionStudent — Student joins and submits answers.
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MutableRefObject,
} from 'react';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  increment,
  deleteField,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { signInAnonymously } from 'firebase/auth';
import {
  QuizSession,
  QuizSessionStatus,
  QuizResponse,
  QuizResponseAnswer,
  QuizQuestion,
  QuizPublicQuestion,
} from '../types';

// Re-export for backward compatibility with callers that imported
// QuizSessionOptions from this module before it was moved into types.ts.
export type { QuizSessionOptions } from '../types';

export const QUIZ_SESSIONS_COLLECTION = 'quiz_sessions';
export const RESPONSES_COLLECTION = 'responses';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Unbiased Fisher-Yates in-place shuffle (returns new array) */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Convert a full QuizQuestion (with correctAnswer) to a student-safe
 * QuizPublicQuestion (without correctAnswer). Answer choices are pre-shuffled
 * so students can render the UI without ever seeing the answer key.
 */
export function toPublicQuestion(q: QuizQuestion): QuizPublicQuestion {
  const base: QuizPublicQuestion = {
    id: q.id,
    type: q.type,
    text: q.text,
    timeLimit: q.timeLimit,
  };
  if (q.type === 'MC') {
    base.choices = fisherYatesShuffle([
      q.correctAnswer,
      ...q.incorrectAnswers.filter(Boolean),
    ]);
  } else if (q.type === 'Matching') {
    const pairs = q.correctAnswer.split('|').map((p) => {
      const [left, right] = p.split(':');
      return { left: left ?? '', right: right ?? '' };
    });
    base.matchingLeft = pairs.map((p) => p.left);
    base.matchingRight = fisherYatesShuffle(pairs.map((p) => p.right));
  } else if (q.type === 'Ordering') {
    base.orderingItems = fisherYatesShuffle(q.correctAnswer.split('|'));
  }
  return base;
}

// ─── Grading ──────────────────────────────────────────────────────────────────

/** Normalize an answer string for comparison (collapse whitespace, lowercase). */
export const normalizeAnswer = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, ' ');

export function gradeAnswer(
  question: QuizQuestion,
  studentAnswer: string
): boolean {
  const correct = normalizeAnswer(question.correctAnswer);
  const given = normalizeAnswer(studentAnswer);

  if (question.type === 'MC' || question.type === 'FIB') {
    return correct === given;
  }
  if (question.type === 'Matching') {
    const correctSet = new Set(correct.split('|').map(normalizeAnswer));
    const givenParts = given.split('|').map(normalizeAnswer);
    return (
      givenParts.length === correctSet.size &&
      givenParts.every((p) => correctSet.has(p))
    );
  }
  if (question.type === 'Ordering') {
    return correct === given;
  }
  return false;
}

// ─── Teacher hook ─────────────────────────────────────────────────────────────

export interface UseQuizSessionTeacherResult {
  session: QuizSession | null;
  responses: QuizResponse[];
  loading: boolean;
  advanceQuestion: () => Promise<void>;
  /**
   * Transitions the session to `ended` state and finalizes any in-flight
   * student responses. The underlying assignment document is NOT touched — use
   * `useQuizAssignments.deactivateAssignment(sessionId)` if you also want the
   * assignment's lifecycle state flipped to `inactive`.
   */
  endQuizSession: () => Promise<void>;
  /** Remove a student from the live session roster */
  removeStudent: (studentUid: string) => Promise<void>;
  /** Reveal the correct answer for a question (writes to session doc) */
  revealAnswer: (questionId: string, correctAnswer: string) => Promise<void>;
  /** Hide a previously revealed answer (removes from session doc) */
  hideAnswer: (questionId: string) => Promise<void>;
}

/**
 * Subscribe to a specific quiz session document (keyed by assignment UUID).
 * Pass `undefined` or `null` when no assignment is currently selected — the
 * hook will return an empty state until a session id is supplied.
 */
export const useQuizSessionTeacher = (
  sessionId: string | undefined | null
): UseQuizSessionTeacherResult => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(!!sessionId);
  const advancingRef = useRef(false);

  // Adjust state during render when sessionId changes — avoids state-in-effect
  // anti-pattern while still clearing stale data when the selection changes.
  const [prevSessionId, setPrevSessionId] = useState(sessionId);
  if (sessionId !== prevSessionId) {
    setPrevSessionId(sessionId);
    setSession(null);
    setResponses([]);
    setLoading(!!sessionId);
  }

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, QUIZ_SESSIONS_COLLECTION, sessionId);
    return onSnapshot(
      sessionRef,
      (snap) => {
        setSession(snap.exists() ? (snap.data() as QuizSession) : null);
        setLoading(false);
      },
      (err) => {
        console.error('[useQuizSessionTeacher]', err);
        setLoading(false);
      }
    );
  }, [sessionId]);

  const hasSession = !!session;
  useEffect(() => {
    // Keep the listener active even after the session ends so that any
    // late student submissions still appear in the live monitor / results.
    if (!sessionId || !hasSession) return;
    const responsesRef = collection(
      db,
      QUIZ_SESSIONS_COLLECTION,
      sessionId,
      RESPONSES_COLLECTION
    );
    return onSnapshot(
      responsesRef,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as QuizResponse);
        setResponses(list);
      },
      (err) => console.error('[useQuizSessionTeacher] responses:', err)
    );
  }, [sessionId, hasSession]);

  const finalizeAllResponses = useCallback(async () => {
    if (!sessionId) return;
    const responsesRef = collection(
      db,
      QUIZ_SESSIONS_COLLECTION,
      sessionId,
      RESPONSES_COLLECTION
    );
    const snap = await getDocs(responsesRef);
    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach((d) => {
      const data = d.data() as QuizResponse;
      if (data.status === 'in-progress' || data.status === 'joined') {
        batch.update(d.ref, {
          status: 'completed',
          submittedAt: Date.now(),
        });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  }, [sessionId]);

  const removeStudent = useCallback(
    async (studentUid: string) => {
      if (!sessionId) return;
      const responseRef = doc(
        db,
        QUIZ_SESSIONS_COLLECTION,
        sessionId,
        RESPONSES_COLLECTION,
        studentUid
      );
      await deleteDoc(responseRef);
    },
    [sessionId]
  );

  const revealAnswer = useCallback(
    async (questionId: string, correctAnswer: string) => {
      if (!sessionId) return;
      const sessionRef = doc(db, QUIZ_SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        [`revealedAnswers.${questionId}`]: correctAnswer,
      });
    },
    [sessionId]
  );

  const hideAnswer = useCallback(
    async (questionId: string) => {
      if (!sessionId) return;
      const sessionRef = doc(db, QUIZ_SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        [`revealedAnswers.${questionId}`]: deleteField(),
      });
    },
    [sessionId]
  );

  const advanceQuestion = useCallback(async () => {
    if (!sessionId || !session) return;
    const sessionRef = doc(db, QUIZ_SESSIONS_COLLECTION, sessionId);

    const isReviewing = session.questionPhase === 'reviewing';

    // If podium is enabled and we're not already reviewing, enter review phase first.
    // Skip review phase for student-paced mode (students control their own flow).
    if (
      !isReviewing &&
      session.showPodiumBetweenQuestions &&
      session.sessionMode !== 'student' &&
      session.status === 'active'
    ) {
      await updateDoc(sessionRef, {
        questionPhase: 'reviewing',
        autoProgressAt: null,
      });
      return;
    }

    // Actually advance to next question
    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= session.totalQuestions) {
      await updateDoc(sessionRef, {
        status: 'ended' as QuizSessionStatus,
        currentQuestionIndex: session.totalQuestions,
        endedAt: Date.now(),
        autoProgressAt: null,
        questionPhase: deleteField(),
      });
      await finalizeAllResponses();
      return;
    }
    await updateDoc(sessionRef, {
      status: 'active' as QuizSessionStatus,
      currentQuestionIndex: nextIndex,
      autoProgressAt: null,
      questionPhase: 'answering',
      ...(session.startedAt === null ? { startedAt: Date.now() } : {}),
    });
  }, [sessionId, session, finalizeAllResponses]);

  const endQuizSession = useCallback(async () => {
    if (!sessionId) return;

    // 1. End the session
    await updateDoc(doc(db, QUIZ_SESSIONS_COLLECTION, sessionId), {
      status: 'ended' as QuizSessionStatus,
      endedAt: Date.now(),
      autoProgressAt: null,
    });

    // 2. Mark all active students as completed so their data is preserved in results
    await finalizeAllResponses();
  }, [sessionId, finalizeAllResponses]);

  // ─── Auto-progress logic ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !session || session.sessionMode !== 'auto') return;
    if (session.status !== 'active') return;

    const currentQId =
      session.publicQuestions[session.currentQuestionIndex]?.id;
    if (!currentQId) return;

    // Check if everyone has answered (only if there are students)
    const activeResponses = responses.filter((r) => r.status !== 'joined');
    const everyoneAnswered =
      activeResponses.length > 0 &&
      activeResponses.every((r) =>
        r.answers.some((a) => a.questionId === currentQId)
      );

    if (
      everyoneAnswered &&
      !session.autoProgressAt &&
      session.questionPhase !== 'reviewing'
    ) {
      // All students answered: if podium is enabled, enter review first, then auto-advance
      const shouldReview = session.showPodiumBetweenQuestions;
      const advanceAt = Date.now() + 5000;
      const updates: Record<string, unknown> = {
        autoProgressAt: advanceAt,
      };
      if (shouldReview) {
        updates.questionPhase = 'reviewing';
      }
      updateDoc(doc(db, QUIZ_SESSIONS_COLLECTION, sessionId), updates).catch(
        (err) => console.error('[AutoProgress] update failed:', err)
      );
    }
  }, [responses, session, sessionId]);

  // Handle the actual auto-advance when the timestamp is reached
  useEffect(() => {
    if (!sessionId || !session?.autoProgressAt) return;

    const timer = setInterval(() => {
      if (Date.now() >= (session.autoProgressAt ?? 0)) {
        clearInterval(timer);
        if (advancingRef.current) return;
        advancingRef.current = true;
        advanceQuestion()
          .catch((err) => console.error('[AutoProgress] advance failed:', err))
          .finally(() => {
            advancingRef.current = false;
          });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.autoProgressAt, sessionId, advanceQuestion]);

  return {
    session,
    responses,
    loading,
    advanceQuestion,
    endQuizSession,
    removeStudent,
    revealAnswer,
    hideAnswer,
  };
};

// ─── Student hook ─────────────────────────────────────────────────────────────

export interface UseQuizSessionStudentResult {
  session: QuizSession | null;
  myResponse: QuizResponse | null;
  loading: boolean;
  error: string | null;
  /**
   * Ref holding the active session id (the Firestore doc ID under
   * `/quiz_sessions/{sessionId}`). Historically named `teacherUidRef` back
   * when sessions were keyed by the teacher's uid.
   */
  sessionIdRef: MutableRefObject<string | null>;
  joinQuizSession: (code: string, pin: string) => Promise<string>;
  submitAnswer: (
    questionId: string,
    answer: string,
    speedBonus?: number
  ) => Promise<void>;
  completeQuiz: () => Promise<void>;
  /**
   * Increments the tab switch warning count for the student in Firestore.
   * Returns the updated count.
   */
  reportTabSwitch: () => Promise<number>;
  warningCount: number;
}

export const useQuizSessionStudent = (): UseQuizSessionStudentResult => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [myResponse, setMyResponse] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const studentUidRef = useRef<string | null>(null);
  // Keep a ref to current answers to avoid stale closure issues
  const myResponseRef = useRef<QuizResponse | null>(null);
  myResponseRef.current = myResponse;

  // Optimistic local counter state to ensure UI updates immediately.
  // warningCountRef mirrors the state so reportTabSwitch can return the
  // updated value synchronously (React functional updaters run on the next
  // render, not immediately, so reading newCount from the setter is always 0).
  const [warningCount, setWarningCount] = useState(0);
  const warningCountRef = useRef(0);

  // Sync optimistic state with server truth, but never decrement locally
  useEffect(() => {
    if (myResponse?.tabSwitchWarnings !== undefined) {
      const serverCount = myResponse.tabSwitchWarnings ?? 0;
      const next = Math.max(warningCountRef.current, serverCount);
      warningCountRef.current = next;
      setWarningCount(next);
    }
  }, [myResponse?.tabSwitchWarnings]);

  // Session listener — only subscribes once sessionId is known
  const [sessionIdState, setSessionIdState] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionIdState) return;
    return onSnapshot(
      doc(db, QUIZ_SESSIONS_COLLECTION, sessionIdState),
      (snap) => setSession(snap.exists() ? (snap.data() as QuizSession) : null)
    );
  }, [sessionIdState]);

  // My response listener
  const [studentUidState, setStudentUidState] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionIdState || !studentUidState) return;
    return onSnapshot(
      doc(
        db,
        QUIZ_SESSIONS_COLLECTION,
        sessionIdState,
        RESPONSES_COLLECTION,
        studentUidState
      ),
      (snap) =>
        setMyResponse(snap.exists() ? (snap.data() as QuizResponse) : null)
    );
  }, [sessionIdState, studentUidState]);

  const joinQuizSession = useCallback(
    async (code: string, pin: string): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const normCode = code
          .trim()
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase();
        if (!normCode) throw new Error('Invalid code');

        // Prevent storage abuse on the PIN field
        const sanitizedPin = pin.trim().substring(0, 10);
        if (!sanitizedPin) throw new Error('PIN is required');

        // Ensure we have an anonymous Firebase Auth session so Firestore
        // security rules (request.auth != null) are satisfied.
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        const currentUser = auth.currentUser;
        if (!currentUser)
          throw new Error('Anonymous auth failed — no current user.');
        const studentUid = currentUser.uid;

        const snap = await getDocs(
          query(
            collection(db, QUIZ_SESSIONS_COLLECTION),
            where('code', '==', normCode)
          )
        );
        if (snap.empty) throw new Error('No active quiz found with that code.');

        // A code can transiently appear on more than one doc — e.g. an old
        // ended session plus a new live one with a recycled code. Filter
        // client-side to the docs that are still accepting joins (waiting /
        // active / paused) before picking one, otherwise docs[0] may be the
        // stale ended session and students get rejected despite a live
        // session existing.
        const joinable = snap.docs.filter((d) => {
          const s = (d.data() as QuizSession).status;
          return s === 'waiting' || s === 'active' || s === 'paused';
        });
        if (joinable.length === 0) {
          throw new Error('This quiz session has already ended.');
        }
        // Prefer the most recently created joinable doc.
        joinable.sort((a, b) => {
          const at = (a.data() as QuizSession).startedAt ?? 0;
          const bt = (b.data() as QuizSession).startedAt ?? 0;
          return bt - at;
        });
        const sessionDoc = joinable[0];
        const sessionData = sessionDoc.data() as QuizSession;

        sessionIdRef.current = sessionDoc.id;
        studentUidRef.current = studentUid;
        // Reset warning count before activating snapshot listeners so a
        // late-arriving snapshot from a previous session can't race with
        // the finally-block reset and leave the counter stuck at 0.
        warningCountRef.current = 0;
        setWarningCount(0);
        setSessionIdState(sessionDoc.id);
        setStudentUidState(studentUid);

        const responseRef = doc(
          db,
          QUIZ_SESSIONS_COLLECTION,
          sessionDoc.id,
          RESPONSES_COLLECTION,
          studentUid
        );

        // Use getDoc to check whether the student already has a response
        // document (e.g. after a page reload), rather than relying on the
        // in-memory ref which may still be null before the snapshot arrives.
        const existingSnap = await getDoc(responseRef);
        if (!existingSnap.exists()) {
          // No PII stored — only the PIN for teacher cross-reference
          const newResponse: QuizResponse = {
            studentUid,
            pin: sanitizedPin,
            joinedAt: Date.now(),
            status: 'joined',
            answers: [],
            score: null,
            submittedAt: null,
          };
          await setDoc(responseRef, newResponse);
        }

        setSession(sessionData);
        return sessionDoc.id;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to join quiz';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const submitAnswer = useCallback(
    async (questionId: string, answer: string, speedBonus?: number) => {
      const sessionId = sessionIdRef.current;
      const studentUid = studentUidRef.current;
      if (!sessionId || !studentUid) return;

      // isCorrect is intentionally not written by the student to prevent
      // client-side forgery. It is computed by the teacher's results view
      // using gradeAnswer() against the full quiz data loaded from Drive.
      const newAnswer: QuizResponseAnswer = {
        questionId,
        answer,
        answeredAt: Date.now(),
        ...(speedBonus != null && speedBonus > 0
          ? { speedBonus: Math.min(50, Math.max(0, speedBonus)) }
          : {}),
      };

      const existingAnswers = myResponseRef.current?.answers ?? [];
      const updated = [
        ...existingAnswers.filter((a) => a.questionId !== questionId),
        newAnswer,
      ];

      await updateDoc(
        doc(
          db,
          QUIZ_SESSIONS_COLLECTION,
          sessionId,
          RESPONSES_COLLECTION,
          studentUid
        ),
        { status: 'in-progress', answers: updated }
      );
    },
    []
  );

  const completeQuiz = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    const studentUid = studentUidRef.current;
    if (!sessionId || !studentUid) return;

    // Score is computed from gradeAnswer() by the teacher/results view,
    // not written by the student, to prevent client-side forgery of the score field.
    await updateDoc(
      doc(
        db,
        QUIZ_SESSIONS_COLLECTION,
        sessionId,
        RESPONSES_COLLECTION,
        studentUid
      ),
      { status: 'completed', submittedAt: Date.now() }
    );
  }, []);

  const reportTabSwitch = useCallback(async (): Promise<number> => {
    const sessionId = sessionIdRef.current;
    const studentUid = studentUidRef.current;
    if (!sessionId || !studentUid) return 0;

    const responseRef = doc(
      db,
      QUIZ_SESSIONS_COLLECTION,
      sessionId,
      RESPONSES_COLLECTION,
      studentUid
    );

    await updateDoc(responseRef, {
      tabSwitchWarnings: increment(1),
    });

    // Base the new count on whichever is higher: our local ref or the latest
    // server value (via myResponseRef). This guards against the case where the
    // sync effect hasn't fired yet (e.g., rapid blur before first snapshot),
    // which would cause warningCountRef to under-count and return too low a
    // value, preventing the auto-submit threshold from triggering.
    const baseCount = Math.max(
      warningCountRef.current,
      myResponseRef.current?.tabSwitchWarnings ?? 0
    );
    const newCount = baseCount + 1;
    warningCountRef.current = newCount;
    setWarningCount(newCount);
    return newCount;
  }, []);

  return {
    session,
    myResponse,
    loading,
    error,
    sessionIdRef,
    joinQuizSession,
    submitAnswer,
    completeQuiz,
    reportTabSwitch,
    warningCount,
  };
};
