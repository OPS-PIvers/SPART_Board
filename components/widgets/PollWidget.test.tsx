/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-member-access */
import { render, screen, fireEvent } from '@testing-library/react';
import { PollWidget, PollSettings } from './PollWidget';
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

// Setup safe spies/mocks
const mockCreateObjectURL = vi.fn(() => 'blob:url');
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();

describe('PollWidget (Main View)', () => {
  const mockUpdateWidget = vi.fn();
  const mockAddToast = vi.fn();

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWidget: WidgetData = {
    id: 'poll-1',
    type: 'poll',
    w: 300,
    h: 300,
    x: 0,
    y: 0,
    z: 1,
    flipped: false,
    config: {
      question: 'Favorite Color?',
      options: [
        { label: 'Red', votes: 2 },
        { label: 'Blue', votes: 5 },
      ],
    },
  };

  it('renders question and options', () => {
    render(<PollWidget widget={mockWidget} />);
    expect(screen.getByText('Favorite Color?')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('2 (29%)')).toBeInTheDocument();
    expect(screen.getByText('5 (71%)')).toBeInTheDocument();
  });

  it('handles voting', () => {
    render(<PollWidget widget={mockWidget} />);

    // Click on "Red"
    fireEvent.click(screen.getByText('Red').closest('button')!);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Favorite Color?',
        options: [
          { label: 'Red', votes: 3 }, // Incremented
          { label: 'Blue', votes: 5 },
        ],
      },
    });
  });

  it('handles reset', () => {
    render(<PollWidget widget={mockWidget} />);

    const resetBtn = screen.getByText('Reset Poll');
    fireEvent.click(resetBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Favorite Color?',
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
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' },
      ],
    },
  ];

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: mockRosters,
      activeRosterId: 'roster-1', // Default active
    });
    (useAuth as Mock).mockReturnValue({
      canAccessFeature: mockCanAccessFeature,
    });

    // Setup spies
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // URL mocks
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    // document.createElement mock for anchor click
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName === 'a') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (el as any).click = mockClick;
        }
        return el;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const mockWidget: WidgetData = {
    id: 'poll-1',
    type: 'poll',
    w: 300,
    h: 300,
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

  it('updates question', () => {
    render(<PollSettings widget={mockWidget} />);

    const input = screen.getByDisplayValue('Original Question');
    fireEvent.change(input, { target: { value: 'New Question' } });
    fireEvent.blur(input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        question: 'New Question',
      }),
    });
  });

  it('adds an option', () => {
    render(<PollSettings widget={mockWidget} />);

    fireEvent.click(screen.getByText('Add Option'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Opt1', votes: 0 },
          { label: 'Opt2', votes: 0 },
          { label: 'Option 3', votes: 0 },
        ],
      }),
    });
  });

  it('removes an option', () => {
    render(<PollSettings widget={mockWidget} />);

    const deleteBtns = screen.getAllByTitle('Remove Option');
    fireEvent.click(deleteBtns[0]);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [{ label: 'Opt2', votes: 0 }],
      }),
    });
  });

  it('imports from roster', () => {
    render(<PollSettings widget={mockWidget} />);

    const importBtn = screen.getByText('Import Class');
    fireEvent.click(importBtn);

    // Should prompt if existing options
    expect(window.confirm).toHaveBeenCalled();

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'John Doe', votes: 0 },
          { label: 'Jane Smith', votes: 0 },
        ],
      }),
    });
    expect(mockAddToast).toHaveBeenCalledWith(
      'Imported 2 students!',
      'success'
    );
  });

  it('handles CSV export', () => {
    render(<PollSettings widget={mockWidget} />);

    fireEvent.click(screen.getByText('Export CSV'));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      'Results exported to CSV',
      'success'
    );
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
});
