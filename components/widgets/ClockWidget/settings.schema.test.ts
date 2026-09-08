import { describe, expect, it } from 'vitest';
import { validateSchema } from '@/components/settings/schema/validateSchema';
import { WIDGET_DEFAULTS } from '@/config/widgetDefaults';
import { STANDARD_COLORS } from '@/config/colors';
import schema from './settings.schema';

describe('clock settings schema', () => {
  it('validates with no errors', () => {
    expect(validateSchema('clock', schema).errors).toEqual([]);
  });

  it('has no default-coverage warnings (every schema key already has a WIDGET_DEFAULTS entry)', () => {
    expect(validateSchema('clock', schema).warnings).toEqual([]);
  });

  it('declares fontFamily as its only Content-tier style key', () => {
    expect(schema.styleKeys).toEqual(['fontFamily']);
  });

  // No key required backfilling: every field's front-face fallback already matches
  // WIDGET_DEFAULTS.clock.config, so this test asserts that equality directly rather
  // than a backfill (plan §4.2, §7 item 1).
  it('front-face fallbacks match WIDGET_DEFAULTS.clock.config', () => {
    const defaults = WIDGET_DEFAULTS.clock.config as Record<string, unknown>;
    expect(defaults.format24).toBe(true); // Widget.tsx: format24 = true
    expect(defaults.showSeconds).toBe(true); // Widget.tsx: showSeconds = true
    expect(defaults.clockStyle).toBe('modern'); // Widget.tsx: clockStyle = 'modern'
    expect(defaults.glow).toBe(false); // Widget.tsx: glow = false
    expect(defaults.themeColor).toBe(STANDARD_COLORS.slate); // Widget.tsx: themeColor = STANDARD_COLORS.slate
    expect(defaults.fontFamily).toBe('global'); // Widget.tsx: fontFamily = 'global'
  });
});
