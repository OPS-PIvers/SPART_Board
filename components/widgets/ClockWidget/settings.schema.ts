import React from 'react';
import type { ClockConfig } from '@/types';
import { STANDARD_COLORS } from '@/config/colors';
import i18n from '@/i18n';
import { AccentColorSettings } from '@/components/common/AccentColorSettings';
import { defineSettings } from '@/components/settings/schema/defineSettings';
import { resolveLabel } from '@/components/settings/renderer/resolveLabel';
import type {
  FieldCtx,
  UpdateConfig,
} from '@/components/settings/schema/types';

// dateColor's legacy fallback is dynamic ("Match Time" = follow the current
// themeColor), which the shared AccentColor field can't express: its clear
// swatch always writes undefined but shows a fixed fallback color + a fixed
// "Match" label, not the widget's actual current themeColor.
// schema-gap: accentColorNullable
const ClockDateColorField: React.FC<{
  ctx: FieldCtx;
  updateConfig: UpdateConfig;
}> = ({ ctx, updateConfig }) => {
  const dateColor =
    typeof ctx.config.dateColor === 'string' ? ctx.config.dateColor : undefined;
  const themeColor =
    typeof ctx.config.themeColor === 'string'
      ? ctx.config.themeColor
      : STANDARD_COLORS.slate;
  return React.createElement(AccentColorSettings, {
    hideLabel: true,
    label: resolveLabel(ctx.t, 'clock', 'dateColor'),
    value: dateColor,
    fallback: themeColor,
    fallbackLabel: resolveLabel(ctx.t, 'clock', 'matchTime'),
    onChange: (color: string | undefined) => updateConfig({ dateColor: color }),
  });
};

const renderDateColorField = (
  ctx: FieldCtx & { updateConfig: UpdateConfig }
): React.ReactNode => {
  const { updateConfig, ...rest } = ctx;
  return React.createElement(ClockDateColorField, {
    ctx: rest,
    updateConfig,
  });
};

export default defineSettings<ClockConfig>({
  groups: [
    {
      id: 'behavior',
      fields: [
        { key: 'format24', type: 'toggle', label: 'format24' },
        { key: 'showSeconds', type: 'toggle', label: 'showSeconds' },
      ],
    },
    {
      id: 'display',
      fields: [
        {
          key: 'clockStyle',
          type: 'segmented',
          label: 'clockStyle',
          options: [
            {
              value: 'modern',
              label: i18n.t('widgetSettings.clock.styles.modern'),
            },
            { value: 'lcd', label: i18n.t('widgetSettings.clock.styles.lcd') },
            {
              value: 'minimal',
              label: i18n.t('widgetSettings.clock.styles.minimal'),
            },
          ],
        },
        { key: 'glow', type: 'toggle', label: 'glow' },
        { key: 'themeColor', type: 'accentColor', label: 'themeColor' },
        {
          key: 'dateColor',
          type: 'custom',
          label: 'dateColor',
          render: renderDateColorField,
        },
      ],
    },
  ],
  styleKeys: ['fontFamily'],
});
