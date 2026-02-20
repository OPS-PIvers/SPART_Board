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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  QuizSession,
  QuizSessionStatus,
  QuizResponse,
  QuizResponseAnswer,
  QuizQuestion,
} from '../types';

const QUIZ_SESSIONS_COLLECTION = 'quiz_sessions';
const RESPONSES_COLLECTION = 'responses';

// ─── Grading ──────────────────────────────────────────────────────────────────

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function gradeAnswer(
  question: QuizQuestion,
  studentAnswer: string
): boolean {
  const correct = norm(question.correctAnswer);
  const given = norm(studentAnswer);

  if (question.type === 'MC' || question.type === 'FIB') {
    return correct === given;
  }
  if (question.type === 'Matching') {
    const correctSet = new Set(correct.split('|').map(norm));
    const givenParts = given.split('|').map(norm);
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
  startQuizSession: (quiz: {
    id: string;
    title: string;
    questions: QuizQuestion[];
  }) => Promise<string>;
  advanceQuestion: () => Promise<void>;
  endQuizSession: () => Promise<void>;
}

export const useQuizSessionTeacher = (
  teacherUid: string | undefined
): UseQuizSessionTeacherResult => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherUid) {
      setTimeout(() => setLoading(false), 0);
      return;
    }
    const sessionRef = doc(db, QUIZ_SESSIONS_COLLECTION, teacherUid);
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
  }, [teacherUid]);

  useEffect(() => {
    // Keep the listener active even after the session ends so that any
    // late student submissions still appear in the live monitor / results.
    if (!teacherUid || !session) return;
    const responsesRef = collection(
      db,
      QUIZ_SESSIONS_COLLECTION,
      teacherUid,
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
  }, [teacherUid, session]);

  const startQuizSession = useCallback(
    async (quiz: {
      id: string;
      title: string;
      questions: QuizQuestion[];
    }): Promise<string> => {
      if (!teacherUid) throw new Error('Not authenticated');

      // Delete any existing response documents from a previous session so
      // stale answers don't appear in the new session's live monitor / results.
      const oldResponses = await getDocs(
        collection(
          db,
          QUIZ_SESSIONS_COLLECTION,
          teacherUid,
          RESPONSES_COLLECTION
        )
      );
      await Promise.all(oldResponses.docs.map((d) => deleteDoc(d.ref)));

      const code = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()
        .padEnd(6, '0');
      const newSession: QuizSession = {
        id: teacherUid,
        quizId: quiz.id,
        quizTitle: quiz.title,
        teacherUid,
        status: 'waiting' as QuizSessionStatus,
        currentQuestionIndex: -1,
        startedAt: null,
        endedAt: null,
        code,
        totalQuestions: quiz.questions.length,
        // Store full questions so students can render them without a Drive
        // fetch, and so the teacher's view can re-grade answers server-side.
        questions: quiz.questions,
      };
      await setDoc(doc(db, QUIZ_SESSIONS_COLLECTION, teacherUid), newSession);
      return code;
    },
    [teacherUid]
  );

  const advanceQuestion = useCallback(async () => {
    if (!teacherUid || !session) return;
    const sessionRef = doc(db, QUIZ_SESSIONS_COLLECTION, teacherUid);
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= session.totalQuestions) {
      await updateDoc(sessionRef, {
        status: 'ended' as QuizSessionStatus,
        currentQuestionIndex: session.totalQuestions,
        endedAt: Date.now(),
      });
      return;
    }
    await updateDoc(sessionRef, {
      status: 'active' as QuizSessionStatus,
      currentQuestionIndex: nextIndex,
      ...(session.startedAt === null ? { startedAt: Date.now() } : {}),
    });
  }, [teacherUid, session]);

  const endQuizSession = useCallback(async () => {
    if (!teacherUid) return;
    await updateDoc(doc(db, QUIZ_SESSIONS_COLLECTION, teacherUid), {
      status: 'ended' as QuizSessionStatus,
      endedAt: Date.now(),
    });
  }, [teacherUid]);

  return {
    session,
    responses,
    loading,
    startQuizSession,
    advanceQuestion,
    endQuizSession,
  };
};

// ─── Student hook ─────────────────────────────────────────────────────────────

export interface UseQuizSessionStudentResult {
  session: QuizSession | null;
  myResponse: QuizResponse | null;
  loading: boolean;
  error: string | null;
  teacherUidRef: MutableRefObject<string | null>;
  joinQuizSession: (
    code: string,
    studentName: string,
    studentEmail: string,
    studentUid: string
  ) => Promise<string>;
  submitAnswer: (
    questionId: string,
    answer: string,
    question: QuizQuestion
  ) => Promise<void>;
  completeQuiz: () => Promise<void>;
}

export const useQuizSessionStudent = (): UseQuizSessionStudentResult => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [myResponse, setMyResponse] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const teacherUidRef = useRef<string | null>(null);
  const studentUidRef = useRef<string | null>(null);
  // Keep a ref to current answers to avoid stale closure issues
  const myResponseRef = useRef<QuizResponse | null>(null);
  myResponseRef.current = myResponse;

  // Session listener — only subscribes once teacherUid is known
  const [teacherUidState, setTeacherUidState] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherUidState) return;
    return onSnapshot(
      doc(db, QUIZ_SESSIONS_COLLECTION, teacherUidState),
      (snap) => setSession(snap.exists() ? (snap.data() as QuizSession) : null)
    );
  }, [teacherUidState]);

  // My response listener
  const [studentUidState, setStudentUidState] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherUidState || !studentUidState) return;
    return onSnapshot(
      doc(
        db,
        QUIZ_SESSIONS_COLLECTION,
        teacherUidState,
        RESPONSES_COLLECTION,
        studentUidState
      ),
      (snap) =>
        setMyResponse(snap.exists() ? (snap.data() as QuizResponse) : null)
    );
  }, [teacherUidState, studentUidState]);

  const joinQuizSession = useCallback(
    async (
      code: string,
      studentName: string,
      studentEmail: string,
      studentUid: string
    ): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const normCode = code
          .trim()
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase();
        if (!normCode) throw new Error('Invalid code');

        const snap = await getDocs(
          query(
            collection(db, QUIZ_SESSIONS_COLLECTION),
            where('code', '==', normCode)
          )
        );
        if (snap.empty) throw new Error('No active quiz found with that code.');

        const sessionDoc = snap.docs[0];
        const sessionData = sessionDoc.data() as QuizSession;
        if (sessionData.status === 'ended') {
          throw new Error('This quiz session has already ended.');
        }

        teacherUidRef.current = sessionDoc.id;
        studentUidRef.current = studentUid;
        setTeacherUidState(sessionDoc.id);
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
          const newResponse: QuizResponse = {
            studentUid,
            studentEmail,
            studentName,
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
    async (questionId: string, answer: string, _question: QuizQuestion) => {
      const teacherUid = teacherUidRef.current;
      const studentUid = studentUidRef.current;
      if (!teacherUid || !studentUid) return;

      // isCorrect is intentionally not written by the student to prevent
      // client-side forgery. It is computed by the teacher's view using
      // gradeAnswer(question, answer) against the questions stored in the
      // session document.
      const newAnswer: QuizResponseAnswer = {
        questionId,
        answer,
        answeredAt: Date.now(),
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
          teacherUid,
          RESPONSES_COLLECTION,
          studentUid
        ),
        { status: 'in-progress', answers: updated }
      );
    },
    []
  );

  const completeQuiz = useCallback(async () => {
    const teacherUid = teacherUidRef.current;
    const studentUid = studentUidRef.current;
    if (!teacherUid || !studentUid) return;

    // Score is computed from isCorrect answer fields by the teacher/results view,
    // not written by the student, to prevent client-side forgery of the score field.
    await updateDoc(
      doc(
        db,
        QUIZ_SESSIONS_COLLECTION,
        teacherUid,
        RESPONSES_COLLECTION,
        studentUid
      ),
      { status: 'completed', submittedAt: Date.now() }
    );
  }, []);

  return {
    session,
    myResponse,
    loading,
    error,
    teacherUidRef,
    joinQuizSession,
    submitAnswer,
    completeQuiz,
  };
};
