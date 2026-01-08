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
  handleSmartPaste: (
    e: React.ClipboardEvent,
    firsts: string,
    lasts: string,
    setFirsts: (val: string) => void,
    setLasts: (val: string) => void
  ) => void;
}

const RosterEditor: React.FC<EditorProps> = ({
  roster,
  onSave,
  onBack,
  handleSmartPaste,
}) => {
  const [name, setName] = useState(roster?.name ?? '');
  const [firsts, setFirsts] = useState(
    roster?.students.map((s) => s.firstName).join('\n') ?? ''
  );
  const [lasts, setLasts] = useState(
    roster?.students.map((s) => s.lastName).join('\n') ?? ''
  );

  const handleSave = () => {
    if (!name.trim()) return;

    const fList = firsts.split('\n');
    const lList = lasts.split('\n');
    const students: Student[] = fList
      .map((f, i) => {
        const first = f.trim();
        const last = lList[i] ? lList[i].trim() : '';
        if (!first && !last) return null;
        return { id: uuidv4(), firstName: first, lastName: last };
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
            onPaste={(e) =>
              handleSmartPaste(e, firsts, lasts, setFirsts, setLasts)
            }
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

  const handleSmartPaste = (
    e: React.ClipboardEvent,
    firsts: string,
    lasts: string,
    setFirsts: (val: string) => void,
    setLasts: (val: string) => void
  ) => {
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

  const onSave = async (name: string, students: Student[]) => {
    if (!editingId) {
      await addRoster(name);
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
                    onClick={() => deleteRoster(r.id)}
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
          handleSmartPaste={handleSmartPaste}
        />
      )}
    </div>
  );
};
export default ClassesWidget;
