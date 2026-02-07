import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ScaledEmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * A container-query-scaled empty state for widgets.
 *
 * All sizing uses `cqmin` (the smaller of container width/height)
 * so the content automatically scales when the widget is resized.
 *
 * Usage:
 *   <ScaledEmptyState icon={Clock} title="No Schedule" subtitle="Flip to add items." />
 */
export const ScaledEmptyState: React.FC<ScaledEmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full w-full text-center select-none gap-[2cqmin] p-[4cqmin] ${className}`}
    >
      <div
        className="text-slate-300"
        style={{
          width: 'min(48px, 15cqmin)',
          height: 'min(48px, 15cqmin)',
        }}
      >
        <Icon style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="space-y-[0.5cqmin]">
        <p
          className="font-black uppercase tracking-widest text-slate-500"
          style={{ fontSize: 'min(14px, 4cqmin)' }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-slate-400 leading-tight"
            style={{ fontSize: 'min(12px, 3cqmin)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
};
