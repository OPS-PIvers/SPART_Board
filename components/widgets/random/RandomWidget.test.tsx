import { render, screen, fireEvent } from '@testing-library/react';
import { RandomWidget } from './RandomWidget';
import { useDashboard } from '../../../context/useDashboard';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WidgetData, RandomConfig } from '../../../types';

// Mock useDashboard
vi.mock('../../../context/useDashboard');

const mockUpdateWidget = vi.fn();
const mockAddWidget = vi.fn();
const mockAddToast = vi.fn();

const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
  addWidget: mockAddWidget,
  addToast: mockAddToast,
  rosters: [],
  activeRosterId: null,
  activeDashboard: {
    widgets: [],
  },
};

describe('RandomWidget (Nexus)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
    // Mock crypto.randomUUID
    global.crypto.randomUUID = vi.fn(
      () => 'test-uuid'
    ) as unknown as () => `${string}-${string}-${string}-${string}-${string}`;
  });

  it('renders "Create Scoreboard" button when in groups mode with results', () => {
    const widget: WidgetData = {
      id: 'random-1',
      type: 'random',
      x: 0,
      y: 0,
      w: 400,
      h: 400,
      z: 1,
      flipped: false,
      config: {
        mode: 'groups',
        firstNames: 'Alice\nCharlie',
        lastNames: 'Bob\nDave',
        // Simulate existing group result
        lastResult: [{ names: ['Alice Bob'] }, { names: ['Charlie Dave'] }],
      } as RandomConfig,
    };

    render(<RandomWidget widget={widget} />);

    expect(screen.getByText('Create Scoreboard')).toBeInTheDocument();
  });

  it('does NOT render "Create Scoreboard" button when in single mode', () => {
    const widget: WidgetData = {
      id: 'random-1',
      type: 'random',
      x: 0,
      y: 0,
      w: 400,
      h: 400,
      z: 1,
      flipped: false,
      config: {
        mode: 'single',
        lastResult: 'Alice',
      } as RandomConfig,
    };

    render(<RandomWidget widget={widget} />);

    expect(screen.queryByText('Create Scoreboard')).not.toBeInTheDocument();
  });

  it('calls addWidget with correct config when "Create Scoreboard" is clicked', () => {
    const widget: WidgetData = {
      id: 'random-1',
      type: 'random',
      x: 100,
      y: 100,
      w: 400,
      h: 400,
      z: 1,
      flipped: false,
      config: {
        mode: 'groups',
        firstNames: 'Alice\nCharlie',
        lastNames: 'Bob\nDave',
        lastResult: [{ names: ['Alice Bob'] }, { names: ['Charlie Dave'] }],
      } as RandomConfig,
    };

    render(<RandomWidget widget={widget} />);

    const button = screen.getByText('Create Scoreboard');
    fireEvent.click(button);

    expect(mockAddWidget).toHaveBeenCalledWith(
      'scoreboard',
      expect.objectContaining({
        x: widget.x + widget.w + 20,
        y: widget.y,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          teams: expect.arrayContaining([
            expect.objectContaining({
              name: 'Group 1',
              score: 0,
            }),
            expect.objectContaining({
              name: 'Group 2',
              score: 0,
            }),
          ]),
        }),
      })
    );

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Scoreboard Created'),
      'success'
    );
  });
});
