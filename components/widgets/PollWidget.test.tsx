import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PollWidget, PollSettings } from './PollWidget';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { vi, describe, it, expect, Mock, beforeEach } from 'vitest';
import { WidgetData, PollConfig } from '../../types';
import { GeneratedPoll } from '../../utils/ai';
import * as firestore from 'firebase/firestore';

// Mock useDashboard
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

// Mock useAuth
vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  increment: vi.fn((val) => val),
}));

vi.mock('@/config/firebase', () => ({
  db: {},
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

  beforeEach(() => {
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  const getBaseWidget = (): WidgetData => ({
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
        { label: 'Option A', votes: 1 },
        { label: 'Option B', votes: 2 },
      ],
    },
  });

  it('renders correctly with options', () => {
    render(<PollWidget widget={getBaseWidget()} />);
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('1 (33%)')).toBeInTheDocument();
    expect(screen.getByText('2 (67%)')).toBeInTheDocument();
  });

  it('calls updateWidget when an option is clicked in standard mode', () => {
    render(<PollWidget widget={getBaseWidget()} />);

    // Click "Option A"
    const optionABtn = screen.getByText('Option A').closest('button');
    fireEvent.click(optionABtn!);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Option A', votes: 2 },
          { label: 'Option B', votes: 2 },
        ],
      }),
    });
  });

  it('calls updateWidget when poll is reset', () => {
    render(<PollWidget widget={getBaseWidget()} />);

    const resetBtn = screen.getByText('Reset Poll');
    fireEvent.click(resetBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Option A', votes: 0 },
          { label: 'Option B', votes: 0 },
        ],
      }),
    });
  });

  it('handles announcement mode correctly', async () => {
    // Mock onSnapshot to immediately yield votes
    (firestore.onSnapshot as Mock).mockImplementation((ref, callback) => {
      callback([
        { id: '0', data: () => ({ count: 5 }) },
        { id: '1', data: () => ({ count: 10 }) },
      ]);
      return vi.fn(); // unsub
    });

    const widget = getBaseWidget();
    (widget.config as PollConfig & { _announcementId?: string })._announcementId = 'ann-123';

    render(<PollWidget widget={widget} />);

    // Wait for state to update
    await waitFor(() => {
      // 5 + 10 = 15 total. 5/15 = 33%. 10/15 = 67%
      expect(screen.getByText('5 (33%)')).toBeInTheDocument();
      expect(screen.getByText('10 (67%)')).toBeInTheDocument();
    });

    // Reset button should not be present in announcement mode
    expect(screen.queryByText('Reset Poll')).not.toBeInTheDocument();

    // Vote in announcement mode
    const optionABtn = screen.getByText('Option A').closest('button');
    fireEvent.click(optionABtn!);

    expect(firestore.setDoc).toHaveBeenCalled();
    expect(screen.getByText('✓ Vote recorded!')).toBeInTheDocument();

    // Check if double voting is prevented
    (firestore.setDoc as Mock).mockClear();
    fireEvent.click(optionABtn!);
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });

  it('does not reset if confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PollWidget widget={getBaseWidget()} />);

    const resetBtn = screen.getByText('Reset Poll');
    fireEvent.click(resetBtn);

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
    });
    (useAuth as Mock).mockReturnValue({
      canAccessFeature: mockCanAccessFeature,
    });
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
  });

  const getBaseWidget = (): WidgetData => ({
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
        { label: 'Option 1', votes: 1 },
        { label: 'Option 2', votes: 0 },
      ],
    },
  });

  it('updates widget config when magic poll is generated', () => {
    render(<PollSettings widget={getBaseWidget()} />);

    const magicBtn = screen.getByTestId('magic-btn');
    fireEvent.click(magicBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        question: 'Magic Question?',
        options: [
          { label: 'Opt1', votes: 0 },
          { label: 'Opt2', votes: 0 },
          { label: 'Opt3', votes: 0 },
          { label: 'Opt4', votes: 0 },
        ],
      }),
    });
    expect(mockAddToast).toHaveBeenCalledWith(
      'Poll generated magically!',
      'success'
    );
  });

  it('allows editing the question', () => {
    render(<PollSettings widget={getBaseWidget()} />);

    const input = screen.getByPlaceholderText('Enter your question...');
    fireEvent.change(input, { target: { value: 'New Question?' } });
    fireEvent.blur(input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({ question: 'New Question?' }),
    });
  });

  it('allows adding an option', () => {
    render(<PollSettings widget={getBaseWidget()} />);

    const addBtn = screen.getByText('Add Option');
    fireEvent.click(addBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Option 1', votes: 1 },
          { label: 'Option 2', votes: 0 },
          { label: 'Option 3', votes: 0 },
        ],
      }),
    });
  });

  it('allows removing an option', () => {
    render(<PollSettings widget={getBaseWidget()} />);

    const removeBtns = screen.getAllByTitle('Remove Option');
    fireEvent.click(removeBtns[0]); // Remove first option

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [{ label: 'Option 2', votes: 0 }],
      }),
    });
  });

  it('allows editing an option label', () => {
    render(<PollSettings widget={getBaseWidget()} />);

    const input = screen.getByDisplayValue('Option 1');
    fireEvent.change(input, { target: { value: 'Updated Option' } });
    fireEvent.blur(input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Updated Option', votes: 1 },
          { label: 'Option 2', votes: 0 },
        ],
      }),
    });
  });

  it('resets the poll', () => {
    render(<PollSettings widget={getBaseWidget()} />);

    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
      config: expect.objectContaining({
        options: [
          { label: 'Option 1', votes: 0 },
          { label: 'Option 2', votes: 0 },
        ],
      }),
    });
  });

  it('does not reset if confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PollSettings widget={getBaseWidget()} />);

    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('exports to CSV', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const originalCreateElement = document.createElement.bind(document);

    // We need to return an actual DOM node so `appendChild` succeeds.
    const mockAnchor = originalCreateElement('a');
    mockAnchor.click = vi.fn();
    mockAnchor.setAttribute = vi.fn();

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockAnchor;
      }
      return originalCreateElement(tagName);
    });

    render(<PollSettings widget={getBaseWidget()} />);

    const exportBtn = screen.getByText('Export CSV');
    fireEvent.click(exportBtn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      'Results exported to CSV',
      'success'
    );
  });

  describe('Import from Roster', () => {
    it('shows error toast when no roster is selected', () => {
      // Temporarily bypass the disable logic to hit the dead code branch
      (useDashboard as Mock).mockReturnValue({
        updateWidget: mockUpdateWidget,
        addToast: mockAddToast,
        rosters: [],
        activeRosterId: 'invalid-id-so-activeRoster-is-undefined',
      });

      // We render it with activeRosterId set, but since rosters is empty, activeRoster is undefined.
      // Wait, disabled is `!activeRoster`, so it would STILL be disabled.
      // So we have to test it by directly mocking activeRoster to something truthy during render,
      // and falsy during click? No, React state.
      // Let's just find the button and call its onClick prop using fireEvent.
      render(<PollSettings widget={getBaseWidget()} />);

      const importBtn = screen.getByRole('button', { name: /import class/i });

      // We remove the disabled attribute and dispatch a click using its react props
      // since the common Button component might be consuming it and blocking it
      const propsKey = Object.keys(importBtn).find((k) =>
        k.startsWith('__reactProps')
      );
      if (propsKey) {
        // @ts-ignore
        importBtn[propsKey].onClick();
      }

      expect(mockAddToast).toHaveBeenCalledWith(
        'No active class roster selected!',
        'error'
      );
    });

    it('imports from active roster', () => {
      (useDashboard as Mock).mockReturnValue({
        updateWidget: mockUpdateWidget,
        addToast: mockAddToast,
        rosters: [
          {
            id: 'roster-1',
            name: 'Math Class',
            students: [
              { firstName: 'Alice', lastName: 'A' },
              { firstName: 'Bob', lastName: 'B' },
            ],
          },
        ],
        activeRosterId: 'roster-1',
      });

      render(<PollSettings widget={getBaseWidget()} />);

      const importBtn = screen.getByText('Import Class');
      fireEvent.click(importBtn);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: expect.objectContaining({
          options: [
            { label: 'Alice A', votes: 0 },
            { label: 'Bob B', votes: 0 },
          ],
        }),
      });
      expect(mockAddToast).toHaveBeenCalledWith(
        'Imported 2 students!',
        'success'
      );
    });

    it('does not import if user cancels confirm when options exist', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      (useDashboard as Mock).mockReturnValue({
        updateWidget: mockUpdateWidget,
        addToast: mockAddToast,
        rosters: [
          {
            id: 'roster-1',
            name: 'Math Class',
            students: [{ firstName: 'Alice', lastName: 'A' }],
          },
        ],
        activeRosterId: 'roster-1',
      });

      render(<PollSettings widget={getBaseWidget()} />);

      const importBtn = screen.getByText('Import Class');
      fireEvent.click(importBtn);

      expect(mockUpdateWidget).not.toHaveBeenCalled();
    });

    it('does not prompt if options is empty', () => {
      vi.spyOn(window, 'confirm').mockClear();
      (useDashboard as Mock).mockReturnValue({
        updateWidget: mockUpdateWidget,
        addToast: mockAddToast,
        rosters: [
          {
            id: 'roster-1',
            name: 'Math Class',
            students: [{ firstName: 'Alice', lastName: 'A' }],
          },
        ],
        activeRosterId: 'roster-1',
      });

      const widget = getBaseWidget();
      (widget.config as PollConfig).options = [];

      render(<PollSettings widget={widget} />);

      const importBtn = screen.getByText('Import Class');
      fireEvent.click(importBtn);

      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: expect.objectContaining({
          options: [{ label: 'Alice A', votes: 0 }],
        }),
      });
    });
  });
});
