import React, { useState } from 'react';
import { Student, ClassRoster } from '@/types';
import { Save } from 'lucide-react';
import { SettingsLabel } from '@/components/common/SettingsLabel';
import { WidgetLayout } from '@/components/widgets/WidgetLayout';
import { splitNames, mergeNames, generateStudentsList } from './rosterUtils';

interface EditorProps {
  roster: ClassRoster | null;
  onSave: (name: string, students: Student[]) => void;
  onBack: () => void;
}

export const RosterEditor: React.FC<EditorProps> = ({
  roster,
  onSave,
  onBack,
}) => {
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
    if (!showLastNames) {
      const { firsts: newFirsts, lasts: newLasts } = splitNames(firsts);
      setFirsts(newFirsts.join('\n'));
      setLasts(newLasts.join('\n'));
      setShowLastNames(true);
    }
  };

  const handleToggleToSingleField = () => {
    if (showLastNames) {
      const merged = mergeNames(firsts, lasts);
      setFirsts(merged.join('\n'));
      setLasts('');
      setShowLastNames(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const students = generateStudentsList(firsts, lasts, roster?.students);
    onSave(name, students);
  };

  return (
    <WidgetLayout
      padding="p-0"
      header={
        <div className="flex justify-between items-center p-3">
          <button
            onClick={onBack}
            className="text-xs text-slate-500 hover:text-blue-600 uppercase tracking-wider font-bold"
          >
            &larr; Back
          </button>
          <div className="flex gap-2 items-center flex-1 ml-4 justify-end">
            <input
              className="border-b-2 border-slate-200 focus:border-blue-500 bg-transparent px-1 py-0.5 outline-none text-slate-800 placeholder-slate-400 min-w-0 text-sm font-bold"
              placeholder="Class Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex gap-1 items-center text-xs font-bold hover:bg-green-700 shadow-sm transition-colors"
            >
              <Save size={14} /> Save
            </button>
          </div>
        </div>
      }
      content={
        <div
          className={`grid ${showLastNames ? 'grid-cols-2' : 'grid-cols-1'} gap-3 w-full h-full p-3`}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-end mb-1">
              <SettingsLabel className="text-slate-500 mb-0">
                {showLastNames ? 'First Names' : 'Names (One per line)'}
              </SettingsLabel>
              {!showLastNames && (
                <button
                  onClick={handleToggleToLastNames}
                  className="text-xxs text-blue-600 hover:text-blue-700 font-black uppercase tracking-wider"
                >
                  + Add Last Name
                </button>
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
                <SettingsLabel className="text-slate-500 mb-0">
                  Last Names
                </SettingsLabel>
                <button
                  onClick={handleToggleToSingleField}
                  className="text-xxs text-slate-400 hover:text-red-500 font-black uppercase tracking-wider transition-colors"
                >
                  Remove
                </button>
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
