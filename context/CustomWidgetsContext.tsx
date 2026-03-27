import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Puzzle } from 'lucide-react';
import { db, isConfigured, isAuthBypass } from '../config/firebase';
import { CustomWidgetDoc, ToolMetadata } from '../types';
import { useAuth } from './useAuth';
import { CustomWidgetsContext } from './CustomWidgetsContextValue';

export { CustomWidgetsContext } from './CustomWidgetsContextValue';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const CustomWidgetsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAdmin, selectedBuildings } = useAuth();
  const [customWidgets, setCustomWidgets] = useState<CustomWidgetDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore listener
  useEffect(() => {
    if (!user || !isConfigured || isAuthBypass) {
      const timer = setTimeout(() => {
        setCustomWidgets([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Admins get an unconstrained listener; non-admins use a filtered query
    // to satisfy Firestore's rule-consistent-query requirement.
    const ref = isAdmin
      ? collection(db, 'custom_widgets')
      : query(
          collection(db, 'custom_widgets'),
          where('published', '==', true),
          where('enabled', '==', true)
        );

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as CustomWidgetDoc[];

        // For non-admins the query already filters; for admins we also apply
        // building targeting using selectedBuildings from auth context.
        const filtered = isAdmin
          ? docs
          : docs.filter(
              (w) =>
                w.published &&
                w.enabled &&
                (w.accessLevel === 'public' ||
                  (w.accessLevel === 'beta' &&
                    user.email != null &&
                    w.betaUsers.includes(user.email.toLowerCase()))) &&
                (w.buildings.length === 0 ||
                  w.buildings.some((b) => selectedBuildings.includes(b)))
            );

        setCustomWidgets(filtered);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsub;
  }, [user, isAdmin, selectedBuildings]);

  // Compute dynamic tool metadata for published custom widgets
  const customTools = useMemo<ToolMetadata[]>(() => {
    return customWidgets
      .filter((w) => w.published && w.enabled)
      .map((w) => ({
        type: 'custom-widget' as const,
        label: w.title,
        color: w.color,
        icon: Puzzle,
        defaultWidth: w.defaultWidth,
        defaultHeight: w.defaultHeight,
        customWidgetId: w.id,
        customWidgetIcon: w.icon,
      }));
  }, [customWidgets]);

  const saveCustomWidget = useCallback(
    async (widgetDoc: Omit<CustomWidgetDoc, 'id'> & { id?: string }) => {
      if (!isConfigured || isAuthBypass)
        throw new Error('Firebase not configured');
      const id = widgetDoc.id ?? crypto.randomUUID();
      const ref = doc(db, 'custom_widgets', id);
      await setDoc(
        ref,
        { ...widgetDoc, id, updatedAt: Date.now() },
        { merge: true }
      );
      return id;
    },
    []
  );

  const setPublished = useCallback(async (id: string, published: boolean) => {
    if (!isConfigured || isAuthBypass) return;
    await updateDoc(doc(db, 'custom_widgets', id), {
      published,
      updatedAt: Date.now(),
    });
  }, []);

  const deleteCustomWidget = useCallback(async (id: string) => {
    if (!isConfigured || isAuthBypass) return;
    await deleteDoc(doc(db, 'custom_widgets', id));
  }, []);

  const value = useMemo(
    () => ({
      customWidgets,
      customTools,
      loading,
      saveCustomWidget,
      setPublished,
      deleteCustomWidget,
    }),
    [
      customWidgets,
      customTools,
      loading,
      saveCustomWidget,
      setPublished,
      deleteCustomWidget,
    ]
  );

  return (
    <CustomWidgetsContext.Provider value={value}>
      {children}
    </CustomWidgetsContext.Provider>
  );
};
