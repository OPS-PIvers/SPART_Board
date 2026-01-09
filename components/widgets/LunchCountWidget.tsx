import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, LunchCountConfig } from '../../types';
import {
  Users,
  Send,
  RefreshCw,
  UtensilsCrossed,
  AlertTriangle,
  Coffee,
  Box,
  Home,
  Activity,
} from 'lucide-react';

const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate-school', label: 'Orono Intermediate' },
];

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

// Internal interfaces for type safety
interface SyncLog {
  source: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: number;
}

interface NutrisliceItem {
  text?: string;
  food?: {
    name: string;
  };
  is_section_title?: boolean;
}

interface NutrisliceResponse {
  menu_items?: NutrisliceItem[];
  contents?: string | NutrisliceResponse;
}

type LunchType = 'hot' | 'bento' | 'home' | 'none';

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

  // Local state for debug logs (not persisted to Firestore to save space)
  const [debugLogs, setDebugLogs] = useState<SyncLog[]>([]);

  // Ref to store current config to prevent dependency loops
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const addLog = useCallback(
    (source: string, status: SyncLog['status'], message: string) => {
      setDebugLogs((prev) =>
        [{ source, status, message, timestamp: Date.now() }, ...prev].slice(
          0,
          10
        )
      ); // Keep last 10 logs
    },
    []
  );

  const fetchMenu = useCallback(async () => {
    if (!schoolId) return;

    setIsFetching(true);
    setFetchError(null);
    setDebugLogs([]); // Clear old logs on new attempt

    const targetDate = testDate ? new Date(testDate + 'T12:00:00') : new Date();
    const year = targetDate.getFullYear();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const day = targetDate.getDate().toString().padStart(2, '0');

    // UPDATED URL: Removed .api subdomain
    const apiUrl = `https://orono.nutrislice.com/menu/api/digest/school/${schoolId}/menu-type/lunch/date/${year}/${month}/${day}/?format=json`;

    addLog(
      'Init',
      'pending',
      `Fetching for ${schoolId} on ${year}-${month}-${day}`
    );

    const proxies = [
      {
        name: 'CORSProxy',
        url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      },
      {
        name: 'AllOrigins',
        url: (u: string) =>
          `https://api.allorigins.win/get?url=${encodeURIComponent(u)}&ts=${Date.now()}`,
      },
    ];

    let success = false;

    for (const proxy of proxies) {
      try {
        addLog(proxy.name, 'pending', 'Attempting fetch...');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(proxy.url(apiUrl), {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          addLog(proxy.name, 'error', `HTTP ${res.status}`);
          continue;
        }

        const rawData = (await res.json()) as NutrisliceResponse & {
          contents?: string | NutrisliceResponse;
        };

        // Handle AllOrigins wrapper if present
        let content: NutrisliceResponse = rawData;

        if (rawData.contents) {
          if (typeof rawData.contents === 'string') {
            try {
              content = JSON.parse(rawData.contents) as NutrisliceResponse;
            } catch {
              addLog(
                proxy.name,
                'error',
                'Failed to parse AllOrigins JSON string'
              );
              continue;
            }
          } else {
            content = rawData.contents;
          }
        }

        if (content && Array.isArray(content.menu_items)) {
          const entrees = content.menu_items
            .filter(
              (item) => !item.is_section_title && (item.food?.name || item.text)
            )
            .map((item) => item.food?.name || item.text || '');

          const uniqueEntrees = Array.from(new Set(entrees)).filter(Boolean);

          if (uniqueEntrees.length > 0) {
            const menuString = uniqueEntrees.join(', ');
            updateWidget(widget.id, {
              config: { ...configRef.current, menuText: menuString },
            });
            addLog(
              proxy.name,
              'success',
              `Found: ${menuString.substring(0, 30)}...`
            );
            addToast('Menu Synced', 'success');
            success = true;
            break;
          } else {
            addLog(proxy.name, 'error', 'API returned 0 menu items');
          }
        } else {
          addLog(proxy.name, 'error', 'Invalid data structure (no menu_items)');
        }
      } catch (err) {
        const error = err as Error;
        addLog(proxy.name, 'error', error.message || 'Network error');
      }
    }

    if (!success) {
      const msg = 'Sync failed. See Settings for logs.';
      setFetchError(msg);
      addLog('Final', 'error', 'All proxies failed');
    }
    setIsFetching(false);
  }, [schoolId, testDate, widget.id, updateWidget, addToast, addLog]);

  // Initial Sync
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMenu();
  }, [schoolId, testDate, fetchMenu]);

  const parsedMenu = useMemo(() => {
    if (!menuText) return { hot: '---', bento: '---' };
    const parts = menuText.split(',').map((p) => p.trim());
    return {
      hot: parts[0] || 'Menu Unavailable',
      bento: parts[1] || 'Menu Unavailable',
    };
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

  const handleSend = () => {
    const counts: Record<LunchType, number> = {
      hot: 0,
      bento: 0,
      home: 0,
      none: 0,
    };
    students.forEach((s) => {
      const assigned = (assignments[s] as LunchType) || 'none';
      counts[assigned]++;
    });
    const summary = `Lunch Count (${new Date().toLocaleDateString()}):\n\nHot Lunch (${parsedMenu.hot}): ${counts.hot}\nBento Box (${parsedMenu.bento}): ${counts.bento}\nHome Lunch: ${counts.home}\n\nSent from Dashboard.`;
    window.open(
      `mailto:${recipient}?subject=Lunch Count&body=${encodeURIComponent(summary)}`
    );
  };

  const categories: {
    type: LunchType;
    label: string;
    icon: React.ElementType;
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
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3 text-slate-400">
        <Users className="w-12 h-12 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">
          Class Roster Empty
        </p>
        <button
          onClick={() => updateWidget(widget.id, { flipped: true })}
          className="text-[10px] font-bold text-indigo-500 underline"
        >
          Add Students in Settings
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 bg-white gap-3 select-none font-sans relative">
      {/* Error/Log Overlay */}
      {fetchError && (
        <div className="absolute top-2 right-2 z-50">
          <button
            onClick={() =>
              alert(
                debugLogs
                  .map(
                    (l) =>
                      `[${l.status.toUpperCase()}] ${l.source}: ${l.message}`
                  )
                  .join('\n')
              )
            }
            className="bg-red-100 text-red-600 p-1.5 rounded-lg hover:bg-red-200 transition-colors shadow-sm flex items-center gap-1"
            title="Click to view debug logs"
          >
            <Activity className="w-3 h-3" />
            <span className="text-[9px] font-bold">Logs</span>
          </button>
        </div>
      )}

      <div className="flex gap-2 shrink-0">
        <button
          onClick={() =>
            updateWidget(widget.id, { config: { ...config, assignments: {} } })
          }
          style={{ color: ORONO.grayDark, backgroundColor: ORONO.grayLightest }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-slate-200 hover:bg-slate-200"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={handleSend}
          style={{ backgroundColor: ORONO.redPrimary }}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          <Send className="w-3 h-3" /> Send Lunch Report
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-3 flex flex-col justify-center min-h-[5rem]">
          <span className="text-[8px] font-black uppercase text-orange-400 mb-1">
            Hot Lunch
          </span>
          <div className="text-[11px] font-bold text-orange-900 leading-tight">
            {isFetching ? 'Syncing...' : parsedMenu.hot}
          </div>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 flex flex-col justify-center min-h-[5rem]">
          <span className="text-[8px] font-black uppercase text-emerald-400 mb-1">
            Bento Box
          </span>
          <div className="text-[11px] font-bold text-emerald-900 leading-tight">
            {isFetching ? 'Syncing...' : parsedMenu.bento}
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: ORONO.blueLighter,
          borderColor: ORONO.bluePrimary,
        }}
        className="border rounded-2xl p-2 flex items-center justify-center gap-2"
      >
        <UtensilsCrossed
          style={{ color: ORONO.bluePrimary }}
          className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
        />
        <span
          style={{ color: ORONO.bluePrimary }}
          className="text-[9px] font-black uppercase tracking-tight"
        >
          {SCHOOL_OPTIONS.find((s) => s.id === schoolId)?.label} Menu • Today
        </span>
        {fetchError && (
          <span title={fetchError}>
            <AlertTriangle className="w-3 h-3 text-red-500" />
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 shrink-0">
        {categories.map((cat) => (
          <div
            key={cat.type}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const name = e.dataTransfer.getData('studentName');
              if (name)
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    assignments: { ...assignments, [name]: cat.type },
                  },
                });
            }}
            className={`flex flex-col min-h-[5rem] rounded-2xl border-2 border-dashed ${cat.color} ${cat.border} transition-all`}
          >
            <div className="p-2 flex items-center justify-between border-b border-dashed border-inherit bg-white/40">
              <span className="text-[8px] font-black uppercase text-slate-700">
                {cat.label}
              </span>
              <span className="text-[10px] font-black bg-white px-1.5 py-0.5 rounded-full shadow-sm">
                {students.filter((s) => assignments[s] === cat.type).length}
              </span>
            </div>
            <div className="flex-1 p-1.5 flex flex-wrap gap-1 content-start overflow-y-auto custom-scrollbar max-h-24">
              {students
                .filter((s) => assignments[s] === cat.type)
                .map((name) => (
                  <div
                    key={name}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData('studentName', name)
                    }
                    className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold shadow-sm cursor-grab active:scale-95"
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
          if (name)
            updateWidget(widget.id, {
              config: {
                ...config,
                assignments: { ...assignments, [name]: 'none' },
              },
            });
        }}
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
    testDate = '',
  } = config;

  return (
    <div className="space-y-6">
      <div
        style={{
          backgroundColor: ORONO.blueLighter,
          borderColor: ORONO.bluePrimary,
        }}
        className="p-4 rounded-2xl border space-y-4"
      >
        <div>
          <label
            style={{ color: ORONO.bluePrimary }}
            className="text-[10px] font-black uppercase tracking-widest mb-2 block"
          >
            Orono School Sync
          </label>
          <select
            value={schoolId}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, schoolId: e.target.value, menuText: '' },
              })
            }
            className="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
            className="text-[10px] font-black uppercase tracking-widest mb-2 block text-center"
          >
            Sync Date Override
          </label>
          <input
            type="date"
            value={testDate}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, testDate: e.target.value, menuText: '' },
              })
            }
            className="w-full p-2 text-[10px] font-bold border border-slate-200 rounded-xl text-center"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Class Roster (One per line)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <textarea
            value={firstNames}
            placeholder="First Names..."
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, firstNames: e.target.value },
              })
            }
            className="w-full h-48 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
          />
          <textarea
            value={lastNames}
            placeholder="Last Names..."
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, lastNames: e.target.value },
              })
            }
            className="w-full h-48 p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
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
          className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
};
