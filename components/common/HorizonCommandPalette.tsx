import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { TOOLS } from '../../config/tools';
import { GlassCard } from './GlassCard';
import {
  Search,
  Command,
  Layout,
  Maximize,
  Minimize,
  Trash2,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';
import { WidgetType } from '../../types';

interface SearchResult {
  id: string;
  type: 'widget' | 'dashboard' | 'action';
  label: string;
  subLabel?: string;
  icon: React.ElementType;
  action: () => void;
  score: number;
}

export const HorizonCommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    dashboards,
    loadDashboard,
    addWidget,
    clearAllWidgets,
    activeDashboard,
  } = useDashboard();

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure DOM is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      if (document.exitFullscreen) {
        void document.exitFullscreen();
      }
    }
  };

  // Search Logic
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) {
      // Zero State: Show "Smart Suggestions"
      // 1. Common Widgets
      const commonWidgets: SearchResult[] = [
        'time-tool',
        'text',
        'drawing',
      ].map((type) => {
        const tool = TOOLS.find((t) => t.type === type);
        return {
          id: `suggest-${type}`,
          type: 'widget',
          label: tool?.label ?? type,
          subLabel: 'Quick Launch',
          icon: tool?.icon ?? LayoutGrid,
          action: () => addWidget(type as WidgetType),
          score: 100,
        };
      });

      // 2. Recent Boards (excluding current)
      const recentBoards: SearchResult[] = dashboards
        .filter((d) => d.id !== activeDashboard?.id)
        .slice(0, 2)
        .map((d) => ({
          id: `suggest-board-${d.id}`,
          type: 'dashboard',
          label: d.name,
          subLabel: 'Switch Board',
          icon: Layout,
          action: () => loadDashboard(d.id),
          score: 90,
        }));

      return [...commonWidgets, ...recentBoards];
    }

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // 1. Widgets
    TOOLS.forEach((tool) => {
      if (
        tool.label.toLowerCase().includes(q) ||
        tool.type.toLowerCase().includes(q)
      ) {
        matches.push({
          id: `widget-${tool.type}`,
          type: 'widget',
          label: tool.label,
          subLabel: 'Add Widget',
          icon: tool.icon,
          action: () => addWidget(tool.type),
          score: tool.label.toLowerCase().startsWith(q) ? 10 : 5,
        });
      }
    });

    // 2. Dashboards
    dashboards.forEach((d) => {
      if (d.name.toLowerCase().includes(q)) {
        matches.push({
          id: `board-${d.id}`,
          type: 'dashboard',
          label: d.name,
          subLabel: 'Switch Board',
          icon: Layout,
          action: () => loadDashboard(d.id),
          score: d.name.toLowerCase().startsWith(q) ? 9 : 4,
        });
      }
    });

    // 3. Actions
    if ('clear board'.includes(q)) {
      matches.push({
        id: 'action-clear',
        type: 'action',
        label: 'Clear Board',
        subLabel: 'Remove all widgets',
        icon: Trash2,
        action: () => {
          if (confirm('Clear all widgets?')) clearAllWidgets();
        },
        score: 3,
      });
    }
    if ('fullscreen'.includes(q)) {
      matches.push({
        id: 'action-fullscreen',
        type: 'action',
        label: 'Toggle Fullscreen',
        subLabel: 'View',
        icon: document.fullscreenElement ? Minimize : Maximize,
        action: toggleFullscreen,
        score: 3,
      });
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 8); // Limit to 8 results
  }, [
    query,
    dashboards,
    activeDashboard,
    addWidget,
    loadDashboard,
    clearAllWidgets,
  ]);

  // Handle Selection
  const executeResult = (result: SearchResult) => {
    result.action();
    setIsOpen(false);
  };

  // Keyboard Navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        executeResult(results[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] flex items-start justify-center pt-[20vh] bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="flex flex-col overflow-hidden shadow-2xl ring-1 ring-black/5">
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-slate-200/50 bg-white/50">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-lg text-slate-700 placeholder-slate-400 outline-none"
            />
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xxs font-bold text-slate-500 uppercase tracking-wider">
              <span className="text-xs">esc</span>
            </div>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="max-h-[300px] overflow-y-auto bg-white/80"
          >
            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Command className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No results found.</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => executeResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      index === selectedIndex
                        ? 'bg-brand-blue-primary text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        index === selectedIndex
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <result.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-sm leading-none mb-1">
                        {result.label}
                      </div>
                      <div
                        className={`text-xxs uppercase tracking-wider font-bold ${
                          index === selectedIndex
                            ? 'text-blue-100'
                            : 'text-slate-400'
                        }`}
                      >
                        {result.type} • {result.subLabel}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-white opacity-50" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xxs text-slate-400">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-white border border-slate-200 rounded px-1 min-w-[16px] text-center font-sans">
                  ↑↓
                </kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white border border-slate-200 rounded px-1 min-w-[16px] text-center font-sans">
                  ↵
                </kbd>
                to select
              </span>
            </div>
            <div className="font-bold uppercase tracking-widest text-slate-300">
              Horizon Palette
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Click backdrop to close */}
      <div
        className="absolute inset-0 z-[-1]"
        onClick={() => setIsOpen(false)}
      />
    </div>
  );
};
