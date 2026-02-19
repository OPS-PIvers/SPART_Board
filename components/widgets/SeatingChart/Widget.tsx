import React from 'react';
import { WidgetData } from '../../../types';
import { Dice5, LayoutGrid, LayoutTemplate } from 'lucide-react';
import { Button } from '../../common/Button';
import { useSeatingChart } from './useSeatingChart';
import { Sidebar } from './Sidebar';
import { FurnitureItem } from './FurnitureItem';

export const SeatingChartWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const {
    mode,
    setMode,
    selectedId,
    setSelectedId,
    selectedStudent,
    bulkCount,
    setBulkCount,
    dragState,
    resizeState,
    randomHighlight,
    localTemplateColumns,
    setLocalTemplateColumns,
    config,
    studentCount,
    unassignedStudents,
    canvasRef,
    isRandomizing,

    // Actions
    addFurniture,
    clearAllFurniture,
    duplicateFurniture,
    removeFurniture,
    handleRotate,
    applyTemplate,
    handleStudentClick,
    handleFurnitureClick,
    handlePointerDown,
    handleResizeStart,
    handleStudentDrop,
    handleRemoveAssignment,
    addAllRandomly,
    pickRandom,
    updateTemplateColumns,
    setTemplate,
    getAssignedStudents,
  } = useSeatingChart(widget);

  const { furniture = [], gridSize = 20, template = 'freeform' } = config;

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
            disabled={isRandomizing}
          >
            Pick Random
          </Button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {(mode === 'setup' || mode === 'assign') && (
          <Sidebar
            mode={mode}
            template={template}
            setTemplate={setTemplate}
            localTemplateColumns={localTemplateColumns}
            setLocalTemplateColumns={setLocalTemplateColumns}
            updateTemplateColumns={updateTemplateColumns}
            studentCount={studentCount}
            applyTemplate={applyTemplate}
            bulkCount={bulkCount}
            setBulkCount={setBulkCount}
            addFurniture={addFurniture}
            clearAllFurniture={clearAllFurniture}
            unassignedStudents={unassignedStudents}
            addAllRandomly={addAllRandomly}
            selectedStudent={selectedStudent}
            handleStudentClick={handleStudentClick}
          />
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
            return (
              <FurnitureItem
                key={item.id}
                item={item}
                mode={mode}
                selectedId={selectedId}
                dragState={dragState}
                resizeState={resizeState}
                randomHighlight={randomHighlight}
                assignedStudents={assigned}
                onPointerDown={handlePointerDown}
                onClick={handleFurnitureClick}
                onDrop={handleStudentDrop}
                onResizeStart={handleResizeStart}
                onRotate={handleRotate}
                onDuplicate={duplicateFurniture}
                onRemove={removeFurniture}
                onRemoveAssignment={handleRemoveAssignment}
              />
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
