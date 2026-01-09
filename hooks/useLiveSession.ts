import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LiveSession, LiveStudent, WidgetType, WidgetConfig } from '../types';

// Constants for Firestore Paths
const SESSIONS_COLLECTION = 'sessions';
const STUDENTS_COLLECTION = 'students';

/**
 * Custom hook for managing live classroom sessions.
 * Supports both teacher and student roles with different behaviors:
 *
 * **Teacher Mode** (`role: 'teacher'`):
 * - Creates and manages live sessions
 * - Broadcasts widget state to students
 * - Controls freeze state (global and per-student)
 * - Monitors connected students
 *
 * **Student Mode** (`role: 'student'`):
 * - Joins sessions via join code
 * - Receives real-time updates of active widget
 * - Responds to freeze commands from teacher
 * - Maintains connection status
 *
 * @param userId - The authenticated user's ID (required for teachers, undefined for students)
 * @param role - Either 'teacher' or 'student' to determine behavior
 * @param joinCode - Optional join code for students to connect to a session
 *
 * @returns {Object} Hook state and actions:
 * - `session`: Current live session data (null if no active session)
 * - `students`: Array of connected students (teacher mode only)
 * - `loading`: Whether initial data is being loaded
 * - `studentId`: The student's unique ID (student mode only)
 * - `individualFrozen`: Whether this student is individually frozen (student mode only)
 * - `joinSession`: Function to join a session with name and code (student mode)
 * - `startSession`: Function to start a new live session (teacher mode)
 * - `updateSessionConfig`: Function to update active widget config (teacher mode)
 * - `endSession`: Function to end the current session (teacher mode)
 * - `toggleFreezeStudent`: Function to freeze/unfreeze a student (teacher mode)
 * - `toggleGlobalFreeze`: Function to freeze/unfreeze all students (teacher mode)
 *
 * @example
 * // Teacher creating a session
 * const { session, students, startSession, endSession } = useLiveSession(userId, 'teacher');
 *
 * @example
 * // Student joining a session
 * const { session, loading, joinSession, individualFrozen } = useLiveSession(undefined, 'student', code);
 */
export const useLiveSession = (
  userId: string | undefined,
  role: 'teacher' | 'student',
  joinCode?: string
) => {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [loading, setLoading] = useState(
    role === 'teacher' || (role === 'student' && !!joinCode)
  );
  const [studentId, setStudentId] = useState<string | null>(null);
  const [individualFrozen, setIndividualFrozen] = useState(false);

  // TEACHER: Subscribe to own session
  useEffect(() => {
    if (role !== 'teacher' || !userId) return;

    const sessionRef = doc(db, SESSIONS_COLLECTION, userId);

    const unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession(docSnap.data() as LiveSession);
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    // Subscribe to students in this session
    const studentsRef = collection(
      db,
      SESSIONS_COLLECTION,
      userId,
      STUDENTS_COLLECTION
    );
    const unsubscribeStudents = onSnapshot(studentsRef, (snapshot) => {
      const studentList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as LiveStudent[];
      setStudents(studentList);
    });

    return () => {
      unsubscribeSession();
      unsubscribeStudents();
    };
  }, [userId, role]);

  // STUDENT: Subscribe to joined session
  useEffect(() => {
    if (role !== 'student' || !joinCode) {
      return;
    }

    // 1. Subscribe to the Session (Global State: Active Widget, Freeze)
    // In V1, joinCode is the teacher's userId which we use as the session document ID
    const sessionRef = doc(db, SESSIONS_COLLECTION, joinCode);
    const unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession(docSnap.data() as LiveSession);
      } else {
        setSession(null); // Session ended or invalid code
      }
      setLoading(false);
    });

    // 2. Subscribe to My Student Status (Am I individually frozen?)
    let unsubscribeStudent = () => {
      // Cleanup
    };
    if (studentId) {
      const myStudentRef = doc(
        db,
        SESSIONS_COLLECTION,
        joinCode,
        STUDENTS_COLLECTION,
        studentId
      );
      unsubscribeStudent = onSnapshot(myStudentRef, (docSnap) => {
        if (docSnap.exists()) {
          const studentData = docSnap.data() as LiveStudent;
          setIndividualFrozen(studentData.status === 'frozen');
        }
      });
    }

    return () => {
      unsubscribeSession();
      unsubscribeStudent();
    };
  }, [joinCode, role, studentId]);

  // --- ACTIONS ---

  const joinSession = async (name: string, rawCode: string) => {
    // 1. Find session by Code with robust sanitization
    // Remove all non-alphanumeric characters and normalize to uppercase
    const normalizedCode = rawCode
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();

    if (!normalizedCode) {
      throw new Error('Invalid code format');
    }

    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const q = query(sessionsRef, where('code', '==', normalizedCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Session not found');
    }

    const sessionDoc = querySnapshot.docs[0];
    const teacherId = sessionDoc.id;

    // 2. Add student to subcollection
    const studentsRef = collection(
      db,
      SESSIONS_COLLECTION,
      teacherId,
      STUDENTS_COLLECTION
    );
    const newStudent: Omit<LiveStudent, 'id'> = {
      name,
      status: 'active',
      joinedAt: Date.now(),
      lastActive: Date.now(),
    };

    const docRef = await addDoc(studentsRef, newStudent);
    setStudentId(docRef.id);
    // Save to sessionStorage so reload doesn't kill session (optional for V1)
    sessionStorage.setItem('spart_student_id', docRef.id);
    return teacherId;
  };

  const startSession = useCallback(
    async (widgetId: string, widgetType: string, config?: WidgetConfig) => {
      if (!userId) return;
      const sessionRef = doc(db, SESSIONS_COLLECTION, userId);
      const newSession: LiveSession = {
        id: userId,
        isActive: true,
        activeWidgetId: widgetId,
        activeWidgetType: widgetType as WidgetType,
        activeWidgetConfig: config,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        frozen: false,
        createdAt: Date.now(),
      };
      await setDoc(sessionRef, newSession);
    },
    [userId]
  );

  const updateSessionConfig = useCallback(
    async (config: WidgetConfig) => {
      if (!userId) return;
      const sessionRef = doc(db, SESSIONS_COLLECTION, userId);
      await updateDoc(sessionRef, { activeWidgetConfig: config });
    },
    [userId]
  );

  const endSession = useCallback(async () => {
    if (!userId) return;
    const sessionRef = doc(db, SESSIONS_COLLECTION, userId);
    await updateDoc(sessionRef, {
      isActive: false,
      activeWidgetId: null,
      frozen: false,
    });

    // Mark students as disconnected when session ends
    const studentsRef = collection(
      db,
      SESSIONS_COLLECTION,
      userId,
      STUDENTS_COLLECTION
    );
    const studentsSnapshot = await getDocs(studentsRef);
    const disconnectPromises = studentsSnapshot.docs.map((doc) =>
      updateDoc(doc.ref, { status: 'disconnected' })
    );
    await Promise.all(disconnectPromises);
  }, [userId]);

  const toggleFreezeStudent = useCallback(
    async (
      studentId: string,
      currentStatus: 'active' | 'frozen' | 'disconnected'
    ) => {
      if (!userId) return;
      const studentRef = doc(
        db,
        SESSIONS_COLLECTION,
        userId,
        STUDENTS_COLLECTION,
        studentId
      );
      await updateDoc(studentRef, {
        status: currentStatus === 'active' ? 'frozen' : 'active',
      });
    },
    [userId]
  );

  const toggleGlobalFreeze = useCallback(
    async (freeze: boolean) => {
      if (!userId) return;
      const sessionRef = doc(db, SESSIONS_COLLECTION, userId);
      await updateDoc(sessionRef, { frozen: freeze });
    },
    [userId]
  );

  return {
    session,
    students,
    loading,
    startSession,
    updateSessionConfig,
    endSession,
    toggleFreezeStudent,
    toggleGlobalFreeze,
    joinSession,
    studentId,
    individualFrozen,
  };
};
