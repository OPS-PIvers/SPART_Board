import React from 'react';
import { Type, Palette } from 'lucide-react';
import { SettingsLabel } from './SettingsLabel';
import { FONTS, FONT_COLORS } from '../../config/fonts';
import { WidgetConfig, WidgetData } from '../../types';

interface TypographySettingsProps<T extends WidgetConfig> {
  widgetId: string;
  config: T;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
}

export const TypographySettings = <
  T extends WidgetConfig & { fontFamily?: string; fontColor?: string },
>({
  widgetId,
  config,
  updateWidget,
}: TypographySettingsProps<T>) => {
  const { fontFamily = 'global', fontColor = '#334155' } = config;

  return (
    <>
      {/* Typography */}
      <div>
        <SettingsLabel icon={Type}>Typography</SettingsLabel>
        <div className="grid grid-cols-4 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                updateWidget(widgetId, {
                  config: { ...config, fontFamily: f.id } as unknown as WidgetConfig,
                })
              }
              className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                fontFamily === f.id || (!fontFamily && f.id === 'global')
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <span className={`text-sm ${f.id} text-slate-900`}>{f.icon}</span>
              <span className="text-xxxs uppercase text-slate-600 font-bold">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Color */}
      <div>
        <SettingsLabel icon={Palette}>Font Color</SettingsLabel>
        <div className="flex flex-wrap gap-2 px-1">
          {FONT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() =>
                updateWidget(widgetId, {
                  config: { ...config, fontColor: color } as unknown as WidgetConfig,
                })
              }
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                fontColor === color
                  ? 'border-slate-800 scale-110 shadow-sm'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </>
  );
};
