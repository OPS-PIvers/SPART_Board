import React from 'react';
import { BookOpen, Activity, Archive as ArchiveIcon } from 'lucide-react';
import type {
  LibraryShellProps,
  LibraryTab,
  LibraryPrimaryAction,
} from './types';

interface TabDef {
  key: LibraryTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  count: number | undefined;
}

const renderActionButton = (
  action: LibraryPrimaryAction,
  variant: 'primary' | 'secondary',
  key?: string
): React.ReactElement => {
  const Icon = action.icon;
  const base =
    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass =
    variant === 'primary'
      ? 'bg-brand-blue-primary hover:bg-brand-blue-dark text-white'
      : 'bg-white hover:bg-brand-blue-lighter/40 text-brand-blue-primary border border-brand-blue-primary/20';
  return (
    <button
      key={key}
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      title={action.disabled ? action.disabledReason : undefined}
      className={`${base} ${variantClass}`}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <span className="truncate">{action.label}</span>
    </button>
  );
};

export const LibraryShell: React.FC<LibraryShellProps> = ({
  widgetLabel,
  tab,
  onTabChange,
  counts,
  primaryAction,
  secondaryActions,
  toolbarSlot,
  filterSidebarSlot,
  children,
}) => {
  const tabs: TabDef[] = [
    {
      key: 'library',
      label: 'Library',
      icon: BookOpen,
      count: counts?.library,
    },
    {
      key: 'active',
      label: 'In Progress',
      icon: Activity,
      count: counts?.active,
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: ArchiveIcon,
      count: counts?.archive,
    },
  ];

  return (
    <section
      className="flex flex-col h-full min-h-0 bg-slate-50 text-slate-800 rounded-2xl overflow-hidden"
      aria-label={`${widgetLabel} library`}
    >
      <header className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="min-w-0">
          <h2 className="font-black text-lg text-slate-800 truncate">
            {widgetLabel} Library
          </h2>
        </div>
        {(primaryAction != null ||
          (secondaryActions != null && secondaryActions.length > 0)) && (
          <div className="flex items-center gap-2 shrink-0">
            {secondaryActions?.map((action, i) =>
              renderActionButton(action, 'secondary', `secondary-${i}`)
            )}
            {primaryAction && renderActionButton(primaryAction, 'primary')}
          </div>
        )}
      </header>

      <nav
        role="tablist"
        aria-label={`${widgetLabel} library tabs`}
        className="flex items-end gap-1 px-6 pt-3 bg-white border-b border-slate-200 shrink-0"
      >
        {tabs.map(({ key, label, icon: Icon, count }) => {
          const selected = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(key)}
              className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-black uppercase tracking-widest transition-colors ${
                selected
                  ? 'bg-slate-50 text-brand-blue-primary border-x border-t border-slate-200'
                  : 'text-slate-400 hover:text-brand-blue-primary hover:bg-slate-100/60'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span>{label}</span>
              {count != null && count > 0 && (
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${
                    selected
                      ? 'bg-brand-blue-primary text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {toolbarSlot && (
        <div className="px-6 py-3 bg-white border-b border-slate-200 shrink-0">
          {toolbarSlot}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {filterSidebarSlot && (
          <aside className="w-60 shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
            {filterSidebarSlot}
          </aside>
        )}
        <div
          role="tabpanel"
          aria-label={`${widgetLabel} ${tab} tab content`}
          className="flex-1 min-w-0 overflow-y-auto px-6 py-5"
        >
          {children}
        </div>
      </div>
    </section>
  );
};
