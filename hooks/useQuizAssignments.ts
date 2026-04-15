/**
 * useQuizAssignments hook
 *
 * Manages the per-teacher archive of quiz assignments. An "assignment" is a
 * single instance of a quiz being assigned out to students — it pairs a
 * QuizAssignment document (under /users/{teacherUid}/quiz_assignments/) with
 * a QuizSession document (under /quiz_sessions/{sessionId}) 1:1.
 *
 * Multiple concurrent assignments per teacher are supported. The assignment
 * can be Active (URL live, accepting submissions), Paused (URL live, no
 * submissions) or Inactive (URL dead, responses preserved).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  QuizAssignment,
  QuizAssignmentSettings,
  QuizAssignmentStatus,
  QuizData,
  QuizQuestion,
  QuizSession,
  SharedQuizAssignment,
} from '../types';
import {
  QUIZ_SESSIONS_COLLECTION,
  RESPONSES_COLLECTION,
  toPublicQuestion,
} from './useQuizSession';

const QUIZ_ASSIGNMENTS_COLLECTION = 'quiz_assignments';
const SHARED_ASSIGNMENTS_COLLECTION = 'shared_assignments';

/**
 * Minimal quiz data needed to stand up an assignment. The driveFileId lets the
 * monitor/results views hydrate the full answer key later.
 */
export interface AssignmentQuizRef {
  id: string;
  title: string;
  driveFileId: string;
  questions: QuizQuestion[];
}

export interface UseQuizAssignmentsResult {
  assignments: QuizAssignment[];
  loading: boolean;
  error: string | null;
  /**
   * Create a new assignment + its matching session doc in one batch.
   * Returns the new assignment's id (== sessionId) and the allocated join code.
   */
  createAssignment: (
    quiz: AssignmentQuizRef,
    settings: QuizAssignmentSettings,
    initialStatus?: QuizAssignmentStatus
  ) => Promise<{ id: string; code: string }>;
  /** Set both assignment.status and session.status to 'paused'. */
  pauseAssignment: (assignmentId: string) => Promise<void>;
  /** Set both assignment.status and session.status back to 'active'. */
  resumeAssignment: (assignmentId: string) => Promise<void>;
  /** Kills the student URL; preserves responses. assignment='inactive', session='ended'. */
  deactivateAssignment: (assignmentId: string) => Promise<void>;
  /** Permanently delete assignment + session + all responses. */
  deleteAssignment: (assignmentId: string) => Promise<void>;
  /** Update editable settings (className, PLC fields, session toggles). */
  updateAssignmentSettings: (
    assignmentId: string,
    patch: Partial<QuizAssignmentSettings>
  ) => Promise<void>;
  /** Publish this assignment as a shareable link. Returns the /share/assignment/{id} URL. */
  shareAssignment: (
    assignmentId: string,
    quizData: QuizData
  ) => Promise<string>;
  /**
   * Import a shared assignment. Delegates quiz copy to the injected saveQuiz
   * (from useQuiz.ts) and creates a new paused assignment under the importer's
   * collection. Returns the new assignmentId.
   */
  importSharedAssignment: (
    shareId: string,
    saveQuiz: (quiz: QuizData) => Promise<{ id: string; driveFileId: string }>
  ) => Promise<string>;
}

/** Unique 6-char join code generator with collision check against live sessions. */
async function allocateJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
      .padEnd(6, '0');
    const collision = await getDocs(
      query(
        collection(db, QUIZ_SESSIONS_COLLECTION),
        where('code', '==', candidate),
        where('status', '!=', 'ended')
      )
    );
    if (collision.empty) return candidate;
  }
  // Last-resort fallback: we accept a theoretical collision rather than
  // blocking the teacher from starting a quiz.
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()
    .padEnd(6, '0');
}

export const useQuizAssignments = (
  userId: string | undefined
): UseQuizAssignmentsResult => {
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [error, setError] = useState<string | null>(null);

  // Adjust state during render when userId transitions away — avoids the
  // "set-state-in-effect" anti-pattern while still clearing stale data when
  // the user signs out.
  const [prevUserId, setPrevUserId] = useState(userId);
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    if (!userId) {
      setAssignments([]);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }
  }

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'users', userId, QUIZ_ASSIGNMENTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAssignments(snap.docs.map((d) => d.data() as QuizAssignment));
        setLoading(false);
      },
      (err) => {
        console.error('[useQuizAssignments] Firestore error:', err);
        setError('Failed to load assignments');
        setLoading(false);
      }
    );
    return unsub;
  }, [userId]);

  const createAssignment = useCallback<
    UseQuizAssignmentsResult['createAssignment']
  >(
    async (quiz, settings, initialStatus = 'active') => {
      if (!userId) throw new Error('Not authenticated');

      const assignmentId = crypto.randomUUID();
      const code = await allocateJoinCode();
      const now = Date.now();

      const assignment: QuizAssignment = {
        id: assignmentId,
        quizId: quiz.id,
        quizTitle: quiz.title,
        quizDriveFileId: quiz.driveFileId,
        teacherUid: userId,
        code,
        status: initialStatus,
        createdAt: now,
        updatedAt: now,
        className: settings.className,
        sessionMode: settings.sessionMode,
        sessionOptions: settings.sessionOptions,
        plcMode: settings.plcMode,
        plcSheetUrl: settings.plcSheetUrl,
        teacherName: settings.teacherName,
        periodName: settings.periodName,
        plcMemberEmails: settings.plcMemberEmails,
      };

      const mode = settings.sessionMode;
      const opts = settings.sessionOptions;
      const sessionStatus: QuizSession['status'] =
        initialStatus === 'paused'
          ? 'paused'
          : initialStatus === 'inactive'
            ? 'ended'
            : 'waiting';

      const session: QuizSession = {
        id: assignmentId,
        assignmentId,
        quizId: quiz.id,
        quizTitle: quiz.title,
        teacherUid: userId,
        status: sessionStatus,
        sessionMode: mode,
        currentQuestionIndex: mode === 'student' ? 0 : -1,
        startedAt: mode === 'student' ? now : null,
        endedAt: null,
        code,
        totalQuestions: quiz.questions.length,
        publicQuestions: quiz.questions.map(toPublicQuestion),
        // Phase 1 toggles
        tabWarningsEnabled: opts.tabWarningsEnabled ?? true,
        showResultToStudent: opts.showResultToStudent ?? false,
        showCorrectAnswerToStudent: opts.showCorrectAnswerToStudent ?? false,
        showCorrectOnBoard: opts.showCorrectOnBoard ?? false,
        revealedAnswers: {},
        // Phase 2 gamification
        speedBonusEnabled: opts.speedBonusEnabled ?? false,
        streakBonusEnabled: opts.streakBonusEnabled ?? false,
        showPodiumBetweenQuestions: opts.showPodiumBetweenQuestions ?? true,
        soundEffectsEnabled: opts.soundEffectsEnabled ?? false,
        questionPhase: 'answering',
      };

      const batch = writeBatch(db);
      batch.set(
        doc(db, 'users', userId, QUIZ_ASSIGNMENTS_COLLECTION, assignmentId),
        assignment
      );
      batch.set(doc(db, QUIZ_SESSIONS_COLLECTION, assignmentId), session);
      await batch.commit();

      return { id: assignmentId, code };
    },
    [userId]
  );

  const setStatus = useCallback(
    async (
      assignmentId: string,
      assignmentStatus: QuizAssignmentStatus,
      sessionStatus: QuizSession['status']
    ): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      const now = Date.now();
      const batch = writeBatch(db);
      batch.update(
        doc(db, 'users', userId, QUIZ_ASSIGNMENTS_COLLECTION, assignmentId),
        { status: assignmentStatus, updatedAt: now }
      );
      const sessionPatch: Partial<QuizSession> = { status: sessionStatus };
      if (sessionStatus === 'ended') sessionPatch.endedAt = now;
      batch.update(
        doc(db, QUIZ_SESSIONS_COLLECTION, assignmentId),
        sessionPatch as Record<string, unknown>
      );
      await batch.commit();
    },
    [userId]
  );

  const pauseAssignment = useCallback<
    UseQuizAssignmentsResult['pauseAssignment']
  >(
    async (assignmentId) => {
      await setStatus(assignmentId, 'paused', 'paused');
    },
    [setStatus]
  );

  const resumeAssignment = useCallback<
    UseQuizAssignmentsResult['resumeAssignment']
  >(
    async (assignmentId) => {
      // Resume into 'active'; teacher-mode sessions that were never started
      // still function because students look up by code, not by status.
      await setStatus(assignmentId, 'active', 'active');
    },
    [setStatus]
  );

  const deactivateAssignment = useCallback<
    UseQuizAssignmentsResult['deactivateAssignment']
  >(
    async (assignmentId) => {
      await setStatus(assignmentId, 'inactive', 'ended');
    },
    [setStatus]
  );

  const deleteAssignment = useCallback<
    UseQuizAssignmentsResult['deleteAssignment']
  >(
    async (assignmentId) => {
      if (!userId) throw new Error('Not authenticated');

      // Delete all response documents first (batched)
      const responsesSnap = await getDocs(
        collection(
          db,
          QUIZ_SESSIONS_COLLECTION,
          assignmentId,
          RESPONSES_COLLECTION
        )
      );
      const BATCH_LIMIT = 500;
      for (let i = 0; i < responsesSnap.docs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        responsesSnap.docs
          .slice(i, i + BATCH_LIMIT)
          .forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      // Delete the session doc and the assignment doc in one batch
      const batch = writeBatch(db);
      batch.delete(doc(db, QUIZ_SESSIONS_COLLECTION, assignmentId));
      batch.delete(
        doc(db, 'users', userId, QUIZ_ASSIGNMENTS_COLLECTION, assignmentId)
      );
      await batch.commit();
    },
    [userId]
  );

  const updateAssignmentSettings = useCallback<
    UseQuizAssignmentsResult['updateAssignmentSettings']
  >(
    async (assignmentId, patch) => {
      if (!userId) throw new Error('Not authenticated');
      await updateDoc(
        doc(db, 'users', userId, QUIZ_ASSIGNMENTS_COLLECTION, assignmentId),
        { ...patch, updatedAt: Date.now() } as Record<string, unknown>
      );
    },
    [userId]
  );

  const shareAssignment = useCallback<
    UseQuizAssignmentsResult['shareAssignment']
  >(
    async (assignmentId, quizData) => {
      if (!userId) throw new Error('Not authenticated');
      const snap = await getDoc(
        doc(db, 'users', userId, QUIZ_ASSIGNMENTS_COLLECTION, assignmentId)
      );
      if (!snap.exists()) throw new Error('Assignment not found');
      const assignment = snap.data() as QuizAssignment;

      const payload: Omit<SharedQuizAssignment, 'id'> = {
        title: quizData.title,
        questions: quizData.questions,
        createdAt: quizData.createdAt,
        updatedAt: quizData.updatedAt,
        assignmentSettings: {
          className: assignment.className,
          sessionMode: assignment.sessionMode,
          sessionOptions: assignment.sessionOptions,
          plcMode: assignment.plcMode,
          plcSheetUrl: assignment.plcSheetUrl,
          teacherName: assignment.teacherName,
          periodName: assignment.periodName,
          plcMemberEmails: assignment.plcMemberEmails,
        },
        originalAuthor: userId,
        sharedAt: Date.now(),
      };
      const ref = await addDoc(
        collection(db, SHARED_ASSIGNMENTS_COLLECTION),
        payload
      );
      return `${window.location.origin}/share/assignment/${ref.id}`;
    },
    [userId]
  );

  const importSharedAssignment = useCallback<
    UseQuizAssignmentsResult['importSharedAssignment']
  >(
    async (shareId, saveQuiz) => {
      if (!userId) throw new Error('Not authenticated');

      const snap = await getDoc(
        doc(db, SHARED_ASSIGNMENTS_COLLECTION, shareId)
      );
      if (!snap.exists()) throw new Error('Shared assignment not found');
      const shared = snap.data() as SharedQuizAssignment;

      // 1. Copy the quiz into the importer's library.
      const now = Date.now();
      const newQuiz: QuizData = {
        id: crypto.randomUUID(),
        title: shared.title,
        questions: shared.questions,
        createdAt: now,
        updatedAt: now,
      };
      const savedMeta = await saveQuiz(newQuiz);

      // 2. Create a Paused assignment with the shared settings.
      const created = await createAssignment(
        {
          id: savedMeta.id,
          title: newQuiz.title,
          driveFileId: savedMeta.driveFileId,
          questions: newQuiz.questions,
        },
        shared.assignmentSettings,
        'paused'
      );
      return created.id;
    },
    [userId, createAssignment]
  );

  return {
    assignments,
    loading,
    error,
    createAssignment,
    pauseAssignment,
    resumeAssignment,
    deactivateAssignment,
    deleteAssignment,
    updateAssignmentSettings,
    shareAssignment,
    importSharedAssignment,
  };
};
