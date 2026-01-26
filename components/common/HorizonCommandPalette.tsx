import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { useDashboard } from '../../context/useDashboard';
import { TOOLS } from '../../config/tools';
import {
  TimeToolConfig,
  DiceConfig,
  WorkSymbolsConfig,
  SoundConfig,
} from '../../types';
import {
  Search,
  Zap,
  Layout,
  Command,
  ArrowRight,
  Clock,
  Dices,
  MicOff,
  Trash2,
  Volume2,
} from 'lucide-react';
import { WIDGET_DEFAULTS } from '../../config/widgetDefaults';

interface CommandItem {
  id: string;
  label: string;
  subLabel?: string;
  icon: React.ElementType;
  category: 'smart' | 'widget' | 'dashboard' | 'system';
  action: () => void;
  keywords: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HorizonCommandPalette: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    addWidget,
    dashboards,
    loadDashboard,
    activeDashboard,
    updateWidget,
    clearAllWidgets,
  } = useDashboard();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      const selected = list.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const startTimer = useCallback(
    (duration: number) => {
      const defaults = WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig;
      addWidget('time-tool', {
        config: {
          ...defaults,
          mode: 'timer',
          duration: duration,
          elapsedTime: duration,
          isRunning: true,
          startTime: Date.now(),
        } as TimeToolConfig,
      });
    },
    [addWidget]
  );

  // Generate Commands based on Query and Context
  const commands = useMemo<CommandItem[]>(() => {
    const results: CommandItem[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      // DEFAULT VIEW: Recent/Common Actions
      results.push({
        id: 'sys-clear',
        label: 'Clear Board',
        subLabel: 'Remove all widgets',
        icon: Trash2,
        category: 'system',
        action: () => {
          if (confirm('Clear all widgets?')) clearAllWidgets();
        },
        keywords: ['clear', 'reset', 'empty'],
      });

      // Show top widgets
      TOOLS.slice(0, 3).forEach((tool) => {
        results.push({
          id: `widget-${tool.type}`,
          label: tool.label,
          subLabel: 'Launch Widget',
          icon: tool.icon,
          category: 'widget',
          action: () => addWidget(tool.type),
          keywords: [tool.label.toLowerCase()],
        });
      });

      return results;
    }

    // 1. SMART ACTIONS (Regex Parsing)

    // Timer: "5m", "10s", "timer 5"
    const timerMatch = normalizedQuery.match(/^(?:timer\s+)?(\d+)(m|s)?$/);
    if (timerMatch) {
      const val = parseInt(timerMatch[1]);
      const unit = timerMatch[2] || 'm';
      const duration = unit === 'm' ? val * 60 : val;

      results.push({
        id: `smart-timer-${duration}`,
        label: `Start ${val}${unit === 'm' ? 'm' : 's'} Timer`,
        subLabel: 'Smart Action',
        icon: Clock,
        category: 'smart',
        action: () => startTimer(duration),
        keywords: ['timer', 'countdown'],
      });
    }

    // Dice: "roll 3", "dice 2"
    const diceMatch = normalizedQuery.match(/^(?:roll|dice)\s+(\d+)$/);
    if (diceMatch) {
      const count = Math.min(10, Math.max(1, parseInt(diceMatch[1])));
      results.push({
        id: `smart-dice-${count}`,
        label: `Roll ${count} Dice`,
        subLabel: 'Smart Action',
        icon: Dices,
        category: 'smart',
        action: () => {
          const defaults = WIDGET_DEFAULTS['dice'].config as DiceConfig;
          addWidget('dice', {
            config: {
              ...defaults,
              count: count,
            } as DiceConfig,
          });
        },
        keywords: ['dice', 'roll'],
      });
    }

    // Voice Level: "voice 0", "quiet", "level 2"
    const voiceMatch = normalizedQuery.match(/^(?:voice|level|quiet)\s*(\d)?$/);
    if (voiceMatch || normalizedQuery.includes('quiet')) {
      const levelStr = voiceMatch ? voiceMatch[1] : null;
      const level = levelStr ? parseInt(levelStr) : 0; // Default to 0 (Silence)

      if (level >= 0 && level <= 4) {
        results.push({
          id: `smart-voice-${level}`,
          label: `Set Voice Level ${level}`,
          subLabel: 'Update Work Symbols',
          icon: Volume2,
          category: 'smart',
          action: () => {
            // Check if widget exists
            const existing = activeDashboard?.widgets.find(
              (w) => w.type === 'workSymbols'
            );
            if (existing) {
              updateWidget(existing.id, {
                config: {
                  ...existing.config,
                  voiceLevel: level,
                } as WorkSymbolsConfig,
              });
            } else {
              const defaults = WIDGET_DEFAULTS['workSymbols']
                .config as WorkSymbolsConfig;
              addWidget('workSymbols', {
                config: { ...defaults, voiceLevel: level } as WorkSymbolsConfig,
              });
            }
          },
          keywords: ['voice', 'level', 'quiet'],
        });
      }
    }

    // Mute Sound
    if (
      normalizedQuery.includes('mute') ||
      normalizedQuery.includes('silence')
    ) {
      results.push({
        id: 'smart-mute',
        label: 'Mute Noise Meter',
        subLabel: 'System Action',
        icon: MicOff,
        category: 'system',
        action: () => {
          const soundWidgets = activeDashboard?.widgets.filter(
            (w) => w.type === 'sound'
          );
          if (soundWidgets && soundWidgets.length > 0) {
            soundWidgets.forEach((w) => {
              // Toggle sensitivity to 0 effectively mutes visual feedback or we could implement a real mute
              // For now, let's just set sensitivity low
              updateWidget(w.id, {
                config: { ...w.config, sensitivity: 0 } as SoundConfig,
              });
            });
          }
        },
        keywords: ['mute', 'sound'],
      });
    }

    // 2. WIDGET SEARCH
    TOOLS.forEach((tool) => {
      if (
        tool.label.toLowerCase().includes(normalizedQuery) ||
        tool.type.toLowerCase().includes(normalizedQuery)
      ) {
        results.push({
          id: `widget-${tool.type}`,
          label: tool.label,
          subLabel: 'Launch Widget',
          icon: tool.icon,
          category: 'widget',
          action: () => addWidget(tool.type),
          keywords: [tool.label.toLowerCase()],
        });
      }
    });

    // 3. DASHBOARD SEARCH
    dashboards.forEach((db) => {
      if (db.name.toLowerCase().includes(normalizedQuery)) {
        results.push({
          id: `db-${db.id}`,
          label: db.name,
          subLabel: 'Switch Board',
          icon: Layout,
          category: 'dashboard',
          action: () => loadDashboard(db.id),
          keywords: [db.name.toLowerCase()],
        });
      }
    });

    return results;
  }, [
    query,
    addWidget,
    activeDashboard,
    dashboards,
    loadDashboard,
    updateWidget,
    clearAllWidgets,
    startTimer,
  ]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => Math.min(prev + 1, commands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (commands[selectedIndex]) {
          commands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, commands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200" />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 slide-in-from-top-4 duration-200 flex flex-col">
        {/* Input Area */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-lg outline-none text-slate-700 placeholder:text-slate-300 bg-transparent font-medium"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex gap-1">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 rounded border border-slate-200">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 space-y-1"
        >
          {commands.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No results found.
            </div>
          ) : (
            commands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group ${
                  index === selectedIndex
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    index === selectedIndex
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <cmd.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{cmd.label}</div>
                  {cmd.subLabel && (
                    <div
                      className={`text-xs ${
                        index === selectedIndex
                          ? 'text-indigo-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {cmd.subLabel}
                    </div>
                  )}
                </div>
                {cmd.category === 'smart' && (
                  <Zap
                    size={14}
                    className={`${
                      index === selectedIndex
                        ? 'text-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                )}
                {index === selectedIndex && (
                  <ArrowRight size={16} className="text-indigo-400 mr-2" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <Command size={10} /> + K
            </span>
            <span>to open</span>
          </div>
          <div className="flex gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
