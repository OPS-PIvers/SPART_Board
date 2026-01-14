import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { WidgetData, LunchCountConfig, LunchMenuDay } from '../../types';
import { RosterModeControl } from '../common/RosterModeControl';
import { Button } from '../common/Button';
import {
  Users,
  RefreshCw,
  School,
  Loader2,
  Undo2,
  CheckCircle2,
  Box,
  X,
  FileSpreadsheet,
  Send,
} from 'lucide-react';

type LunchType = 'hot' | 'bento' | 'home';

interface NutrisliceFood {
  name?: string;
}

interface NutrisliceMenuItem {
  is_section_title?: boolean;
  section_name?: string;
  food?: NutrisliceFood;
  text?: string;
}

interface NutrisliceDay {
  date: string;
  menu_items?: NutrisliceMenuItem[];
}

interface NutrisliceWeek {
  days?: NutrisliceDay[];
}

const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate-school', label: 'Orono Intermediate' },
];

const DEFAULT_RECIPIENT_EMAIL = 'paul.ivers@orono.k12.mn.us';

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string, extraPizza?: number) => Promise<void>;
  data: {
    date: string;
    staffName: string;
    hotLunch: number;
    bentoBox: number;
    hotLunchName: string;
    bentoBoxName: string;
    schoolSite: 'schumann-elementary' | 'orono-intermediate-school';
  };
  isSubmitting: boolean;
}

const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  data,
  isSubmitting,
}) => {
  const [notes, setNotes] = useState('');
  const [extraPizza, setExtraPizza] = useState<number | ''>('');

  if (!isOpen) return null;

  const isIntermediate = data.schoolSite === 'orono-intermediate-school';

  return (
    <div className="absolute inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 rounded-3xl overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[90%] max-h-[90%] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-200 custom-scrollbar">
        <div className="p-6 bg-brand-blue-primary text-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight">
                Submit Lunch Report
              </h3>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                Review and add notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Date
              </span>
              <p className="text-sm font-bold text-slate-700">{data.date}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Staff Name
              </span>
              <p className="text-sm font-bold text-slate-700">
                {data.staffName}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-orange-600 uppercase">
                  Hot Lunch
                </span>
                <span className="text-[11px] font-bold text-orange-800 line-clamp-1">
                  {data.hotLunchName}
                </span>
              </div>
              <span className="text-2xl font-black text-orange-600">
                {data.hotLunch}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-600 uppercase">
                  Bento Box
                </span>
                <span className="text-[11px] font-bold text-emerald-800 line-clamp-1">
                  {data.bentoBoxName}
                </span>
              </div>
              <span className="text-2xl font-black text-emerald-600">
                {data.bentoBox}
              </span>
            </div>

            {isIntermediate && (
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-purple-600 uppercase block mb-1">
                    Extra Pizza Slices
                  </span>
                  <p className="text-[9px] text-purple-400 font-bold uppercase">
                    Optional
                  </p>
                </div>
                <input
                  type="number"
                  min="0"
                  value={extraPizza}
                  onChange={(e) =>
                    setExtraPizza(
                      e.target.value === '' ? '' : parseInt(e.target.value)
                    )
                  }
                  placeholder="0"
                  className="w-20 p-2 text-center text-lg font-black bg-white border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400/20"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gluten Free, Field Trips, etc..."
              className="w-full h-24 p-4 text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-blue-primary/20 focus:border-brand-blue-primary transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 sticky bottom-0 bg-white pt-2">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                void onSubmit(notes, extraPizza === '' ? 0 : extraPizza)
              }
              variant="success"
              className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest"
              isLoading={isSubmitting}
              icon={<Send className="w-4 h-4" />}
            >
              {isSubmitting ? 'Sending...' : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LunchCountWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast, rosters, activeRosterId } = useDashboard();
  const { user, featurePermissions } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

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

  const [isSyncing, setIsSyncing] = useState(false);
  const configRef = React.useRef(config);

  // Keep ref in sync
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // NOTE: Using third-party CORS proxy services introduces security and reliability concerns.
  // These proxies can inspect all data passing through them, and their availability is not guaranteed.
  // TODO: Implement a backend proxy endpoint under our control or work with Nutrislice API
  // to get proper CORS headers configured for a production-ready solution.
  const fetchWithFallback = async (url: string) => {
    const proxies = [
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
    ];

    let lastError: Error | null = null;

    for (const getProxyUrl of proxies) {
      try {
        const response = await fetch(getProxyUrl(url));
        if (!response.ok) throw new Error(`Proxy status: ${response.status}`);

        const text = await response.text();
        if (!text || text.trim().startsWith('<!doctype')) {
          throw new Error(
            'Proxy returned HTML or empty response instead of JSON'
          );
        }

        const jsonContent = JSON.parse(text) as NutrisliceWeek;
        console.warn(
          '[LunchCountWidget] Fetched Nutrislice Data:',
          jsonContent
        );

        if (jsonContent && jsonContent.days) return jsonContent;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        console.warn('Proxy attempt failed, trying next...', e);
      }
    }
    throw lastError ?? new Error('All proxies failed');
  };

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

  const fetchNutrislice = useCallback(async () => {
    if (configRef.current.isManualMode) return;
    setIsSyncing(true);
    updateWidget(widget.id, {
      config: { ...configRef.current, syncError: null },
    });

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const schoolSite = configRef.current.schoolSite || 'schumann-elementary';

      const apiUrl = `https://orono.api.nutrislice.com/menu/api/weeks/school/${schoolSite}/menu-type/lunch/${year}/${month}/${day}/`;
      const data = await fetchWithFallback(apiUrl);

      let hotLunch = 'No Hot Lunch Listed';
      let bentoBox = 'No Bento Box Listed';

      if (data && data.days) {
        const todayStr = now.toISOString().split('T')[0];
        const dayData = data.days.find((d) => d.date === todayStr);

        if (dayData && dayData.menu_items) {
          const items = dayData.menu_items;

          // Hot Lunch: Map to the first item in the "Entrees" section
          const entree = items.find(
            (i) =>
              !i.is_section_title &&
              (i.section_name?.toLowerCase().includes('entree') ??
                i.section_name?.toLowerCase().includes('main'))
          );
          if (entree) hotLunch = entree.food?.name ?? entree.text ?? hotLunch;

          // Bento Box: Map to any item in Entrees or Sides that contains "Bento"
          const bento = items.find(
            (i) =>
              (i.food?.name?.toLowerCase().includes('bento') ??
                i.text?.toLowerCase().includes('bento')) &&
              !i.is_section_title
          );
          if (bento) bentoBox = bento.food?.name ?? bento.text ?? bentoBox;

          // Fallback for Hot Lunch if no section matched
          if (hotLunch === 'No Hot Lunch Listed' && items.length > 0) {
            const firstFood = items.find(
              (i) => !i.is_section_title && (i.food?.name ?? i.text)
            );
            if (firstFood)
              hotLunch = firstFood.food?.name ?? firstFood.text ?? hotLunch;
          }
        }
      }

      const newMenu: LunchMenuDay = {
        hotLunch,
        bentoBox,
        date: now.toISOString(),
      };

      updateWidget(widget.id, {
        config: {
          ...configRef.current,
          cachedMenu: newMenu,
          lastSyncDate: now.toISOString(),
          syncError: null,
        },
      });
      addToast('Menu synced from Nutrislice', 'success');
    } catch (err) {
      console.error('Nutrislice Sync Error:', err);
      updateWidget(widget.id, {
        config: { ...configRef.current, syncError: 'E-SYNC-404' },
      });
      addToast('Failed to sync menu', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [widget.id, updateWidget, addToast]);

  useEffect(() => {
    if (
      !cachedMenu ||
      (config.lastSyncDate &&
        new Date(config.lastSyncDate).toDateString() !==
          new Date().toDateString())
    ) {
      void fetchNutrislice();
    }
  }, [fetchNutrislice, cachedMenu, config.lastSyncDate]);

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

  const menuDisplay = {
    hot: isManualMode ? manualHotLunch : (cachedMenu?.hotLunch ?? 'Loading...'),
    bento: isManualMode
      ? manualBentoBox
      : (cachedMenu?.bentoBox ?? 'Loading...'),
  };

  const getReportData = () => {
    const counts = { hot: 0, bento: 0, home: 0 };
    Object.values(assignments).forEach((type) => {
      if (type && counts[type as LunchType] !== undefined) {
        counts[type as LunchType]++;
      }
    });

    return {
      date: new Date().toLocaleDateString(),
      staffName: user?.displayName ?? 'Unknown Staff',
      hotLunch: counts.hot,
      bentoBox: counts.bento,
      hotLunchName: menuDisplay.hot,
      bentoBoxName: menuDisplay.bento,
      schoolSite: config.schoolSite || 'schumann-elementary',
    };
  };

  const submitReport = () => {
    setIsReportModalOpen(true);
  };

  const handleConfirmReport = async (notes: string, extraPizza?: number) => {
    const reportData = getReportData();
    const permission = featurePermissions.find(
      (p) => p.widgetType === 'lunchCount'
    );
    const submissionUrl = permission?.config?.submissionUrl as
      | string
      | undefined;
    const spreadsheetId = permission?.config?.googleSheetId as
      | string
      | undefined;

    const siteCode =
      reportData.schoolSite === 'schumann-elementary' ? 'SE' : 'IS';

    if (!submissionUrl) {
      // Fallback to email if no URL configured
      const summary =
        `Lunch Count Report - ${reportData.date}\n\n` +
        `Site: ${siteCode}\n` +
        `Staff: ${reportData.staffName}\n` +
        `Hot Lunch (${reportData.hotLunchName}): ${reportData.hotLunch}\n` +
        `Bento Box (${reportData.bentoBoxName}): ${reportData.bentoBox}\n` +
        (extraPizza ? `Extra Pizza Slices: ${extraPizza}\n` : '') +
        `Notes: ${notes}\n\n` +
        `Sent from Dashboard.`;

      window.open(
        `mailto:${recipient}?subject=Lunch Count Report&body=${encodeURIComponent(
          summary
        )}`
      );
      addToast('Report generated (Email Fallback)', 'info');
      setIsReportModalOpen(false);
      return;
    }

    setIsReporting(true);
    try {
      const payload = {
        spreadsheetId,
        date: reportData.date,
        site: siteCode,
        staffName: reportData.staffName,
        hotLunch: reportData.hotLunch,
        bentoBox: reportData.bentoBox,
        extraPizza: extraPizza || 0,
        notes: notes,
      };

      await fetch(submissionUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script often requires no-cors for simple POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Since we use no-cors, we can't actually read the response status
      // but if it doesn't throw, it likely succeeded.
      addToast('Report submitted to Google Sheet', 'success');
      setIsReportModalOpen(false);
    } catch (error) {
      console.error('Report submission error:', error);
      addToast('Failed to submit report', 'error');
    } finally {
      setIsReporting(false);
    }
  };

  const unassigned = currentRoster.filter((name) => !assignments[name]);

  return (
    <div className="h-full flex flex-col bg-white select-none relative">
      {activeRoster && rosterMode === 'class' && (
        <div className="absolute top-1 right-2 flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 z-10 animate-in fade-in slide-in-from-top-1">
          <Box className="w-2 h-2 text-orange-500" />
          <span className="text-[8px] font-black uppercase text-orange-600 tracking-wider">
            {activeRoster.name}
          </span>
        </div>
      )}

      {/* Header Actions */}
      <div className="p-3 bg-slate-50 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={submitReport}
            variant="success"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Submit Report
          </Button>
          <Button
            onClick={resetBoard}
            variant="secondary"
            icon={<Undo2 className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
        </div>
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
              <span className="text-[9px] font-black uppercase text-orange-400 tracking-tighter">
                Hot Lunch
              </span>
              <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {Object.values(assignments).filter((v) => v === 'hot').length}
              </span>
            </div>
            <div className="text-[10px] font-bold text-orange-800 leading-tight mb-3 line-clamp-2 italic">
              {menuDisplay.hot}
            </div>
            <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto custom-scrollbar">
              {Object.entries(assignments)
                .filter(([_, type]) => type === 'hot')
                .map(([name]) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData('studentName', name)
                    }
                    className="px-2 py-1 bg-white border border-orange-100 rounded-lg text-[9px] font-bold shadow-sm cursor-grab active:cursor-grabbing"
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
              <span className="text-[9px] font-black uppercase text-emerald-400 tracking-tighter">
                Bento Box
              </span>
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {Object.values(assignments).filter((v) => v === 'bento').length}
              </span>
            </div>
            <div className="text-[10px] font-bold text-emerald-800 leading-tight mb-3 line-clamp-2 italic">
              {menuDisplay.bento}
            </div>
            <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto custom-scrollbar">
              {Object.entries(assignments)
                .filter(([_, type]) => type === 'bento')
                .map(([name]) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData('studentName', name)
                    }
                    className="px-2 py-1 bg-white border border-emerald-100 rounded-lg text-[9px] font-bold shadow-sm cursor-grab active:cursor-grabbing"
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
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-tighter">
                Home Lunch
              </span>
              <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {Object.values(assignments).filter((v) => v === 'home').length}
              </span>
            </div>
            <div className="text-[10px] font-bold text-blue-800 leading-tight mb-3 italic">
              Packing from home
            </div>
            <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto custom-scrollbar">
              {Object.entries(assignments)
                .filter(([_, type]) => type === 'home')
                .map(([name]) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData('studentName', name)
                    }
                    className="px-2 py-1 bg-white border border-blue-100 rounded-lg text-[9px] font-bold shadow-sm cursor-grab active:cursor-grabbing"
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
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-y-auto custom-scrollbar"
        >
          <div className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest text-center">
            Drag Your Name to Your Choice
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {unassigned.length > 0 ? (
              unassigned.map((name) => (
                <div
                  key={name}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData('studentName', name)
                  }
                  className="px-4 py-2 bg-white border-b-2 border-slate-200 rounded-xl text-xs font-black shadow-sm cursor-grab hover:border-indigo-400 hover:-translate-y-0.5 transition-all active:scale-90"
                >
                  {name}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-300 italic py-4">
                All students checked in!
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-start items-center gap-2 shrink-0">
        <button
          onClick={() => void fetchNutrislice()}
          disabled={isSyncing || isManualMode}
          className="p-2 bg-slate-50 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded-lg transition-all border border-slate-100 disabled:opacity-50 relative"
          title="Sync from Nutrislice"
        >
          {isSyncing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {syncError && (
            <div
              className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black px-1 rounded-full border border-white"
              title={syncError}
            >
              !
            </div>
          )}
        </button>
        <div className="text-[8px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
          <span>Last Sync</span>
          {config.lastSyncDate && (
            <span className="text-slate-400">
              {new Date(config.lastSyncDate).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      <SubmitReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleConfirmReport}
        data={getReportData()}
        isSubmitting={isReporting}
      />
    </div>
  );
};

export const LunchCountSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as LunchCountConfig;
  const {
    schoolSite = 'schumann-elementary',
    isManualMode = false,
    manualHotLunch = '',
    manualBentoBox = '',
    roster = [],
    rosterMode = 'class',
  } = config;

  return (
    <div className="space-y-6">
      <RosterModeControl
        rosterMode={rosterMode}
        onModeChange={(mode) =>
          updateWidget(widget.id, {
            config: { ...config, rosterMode: mode },
          })
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <School className="w-3 h-3" /> School Site
            </label>
            <select
              value={schoolSite}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    schoolSite: e.target
                      .value as LunchCountConfig['schoolSite'],
                    cachedMenu: null,
                  },
                })
              }
              className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none bg-white"
            >
              {SCHOOL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                Manual Mode
              </span>
              <button
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, isManualMode: !isManualMode },
                  })
                }
                className={`w-10 h-5 rounded-full transition-colors relative ${isManualMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isManualMode ? 'right-1' : 'left-1'}`}
                />
              </button>
            </div>
            {isManualMode && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <input
                  placeholder="Hot Lunch Name"
                  value={manualHotLunch}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: { ...config, manualHotLunch: e.target.value },
                    })
                  }
                  className="w-full p-2 text-[10px] font-bold border border-indigo-200 rounded-lg outline-none"
                />
                <input
                  placeholder="Bento Box Name"
                  value={manualBentoBox}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: { ...config, manualBentoBox: e.target.value },
                    })
                  }
                  className="w-full p-2 text-[10px] font-bold border border-indigo-200 rounded-lg outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          {rosterMode === 'custom' ? (
            <>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                <Users className="w-3 h-3" /> Custom Roster
              </label>
              <textarea
                value={roster.join('\n')}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      roster: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
                placeholder="Enter one student per line..."
                className="w-full h-[240px] p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl outline-none resize-none leading-relaxed"
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center gap-3">
              <Users className="w-8 h-8 text-slate-300" />
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Using Active Class Roster
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
