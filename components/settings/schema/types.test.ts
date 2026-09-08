import { describe, expect, it } from 'vitest';
import type { WidgetSettingsSchema } from './types';

describe('AppearanceKey', () => {
  it('rejects a misspelled styleKeys entry at compile time', () => {
    const schema: WidgetSettingsSchema = {
      groups: [],
      // @ts-expect-error "fontFamilly" is not a valid AppearanceKey
      styleKeys: ['fontFamilly'],
    };
    expect(schema.styleKeys).toEqual(['fontFamilly']);
  });
});
