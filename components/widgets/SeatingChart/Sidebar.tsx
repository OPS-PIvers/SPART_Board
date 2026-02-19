import React from 'react';
import { RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { FurnitureItem, SeatingChartTemplate } from '../../../types';
import { FURNITURE_TYPES, TEMPLATES } from './constants';

interface SidebarProps {
  mode: 'setup' | 'assign' | 'interact';
  template: SeatingChartTemplate;
  setTemplate: (t: SeatingChartTemplate) => void;
  localTemplateColumns: string;
  setLocalTemplateColumns: (val: string) => void;
  updateTemplateColumns: (val: number) => void;
  studentCount: number;
  applyTemplate: () => void;
  bulkCount: number;
  setBulkCount: (val: number) => void;
  addFurniture: (type: FurnitureItem['type']) => void;
  clearAllFurniture: () => void;
  unassignedStudents: string[];
  addAllRandomly: () => void;
  selectedStudent: string | null;
  handleStudentClick: (studentName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mode,
  template,
  setTemplate,
  localTemplateColumns,
  setLocalTemplateColumns,
  updateTemplateColumns,
  studentCount,
  applyTemplate,
  bulkCount,
  setBulkCount,
  addFurniture,
  clearAllFurniture,
  unassignedStudents,
  addAllRandomly,
  selectedStudent,
  handleStudentClick,
}) => {
  return (
    <div className="w-48 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-left-4 duration-200">
      {mode === 'setup' && (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Template Picker */}
          <div className="p-3 border-b border-slate-200">
            <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-2">
              Template
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  title={t.description}
                  className={`flex flex-col items-center justify-center gap-1 p-2 border rounded-lg transition-all text-xxs font-black uppercase leading-none ${
                    template === t.id
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-300'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Columns count input (teachers call this "rows") */}
            {template === 'rows' && (
              <div className="mt-2">
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-1">
                  # of Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={localTemplateColumns}
                  onChange={(e) => {
                    setLocalTemplateColumns(e.target.value);
                    const parsed = Number.parseInt(e.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      updateTemplateColumns(Math.min(20, Math.max(1, parsed)));
                    }
                  }}
                  onBlur={() => {
                    const parsed = Number.parseInt(localTemplateColumns, 10);
                    if (Number.isNaN(parsed)) {
                      // We can't revert here easily without passing the original value,
                      // but the parent handles sync so this might be fine or we need another prop.
                      // For now, let's assume the parent syncs it back via useEffect if needed.
                    }
                  }}
                  className="w-full p-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black"
                />
              </div>
            )}

            {/* Student count hint */}
            <p className="text-xxs text-slate-400 mt-2 text-center">
              {studentCount > 0 ? `${studentCount} students` : 'No roster set'}
            </p>

            {/* Apply button */}
            <button
              onClick={applyTemplate}
              disabled={
                template === 'freeform' ||
                (studentCount === 0 && template !== 'horseshoe')
              }
              className="mt-2 w-full flex items-center justify-center gap-1.5 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" />
              Apply Layout
            </button>
          </div>

          {/* Manual Add */}
          <div className="p-3 border-b border-slate-200">
            <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-2">
              Add Manually
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={bulkCount}
              onChange={(e) =>
                setBulkCount(Number.parseInt(e.target.value, 10) || 1)
              }
              placeholder="Qty"
              className="w-full p-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black mb-2"
            />
            <div className="grid grid-cols-2 gap-2">
              {FURNITURE_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addFurniture(t.type)}
                  className="flex flex-col items-center justify-center gap-1 p-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors aspect-square shadow-sm"
                >
                  <t.icon className="w-6 h-6 text-slate-600" />
                  <span className="text-xxs font-black uppercase text-slate-500">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="mt-auto p-3">
            <button
              onClick={clearAllFurniture}
              className="w-full flex items-center justify-center gap-2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded-lg transition-colors text-xxs font-black uppercase tracking-wider"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Canvas
            </button>
          </div>
        </div>
      )}

      {mode === 'assign' && (
        <div className="flex flex-col h-full">
          <div className="p-2 border-b border-slate-200 bg-slate-100 text-xxs font-black uppercase text-slate-600 tracking-widest text-center">
            Unassigned Students
          </div>
          <div className="p-2 border-b border-slate-200">
            <button
              onClick={addAllRandomly}
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
                  onClick={() => handleStudentClick(student)}
                  className={`p-2 bg-white border ${selectedStudent === student ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'} rounded-lg shadow-sm text-xs font-black text-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all`}
                  title="Drag or Click to assign"
                >
                  {student}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
