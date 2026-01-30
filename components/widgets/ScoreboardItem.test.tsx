import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreboardItem } from './ScoreboardItem';
import { vi, describe, it, expect } from 'vitest';
import { ScoreboardTeam } from '../../types';

describe('ScoreboardItem', () => {
  const mockTeam: ScoreboardTeam = {
    id: 'team-1',
    name: 'Alpha Team',
    score: 10,
    color: 'bg-blue-500',
  };

  const mockOnUpdateScore = vi.fn();

  it('renders team name and score', () => {
    render(
      <ScoreboardItem
        team={mockTeam}
        onUpdateScore={mockOnUpdateScore}
        scoreFontSize={48}
      />
    );

    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies correct color styles to container', () => {
    const { container } = render(
      <ScoreboardItem
        team={mockTeam} // color: bg-blue-500
        onUpdateScore={mockOnUpdateScore}
        scoreFontSize={48}
      />
    );

    // Check that the container has the background color class derived from the prop
    // This verifies the prop is being used without being too coupled to specific internal style maps
    expect(container.firstChild).toHaveClass('bg-blue-500/20');
  });

  it('calls onUpdateScore with -1 when minus button is clicked', () => {
    render(
      <ScoreboardItem
        team={mockTeam}
        onUpdateScore={mockOnUpdateScore}
        scoreFontSize={48}
      />
    );

    const minusButton = screen.getByRole('button', { name: /decrease score/i });
    fireEvent.click(minusButton);

    expect(mockOnUpdateScore).toHaveBeenCalledWith('team-1', -1);
  });

  it('calls onUpdateScore with 1 when plus button is clicked', () => {
    render(
      <ScoreboardItem
        team={mockTeam}
        onUpdateScore={mockOnUpdateScore}
        scoreFontSize={48}
      />
    );

    const plusButton = screen.getByRole('button', { name: /increase score/i });
    fireEvent.click(plusButton);

    expect(mockOnUpdateScore).toHaveBeenCalledWith('team-1', 1);
  });

  it('applies font size style', () => {
    const fontSize = 64;
    render(
      <ScoreboardItem
        team={mockTeam}
        onUpdateScore={mockOnUpdateScore}
        scoreFontSize={fontSize}
      />
    );

    const scoreElement = screen.getByText('10');
    expect(scoreElement).toHaveStyle({ fontSize: `${fontSize}px` });
  });

  it('uses default color when no color is provided', () => {
    const teamWithoutColor: ScoreboardTeam = {
      id: 'team-2',
      name: 'Beta Team',
      score: 5,
      // color is undefined
    };

    const { container } = render(
      <ScoreboardItem
        team={teamWithoutColor}
        onUpdateScore={mockOnUpdateScore}
        scoreFontSize={48}
      />
    );

    // Default is bg-blue-500
    expect(container.firstChild).toHaveClass('bg-blue-500/20');
  });

  it('uses fallback styles for invalid color', () => {
    const teamWithInvalidColor: ScoreboardTeam = {
      id: 'team-3',
      name: 'Gamma Team',
      score: 15,
      color: 'bg-invalid-color',
    };

    const { container } = render(
      <ScoreboardItem
        team={teamWithInvalidColor}
        onUpdateScore={mockOnUpdateScore}
        scoreFontSize={48}
      />
    );

    // It should still apply the invalid color class to the container
    expect(container.firstChild).toHaveClass('bg-invalid-color/20');
  });
});
