import { describe, expect, it } from 'vitest';
import type { WidgetType } from '@/types';
import { WIDGET_SETTINGS_SCHEMAS } from '@/components/widgets/WidgetRegistry';
import { validateSchema } from './validateSchema';

describe('WIDGET_SETTINGS_SCHEMAS', () => {
  it('every registered schema validates without errors', async () => {
    const entries = Object.entries(WIDGET_SETTINGS_SCHEMAS) as Array<
      [WidgetType, () => Promise<Parameters<typeof validateSchema>[1]>]
    >;
    for (const [type, load] of entries) {
      const schema = await load();
      expect(validateSchema(type, schema).errors, type).toEqual([]);
    }
  });
});
