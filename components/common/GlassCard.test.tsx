import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('does not forward allowInvisible to the DOM', () => {
    const { container } = render(
      <GlassCard allowInvisible={true}>Content</GlassCard>
    );

    const card = container.firstElementChild;
    expect(card).not.toBeNull();
    expect(card?.getAttribute('allowInvisible')).toBeNull();
  });
});
