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
        <button
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-blue-600  uppercase tracking-wider"
        >
          &larr; Back
        </button>
        <div className="flex gap-2 items-center flex-1 ml-4 justify-end">
          <input
            className=" border-b-2 border-slate-200 focus:border-blue-500 bg-transparent px-1 py-0.5 outline-none text-slate-800 placeholder-slate-400 min-w-0"
            placeholder="Class Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-3 py-1.5 rounded flex gap-1 items-center text-xs  hover:bg-green-700 shadow-sm transition-colors"
          >
            <Save size={14} /> Save
          </button>
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
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white text-xs  hover:bg-slate-600 transition-colors"
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
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs  hover:bg-red-700 transition-colors"
                  title="Confirm deletion"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => {
                setEditingId(null);
                setView('edit');
              }}
              className="flex-1 bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 text-sm  shadow-sm"
            >
              <Plus size={16} /> Create New Class
            </button>
            <button
              onClick={handleFetchClassLink}
              className="bg-white text-slate-700 border border-slate-200 p-2 rounded flex items-center justify-center gap-2 hover:bg-slate-50 text-sm  shadow-sm transition-colors"
              title="Sync from ClassLink"
            >
              <RefreshCw
                size={16}
                className={classLinkLoading ? 'animate-spin' : ''}
              />
              ClassLink
            </button>
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
                className={`p-3 border rounded-lg bg-white flex justify-between items-center transition-all hover:shadow-md ${activeRosterId === r.id ? 'ring-2 ring-blue-400 border-blue-400 shadow-sm' : 'border-slate-200'}`}
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
                  <button
                    onClick={() => {
                      setEditingId(r.id);
                      setView('edit');
                    }}
                    className="p-2 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                    title="Edit Class"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(r.id)}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                    title="Delete Class"
                  >
                    <Trash2 size={16} />
                  </button>
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
            <button
              onClick={() => setView('list')}
              className="text-xs text-slate-500 hover:text-blue-600  uppercase tracking-wider"
            >
              &larr; Cancel
            </button>
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
                    className="p-3 border border-slate-200 rounded-lg bg-white flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className=" text-slate-800">{cls.title}</div>
                      <div className="text-xs text-slate-500 ">
                        {classLinkStudents[cls.sourcedId]?.length || 0} Students
                      </div>
                    </div>
                    <button
                      onClick={() => importClassLinkClass(cls)}
                      className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs  hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <ExternalLink size={14} /> Import
                    </button>
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
