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
import { resolvePeriodNames } from '../utils/periodCompat';

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

/**
 * Thrown by `joinQuizSession` when a student attempts to join a session they've
 * already completed and the assignment's attempt limit has been reached. The
 * UI should catch this and render a friendly "ask your teacher" message; the
 * teacher can reset by removing the student from the live monitor.
 */
export class AttemptLimitReachedError extends Error {
  constructor() {
    super(
      "You've already submitted this quiz. Talk to your teacher if you need another attempt."
    );
    this.name = 'AttemptLimitReachedError';
  }
}

/**
 * Compute the deterministic response-doc key.
 *
 * For studentRole (real SSO) auth, we continue to key by `auth.uid` because
 * the uid is stable per-user. For anonymous PIN auth the uid rotates every
 * time the student clears storage or switches device, which would let them
 * bypass attempt limits — so we derive a key from `pin + classPeriod` that
 * is stable per-roster-student.
 *
 * Known limitation: two rosters assigned to the same session with overlapping
 * PINs under the same classPeriod would collide on the same doc key. Rosters
 * are normally period-scoped, so this is expected to be rare.
 */
function computeResponseKey(
  authUid: string,
  isAnonymous: boolean,
  pin: string,
  classPeriod: string | undefined
): string {
  if (!isAnonymous) return authUid;
  const period = classPeriod ?? 'default';
  return `pin-${period}-${pin}`;
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
  /**
   * Remove a student from the live session roster by deleting their response
   * doc. `responseKey` is the Firestore doc key (e.g. `pin-{period}-{pin}`
   * for PIN auth, or the student's auth uid for studentRole auth) — NOT the
   * `studentUid` field inside the doc. Callers should pass the snapshot
   * doc.id they're iterating over.
   *
   * Deleting the doc also frees the attempt slot so the student can rejoin.
   */
  removeStudent: (responseKey: string) => Promise<void>;
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
        // Carry the doc id through as `_responseKey` so the live monitor
        // can remove/delete by the actual Firestore key rather than the
        // `studentUid` field, which may differ for PIN-authed joiners.
        const list = snap.docs.map(
          (d) =>
            ({
              ...(d.data() as QuizResponse),
              _responseKey: d.id,
            }) as QuizResponse
        );
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
    async (responseKey: string) => {
      if (!sessionId) return;
      const responseRef = doc(
        db,
        QUIZ_SESSIONS_COLLECTION,
        sessionId,
        RESPONSES_COLLECTION,
        responseKey
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
  /**
   * Look up a session by join code without actually joining.
   * Returns the session's periodNames so the UI can show a period picker
   * before the student commits to joining.
   */
  lookupSession: (code: string) => Promise<{ periodNames: string[] } | null>;
  joinQuizSession: (
    code: string,
    pin: string,
    classPeriod?: string
  ) => Promise<string>;
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
  // The Firestore doc key under /responses. For studentRole auth this equals
  // the auth uid; for PIN/anonymous auth it is derived from pin+classPeriod
  // (see computeResponseKey) so an attempt limit survives device/storage
  // resets. Historically named `studentUidRef`.
  const responseKeyRef = useRef<string | null>(null);
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

  // My response listener — subscribed on the deterministic response-doc key
  // (not necessarily equal to auth.uid for anonymous PIN users).
  const [responseKeyState, setResponseKeyState] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionIdState || !responseKeyState) return;
    return onSnapshot(
      doc(
        db,
        QUIZ_SESSIONS_COLLECTION,
        sessionIdState,
        RESPONSES_COLLECTION,
        responseKeyState
      ),
      (snap) =>
        setMyResponse(
          snap.exists()
            ? { ...(snap.data() as QuizResponse), _responseKey: snap.id }
            : null
        )
    );
  }, [sessionIdState, responseKeyState]);

  const lookupSession = useCallback(
    async (code: string): Promise<{ periodNames: string[] } | null> => {
      const normCode = code
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      if (!normCode) return null;
      const snap = await getDocs(
        query(
          collection(db, QUIZ_SESSIONS_COLLECTION),
          where('code', '==', normCode)
        )
      );
      if (snap.empty) return null;
      const joinable = snap.docs.filter((d) => {
        const s = (d.data() as QuizSession).status;
        return s === 'waiting' || s === 'active' || s === 'paused';
      });
      if (joinable.length === 0) return null;
      // Match joinQuizSession's selection: prefer the most recently created.
      joinable.sort((a, b) => {
        const at = (a.data() as QuizSession).startedAt ?? 0;
        const bt = (b.data() as QuizSession).startedAt ?? 0;
        return bt - at;
      });
      const sessionData = joinable[0].data() as QuizSession;
      // resolvePeriodNames normalises legacy periodName + new periodNames
      // into a typed string[], avoiding the `any[]` from Firestore's
      // DocumentData bleed-through.
      return { periodNames: resolvePeriodNames(sessionData) };
    },
    []
  );

  const joinQuizSession = useCallback(
    async (
      code: string,
      pin: string,
      classPeriod?: string
    ): Promise<string> => {
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

        // Deterministic doc key: stable per-roster-student for PIN auth so
        // the attempt limit can't be bypassed by clearing storage / switching
        // device. studentRole users still key by their auth uid (stable per
        // user already).
        const deterministicKey = computeResponseKey(
          studentUid,
          currentUser.isAnonymous,
          sanitizedPin,
          classPeriod
        );

        // Legacy-key fallback: before deterministic keying, every response
        // (including anonymous PIN joiners) was keyed by `auth.uid`. If the
        // student is rejoining an in-progress session that was created under
        // the old scheme, resume at the legacy key so their in-flight work
        // isn't lost and the teacher doesn't see a duplicate row. New docs
        // are always created at the deterministic key.
        let responseKey = deterministicKey;
        let existingSnap = await getDoc(
          doc(
            db,
            QUIZ_SESSIONS_COLLECTION,
            sessionDoc.id,
            RESPONSES_COLLECTION,
            deterministicKey
          )
        );
        if (
          !existingSnap.exists() &&
          currentUser.isAnonymous &&
          deterministicKey !== studentUid
        ) {
          const legacySnap = await getDoc(
            doc(
              db,
              QUIZ_SESSIONS_COLLECTION,
              sessionDoc.id,
              RESPONSES_COLLECTION,
              studentUid
            )
          );
          if (legacySnap.exists()) {
            responseKey = studentUid;
            existingSnap = legacySnap;
          }
        }

        sessionIdRef.current = sessionDoc.id;
        responseKeyRef.current = responseKey;
        // Reset warning count before activating snapshot listeners so a
        // late-arriving snapshot from a previous session can't race with
        // the finally-block reset and leave the counter stuck at 0.
        warningCountRef.current = 0;
        setWarningCount(0);

        const responseRef = doc(
          db,
          QUIZ_SESSIONS_COLLECTION,
          sessionDoc.id,
          RESPONSES_COLLECTION,
          responseKey
        );

        if (existingSnap.exists()) {
          const existing = existingSnap.data() as QuizResponse;
          // Attempt-limit enforcement. `attemptLimit == null/undefined` means
          // unlimited (legacy sessions). A completed doc occupies the slot;
          // teachers reset by deleting it via removeStudent.
          const limit = sessionData.attemptLimit ?? null;
          if (limit !== null && existing.status === 'completed') {
            throw new AttemptLimitReachedError();
          }
        }

        setSessionIdState(sessionDoc.id);
        setResponseKeyState(responseKey);

        if (!existingSnap.exists()) {
          // No PII stored — only the PIN for teacher cross-reference.
          // `studentUid` field carries the auth uid; the doc key may differ
          // (for PIN auth it's pin-based), so Firestore rules enforce
          // ownership against the field, not the key.
          const newResponse: QuizResponse = {
            studentUid,
            pin: sanitizedPin,
            joinedAt: Date.now(),
            status: 'joined',
            answers: [],
            score: null,
            submittedAt: null,
            ...(classPeriod ? { classPeriod } : {}),
          };
          await setDoc(responseRef, newResponse);
        } else if (classPeriod) {
          // Backfill classPeriod on existing response (e.g. student joined
          // before periods were configured, or reloaded after a change).
          const existing = existingSnap.data() as QuizResponse;
          if (existing.classPeriod !== classPeriod) {
            await updateDoc(responseRef, { classPeriod });
          }
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
      const responseKey = responseKeyRef.current;
      if (!sessionId || !responseKey) return;

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
          responseKey
        ),
        { status: 'in-progress', answers: updated }
      );
    },
    []
  );

  const completeQuiz = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    const responseKey = responseKeyRef.current;
    if (!sessionId || !responseKey) return;

    // Score is computed from gradeAnswer() by the teacher/results view,
    // not written by the student, to prevent client-side forgery of the score field.
    await updateDoc(
      doc(
        db,
        QUIZ_SESSIONS_COLLECTION,
        sessionId,
        RESPONSES_COLLECTION,
        responseKey
      ),
      { status: 'completed', submittedAt: Date.now() }
    );
  }, []);

  const reportTabSwitch = useCallback(async (): Promise<number> => {
    const sessionId = sessionIdRef.current;
    const responseKey = responseKeyRef.current;
    if (!sessionId || !responseKey) return 0;

    const responseRef = doc(
      db,
      QUIZ_SESSIONS_COLLECTION,
      sessionId,
      RESPONSES_COLLECTION,
      responseKey
    );

    // Capture pre-increment count BEFORE Firestore write so the snapshot
    // listener can't race and double-count the same increment.
    const baseCount = Math.max(
      warningCountRef.current,
      myResponseRef.current?.tabSwitchWarnings ?? 0
    );

    await updateDoc(responseRef, {
      tabSwitchWarnings: increment(1),
    });

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
    lookupSession,
    joinQuizSession,
    submitAnswer,
    completeQuiz,
    reportTabSwitch,
    warningCount,
  };
};
