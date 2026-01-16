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
  const mockWidget: WidgetData = {
    id: 'test-scoreboard',
    type: 'scoreboard',
    x: 0,
    y: 0,
    w: 320,
    h: 200,
    z: 1,
    flipped: false,
    config: {
      scoreA: 10,
      scoreB: 5,
      teamA: 'Team Alpha',
      teamB: 'Team Beta',
    },
  };

  beforeEach(() => {
    mockUpdateWidget.mockClear();
  });

  it('renders with current configuration', () => {
    render(<ScoreboardSettings widget={mockWidget} />);

    expect(screen.getByDisplayValue('Team Alpha')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Team Beta')).toBeInTheDocument();
    expect(screen.getByText(/Reset Scores/i)).toBeInTheDocument();
  });

  it('updates Team A name on input change', () => {
    render(<ScoreboardSettings widget={mockWidget} />);

    const inputA = screen.getByDisplayValue('Team Alpha');
    fireEvent.change(inputA, { target: { value: 'New Name A' } });

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-scoreboard', {
      config: expect.objectContaining({
        teamA: 'New Name A',
        teamB: 'Team Beta',
        scoreA: 10,
        scoreB: 5,
      }),
    });
  });

  it('updates Team B name on input change', () => {
    render(<ScoreboardSettings widget={mockWidget} />);

    const inputB = screen.getByDisplayValue('Team Beta');
    fireEvent.change(inputB, { target: { value: 'New Name B' } });

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-scoreboard', {
      config: expect.objectContaining({
        teamA: 'Team Alpha',
        teamB: 'New Name B',
      }),
    });
  });

  it('resets scores when reset button is clicked', () => {
    render(<ScoreboardSettings widget={mockWidget} />);

    const resetButton = screen.getByText(/Reset Scores/i);
    fireEvent.click(resetButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-scoreboard', {
      config: expect.objectContaining({
        scoreA: 0,
        scoreB: 0,
        teamA: 'Team Alpha',
        teamB: 'Team Beta',
      }),
    });
  });
});
