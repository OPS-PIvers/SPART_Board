import { render, screen, fireEvent } from '@testing-library/react';
import { PollSettings, PollWidget } from './PollWidget';
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

// Mock useScaledFont
vi.mock('../../hooks/useScaledFont', () => ({
  useScaledFont: vi.fn(() => 20),
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
        { label: 'Option 1', votes: 10 },
        { label: 'Option 2', votes: 5 },
      ],
    },
  };

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });
    vi.clearAllMocks();
    // Mock confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders question and options', () => {
    render(<PollWidget widget={mockWidget} />);
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('10 (67%)')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('5 (33%)')).toBeInTheDocument();
  });

  it('increments vote on click', () => {
    render(<PollWidget widget={mockWidget} />);
    fireEvent.click(screen.getByText('Option 1'));
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        options: [
          { label: 'Option 1', votes: 11 },
          { label: 'Option 2', votes: 5 },
        ],
      },
    });
  });

  it('resets votes when reset button is clicked', () => {
    render(<PollWidget widget={mockWidget} />);
    fireEvent.click(screen.getByText('Reset Poll'));
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to reset the poll?'
    );
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        options: [
          { label: 'Option 1', votes: 0 },
          { label: 'Option 2', votes: 0 },
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
      options: [],
    },
  };

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
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('updates widget config when magic poll is generated', () => {
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

  it('updates question', () => {
    render(<PollSettings widget={mockWidget} />);
    const input = screen.getByDisplayValue('Original Question');
    fireEvent.change(input, { target: { value: 'New Question' } });
    fireEvent.blur(input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: { ...mockWidget.config, question: 'New Question' },
    });
  });

  it('adds an option', () => {
    render(<PollSettings widget={mockWidget} />);
    fireEvent.click(screen.getByText('Add Option'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        options: [{ label: 'Option 1', votes: 0 }],
      },
    });
  });

  it('removes an option', () => {
    const widgetWithOptions = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        options: [{ label: 'To Remove', votes: 0 }],
      },
    };
    render(<PollSettings widget={widgetWithOptions} />);
    const removeBtn = screen.getByTitle('Remove Option');
    fireEvent.click(removeBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: { ...mockWidget.config, options: [] },
    });
  });

  it('imports from class roster', () => {
    const mockRoster = {
      id: 'roster-1',
      name: 'Class A',
      students: [{ firstName: 'John', lastName: 'Doe' }],
    };
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [mockRoster],
      activeRosterId: 'roster-1',
    });

    render(<PollSettings widget={mockWidget} />);
    fireEvent.click(screen.getByText('Import Class'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...mockWidget.config,
        options: [{ label: 'John Doe', votes: 0 }],
      },
    });
    expect(mockAddToast).toHaveBeenCalledWith('Imported 1 students!', 'success');
  });

  it('exports to CSV', () => {
    const widgetWithOptions = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        options: [{ label: 'Choice A', votes: 5 }],
      },
    };

    // Mock URL.createObjectURL and revokeObjectURL
    const mockCreateObjectURL = vi.fn(() => 'mock-url');
    const mockRevokeObjectURL = vi.fn();
    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock HTMLAnchorElement click
    const mockClick = vi.fn();
    // We need to spy on createElement to return our mock anchor
    const originalCreateElement = document.createElement.bind(document);
    const spyCreateElement = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
        if (tagName === 'a') {
            const element = originalCreateElement(tagName, options) as HTMLAnchorElement;
            element.click = mockClick;
            return element;
        }
        return originalCreateElement(tagName, options);
    });

    render(<PollSettings widget={widgetWithOptions} />);
    fireEvent.click(screen.getByText('Export CSV'));

    // Verify blob creation (checking the content is harder with Blob, but we can check the call happened)
    expect(mockCreateObjectURL).toHaveBeenCalled();
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);

    // Verify click
    expect(mockClick).toHaveBeenCalled();

    // Cleanup
    spyCreateElement.mockRestore();
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
  });
});
