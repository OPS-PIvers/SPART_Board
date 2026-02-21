import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizImporter } from './QuizImporter';
import { generateQuiz } from '@/utils/ai';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock generateQuiz
vi.mock('@/utils/ai', () => ({
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
    expect(
      screen.queryByText('Describe the quiz you want to create.')
    ).not.toBeInTheDocument();
  });

  it('handles successful quiz generation', async () => {
    const mockQuizData = {
      title: 'Solar System Quiz',
      questions: [
        {
          text: 'Which planet is closest to the sun?',
          type: 'MC',
          correctAnswer: 'Mercury',
          incorrectAnswers: ['Venus', 'Earth', 'Mars'],
          timeLimit: 30,
        },
      ],
    };

    // Use vi.mocked to properly type the mock
    vi.mocked(generateQuiz).mockResolvedValue(mockQuizData);

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
    // Find the button inside the overlay
    const generateButton = screen.getByRole('button', {
      name: /generate quiz/i,
    });
    fireEvent.click(generateButton);

    // Wait for async generation
    await waitFor(() => {
      expect(generateQuiz).toHaveBeenCalledWith('Solar system quiz');
    });

    // Check if title and questions are populated in the main view
    expect(screen.getByDisplayValue('Solar System Quiz')).toBeInTheDocument();
    expect(
      screen.getByText('Which planet is closest to the sun?')
    ).toBeInTheDocument();
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
