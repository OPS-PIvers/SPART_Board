import { render, screen, fireEvent, act } from '@testing-library/react';
import { PollWidget, PollSettings } from './PollWidget';
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

describe('PollWidget', () => {
  const mockUpdateWidget = vi.fn();
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
      question: 'Test Question',
      options: [
        { label: 'Option A', votes: 2 },
        { label: 'Option B', votes: 5 },
      ],
    },
  };

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders question and options correctly', () => {
    render(<PollWidget widget={mockWidget} />);
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('2 (29%)')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('5 (71%)')).toBeInTheDocument();
  });

  it('calls updateWidget when voting for an option', () => {
    render(<PollWidget widget={mockWidget} />);

    // Click Option A
    fireEvent.click(screen.getByText('Option A'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Test Question',
        options: [
          { label: 'Option A', votes: 3 }, // Votes incremented
          { label: 'Option B', votes: 5 },
        ],
      },
    });
  });

  it('resets votes when reset button is clicked', () => {
    render(<PollWidget widget={mockWidget} />);

    const resetButton = screen.getByText('Reset Poll');
    fireEvent.click(resetButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Test Question',
        options: [
          { label: 'Option A', votes: 0 },
          { label: 'Option B', votes: 0 },
        ],
      },
    });
  });
});

describe('PollSettings', () => {
  const mockUpdateWidget = vi.fn();
  const mockAddToast = vi.fn();
  const mockCanAccessFeature = vi.fn(() => true);

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
      options: [
        { label: 'Opt1', votes: 0 },
        { label: 'Opt2', votes: 0 },
      ],
    },
  };

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [
        {
          id: 'roster-1',
          name: 'Class A',
          students: [
            { id: 's1', firstName: 'John', lastName: 'Doe' },
            { id: 's2', firstName: 'Jane', lastName: 'Smith' },
          ],
        },
      ],
      activeRosterId: 'roster-1',
    });
    (useAuth as Mock).mockReturnValue({
      canAccessFeature: mockCanAccessFeature,
    });
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('updates widget config when magic poll is generated', () => {
    render(<PollSettings widget={mockWidget} />);

    const magicBtn = screen.getByTestId('magic-btn');
    fireEvent.click(magicBtn);

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

    expect(mockAddToast).toHaveBeenCalledWith(
      'Poll generated magically!',
      'success'
    );
  });

  it('adds a new option', () => {
    render(<PollSettings widget={mockWidget} />);

    fireEvent.click(screen.getByText('Add Option'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Opt1', votes: 0 },
          { label: 'Opt2', votes: 0 },
          { label: 'Option 3', votes: 0 }, // New option
        ],
      }),
    });
  });

  it('removes an option', () => {
    render(<PollSettings widget={mockWidget} />);

    // Find remove buttons (Trash icon) - finding by title
    const removeButtons = screen.getAllByTitle('Remove Option');
    fireEvent.click(removeButtons[0]);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Opt2', votes: 0 }, // Opt1 removed
        ],
      }),
    });
  });

  it('updates option label', () => {
    render(<PollSettings widget={mockWidget} />);

    const input = screen.getByDisplayValue('Opt1');
    fireEvent.change(input, { target: { value: 'Updated Opt1' } });
    fireEvent.blur(input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Updated Opt1', votes: 0 },
          { label: 'Opt2', votes: 0 },
        ],
      }),
    });
  });

  it('imports students from active roster', () => {
    render(<PollSettings widget={mockWidget} />);

    // Trigger import
    fireEvent.click(screen.getByTitle('Import Class A'));

    // Confirm dialog is mocked to return true

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'John Doe', votes: 0 },
          { label: 'Jane Smith', votes: 0 },
        ],
      }),
    });

    expect(mockAddToast).toHaveBeenCalledWith('Imported 2 students!', 'success');
  });

  it('handles reset in settings', () => {
    // Setup widget with votes
    const widgetWithVotes = {
        ...mockWidget,
        config: {
            ...mockWidget.config,
            options: [{ label: 'Opt1', votes: 5 }]
        }
    } as WidgetData;

    render(<PollSettings widget={widgetWithVotes} />);

    fireEvent.click(screen.getByText('Reset'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [{ label: 'Opt1', votes: 0 }]
      }),
    });
  });
});
