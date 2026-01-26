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

// Mock useScaledFont to avoid layout dependencies
vi.mock('../../hooks/useScaledFont', () => ({
  useScaledFont: () => 16,
}));

describe('PollWidget Tests', () => {
  const mockUpdateWidget = vi.fn();
  const mockAddToast = vi.fn();
  const mockCanAccessFeature = vi.fn(() => true);

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
      question: 'Test Question',
      options: [
        { label: 'Yes', votes: 2 },
        { label: 'No', votes: 1 },
      ],
    },
  };

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

    // Use spyOn for window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PollWidget Component', () => {
    it('renders question and options correctly', () => {
      render(<PollWidget widget={defaultWidget} />);
      expect(screen.getByText('Test Question')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('2 (67%)')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.getByText('1 (33%)')).toBeInTheDocument();
    });

    it('votes for an option when clicked', () => {
      render(<PollWidget widget={defaultWidget} />);
      // Find the button for "Yes" option
      const yesButton = screen.getByText('Yes').closest('button');
      fireEvent.click(yesButton!);

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: {
          question: 'Test Question',
          options: [
            { label: 'Yes', votes: 3 },
            { label: 'No', votes: 1 },
          ],
        },
      });
    });

    it('resets votes when reset button is clicked and confirmed', () => {
      render(<PollWidget widget={defaultWidget} />);
      const resetBtn = screen.getByText(/Reset Poll/i);
      fireEvent.click(resetBtn);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: {
          question: 'Test Question',
          options: [
            { label: 'Yes', votes: 0 },
            { label: 'No', votes: 0 },
          ],
        },
      });
    });

    it('does not reset if confirm is cancelled', () => {
      (window.confirm as Mock).mockReturnValue(false);
      render(<PollWidget widget={defaultWidget} />);
      const resetBtn = screen.getByText(/Reset Poll/i);
      fireEvent.click(resetBtn);

      expect(mockUpdateWidget).not.toHaveBeenCalled();
    });
  });

  describe('PollSettings Component', () => {
    it('updates question', () => {
      render(<PollSettings widget={defaultWidget} />);
      const questionInput = screen.getByPlaceholderText('Enter your question...');
      fireEvent.change(questionInput, { target: { value: 'New Question' } });
      fireEvent.blur(questionInput);

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: expect.objectContaining({ question: 'New Question' }),
      });
    });

    it('adds a new option', () => {
      render(<PollSettings widget={defaultWidget} />);
      const addBtn = screen.getByText('Add Option');
      fireEvent.click(addBtn);

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: expect.objectContaining({
            options: [
                ...defaultWidget.config.options,
                { label: 'Option 3', votes: 0 }
            ]
        }),
      });
    });

    it('removes an option', () => {
      render(<PollSettings widget={defaultWidget} />);
      // There are 2 options, so 2 remove buttons. Click the first one.
      const removeBtns = screen.getAllByTitle('Remove Option');
      fireEvent.click(removeBtns[0]);

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: expect.objectContaining({
            options: [{ label: 'No', votes: 1 }]
        }),
      });
    });

    it('updates option label', () => {
      render(<PollSettings widget={defaultWidget} />);
      const optionInputs = screen.getAllByPlaceholderText(/Option \d/);
      // Change "Yes" (first option) to "Maybe"
      fireEvent.change(optionInputs[0], { target: { value: 'Maybe' } });
      fireEvent.blur(optionInputs[0]);

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: expect.objectContaining({
            options: [
                { label: 'Maybe', votes: 2 },
                { label: 'No', votes: 1 },
            ]
        }),
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

      // Mock confirm for overwriting existing options
      (window.confirm as Mock).mockReturnValue(true);

      render(<PollSettings widget={defaultWidget} />);
      const importBtn = screen.getByText('Import Class');
      fireEvent.click(importBtn);

      expect(mockUpdateWidget).toHaveBeenCalledWith('poll-1', {
        config: expect.objectContaining({
            options: [
                { label: 'John Doe', votes: 0 },
                { label: 'Jane Smith', votes: 0 },
            ]
        }),
      });
      expect(mockAddToast).toHaveBeenCalledWith('Imported 2 students!', 'success');
    });

    it('exports to CSV', () => {
       // Mock URL.createObjectURL and URL.revokeObjectURL using spyOn
       const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
       const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

       const mockLink = {
           setAttribute: vi.fn(),
           click: vi.fn(),
           style: {},
       } as unknown as HTMLAnchorElement;

       const originalCreateElement = document.createElement.bind(document);
       const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
           if (tagName === 'a') return mockLink;
           return originalCreateElement(tagName, options);
       });

       render(<PollSettings widget={defaultWidget} />);

       // Spy on appendChild/removeChild AFTER render to avoid interfering with React mounting
       const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
       const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

       const exportBtn = screen.getByText('Export CSV');
       fireEvent.click(exportBtn);

       expect(createObjectURLSpy).toHaveBeenCalled();
       expect(createElementSpy).toHaveBeenCalledWith('a');
       expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:url');
       expect(mockLink.click).toHaveBeenCalled();
       expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url');
       expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
       expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('generates poll with magic input', () => {
      render(<PollSettings widget={defaultWidget} />);
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
    });
  });
});
