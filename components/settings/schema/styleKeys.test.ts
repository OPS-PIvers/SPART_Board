import { describe, expect, it } from 'vitest';
import { resolveStyleFields } from './styleKeys';

describe('resolveStyleFields', () => {
  it('renders exactly one opacity control for cardColor + cardOpacity', () => {
    const fields = resolveStyleFields(['cardColor', 'cardOpacity']);
    const opacityFields = fields.filter(
      (field) => field.key === 'cardOpacity' || field.type === 'slider'
    );
    expect(opacityFields).toHaveLength(0);
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe('cardColor');
    expect(fields[0]).toMatchObject({ opacityKey: 'cardOpacity' });
  });
});
