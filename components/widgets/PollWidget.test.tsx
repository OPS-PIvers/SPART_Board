import { render, screen, fireEvent } from '@testing-library/react';
import { PollSettings } from './PollWidget';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { vi, describe, it, expect, Mock, beforeEach } from 'vitest';
import { WidgetData } from '../../types';
import { GeneratedPoll } from '../../utils/ai';

// Mock useDashboard
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

// Mock useAuth
vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock MagicInput to simulate interaction
vi.mock('../common/MagicInput', () => ({
  MagicInput: ({
    onSuccess,
    buttonLabel,
  }: {
    onSuccess: (data: GeneratedPoll) => void;
    buttonLabel: string;
  }) => (
    <button
      data-testid="magic-btn"
      onClick={() =>
        onSuccess({
          question: 'Magic Question?',
          options: ['Opt1', 'Opt2', 'Opt3', 'Opt4'],
        })
      }
    >
      {buttonLabel}
    </button>
  ),
}));

describe('PollSettings', () => {
  const mockUpdateWidget = vi.fn();
  const mockAddToast = vi.fn();
  const mockCanAccessFeature = vi.fn(() => true);

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [],
      activeRosterId: null,
    });
    (useAuth as Mock).mockReturnValue({
      canAccessFeature: mockCanAccessFeature,
    });
    vi.clearAllMocks();
  });
  it('updates widget config when magic poll is generated', () => {
    const mockWidget: WidgetData = {
      id: 'poll-1',
      type: 'poll',
      w: 2,
      h: 2,
      x: 0,
      y: 0,
      z: 1,
      flipped: false,
      config: {
        question: 'Original Question',
        options: [],
      },
    };

    render(<PollSettings widget={mockWidget} />);

    // Find the magic button (from our mock)
    const magicBtn = screen.getByTestId('magic-btn');
    expect(magicBtn).toBeInTheDocument();

    // Click it to trigger onSuccess
    fireEvent.click(magicBtn);

    // Verify updateWidget was called with new config
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Magic Question?',
        options: [
          { label: 'Opt1', votes: 0 },
          { label: 'Opt2', votes: 0 },
          { label: 'Opt3', votes: 0 },
          { label: 'Opt4', votes: 0 },
        ],
      },
    });

    // Verify toast
    expect(mockAddToast).toHaveBeenCalledWith(
      'Poll generated magically!',
      'success'
    );
  });
});
