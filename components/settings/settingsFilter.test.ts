import { describe, expect, it } from 'vitest';
import type { FieldCtx, WidgetSettingsSchema } from './schema/types';
import { widget } from './renderer/fields/testUtils';
import {
  buildSchemaSections,
  buildStyleSections,
  filterSections,
  hasMatches,
  matchesQuery,
  normalizeQuery,
} from './settingsFilter';

const resolve = (leaf: string) => leaf;

const ctx: FieldCtx = {
  config: {},
  widget,
  isAdmin: false,
  canAccessFeature: () => true,
  t: (key: string) => key,
};

const schema: WidgetSettingsSchema = {
  styleKeys: ['fontFamily', 'cardColor'],
  groups: [
    {
      id: 'content',
      fields: [
        { type: 'text', key: 'headline', label: 'Headline' },
        {
          type: 'text',
          key: 'secret',
          label: 'Secret setting',
          visibleWhen: () => false,
        },
      ],
    },
    {
      id: 'behavior',
      fields: [
        {
          type: 'select',
          key: 'mode',
          label: 'Mode',
          options: [{ value: 'a', label: 'Font of wisdom' }],
        },
      ],
    },
    {
      id: 'display',
      fields: [{ type: 'toggle', key: 'glow', label: 'Glow' }],
    },
  ],
};

describe('normalizeQuery / matchesQuery', () => {
  it('is case- and whitespace-insensitive', () => {
    expect(normalizeQuery('  FoNt ')).toBe('font');
    expect(matchesQuery('Card color', 'CARD')).toBe(true);
    expect(matchesQuery('Card color', 'nope')).toBe(false);
  });

  it('treats an empty query as matching everything', () => {
    expect(matchesQuery('anything', '   ')).toBe(true);
  });
});

describe('buildSchemaSections', () => {
  it('indexes visible fields in D8 order', () => {
    const sections = buildSchemaSections(schema, ctx, resolve);
    expect(sections.map((s) => s.id)).toEqual(['content', 'behavior']);
    expect(sections[0].fields.map((f) => f.label)).toEqual(['Headline']);
  });

  it('indexes nothing for a legacy widget', () => {
    expect(buildSchemaSections(null, ctx, resolve)).toEqual([]);
    expect(buildSchemaSections(undefined, ctx, resolve)).toEqual([]);
  });
});

describe('buildStyleSections', () => {
  it('emits the display group, the Content tier from styleKeys, then the atomic Window tier', () => {
    const sections = buildStyleSections(schema, ctx, resolve);
    expect(sections.map((s) => s.id)).toEqual(['display', 'style', 'window']);
    expect(sections[0].fields.map((f) => f.key)).toEqual(['glow']);
    expect(sections[1].fields.map((f) => f.key)).toEqual([
      'fontFamily',
      'cardColor',
    ]);
    expect(sections[2].atomic).toBe(true);
    expect(sections[2].fields).toHaveLength(4);
  });

  it('still emits the Window tier for a legacy widget', () => {
    const sections = buildStyleSections(null, ctx, resolve);
    expect(sections.map((s) => s.id)).toEqual(['window']);
  });
});

describe('filterSections', () => {
  const all = [
    ...buildSchemaSections(schema, ctx, resolve),
    ...buildStyleSections(schema, ctx, resolve),
  ];

  it('matches across both tabs at once', () => {
    const result = filterSections(all, 'font');
    expect(result.map((s) => s.id)).toEqual(['style', 'window']);
    expect(result[0].fields.map((f) => f.key)).toEqual(['fontFamily']);
  });

  it('renders the whole Window tier on a Window match', () => {
    const result = filterSections(all, 'windowTransparency');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('window');
    expect(result[0].fields).toHaveLength(4);
  });

  it('does not match fields hidden by visibleWhen', () => {
    expect(hasMatches(filterSections(all, 'Secret'))).toBe(false);
  });

  it('does not index select option labels', () => {
    const result = filterSections(all, 'wisdom');
    expect(hasMatches(result)).toBe(false);
  });

  it('returns everything for an empty query', () => {
    expect(filterSections(all, '')).toEqual(all);
  });
});
