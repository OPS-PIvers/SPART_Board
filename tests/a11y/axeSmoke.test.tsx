import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('jest-axe harness', () => {
  it('reports no violations for a labelled button', async () => {
    const { container } = render(<button type="button">Save</button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
