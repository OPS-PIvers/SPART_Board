import React, { useState, useMemo } from 'react';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { TOOLS, ToolMetadata, WidgetType } from '../../types';

// Sortable item component
const SortableTool = ({
  tool,
  onClick,
}: {
  tool: ToolMetadata;
  onClick: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.type });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90 touch-none"
    >
      <div
        className={`${tool.color} p-2 md:p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-all duration-200`}
      >
        <tool.icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter opacity-0 group-hover/dock:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        {tool.label}
      </span>
    </button>
  );
};

export const Dock: React.FC = () => {
  const { addWidget, visibleTools, reorderTools } = useDashboard();
  const { canAccessWidget } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredTools = useMemo(() => {
    // Map visibleTools to actual tool objects to preserve order
    const ordered = visibleTools
      .map((type) => TOOLS.find((t) => t.type === type))
      .filter((t): t is ToolMetadata => t !== undefined);

    // Filter by access
    return ordered.filter((tool) => canAccessWidget(tool.type));
  }, [visibleTools, canAccessWidget]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const filteredToolTypes = filteredTools.map((tool) => tool.type);
      const oldIndex = filteredToolTypes.indexOf(active.id as WidgetType);
      const newIndex = filteredToolTypes.indexOf(over.id as WidgetType);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFilteredTypes = arrayMove(
          filteredToolTypes,
          oldIndex,
          newIndex
        );

        // Reconstruct the full list, preserving the position of inaccessible items
        // This is tricky: we want to replace the accessible items in visibleTools
        // with the new order, while skipping over items we can't see/move.
        const newVisibleTools: WidgetType[] = [];
        let filteredIndex = 0;

        for (const tool of visibleTools) {
          if (canAccessWidget(tool)) {
            if (filteredIndex < reorderedFilteredTypes.length) {
              newVisibleTools.push(reorderedFilteredTypes[filteredIndex]);
              filteredIndex++;
            }
          } else {
            newVisibleTools.push(tool);
          }
        }

        reorderTools(newVisibleTools);
      }
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center">
      <div className="relative group/dock">
        {isExpanded ? (
          <>
            {/* The "little arrow" to minimize the toolbar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 p-2 bg-white/80 backdrop-blur shadow-xl rounded-full text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover/dock:opacity-100 hover:scale-110 active:scale-90"
              title="Minimize Toolbar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Expanded Toolbar with hover-to-reveal titles */}
            <div className="bg-white/80 backdrop-blur-2xl px-4 py-3 rounded-[2rem] shadow-2xl border border-white/50 flex items-center gap-1.5 md:gap-3 max-w-[95vw] overflow-x-auto no-scrollbar animate-in zoom-in-95 fade-in duration-300">
              {filteredTools.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredTools.map((t) => t.type)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {filteredTools.map((tool) => (
                      <SortableTool
                        key={tool.type}
                        tool={tool}
                        onClick={() => addWidget(tool.type)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="px-6 py-2 text-[10px] font-black uppercase text-slate-400 italic">
                  No apps selected in settings
                </div>
              )}
            </div>
          </>
        ) : (
          /* Compressed down to a single icon */
          <button
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:scale-110 active:scale-90 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] animate-in fade-in zoom-in duration-300"
            title="Open Tools"
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
