import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizResults } from './QuizResults';
import { useDashboard } from '@/context/useDashboard';
import { useAuth } from '@/context/useAuth';
import { QuizData, QuizResponse, ScoreboardConfig, ScoreboardTeam } from '@/types';

// Mock hooks
vi.mock('@/context/useDashboard');
vi.mock('@/context/useAuth');
vi.mock('@/utils/quizDriveService'); // Mock service to avoid actual API calls

// Mock types
const mockQuiz: QuizData = {
  id: 'quiz-1',
  title: 'Test Quiz',
  questions: [
    {
      id: 'q1',
      text: 'Question 1',
      type: 'MC',
      timeLimit: 0,
      correctAnswer: 'A',
      incorrectAnswers: ['B', 'C', 'D'],
    },
  ],
  createdAt: 0,
  updatedAt: 0,
};

const mockResponses: QuizResponse[] = [
  {
    studentUid: 's1',
    pin: '01',
    joinedAt: 0,
    status: 'completed',
    answers: [{ questionId: 'q1', answer: 'A', answeredAt: 0 }], // Correct
    score: 100,
    submittedAt: 0,
  },
  {
    studentUid: 's2',
    pin: '02',
    joinedAt: 0,
    status: 'completed',
    answers: [{ questionId: 'q1', answer: 'B', answeredAt: 0 }], // Incorrect
    score: 0,
    submittedAt: 0,
  },
];

describe('QuizResults', () => {
  const mockUpdateWidget = vi.fn();
  const mockAddWidget = vi.fn();
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ googleAccessToken: 'token' });
    (useDashboard as any).mockReturnValue({
      activeDashboard: { widgets: [] },
      activeRosterId: null,
      rosters: [],
      updateWidget: mockUpdateWidget,
      addWidget: mockAddWidget,
      addToast: mockAddToast,
    });
  });

  it('renders "Send to Scoreboard" button when there are completed responses', () => {
    render(
      <QuizResults
        quiz={mockQuiz}
        responses={mockResponses}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTitle('Create Scoreboard')).toBeInTheDocument();
  });

  it('does not render "Send to Scoreboard" button when there are no completed responses', () => {
    render(
      <QuizResults
        quiz={mockQuiz}
        responses={[]}
        onBack={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Create Scoreboard')).not.toBeInTheDocument();
  });

  it('creates a new scoreboard when none exists', () => {
    render(
      <QuizResults
        quiz={mockQuiz}
        responses={mockResponses}
        onBack={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Create Scoreboard'));

    expect(mockAddWidget).toHaveBeenCalledWith('scoreboard', expect.objectContaining({
      config: expect.objectContaining({
        teams: expect.arrayContaining([
          expect.objectContaining({ name: 'PIN 01', score: 100 }),
          expect.objectContaining({ name: 'PIN 02', score: 0 }),
        ]),
      }),
    }));
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Created scoreboard'), 'success');
  });

  it('updates existing scoreboard when one exists', () => {
    const existingScoreboard = { id: 'sb-1', type: 'scoreboard', config: { teams: [] } };
    (useDashboard as any).mockReturnValue({
      activeDashboard: { widgets: [existingScoreboard] },
      activeRosterId: null,
      rosters: [],
      updateWidget: mockUpdateWidget,
      addWidget: mockAddWidget,
      addToast: mockAddToast,
    });

    render(
      <QuizResults
        quiz={mockQuiz}
        responses={mockResponses}
        onBack={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Create Scoreboard'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('sb-1', expect.objectContaining({
      config: expect.objectContaining({
        teams: expect.arrayContaining([
          expect.objectContaining({ name: 'PIN 01', score: 100 }),
          expect.objectContaining({ name: 'PIN 02', score: 0 }),
        ]),
      }),
    }));
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Updated scoreboard'), 'success');
  });

  it('uses student names from roster if available', () => {
    const mockRoster = {
      id: 'roster-1',
      students: [
        { id: 's1-real', pin: '01', firstName: 'John', lastName: 'Doe' },
      ],
    };

    (useDashboard as any).mockReturnValue({
      activeDashboard: { widgets: [] },
      activeRosterId: 'roster-1',
      rosters: [mockRoster],
      updateWidget: mockUpdateWidget,
      addWidget: mockAddWidget,
      addToast: mockAddToast,
    });

    render(
      <QuizResults
        quiz={mockQuiz}
        responses={mockResponses}
        onBack={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Create Scoreboard'));

    expect(mockAddWidget).toHaveBeenCalledWith('scoreboard', expect.objectContaining({
      config: expect.objectContaining({
        teams: expect.arrayContaining([
          expect.objectContaining({ name: 'John Doe', score: 100 }),
          expect.objectContaining({ name: 'PIN 02', score: 0 }),
        ]),
      }),
    }));
  });
});
