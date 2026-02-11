import React, { useRef } from 'react';
import { WidgetData } from '../../../types';
import { LayoutGrid } from 'lucide-react';
import { useSeatingChartLogic } from './useSeatingChartLogic';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { FurnitureItem } from './FurnitureItem';

export const SeatingChartWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const {
    furniture,
    gridSize,
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
    unassignedStudents,
    addFurniture,
    clearAllFurniture,
    duplicateFurniture,
    removeFurniture,
    rotateFurniture,
    handleStudentClick,
    handleFurnitureClick,
    handlePointerDown,
    handleResizeStart,
    handleStudentDrop,
    handleRemoveAssignment,
    addAllRandomly,
    pickRandom,
    getAssignedStudents,
    isAnimating,
  } = useSeatingChartLogic(widget);

  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full flex flex-col">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        onPickRandom={pickRandom}
        isAnimating={isAnimating}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          mode={mode as 'setup' | 'assign'}
          bulkCount={bulkCount}
          setBulkCount={setBulkCount}
          unassignedStudents={unassignedStudents}
          selectedStudent={selectedStudent}
          onAddFurniture={addFurniture}
          onClearAll={clearAllFurniture}
          onAddAllRandom={addAllRandomly}
          onSelectStudent={handleStudentClick}
        />

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
              <FurnitureItem
                key={item.id}
                item={item}
                mode={mode}
                isSelected={selectedId === item.id}
                isDragging={dragState?.id === item.id}
                isResizing={resizeState?.id === item.id}
                isHighlighted={randomHighlight === item.id}
                assignedStudents={assigned}
                displayX={displayX}
                displayY={displayY}
                displayW={displayW}
                displayH={displayH}
                onPointerDown={handlePointerDown}
                onClick={handleFurnitureClick}
                onDrop={handleStudentDrop}
                onResizeStart={handleResizeStart}
                onRotate={rotateFurniture}
                onDuplicate={duplicateFurniture}
                onDelete={removeFurniture}
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
        </div>
      </div>
    </div>
  );
};
