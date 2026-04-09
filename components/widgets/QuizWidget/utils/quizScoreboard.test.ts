import { describe, it, expect, vi } from 'vitest';

vi.mock('@/hooks/useQuizSession', () => ({
  gradeAnswer: vi.fn(
    (
      question: { correctAnswer: string; type: string },
      answer: string
    ): boolean => {
      const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
      return norm(question.correctAnswer) === norm(answer);
    }
  ),
}));

vi.mock('@/config/scoreboard', () => ({
  SCOREBOARD_COLORS: [
    'bg-blue-500',
    'bg-red-500',
    'bg-green-500',
    'bg-yellow-500',
  ],
}));

import {
  getEarnedPoints,
  getResponseScore,
  buildPinToNameMap,
  buildScoreboardTeams,
} from './quizScoreboard';
import type { QuizResponse, QuizQuestion, ClassRoster } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeQuestion(
  id: string,
  correctAnswer: string,
  points?: number
): QuizQuestion {
  return {
    id,
    text: `Question ${id}`,
    type: 'MC',
    correctAnswer,
    incorrectAnswers: ['wrong1', 'wrong2'],
    timeLimit: 0,
    ...(points !== undefined ? { points } : {}),
  };
}

function makeResponse(
  pin: string,
  answers: { questionId: string; answer: string }[],
  status: 'joined' | 'in-progress' | 'completed' = 'completed'
): QuizResponse {
  return {
    studentUid: `uid-${pin}`,
    pin,
    joinedAt: Date.now(),
    status,
    answers: answers.map((a) => ({
      ...a,
      answeredAt: Date.now(),
    })),
    score: null,
    submittedAt: status === 'completed' ? Date.now() : null,
  };
}

function makeRoster(
  name: string,
  students: { firstName: string; lastName: string; pin: string }[]
): ClassRoster {
  return {
    id: `roster-${name}`,
    name,
    driveFileId: null,
    studentCount: students.length,
    createdAt: Date.now(),
    students: students.map((s) => ({
      id: `student-${s.pin}`,
      ...s,
    })),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('quizScoreboard', () => {
  describe('getEarnedPoints', () => {
    it('returns points for correct answers', () => {
      const questions = [makeQuestion('q1', 'A'), makeQuestion('q2', 'B')];
      const response = makeResponse('01', [
        { questionId: 'q1', answer: 'A' },
        { questionId: 'q2', answer: 'B' },
      ]);
      expect(getEarnedPoints(response, questions)).toBe(2);
    });

    it('returns 0 for wrong answers', () => {
      const questions = [makeQuestion('q1', 'A')];
      const response = makeResponse('01', [{ questionId: 'q1', answer: 'X' }]);
      expect(getEarnedPoints(response, questions)).toBe(0);
    });

    it('returns 0 for missing answers', () => {
      const questions = [makeQuestion('q1', 'A'), makeQuestion('q2', 'B')];
      const response = makeResponse('01', []);
      expect(getEarnedPoints(response, questions)).toBe(0);
    });

    it('respects custom point values', () => {
      const questions = [
        makeQuestion('q1', 'A', 5),
        makeQuestion('q2', 'B', 10),
      ];
      const response = makeResponse('01', [
        { questionId: 'q1', answer: 'A' },
        { questionId: 'q2', answer: 'wrong' },
      ]);
      expect(getEarnedPoints(response, questions)).toBe(5);
    });

    it('defaults to 1 point when points is undefined', () => {
      const questions = [makeQuestion('q1', 'A')];
      const response = makeResponse('01', [{ questionId: 'q1', answer: 'A' }]);
      expect(getEarnedPoints(response, questions)).toBe(1);
    });
  });

  describe('getResponseScore', () => {
    it('calculates percentage correctly', () => {
      const questions = [makeQuestion('q1', 'A'), makeQuestion('q2', 'B')];
      const response = makeResponse('01', [
        { questionId: 'q1', answer: 'A' },
        { questionId: 'q2', answer: 'wrong' },
      ]);
      expect(getResponseScore(response, questions)).toBe(50);
    });

    it('returns 100 for all correct', () => {
      const questions = [makeQuestion('q1', 'A')];
      const response = makeResponse('01', [{ questionId: 'q1', answer: 'A' }]);
      expect(getResponseScore(response, questions)).toBe(100);
    });

    it('returns 0 when no questions exist (zero max points)', () => {
      const response = makeResponse('01', []);
      expect(getResponseScore(response, [])).toBe(0);
    });

    it('rounds to the nearest integer', () => {
      const questions = [
        makeQuestion('q1', 'A'),
        makeQuestion('q2', 'B'),
        makeQuestion('q3', 'C'),
      ];
      const response = makeResponse('01', [
        { questionId: 'q1', answer: 'A' },
        { questionId: 'q2', answer: 'wrong' },
        { questionId: 'q3', answer: 'wrong' },
      ]);
      // 1/3 = 33.33... -> 33
      expect(getResponseScore(response, questions)).toBe(33);
    });
  });

  describe('buildPinToNameMap', () => {
    it('returns a map from PIN to full name when roster matches', () => {
      const rosters = [
        makeRoster('Period 1', [
          { firstName: 'Alice', lastName: 'Smith', pin: '01' },
          { firstName: 'Bob', lastName: 'Jones', pin: '02' },
        ]),
      ];
      const map = buildPinToNameMap(rosters, 'Period 1');
      expect(map).toEqual({
        '01': 'Alice Smith',
        '02': 'Bob Jones',
      });
    });

    it('returns empty map when no matching roster is found', () => {
      const rosters = [
        makeRoster('Period 1', [
          { firstName: 'Alice', lastName: 'Smith', pin: '01' },
        ]),
      ];
      const map = buildPinToNameMap(rosters, 'Period 2');
      expect(map).toEqual({});
    });

    it('returns empty map when periodName is undefined', () => {
      const rosters = [
        makeRoster('Period 1', [
          { firstName: 'Alice', lastName: 'Smith', pin: '01' },
        ]),
      ];
      const map = buildPinToNameMap(rosters, undefined);
      expect(map).toEqual({});
    });

    it('skips students without PINs', () => {
      const rosters = [
        makeRoster('Period 1', [
          { firstName: 'Alice', lastName: 'Smith', pin: '' },
          { firstName: 'Bob', lastName: 'Jones', pin: '02' },
        ]),
      ];
      const map = buildPinToNameMap(rosters, 'Period 1');
      expect(map).toEqual({
        '02': 'Bob Jones',
      });
    });

    it('handles students with only first name', () => {
      const rosters = [
        makeRoster('Period 1', [
          { firstName: 'Cher', lastName: '', pin: '01' },
        ]),
      ];
      const map = buildPinToNameMap(rosters, 'Period 1');
      expect(map).toEqual({ '01': 'Cher' });
    });
  });

  describe('buildScoreboardTeams', () => {
    it('sorts teams by score descending', () => {
      const questions = [makeQuestion('q1', 'A'), makeQuestion('q2', 'B')];
      const responses = [
        makeResponse('01', [
          { questionId: 'q1', answer: 'A' },
          { questionId: 'q2', answer: 'wrong' },
        ]),
        makeResponse('02', [
          { questionId: 'q1', answer: 'A' },
          { questionId: 'q2', answer: 'B' },
        ]),
      ];
      const teams = buildScoreboardTeams(responses, questions, 'pin', {});
      expect(teams[0].name).toBe('PIN 02');
      expect(teams[0].score).toBe(100);
      expect(teams[1].name).toBe('PIN 01');
      expect(teams[1].score).toBe(50);
    });

    it('uses PIN mode for names', () => {
      const questions = [makeQuestion('q1', 'A')];
      const responses = [
        makeResponse('03', [{ questionId: 'q1', answer: 'A' }]),
      ];
      const teams = buildScoreboardTeams(responses, questions, 'pin', {
        '03': 'Alice Smith',
      });
      expect(teams[0].name).toBe('PIN 03');
    });

    it('uses name mode and falls back to PIN when name not in roster', () => {
      const questions = [makeQuestion('q1', 'A')];
      const responses = [
        makeResponse('03', [{ questionId: 'q1', answer: 'A' }]),
        makeResponse('04', [{ questionId: 'q1', answer: 'A' }]),
      ];
      const pinToName = { '03': 'Alice Smith' };
      const teams = buildScoreboardTeams(
        responses,
        questions,
        'name',
        pinToName
      );
      expect(teams[0].name).toBe('Alice Smith');
      expect(teams[1].name).toBe('PIN 04');
    });

    it('assigns colors from SCOREBOARD_COLORS by PIN index', () => {
      const questions = [makeQuestion('q1', 'A')];
      const responses = [
        makeResponse('00', [{ questionId: 'q1', answer: 'A' }]),
        makeResponse('05', [{ questionId: 'q1', answer: 'A' }]),
      ];
      const teams = buildScoreboardTeams(responses, questions, 'pin', {});
      // PIN 00 -> index 0 % 4 = 0 -> 'bg-blue-500'
      // PIN 05 -> index 5 % 4 = 1 -> 'bg-red-500'
      // Note: order is by score (tie), then by original order
      expect(teams[0].color).toBe('bg-blue-500');
      expect(teams[1].color).toBe('bg-red-500');
    });

    it('returns empty array for no responses', () => {
      const questions = [makeQuestion('q1', 'A')];
      const teams = buildScoreboardTeams([], questions, 'pin', {});
      expect(teams).toEqual([]);
    });
  });
});
