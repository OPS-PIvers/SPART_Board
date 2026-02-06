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

// Mock useScaledFont
vi.mock('../../hooks/useScaledFont', () => ({
  useScaledFont: vi.fn(() => 16),
}));

// Mock MagicInput
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

describe('PollWidget & PollSettings', () => {
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

    // Global mocks
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PollWidget (View)', () => {
    const mockWidget: WidgetData = {
      id: 'poll-1',
      type: 'poll',
      w: 4,
      h: 4,
      x: 0,
      y: 0,
      z: 1,
      flipped: false,
      config: {
        question: 'What is your favorite color?',
        options: [
          { label: 'Red', votes: 2 },
          { label: 'Blue', votes: 5 },
        ],
      },
    };

    it('renders question and options correctly', () => {
      render(<PollWidget widget={mockWidget} />);
      expect(
        screen.getByText('What is your favorite color?')
      ).toBeInTheDocument();
      expect(screen.getByText('Red')).toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
      expect(screen.getByText('2 (29%)')).toBeInTheDocument(); // 2 / 7 = ~29%
      expect(screen.getByText('5 (71%)')).toBeInTheDocument(); // 5 / 7 = ~71%
    });

    it('triggers updateWidget when voting', () => {
      render(<PollWidget widget={mockWidget} />);

      // Vote for Red
      fireEvent.click(screen.getByText('Red'));

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: {
          question: 'What is your favorite color?',
          options: [
            { label: 'Red', votes: 3 }, // Incremented
            { label: 'Blue', votes: 5 },
          ],
        },
      });
    });

    it('triggers updateWidget when resetting via button', () => {
      render(<PollWidget widget={mockWidget} />);

      const resetBtn = screen.getByText(/Reset Poll/i);
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

  // Existing test preserved
  describe('PollSettings', () => {
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
        question: 'Original Question',
        options: [{ label: 'Option 1', votes: 0 }],
      },
    };

    it('updates widget config when magic poll is generated', () => {
      const mockWidget: WidgetData = {
        ...defaultWidget,
        config: { ...defaultWidget.config, options: [] },
      };

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

    it('updates question on blur', () => {
      render(<PollSettings widget={defaultWidget} />);
      const input = screen.getByPlaceholderText('Enter your question...');
      fireEvent.change(input, { target: { value: 'New Question' } });
      fireEvent.blur(input);

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: { ...defaultWidget.config, question: 'New Question' },
      });
    });

    it('adds a new option', () => {
      render(<PollSettings widget={defaultWidget} />);
      fireEvent.click(screen.getByText('Add Option'));

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: {
          ...defaultWidget.config,
          options: [
            { label: 'Option 1', votes: 0 },
            { label: 'Option 2', votes: 0 },
          ],
        },
      });
    });

    it('removes an option', () => {
      render(<PollSettings widget={defaultWidget} />);
      fireEvent.click(screen.getByTitle('Remove Option'));

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: { ...defaultWidget.config, options: [] },
      });
    });

    it('updates option label', () => {
      render(<PollSettings widget={defaultWidget} />);
      const inputs = screen.getAllByRole('textbox');
      // The first textbox is "Magic Generator" (hidden/mocked but label exists),
      // then "Question", then "Option 1".
      // Actually `OptionInput` uses `placeholder="Option {index+1}"` and type="text".
      // Let's find by display value or placeholder.
      const optionInput = screen.getByDisplayValue('Option 1');

      fireEvent.change(optionInput, { target: { value: 'Updated Option' } });
      fireEvent.blur(optionInput);

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: {
          ...defaultWidget.config,
          options: [{ label: 'Updated Option', votes: 0 }],
        },
      });
    });

    it('imports from class roster', () => {
      (useDashboard as Mock).mockReturnValue({
        updateWidget: mockUpdateWidget,
        addToast: mockAddToast,
        rosters: [
          {
            id: 'roster-1',
            name: 'Class A',
            students: [
              { firstName: 'John', lastName: 'Doe' },
              { firstName: 'Jane', lastName: 'Smith' },
            ],
          },
        ],
        activeRosterId: 'roster-1',
        activeDashboard: { globalStyle: { fontFamily: 'sans' } },
      });

      render(<PollSettings widget={defaultWidget} />);

      // Since options exist, it asks for confirmation
      const importBtn = screen.getByText('Import Class');
      fireEvent.click(importBtn);

      expect(window.confirm).toHaveBeenCalledWith(
        'This will replace current options. Continue?'
      );
      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: {
          ...defaultWidget.config,
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
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
      const createElementSpy = vi.spyOn(document, 'createElement');

      render(<PollSettings widget={defaultWidget} />);
      fireEvent.click(screen.getByText('Export CSV'));

      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Find the anchor element created
      // Note: we need to cast to any or check instance because strict type checking might fail if not fully matched
      const anchor = createElementSpy.mock.results.find(
        (r) => r.value instanceof HTMLAnchorElement
      )?.value as HTMLAnchorElement;

      expect(anchor).toBeDefined();
      expect(anchor.download).toContain('Poll_Results_');
      expect(clickSpy).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        'Results exported to CSV',
        'success'
      );
    });
  });
});
