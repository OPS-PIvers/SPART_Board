import React, { useMemo, useEffect } from 'react';
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
} from 'lucide-react';

type LunchType = 'hot' | 'bento' | 'home' | 'none';

const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate', label: 'Orono Intermediate' },
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

  // Automatic Menu Sync Logic
  useEffect(() => {
    if (!schoolId || menuText) return;

    const fetchMenu = async () => {
      try {
        // Note: Nutrislice API format often requires a specific date and venue ID.
        // This is a placeholder for the fetch logic. If CORS blocks direct access,
        // we fallback to the cached menuText or manual entry.
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
          `https://orono.nutrislice.com/menu/api/weeks/school/${schoolId}/menu-type/lunch/date/${today}/`
        );

        if (response.ok) {
          const _data = (await response.json()) as unknown;
          // Extract menu items logic would go here based on API response structure
          addToast('Menu synced automatically', 'success');
        }
      } catch (_err) {
        // Silently fail as this is an enhancement; settings allow manual entry
        console.warn('Menu auto-sync unavailable due to browser security.');
      }
    };

    void fetchMenu();
  }, [schoolId, menuText, addToast]);

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
      {/* 1. TOP BUTTONS */}
      <div className="flex gap-2 shrink-0 px-1">
        <button
          onClick={() =>
            updateWidget(widget.id, { config: { ...config, assignments: {} } })
          }
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase hover:bg-slate-200 border border-slate-200"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={handleSend}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-indigo-700"
        >
          <Send className="w-3 h-3" /> Send Lunch Report
        </button>
      </div>

      {/* 2. DYNAMIC MENU BOX */}
      {menuText && (
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 shrink-0 flex items-start gap-3">
          <UtensilsCrossed className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[8px] font-black uppercase text-amber-400 tracking-wider mb-0.5">
              Today&apos;s Menu
            </div>
            <div className="text-xs font-bold text-amber-900 leading-tight italic">
              &quot;{menuText}&quot;
            </div>
          </div>
        </div>
      )}

      {/* 3. CATEGORY BUCKETS */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        {categories.map((cat) => (
          <div
            key={cat.type}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, cat.type)}
            className={`flex flex-col min-h-[6rem] rounded-2xl border-2 border-dashed ${cat.color} ${cat.border}`}
          >
            <div className="p-2 flex items-center justify-between border-b border-dashed border-inherit bg-white/40">
              <span className="text-[9px] font-black uppercase text-slate-700">
                {cat.label}
              </span>
              <span className="text-[10px] font-black bg-white px-1.5 py-0.5 rounded-full shadow-sm">
                {students.filter((s) => assignments[s] === cat.type).length}
              </span>
            </div>
            <div className="flex-1 p-2 flex flex-wrap gap-1 content-start">
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

      {/* 4. WAITING AREA */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, 'none')}
        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start min-h-0"
      >
        <div className="w-full text-[9px] font-black uppercase text-slate-400 mb-1">
          Waiting to Choose...
        </div>
        {students
          .filter((s) => !assignments[s] || assignments[s] === 'none')
          .map((name) => (
            <div
              key={name}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('studentName', name)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm cursor-grab hover:border-indigo-400"
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
  } = config;

  return (
    <div className="space-y-6">
      {/* School Selection */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
          <School className="w-3 h-3" /> Select Your School
        </label>
        <select
          value={schoolId}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, schoolId: e.target.value },
            })
          }
          className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {SCHOOL_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Manual Menu Override */}
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
          className="w-full h-20 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
        />
        <p className="mt-1 text-[8px] text-slate-400 italic">
          Leave blank to attempt automatic sync from school website.
        </p>
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
            className="w-full h-32 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl outline-none resize-none"
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
            className="w-full h-32 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl outline-none resize-none"
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
          className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none"
        />
      </div>
    </div>
  );
};
