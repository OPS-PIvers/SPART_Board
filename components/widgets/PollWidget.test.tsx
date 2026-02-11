import { render, screen, fireEvent } from '@testing-library/react';
import { PollSettings, PollWidget } from './PollWidget';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { vi, describe, it, expect, Mock, beforeEach } from 'vitest';
import { WidgetData, PollConfig } from '../../types';
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

describe('PollWidget (View)', () => {
  const mockUpdateWidget = vi.fn();

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });
    vi.clearAllMocks();
  });

  const baseWidget: WidgetData = {
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
    } as PollConfig,
  };

  it('renders question and options correctly', () => {
    render(<PollWidget widget={baseWidget} />);

    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('2 (29%)')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('5 (71%)')).toBeInTheDocument();
  });

  it('handles voting interaction', () => {
    render(<PollWidget widget={baseWidget} />);

    // Click on Option A
    fireEvent.click(screen.getByText('Option A'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...baseWidget.config,
        options: [
          { label: 'Option A', votes: 3 }, // Incremented
          { label: 'Option B', votes: 5 },
        ],
      },
    });
  });

  it('handles reset interaction', () => {
    // Mock window.confirm to return true
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<PollWidget widget={baseWidget} />);

    // Click Reset Poll button
    fireEvent.click(screen.getByText(/Reset Poll/i));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...baseWidget.config,
        options: [
          { label: 'Option A', votes: 0 }, // Reset
          { label: 'Option B', votes: 0 }, // Reset
        ],
      },
    });
  });

  it('does not reset if confirmation is cancelled', () => {
    // Mock window.confirm to return false
    vi.spyOn(window, 'confirm').mockImplementation(() => false);

    render(<PollWidget widget={baseWidget} />);

    // Click Reset Poll button
    fireEvent.click(screen.getByText(/Reset Poll/i));

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });
});

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
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });
    (useAuth as Mock).mockReturnValue({
      canAccessFeature: mockCanAccessFeature,
    });
    vi.clearAllMocks();
  });

  const baseWidget: WidgetData = {
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
    } as PollConfig,
  };

  it('updates widget config when magic poll is generated', () => {
    render(<PollSettings widget={baseWidget} />);

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

  it('updates question', () => {
    render(<PollSettings widget={baseWidget} />);

    const questionInput = screen.getByDisplayValue('Original Question');
    fireEvent.change(questionInput, { target: { value: 'New Question' } });
    fireEvent.blur(questionInput);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...baseWidget.config,
        question: 'New Question',
      },
    });
  });

  it('adds a new option', () => {
    render(<PollSettings widget={baseWidget} />);

    fireEvent.click(screen.getByText('Add Option'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...baseWidget.config,
        options: [
          { label: 'Option 1', votes: 0 },
          { label: 'Option 2', votes: 0 },
        ],
      },
    });
  });

  it('removes an option', () => {
    render(<PollSettings widget={baseWidget} />);

    // Find the trash icon button. It has title "Remove Option"
    const deleteBtn = screen.getByTitle('Remove Option');
    fireEvent.click(deleteBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...baseWidget.config,
        options: [],
      },
    });
  });

  it('updates option label', () => {
    render(<PollSettings widget={baseWidget} />);

    const optionInput = screen.getByDisplayValue('Option 1');
    fireEvent.change(optionInput, { target: { value: 'Updated Option' } });
    fireEvent.blur(optionInput);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...baseWidget.config,
        options: [{ label: 'Updated Option', votes: 0 }],
      },
    });
  });

  it('imports from roster', () => {
    const mockRoster = {
      id: 'roster-1',
      name: 'Class A',
      students: [
        { id: 's1', firstName: 'John', lastName: 'Doe' },
        { id: 's2', firstName: 'Jane', lastName: 'Smith' },
      ],
    };

    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [mockRoster],
      activeRosterId: 'roster-1',
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });

    // Mock confirm for replacing options
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<PollSettings widget={baseWidget} />);

    fireEvent.click(screen.getByText('Import Class'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...baseWidget.config,
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

  it('exports to CSV', () => {
    // Mock URL.createObjectURL and HTMLAnchorElement click
    const createObjectURLMock = vi.fn(() => 'mock-url');
    const revokeObjectURLMock = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    // Spy on anchor click
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    render(<PollSettings widget={baseWidget} />);

    fireEvent.click(screen.getByText('Export CSV'));

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      'Results exported to CSV',
      'success'
    );

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('imports from roster without confirmation when no options exist', () => {
    const mockRoster = {
      id: 'roster-1',
      name: 'Class A',
      students: [{ id: 's1', firstName: 'John', lastName: 'Doe' }],
    };

    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [mockRoster],
      activeRosterId: 'roster-1',
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });

    const confirmSpy = vi.spyOn(window, 'confirm');

    const widgetWithoutOptions: WidgetData = {
      ...baseWidget,
      config: {
        ...(baseWidget.config as PollConfig),
        options: [],
      },
    };

    render(<PollSettings widget={widgetWithoutOptions} />);

    fireEvent.click(screen.getByText('Import Class'));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...widgetWithoutOptions.config,
        options: [{ label: 'John Doe', votes: 0 }],
      },
    });
  });

  it('disables import button if no roster is selected', () => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [],
      activeRosterId: null, // No active roster
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });

    render(<PollSettings widget={baseWidget} />);

    const importBtn = screen.getByRole('button', { name: /Import Class/i });
    expect(importBtn).toBeDisabled();
    expect(importBtn).toHaveAttribute(
      'title',
      'Select a class in the Classes widget'
    );
  });

  it('cancels import if confirmation is rejected', () => {
    const mockRoster = {
      id: 'roster-1',
      name: 'Class A',
      students: [{ id: 's1', firstName: 'John', lastName: 'Doe' }],
    };

    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [mockRoster],
      activeRosterId: 'roster-1',
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });

    // Mock confirm to return false
    vi.spyOn(window, 'confirm').mockImplementation(() => false);

    const widgetWithOptions: WidgetData = {
      ...baseWidget,
      config: {
        ...(baseWidget.config as PollConfig),
        options: [{ label: 'Existing Option', votes: 1 }],
      },
    };

    render(<PollSettings widget={widgetWithOptions} />);

    fireEvent.click(screen.getByText('Import Class'));

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('resets scores in settings', () => {
    // Mock confirm to return true
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    const widgetWithVotes: WidgetData = {
      ...baseWidget,
      config: {
        ...(baseWidget.config as PollConfig),
        options: [{ label: 'Option 1', votes: 5 }],
      },
    };

    render(<PollSettings widget={widgetWithVotes} />);

    fireEvent.click(screen.getByText('Reset'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: {
        ...baseWidget.config,
        options: [{ label: 'Option 1', votes: 0 }],
      },
    });
  });
});
