import { useState, useEffect } from 'react';
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
import { LiveSession, LiveStudent, WidgetType } from '../types';

// Constants for Firestore Paths
const SESSIONS_COL = 'sessions';
const STUDENTS_COL = 'students';

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

  // TEACHER: Subscribe to own session
  useEffect(() => {
    if (role !== 'teacher' || !userId) return;

    const sessionRef = doc(db, SESSIONS_COL, userId);

    const unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession(docSnap.data() as LiveSession);
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    // Subscribe to students in this session
    const studentsRef = collection(db, SESSIONS_COL, userId, STUDENTS_COL);
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
    // Assuming joinCode is Teacher ID for V1
    const sessionRef = doc(db, SESSIONS_COL, joinCode);
    const unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession(docSnap.data() as LiveSession);
      } else {
        setSession(null); // Session ended or invalid code
      }
      setLoading(false);
    });

    // 2. Subscribe to My Student Status (Am I frozen?)
    let unsubscribeStudent = () => {
      // Cleanup
    };
    if (studentId) {
      const myStudentRef = doc(
        db,
        SESSIONS_COL,
        joinCode,
        STUDENTS_COL,
        studentId
      );
      unsubscribeStudent = onSnapshot(myStudentRef, (_docSnap) => {
        // Here we could update local state if we needed specific student data
        // For now, the global session 'frozen' is the main thing,
        // but individual freeze status is checked via the students list or this doc.
        // We might want to expose 'isFrozen' for this student.
      });
    }

    return () => {
      unsubscribeSession();
      unsubscribeStudent();
    };
  }, [joinCode, role, studentId]);

  // --- ACTIONS ---

  const joinSession = async (name: string, codeInput: string) => {
    // 1. Find session by Code (Case insensitive lookup would require a specific field or storage strategy,
    // but for now we assume exact match or uppercase match if we store it uppercase)
    const normalizedCode = codeInput.toUpperCase().trim();
    const sessionsRef = collection(db, SESSIONS_COL);
    const q = query(sessionsRef, where('code', '==', normalizedCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Session not found');
    }

    const sessionDoc = querySnapshot.docs[0];
    const teacherId = sessionDoc.id;

    // 2. Add student to subcollection
    const studentsRef = collection(db, SESSIONS_COL, teacherId, STUDENTS_COL);
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

  const startSession = async (widgetId: string, widgetType: string) => {
    if (!userId) return;
    const sessionRef = doc(db, SESSIONS_COL, userId);
    const newSession: LiveSession = {
      id: userId,
      isActive: true,
      activeWidgetId: widgetId,
      activeWidgetType: widgetType as WidgetType,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      frozen: false,
      createdAt: Date.now(),
    };
    await setDoc(sessionRef, newSession);
  };

  const endSession = async () => {
    if (!userId) return;
    const sessionRef = doc(db, SESSIONS_COL, userId);
    await updateDoc(sessionRef, { isActive: false, activeWidgetId: null });
  };

  const toggleFreezeStudent = async (
    studentId: string,
    currentStatus: 'active' | 'frozen'
  ) => {
    if (!userId) return;
    const studentRef = doc(db, SESSIONS_COL, userId, STUDENTS_COL, studentId);
    await updateDoc(studentRef, {
      status: currentStatus === 'active' ? 'frozen' : 'active',
    });
  };

  const toggleGlobalFreeze = async (freeze: boolean) => {
    if (!userId) return;
    const sessionRef = doc(db, SESSIONS_COL, userId);
    await updateDoc(sessionRef, { frozen: freeze });
  };

  return {
    session,
    students,
    loading,
    startSession,
    endSession,
    toggleFreezeStudent,
    toggleGlobalFreeze,
    joinSession,
    studentId,
  };
};
