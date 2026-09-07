import { describe, expect, it } from 'vitest';
import { defineSettings } from './defineSettings';
import type { WidgetSettingsSchema } from './types';

type Config = { showSeconds: boolean; themeColor: string };

describe('defineSettings', () => {
  it('returns the erased schema so registries and drawers accept it without a cast', async () => {
    const erased: WidgetSettingsSchema = defineSettings<Config>({
      groups: [
        {
          id: 'display',
          fields: [
            { type: 'toggle', key: 'showSeconds', label: 'showSeconds' },
            { type: 'accentColor', key: 'themeColor', label: 'themeColor' },
          ],
        },
      ],
      styleKeys: ['fontFamily'],
    });
    const loader: () => Promise<WidgetSettingsSchema> = () =>
      Promise.resolve(erased);
    expect(erased.groups[0].fields.map((f) => f.key)).toEqual([
      'showSeconds',
      'themeColor',
    ]);
    await expect(loader()).resolves.toBe(erased);
  });

  it('rejects a key that is not on the config type at compile time', () => {
    const schema = defineSettings<Config>({
      groups: [
        {
          id: 'display',
          // @ts-expect-error "showSecond" is not a key of Config
          fields: [{ type: 'toggle', key: 'showSecond', label: 'showSeconds' }],
        },
      ],
    });
    expect(schema.groups).toHaveLength(1);
  });

  it('rejects a dotted key at compile time', () => {
    const schema = defineSettings<{ 'a.b': boolean }>({
      groups: [
        {
          id: 'display',
          // @ts-expect-error dotted keys are rejected by NoDots
          fields: [{ type: 'toggle', key: 'a.b', label: 'x' }],
        },
      ],
    });
    expect(schema.groups).toHaveLength(1);
  });
});
