import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

describe('PollWidget', () => {
  const mockUpdateWidget = vi.fn();
  const mockActiveDashboard = { globalStyle: { fontFamily: 'sans' } };

  const defaultWidget: WidgetData = {
    id: 'poll-1',
    type: 'poll',
    w: 2,
    h: 2,
    x: 0,
    y: 0,
    z: 1,
    flipped: false,
    config: {
      question: 'Test Question?',
      options: [
        { label: 'Option A', votes: 2 },
        { label: 'Option B', votes: 5 },
      ],
    },
  };

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: mockActiveDashboard,
    });
    vi.clearAllMocks();
  });

  it('renders the question and options', () => {
    render(<PollWidget widget={defaultWidget} />);

    expect(screen.getByText('Test Question?')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText(/2 \(/)).toBeInTheDocument(); // 2 votes
    expect(screen.getByText(/5 \(/)).toBeInTheDocument(); // 5 votes
  });

  it('calls updateWidget when an option is clicked (voting)', () => {
    render(<PollWidget widget={defaultWidget} />);

    // Click Option A
    fireEvent.click(screen.getByText('Option A'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Test Question?',
        options: [
          { label: 'Option A', votes: 3 }, // Votes incremented
          { label: 'Option B', votes: 5 },
        ],
      },
    });
  });

  it('calls updateWidget when reset button is clicked and confirmed', () => {
    mockConfirm.mockReturnValue(true);
    render(<PollWidget widget={defaultWidget} />);

    // Find reset button
    const resetBtn = screen.getByText('Reset Poll');
    fireEvent.click(resetBtn);

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to reset the poll?'
    );
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Test Question?',
        options: [
          { label: 'Option A', votes: 0 },
          { label: 'Option B', votes: 0 },
        ],
      },
    });
  });

  it('does not reset if confirm is cancelled', () => {
    mockConfirm.mockReturnValue(false);
    render(<PollWidget widget={defaultWidget} />);

    const resetBtn = screen.getByText('Reset Poll');
    fireEvent.click(resetBtn);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });
});

describe('PollSettings', () => {
  const mockUpdateWidget = vi.fn();
  const mockAddToast = vi.fn();
  const mockCanAccessFeature = vi.fn(() => true);

  const mockRosters = [
    {
      id: 'class-1',
      name: 'Class 1A',
      students: [
        { id: 's1', firstName: 'John', lastName: 'Doe' },
        { id: 's2', firstName: 'Jane', lastName: 'Smith' },
      ],
    },
  ];

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: mockRosters,
      activeRosterId: 'class-1',
    });
    (useAuth as Mock).mockReturnValue({
      canAccessFeature: mockCanAccessFeature,
    });
    vi.clearAllMocks();
  });

  const widget: WidgetData = {
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
      options: [{ label: 'Option 1', votes: 0 }],
    },
  };

  it('updates widget config when magic poll is generated', () => {
    render(<PollSettings widget={widget} />);

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
    render(<PollSettings widget={widget} />);

    const addBtn = screen.getByText('Add Option');
    fireEvent.click(addBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Original Question',
        options: [
          { label: 'Option 1', votes: 0 },
          { label: 'Option 2', votes: 0 }, // New option
        ],
      },
    });
  });

  it('removes an option', () => {
    render(<PollSettings widget={widget} />);

    const removeBtn = screen.getByTitle('Remove Option');
    fireEvent.click(removeBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Original Question',
        options: [], // Empty options
      },
    });
  });

  it('updates question text', () => {
    render(<PollSettings widget={widget} />);

    const input = screen.getByDisplayValue('Original Question');
    fireEvent.change(input, { target: { value: 'New Question' } });
    fireEvent.blur(input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'New Question',
        options: [{ label: 'Option 1', votes: 0 }],
      },
    });
  });

  it('updates option text', () => {
    render(<PollSettings widget={widget} />);

    const input = screen.getByDisplayValue('Option 1');
    fireEvent.change(input, { target: { value: 'Updated Option' } });
    fireEvent.blur(input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Original Question',
        options: [{ label: 'Updated Option', votes: 0 }],
      },
    });
  });

  it('imports options from roster', () => {
    mockConfirm.mockReturnValue(true);
    render(<PollSettings widget={widget} />);

    const importBtn = screen.getByText('Import Class');
    fireEvent.click(importBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Original Question',
        options: [
          { label: 'John Doe', votes: 0 },
          { label: 'Jane Smith', votes: 0 },
        ],
      },
    });
    expect(mockAddToast).toHaveBeenCalledWith(
      'Imported 2 students!',
      'success'
    );
  });

  it('does not import if user cancels confirmation', () => {
    mockConfirm.mockReturnValue(false); // User clicks Cancel
    // Widget with existing options to trigger confirmation
    const widgetWithOptions = {
      ...widget,
      config: {
        ...widget.config,
        options: [{ label: 'Existing Option', votes: 0 }],
      },
    };
    render(<PollSettings widget={widgetWithOptions} />);

    const importBtn = screen.getByText('Import Class');
    fireEvent.click(importBtn);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('does not import if no active roster', () => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: mockRosters,
      activeRosterId: null, // No active roster
    });

    render(<PollSettings widget={widget} />);

    // The button might be disabled, but let's try to click logic anyway if accessible
    // In the component: disabled={!activeRoster}
    const importBtn = screen.getByText('Import Class');
    // It should be disabled
    expect(importBtn).toBeDisabled();

    // Even if forced click (if not disabled by DOM)
    fireEvent.click(importBtn);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('exports to CSV', () => {
    render(<PollSettings widget={widget} />);

    const exportBtn = screen.getByText('Export CSV');
    fireEvent.click(exportBtn);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      'Results exported to CSV',
      'success'
    );
  });

  it('resets the poll from settings', () => {
    mockConfirm.mockReturnValue(true);
    const widgetWithVotes = {
      ...widget,
      config: {
        ...widget.config,
        options: [{ label: 'Option 1', votes: 5 }],
      },
    };
    render(<PollSettings widget={widgetWithVotes} />);

    // There is a 'Reset' button in settings too
    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Original Question',
        options: [{ label: 'Option 1', votes: 0 }],
      },
    });
  });
});
