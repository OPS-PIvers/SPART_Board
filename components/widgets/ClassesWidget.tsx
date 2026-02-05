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
  ExternalLink,
} from 'lucide-react';
import { classLinkService } from '../../utils/classlinkService';
import { Button } from '../common/Button';

interface Props {
  widget: WidgetData;
}

interface EditorProps {
  roster: ClassRoster | null;
  onSave: (name: string, students: Student[]) => void;
  onBack: () => void;
}

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
    <div className="flex flex-col h-full p-2">
      <div className="flex justify-between items-center mb-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          &larr; Back
        </Button>
        <div className="flex gap-2 items-center flex-1 ml-4 justify-end">
          <input
            className=" border-b-2 border-slate-200 focus:border-blue-500 bg-transparent px-1 py-0.5 outline-none text-slate-800 placeholder-slate-400 min-w-0"
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
      <div
        className={`grid ${showLastNames ? 'grid-cols-2' : 'grid-cols-1'} gap-3 flex-1 min-h-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end mb-1">
            <label className="text-xxs  text-slate-500 uppercase tracking-widest">
              {showLastNames ? 'First Names' : 'Names (One per line)'}
            </label>
            {!showLastNames && (
              <button
                onClick={handleToggleToLastNames}
                className="text-xxs text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider"
              >
                + Add Last Name
              </button>
            )}
          </div>
          <textarea
            className="flex-1 border border-slate-200 focus:border-blue-400 p-2 rounded-lg resize-none text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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
              <label className="text-xxs  text-slate-500 uppercase tracking-widest">
                Last Names
              </label>
              <button
                onClick={handleToggleToSingleField}
                className="text-xxs text-slate-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
              >
                Remove
              </button>
            </div>
            <textarea
              className="flex-1 border border-slate-200 focus:border-blue-400 p-2 rounded-lg resize-none text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              value={lasts}
              onChange={(e) => setLasts(e.target.value)}
              placeholder="Paste last names..."
            />
          </div>
        )}
      </div>
    </div>
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
        <div className="flex flex-col h-full p-2">
          {confirmDeleteId && (
            <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200">
              <p className="text-white font-semibold mb-4 text-sm">
                Delete roster &quot;
                {rosters.find((r) => r.id === confirmDeleteId)?.name}&quot;?
                This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setConfirmDeleteId(null)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (confirmDeleteId) {
                      await deleteRoster(confirmDeleteId);
                      setConfirmDeleteId(null);
                    }
                  }}
                  variant="danger"
                  title="Confirm deletion"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
          <div className="flex gap-2 mb-2">
            <Button
              onClick={() => {
                setEditingId(null);
                setView('edit');
              }}
              variant="primary"
              size="md"
              className="flex-1"
              icon={<Plus size={16} />}
            >
              Create New Class
            </Button>
            <Button
              onClick={handleFetchClassLink}
              variant="secondary"
              className="bg-white/40 border border-slate-200"
              title="Sync from ClassLink"
            >
              <RefreshCw
                size={16}
                className={classLinkLoading ? 'animate-spin' : ''}
              />
              ClassLink
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {rosters.length === 0 && (
              <div className="text-center text-slate-400 py-8 text-sm italic">
                No classes yet.
                <br />
                Create one to get started!
              </div>
            )}
            {rosters.map((r) => (
              <div
                key={r.id}
                className={`p-3 border rounded-lg bg-white/40 flex justify-between items-center transition-all hover:shadow-md ${activeRosterId === r.id ? 'ring-2 ring-blue-400 border-blue-400 shadow-sm' : 'border-slate-200'}`}
              >
                {' '}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() =>
                      setActiveRoster(activeRosterId === r.id ? null : r.id)
                    }
                    className={`transition-colors ${activeRosterId === r.id ? 'text-yellow-500 hover:text-yellow-600' : 'text-slate-300 hover:text-yellow-400'}`}
                    title={
                      activeRosterId === r.id ? 'Active Class' : 'Set as Active'
                    }
                  >
                    <Star
                      fill={activeRosterId === r.id ? 'currentColor' : 'none'}
                      size={20}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className=" text-slate-800 truncate">{r.name}</div>
                    <div className="text-xs text-slate-500 ">
                      {r.students.length} Students
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => {
                      setEditingId(r.id);
                      setView('edit');
                    }}
                    variant="ghost"
                    size="icon"
                    title="Edit Class"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    onClick={() => setConfirmDeleteId(r.id)}
                    variant="ghost-danger"
                    size="icon"
                    title="Delete Class"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
        <div className="flex flex-col h-full p-2">
          <div className="flex justify-between items-center mb-3">
            <Button variant="ghost" size="sm" onClick={() => setView('list')}>
              &larr; Cancel
            </Button>
            <h3 className=" text-slate-800 text-sm">ClassLink Rosters</h3>
            <div className="w-10"></div>
          </div>

          {classLinkLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-sm ">Connecting to ClassLink...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {classLinkClasses.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm italic">
                  No classes found in ClassLink.
                </div>
              ) : (
                classLinkClasses.map((cls) => (
                  <div
                    key={cls.sourcedId}
                    className="p-3 border border-slate-200 rounded-lg bg-white/40 flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className=" text-slate-800">{cls.title}</div>
                      <div className="text-xs text-slate-500 ">
                        {classLinkStudents[cls.sourcedId]?.length || 0} Students
                      </div>
                    </div>
                    <Button
                      onClick={() => importClassLinkClass(cls)}
                      variant="ghost"
                      size="sm"
                      className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                      icon={<ExternalLink size={14} />}
                    >
                      Import
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ClassesWidget;
