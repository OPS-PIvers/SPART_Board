import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutGrid,
  ChevronDown,
  RefreshCcw,
  Plus,
  Trash2,
  Users,
  Cast,
  FolderPlus,
  X,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
import { useLiveSession } from '../../hooks/useLiveSession';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ToolMetadata, WidgetType, WidgetData } from '../../types';
import { TOOLS } from '../../config/tools';
import { getTitle } from '../../utils/widgetHelpers';
import { getJoinUrl } from '../../utils/urlHelpers';
import ClassRosterMenu from './ClassRosterMenu';
import { GlassCard } from '../common/GlassCard';

// Dock Item with Popover Logic

const DockItem = ({
  tool,

  minimizedWidgets,

  onAdd,

  onRestore,

  onDelete,

  onDeleteAll,

  onFolder,

  onRemoveFromDock,

  isEditMode,

  onLongPress,
}: {
  tool: ToolMetadata;

  minimizedWidgets: WidgetData[];

  onAdd: () => void;

  onRestore: (id: string) => void;

  onDelete: (id: string) => void;

  onDeleteAll: () => void;

  onFolder: () => void;

  onRemoveFromDock: () => void;

  isEditMode: boolean;

  onLongPress: () => void;
}) => {
  const {
    attributes,

    listeners,

    setNodeRef,

    transform,

    transition,

    isDragging,
  } = useSortable({
    id: tool.type,

    disabled: !isEditMode, // Only allow dragging in Edit Mode
  });

  const [showPopover, setShowPopover] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const [popoverPos, setPopoverPos] = useState<{
    left: number;

    bottom: number;
  } | null>(null);

  // Close popover when clicking outside

  useClickOutside(popoverRef, () => setShowPopover(false), [buttonRef]);

  const handlePointerDown = () => {
    if (isEditMode) return;

    longPressTimer.current = setTimeout(() => {
      onLongPress();
    }, 600); // 600ms long press threshold
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);

      longPressTimer.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if in edit mode

    if (isEditMode) {
      e.preventDefault();

      e.stopPropagation();

      return;
    }

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
    transform: CSS.Translate.toString(transform),

    transition,

    opacity: isDragging ? 0.3 : 1,

    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex flex-col items-center"
    >
      {/* Popover Menu - Rendered in Portal to avoid clipping */}

      {showPopover &&
        !isEditMode && // Hide popovers in edit mode
        minimizedWidgets.length > 0 &&
        popoverPos &&
        createPortal(
          <GlassCard
            ref={popoverRef}
            style={{
              position: 'fixed',

              left: popoverPos.left,

              bottom: popoverPos.bottom,

              transform: 'translateX(-50%)',

              zIndex: 10000,
            }}
            className="w-56 overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
          >
            <div className="bg-white/50 px-3 py-2 border-b border-white/30 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                Restorable
              </span>

              <span className="bg-white/60 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {minimizedWidgets.length}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
              {minimizedWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className="w-full flex items-center justify-between px-2 py-2 hover:bg-white/50 rounded-lg group transition-colors"
                >
                  <button
                    onClick={() => {
                      onRestore(widget.id);

                      if (minimizedWidgets.length <= 1) setShowPopover(false);
                    }}
                    className="flex-1 text-left flex items-center gap-2 min-w-0"
                  >
                    <span className="truncate text-xs text-slate-800 font-medium">
                      {getTitle(widget)}
                    </span>

                    <RefreshCcw className="w-3 h-3 text-brand-blue-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      onDelete(widget.id);

                      if (minimizedWidgets.length <= 1) setShowPopover(false);
                    }}
                    className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    title="Close Widget"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-1 border-t border-white/30 grid grid-cols-3 gap-1">
              <button
                onClick={() => {
                  onAdd();

                  setShowPopover(false);
                }}
                className="flex items-center justify-center gap-0.5 px-1 py-1.5 bg-brand-blue-primary hover:bg-brand-blue-dark text-white text-[10px] font-bold rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />

                <span>Create</span>
              </button>

              <button
                onClick={() => {
                  onFolder();

                  setShowPopover(false);
                }}
                className="flex items-center justify-center gap-0.5 px-1 py-1.5 bg-white/50 hover:bg-white/80 text-slate-700 text-[10px] font-bold rounded-lg transition-colors"
              >
                <FolderPlus className="w-3 h-3" />

                <span>Folder</span>
              </button>

              <button
                onClick={() => {
                  onDeleteAll();

                  setShowPopover(false);
                }}
                className="flex items-center justify-center gap-0.5 px-1 py-1.5 bg-white/50 hover:bg-red-50/80 text-slate-700 hover:text-red-700 text-[10px] font-bold rounded-lg transition-colors"
              >
                <Trash2 className="w-3 h-3" />

                <span>Clear</span>
              </button>
            </div>
          </GlassCard>,

          document.body
        )}

      {/* Dock Icon */}

      <div
        className={`relative group/icon ${isEditMode ? 'animate-jiggle' : ''}`}
      >
        {/* Remove Button (Visible in Edit Mode) */}

        {isEditMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();

              onRemoveFromDock();
            }}
            className="absolute -top-2 -right-2 z-50 bg-slate-400 text-white rounded-full p-1 shadow-md hover:bg-red-500 hover:scale-110 transition-all animate-in zoom-in duration-200"
            title="Remove from Dock"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}

        <button
          ref={buttonRef}
          {...attributes}
          {...listeners}
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onClick={handleClick}
          className={`group flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90 touch-none relative ${
            isEditMode ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          <div
            className={`${tool.color} p-2 md:p-3 rounded-2xl text-white shadow-lg ${
              isEditMode ? '' : 'group-hover:scale-110'
            } transition-all duration-200 relative`}
          >
            <tool.icon className="w-5 h-5 md:w-6 md:h-6" />

            {minimizedWidgets.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-brand-red-primary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {minimizedWidgets.length}
              </div>
            )}
          </div>

          <span className="text-[9px] font-black uppercase tracking-tighter opacity-100 transition-opacity duration-300 whitespace-nowrap smart-text">
            {tool.label}
          </span>
        </button>
      </div>
    </div>
  );
};

// Widget Library Component for Edit Mode
const WidgetLibrary = ({
  onToggle,
  visibleTools,
  canAccess,
  onClose,
}: {
  onToggle: (type: WidgetType) => void;
  visibleTools: WidgetType[];
  canAccess: (type: WidgetType) => boolean;
  onClose: () => void;
}) => {
  return (
    <GlassCard className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl max-h-[60vh] overflow-hidden flex flex-col p-0 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 z-[10002]">
      <div className="bg-white/50 px-6 py-4 border-b border-white/30 flex justify-between items-center shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-brand-blue-primary" />
          <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
            Widget Library
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {TOOLS.map((tool) => {
            if (!canAccess(tool.type)) return null;
            const isActive = visibleTools.includes(tool.type);
            return (
              <button
                key={tool.type}
                onClick={() => onToggle(tool.type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all group active:scale-95 border-2 ${
                  isActive
                    ? 'bg-white/80 border-brand-blue-primary shadow-md'
                    : 'bg-white/20 border-transparent opacity-40 grayscale hover:opacity-60 hover:grayscale-0'
                }`}
              >
                <div
                  className={`${tool.color} p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform relative`}
                >
                  <tool.icon className="w-6 h-6" />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                      <Plus className="w-2.5 h-2.5 rotate-45" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight text-center leading-tight">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-slate-50/50 px-6 py-3 border-t border-white/30 text-center backdrop-blur-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Tap a widget to add or remove it from your dock
        </p>
      </div>
    </GlassCard>
  );
};

export const Dock: React.FC = () => {
  const {
    addWidget,
    removeWidget,
    removeWidgets,
    visibleTools,
    reorderTools,
    activeDashboard,
    updateWidget,
    toggleToolVisibility,
    addToast,
  } = useDashboard();
  const { canAccessWidget, featurePermissions, user } = useAuth();
  const { session } = useLiveSession(user?.uid, 'teacher');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRosterMenu, setShowRosterMenu] = useState(false);
  const [showLiveInfo, setShowLiveInfo] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Global Edit Mode State
  const [showLibrary, setShowLibrary] = useState(false); // Widget Library Visibility

  const classesButtonRef = useRef<HTMLButtonElement>(null);
  const liveButtonRef = useRef<HTMLButtonElement>(null);
  const [classesAnchorRect, setClassesAnchorRect] = useState<DOMRect | null>(
    null
  );
  const [livePopoverPos, setLivePopoverPos] = useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const livePopoverRef = useRef<HTMLDivElement>(null);
  const dockContainerRef = useRef<HTMLDivElement>(null); // Ref for click-outside detection

  // Close live popover when clicking outside
  useClickOutside(livePopoverRef, () => {
    if (showLiveInfo) setShowLiveInfo(false);
  }, [liveButtonRef]);

  // Handle exiting edit mode when clicking outside the dock area
  useClickOutside(dockContainerRef, () => {
    if (isEditMode && !showLibrary) {
      setIsEditMode(false);
    }
  });

  const exitEditMode = () => {
    setIsEditMode(false);
    setShowLibrary(false);
  };

  const openClassEditor = () => {
    addWidget('classes');
    setShowRosterMenu(false);
  };

  const handleToggleRosterMenu = () => {
    if (!showRosterMenu && classesButtonRef.current) {
      setClassesAnchorRect(classesButtonRef.current.getBoundingClientRect());
    }
    setShowRosterMenu(!showRosterMenu);
  };

  // Add long press handler for global edit mode
  const handleLongPress = () => {
    setIsEditMode(true);
  };

  const classToolMetadata = useMemo(() => {
    const tool = TOOLS.find((t) => t.type === 'classes');
    if (!tool) return { label: 'Class', color: 'bg-brand-blue-primary' };

    const permission = featurePermissions.find(
      (p) => p.widgetType === 'classes'
    );
    const displayName = permission?.displayName?.trim();
    return {
      ...tool,
      label: displayName ?? tool.label,
    };
  }, [featurePermissions]);

  const [activeToolId, setActiveToolId] = useState<WidgetType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement to start drag
      },
    })
  );

  const filteredTools = useMemo(() => {
    // Map visibleTools to actual tool objects to preserve order
    const ordered = visibleTools
      .map((type) => {
        const tool = TOOLS.find((t) => t.type === type);
        if (!tool) return undefined;

        // Apply permission overrides (e.g., custom display name)
        const permission = featurePermissions.find(
          (p) => p.widgetType === tool.type
        );
        const displayName = permission?.displayName?.trim();
        if (displayName) {
          return { ...tool, label: displayName };
        }
        return tool;
      })
      .filter((t): t is ToolMetadata => t !== undefined);

    // Filter by access
    return ordered.filter(
      (tool) => canAccessWidget(tool.type) && tool.type !== 'classes'
    );
  }, [visibleTools, canAccessWidget, featurePermissions]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveToolId(event.active.id as WidgetType);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveToolId(null);

    if (over && active.id !== over.id) {
      const filteredToolTypes: WidgetType[] = filteredTools.map(
        (tool) => tool.type
      );
      const oldIndex = filteredToolTypes.indexOf(active.id as WidgetType);
      const newIndex = filteredToolTypes.indexOf(over.id as WidgetType);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFilteredTypes = arrayMove<WidgetType>(
          filteredToolTypes,
          oldIndex,
          newIndex
        );

        // Reconstruct the full list, preserving the position of inaccessible items
        const newVisibleTools: WidgetType[] = [];
        let filteredIndex = 0;

        for (const tool of visibleTools) {
          if (canAccessWidget(tool)) {
            if (filteredIndex < reorderedFilteredTypes.length) {
              const nextType = reorderedFilteredTypes[filteredIndex];
              if (nextType) {
                newVisibleTools.push(nextType);
                filteredIndex++;
              }
            }
          } else {
            newVisibleTools.push(tool);
          }
        }

        reorderTools(newVisibleTools);
      }
    }
  };

  // Memoize minimized widgets by type to avoid O(N*M) filtering in render loop
  const minimizedWidgetsByType = useMemo(() => {
    const acc = {} as Record<WidgetType, WidgetData[]>;
    if (!activeDashboard) return acc;

    return activeDashboard.widgets.reduce<Record<WidgetType, WidgetData[]>>(
      (prev, widget) => {
        if (widget.minimized) {
          const existing = prev[widget.type] ?? [];
          existing.push(widget);
          prev[widget.type] = existing;
        }
        return prev;
      },
      acc
    );
  }, [activeDashboard]);

  return (
    <div
      ref={dockContainerRef}
      data-screenshot="exclude"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] flex flex-col items-center gap-4"
    >
      {showRosterMenu && classesAnchorRect && (
        <ClassRosterMenu
          onClose={() => setShowRosterMenu(false)}
          onOpenFullEditor={openClassEditor}
          anchorRect={classesAnchorRect}
        />
      )}

      {/* Edit Mode Controls (Above the main dock) */}
      {isEditMode && (
        <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
          {!showLibrary && (
            <button
              onClick={() => setShowLibrary(true)}
              className="px-4 py-2 bg-white/95 backdrop-blur-2xl border border-brand-blue-light text-brand-blue-primary rounded-full shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all group"
            >
              <div className="p-1 bg-brand-blue-primary text-white rounded-full group-hover:rotate-90 transition-transform duration-300">
                <Plus className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                Add Widgets
              </span>
            </button>
          )}
          <button
            onClick={exitEditMode}
            className="px-5 py-2 bg-brand-blue-primary text-white text-xs font-black uppercase tracking-wider rounded-full shadow-2xl hover:bg-brand-blue-dark transition-all hover:scale-105 active:scale-95 ring-4 ring-white/20"
          >
            Done
          </button>
        </div>
      )}

      <div className="relative group/dock">
        {isExpanded ? (
          <>
            {/* Widget Library Modal (Triggered by button) */}
            {isEditMode && showLibrary && (
              <WidgetLibrary
                visibleTools={visibleTools}
                onToggle={(type) => {
                  toggleToolVisibility(type);
                }}
                canAccess={canAccessWidget}
                onClose={() => setShowLibrary(false)}
              />
            )}

            {/* Expanded Toolbar with integrated minimize button */}
            <GlassCard className="relative z-10 px-4 py-3 rounded-[2rem] flex items-center gap-1.5 md:gap-3 max-w-[95vw] overflow-x-auto no-scrollbar animate-in zoom-in-95 fade-in duration-300">
              {filteredTools.length > 0 ? (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
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
                            onDelete={(id) => removeWidget(id)}
                            onDeleteAll={() => {
                              removeWidgets(minimizedWidgets.map((w) => w.id));
                            }}
                            onFolder={() => {
                              addToast('Folder creation coming soon', 'info');
                            }}
                            onRemoveFromDock={() => {
                              toggleToolVisibility(tool.type);
                            }}
                            isEditMode={isEditMode}
                            onLongPress={handleLongPress}
                          />
                        );
                      })}
                    </SortableContext>

                    {/* Drag Preview Overlay */}
                    <DragOverlay zIndex={10005} dropAnimation={null}>
                      {activeToolId ? (
                        <div className="flex flex-col items-center gap-1 scale-110 rotate-3 opacity-90 pointer-events-none">
                          <div
                            className={`${
                              TOOLS.find((t) => t.type === activeToolId)
                                ?.color ?? 'bg-slate-500'
                            } p-3 rounded-2xl text-white shadow-2xl ring-2 ring-white/50`}
                          >
                            {React.createElement(
                              TOOLS.find((t) => t.type === activeToolId)
                                ?.icon ?? Users,
                              { className: 'w-6 h-6' }
                            )}
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>

                  {/* Separator and Roster/Classes Button */}
                  <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2 flex-shrink-0" />

                  {/* LIVE INFO BUTTON (Visible when active) */}
                  {session?.isActive && (
                    <>
                      <button
                        ref={liveButtonRef}
                        onClick={() => {
                          if (showLiveInfo) {
                            setShowLiveInfo(false);
                          } else if (liveButtonRef.current) {
                            const rect =
                              liveButtonRef.current.getBoundingClientRect();
                            setLivePopoverPos({
                              left: rect.left + rect.width / 2,
                              bottom: window.innerHeight - rect.top + 10,
                            });
                            setShowLiveInfo(true);
                          }
                        }}
                        aria-label="View live session information"
                        className="group flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90 touch-none relative focus-visible:outline-none"
                      >
                        <div className="bg-red-500 p-2 md:p-3 rounded-2xl text-white shadow-lg shadow-red-500/30 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-red-400 group-focus-visible:ring-offset-2 transition-all duration-200 relative animate-pulse">
                          <Cast className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter opacity-100 transition-opacity duration-300 whitespace-nowrap smart-text">
                          Live
                        </span>
                      </button>

                      {/* LIVE POPOVER */}
                      {showLiveInfo &&
                        livePopoverPos &&
                        createPortal(
                          <GlassCard
                            ref={livePopoverRef}
                            style={{
                              position: 'fixed',
                              left: livePopoverPos.left,
                              bottom: livePopoverPos.bottom,
                              transform: 'translateX(-50%)',
                              zIndex: 10000,
                            }}
                            className="w-64 overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
                          >
                            <div className="p-4 flex flex-col items-center gap-2 text-center">
                              <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                                Live Session
                              </h3>
                              <div className="text-3xl font-black text-indigo-700 font-mono tracking-widest my-1 drop-shadow-sm">
                                {session.code}
                              </div>
                              <div className="text-[10px] text-slate-600 bg-white/50 px-2 py-1 rounded border border-white/30">
                                {getJoinUrl()}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-2">
                                Provide this code to your students.
                              </div>
                            </div>
                            <div className="p-2 border-t border-white/30">
                              <button
                                onClick={() => setShowLiveInfo(false)}
                                className="w-full py-2 bg-white/50 hover:bg-white/60 text-slate-700 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 focus-visible:ring-offset-white"
                              >
                                Close
                              </button>
                            </div>
                          </GlassCard>,
                          document.body
                        )}

                      <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2 flex-shrink-0" />
                    </>
                  )}

                  <button
                    ref={classesButtonRef}
                    onClick={handleToggleRosterMenu}
                    aria-label="Toggle class roster menu"
                    className={`group flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90 touch-none relative`}
                  >
                    <div
                      className={`${classToolMetadata.color} p-2 md:p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-all duration-200 relative`}
                    >
                      <Users className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter opacity-100 transition-opacity duration-300 whitespace-nowrap smart-text">
                      {classToolMetadata.label}
                    </span>
                  </button>

                  {/* Separator and Minimize Button */}
                  <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2 flex-shrink-0" />

                  <button
                    onClick={() => setIsExpanded(false)}
                    className="group flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90 touch-none flex-shrink-0"
                    title="Minimize Toolbar"
                  >
                    <div className="bg-slate-100 p-2 md:p-3 rounded-2xl text-slate-400 shadow-sm group-hover:scale-110 group-hover:bg-slate-200 group-hover:text-slate-600 transition-all duration-200">
                      <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter opacity-100 transition-opacity duration-300 whitespace-nowrap smart-text">
                      Hide
                    </span>
                  </button>
                </>
              ) : (
                <div className="px-6 py-2 text-[10px] font-black uppercase text-slate-400 italic">
                  No apps selected in settings
                </div>
              )}
            </GlassCard>
          </>
        ) : (
          /* Compressed down to a single icon */
          <button
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 flex items-center justify-center bg-brand-blue-primary text-white rounded-full active:scale-90 transition-all shadow-xl shadow-brand-blue-primary/40 animate-in fade-in zoom-in duration-300"
            title="Open Tools"
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
