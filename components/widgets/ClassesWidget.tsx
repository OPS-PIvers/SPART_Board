import React, { useState } from 'react';
import {
  WidgetData,
  Student,
  ClassRoster,
  ClassLinkClass,
  ClassLinkStudent,
} from '../../types';
import { useDashboard } from '../../context/useDashboard';
import {
  Plus,
  Trash2,
  Save,
  Star,
  Edit2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../common/Button';
import { classLinkService } from '../../utils/classlinkService';

interface Props {
  widget: WidgetData;
}

interface EditorProps {
  roster: ClassRoster | null;
  onSave: (name: string, students: Student[]) => void;
  onBack: () => void;
}

import { WidgetLayout } from './WidgetLayout';

const RosterEditor: React.FC<EditorProps> = ({ roster, onSave, onBack }) => {
  const [name, setName] = useState(roster?.name ?? '');
  const [firsts, setFirsts] = useState(
    roster?.students.map((s) => s.firstName).join('\n') ?? ''
  );
  const [lasts, setLasts] = useState(
    roster?.students.map((s) => s.lastName).join('\n') ?? ''
  );
  const [showLastNames, setShowLastNames] = useState(
    roster?.students.some((s) => s.lastName.trim() !== '') ?? false
  );

  const handleToggleToLastNames = () => {
    // When enabling last names, try to split full names on space
    if (!showLastNames) {
      const lines = firsts.split('\n');
      const newFirsts: string[] = [];
      const newLasts: string[] = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) {
          const lastSpaceIndex = trimmed.lastIndexOf(' ');
          if (lastSpaceIndex > 0) {
            // Split on last space (common pattern: "First Middle Last")
            newFirsts.push(trimmed.substring(0, lastSpaceIndex));
            newLasts.push(trimmed.substring(lastSpaceIndex + 1));
          } else {
            // No space found, keep in first name
            newFirsts.push(trimmed);
            newLasts.push('');
          }
        } else {
          newFirsts.push('');
          newLasts.push('');
        }
      });

      setFirsts(newFirsts.join('\n'));
      setLasts(newLasts.join('\n'));
      setShowLastNames(true);
    }
  };

  const handleToggleToSingleField = () => {
    // When disabling last names, merge first and last names
    if (showLastNames) {
      const fList = firsts.split('\n');
      const lList = lasts.split('\n');
      const merged: string[] = [];

      const maxLength = Math.max(fList.length, lList.length);
      for (let i = 0; i < maxLength; i++) {
        const first = fList[i] ? fList[i].trim() : '';
        const last = lList[i] ? lList[i].trim() : '';
        if (first || last) {
          merged.push([first, last].filter(Boolean).join(' '));
        } else {
          merged.push('');
        }
      }

      setFirsts(merged.join('\n'));
      setLasts('');
      setShowLastNames(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const fList = firsts.split('\n');
    const lList = lasts.split('\n');

    // Maintain stable IDs by matching against existing students in the roster
    const existingStudents = roster?.students ?? [];

    const students: Student[] = fList
      .map((f, i) => {
        const first = f.trim();
        const last = lList[i] ? lList[i].trim() : '';
        if (!first && !last) return null;

        // Try to find an existing student at this position to preserve ID
        // This is a simple heuristic: if index matches, reuse ID.
        // For more complex reordering, we'd need a more advanced diffing logic,
        // but this already significantly improves upon regenerating everything.
        const existing = existingStudents[i];
        const id = existing ? existing.id : crypto.randomUUID();

        return { id, firstName: first, lastName: last };
      })
      .filter((s): s is Student => s !== null);

    onSave(name, students);
  };

  return (
    <WidgetLayout
      padding="p-0"
      header={
        <div className="flex justify-between items-center p-3">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={14} />}
          >
            Back
          </Button>
          <div className="flex gap-2 items-center flex-1 ml-4 justify-end">
            <input
              className="border-b-2 border-slate-200 focus:border-blue-500 bg-transparent px-1 py-0.5 outline-none text-slate-800 placeholder-slate-400 min-w-0 text-sm font-bold"
              placeholder="Class Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              onClick={handleSave}
              variant="success"
              size="sm"
              icon={<Save size={14} />}
            >
              Save
            </Button>
          </div>
        </div>
      }
      content={
        <div
          className={`grid ${showLastNames ? 'grid-cols-2' : 'grid-cols-1'} gap-3 w-full h-full p-3`}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-end mb-1">
              <label className="text-xxs  text-slate-500 uppercase tracking-widest font-black">
                {showLastNames ? 'First Names' : 'Names (One per line)'}
              </label>
              {!showLastNames && (
                <Button
                  onClick={handleToggleToLastNames}
                  variant="ghost-primary"
                  size="sm"
                  icon={<Plus size={14} />}
                >
                  Add Last Name
                </Button>
              )}
            </div>
            <textarea
              className="flex-1 border border-slate-200 focus:border-blue-400 p-3 rounded-xl resize-none text-xs font-mono focus:ring-2 focus:ring-blue-100 outline-none transition-all custom-scrollbar bg-slate-50/30"
              value={firsts}
              onChange={(e) => setFirsts(e.target.value)}
              placeholder={
                showLastNames
                  ? 'Paste first names...'
                  : 'Paste full names or group names here...'
              }
            />
          </div>
          {showLastNames && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-end mb-1">
                <label className="text-xxs  text-slate-500 uppercase tracking-widest font-black">
                  Last Names
                </label>
                <Button
                  onClick={handleToggleToSingleField}
                  variant="ghost-muted-danger"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
              <textarea
                className="flex-1 border border-slate-200 focus:border-blue-400 p-3 rounded-xl resize-none text-xs font-mono focus:ring-2 focus:ring-blue-100 outline-none transition-all custom-scrollbar bg-slate-50/30"
                value={lasts}
                onChange={(e) => setLasts(e.target.value)}
                placeholder="Paste last names..."
              />
            </div>
          )}
        </div>
      }
    />
  );
};

const ClassesWidget: React.FC<Props> = ({ widget: _widget }) => {
  const {
    rosters,
    addRoster,
    updateRoster,
    deleteRoster,
    activeRosterId,
    setActiveRoster,
    addToast,
  } = useDashboard();

  const [view, setView] = useState<'list' | 'edit' | 'classlink'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ClassLink state
  const [classLinkLoading, setClassLinkLoading] = useState(false);
  const [classLinkClasses, setClassLinkClasses] = useState<ClassLinkClass[]>(
    []
  );
  const [classLinkStudents, setClassLinkStudents] = useState<
    Record<string, ClassLinkStudent[]>
  >({});

  const onSave = async (name: string, students: Student[]) => {
    if (!editingId) {
      await addRoster(name, students);
    } else {
      await updateRoster(editingId, { name, students });
    }
    setView('list');
    setEditingId(null);
  };

  const handleFetchClassLink = async () => {
    setClassLinkLoading(true);
    setView('classlink');
    try {
      const data = await classLinkService.getRosters(true);
      setClassLinkClasses(data.classes);
      setClassLinkStudents(data.studentsByClass);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch from ClassLink. Check console.', 'error');
      setView('list');
    } finally {
      setClassLinkLoading(false);
    }
  };

  const importClassLinkClass = async (cls: ClassLinkClass) => {
    try {
      const students: Student[] = (classLinkStudents[cls.sourcedId] || []).map(
        (s) => ({
          id: crypto.randomUUID(),
          firstName: s.givenName,
          lastName: s.familyName,
        })
      );

      // Add a nice Subject / Class Code prefix if available
      const subjectPrefix = cls.subject ? `${cls.subject} - ` : '';
      const codeSuffix = cls.classCode ? ` (${cls.classCode})` : '';
      const displayName = `${subjectPrefix}${cls.title}${codeSuffix}`;

      await addRoster(displayName, students);
      addToast(`Imported ${cls.title}`, 'success');
      setView('list');
    } catch (err) {
      console.error(err);
      addToast(`Failed to import ${cls.title}`, 'error');
    }
  };

  const editingRoster = rosters.find((r) => r.id === editingId) ?? null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {view === 'list' && (
        <WidgetLayout
          padding="p-0"
          header={
            <div style={{ padding: 'min(12px, 2.5cqmin)' }}>
              <div className="flex" style={{ gap: 'min(8px, 2cqmin)' }}>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setView('edit');
                  }}
                  className="flex-1 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                  style={{
                    padding: 'min(10px, 2cqmin)',
                    gap: 'min(8px, 2cqmin)',
                    fontSize: 'min(12px, 3cqmin)',
                  }}
                >
                  <Plus
                    style={{
                      width: 'min(16px, 4cqmin)',
                      height: 'min(16px, 4cqmin)',
                    }}
                  />{' '}
                  Create New Class
                </button>
                <button
                  onClick={handleFetchClassLink}
                  className="bg-white text-slate-700 border border-slate-200 rounded-xl font-black flex items-center justify-center hover:bg-slate-50 shadow-sm transition-all"
                  style={{
                    padding: 'min(10px, 2cqmin)',
                    gap: 'min(8px, 2cqmin)',
                    fontSize: 'min(12px, 3cqmin)',
                  }}
                  title="Sync from ClassLink"
                >
                  <RefreshCw
                    className={classLinkLoading ? 'animate-spin' : ''}
                    style={{
                      width: 'min(16px, 4cqmin)',
                      height: 'min(16px, 4cqmin)',
                    }}
                  />
                  ClassLink
                </button>
              </div>
            </div>
          }
          content={
            <div className="w-full h-full flex flex-col relative overflow-hidden">
              {confirmDeleteId && (
                <div
                  className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center text-center animate-in fade-in duration-200 backdrop-blur-sm"
                  style={{ padding: 'min(16px, 3.5cqmin)' }}
                >
                  <p
                    className="text-white font-bold uppercase tracking-tight"
                    style={{
                      fontSize: 'min(14px, 3.5cqmin)',
                      marginBottom: 'min(16px, 3.5cqmin)',
                    }}
                  >
                    Delete roster &quot;
                    {rosters.find((r) => r.id === confirmDeleteId)?.name}&quot;?
                    <br />
                    <span
                      className="text-red-400 font-black tracking-widest"
                      style={{ fontSize: 'min(10px, 2.5cqmin)' }}
                    >
                      This cannot be undone.
                    </span>
                  </p>
                  <div className="flex" style={{ gap: 'min(12px, 3cqmin)' }}>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-xl bg-slate-700 text-white font-black hover:bg-slate-600 transition-colors uppercase tracking-widest"
                      style={{
                        padding: 'min(8px, 2cqmin) min(24px, 5cqmin)',
                        fontSize: 'min(12px, 3cqmin)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (confirmDeleteId) {
                          await deleteRoster(confirmDeleteId);
                          setConfirmDeleteId(null);
                        }
                      }}
                      className="rounded-xl bg-red-600 text-white font-black hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 uppercase tracking-widest"
                      style={{
                        padding: 'min(8px, 2cqmin) min(24px, 5cqmin)',
                        fontSize: 'min(12px, 3cqmin)',
                      }}
                      title="Confirm deletion"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
              <div
                className="flex-1 overflow-y-auto custom-scrollbar flex flex-col"
                style={{
                  gap: 'min(8px, 2cqmin)',
                  padding: 'min(12px, 2.5cqmin)',
                }}
              >
                {rosters.length === 0 && (
                  <div
                    className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40"
                    style={{ gap: 'min(12px, 3cqmin)' }}
                  >
                    <Star
                      className="stroke-slate-300"
                      style={{
                        width: 'min(40px, 10cqmin)',
                        height: 'min(40px, 10cqmin)',
                      }}
                    />
                    <div className="text-center">
                      <p
                        className="font-black uppercase tracking-widest"
                        style={{ fontSize: 'min(14px, 3.5cqmin)' }}
                      >
                        No classes yet.
                      </p>
                      <p
                        className="font-bold"
                        style={{ fontSize: 'min(12px, 3cqmin)' }}
                      >
                        Create one to get started!
                      </p>
                    </div>
                  </div>
                )}
                {rosters.map((r) => (
                  <div
                    key={r.id}
                    className={`border rounded-2xl bg-white flex justify-between items-center transition-all hover:shadow-md ${activeRosterId === r.id ? 'ring-2 ring-blue-400 border-blue-400 shadow-lg shadow-blue-500/5' : 'border-slate-200'}`}
                    style={{ padding: 'min(14px, 3cqmin)' }}
                  >
                    <div
                      className="flex items-center flex-1 min-w-0"
                      style={{ gap: 'min(12px, 3cqmin)' }}
                    >
                      <button
                        onClick={() =>
                          setActiveRoster(activeRosterId === r.id ? null : r.id)
                        }
                        className={`transition-colors ${activeRosterId === r.id ? 'text-yellow-500 hover:text-yellow-600' : 'text-slate-200 hover:text-yellow-400'}`}
                        title={
                          activeRosterId === r.id
                            ? 'Active Class'
                            : 'Set as Active'
                        }
                      >
                        <Star
                          fill={
                            activeRosterId === r.id ? 'currentColor' : 'none'
                          }
                          style={{
                            width: 'min(24px, 5cqmin)',
                            height: 'min(24px, 5cqmin)',
                          }}
                          strokeWidth={2.5}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-slate-800 font-black truncate uppercase tracking-tight"
                          style={{ fontSize: 'min(24px, 5.5cqmin, 80cqw)' }}
                        >
                          {r.name}
                        </div>
                        <div
                          className="text-slate-400 font-bold uppercase tracking-widest"
                          style={{ fontSize: 'min(14px, 3.5cqmin, 70cqw)' }}
                        >
                          {r.students.length} Students
                        </div>
                      </div>
                    </div>
                    <div className="flex" style={{ gap: 'min(4px, 1cqmin)' }}>
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setView('edit');
                        }}
                        className="hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors"
                        style={{ padding: 'min(8px, 2cqmin)' }}
                        title="Edit Class"
                      >
                        <Edit2
                          style={{
                            width: 'min(18px, 4cqmin)',
                            height: 'min(18px, 4cqmin)',
                          }}
                        />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                        style={{ padding: 'min(8px, 2cqmin)' }}
                        title="Delete Class"
                      >
                        <Trash2
                          style={{
                            width: 'min(18px, 4cqmin)',
                            height: 'min(18px, 4cqmin)',
                          }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      )}

      {view === 'edit' && (
        <RosterEditor
          key={editingId ?? 'new'}
          roster={editingRoster}
          onSave={onSave}
          onBack={() => setView('list')}
        />
      )}

      {view === 'classlink' && (
        <WidgetLayout
          padding="p-0"
          header={
            <div
              className="flex justify-between items-center"
              style={{ padding: 'min(12px, 2.5cqmin)' }}
            >
              <button
                onClick={() => setView('list')}
                className="text-slate-500 hover:text-blue-600 uppercase tracking-wider font-bold"
                style={{ fontSize: 'min(12px, 3cqmin)' }}
              >
                &larr; Cancel
              </button>
              <h3
                className="text-slate-800 font-black uppercase tracking-widest"
                style={{ fontSize: 'min(12px, 3cqmin)' }}
              >
                ClassLink Rosters
              </h3>
              <div style={{ width: 'min(40px, 10cqmin)' }}></div>
            </div>
          }
          content={
            <div
              className="w-full h-full flex flex-col overflow-hidden"
              style={{ padding: 'min(12px, 2.5cqmin)' }}
            >
              {classLinkLoading ? (
                <div
                  className="flex-1 flex flex-col items-center justify-center text-slate-400"
                  style={{ gap: 'min(16px, 3.5cqmin)' }}
                >
                  <RefreshCw
                    className="animate-spin text-blue-500"
                    style={{
                      width: 'min(40px, 10cqmin)',
                      height: 'min(40px, 10cqmin)',
                    }}
                  />
                  <p
                    className="font-black uppercase tracking-widest opacity-60"
                    style={{ fontSize: 'min(14px, 3.5cqmin)' }}
                  >
                    Connecting to ClassLink...
                  </p>
                </div>
              ) : (
                <div
                  className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col"
                  style={{ gap: 'min(8px, 2cqmin)' }}
                >
                  {classLinkClasses.length === 0 ? (
                    <div
                      className="text-center text-slate-400 italic font-bold opacity-40"
                      style={{
                        paddingTop: 'min(48px, 10cqmin)',
                        paddingBottom: 'min(48px, 10cqmin)',
                        fontSize: 'min(14px, 3.5cqmin)',
                      }}
                    >
                      No classes found in ClassLink.
                    </div>
                  ) : (
                    classLinkClasses.map((cls) => (
                      <div
                        key={cls.sourcedId}
                        className="border border-slate-200 rounded-2xl bg-white flex justify-between items-center hover:shadow-md transition-all hover:border-blue-200 group"
                        style={{ padding: 'min(16px, 3.5cqmin)' }}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-slate-800 font-black uppercase tracking-tight truncate"
                            style={{ fontSize: 'min(14px, 3.5cqmin)' }}
                          >
                            {cls.title}
                          </div>
                          <div
                            className="text-slate-400 font-bold uppercase tracking-widest"
                            style={{ fontSize: 'min(10px, 2.5cqmin)' }}
                          >
                            {classLinkStudents[cls.sourcedId]?.length || 0}{' '}
                            Students
                          </div>
                        </div>
                        <button
                          onClick={() => importClassLinkClass(cls)}
                          className="bg-blue-50 text-blue-600 rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                          style={{
                            padding: 'min(8px, 2cqmin) min(16px, 3.5cqmin)',
                            fontSize: 'min(12px, 3cqmin)',
                          }}
                        >
                          Import
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          }
        />
      )}
    </div>
  );
};
export default ClassesWidget;
