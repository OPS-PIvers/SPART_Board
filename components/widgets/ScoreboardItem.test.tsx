import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreboardItem } from './ScoreboardItem';
import { ScoreboardTeam } from '../../types';

describe('ScoreboardItem', () => {
  const mockTeam: ScoreboardTeam = {
    id: 'team-1',
    name: 'Alpha Team',
    score: 42,
    color: 'bg-blue-500',
  };

  const mockUpdateScore = vi.fn();

  beforeEach(() => {
    mockUpdateScore.mockClear();
  });

  it('renders team name and score correctly', () => {
    render(<ScoreboardItem team={mockTeam} onUpdateScore={mockUpdateScore} />);

    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('verifies the application of color props by checking for the specific text color utility class', () => {
    render(<ScoreboardItem team={mockTeam} onUpdateScore={mockUpdateScore} />);

    const teamNameElement = screen.getByText('Alpha Team');
    expect(teamNameElement).toHaveClass('text-blue-600');
  });

  it('calls onUpdateScore with +1 when plus button is clicked', async () => {
    const user = userEvent.setup();
    render(<ScoreboardItem team={mockTeam} onUpdateScore={mockUpdateScore} />);

    const plusButton = screen.getByRole('button', { name: /increase score/i });
    await user.click(plusButton);

    expect(mockUpdateScore).toHaveBeenCalledWith('team-1', 1);
  });

  it('calls onUpdateScore with -1 when minus button is clicked', async () => {
    const user = userEvent.setup();
    render(<ScoreboardItem team={mockTeam} onUpdateScore={mockUpdateScore} />);

    const minusButton = screen.getByRole('button', { name: /decrease score/i });
    await user.click(minusButton);

    expect(mockUpdateScore).toHaveBeenCalledWith('team-1', -1);
  });

  it('handles invalid color gracefully (uses default styles)', () => {
    const teamWithInvalidColor: ScoreboardTeam = {
      ...mockTeam,
      color: 'bg-invalid-500',
    };

    render(<ScoreboardItem team={teamWithInvalidColor} onUpdateScore={mockUpdateScore} />);

    const teamNameElement = screen.getByText('Alpha Team');
    expect(teamNameElement).toHaveClass('text-slate-600');
  });
});
