import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WidgetData, Student, ClassRoster } from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { Plus, Trash2, Save, Star, Edit2 } from 'lucide-react';

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

  const handleSmartPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const rows = text.split(/\r\n|\r|\n/);
    const newF: string[] = [];
    const newL: string[] = [];

    rows.forEach((row) => {
      const parts = row.trim().split(' ');
      if (parts.length > 0 && parts[0]) {
        newF.push(parts[0]);
        newL.push(parts.slice(1).join(' '));
      }
    });

    const prefix = firsts ? '\n' : '';
    setFirsts(firsts + prefix + newF.join('\n'));
    setLasts(lasts + (lasts ? '\n' : '') + newL.join('\n'));
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
        const id = existing ? existing.id : uuidv4();

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
          className="text-xs text-slate-500 hover:text-blue-600 font-bold uppercase tracking-wider"
        >
          &larr; Back
        </button>
        <div className="flex gap-2 items-center flex-1 ml-4 justify-end">
          <input
            className="font-bold border-b-2 border-slate-200 focus:border-blue-500 bg-transparent px-1 py-0.5 outline-none text-slate-800 placeholder-slate-400 min-w-0"
            placeholder="Class Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-3 py-1.5 rounded flex gap-1 items-center text-xs font-bold hover:bg-green-700 shadow-sm transition-colors"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="flex flex-col h-full">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            First Name (Smart Paste)
          </label>
          <textarea
            className="flex-1 border border-slate-200 focus:border-blue-400 p-2 rounded-lg resize-none text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={firsts}
            onChange={(e) => setFirsts(e.target.value)}
            onPaste={handleSmartPaste}
            placeholder="Paste names here..."
          />
        </div>
        <div className="flex flex-col h-full">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Last Name
          </label>
          <textarea
            className="flex-1 border border-slate-200 focus:border-blue-400 p-2 rounded-lg resize-none text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={lasts}
            onChange={(e) => setLasts(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-400 text-center italic">
        Tip: Paste a full list of names into &quot;First Name&quot; to
        auto-split them.
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
  } = useDashboard();

  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const onSave = async (name: string, students: Student[]) => {
    if (!editingId) {
      await addRoster(name, students);
    } else {
      await updateRoster(editingId, { name, students });
    }
    setView('list');
    setEditingId(null);
  };

  const editingRoster = rosters.find((r) => r.id === editingId) ?? null;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden rounded-lg">
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
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await deleteRoster(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setEditingId(null);
              setView('edit');
            }}
            className="mb-2 bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 text-sm font-bold shadow-sm"
          >
            <Plus size={16} /> Create New Class
          </button>
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
                    <div className="font-bold text-slate-800 truncate">
                      {r.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
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
    </div>
  );
};
export default ClassesWidget;
