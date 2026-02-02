import React, { useState, useMemo, useCallback } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { WidgetData, LunchCountConfig, DashboardWidget } from '../../../types';
import { Button } from '../../common/Button';
import { RefreshCw, Undo2, CheckCircle2, Box } from 'lucide-react';
import { SubmitReportModal } from './SubmitReportModal';
import { useNutrislice } from './useNutrislice';

export const LunchCountWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast, activeDashboard } = useDashboard();
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

  const activeRoster = useMemo((): string[] => {
    if (rosterMode === 'custom') return roster;
    const dashboardWidget = activeDashboard?.widgets.find(
      (w) => w.id === widget.id
    ) as DashboardWidget | undefined;
    return dashboardWidget?.activeRoster ?? [];
  }, [rosterMode, roster, widget.id, activeDashboard]);

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

  const handleDrop = useCallback(
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

  const handleDragStart = useCallback((e: React.DragEvent, student: string) => {
    e.dataTransfer.setData('student', student);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

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

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <h3 className="text-xxs font-black text-slate-400 uppercase tracking-widest">
            Daily Lunch Count
          </h3>
          <p className="text-xxs font-bold text-slate-500 uppercase tracking-tighter">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => void fetchNutrislice()}
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8 rounded-xl"
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
            className="p-2 h-8 w-8 rounded-xl text-slate-400 hover:text-red-500"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        {/* Hot Lunch Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const student = e.dataTransfer.getData('student');
            if (student) handleDrop(student, 'hot');
          }}
          className="bg-orange-500/10 border-2 border-dashed border-orange-500/20 rounded-2xl p-3 flex flex-col min-h-[160px] transition-all hover:scale-[1.01] hover:border-solid backdrop-blur-sm group"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <span className="text-xxs font-black uppercase text-orange-600 tracking-tighter">
                Hot Lunch
              </span>
              <span className="bg-orange-500 text-white text-xxs px-2 py-0.5 rounded-full font-black">
                {stats.hotLunch}
              </span>
            </div>
            <Box className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xxs font-bold text-orange-800 leading-tight mb-3 line-clamp-2 italic">
            {cachedMenu?.hotLunch ?? 'Loading menu...'}
          </div>
          <div className="flex-1 flex flex-wrap gap-1.5 content-start overflow-y-auto custom-scrollbar pr-1">
            {activeRoster
              .filter((s) => assignments[s] === 'hot')
              .map((student) => (
                <div
                  key={student}
                  draggable
                  onDragStart={(e) => handleDragStart(e, student)}
                  onClick={() => handleDrop(student, null)}
                  className="px-2 py-1 bg-white/60 backdrop-blur-sm border border-orange-200 rounded-lg text-xxs font-bold text-orange-900 shadow-sm cursor-grab active:cursor-grabbing"
                >
                  {student}
                </div>
              ))}
          </div>
        </div>

        {/* Bento Box Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const student = e.dataTransfer.getData('student');
            if (student) handleDrop(student, 'bento');
          }}
          className="bg-emerald-500/10 border-2 border-dashed border-emerald-500/20 rounded-2xl p-3 flex flex-col min-h-[160px] transition-all hover:scale-[1.01] hover:border-solid backdrop-blur-sm group"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <span className="text-xxs font-black uppercase text-emerald-600 tracking-tighter">
                Bento Box
              </span>
              <span className="bg-emerald-500 text-white text-xxs px-2 py-0.5 rounded-full font-black">
                {stats.bentoBox}
              </span>
            </div>
            <Box className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xxs font-bold text-emerald-800 leading-tight mb-3 line-clamp-2 italic">
            {cachedMenu?.bentoBox ?? 'Loading menu...'}
          </div>
          <div className="flex-1 flex flex-wrap gap-1.5 content-start overflow-y-auto custom-scrollbar pr-1">
            {activeRoster
              .filter((s) => assignments[s] === 'bento')
              .map((student) => (
                <div
                  key={student}
                  draggable
                  onDragStart={(e) => handleDragStart(e, student)}
                  onClick={() => handleDrop(student, null)}
                  className="px-2 py-1 bg-white/60 backdrop-blur-sm border border-emerald-200 rounded-lg text-xxs font-bold text-emerald-900 shadow-sm cursor-grab active:cursor-grabbing"
                >
                  {student}
                </div>
              ))}
          </div>
        </div>

        {/* Home Lunch Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const student = e.dataTransfer.getData('student');
            if (student) handleDrop(student, 'home');
          }}
          className="bg-blue-500/10 border-2 border-dashed border-blue-500/20 rounded-2xl p-3 flex flex-col min-h-[160px] transition-all hover:scale-[1.01] hover:border-solid backdrop-blur-sm group"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <span className="text-xxs font-black uppercase text-blue-600 tracking-tighter">
                Home Lunch / Other
              </span>
              <span className="bg-blue-500 text-white text-xxs px-2 py-0.5 rounded-full font-black">
                {stats.homeLunch}
              </span>
            </div>
            <Box className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xxs font-bold text-blue-800 leading-tight mb-3 italic">
            Home Lunch, Field Trips, or Absent students.
          </div>
          <div className="flex-1 flex flex-wrap gap-1.5 content-start overflow-y-auto custom-scrollbar pr-1">
            {activeRoster
              .filter((s) => assignments[s] === 'home')
              .map((student) => (
                <div
                  key={student}
                  draggable
                  onDragStart={(e) => handleDragStart(e, student)}
                  onClick={() => handleDrop(student, null)}
                  className="px-2 py-1 bg-white/60 backdrop-blur-sm border border-blue-200 rounded-lg text-xxs font-bold text-blue-900 shadow-sm cursor-grab active:cursor-grabbing"
                >
                  {student}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Roster Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div
          className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 overflow-y-auto custom-scrollbar shadow-inner"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const student = e.dataTransfer.getData('student');
            if (student) handleDrop(student, null);
          }}
        >
          <div className="text-xxs font-black uppercase text-slate-500 mb-4 tracking-widest text-center">
            Unassigned Students ({unassignedStudents.length})
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {unassignedStudents.map((student) => (
              <div
                key={student}
                draggable
                onDragStart={(e) => handleDragStart(e, student)}
                className="px-4 py-2 bg-white/60 backdrop-blur-sm border-b-2 border-white/40 rounded-xl text-xs font-black text-slate-700 shadow-sm cursor-grab hover:border-indigo-400 hover:-translate-y-0.5 transition-all active:scale-90"
              >
                {student}
              </div>
            ))}
            {unassignedStudents.length === 0 && (
              <div className="text-xs text-slate-400 italic py-4 font-bold">
                All students accounted for!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 flex gap-3 pt-2 border-t border-slate-100">
        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={stats.remaining > 0 || stats.total === 0}
          variant={
            stats.remaining === 0 && stats.total > 0 ? 'primary' : 'secondary'
          }
          className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
        >
          {stats.remaining === 0 && stats.total > 0 ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Submit Daily Report
            </div>
          ) : (
            `Assign ${stats.remaining} More Students`
          )}
        </Button>
      </div>

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
  );
};