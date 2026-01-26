/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreboardWidget, ScoreboardSettings } from './ScoreboardWidget';
import { useDashboard } from '../../context/useDashboard';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import * as ScoreboardItemModule from './ScoreboardItem';
import {
  WidgetData,
  ScoreboardConfig,
  RandomConfig,
  WidgetType,
  ScoreboardTeam,
} from '../../types';

vi.mock('../../context/useDashboard');

vi.mock('lucide-react', () => ({
  Plus: () => <div />,
  Trash2: () => <div />,
  Users: () => <div />,
  RefreshCw: () => <div />,
  Trophy: () => <div />,
  Download: () => <div />,
}));

// Mock ScoreboardItem to spy on renders
vi.mock('./ScoreboardItem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ScoreboardItem')>();
  const React = await import('react');
  const { vi } = await import('vitest');

  const spy = vi.fn();

  const InnerItem = (props: { team: ScoreboardTeam }) => {
    spy(props);
    return (
      <div>
        {props.team.name} {props.team.score}
      </div>
    );
  };

  return {
    ...actual,
    ScoreboardItem: React.memo(InnerItem),
    itemRenderSpy: spy,
  };
});

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
    // Use regex to match text loosely because our mock renders simplified structure
    expect(screen.getByText(/Team One/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/Team Two/)).toBeInTheDocument();
    expect(screen.getByText(/20/)).toBeInTheDocument();
  });

  it('optimizes renders when updating scores', () => {
    // Access the spy from the mocked module
    const itemRenderSpy = (
      ScoreboardItemModule as unknown as { itemRenderSpy: Mock }
    ).itemRenderSpy;

    itemRenderSpy.mockClear();

    const teams = [
      { id: '1', name: 'Team One', score: 10, color: 'bg-blue-500' },
      { id: '2', name: 'Team Two', score: 20, color: 'bg-red-500' },
    ];

    const widget: WidgetData = {
      id: 'test-id',
      type: 'scoreboard',
      config: {
        teams,
      } as ScoreboardConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: false,
    };

    const { rerender } = render(<ScoreboardWidget widget={widget} />);

    // Initial render: 2 items
    expect(itemRenderSpy).toHaveBeenCalledTimes(2);
    itemRenderSpy.mockClear();

    // Simulate update: change score of Team One
    // We manually rerender with new props simulating the result of the update.
    // IMPORTANT: We must preserve the reference of the unchanged team object
    // to simulate how state updates work in React and satisfy React.memo.
    const updatedWidget: WidgetData = {
      ...widget,
      config: {
        ...widget.config,
        teams: [
          { ...teams[0], score: 11 }, // Changed (new object)
          teams[1], // Unchanged (same reference)
        ],
      } as ScoreboardConfig,
    };

    rerender(<ScoreboardWidget widget={updatedWidget} />);

    // Expectation:
    // Team One (id: 1) should re-render because props changed.
    // Team Two (id: 2) should NOT re-render because props are equal and component is memoized with stable callback.
    // Total calls should be 1.
    expect(itemRenderSpy).toHaveBeenCalledTimes(1);
    expect(itemRenderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        team: expect.objectContaining({ id: '1', score: 11 }),
      })
    );
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

  it('exports scores to CSV', () => {
    // Mock URL methods
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Spy on document/element methods
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLElement.prototype, 'click');
    // We don't need to spy setAttribute if we trust the logic, but testing it would require
    // filtering calls on specific elements which is hard without mocking return value.
    // Given the complexity, verifying createObjectURL, append, click, remove is enough coverage.

    const widget: WidgetData = {
      id: 'scoreboard-id',
      type: 'scoreboard',
      config: {
        teams: [
          { id: '1', name: 'Team Alpha', score: 10, color: 'bg-blue-500' },
          { id: '2', name: 'Team Beta', score: 20, color: 'bg-red-500' },
        ],
      } as ScoreboardConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: true,
    };

    render(<ScoreboardSettings widget={widget} />);

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      'Scores exported to CSV',
      'success'
    );
  });
});
