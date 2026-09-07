import { describe, expect, it } from 'vitest';
import { validateSchema } from '@/components/settings/schema/validateSchema';
import { WIDGET_DEFAULTS } from '@/config/widgetDefaults';
import {
  WIDGET_CONFIG_MIGRATIONS,
  migrateWidget,
  targetConfigVersion,
} from '@/utils/migration';
import { mergeWidgetConfig } from '@/utils/widgetConfigPersistence';
import type { LunchCountConfig, WidgetData } from '@/types';
import schema from './settings.schema';

describe('lunchCount settings schema', () => {
  it('has no validation errors', () => {
    const result = validateSchema('lunchCount', schema);
    expect(result.errors).toEqual([]);
  });

  it('has no missing-default warnings (every non-custom field defaults in WIDGET_DEFAULTS)', () => {
    const result = validateSchema('lunchCount', schema);
    expect(result.warnings).toEqual([]);
  });

  it('declares only the appearance keys the front face reads', () => {
    expect(schema.styleKeys).toEqual([
      'fontFamily',
      'fontColor',
      'cardColor',
      'cardOpacity',
    ]);
  });

  it('has no configVersion bump (no key renames in this migration)', () => {
    expect(targetConfigVersion('lunchCount')).toBe(0);
    expect(WIDGET_CONFIG_MIGRATIONS.lunchCount ?? []).toEqual([]);
  });

  it('shows one grade-level segmented per site and none collide when visible', () => {
    const gradeFields = schema.groups
      .flatMap((g) => g.fields)
      .filter((f) => f.key === 'gradeLevel');
    expect(gradeFields).toHaveLength(4);
  });
});

describe('lunchCount config migration', () => {
  // Pre-migration fixture from docs/plans/widget-settings-inventory.md ("## lunchCount").
  const fixture: WidgetData = {
    id: 'w1',
    type: 'lunchCount',
    x: 0,
    y: 0,
    w: 600,
    h: 400,
    z: 1,
    flipped: false,
    config: {
      schoolSite: 'schumann-elementary',
      isManualMode: false,
      manualHotLunch: '',
      manualBentoBox: '',
      roster: [],
      assignments: {},
      recipient: '',
      rosterMode: 'class',
      lunchTimeHour: '11',
      lunchTimeMinute: '30',
      gradeLevel: '3',
      cardColor: '#ffffff',
      cardOpacity: 1,
    } as unknown as LunchCountConfig,
  };

  it('is a no-op besides stamping configVersion', () => {
    const migrated = migrateWidget(fixture);
    expect(migrated.config).toEqual(fixture.config);
    expect(migrated.configVersion).toBe(0);
  });

  it('is idempotent', () => {
    const once = migrateWidget(fixture);
    const twice = migrateWidget(once);
    expect(twice).toEqual(once);
  });

  it('loses no key the front face reads on a mergeWidgetConfig + migrateWidget round trip', () => {
    const defaults = WIDGET_DEFAULTS.lunchCount
      .config as Partial<LunchCountConfig>;
    const merged = mergeWidgetConfig(defaults, undefined, undefined, {
      schoolSite: 'orono-high-school',
      isManualMode: true,
      manualHotLunch: 'Pizza',
      manualBentoBox: 'Turkey Wrap',
      roster: ['Alex', 'Sam'],
      assignments: { Alex: 'hot' },
      rosterMode: 'custom',
      lunchTimeHour: '12',
      lunchTimeMinute: '05',
      gradeLevel: '9',
      cardColor: '#f8fafc',
      cardOpacity: 0.5,
      cachedMenu: null,
    } as Partial<LunchCountConfig>);
    const migrated = migrateWidget({ ...fixture, config: merged });

    const frontFaceReadKeys: (keyof LunchCountConfig)[] = [
      'schoolSite',
      'isManualMode',
      'manualHotLunch',
      'manualBentoBox',
      'roster',
      'assignments',
      'rosterMode',
      'lunchTimeHour',
      'lunchTimeMinute',
      'gradeLevel',
      'cardColor',
      'cardOpacity',
      'cachedMenu',
    ];
    for (const key of frontFaceReadKeys) {
      expect((migrated.config as LunchCountConfig)[key]).toEqual(
        (merged as LunchCountConfig)[key]
      );
    }
  });
});
