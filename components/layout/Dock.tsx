import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, ChevronDown, RefreshCcw, Plus } from 'lucide-react';
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
import { TOOLS, ToolMetadata, WidgetType, WidgetData } from '../../types';
import { getTitle } from '../../utils/widgetHelpers';

// Dock Item with Popover Logic
const DockItem = ({
  tool,
  minimizedWidgets,
  onAdd,
  onRestore,
}: {
  tool: ToolMetadata;
  minimizedWidgets: WidgetData[];
  onAdd: () => void;
  onRestore: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.type });

  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popoverPos, setPopoverPos] = useState<{
    left: number;
    bottom: number;
  } | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = () => {
    if (minimizedWidgets.length > 0) {
      if (showPopover) {
        setShowPopover(false);
      } else {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setPopoverPos({
            left: rect.left + rect.width / 2,
            bottom: window.innerHeight - rect.top + 10, // 10px spacing
          });
        }
        setShowPopover(true);
      }
    } else {
      onAdd();
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Popover Menu - Rendered in Portal to avoid clipping */}
      {showPopover &&
        minimizedWidgets.length > 0 &&
        popoverPos &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              left: popoverPos.left,
              bottom: popoverPos.bottom,
              transform: 'translateX(-50%)',
              zIndex: 10000,
            }}
            className="w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
          >
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Restorable
              </span>
              <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {minimizedWidgets.length}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
              {minimizedWidgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => {
                    onRestore(widget.id);
                    // Close if this was the last widget
                    if (minimizedWidgets.length <= 1) setShowPopover(false);
                  }}
                  className="w-full text-left px-2 py-2 hover:bg-indigo-50 rounded-lg text-xs text-slate-700 font-medium flex items-center justify-between group transition-colors"
                >
                  <span className="truncate flex-1">{getTitle(widget)}</span>
                  <RefreshCcw className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
            <div className="p-1 border-t border-slate-100">
              <button
                onClick={() => {
                  onAdd();
                  setShowPopover(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Create New</span>
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Dock Icon */}
      <button
        ref={(node) => {
          setNodeRef(node);
          if (node) {
            buttonRef.current = node;
          }
        }}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="group flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90 touch-none relative"
      >
        <div
          className={`${tool.color} p-2 md:p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-all duration-200 relative`}
        >
          <tool.icon className="w-5 h-5 md:w-6 md:h-6" />
          {minimizedWidgets.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {minimizedWidgets.length}
            </div>
          )}
        </div>
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter opacity-0 group-hover/dock:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          {tool.label}
        </span>
      </button>
    </div>
  );
};

export const Dock: React.FC = () => {
  const {
    addWidget,
    visibleTools,
    reorderTools,
    activeDashboard,
    updateWidget,
  } = useDashboard();
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

  // Memoize minimized widgets by type to avoid O(N*M) filtering in render loop
  const minimizedWidgetsByType = useMemo(() => {
    if (!activeDashboard) return {} as Record<WidgetType, WidgetData[]>;
    return activeDashboard.widgets.reduce<Record<WidgetType, WidgetData[]>>(
      (acc, widget) => {
        if (widget.minimized) {
          const existing = acc[widget.type] ?? [];
          existing.push(widget);
          acc[widget.type] = existing;
        }
        return acc;
      },
      {} as Record<WidgetType, WidgetData[]>
    );
  }, [activeDashboard]);

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
                    {filteredTools.map((tool) => {
                      const minimizedWidgets =
                        minimizedWidgetsByType[tool.type] ?? [];
                      return (
                        <DockItem
                          key={tool.type}
                          tool={tool}
                          minimizedWidgets={minimizedWidgets}
                          onAdd={() => addWidget(tool.type)}
                          onRestore={(id) =>
                            updateWidget(id, { minimized: false })
                          }
                        />
                      );
                    })}
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
