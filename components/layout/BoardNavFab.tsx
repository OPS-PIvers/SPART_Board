import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MoreVertical, Star } from 'lucide-react';
import { useDashboard } from '@/context/useDashboard';
import { useClickOutside } from '@/hooks/useClickOutside';

const FAB_BASE =
  'w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/60 hover:text-white/90 flex items-center justify-center transition-colors backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-primary disabled:opacity-40 disabled:cursor-not-allowed';

export const BoardNavFab: React.FC = () => {
  const { t } = useTranslation();
  const { dashboards, activeDashboard, loadDashboard } = useDashboard();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = useMemo(() => {
    if (!activeDashboard) return -1;
    return dashboards.findIndex((d) => d.id === activeDashboard.id);
  }, [dashboards, activeDashboard]);

  useClickOutside(containerRef, () => setIsPickerOpen(false));

  useEffect(() => {
    if (!isPickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPickerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPickerOpen]);

  if (dashboards.length <= 1) return null;

  const goPrev = () => {
    if (currentIndex < 0) return;
    const next = (currentIndex - 1 + dashboards.length) % dashboards.length;
    loadDashboard(dashboards[next].id);
  };

  const goNext = () => {
    if (currentIndex < 0) return;
    const next = (currentIndex + 1) % dashboards.length;
    loadDashboard(dashboards[next].id);
  };

  const activeName = activeDashboard?.name ?? '';

  return (
    <div
      ref={containerRef}
      data-screenshot="exclude"
      className="fixed bottom-6 left-4 z-dock"
    >
      {isPickerOpen && (
        <div
          role="listbox"
          aria-label={t('boardNav.boardList', { defaultValue: 'All boards' })}
          className="absolute bottom-full left-0 mb-2 w-64 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/20 bg-slate-900/80 backdrop-blur-xl shadow-2xl py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="px-3 py-1.5 text-xxs font-bold uppercase tracking-wider text-white/40">
            {t('boardNav.boardList', { defaultValue: 'All boards' })}
          </div>
          {dashboards.map((db) => {
            const isActive = activeDashboard?.id === db.id;
            return (
              <button
                key={db.id}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  loadDashboard(db.id);
                  setIsPickerOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-blue-primary text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {db.isDefault && (
                  <Star
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isActive
                        ? 'fill-white text-white'
                        : 'fill-amber-400 text-amber-400'
                    }`}
                  />
                )}
                <span className="truncate">{db.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={goPrev}
          aria-label={t('boardNav.previous', {
            defaultValue: 'Previous board',
          })}
          title={t('boardNav.previous', { defaultValue: 'Previous board' })}
          className={FAB_BASE}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsPickerOpen((v) => !v)}
          aria-label={t('boardNav.selectBoard', {
            defaultValue: 'Select board',
          })}
          aria-haspopup="listbox"
          aria-expanded={isPickerOpen}
          title={activeName}
          className={FAB_BASE}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label={t('boardNav.next', { defaultValue: 'Next board' })}
          title={t('boardNav.next', { defaultValue: 'Next board' })}
          className={FAB_BASE}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
