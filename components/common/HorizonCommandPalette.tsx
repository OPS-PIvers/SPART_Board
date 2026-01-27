import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useLiveSession } from '../../hooks/useLiveSession';
import { TOOLS } from '../../config/tools';
import { WIDGET_DEFAULTS } from '../../config/widgetDefaults';
import { TimeToolConfig } from '../../types';
import {
  Search,
  Command,
  ArrowRight,
  Monitor,
  Trash2,
  Snowflake,
  Layout,
  Plus,
  Clock,
  LogOut,
} from 'lucide-react';

interface CommandAction {
  id: string;
  icon: React.ElementType;
  label: string;
  subLabel?: string;
  category: 'Tool' | 'Action' | 'Navigation' | 'Smart';
  perform: () => void;
  keywords: string[];
  shortcut?: string;
}

export const HorizonCommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    addWidget,
    dashboards,
    loadDashboard,
    clearAllWidgets,
    activeDashboard,
    createNewDashboard,
  } = useDashboard();
  const { user } = useAuth();
  const { session, endSession, toggleGlobalFreeze } = useLiveSession(
    user?.uid,
    'teacher'
  );

  // Toggle Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            // Reset state when opening
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
          return next;
        });
      }
      if (e.key === 'Escape') {
        setIsOpen((prev) => {
          if (prev) return false;
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions List
  const actions: CommandAction[] = useMemo(() => {
    const list: CommandAction[] = [];

    // 1. Tools
    TOOLS.forEach((tool) => {
      list.push({
        id: `tool-${tool.type}`,
        icon: tool.icon,
        label: tool.label,
        subLabel: 'Add Widget',
        category: 'Tool',
        keywords: [tool.label, tool.type, 'add', 'create', 'widget'],
        perform: () => addWidget(tool.type),
      });
    });

    // 2. Navigation (Dashboards)
    dashboards.forEach((db) => {
      if (db.id === activeDashboard?.id) return;
      list.push({
        id: `nav-${db.id}`,
        icon: Layout,
        label: db.name,
        subLabel: 'Switch Board',
        category: 'Navigation',
        keywords: [db.name, 'switch', 'board', 'nav', 'go'],
        perform: () => loadDashboard(db.id),
      });
    });

    // 3. Smart Actions (Timers)
    const timerDefaults = WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig;
    [1, 2, 5, 10, 15, 20, 30, 45, 60].forEach((min) => {
      list.push({
        id: `smart-timer-${min}`,
        icon: Clock,
        label: `${min} Minute Timer`,
        subLabel: 'Smart Action',
        category: 'Smart',
        keywords: [`${min}`, 'min', 'timer', 'count', 'down', 'start'],
        perform: () =>
          addWidget('time-tool', {
            config: {
              ...timerDefaults,
              mode: 'timer',
              duration: min * 60,
              isRunning: true,
            },
          }),
      });
    });

    // Stopwatch
    list.push({
      id: 'smart-stopwatch',
      icon: Clock,
      label: 'Start Stopwatch',
      subLabel: 'Smart Action',
      category: 'Smart',
      keywords: ['stopwatch', 'count', 'up', 'start'],
      perform: () =>
        addWidget('time-tool', {
          config: {
            ...timerDefaults,
            mode: 'stopwatch',
            isRunning: true,
          },
        }),
    });

    // 4. Global Actions
    list.push({
      id: 'action-clear',
      icon: Trash2,
      label: 'Clear Board',
      subLabel: 'Remove all widgets',
      category: 'Action',
      keywords: ['clear', 'remove', 'delete', 'reset', 'empty'],
      perform: () => {
        if (confirm('Clear all widgets?')) clearAllWidgets();
      },
    });

    list.push({
      id: 'action-new-board',
      icon: Plus,
      label: 'New Board',
      subLabel: 'Create a fresh dashboard',
      category: 'Action',
      keywords: ['new', 'create', 'board', 'dashboard', 'add'],
      perform: () => createNewDashboard(`New Board ${dashboards.length + 1}`),
    });

    if (session?.isActive) {
      list.push({
        id: 'action-freeze',
        icon: Snowflake,
        label: session.frozen ? 'Unfreeze Students' : 'Freeze Students',
        subLabel: 'Live Session',
        category: 'Action',
        keywords: ['freeze', 'unfreeze', 'stop', 'lock', 'pause'],
        perform: () => void toggleGlobalFreeze(!session.frozen),
      });

      list.push({
        id: 'action-end-session',
        icon: LogOut,
        label: 'End Session',
        subLabel: 'Disconnect students',
        category: 'Action',
        keywords: ['end', 'session', 'stop', 'disconnect', 'close'],
        perform: () => void endSession(),
      });
    }

    return list;
  }, [
    addWidget,
    dashboards,
    activeDashboard,
    loadDashboard,
    clearAllWidgets,
    createNewDashboard,
    session,
    endSession,
    toggleGlobalFreeze,
  ]);

  // Filtering
  const filteredActions = useMemo(() => {
    if (!query) return actions.slice(0, 10); // Default items

    const lowerQuery = query.toLowerCase();
    return actions
      .filter((action) => {
        const textMatch =
          action.label.toLowerCase().includes(lowerQuery) ||
          (action.subLabel?.toLowerCase().includes(lowerQuery) ?? false);
        const keywordMatch = action.keywords.some((k) =>
          k.toLowerCase().includes(lowerQuery)
        );
        return textMatch || keywordMatch;
      })
      .sort((a, b) => {
        // Simple ranking: exact startsWith > contains
        const aStarts = a.label.toLowerCase().startsWith(lowerQuery);
        const bStarts = b.label.toLowerCase().startsWith(lowerQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      })
      .slice(0, 50);
  }, [actions, query]);

  // Keyboard Navigation
  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredActions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredActions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].perform();
          setIsOpen(false);
        }
      }
    },
    [filteredActions, selectedIndex]
  );

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 border border-slate-200 ring-1 ring-black/5 flex flex-col max-h-[60vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleListKeyDown}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-xxs font-bold text-slate-500 uppercase tracking-wider">
            <span className="text-xs">Esc</span>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1"
        >
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No results found</p>
            </div>
          ) : (
            filteredActions.map((action, i) => (
              <button
                key={action.id}
                onClick={() => {
                  action.perform();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group ${
                  i === selectedIndex
                    ? 'bg-blue-600 text-white shadow-md scale-[1.01]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div
                  className={`p-2 rounded-lg ${
                    i === selectedIndex
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'
                  }`}
                >
                  <action.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{action.label}</div>
                  {action.subLabel && (
                    <div
                      className={`text-xs truncate ${
                        i === selectedIndex ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {action.subLabel}
                    </div>
                  )}
                </div>
                {action.category && (
                  <span
                    className={`text-xxs font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                      i === selectedIndex
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {action.category}
                  </span>
                )}
                {i === selectedIndex && (
                  <ArrowRight className="w-4 h-4 text-white animate-pulse ml-2" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> Select
            </span>
            <span className="flex items-center gap-1">
              <Monitor className="w-3 h-3" /> Navigate
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-60">
            <Command className="w-3 h-3" /> K to toggle
          </div>
        </div>
      </div>
    </div>
  );
};
