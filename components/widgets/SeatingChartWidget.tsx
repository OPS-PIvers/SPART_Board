import React from 'react';
import { WidgetData } from '../../types';
import {
  Armchair,
  LayoutGrid,
  RotateCw,
  RotateCcw,
  Trash2,
  Monitor,
  Maximize2,
  Dice5,
  User,
  Copy,
  UserPlus,
  RefreshCw,
  LayoutTemplate,
} from 'lucide-react';
import { Button } from '../common/Button';
import { FloatingPanel } from '../common/FloatingPanel';
import {
  FURNITURE_TYPES,
  TEMPLATES,
} from './seatingChartConstants';
import { useSeatingChartLogic } from './useSeatingChartLogic';

export const SeatingChartWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const {
    // State
    config,
    mode,
    selectedId,
    selectedStudent,
    bulkCount,
    dragState,
    resizeState,
    localTemplateColumns,
    unassignedStudents,
    students,
    furniture,
    assignments,
    canvasRef,
    isRandomPicking,

    // Actions
    setMode,
    setBulkCount,
    setLocalTemplateColumns,
    setSelectedId,
    updateWidget,

    // Handlers
    addFurniture,
    clearAllFurniture,
    updateFurniture,
    duplicateFurniture,
    removeFurniture,
    applyTemplate,
    handleStudentClick,
    handleFurnitureClick,
    handlePointerDown,
    handleResizeStart,
    handleStudentDrop,
    handleRemoveAssignment,
    addAllRandomly,
    pickRandom,

    // Helpers
    getFurnitureStyle,
    getAssignedStudents,
  } = useSeatingChartLogic(widget);

  const {
    gridSize = 20,
    template = 'freeform',
    templateColumns = 6,
  } = config;

  const studentCount = students.length;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-2 justify-between shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('interact')}
            className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'interact' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Interact
          </button>
          <button
            onClick={() => setMode('assign')}
            className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'assign' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Assign
          </button>
          <button
            onClick={() => setMode('setup')}
            className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'setup' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Setup
          </button>
        </div>

        {mode === 'interact' && (
          <Button
            onClick={pickRandom}
            variant="primary"
            size="sm"
            icon={<Dice5 className="w-4 h-4" />}
            className="ml-auto"
            disabled={isRandomPicking}
          >
            Pick Random
          </Button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {(mode === 'setup' || mode === 'assign') && (
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
                        onClick={() =>
                          updateWidget(widget.id, {
                            config: { ...config, template: t.id },
                          })
                        }
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
                            updateWidget(widget.id, {
                              config: {
                                ...config,
                                templateColumns: Math.min(
                                  20,
                                  Math.max(1, parsed)
                                ),
                              },
                            });
                          }
                        }}
                        onBlur={() => {
                          const parsed = Number.parseInt(
                            localTemplateColumns,
                            10
                          );
                          if (Number.isNaN(parsed)) {
                            setLocalTemplateColumns(String(templateColumns));
                          }
                        }}
                        className="w-full p-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black"
                      />
                    </div>
                  )}

                  {/* Student count hint */}
                  <p className="text-xxs text-slate-400 mt-2 text-center">
                    {studentCount > 0
                      ? `${studentCount} students`
                      : 'No roster set'}
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
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative bg-white overflow-hidden"
          onClick={() => setSelectedId(null)}
          style={{
            backgroundImage:
              mode === 'setup'
                ? 'radial-gradient(rgba(203, 213, 225, 0.4) 1px, transparent 1px)'
                : 'none',
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        >
          {furniture.map((item) => {
            const assigned = getAssignedStudents(item.id);
            const displayX = dragState?.id === item.id ? dragState.x : item.x;
            const displayY = dragState?.id === item.id ? dragState.y : item.y;
            const displayW =
              resizeState?.id === item.id ? resizeState.width : item.width;
            const displayH =
              resizeState?.id === item.id ? resizeState.height : item.height;

            return (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFurnitureClick(item.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => handleStudentDrop(e, item.id)}
                style={{
                  left: displayX,
                  top: displayY,
                  width: displayW,
                  height: displayH,
                  transform: `rotate(${item.rotation}deg)`,
                }}
                className={`${getFurnitureStyle(item)} ${mode === 'setup' ? 'cursor-move' : ''}`}
              >
                {/* Resize Handle */}
                {mode === 'setup' && selectedId === item.id && (
                  <div
                    onPointerDown={(e) => handleResizeStart(e, item.id)}
                    className="absolute -bottom-2 -right-2 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-50 bg-white shadow rounded-full border border-slate-200 hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Maximize2 className="w-3 h-3 rotate-90" />
                  </div>
                )}

                {/* Floating Menu */}
                {mode === 'setup' &&
                  selectedId === item.id &&
                  !dragState &&
                  !resizeState && (
                    <FloatingPanel
                      onPointerDown={(e) => e.stopPropagation()}
                      shape="pill"
                      padding="sm"
                      className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFurniture(item.id, {
                            rotation: (item.rotation - 45 + 360) % 360,
                          });
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                        title="Rotate Left"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFurniture(item.id, {
                            rotation: (item.rotation + 45) % 360,
                          });
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                        title="Rotate Right"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-200 mx-0.5" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateFurniture(item.id);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFurniture(item.id);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </FloatingPanel>
                  )}

                {/* Content */}
                <div className="flex flex-col items-center justify-center p-1 w-full h-full overflow-hidden pointer-events-none">
                  {assigned.length === 0 && (
                    <div className="opacity-20">
                      {item.type === 'desk' && <Monitor className="w-5 h-5" />}
                      {item.type === 'teacher-desk' && (
                        <User className="w-5 h-5" />
                      )}
                      {item.type.includes('table') && (
                        <LayoutGrid className="w-6 h-6" />
                      )}
                      {item.type === 'rug' && <Armchair className="w-6 h-6" />}
                    </div>
                  )}
                  {assigned.length > 0 && (
                    <div className="flex flex-col items-center justify-center gap-1 w-full h-full overflow-hidden">
                      {assigned.map((name) => (
                        <div
                          key={name}
                          className={`bg-white px-1.5 rounded font-bold shadow-sm border border-slate-100 truncate w-full text-center pointer-events-auto flex items-center justify-center ${assigned.length === 1 ? 'h-full text-xs' : 'py-1 text-xxs'}`}
                        >
                          <span className="truncate">{name}</span>
                          {mode === 'assign' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAssignment(name);
                              }}
                              className="ml-1 text-red-400 hover:text-red-600"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {furniture.length === 0 && mode !== 'setup' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
              <LayoutGrid className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm font-bold uppercase tracking-widest">
                Empty Classroom
              </p>
              <p className="text-xs">
                Switch to &quot;Setup&quot; to arrange furniture.
              </p>
            </div>
          )}

          {furniture.length === 0 && mode === 'setup' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
              <LayoutTemplate className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm font-bold uppercase tracking-widest">
                No Furniture
              </p>
              <p className="text-xs">
                {template === 'freeform'
                  ? 'Add furniture from the sidebar.'
                  : 'Pick a template and click Apply Layout.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
