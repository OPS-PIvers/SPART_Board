import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db, isAuthBypass } from '../../config/firebase';
import {
  FeaturePermission,
  WidgetType,
  InternalToolType,
  GradeLevel,
} from '../../types';
import { TOOLS } from '../../config/tools';
import { ALL_GRADE_LEVELS } from '../../config/widgetGradeLevels';
import {
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  X,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useInstructionalRoutines } from '../../hooks/useInstructionalRoutines';
import { LibraryManager } from '../widgets/InstructionalRoutines/LibraryManager';
import { InstructionalRoutine } from '../../config/instructionalRoutines';
import { ConfirmDialog } from '../widgets/InstructionalRoutines/ConfirmDialog';
import { getRoutineColorClasses } from '../widgets/InstructionalRoutines/colorHelpers';
import { FeaturePermissionItem } from './FeaturePermissionItem';

export const FeaturePermissionsManager: React.FC = () => {
  const { routines, deleteRoutine, saveRoutine } = useInstructionalRoutines();
  const [editingRoutine, setEditingRoutine] =
    useState<InstructionalRoutine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    routineId: string;
    routineName: string;
  } | null>(null);
  const [permissions, setPermissions] = useState<
    Map<WidgetType | InternalToolType, FeaturePermission>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<WidgetType | InternalToolType>>(
    new Set()
  );
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<
    Set<WidgetType | InternalToolType>
  >(new Set());
  const [editingConfig, setEditingConfig] = useState<
    WidgetType | InternalToolType | null
  >(null);
  const [isRoutinesLibraryOpen, setIsRoutinesLibraryOpen] = useState(false);

  // New State for View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    const timeoutId = setTimeout(() => setMessage(null), 3000);
    // Return cleanup function
    return () => clearTimeout(timeoutId);
  }, []);

  const loadPermissions = useCallback(async () => {
    if (isAuthBypass) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'feature_permissions'));
      const permMap = new Map<
        WidgetType | InternalToolType,
        FeaturePermission
      >();

      snapshot.forEach((doc) => {
        const data = doc.data() as FeaturePermission;
        // Migration fix: If fetched permission still has "universal", clean it up
        if (
          data.gradeLevels &&
          data.gradeLevels.includes('universal' as GradeLevel)
        ) {
          data.gradeLevels = ALL_GRADE_LEVELS;
        }
        permMap.set(data.widgetType, data);
      });

      setPermissions(permMap);
    } catch (error) {
      console.error('Error loading permissions:', error);
      showMessage('error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // Load permissions from Firestore
  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const getPermission = (
    widgetType: WidgetType | InternalToolType
  ): FeaturePermission => {
    return (
      permissions.get(widgetType) ?? {
        widgetType,
        accessLevel: 'public',
        betaUsers: [],
        enabled: true,
      }
    );
  };

  const updatePermission = (
    widgetType: WidgetType | InternalToolType,
    updates: Partial<FeaturePermission>
  ) => {
    const current = getPermission(widgetType);
    const updated = { ...current, ...updates };
    setPermissions(new Map(permissions).set(widgetType, updated));
    // Mark as having unsaved changes
    setUnsavedChanges(new Set(unsavedChanges).add(widgetType));
  };

  const savePermission = async (widgetType: WidgetType | InternalToolType) => {
    try {
      setSaving(new Set(saving).add(widgetType));
      const permission = getPermission(widgetType);

      await setDoc(doc(db, 'feature_permissions', widgetType), permission);

      // Clear unsaved changes flag for this widget
      setUnsavedChanges((prev) => {
        const next = new Set(prev);
        next.delete(widgetType);
        return next;
      });

      showMessage('success', `Saved ${widgetType} permissions`);
    } catch (error) {
      console.error('Error saving permission:', error);
      showMessage('error', `Failed to save ${widgetType} permissions`);
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(widgetType);
        return next;
      });
    }
  };

  const deletePermission = async (
    widgetType: WidgetType | InternalToolType
  ) => {
    if (
      !confirm(
        `Remove permission rules for ${widgetType}? It will revert to default (public access).`
      )
    ) {
      return;
    }

    try {
      setSaving(new Set(saving).add(widgetType));
      await deleteDoc(doc(db, 'feature_permissions', widgetType));

      setPermissions((prev) => {
        const next = new Map(prev);
        next.delete(widgetType);
        return next;
      });

      // Clear unsaved changes flag for this widget
      setUnsavedChanges((prev) => {
        const next = new Set(prev);
        next.delete(widgetType);
        return next;
      });

      showMessage('success', `Removed ${widgetType} permissions`);
    } catch (error) {
      console.error('Error deleting permission:', error);
      showMessage('error', `Failed to remove ${widgetType} permissions`);
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(widgetType);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message Toast */}
      {message && (
        <div
          className={`fixed top-6 right-6 z-toast px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top ${
            message.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* View Switcher */}
      <div className="flex justify-end mb-4">
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-all ${
              viewMode === 'grid'
                ? 'bg-brand-blue-primary text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-all ${
              viewMode === 'list'
                ? 'bg-brand-blue-primary text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Permission Cards */}
      <div
        className={`${
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-2'
        }`}
      >
        {TOOLS.map((tool) => {
          const permission = getPermission(tool.type);
          const hasCustomPermission = permissions.has(tool.type);
          const isSaving = saving.has(tool.type);
          const hasUnsavedChanges = unsavedChanges.has(tool.type);
          const isEditing = editingConfig === tool.type;

          return (
            <FeaturePermissionItem
              key={tool.type}
              tool={tool}
              permission={permission}
              viewMode={viewMode}
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
              hasCustomPermission={hasCustomPermission}
              isEditing={isEditing}
              onUpdate={(updates) => updatePermission(tool.type, updates)}
              onSave={() => savePermission(tool.type)}
              onDelete={() => deletePermission(tool.type)}
              onToggleEditing={() =>
                setEditingConfig(isEditing ? null : tool.type)
              }
              onOpenLibrary={() => setIsRoutinesLibraryOpen(true)}
              isLibraryOpen={isRoutinesLibraryOpen}
              showMessage={showMessage}
            />
          );
        })}
      </div>

      {/* Instructional Routines Library Modal */}
      {isRoutinesLibraryOpen && (
        <div className="fixed inset-0 z-modal-nested bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">
                Instructional Routines Library
              </h3>
              <button
                onClick={() => setIsRoutinesLibraryOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    Manage global templates available to all teachers.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingRoutine({
                      id: crypto.randomUUID(),
                      name: '',
                      grades: 'Universal',
                      gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
                      icon: 'Zap',
                      color: 'blue',
                      steps: [
                        {
                          text: '',
                          icon: 'Zap',
                          color: 'blue',
                          label: 'Step',
                        },
                      ],
                    })
                  }
                  className="px-4 py-2 bg-brand-blue-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand-blue-dark transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> New Routine
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {routines.map((routine) => {
                  const colorClasses = getRoutineColorClasses(
                    routine.color || 'blue'
                  );
                  return (
                    <div
                      key={routine.id}
                      className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between group hover:border-brand-blue-light transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${colorClasses.bg} ${colorClasses.text}`}
                        >
                          <div className="w-6 h-6 flex items-center justify-center">
                            {/* Generic icon since dynamic lucide loading is complex here */}
                            <div className="w-4 h-4 rounded-full bg-current opacity-50" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 leading-tight">
                            {routine.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            {routine.grades}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => setEditingRoutine(routine)}
                          className="p-2 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-brand-blue-primary transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                          title="Edit Routine"
                        >
                          <Edit size={16} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              routineId: routine.id,
                              routineName: routine.name,
                            });
                          }}
                          className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                          title="Delete Routine"
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {routines.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">
                      No routines in library
                    </p>
                    <p className="text-xs mt-1">
                      Create your first routine template to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routine Editor Modal */}
      {editingRoutine && (
        <div className="fixed inset-0 z-modal-deep bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <LibraryManager
              routine={editingRoutine}
              onChange={setEditingRoutine}
              onSave={async () => {
                await saveRoutine(editingRoutine);
                setEditingRoutine(null);
                showMessage('success', 'Routine saved to library');
              }}
              onCancel={() => setEditingRoutine(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Routine"
          message={`Are you sure you want to delete "${deleteConfirm.routineName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            try {
              await deleteRoutine(deleteConfirm.routineId);
              showMessage('success', 'Routine deleted successfully');
            } catch (error) {
              console.error('Failed to delete routine:', error);
              showMessage(
                'error',
                'Failed to delete routine. Please try again.'
              );
            } finally {
              setDeleteConfirm(null);
            }
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
