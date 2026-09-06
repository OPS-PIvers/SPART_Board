import React from 'react';
import type { GlobalStyle, WidgetData } from '@/types';
import { UniversalStyleSettings } from '@/components/common/UniversalStyleSettings';
import type { TranslateFn } from './types';

/**
 * The four Window-tier labels the find-a-setting filter indexes (§3 item 2).
 * They are i18n leaves under `widgetSettings.common.*`, not schema fields.
 */
export const WINDOW_STYLE_LABELS = [
  'style.windowBackground',
  'style.windowTransparency',
  'style.windowFont',
  'style.windowTextSize',
] as const;

export type WindowStyleTierProps = {
  widget: WidgetData;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  globalStyle: GlobalStyle;
  t: TranslateFn;
};

/**
 * Window tier (D18): frame background, window font and window text size come
 * from `UniversalStyleSettings` — which already renders the one and only
 * background control (§3 item 4) — followed by transparency.
 */
export const WindowStyleTier: React.FC<WindowStyleTierProps> = ({
  widget,
  updateWidget,
  globalStyle,
  t,
}) => {
  const transparency = widget.transparency ?? globalStyle.windowTransparency;

  return (
    <div className="flex flex-col gap-4" data-window-tier="">
      <UniversalStyleSettings widget={widget} updateWidget={updateWidget} />

      <div className="flex flex-col gap-2 bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xxs font-bold text-slate-700 uppercase tracking-widest">
            {t('widgetSettings.common.style.windowTransparency')}{' '}
            {widget.transparency === undefined
              ? t('widgetSettings.common.style.globalSuffix')
              : ''}
          </span>
          {widget.transparency !== undefined && (
            <button
              type="button"
              onClick={() =>
                updateWidget(widget.id, { transparency: undefined })
              }
              className="text-xxs font-black text-brand-blue-primary hover:text-brand-blue-dark uppercase"
              aria-label={t('widgetSettings.common.style.resetTransparency')}
            >
              {t('widgetSettings.common.reset')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={transparency}
            onChange={(e) =>
              updateWidget(widget.id, {
                transparency: parseFloat(e.target.value),
              })
            }
            className="flex-1 accent-indigo-600 h-1.5"
            aria-label={t('widgetSettings.common.style.transparencyPercent')}
          />
          <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right">
            {Math.round(transparency * 100)}%
          </span>
        </div>
        {widget.backgroundColor && (
          <p className="text-xs text-slate-600 leading-snug">
            {t('widgetSettings.common.style.frameColorSolidHint')}
          </p>
        )}
      </div>
    </div>
  );
};
