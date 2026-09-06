import { describe, expect, it } from 'vitest';
import { defineSettings } from './defineSettings';
import { validateSchema, type LocaleCatalog } from './validateSchema';
import type { WidgetSettingsSchema } from './types';

const locale: LocaleCatalog = {
  widgetSettings: {
    common: { title: 'Title', titleHelp: 'Shown in the header' },
    clock: { showSeconds: 'Show seconds' },
  },
};

const base = { locale, defaults: { showSeconds: true } };

describe('validateSchema', () => {
  it('accepts a well-formed schema', () => {
    const schema: WidgetSettingsSchema = {
      groups: [
        {
          id: 'content',
          fields: [
            {
              type: 'text',
              key: 'showSeconds',
              label: 'title',
              help: 'titleHelp',
            },
          ],
        },
        {
          id: 'display',
          fields: [
            { type: 'toggle', key: 'showSeconds', label: 'showSeconds' },
          ],
        },
      ],
      styleKeys: ['fontFamily', 'cardColor'],
    };
    expect(validateSchema('clock', schema, base)).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it('rejects groups out of D8 order', () => {
    const result = validateSchema(
      'clock',
      {
        groups: [
          { id: 'display', fields: [] },
          { id: 'content', fields: [] },
        ],
      },
      base
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('out of D8 order');
  });

  it('rejects duplicate groups', () => {
    const result = validateSchema(
      'clock',
      {
        groups: [
          { id: 'content', fields: [] },
          { id: 'content', fields: [] },
        ],
      },
      base
    );
    expect(result.errors[0]).toContain('duplicate group');
  });

  it('rejects an unknown group id', () => {
    const result = validateSchema(
      'clock',
      {
        groups: [{ id: 'advanced', fields: [] }],
      } as unknown as WidgetSettingsSchema,
      base
    );
    expect(result.errors[0]).toContain('unknown group id');
  });

  it('rejects a dotted key', () => {
    const result = validateSchema(
      'clock',
      {
        groups: [
          {
            id: 'content',
            fields: [
              { type: 'text', key: 'a.b', label: 'title' },
            ] as unknown as WidgetSettingsSchema['groups'][number]['fields'],
          },
        ],
      },
      base
    );
    expect(result.errors[0]).toContain('is dotted');
  });

  it('rejects a styleKey outside APPEARANCE_CONFIG_KEYS', () => {
    const result = validateSchema(
      'clock',
      {
        groups: [],
        styleKeys: ['items'] as unknown as WidgetSettingsSchema['styleKeys'],
      },
      base
    );
    expect(result.errors[0]).toContain('not in APPEARANCE_CONFIG_KEYS');
  });

  it('rejects a label with no i18n key', () => {
    const result = validateSchema(
      'clock',
      {
        groups: [
          {
            id: 'content',
            fields: [{ type: 'toggle', key: 'showSeconds', label: 'nope' }],
          },
        ],
      },
      base
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('resolves to neither');
  });

  it('warns, not errors, when defaults lack a field key', () => {
    const result = validateSchema(
      'clock',
      {
        groups: [
          {
            id: 'content',
            fields: [
              { type: 'toggle', key: 'showSeconds', label: 'showSeconds' },
            ],
          },
        ],
      },
      { locale, defaults: {} }
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings[0]).toContain('no default for "showSeconds"');
  });

  it('allows Custom fields and skips their defaults check', () => {
    const result = validateSchema(
      'clock',
      {
        groups: [
          {
            id: 'behavior',
            fields: [
              {
                type: 'custom',
                key: 'showSeconds',
                label: 'title',
                render: () => null,
              },
            ],
          },
        ],
      },
      { locale, defaults: {} }
    );
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  it('defineSettings returns the schema unchanged', () => {
    const schema = defineSettings<{ showSeconds: boolean }>({
      groups: [
        {
          id: 'display',
          fields: [
            { type: 'toggle', key: 'showSeconds', label: 'showSeconds' },
          ],
        },
      ],
    });
    expect(validateSchema('clock', schema, base).errors).toEqual([]);
  });
});
