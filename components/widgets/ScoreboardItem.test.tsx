import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScoreboardItem } from './ScoreboardItem';
import { ScoreboardTeam } from '../../types';

describe('ScoreboardItem', () => {
  const mockTeam: ScoreboardTeam = {
    id: 'team-1',
    name: 'Alpha',
    score: 10,
    color: 'bg-blue-500',
  };

  const mockOnUpdateScore = vi.fn();

  it('renders team name and score', () => {
    render(
      <ScoreboardItem team={mockTeam} onUpdateScore={mockOnUpdateScore} />
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls onUpdateScore with correct arguments when increment button is clicked', () => {
    render(
      <ScoreboardItem team={mockTeam} onUpdateScore={mockOnUpdateScore} />
    );

    const plusBtn = screen.getByRole('button', { name: /increase score/i });

    fireEvent.click(plusBtn);
    expect(mockOnUpdateScore).toHaveBeenCalledWith('team-1', 1);
  });

  it('calls onUpdateScore with correct arguments when decrement button is clicked', () => {
    render(
      <ScoreboardItem team={mockTeam} onUpdateScore={mockOnUpdateScore} />
    );

    const minusBtn = screen.getByRole('button', { name: /decrease score/i });

    fireEvent.click(minusBtn);
    expect(mockOnUpdateScore).toHaveBeenCalledWith('team-1', -1);
  });

  it('renders correctly with unknown color', () => {
    const unknownColorTeam = { ...mockTeam, color: 'bg-unknown-500' };
    render(
      <ScoreboardItem
        team={unknownColorTeam}
        onUpdateScore={mockOnUpdateScore}
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('renders correctly with no color provided', () => {
    const noColorTeam: ScoreboardTeam = {
      id: 'team-3',
      name: 'Delta',
      score: 5,
      // color is undefined
    };

    render(
      <ScoreboardItem team={noColorTeam} onUpdateScore={mockOnUpdateScore} />
    );
    expect(screen.getByText('Delta')).toBeInTheDocument();
  });
});
