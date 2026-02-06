import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import { snapCenterToCursor, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { WidgetData, LunchCountConfig } from '../../../types';
import { Button } from '../../common/Button';
import { RefreshCw, Undo2, CheckCircle2, Box, Users } from 'lucide-react';
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
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
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

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const studentItemClass =
    'px-3 py-1.5 bg-white border-b-2 border-slate-200 rounded-xl text-[min(11px,3.5cqmin)] font-black text-slate-700 shadow-sm hover:border-brand-blue-primary hover:-translate-y-0.5 transition-all active:scale-90';

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
                className="p-2 h-8 w-8 rounded-xl text-slate-400 hover:text-brand-red-primary bg-white border border-slate-200"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        }
        content={
          <div className="flex flex-col h-full w-full p-3 gap-3 overflow-hidden animate-in fade-in duration-300">
            {/* Top Grid: 3 Zones */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {/* Hot Lunch Drop Zone */}
              <DroppableZone
                id="hot"
                data-testid="hot-zone"
                className="bg-brand-red-lighter/10 border-2 border-dashed border-brand-red-lighter rounded-2xl p-3 flex flex-col min-h-[140px] transition-all group"
                activeClassName="border-solid border-brand-red-primary bg-brand-red-lighter/30 scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[min(9px,2.5cqmin)] font-black uppercase text-brand-red-primary tracking-tighter">
                      Hot Lunch
                    </span>
                    <span className="bg-brand-red-primary text-white text-[min(10px,3cqmin)] px-2 py-0.5 rounded-full font-black w-max">
                      {stats.hotLunch}
                    </span>
                  </div>
                  <Box className="w-3.5 h-3.5 text-brand-red-primary opacity-40 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[min(9px,2.5cqmin)] font-bold text-brand-red-dark leading-tight mb-3 line-clamp-2 italic opacity-60">
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
                        className={studentItemClass}
                      />
                    ))}
                </div>
              </DroppableZone>

              {/* Bento Box Drop Zone */}
              <DroppableZone
                id="bento"
                className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-3 flex flex-col min-h-[140px] transition-all group"
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
                <div className="text-[min(9px,2.5cqmin)] font-bold text-emerald-800 leading-tight mb-3 line-clamp-2 italic opacity-60">
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
                        className={studentItemClass}
                      />
                    ))}
                </div>
              </DroppableZone>

              {/* Home Lunch Drop Zone */}
              <DroppableZone
                id="home"
                className="bg-brand-blue-lighter/20 border-2 border-dashed border-brand-blue-lighter rounded-2xl p-3 flex flex-col min-h-[140px] transition-all group"
                activeClassName="border-solid border-brand-blue-primary bg-brand-blue-lighter/40 scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[min(9px,2.5cqmin)] font-black uppercase text-brand-blue-primary tracking-tighter">
                      Home / Other
                    </span>
                    <span className="bg-brand-blue-primary text-white text-[min(10px,3cqmin)] px-2 py-0.5 rounded-full font-black w-max">
                      {stats.homeLunch}
                    </span>
                  </div>
                  <Box className="w-3.5 h-3.5 text-brand-blue-primary opacity-40 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[min(9px,2.5cqmin)] font-bold text-brand-blue-dark leading-tight mb-3 italic opacity-60">
                  Field Trips / Absent
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
                        className={studentItemClass}
                      />
                    ))}
                </div>
              </DroppableZone>
            </div>

            {/* Bottom Area: All Unassigned Students */}
            <div className="flex-1 flex flex-col min-h-0">
              <DroppableZone
                id="unassigned"
                className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-4 overflow-y-auto custom-scrollbar shadow-inner"
                activeClassName="bg-slate-100 border-brand-blue-primary ring-4 ring-brand-blue-lighter/20"
              >
                <div className="flex flex-col items-center h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-slate-300" />
                    <span className="text-[min(10px,3cqmin)] font-black uppercase text-slate-400 tracking-widest">
                      Unassigned ({stats.remaining})
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 w-full">
                    {activeRoster
                      .filter((s) => !assignments[s])
                      .map((student) => (
                        <DraggableStudent
                          key={student}
                          id={student}
                          name={student}
                          className={studentItemClass}
                        />
                      ))}
                    {stats.remaining === 0 && stats.total > 0 && (
                      <div className="flex flex-col items-center justify-center py-12 opacity-30 grayscale animate-in zoom-in-95 duration-500">
                        <CheckCircle2 className="w-12 h-12 text-brand-blue-primary mb-3" />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">
                          Roster Complete
                        </span>
                      </div>
                    )}
                  </div>
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
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Assign {stats.remaining} More Students
                </div>
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
      <DragOverlay
        dropAnimation={dropAnimation}
        modifiers={[snapCenterToCursor, restrictToWindowEdges]}
        className="drag-overlay"
      >
        {activeId ? (
          <div
            data-no-drag="true"
            className="px-4 py-2 bg-brand-blue-primary border-b-4 border-brand-blue-dark rounded-2xl text-[min(12px,4cqmin)] font-black text-white shadow-2xl scale-110 opacity-95 cursor-grabbing pointer-events-none"
          >
            {activeId}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
