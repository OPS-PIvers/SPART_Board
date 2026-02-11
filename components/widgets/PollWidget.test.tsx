import { render, screen, fireEvent } from '@testing-library/react';
import { PollSettings, PollWidget } from './PollWidget';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { vi, describe, it, expect, Mock, beforeEach, afterEach } from 'vitest';
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
  const mockAddToast = vi.fn();
  const mockActiveDashboard = { globalStyle: { fontFamily: 'sans' } };

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
      question: 'What is your favorite color?',
      options: [
        { label: 'Red', votes: 5 },
        { label: 'Blue', votes: 3 },
      ],
    },
  };

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      activeDashboard: mockActiveDashboard,
    });
    vi.clearAllMocks();
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<PollWidget widget={mockWidget} />);
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('5 (63%)')).toBeInTheDocument();
    expect(screen.getByText('3 (38%)')).toBeInTheDocument();
  });

  it('handles voting functionality', () => {
    render(<PollWidget widget={mockWidget} />);

    // Click on "Red"
    fireEvent.click(screen.getByText('Red').closest('button')!);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'What is your favorite color?',
        options: [
          { label: 'Red', votes: 6 }, // Incremented
          { label: 'Blue', votes: 3 },
        ],
      },
    });
  });

  it('handles reset functionality', () => {
    render(<PollWidget widget={mockWidget} />);

    // Find reset button
    const resetBtn = screen.getByRole('button', { name: /reset poll/i });
    fireEvent.click(resetBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'What is your favorite color?',
        options: [
          { label: 'Red', votes: 0 },
          { label: 'Blue', votes: 0 },
        ],
      },
    });
  });
});

describe('PollSettings', () => {
  const mockUpdateWidget = vi.fn();
  const mockAddToast = vi.fn();
  const mockCanAccessFeature = vi.fn(() => true);

  const mockRosters = [
    {
      id: 'roster-1',
      name: 'Class A',
      students: [
        { id: 's1', firstName: 'John', lastName: 'Doe' },
        { id: 's2', firstName: 'Jane', lastName: 'Smith' },
      ],
    },
  ];

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
        { label: 'Option 1', votes: 0 },
        { label: 'Option 2', votes: 0 },
      ],
    },
  };

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: mockRosters,
      activeRosterId: 'roster-1',
    });
    (useAuth as Mock).mockReturnValue({
      canAccessFeature: mockCanAccessFeature,
    });
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    // Mock URL.createObjectURL and revokeObjectURL
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates widget config when magic poll is generated', () => {
    render(<PollSettings widget={mockWidget} />);

    // Find the magic button (from our mock)
    const magicBtn = screen.getByTestId('magic-btn');
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

  it('updates question', () => {
    render(<PollSettings widget={mockWidget} />);
    const questionInput = screen.getByDisplayValue('Original Question');

    fireEvent.change(questionInput, { target: { value: 'New Question' } });
    fireEvent.blur(questionInput);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        question: 'New Question',
      },
    });
  });

  it('adds and removes options', () => {
    render(<PollSettings widget={mockWidget} />);

    // Add Option
    const addBtn = screen.getByRole('button', { name: /add option/i });
    fireEvent.click(addBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        options: [
          ...mockWidget.config!.options!,
          { label: 'Option 3', votes: 0 },
        ],
      },
    });

    // Remove Option (Option 1)
    // We need to re-render or mock updateWidget carefully if we want to chain actions,
    // but here we just test the call.
    // Note: Since render is not reactive to mockUpdateWidget calls in this test setup,
    // we are testing actions on the initial render state.

    const removeBtns = screen.getAllByTitle('Remove Option');
    fireEvent.click(removeBtns[0]);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        options: [
          { label: 'Option 2', votes: 0 },
        ],
      },
    });
  });

  it('edits option text', () => {
    render(<PollSettings widget={mockWidget} />);

    const optionInputs = screen.getAllByRole('textbox');
    // First input is usually question, subsequent are options depending on implementation.
    // In PollSettings: Question input is type="text". Option inputs are also type="text".
    // Let's find by value to be safe.
    const opt1Input = screen.getByDisplayValue('Option 1');

    fireEvent.change(opt1Input, { target: { value: 'Updated Option 1' } });
    fireEvent.blur(opt1Input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        options: [
          { label: 'Updated Option 1', votes: 0 },
          { label: 'Option 2', votes: 0 },
        ],
      },
    });
  });

  it('imports from roster', () => {
    render(<PollSettings widget={mockWidget} />);

    const importBtn = screen.getByRole('button', { name: /import class/i });
    fireEvent.click(importBtn);

    // Should confirm first if options exist
    expect(window.confirm).toHaveBeenCalled();

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        options: [
          { label: 'John Doe', votes: 0 },
          { label: 'Jane Smith', votes: 0 },
        ],
      },
    });
    expect(mockAddToast).toHaveBeenCalledWith('Imported 2 students!', 'success');
  });

  it('exports to CSV', () => {
    render(<PollSettings widget={mockWidget} />);

    // Mock anchor click
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('Results exported to CSV', 'success');
  });

  it('resets poll from settings', () => {
     render(<PollSettings widget={mockWidget} />);

     const resetBtn = screen.getByRole('button', { name: /reset/i });
     fireEvent.click(resetBtn);

     expect(window.confirm).toHaveBeenCalled();
     expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: {
            ...mockWidget.config,
            options: [
                { label: 'Option 1', votes: 0 },
                { label: 'Option 2', votes: 0 }
            ]
        }
     });
  });
});
