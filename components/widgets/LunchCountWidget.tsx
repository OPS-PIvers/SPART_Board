import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, LunchCountConfig } from '../../types';
import {
  Users,
  Send,
  Coffee,
  Home,
  Box,
  RefreshCw,
  UserPlus,
  UtensilsCrossed,
  School,
  Loader2,
  CalendarDays,
  FlaskConical,
  AlertTriangle,
} from 'lucide-react';

type LunchType = 'hot' | 'bento' | 'home' | 'none';

interface NutrisliceItem {
  is_section_title?: boolean;
  food?: {
    name: string;
  };
  text?: string;
}

interface NutrisliceDigest {
  menu_items?: NutrisliceItem[];
}

const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate', label: 'Orono Intermediate' },
  { id: 'orono-middle', label: 'Orono Middle School' },
  { id: 'orono-high-school', label: 'Orono High School' },
];

export const LunchCountWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, addToast, rosters, activeRosterId } = useDashboard();
  const config = widget.config as LunchCountConfig;
  const {
    firstNames = '',
    lastNames = '',
    assignments = {},
    recipient = 'paul.ivers@orono.k12.mn.us',
    schoolId = 'schumann-elementary',
    menuText = '',
    testDate = '',
  } = config;

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const activeRoster = useMemo(
    () => rosters.find((r) => r.id === activeRosterId),
    [rosters, activeRosterId]
  );

  // Refined Menu Sync Logic - "The SPART Way"
  const fetchMenu = useCallback(
    async (force = false) => {
      if (!schoolId || (menuText && !force)) return;

      setIsFetching(true);
      setFetchError(null);
      try {
        const targetDate = testDate
          ? new Date(testDate + 'T12:00:00')
          : new Date();
        const year = targetDate.getFullYear();
        const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
        const day = targetDate.getDate().toString().padStart(2, '0');

        // We use the "Digest" API which is more reliable for single-day lookups
        const apiUrl = `https://orono.api.nutrislice.com/menu/api/digest/school/${schoolId}/menu-type/lunch/date/${year}/${month}/${day}/?format=json`;

        // AllOrigins proxy to bypass browser security
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
          apiUrl
        )}&timestamp=${Date.now()}`;

        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('API unreachable');

        const proxyData = (await res.json()) as { contents: string };
        const data = JSON.parse(proxyData.contents) as NutrisliceDigest;

        // Log for debugging - can be seen in browser console (F12)
        // eslint-disable-next-line no-console
        console.log('SPARTY: Menu Data Received', data);

        if (data && data.menu_items) {
          // Extract names from all food items, skipping section headers
          const items = data.menu_items
            .filter(
              (item) => !item.is_section_title && (item.food?.name ?? item.text)
            )
            .map((item) => item.food?.name ?? item.text)
            .filter((name): name is string => typeof name === 'string');

          const uniqueItems = Array.from(new Set(items));

          if (uniqueItems.length > 0) {
            const menuString = uniqueItems.join(', ');
            updateWidget(widget.id, {
              config: { ...config, menuText: menuString },
            });
            addToast('Menu found!', 'success');
          } else {
            setFetchError(
              "No lunch items found in the school's digital menu for this day."
            );
          }
        } else {
          setFetchError(`School reports no menu scheduled for today.`);
        }
      } catch (err) {
        console.error('SPARTY: Sync Error', err);
        setFetchError(
          'Menu sync unavailable. Browser security or school server issue.'
        );
      } finally {
        setIsFetching(false);
      }
    },
    [schoolId, menuText, config, widget.id, testDate, updateWidget, addToast]
  );

  useEffect(() => {
    void fetchMenu();
  }, [fetchMenu]);

  const students = useMemo(() => {
    if (activeRoster) {
      return activeRoster.students.map((s) =>
        `${s.firstName} ${s.lastName}`.trim()
      );
    }

    const firsts = firstNames
      .split('\n')
      .map((n: string) => n.trim())
      .filter((n: string) => n);

    const lasts = lastNames
      .split('\n')
      .map((n: string) => n.trim())
      .filter((n: string) => n);

    const count = Math.max(firsts.length, lasts.length);
    const combined = [];
    for (let i = 0; i < count; i++) {
      const f = firsts[i] || '';
      const l = lasts[i] || '';
      const name = `${f} ${l}`.trim();
      if (name) combined.push(name);
    }
    return combined;
  }, [firstNames, lastNames, activeRoster]);

  const handleDragStart = (e: React.DragEvent, name: string) => {
    e.dataTransfer.setData('studentName', name);
  };

  const handleDrop = (e: React.DragEvent, type: LunchType) => {
    const name = e.dataTransfer.getData('studentName');
    if (name) {
      const newAssignments = { ...assignments, [name]: type };
      updateWidget(widget.id, {
        config: { ...config, assignments: newAssignments },
      });
    }
  };

  const handleSend = () => {
    const counts = { hot: 0, bento: 0, home: 0, none: 0 };
    students.forEach((s: string) => {
      const type = (assignments[s] as LunchType) || 'none';
      counts[type]++;
    });

    const summary = `Lunch Count Summary:\n\nHot Lunch: ${counts.hot}\nBento Box: ${counts.bento}\nHome Lunch: ${counts.home}\nNot Reported: ${counts.none}\n\nSent from School Boards.`;
    const mailto = `mailto:${recipient}?subject=Lunch Count - ${new Date().toLocaleDateString()}&body=${encodeURIComponent(
      summary
    )}`;

    window.open(mailto);
    addToast('Lunch report summary generated!', 'success');
  };

  const resetCount = () => {
    if (confirm('Reset all lunch choices for today?')) {
      updateWidget(widget.id, {
        config: { ...config, assignments: {} },
      });
    }
  };

  const categories: {
    type: LunchType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    border: string;
  }[] = [
    {
      type: 'hot',
      label: 'Hot Lunch',
      icon: Coffee,
      color: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      type: 'bento',
      label: 'Bento Box',
      icon: Box,
      color: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      type: 'home',
      label: 'Home Lunch',
      icon: Home,
      color: 'bg-blue-50',
      border: 'border-blue-200',
    },
  ];

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3">
        <Users className="w-12 h-12 opacity-20" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest mb-1">
            Class Roster Empty
          </p>
          <p className="text-xs">
            Flip this widget to enter your student names.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 bg-white gap-3 select-none relative">
      {activeRoster && (
        <div className="absolute top-1 right-2 flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 z-10 animate-in fade-in slide-in-from-top-1">
          <Box className="w-2 h-2 text-orange-500" />
          <span className="text-[8px] font-black uppercase text-orange-600 tracking-wider">
            {activeRoster.name}
          </span>
        </div>
      )}

      {(menuText || isFetching || fetchError) && (
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 shrink-0 flex items-start gap-3 relative animate-in fade-in zoom-in duration-300 min-h-[4rem]">
          <UtensilsCrossed
            className={`w-5 h-5 text-amber-500 shrink-0 mt-0.5 ${ isFetching ? 'animate-pulse' : ''}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <div className="text-[8px] font-black uppercase text-amber-400 tracking-wider">
                Today&apos;s Menu
              </div>
              {testDate && (
                <div className="flex items-center gap-1 bg-amber-500 text-white px-1.5 rounded text-[7px] font-black uppercase shadow-sm">
                  <FlaskConical className="w-2 h-2" /> TEST: {testDate}
                </div>
              )}
            </div>
            {isFetching ? (
              <div className="text-xs text-amber-900/50 italic flex items-center gap-2 mt-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing Orono
                ISD...
              </div>
            ) : fetchError ? (
              <div className="flex items-start gap-1.5 text-[10px] text-amber-700/70 font-bold italic mt-1 leading-tight">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {fetchError}
              </div>
            ) : (
              <div className="text-xs font-bold text-amber-900 leading-tight italic mt-1">
                &quot;{menuText}&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Buckets */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        {categories.map((cat) => (
          <div
            key={cat.type}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              handleDrop(e, cat.type);
            }}
            className={`flex flex-col h-40 rounded-2xl border-2 border-dashed ${cat.color} ${cat.border} transition-all relative overflow-hidden`}
          >
            <div className="p-2 flex items-center justify-between border-b border-dashed border-inherit bg-white/40">
              <div className="flex items-center gap-1.5">
                <cat.icon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-tight text-slate-700">
                  {cat.label}
                </span>
              </div>
              <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-full shadow-sm">
                {
                  students.filter((s: string) => assignments[s] === cat.type)
                    .length
                }
              </span>
            </div>
            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar flex flex-wrap gap-1 content-start">
              {students
                .filter((s: string) => assignments[s] === cat.type)
                .map((name: string) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) => {
                      handleDragStart(e, name);
                    }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-400"
                  >
                    {name}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      {/* Waiting Area (Unassigned) */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          handleDrop(e, 'none');
        }}
        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start min-h-0"
      >
        <div className="w-full text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
          Waiting to Choose...
        </div>
        {students
          .filter((s: string) => !assignments[s] || assignments[s] === 'none')
          .map((name: string) => (
            <div
              key={name}
              draggable
              onDragStart={(e) => {
                handleDragStart(e, name);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm cursor-grab active:cursor-grabbing hover:scale-105 hover:border-indigo-400 transition-all"
            >
              {name}
            </div>
          ))}
        {students.every(
          (s: string) => assignments[s] && assignments[s] !== 'none'
        ) && (
          <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-[10px]">
            All students accounted for!
          </div>
        )}
      </div>
      {/* Footer Actions */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={resetCount}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={handleSend}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Send className="w-3 h-3" /> Send Lunch Report
        </button>
      </div>{' '}
    </div>
  );
};

export const LunchCountSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as LunchCountConfig;
  const {
    firstNames = '',
    lastNames = '',
    recipient = 'paul.ivers@orono.k12.mn.us',
    schoolId = 'schumann-elementary',
    menuText = '',
    testDate = '',
  } = config;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
            <School className="w-3 h-3" /> Select Your School
          </label>
          <select
            value={schoolId}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  schoolId: e.target.value,
                  menuText: '',
                },
              })
            }
            className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none bg-white text-slate-900"
          >
            {SCHOOL_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white/50 p-3 rounded-xl border border-indigo-100 space-y-2">
          <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block flex items-center gap-2">
            <CalendarDays className="w-3 h-3" /> Simulated Testing Date
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={testDate}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    testDate: e.target.value,
                    menuText: '',
                  },
                })
              }
              className="flex-1 p-2 text-[10px] border border-slate-200 rounded-lg outline-none bg-white text-slate-900"
            />
            {testDate && (
              <button
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, testDate: '', menuText: '' },
                  })
                }
                className="p-2 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-bold uppercase"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
            <UtensilsCrossed className="w-3 h-3" /> Daily Menu Text
          </label>
          <textarea
            value={menuText}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, menuText: e.target.value },
              })
            }
            placeholder="Manual override..."
            className="w-full h-20 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed text-slate-900"
          />
          <p className="mt-1 text-[8px] text-slate-400 italic font-medium">
            Clear to force a re-fetch.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <UserPlus className="w-3 h-3" /> First Names
          </label>
          <textarea
            value={firstNames}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, firstNames: e.target.value },
              })
            }
            placeholder="Alice&#10;Bob&#10;Charlie..."
            className="w-full h-48 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900 leading-relaxed"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <UserPlus className="w-3 h-3" /> Last Names
          </label>
          <textarea
            value={lastNames}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, lastNames: e.target.value },
              })
            }
            placeholder="Smith&#10;Jones&#10;Brown..."
            className="w-full h-48 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900 leading-relaxed"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Recipient Email
        </label>
        <input
          type="email"
          value={recipient}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, recipient: e.target.value },
            })
          }
          placeholder="email@example.com"
          className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
        />
      </div>
    </div>
  );
};