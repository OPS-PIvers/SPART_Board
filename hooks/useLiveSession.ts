import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  collection,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LiveSession, LiveStudent, WidgetType } from '../types';

// Constants for Firestore Paths
const SESSIONS_COL = 'sessions';
const STUDENTS_COL = 'students';

export const useLiveSession = (
  userId: string | undefined,
  role: 'teacher' | 'student'
) => {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [loading, setLoading] = useState(true);

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
        id: doc.id,
        ...doc.data(),
      })) as LiveStudent[];
      setStudents(studentList);
    });

    return () => {
      unsubscribeSession();
      unsubscribeStudents();
    };
  }, [userId, role]);

  // STUDENT: Subscribe to joined session (logic to be expanded in Student App)
  // For V1 in this hook, we focus on the Teacher's "Control" side.

  // --- ACTIONS ---

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
  };
};
