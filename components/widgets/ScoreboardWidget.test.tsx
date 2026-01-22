import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreboardWidget, ScoreboardSettings } from './ScoreboardWidget';
import { useDashboard } from '../../context/useDashboard';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  WidgetData,
  ScoreboardConfig,
  RandomConfig,
  WidgetType,
} from '../../types';

vi.mock('../../context/useDashboard');

const mockUpdateWidget = vi.fn();
const mockAddToast = vi.fn();

const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
  addToast: mockAddToast,
  activeDashboard: {
    widgets: [],
  },
};

describe('ScoreboardWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  it('migrates legacy config on mount', () => {
    const legacyWidget: WidgetData = {
      id: 'test-id',
      type: 'scoreboard',
      config: {
        scoreA: 5,
        scoreB: 3,
        teamA: 'Alphas',
        teamB: 'Betas',
      } as ScoreboardConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: false,
    };

    render(<ScoreboardWidget widget={legacyWidget} />);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          teams: expect.arrayContaining([
            expect.objectContaining({ name: 'Alphas', score: 5 }),
            expect.objectContaining({ name: 'Betas', score: 3 }),
          ]) as unknown,
        }) as unknown,
      })
    );
  });

  it('renders teams from config', () => {
    const widget: WidgetData = {
      id: 'test-id',
      type: 'scoreboard',
      config: {
        teams: [
          { id: '1', name: 'Team One', score: 10, color: 'bg-blue-500' },
          { id: '2', name: 'Team Two', score: 20, color: 'bg-red-500' },
        ],
      } as ScoreboardConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: false,
    };

    render(<ScoreboardWidget widget={widget} />);
    expect(screen.getByText('Team One')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Team Two')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});

describe('ScoreboardSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  it('imports groups from random widget', () => {
    const widget: WidgetData = {
      id: 'scoreboard-id',
      type: 'scoreboard',
      config: { teams: [] } as ScoreboardConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: true,
    };

    const randomWidget: WidgetData = {
      id: 'random-id',
      type: 'random' as WidgetType,
      config: {
        lastResult: [
          { names: ['Alice', 'Bob'] },
          { names: ['Charlie', 'Dave'] },
        ],
      } as RandomConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: false,
    };

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        widgets: [randomWidget],
      },
    });

    render(<ScoreboardSettings widget={widget} />);

    const importButton = screen.getByText('Import Groups');
    fireEvent.click(importButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'scoreboard-id',
      expect.objectContaining({
        config: expect.objectContaining({
          teams: expect.arrayContaining([
            expect.objectContaining({ name: 'Group 1' }),
            expect.objectContaining({ name: 'Group 2' }),
          ]) as unknown,
        }) as unknown,
      })
    );
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Imported 2 groups'),
      'success'
    );
  });

  it('adds a new team', () => {
    const widget: WidgetData = {
      id: 'scoreboard-id',
      type: 'scoreboard',
      config: { teams: [] } as ScoreboardConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: true,
    };

    render(<ScoreboardSettings widget={widget} />);

    const addButton = screen.getByText('Add Team');
    fireEvent.click(addButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'scoreboard-id',
      expect.objectContaining({
        config: expect.objectContaining({
          teams: expect.arrayContaining([
            expect.objectContaining({ name: 'Team 1' }),
          ]) as unknown,
        }) as unknown,
      })
    );
  });

  it('imports roster from classes', () => {
    const widget: WidgetData = {
      id: 'scoreboard-id',
      type: 'scoreboard',
      config: { teams: [] } as ScoreboardConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: true,
    };

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockDashboardContext,
      rosters: [
        {
          id: 'roster-1',
          name: 'Class A',
          students: [
            { id: 's1', firstName: 'Alice', lastName: 'A' },
            { id: 's2', firstName: 'Bob', lastName: 'B' },
          ],
        },
      ],
      activeRosterId: 'roster-1',
    });

    render(<ScoreboardSettings widget={widget} />);

    const importButton = screen.getByText('Import Class');
    fireEvent.click(importButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'scoreboard-id',
      expect.objectContaining({
        config: expect.objectContaining({
          teams: expect.arrayContaining([
            expect.objectContaining({ name: 'Alice A' }),
            expect.objectContaining({ name: 'Bob B' }),
          ]) as unknown,
        }) as unknown,
      })
    );
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Imported 2 students'),
      'success'
    );
  });
});
