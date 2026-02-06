import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { WidgetData, LunchCountConfig } from '../../../types';
import { Button } from '../../common/Button';
import { RefreshCw, Undo2, CheckCircle2, Box } from 'lucide-react';
import { SubmitReportModal } from './SubmitReportModal';
import { useNutrislice } from './useNutrislice';
import { DraggableStudent } from './components/DraggableStudent';
import { DroppableZone } from './components/DroppableZone';

import { WidgetLayout } from '../WidgetLayout';

export const LunchCountWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast, rosters, activeRosterId } = useDashboard();
  const { user } = useAuth();
  const config = widget.config as LunchCountConfig;
  const {
    cachedMenu = null,
    assignments = {},
    roster = [],
    rosterMode = 'class',
  } = config;

  const { isSyncing, fetchNutrislice } = useNutrislice({
    widgetId: widget.id,
    config,
    updateWidget,
    addToast,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activeRoster = useMemo((): string[] => {
    if (rosterMode === 'custom') return roster;
    const currentRoster =
      rosters.find((r) => r.id === activeRosterId) ?? rosters[0];
    return (
      currentRoster?.students.map((s) =>
        `${s.firstName} ${s.lastName}`.trim()
      ) ?? []
    );
  }, [rosterMode, roster, rosters, activeRosterId]);

  const stats = useMemo(() => {
    const total = activeRoster.length;
    const hotLunch = Object.values(assignments).filter(
      (a) => a === 'hot'
    ).length;
    const bentoBox = Object.values(assignments).filter(
      (a) => a === 'bento'
    ).length;
    const homeLunch = Object.values(assignments).filter(
      (a) => a === 'home'
    ).length;
    const remaining = total - (hotLunch + bentoBox + homeLunch);

    return { total, hotLunch, bentoBox, homeLunch, remaining };
  }, [activeRoster, assignments]);

  const updateAssignment = useCallback(
    (student: string, type: 'hot' | 'bento' | 'home' | null) => {
      const newAssignments = { ...assignments };
      if (type === null) {
        delete newAssignments[student];
      } else {
        newAssignments[student] = type;
      }
      updateWidget(widget.id, {
        config: { ...config, assignments: newAssignments },
      });
    },
    [widget.id, config, assignments, updateWidget]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      const student = active.id as string;
      const zone = over.id as string;

      if (zone === 'hot' || zone === 'bento' || zone === 'home') {
        updateAssignment(student, zone);
      } else if (zone === 'unassigned') {
        updateAssignment(student, null);
      }
    }
  };

  const handleSubmitReport = async (notes: string, extraPizza?: number) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.warn('Lunch Report Submitted:', {
        date: new Date().toLocaleDateString(),
        staff: user?.displayName ?? 'Unknown',
        hotLunch: stats.hotLunch,
        bentoBox: stats.bentoBox,
        homeLunch: stats.homeLunch,
        notes,
        extraPizza,
      });

      addToast('Lunch report submitted successfully!', 'success');
      setIsModalOpen(false);
    } catch (_err) {
      addToast('Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unassignedStudents = activeRoster.filter((s) => !assignments[s]);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <WidgetLayout
        padding="p-0"
        header={
          <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col">
              <h3 className="text-[min(10px,3cqmin)] font-black text-slate-700 uppercase tracking-widest">
                Daily Lunch Count
              </h3>
              <p className="text-[min(10px,3cqmin)] font-bold text-slate-500 uppercase tracking-tighter">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => void fetchNutrislice()}
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8 rounded-xl bg-white border border-slate-200"
                disabled={isSyncing}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
              </Button>
              <Button
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, assignments: {} },
                  })
                }
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8 rounded-xl text-slate-400 hover:text-red-500 bg-white border border-slate-200"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        }
        content={
          <div className="flex flex-col h-full w-full p-3 gap-3 overflow-hidden animate-in fade-in duration-300">
            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {/* Hot Lunch Drop Zone */}
              <DroppableZone
                id="hot"
                className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl p-3 flex flex-col min-h-[140px] transition-all hover:scale-[1.01] group"
                activeClassName="border-solid border-orange-500 bg-orange-100/50 scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[min(9px,2.5cqmin)] font-black uppercase text-orange-600 tracking-tighter">
                      Hot Lunch
                    </span>
                    <span className="bg-orange-500 text-white text-[min(10px,3cqmin)] px-2 py-0.5 rounded-full font-black w-max">
                      {stats.hotLunch}
                    </span>
                  </div>
                  <Box className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[min(9px,2.5cqmin)] font-bold text-orange-800 leading-tight mb-3 line-clamp-2 italic">
                  {cachedMenu?.hotLunch ?? 'Loading menu...'}
                </div>
                <div className="flex-1 flex flex-wrap gap-1.5 content-start overflow-y-auto custom-scrollbar pr-1">
                  {activeRoster
                    .filter((s) => assignments[s] === 'hot')
                    .map((student) => (
                      <DraggableStudent
                        key={student}
                        id={student}
                        name={student}
                        onClick={() => updateAssignment(student, null)}
                        className="px-2 py-1 bg-white border border-orange-200 rounded-lg text-[min(9px,2.5cqmin)] font-bold text-orange-900 shadow-sm"
                      />
                    ))}
                </div>
              </DroppableZone>

              {/* Bento Box Drop Zone */}
              <DroppableZone
                id="bento"
                className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-3 flex flex-col min-h-[140px] transition-all hover:scale-[1.01] group"
                activeClassName="border-solid border-emerald-500 bg-emerald-100/50 scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[min(9px,2.5cqmin)] font-black uppercase text-emerald-600 tracking-tighter">
                      Bento Box
                    </span>
                    <span className="bg-emerald-500 text-white text-[min(10px,3cqmin)] px-2 py-0.5 rounded-full font-black w-max">
                      {stats.bentoBox}
                    </span>
                  </div>
                  <Box className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[min(9px,2.5cqmin)] font-bold text-emerald-800 leading-tight mb-3 line-clamp-2 italic">
                  {cachedMenu?.bentoBox ?? 'Loading menu...'}
                </div>
                <div className="flex-1 flex flex-wrap gap-1.5 content-start overflow-y-auto custom-scrollbar pr-1">
                  {activeRoster
                    .filter((s) => assignments[s] === 'bento')
                    .map((student) => (
                      <DraggableStudent
                        key={student}
                        id={student}
                        name={student}
                        onClick={() => updateAssignment(student, null)}
                        className="px-2 py-1 bg-white border border-emerald-200 rounded-lg text-[min(9px,2.5cqmin)] font-bold text-emerald-900 shadow-sm"
                      />
                    ))}
                </div>
              </DroppableZone>

              {/* Home Lunch Drop Zone */}
              <DroppableZone
                id="home"
                className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-3 flex flex-col min-h-[140px] transition-all hover:scale-[1.01] group"
                activeClassName="border-solid border-blue-500 bg-blue-100/50 scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[min(9px,2.5cqmin)] font-black uppercase text-blue-600 tracking-tighter">
                      Home / Other
                    </span>
                    <span className="bg-blue-500 text-white text-[min(10px,3cqmin)] px-2 py-0.5 rounded-full font-black w-max">
                      {stats.homeLunch}
                    </span>
                  </div>
                  <Box className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[min(9px,2.5cqmin)] font-bold text-blue-800 leading-tight mb-3 italic">
                  Field Trips or Absent students.
                </div>
                <div className="flex-1 flex flex-wrap gap-1.5 content-start overflow-y-auto custom-scrollbar pr-1">
                  {activeRoster
                    .filter((s) => assignments[s] === 'home')
                    .map((student) => (
                      <DraggableStudent
                        key={student}
                        id={student}
                        name={student}
                        onClick={() => updateAssignment(student, null)}
                        className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-[min(9px,2.5cqmin)] font-bold text-blue-900 shadow-sm"
                      />
                    ))}
                </div>
              </DroppableZone>
            </div>

            {/* Roster Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <DroppableZone
                id="unassigned"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-y-auto custom-scrollbar shadow-inner"
                activeClassName="bg-slate-100 border-indigo-300 ring-2 ring-indigo-100"
              >
                <div className="text-[min(10px,3cqmin)] font-black uppercase text-slate-400 mb-4 tracking-widest text-center">
                  Unassigned ({unassignedStudents.length})
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {unassignedStudents.map((student) => (
                    <DraggableStudent
                      key={student}
                      id={student}
                      name={student}
                      className="px-3 py-1.5 bg-white border-b-2 border-slate-200 rounded-xl text-[min(11px,3.5cqmin)] font-black text-slate-700 shadow-sm hover:border-indigo-400 hover:-translate-y-0.5 transition-all active:scale-90"
                    />
                  ))}
                  {unassignedStudents.length === 0 && (
                    <div className="text-xs text-slate-400 italic py-4 font-bold uppercase tracking-widest opacity-60">
                      All set!
                    </div>
                  )}
                </div>
              </DroppableZone>
            </div>
          </div>
        }
        footer={
          <div className="px-3 pb-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={stats.remaining > 0 || stats.total === 0}
              variant={
                stats.remaining === 0 && stats.total > 0
                  ? 'primary'
                  : 'secondary'
              }
              className="w-full py-3 rounded-2xl font-black uppercase tracking-widest text-[min(11px,3.5cqmin)] shadow-lg transition-all"
            >
              {stats.remaining === 0 && stats.total > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Report
                </div>
              ) : (
                `Assign ${stats.remaining} More`
              )}
            </Button>

            {/* Modal */}
            <SubmitReportModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handleSubmitReport}
              data={{
                date: new Date().toLocaleDateString(),
                staffName: user?.displayName ?? 'Unknown Staff',
                hotLunch: stats.hotLunch,
                bentoBox: stats.bentoBox,
                hotLunchName: cachedMenu?.hotLunch ?? 'Hot Lunch',
                bentoBoxName: cachedMenu?.bentoBox ?? 'Bento Box',
                schoolSite: config.schoolSite ?? 'schumann-elementary',
              }}
              isSubmitting={isSubmitting}
            />
          </div>
        }
      />
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? (
          <div className="px-3 py-1.5 bg-brand-blue-primary border-b-2 border-brand-blue-dark rounded-xl text-[min(11px,3.5cqmin)] font-black text-white shadow-xl scale-110 opacity-90 cursor-grabbing">
            {activeId}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
