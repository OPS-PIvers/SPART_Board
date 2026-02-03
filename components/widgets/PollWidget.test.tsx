import { render, screen, fireEvent } from '@testing-library/react';
import { PollSettings, PollWidget } from './PollWidget';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { vi, describe, it, expect, Mock, beforeEach } from 'vitest';
import { PollConfig, WidgetData } from '../../types';
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
  useScaledFont: vi.fn(() => 16),
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

describe('PollWidget (View)', () => {
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
      question: 'Favorite Color?',
      options: [
        { label: 'Red', votes: 2 },
        { label: 'Blue', votes: 5 },
      ],
    },
  };

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('renders question and options with votes', () => {
    render(<PollWidget widget={mockWidget} />);

    expect(screen.getByText('Favorite Color?')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    // 2 votes out of 7 is approx 29%
    expect(screen.getByText('2 (29%)')).toBeInTheDocument();
    // 5 votes out of 7 is approx 71%
    expect(screen.getByText('5 (71%)')).toBeInTheDocument();
  });

  it('handles voting interaction', () => {
    render(<PollWidget widget={mockWidget} />);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const redOption = screen.getByText('Red').closest('button')!;
    fireEvent.click(redOption);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        question: 'Favorite Color?',
        options: [
          { label: 'Red', votes: 3 }, // Votes incremented
          { label: 'Blue', votes: 5 },
        ],
      },
    });
  });

  it('handles reset interaction', () => {
    render(<PollWidget widget={mockWidget} />);

    const resetButton = screen.getByText('Reset Poll');
    fireEvent.click(resetButton);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to reset the poll?'
    );
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

  it('aborts reset if confirm is cancelled', () => {
    window.confirm = vi.fn(() => false);
    render(<PollWidget widget={mockWidget} />);

    const resetButton = screen.getByText('Reset Poll');
    fireEvent.click(resetButton);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
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
      options: [{ label: 'Option A', votes: 10 }],
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
    window.confirm = vi.fn(() => true);

    // Mock URL and document methods for export test
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('updates widget config when magic poll is generated', () => {
    render(<PollSettings widget={mockWidget} />);

    const magicBtn = screen.getByTestId('magic-btn');
    fireEvent.click(magicBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'poll-1',
      expect.objectContaining({
        config: expect.objectContaining({
          question: 'Magic Question?',
          options: expect.arrayContaining([
            expect.objectContaining({ label: 'Opt1' }),
          ]) as unknown,
        }) as PollConfig,
      })
    );
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
      config: expect.objectContaining({
        question: 'New Question',
      }) as PollConfig,
    });
  });

  it('adds a new option', () => {
    render(<PollSettings widget={mockWidget} />);

    const addButton = screen.getByText('Add Option');
    fireEvent.click(addButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Option A', votes: 10 },
          { label: 'Option 2', votes: 0 },
        ],
      }) as PollConfig,
    });
  });

  it('removes an option', () => {
    render(<PollSettings widget={mockWidget} />);

    const removeButton = screen.getByTitle('Remove Option');
    fireEvent.click(removeButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({ options: [] }) as PollConfig,
    });
  });

  it('updates option label', () => {
    render(<PollSettings widget={mockWidget} />);

    const optionInput = screen.getByDisplayValue('Option A');
    fireEvent.change(optionInput, { target: { value: 'Updated Option' } });
    fireEvent.blur(optionInput);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [{ label: 'Updated Option', votes: 10 }],
      }) as PollConfig,
    });
  });

  it('resets votes via settings', () => {
    render(<PollSettings widget={mockWidget} />);

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [{ label: 'Option A', votes: 0 }],
      }) as PollConfig,
    });
  });

  it('imports from roster', () => {
    const mockRoster = {
      id: 'class-1',
      name: 'Class 1A',
      students: [
        { id: 's1', firstName: 'John', lastName: 'Doe' },
        { id: 's2', firstName: 'Jane', lastName: 'Smith' },
      ],
    };

    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [mockRoster],
      activeRosterId: 'class-1',
    });

    render(<PollSettings widget={mockWidget} />);

    const importButton = screen.getByText('Import Class');
    fireEvent.click(importButton);

    expect(window.confirm).toHaveBeenCalledWith(
      'This will replace current options. Continue?'
    );

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'John Doe', votes: 0 },
          { label: 'Jane Smith', votes: 0 },
        ],
      }) as PollConfig,
    });
    expect(mockAddToast).toHaveBeenCalledWith(
      'Imported 2 students!',
      'success'
    );
  });

  it('exports to CSV', () => {
    // Mock URL.createObjectURL
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

    // Spy on appendChild/removeChild
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    // Spy on HTMLAnchorElement.prototype.click
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    render(<PollSettings widget={mockWidget} />);

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    // Find the anchor element that was appended
    const anchor = appendChildSpy.mock.calls.find(
      (call) => call[0] instanceof HTMLAnchorElement
    )?.[0] as HTMLAnchorElement;

    expect(anchor).toBeDefined();
    if (anchor) {
      expect(anchor.getAttribute('download')).toContain('Poll_Results_');
      expect(anchor.getAttribute('href')).toBe('blob:url');
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(anchor);
    }
    expect(mockAddToast).toHaveBeenCalledWith(
      'Results exported to CSV',
      'success'
    );

    // Restore
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
