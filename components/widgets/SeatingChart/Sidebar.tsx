import React from 'react';
import { FurnitureItem } from '../../../types';
import { Trash2, UserPlus } from 'lucide-react';
import { FURNITURE_TYPES } from './constants';

interface Props {
  mode: 'setup' | 'assign';
  bulkCount: number;
  setBulkCount: (count: number) => void;
  unassignedStudents: string[];
  selectedStudent: string | null;
  onAddFurniture: (type: FurnitureItem['type']) => void;
  onClearAll: () => void;
  onAddAllRandom: () => void;
  onSelectStudent: (studentName: string) => void;
}

export const Sidebar: React.FC<Props> = ({
  mode,
  bulkCount,
  setBulkCount,
  unassignedStudents,
  selectedStudent,
  onAddFurniture,
  onClearAll,
  onAddAllRandom,
  onSelectStudent,
}) => {
  if (mode === 'setup') {
    return (
      <div className="w-48 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-left-4 duration-200">
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-slate-200">
            <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-2">
              Bulk Add Quantity
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={bulkCount}
              onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
              className="w-full p-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black"
            />
          </div>

          <div className="p-3 grid grid-cols-2 gap-2">
            {FURNITURE_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => onAddFurniture(t.type)}
                className="flex flex-col items-center justify-center gap-1 p-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors aspect-square shadow-sm"
              >
                <t.icon className="w-6 h-6 text-slate-600" />
                <span className="text-xxs font-black uppercase text-slate-500">
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-auto p-3 border-t border-slate-200">
            <button
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'assign') {
    return (
      <div className="w-48 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-left-4 duration-200">
        <div className="flex flex-col h-full">
          <div className="p-2 border-b border-slate-200 bg-slate-100 text-xxs font-black uppercase text-slate-600 tracking-widest text-center">
            Unassigned Students
          </div>

          <div className="p-2 border-b border-slate-200">
            <button
              onClick={onAddAllRandom}
              className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add All Random
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {unassignedStudents.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-4 italic font-bold">
                All assigned!
              </div>
            ) : (
              unassignedStudents.map((student) => (
                <div
                  key={student}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData('studentName', student)
                  }
                  onClick={() => onSelectStudent(student)}
                  className={`p-2 bg-white border ${selectedStudent === student ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'} rounded-lg shadow-sm text-xs font-black text-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all`}
                  title="Drag or Click to assign"
                >
                  {student}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
