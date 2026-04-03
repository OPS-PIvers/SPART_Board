import React from 'react';
import { Type } from 'lucide-react';
import { WidgetConfig } from '@/types';
import { SettingsLabel } from './SettingsLabel';
import {
  TEXT_SIZE_PRESETS,
  TextSizePreset,
  resolveTextPresetMultiplier,
  presetFromScale,
} from '@/config/widgetAppearance';

interface TextSizePresetSettingsProps<T extends WidgetConfig> {
  config: T;
  updateConfig: (updates: Partial<T>) => void;
  fallbackScale?: number;
}

export const TextSizePresetSettings = <
  T extends WidgetConfig & {
    textSizePreset?: TextSizePreset;
    scaleMultiplier?: number;
  },
>({
  config,
  updateConfig,
  fallbackScale = 1,
}: TextSizePresetSettingsProps<T>) => {
  const selectedPreset =
    config.textSizePreset ??
    presetFromScale(
      config.scaleMultiplier ??
        resolveTextPresetMultiplier(undefined, fallbackScale)
    );

  return (
    <div>
      <SettingsLabel icon={Type}>Text Size</SettingsLabel>
      <div className="grid grid-cols-2 gap-2">
        {TEXT_SIZE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() =>
              updateConfig({
                textSizePreset: preset.id,
                scaleMultiplier: preset.multiplier,
              } as Partial<T>)
            }
            className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wide ${
              selectedPreset === preset.id
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};
