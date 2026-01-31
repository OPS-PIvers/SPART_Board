import React, { useState, useMemo, useCallback } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import {
  WidgetData,
  LunchCountConfig,
  LunchCountGlobalConfig,
} from '../../../types';
import { Button } from '../../common/Button';
import {
  RefreshCw,
  Loader2,
  Undo2,
  CheckCircle2,
  Box,
} from 'lucide-react';
import { SubmitReportModal } from './SubmitReportModal';
import { useNutrislice } from './useNutrislice';

type LunchType = 'hot' | 'bento' | 'home';
const DEFAULT_RECIPIENT_EMAIL = 'paul.ivers@orono.k12.mn.us';

export const LunchCountWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast, rosters, activeRosterId } = useDashboard();
  const { user, featurePermissions } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const config = widget.config as LunchCountConfig;
  const {
    cachedMenu,
    isManualMode = false,
    manualHotLunch = '',
    manualBentoBox = '',
    roster = [],
    assignments = {},
    recipient = DEFAULT_RECIPIENT_EMAIL,
    syncError,
    rosterMode = 'class',
  } = config;

  const { isSyncing, fetchNutrislice } = useNutrislice({
      widgetId: widget.id,
      config,
      updateWidget,
      addToast,
  });

  const activeRoster = useMemo(
    () => rosters.find((r) => r.id === activeRosterId),
    [rosters, activeRosterId]
  );

  const currentRoster = useMemo(() => {
    if (rosterMode === 'class' && activeRoster) {
      return activeRoster.students.map((s) =>
        `${s.firstName} ${s.lastName}`.trim()
      );
    }
    return roster;
  }, [activeRoster, roster, rosterMode]);

  const handleDrop = (e: React.DragEvent, type: LunchType | null) => {
    const name = e.dataTransfer.getData('studentName');
    if (name) {
      updateWidget(widget.id, {
        config: {
          ...config,
          assignments: {
            ...assignments,
            [name]: type as LunchCountConfig['assignments'][string],
          },
        },
      });
    }
  };

  const resetBoard = () => {
    updateWidget(widget.id, {
      config: { ...config, assignments: {} },
    });
    addToast('Board reset', 'info');
  };

  const menuDisplay = useMemo(
    () => ({
      hot: isManualMode
        ? manualHotLunch
        : (cachedMenu?.hotLunch ?? 'Loading...'),
      bento: isManualMode
        ? manualBentoBox
        : (cachedMenu?.bentoBox ?? 'Loading...'),
    }),
    [cachedMenu, isManualMode, manualBentoBox, manualHotLunch]
  );

  const getReportData = useCallback(() => {
    const counts = { hot: 0, bento: 0, home: 0 };
    Object.values(assignments).forEach((type) => {
      if (type && counts[type as LunchType] !== undefined) {
        counts[type as LunchType]++;
      }
    });

    const staffName =
      user?.displayName?.trim() ?? user?.email?.trim() ?? 'Unattributed Staff';

    return {
      date: new Date().toLocaleDateString(),
      staffName,
      hotLunch: counts.hot,
      bentoBox: counts.bento,
      hotLunchName: menuDisplay.hot,
      bentoBoxName: menuDisplay.bento,
      schoolSite: config.schoolSite ?? 'schumann-elementary',
    };
  }, [assignments, config.schoolSite, menuDisplay, user]);

  // Capture a snapshot of report data when modal opens
  const reportDataSnapshot = useMemo(() => {
    if (!isReportModalOpen) return null;
    return getReportData();
  }, [isReportModalOpen, getReportData]);

  const submitReport = () => {
    setIsReportModalOpen(true);
  };

  const handleConfirmReport = async (notes: string, extraPizza?: number) => {
    const data = getReportData();
    const permission = featurePermissions.find(
      (p) => p.widgetType === 'lunchCount'
    );
    const gConfig = (permission?.config ?? {}) as LunchCountGlobalConfig;
    const submissionUrl = gConfig.submissionUrl;
    const spreadsheetId = gConfig.googleSheetId;

    const siteCode = data.schoolSite === 'schumann-elementary' ? 'SE' : 'IS';

    if (!submissionUrl) {
      // Fallback to email if no URL configured
      const summary =
        `Lunch Count Report - ${data.date}\n\n` +
        `Site: ${siteCode}\n` +
        `Staff: ${data.staffName}\n` +
        `Hot Lunch (${data.hotLunchName}): ${data.hotLunch}\n` +
        `Bento Box (${data.bentoBoxName}): ${data.bentoBox}\n` +
        (extraPizza ? `Extra Pizza Slices: ${extraPizza}\n` : '') +
        `Notes: ${notes}\n\n` +
        `Sent from Dashboard.`;

      window.open(
        `mailto:${recipient}?subject=Lunch Count Report&body=${encodeURIComponent(
          summary
        )}`
      );

      addToast(
        'Email draft opened. Please review and send it from your email app to complete the report.',
        'info'
      );
      // Keep modal open so user can see it didn't "auto-submit" if they missed the popup
      return;
    }

    setIsSubmittingReport(true);
    try {
      const payload = {
        // Only include spreadsheetId if explicitly configured
        ...(spreadsheetId && { spreadsheetId }),
        date: data.date,
        site: siteCode,
        staffName: data.staffName,
        hotLunch: data.hotLunch,
        bentoBox: data.bentoBox,
        extraPizza: extraPizza ?? 0,
        notes: notes,
      };

      const response = await fetch(submissionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Submission failed with status ${response.status}`);
      }

      addToast('Report submitted to Google Sheet', 'success');
      setIsReportModalOpen(false);
    } catch (error) {
      console.error('Report submission error:', error);
      addToast(
        'Failed to submit report. Please check your connection or use email fallback.',
        'error'
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const cycleAssignment = (name: string) => {
    const current = assignments[name];
    let next: LunchType | null = null;

    if (!current) next = 'hot';
    else if (current === 'hot') next = 'bento';
    else if (current === 'bento') next = 'home';
    else next = null;

    updateWidget(widget.id, {
      config: {
        ...config,
        assignments: {
          ...assignments,
          [name]: next as LunchCountConfig['assignments'][string],
        },
      },
    });
  };

  const unassigned = currentRoster.filter((name) => !assignments[name]);

  return (
    <div className="h-full flex flex-col bg-transparent select-none relative">
      {/* Header Actions */}
      <div className="p-3 bg-white/30 border-b border-white/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={submitReport}
            variant="success"
            className="rounded-xl"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Submit Report
          </Button>
          <Button
            onClick={resetBoard}
            variant="secondary"
            className="rounded-xl"
            icon={<Undo2 className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
        </div>

        {activeRoster && rosterMode === 'class' && (
          <div className="flex items-center gap-1.5 bg-white/50 px-2 py-0.5 rounded-full border border-white/30 animate-in fade-in slide-in-from-top-1 ml-auto">
            <Box className="w-2 h-2 text-orange-500" />
            <span className="text-xxxs  uppercase text-orange-600 tracking-wider">
              {activeRoster.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-3 flex flex-col gap-3 min-h-0">
        {/* Choice Buckets */}
        <div className="grid grid-cols-3 gap-3">
          {/* Hot Lunch */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'hot')}
            className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl p-3 flex flex-col min-h-[160px] transition-all hover:scale-[1.01] hover:border-solid group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xxs  uppercase text-orange-400 tracking-tighter">
                Hot Lunch
              </span>
              <span className="bg-orange-500 text-white text-xxs px-2 py-0.5 rounded-full ">
                {Object.values(assignments).filter((v) => v === 'hot').length}
              </span>
            </div>
            <div className="text-xxs  text-orange-800 leading-tight mb-3 line-clamp-2 italic">
              {menuDisplay.hot}
            </div>
            <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto custom-scrollbar">
              {Object.entries(assignments)
                .filter(([_, type]) => type === 'hot')
                .map(([name]) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('studentName', name);
                    }}
                    onClick={() => cycleAssignment(name)}
                    className="px-2 py-1 bg-white border border-orange-100 rounded-lg text-xxs  shadow-sm cursor-grab active:cursor-grabbing"
                    title="Drag or Click to cycle"
                  >
                    {name}
                  </div>
                ))}
            </div>
          </div>

          {/* Bento Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'bento')}
            className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl p-3 flex flex-col min-h-[160px] transition-all hover:scale-[1.01] hover:border-solid group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xxs  uppercase text-emerald-400 tracking-tighter">
                Bento Box
              </span>
              <span className="bg-emerald-500 text-white text-xxs px-2 py-0.5 rounded-full ">
                {Object.values(assignments).filter((v) => v === 'bento').length}
              </span>
            </div>
            <div className="text-xxs  text-emerald-800 leading-tight mb-3 line-clamp-2 italic">
              {menuDisplay.bento}
            </div>
            <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto custom-scrollbar">
              {Object.entries(assignments)
                .filter(([_, type]) => type === 'bento')
                .map(([name]) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('studentName', name);
                    }}
                    onClick={() => cycleAssignment(name)}
                    className="px-2 py-1 bg-white border border-emerald-100 rounded-lg text-xxs  shadow-sm cursor-grab active:cursor-grabbing"
                    title="Drag or Click to cycle"
                  >
                    {name}
                  </div>
                ))}
            </div>
          </div>

          {/* Home Lunch */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'home')}
            className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-3 flex flex-col min-h-[160px] transition-all hover:scale-[1.01] hover:border-solid group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xxs  uppercase text-blue-400 tracking-tighter">
                Home Lunch
              </span>
              <span className="bg-blue-500 text-white text-xxs px-2 py-0.5 rounded-full ">
                {Object.values(assignments).filter((v) => v === 'home').length}
              </span>
            </div>
            <div className="text-xxs  text-blue-800 leading-tight mb-3 italic">
              Packing from home
            </div>
            <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto custom-scrollbar">
              {Object.entries(assignments)
                .filter(([_, type]) => type === 'home')
                .map(([name]) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('studentName', name);
                    }}
                    onClick={() => cycleAssignment(name)}
                    className="px-2 py-1 bg-white border border-blue-100 rounded-lg text-xxs  shadow-sm cursor-grab active:cursor-grabbing"
                    title="Drag or Click to cycle"
                  >
                    {name}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Waiting Area (Bottom) */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, null)}
          className="flex-1 bg-white/50 border border-white/30 rounded-2xl p-4 overflow-y-auto custom-scrollbar"
        >
          <div className="text-xxs  uppercase text-slate-600 mb-4 tracking-widest text-center">
            Drag Your Name to Your Choice
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {unassigned.length > 0 ? (
              unassigned.map((name) => (
                <div
                  key={name}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('studentName', name);
                  }}
                  onClick={() => cycleAssignment(name)}
                  className="px-4 py-2 bg-white/80 border-b-2 border-slate-200 rounded-xl text-xs  shadow-sm cursor-grab hover:border-indigo-400 hover:-translate-y-0.5 transition-all active:scale-90"
                  title="Drag or Click to cycle"
                >
                  {name}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-4">
                All students checked in!
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 bg-white/30 border-t border-white/20 flex justify-start items-center gap-2 shrink-0">
        <button
          onClick={() => void fetchNutrislice()}
          disabled={isSyncing || isManualMode}
          className="p-2 bg-white hover:bg-white/80 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-400 hover:text-indigo-600 disabled:opacity-50 relative"
          title="Sync from Nutrislice"
        >
          {isSyncing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {syncError && (
            <div
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xxxs  px-1 rounded-full border border-white"
              title={syncError}
            >
              !
            </div>
          )}
        </button>
        <div className="text-xxxs  text-slate-400 uppercase flex items-center gap-1.5">
          <span>Last Sync</span>
          {config.lastSyncDate && (
            <span className="text-slate-500">
              {new Date(config.lastSyncDate).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {isReportModalOpen && (
        <SubmitReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleConfirmReport}
          data={reportDataSnapshot ?? getReportData()}
          isSubmitting={isSubmittingReport}
        />
      )}
    </div>
  );
};
