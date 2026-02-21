import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizImporter } from './QuizImporter';
import { generateQuiz } from '../../../utils/ai';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock generateQuiz
vi.mock('../../../utils/ai', () => ({
  generateQuiz: vi.fn(),
}));

describe('QuizImporter', () => {
  const mockOnBack = vi.fn();
  const mockOnSave = vi.fn();
  const mockImportFromSheet = vi.fn();
  const mockImportFromCSV = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Generate with AI" button', () => {
    render(
      <QuizImporter
        onBack={mockOnBack}
        onSave={mockOnSave}
        importFromSheet={mockImportFromSheet}
        importFromCSV={mockImportFromCSV}
      />
    );

    expect(screen.getByText('Generate with AI')).toBeInTheDocument();
  });

  it('opens and closes the AI generation overlay', () => {
    render(
      <QuizImporter
        onBack={mockOnBack}
        onSave={mockOnSave}
        importFromSheet={mockImportFromSheet}
        importFromCSV={mockImportFromCSV}
      />
    );

    // Click "Generate with AI"
    const generateButton = screen.getByText('Generate with AI');
    fireEvent.click(generateButton);

    // Check if overlay is open
    expect(screen.getByText(/Magic Quiz Creator/i)).toBeInTheDocument();

    // Click Close button (X icon)
    const closeButton = screen.getByLabelText('Close Magic Generator');
    fireEvent.click(closeButton);

    // Check if overlay is closed
    expect(screen.queryByText(/Magic Quiz Creator/i)).not.toBeInTheDocument();
  });

  it('closes the AI generation overlay when Escape key is pressed', async () => {
    render(
      <QuizImporter
        onBack={mockOnBack}
        onSave={mockOnSave}
        importFromSheet={mockImportFromSheet}
        importFromCSV={mockImportFromCSV}
      />
    );

    // Open overlay
    fireEvent.click(screen.getByText('Generate with AI'));

    // Verify overlay is open
    expect(screen.getByText(/Magic Quiz Creator/i)).toBeInTheDocument();

    // The overlay should be focused due to our fix
    // We can simulate the keydown on the active element or the overlay itself
    // Since we focus the overlayRef, we can fire on that element if we could find it,
    // or just fire on the document activeElement

    // Simulate Escape key press on the focused element
    // Note: In JSDOM, focus management might need help, so we target the focused element
    // or fire globally if the event listener was global (it's not, it's on the div).
    // The test environment might not automatically focus, but our useEffect does.
    // We'll trust the component logic sets focus and fire event on the overlay div.

    // Find the overlay div - likely by a contained text or role if we added one.
    // Since we didn't add role="dialog", we can find by text and traverse up or add a test id.
    // However, the event handler is on the backdrop div.
    // Let's assume the user interaction flow:

    // We need to trigger the keydown event on the element that has the listener.
    // In our implementation, the listener is on the container div.
    // We can find it by the text inside it.
    const overlayContainer = screen
      .getByText(/Magic Quiz Creator/i)
      .closest('div')?.parentElement;

    if (overlayContainer) {
      fireEvent.keyDown(overlayContainer, { key: 'Escape', code: 'Escape' });
    }

    // Verify overlay is closed
    await waitFor(() => {
      expect(screen.queryByText(/Magic Quiz Creator/i)).not.toBeInTheDocument();
    });
  });

  it('handles successful quiz generation with fallback defaults', async () => {
    // Missing timeLimit (should default to 30) and type (should default to MC)
    const mockQuizData = {
      title: 'Solar System Quiz',
      questions: [
        {
          text: 'Which planet is closest to the sun?',
          correctAnswer: 'Mercury',
          incorrectAnswers: ['Venus', 'Earth', 'Mars'],
          // missing timeLimit
          // missing type
        },
      ],
    };

    vi.mocked(generateQuiz).mockResolvedValue(
      mockQuizData as unknown as import('../../../utils/ai').GeneratedQuiz
    );

    render(
      <QuizImporter
        onBack={mockOnBack}
        onSave={mockOnSave}
        importFromSheet={mockImportFromSheet}
        importFromCSV={mockImportFromCSV}
      />
    );

    // Open overlay
    fireEvent.click(screen.getByText('Generate with AI'));

    // Type prompt
    const promptInput = screen.getByPlaceholderText(/e.g. A 5-question quiz/i);
    fireEvent.change(promptInput, { target: { value: 'Solar system quiz' } });

    // Click Generate
    const generateButton = screen.getByRole('button', {
      name: /generate quiz/i,
    });
    fireEvent.click(generateButton);

    // Wait for async generation
    await waitFor(() => {
      expect(generateQuiz).toHaveBeenCalledWith('Solar system quiz');
    });

    // Check if title is populated
    expect(screen.getByDisplayValue('Solar System Quiz')).toBeInTheDocument();

    // Verify question text
    expect(
      screen.getByText('Which planet is closest to the sun?')
    ).toBeInTheDocument();

    // Verify defaults were applied:
    // "MC" badge should be present
    expect(screen.getByText('MC')).toBeInTheDocument();
    // "30s" badge should be present (default timeLimit)
    expect(screen.getByText(/30s/)).toBeInTheDocument();
  });

  it('validates question types and falls back to MC for invalid types', async () => {
    const mockQuizData = {
      title: 'Invalid Type Quiz',
      questions: [
        {
          text: 'What is a closure?',
          type: 'INVALID_TYPE', // Should fallback to MC
          correctAnswer: 'A function bundled with its lexical environment',
          incorrectAnswers: [],
        },
      ],
    };

    vi.mocked(generateQuiz).mockResolvedValue(
      mockQuizData as unknown as import('../../../utils/ai').GeneratedQuiz
    );

    render(
      <QuizImporter
        onBack={mockOnBack}
        onSave={mockOnSave}
        importFromSheet={mockImportFromSheet}
        importFromCSV={mockImportFromCSV}
      />
    );

    fireEvent.click(screen.getByText('Generate with AI'));

    const promptInput = screen.getByPlaceholderText(/e.g. A 5-question quiz/i);
    fireEvent.change(promptInput, { target: { value: 'Coding quiz' } });

    const generateButton = screen.getByRole('button', {
      name: /generate quiz/i,
    });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Invalid Type Quiz')).toBeInTheDocument();
    });

    // Verify it defaulted to MC
    expect(screen.getByText('MC')).toBeInTheDocument();
  });

  it('handles generation error', async () => {
    vi.mocked(generateQuiz).mockRejectedValue(new Error('API Error'));

    render(
      <QuizImporter
        onBack={mockOnBack}
        onSave={mockOnSave}
        importFromSheet={mockImportFromSheet}
        importFromCSV={mockImportFromCSV}
      />
    );

    // Open overlay
    fireEvent.click(screen.getByText('Generate with AI'));

    // Type prompt
    const promptInput = screen.getByPlaceholderText(/e.g. A 5-question quiz/i);
    fireEvent.change(promptInput, { target: { value: 'Bad prompt' } });

    // Click Generate
    const generateButton = screen.getByRole('button', {
      name: /generate quiz/i,
    });
    fireEvent.click(generateButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});
