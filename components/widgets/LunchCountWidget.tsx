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
  Loader2,
} from 'lucide-react';

type LunchType = 'hot' | 'bento' | 'home' | 'none';

const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate', label: 'Orono Intermediate' },
  { id: 'orono-middle', label: 'Orono Middle School' },
  { id: 'orono-high-school', label: 'Orono High School' },
];

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
  } = config;

  const [isFetching, setIsFetching] = useState(false);

  // Automatic Menu Sync Logic - "The SPART Way"
  const fetchMenu = useCallback(
    async (force = false) => {
      // Only fetch if menu is empty OR if the teacher clicked "Sync Now"
      if (!schoolId || (menuText && !force)) return;

      setIsFetching(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        // Nutrislice usually expects YYYY-MM-DD for their internal day lookup
        const todayStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        // Standard Nutrislice API endpoint for Orono
        const apiUrl = `https://orono.api.nutrislice.com/menu/api/weeks/school/${schoolId}/menu-type/lunch/${year}/${month}/${day}/?format=json`;

        // Bypassing CORS using AllOrigins proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('Network response was not ok');

        const proxyData = (await res.json()) as { contents: string };
        const data = JSON.parse(proxyData.contents) as {
          days?: {
            date: string;
            menu_items?: {
              food?: { name: string; food_category?: string };
              is_section_title?: boolean;
            }[];
          }[];
        };

        // Find today's data in the weekly array
        const dayData = data.days?.find((d) => d.date === todayStr);

        if (dayData && dayData.menu_items) {
          const items = dayData.menu_items
            .filter((item) => item.food && item.food.name)
            // Prioritize entrees, otherwise take non-titles
            .filter(
              (item) =>
                item.food?.food_category === 'entree' || !item.is_section_title
            )
            .map((item) => item.food?.name || '');

          // De-duplicate items (e.g. if the same item is on two lines)
          const uniqueItems = Array.from(new Set(items)).filter(Boolean);

          if (uniqueItems.length > 0) {
            const menuString = uniqueItems.join(', ');
            updateWidget(widget.id, {
              config: { ...config, menuText: menuString },
            });
            addToast('Lunch menu updated!', 'success');
          } else {
            if (force) addToast('No items found for today.', 'info');
          }
        }
      } catch (err) {
        console.error('Menu fetch error:', err);
        if (force) addToast('Could not reach menu server.', 'error');
      } finally {
        setIsFetching(false);
      }
    },
    [schoolId, menuText, config, widget.id, updateWidget, addToast]
  );

  // Run on mount or when school changes
  useEffect(() => {
    void fetchMenu();
  }, [fetchMenu]);

  const students = useMemo(() => {
    const firsts = firstNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n);
    const lasts = lastNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n);
    const count = Math.max(firsts.length, lasts.length);
    const combined = [];
    for (let i = 0; i < count; i++) {
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

  const handleSend = () => {
    const counts = { hot: 0, bento: 0, home: 0, none: 0 };
    students.forEach((s) => counts[(assignments[s] as LunchType) || 'none']++);
    const summary = `Lunch Count Summary:\n\nHot: ${counts.hot}\nBento: ${counts.bento}\nHome: ${counts.home}\n\nSent from Classroom Dashboard.`;
    window.open(
      `mailto:${recipient}?subject=Lunch Count&body=${encodeURIComponent(summary)}`
    );
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
        <p className="text-sm font-bold uppercase tracking-widest">
          Roster Empty
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 bg-white gap-3 select-none pt-2">
      {/* Top Buttons */}
      <div className="flex gap-2 shrink-0 px-1">
        <button
          onClick={() =>
            updateWidget(widget.id, { config: { ...config, assignments: {} } })
          }
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={handleSend}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Send className="w-3 h-3" /> Send Lunch Report
        </button>
      </div>

      {/* Menu Box (Dynamic Content) */}
      {(menuText || isFetching) && (
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 shrink-0 flex items-start gap-3 relative animate-in fade-in zoom-in duration-300">
          <UtensilsCrossed
            className={`w-5 h-5 text-amber-500 shrink-0 mt-0.5 ${isFetching ? 'animate-pulse' : ''}`}
          />
          <div className="flex-1">
            <div className="text-[8px] font-black uppercase text-amber-400 tracking-wider mb-0.5">
              Today&apos;s Menu
            </div>
            {isFetching ? (
              <div className="text-xs text-amber-900/50 italic flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Fetching school
                menu...
              </div>
            ) : (
              <div className="text-xs font-bold text-amber-900 leading-tight italic">
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
            onDrop={(e) => handleDrop(e, cat.type)}
            className={`flex flex-col min-h-[6rem] rounded-2xl border-2 border-dashed ${cat.color} ${cat.border} transition-all`}
          >
            <div className="p-2 flex items-center justify-between border-b border-dashed border-inherit bg-white/40">
              <div className="flex items-center gap-1.5">
                <cat.icon className="w-3 h-3 text-slate-500" />
                <span className="text-[9px] font-black uppercase tracking-tight text-slate-700">
                  {cat.label}
                </span>
              </div>
              <span className="text-[10px] font-black bg-white px-1.5 py-0.5 rounded-full shadow-sm text-slate-900">
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
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-400"
                  >
                    {name}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Waiting Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, 'none')}
        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start min-h-[4rem]"
      >
        <div className="w-full text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
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
        {students.length > 0 &&
          students.every(
            (s) => assignments[s] && assignments[s] !== 'none'
          ) && (
            <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-[10px]">
              All students accounted for!
            </div>
          )}
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
  } = config;

  return (
    <div className="space-y-6">
      {/* School Selection & Sync */}
      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
            <School className="w-3 h-3" /> Select Your School
          </label>
          <div className="flex gap-2">
            <select
              value={schoolId}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: { ...config, schoolId: e.target.value, menuText: '' },
                })
              }
              className="flex-1 p-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {SCHOOL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
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
            placeholder="e.g. Crispy Chicken Sandwich, Steamed Broccoli..."
            className="w-full h-20 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
          />
          <p className="mt-1 text-[8px] text-slate-400 italic">
            Manual override. Clear this box to auto-sync from Nutrislice.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
            First Names
          </label>
          <textarea
            value={firstNames}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, firstNames: e.target.value },
              })
            }
            className="w-full h-32 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl outline-none resize-none font-sans"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
            Last Names
          </label>
          <textarea
            value={lastNames}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, lastNames: e.target.value },
              })
            }
            className="w-full h-32 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl outline-none resize-none font-sans"
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
          className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none bg-white"
        />
      </div>
    </div>
  );
};
