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
  UserPlus,
  Utensils,
  ExternalLink,
  School,
} from 'lucide-react';

type LunchType = 'hot' | 'bento' | 'home' | 'none';
type SchoolId = 'IS' | 'SE';

const SCHOOLS: Record<SchoolId, { label: string; url: string }> = {
  IS: {
    label: 'Orono Intermediate (3-5)',
    url: 'https://orono.nutrislice.com/menu/orono-intermediate-school/lunch',
  },
  SE: {
    label: 'Schumann Elementary (K-2)',
    url: 'https://orono.nutrislice.com/menu/schumann-elementary/lunch',
  },
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
    menuUrl = SCHOOLS.IS.url,
    viewMode = 'count',
    schoolId = 'IS',
  } = config;

  // Sync menuUrl with schoolId if they don't match
  useEffect(() => {
    if (schoolId && SCHOOLS[schoolId].url !== menuUrl) {
      updateWidget(widget.id, {
        config: { ...config, menuUrl: SCHOOLS[schoolId].url },
      });
    }
  }, [schoolId, menuUrl, widget.id, updateWidget, config]);

  const students = useMemo(() => {
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
  }, [firstNames, lastNames]);

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

    const summary = `Lunch Count Summary:\n\nHot Lunch: ${counts.hot}\nBento Box: ${counts.bento}\nHome Lunch: ${counts.home}\nNot Reported: ${counts.none}\n\nSent from Classroom Dashboard Pro.`;
    const mailto = `mailto:${recipient}?subject=Lunch Count - ${new Date().toLocaleDateString()}&body=${encodeURIComponent(summary)}`;

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

  const toggleView = () => {
    updateWidget(widget.id, {
      config: { ...config, viewMode: viewMode === 'menu' ? 'count' : 'menu' },
    });
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

  if (viewMode === 'menu') {
    return (
      <div className="h-full flex flex-col p-3 bg-white gap-3 select-none">
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-50">
          <iframe
            src={menuUrl}
            className="w-full h-full border-0"
            title="Lunch Menu"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg shadow-sm hover:bg-white text-slate-600 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={toggleView}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Users className="w-3 h-3" /> Back to Count
          </button>
        </div>
      </div>
    );
  }

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
    <div className="h-full flex flex-col p-3 bg-white gap-3 select-none">
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
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
          title="Reset"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
        <button
          onClick={toggleView}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
        >
          <Utensils className="w-3 h-3" /> Menu
        </button>
        <button
          onClick={handleSend}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Send className="w-3 h-3" /> Send Report
        </button>
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
    menuUrl = SCHOOLS.IS.url,
    schoolId = 'IS',
  } = config;

  return (
    <div className="space-y-6">
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
            placeholder="Alice\nBob\nCharlie..."
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
            placeholder="Smith\nJones\nBrown..."
            className="w-full h-48 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900 leading-relaxed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <School className="w-3 h-3" /> School Menu
          </label>
          <select
            value={schoolId}
            onChange={(e) => {
              const newSchoolId = e.target.value as SchoolId;
              updateWidget(widget.id, {
                config: {
                  ...config,
                  schoolId: newSchoolId,
                  menuUrl: SCHOOLS[newSchoolId].url,
                },
              });
            }}
            className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            {Object.entries(SCHOOLS).map(([id, school]) => (
              <option key={id} value={id}>
                {school.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <Utensils className="w-3 h-3" /> Custom Menu URL (Optional)
          </label>
          <input
            type="url"
            value={menuUrl}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, menuUrl: e.target.value },
              })
            }
            placeholder="https://orono.nutrislice.com/..."
            className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
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
          className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <h4 className="text-[10px] font-black text-blue-700 uppercase mb-2">
          Instructions
        </h4>
        <p className="text-[9px] text-blue-600 leading-normal font-medium">
          Select your school to automatically load the correct lunch menu. You
          can also manually override the URL if needed.
        </p>
      </div>
    </div>
  );
};
