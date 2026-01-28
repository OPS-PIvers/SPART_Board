import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { TimeToolVisual } from '../../../components/widgets/TimeToolVisual';

describe('TimeToolVisual', () => {
  it('renders correctly', () => {
    render(<TimeToolVisual progress={0.5} color="#000000" />);
    const svg = screen.getByRole('timer-visual');
    expect(svg).toBeInTheDocument();
  });

  it('calculates strokeDashoffset correctly for 100% progress', () => {
    // For 100%, offset should be 0 (Full circle)
    // We use a more specific selector or index if role isn't enough, but querying circles works for now
    // Note: React testing library renders into a container, so document.querySelectorAll searches the whole document which might be risky if tests run in parallel sharing DOM, but vitest usually isolates or cleans up.
    // Better: use container from render.

    const { container } = render(
      <TimeToolVisual progress={1} color="#000000" />
    );
    const circles = container.querySelectorAll('circle');
    // Second circle is the progress one
    const progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');
  });

  it('calculates strokeDashoffset correctly for 0% progress', () => {
    const { container } = render(
      <TimeToolVisual progress={0} color="#000000" />
    );
    // For 0%, offset should be Circumference (Empty circle)
    // Circumference = 2 * PI * 95 approx 596.9026
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const offset = parseFloat(
      progressCircle.getAttribute('stroke-dashoffset') ?? '0'
    );
    expect(offset).toBeCloseTo(596.9026, 3);
  });

  it('calculates strokeDashoffset correctly for 50% progress', () => {
    const { container } = render(
      <TimeToolVisual progress={0.5} color="#000000" />
    );
    // For 50%, offset should be Circumference * 0.5
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const offset = parseFloat(
      progressCircle.getAttribute('stroke-dashoffset') ?? '0'
    );
    expect(offset).toBeCloseTo(596.9026 * 0.5, 3);
  });

  it('applies the correct color', () => {
    const color = '#123456';
    const { container } = render(
      <TimeToolVisual progress={0.5} color={color} />
    );
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', color);
  });
});
