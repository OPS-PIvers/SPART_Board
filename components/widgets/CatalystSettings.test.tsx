import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData } from '../../types';
import { CatalystSettings } from './CatalystSettings';

vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

const mockUpdateWidget = vi.fn();
const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
};

describe('CatalystSettings', () => {
  beforeEach(() => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  afterEach(() => {
    cleanup();
  });

  const createWidget = (): WidgetData => ({
    id: 'catalyst-1',
    type: 'catalyst',
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    z: 1,
    flipped: false,
    config: { activeCategory: null, activeStrategyId: null },
  });

  it('renders without crashing', () => {
    render(<CatalystSettings widget={createWidget()} />);
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Routines')).toBeInTheDocument();
  });
});
