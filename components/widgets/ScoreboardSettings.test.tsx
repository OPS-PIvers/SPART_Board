import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreboardSettings } from './ScoreboardSettings';
import { WidgetData } from '../../types';

// Mock useDashboard
const mockUpdateWidget = vi.fn();
vi.mock('../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: mockUpdateWidget,
  }),
}));

describe('ScoreboardSettings', () => {
  beforeEach(() => {
    mockUpdateWidget.mockClear();
  });

  const createWidget = (
    config: { scoreA: number; scoreB: number; teamA: string; teamB: string }
  ): WidgetData => {
    return {
      id: 'scoreboard-1',
      type: 'scoreboard',
      x: 0,
      y: 0,
      w: 200,
      h: 100,
      z: 1,
      config,
    } as WidgetData;
  };

  it('renders inputs with current team names', () => {
    const widget = createWidget({
      scoreA: 10,
      scoreB: 5,
      teamA: 'Eagles',
      teamB: 'Hawks',
    });

    render(<ScoreboardSettings widget={widget} />);

    expect(screen.getByDisplayValue('Eagles')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hawks')).toBeInTheDocument();
  });

  it('calls updateWidget when Team A name changes', () => {
    const widget = createWidget({
      scoreA: 0,
      scoreB: 0,
      teamA: 'Team A',
      teamB: 'Team B',
    });
    render(<ScoreboardSettings widget={widget} />);

    const input = screen.getByDisplayValue('Team A');
    fireEvent.change(input, { target: { value: 'New Team A' } });

    expect(mockUpdateWidget).toHaveBeenCalledWith('scoreboard-1', {
      config: {
        scoreA: 0,
        scoreB: 0,
        teamA: 'New Team A',
        teamB: 'Team B',
      },
    });
  });

  it('calls updateWidget when Team B name changes', () => {
    const widget = createWidget({
      scoreA: 0,
      scoreB: 0,
      teamA: 'Team A',
      teamB: 'Team B',
    });
    render(<ScoreboardSettings widget={widget} />);

    const input = screen.getByDisplayValue('Team B');
    fireEvent.change(input, { target: { value: 'New Team B' } });

    expect(mockUpdateWidget).toHaveBeenCalledWith('scoreboard-1', {
      config: {
        scoreA: 0,
        scoreB: 0,
        teamA: 'Team A',
        teamB: 'New Team B',
      },
    });
  });

  it('calls updateWidget with 0 scores when reset button is clicked', () => {
    const widget = createWidget({
      scoreA: 5,
      scoreB: 3,
      teamA: 'Team A',
      teamB: 'Team B',
    });
    render(<ScoreboardSettings widget={widget} />);

    const resetButton = screen.getByRole('button', { name: /reset scores/i });
    fireEvent.click(resetButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith('scoreboard-1', {
      config: {
        scoreA: 0,
        scoreB: 0,
        teamA: 'Team A',
        teamB: 'Team B',
      },
    });
  });
});
