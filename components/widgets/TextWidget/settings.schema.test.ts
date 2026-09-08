import { describe, expect, it } from 'vitest';
import { validateSchema } from '@/components/settings/schema/validateSchema';
import schema from './settings.schema';

describe('text settings schema', () => {
  it('validates with no errors or warnings', () => {
    const result = validateSchema('text', schema);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
