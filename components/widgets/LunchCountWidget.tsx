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
  UtensilsCrossed,
  School,
  CalendarDays,
} from 'lucide-react';

type LunchType = 'hot' | 'bento' | 'home' | 'none';

const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate', label: 'Orono Intermediate' },
  { id: 'orono-middle', label: 'Orono Middle School' },
  { id: 'orono-high-school', label: 'Orono High School' },
];

// OFFICIAL ORONO BRAND COLORS
const ORONO = {
  bluePrimary: '#2d3f89',
  blueDark: '#1d2a5d',
  blueLighter: '#eaecf5',
  redPrimary: '#ad2122',
  grayPrimary: '#666666',
  grayDark: '#333333',
  grayLight: '#999999',
  grayLightest: '#f3f3f3',
};

export const LunchCountWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast } = useDashboard();
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

  // Advanced Fetcher with Proxy Fallback
  const fetchMenu = useCallback(
    async (force = false) => {
      if (!schoolId || (menuText && !force)) return;

      setIsFetching(true);
      setFetchError(null);

      const targetDate = testDate
        ? new Date(testDate + 'T12:00:00')
        : new Date();
      const year = targetDate.getFullYear();
      const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
      const day = targetDate.getDate().toString().padStart(2, '0');

      const apiUrl = `https://orono.api.nutrislice.com/menu/api/digest/school/${schoolId}/menu-type/lunch/date/${year}/${month}/${day}/?format=json`;

      // Attempt with multiple proxies to bypass congestion
      const proxies = [
        (url: string) =>
          `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&ts=${Date.now()}`,
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      ];

      let success = false;
      for (const getProxyUrl of proxies) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout per proxy

          const res = await fetch(getProxyUrl(apiUrl), {
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!res.ok) continue;

          const rawData = (await res.json()) as { contents?: string };
          // Handle different proxy response shapes
          const content =
            typeof rawData.contents === 'string'
              ? (JSON.parse(rawData.contents) as {
                  menu_items?: {
                    is_section_title?: boolean;
                    food?: { name: string };
                    text?: string;
                  }[];
                })
              : (rawData as {
                  menu_items?: {
                    is_section_title?: boolean;
                    food?: { name: string };
                    text?: string;
                  }[];
                });

          if (content?.menu_items) {
            const items = content.menu_items
              .filter(
                (item) =>
                  !item.is_section_title && (item.food?.name || item.text)
              )
              .map((item) => item.food?.name || item.text || '');

            const uniqueItems = Array.from(new Set(items)).filter(Boolean);
            if (uniqueItems.length > 0) {
              updateWidget(widget.id, {
                config: { ...config, menuText: uniqueItems.join(', ') },
              });
              addToast('Menu Synced', 'success');
              success = true;
              break;
            }
          }
        } catch (err) {
          console.warn('Proxy attempt failed, trying next...', err);
        }
      }

      if (!success) {
        setFetchError('Connection slow. Try again or check Orono Nutrislice.');
      }
      setIsFetching(false);
    },
    [schoolId, menuText, config, widget.id, testDate, updateWidget, addToast]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMenu();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMenu]);

  const parsedMenu = useMemo(() => {
    if (!menuText) return { hot: '', bento: '' };
    const parts = menuText.split(',').map((p) => p.trim());
    return { hot: parts[0] || '', bento: parts[1] || '' };
  }, [menuText]);

  const students = useMemo(() => {
    const firsts = firstNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n);
    const lasts = lastNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n);
    const combined = [];
    for (let i = 0; i < Math.max(firsts.length, lasts.length); i++) {
      const name = `${firsts[i] || ''} ${lasts[i] || ''}`.trim();
      if (name) combined.push(name);
    }
    return combined;
  }, [firstNames, lastNames]);

  const handleDrop = (e: React.DragEvent, type: LunchType) => {
    const name = e.dataTransfer.getData('studentName');
    if (name) {
      updateWidget(widget.id, {
        config: { ...config, assignments: { ...assignments, [name]: type } },
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
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3 font-['Lexend'] text-slate-400">
        <Users className="w-12 h-12 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">
          Roster Empty
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 bg-white gap-3 select-none pt-2 font-['Lexend']">
      <div className="flex gap-2 shrink-0 px-1">
        <button
          onClick={() =>
            updateWidget(widget.id, { config: { ...config, assignments: {} } })
          }
          style={{
            color: ORONO.grayDark,
            backgroundColor: ORONO.grayLightest,
            border: `1px solid ${ORONO.grayLight}`,
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all hover:bg-slate-200"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={() => {
            const counts: Record<LunchType, number> = {
              hot: 0,
              bento: 0,
              home: 0,
              none: 0,
            };
            students.forEach((s) => {
              const type = (assignments[s] as LunchType) || 'none';
              counts[type]++;
            });
            const summary = `Lunch Count:\n\nHot: ${counts.hot}\nBento: ${counts.bento}\nHome: ${counts.home}\n\nSent from Dashboard.`;
            window.open(
              `mailto:${recipient}?subject=Lunch Count&body=${encodeURIComponent(summary)}`
            );
          }}
          style={{ backgroundColor: ORONO.redPrimary }}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 text-white rounded-lg text-[9px] font-bold uppercase shadow-sm transition-all hover:brightness-110 active:scale-95"
        >
          <Send className="w-3 h-3" /> Send Lunch Report
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-2 flex flex-col justify-center min-h-[4.5rem]">
          <span
            style={{ color: ORONO.grayPrimary }}
            className="text-[8px] font-bold uppercase mb-1 leading-none"
          >
            Option 1
          </span>
          <div className="text-[10px] font-bold text-orange-900 leading-tight">
            {parsedMenu.hot || (isFetching ? '...' : '---')}
          </div>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-2 flex flex-col justify-center min-h-[4.5rem]">
          <span
            style={{ color: ORONO.grayPrimary }}
            className="text-[8px] font-bold uppercase mb-1 leading-none"
          >
            Option 2
          </span>
          <div className="text-[10px] font-bold text-emerald-900 leading-tight">
            {parsedMenu.bento || (isFetching ? '...' : '---')}
          </div>
        </div>

        <div
          style={{
            backgroundColor: ORONO.blueLighter,
            borderColor: ORONO.bluePrimary,
          }}
          className="border-2 rounded-2xl p-2 flex items-center gap-2 min-h-[4.5rem]"
        >
          <UtensilsCrossed
            style={{ color: ORONO.bluePrimary }}
            className={`w-4 h-4 shrink-0 ${isFetching ? 'animate-pulse' : ''}`}
          />
          <div className="flex-1 min-w-0">
            <div
              style={{ color: ORONO.bluePrimary }}
              className="text-[8px] font-bold uppercase leading-none mb-1"
            >
              Today&apos;s Menu
            </div>
            {isFetching ? (
              <div
                style={{ color: ORONO.blueDark }}
                className="text-[9px] italic animate-pulse"
              >
                Syncing...
              </div>
            ) : fetchError ? (
              <div
                style={{ color: ORONO.redPrimary }}
                className="text-[8px] font-bold leading-tight"
              >
                {fetchError}
              </div>
            ) : (
              <div
                style={{ color: ORONO.blueDark, opacity: 0.6 }}
                className="text-[8px] font-bold italic uppercase leading-none"
              >
                Live Data
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 shrink-0">
        {categories.map((cat) => (
          <div
            key={cat.type}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, cat.type)}
            className={`flex flex-col min-h-[6rem] rounded-2xl border-2 border-dashed ${cat.color} ${cat.border} transition-all`}
          >
            <div className="p-2 flex items-center justify-between border-b border-dashed border-inherit bg-white/40">
              <span className="text-[9px] font-bold uppercase text-slate-700">
                {cat.label}
              </span>
              <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded-full shadow-sm text-slate-900">
                {students.filter((s) => assignments[s] === cat.type).length}
              </span>
            </div>
            <div className="flex-1 p-2 flex flex-wrap gap-1 content-start overflow-y-auto custom-scrollbar max-h-32">
              {students
                .filter((s) => assignments[s] === cat.type)
                .map((name) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData('studentName', name)
                    }
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold shadow-sm cursor-grab"
                  >
                    {name}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const name = e.dataTransfer.getData('studentName');
          if (name) {
            updateWidget(widget.id, {
              config: {
                ...config,
                assignments: { ...assignments, [name]: 'none' },
              },
            });
          }
        }}
        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start min-h-[4rem]"
      >
        <div className="w-full text-[9px] font-bold uppercase text-slate-400 mb-1">
          Waiting to Choose...
        </div>
        {students
          .filter((s) => !assignments[s] || assignments[s] === 'none')
          .map((name) => (
            <div
              key={name}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('studentName', name)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm cursor-grab hover:scale-105 hover:border-indigo-400 transition-all"
            >
              {name}
            </div>
          ))}
      </div>
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
    <div className="space-y-6 font-['Lexend']">
      <div
        style={{
          backgroundColor: ORONO.blueLighter,
          borderColor: ORONO.bluePrimary,
        }}
        className="p-4 rounded-2xl border space-y-4 shadow-sm text-slate-900"
      >
        <div>
          <label
            style={{ color: ORONO.bluePrimary }}
            className="text-[10px] font-bold uppercase tracking-widest mb-2 block flex items-center gap-2"
          >
            <School className="w-3 h-3" /> School Selection
          </label>
          <select
            value={schoolId}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, schoolId: e.target.value, menuText: '' },
              })
            }
            className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-900"
          >
            {SCHOOL_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{ color: ORONO.bluePrimary }}
            className="text-[10px] font-bold uppercase tracking-widest mb-2 block flex items-center gap-2"
          >
            <CalendarDays className="w-3 h-3" /> Testing Date (Override)
          </label>
          <input
            type="date"
            value={testDate}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, testDate: e.target.value, menuText: '' },
              })
            }
            className="w-full p-2 text-[10px] border border-slate-200 rounded-lg bg-white text-slate-900"
          />
        </div>

        <div>
          <label
            style={{ color: ORONO.bluePrimary }}
            className="text-[10px] font-bold uppercase tracking-widest mb-2 block flex items-center gap-2"
          >
            <UtensilsCrossed className="w-3 h-3" /> Manual Text Override
          </label>
          <textarea
            value={menuText}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, menuText: e.target.value },
              })
            }
            placeholder="Hot Item, Bento Item..."
            className="w-full h-20 p-3 text-xs font-bold border border-slate-200 rounded-2xl bg-white text-slate-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
            First Names
          </label>
          <textarea
            value={firstNames}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, firstNames: e.target.value },
              })
            }
            className="w-full h-32 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl text-slate-900"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
            Last Names
          </label>
          <textarea
            value={lastNames}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, lastNames: e.target.value },
              })
            }
            className="w-full h-32 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl text-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
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
          className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-900"
        />
      </div>
    </div>
  );
};
