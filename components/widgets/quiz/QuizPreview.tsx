/**
 * QuizPreview — interactive preview of a quiz in student-like view.
 * Teachers navigate through questions and see correct/incorrect highlighting.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Timer,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { QuizData, QuizQuestion } from '@/types';
import { gradeAnswer } from '@/hooks/useQuizSession';

/** Unbiased Fisher-Yates in-place shuffle (returns new array) */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface QuizPreviewProps {
  quiz: QuizData;
  onBack: () => void;
}

export const QuizPreview: React.FC<QuizPreviewProps> = ({ quiz, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const question = quiz.questions[currentIndex];

  const reset = useCallback(() => {
    setSelectedAnswer(null);
    setShowAnswer(false);
    const tl = question?.timeLimit ?? 0;
    setTimeLeft(tl > 0 ? tl : null);
  }, [question]);

  // Reset state when question changes
  useEffect(() => {
    setTimeout(reset, 0);
  }, [currentIndex, reset]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || showAnswer) return;
    if (timeLeft <= 0) {
      setTimeout(() => setShowAnswer(true), 0);
      return;
    }
    const id = setInterval(
      () => setTimeLeft((t) => (t !== null ? t - 1 : null)),
      1000
    );
    return () => clearInterval(id);
  }, [timeLeft, showAnswer]);

  // Shuffle once per question object to avoid reshuffling on every timer tick or
  // answer-state change. question is stable between state changes within the same
  // question (only changes when currentIndex changes). Must run before any early return.
  const shuffledOptions = useMemo(() => {
    if (question?.type !== 'MC') return [];
    const all = [
      question.correctAnswer,
      ...question.incorrectAnswers.filter(Boolean),
    ];
    return fisherYatesShuffle(all);
  }, [question]);

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <p className="text-sm">This quiz has no questions yet.</p>
        <button
          onClick={onBack}
          className="text-xs text-violet-400 hover:underline"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-xs text-slate-400">Preview · {quiz.title}</p>
          <p className="text-xs text-slate-500">
            {currentIndex + 1} / {quiz.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft !== null && !showAnswer && (
            <div
              className={`flex items-center gap-1 text-xs font-mono ${timeLeft <= 5 ? 'text-red-400' : 'text-amber-400'}`}
            >
              <Timer className="w-3.5 h-3.5" />
              {timeLeft}s
            </div>
          )}
          <button
            onClick={reset}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400"
            title="Reset question"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                question.type === 'MC'
                  ? 'bg-blue-500/20 text-blue-300'
                  : question.type === 'FIB'
                    ? 'bg-amber-500/20 text-amber-300'
                    : question.type === 'Matching'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-teal-500/20 text-teal-300'
              }`}
            >
              {question.type === 'MC'
                ? 'Multiple Choice'
                : question.type === 'FIB'
                  ? 'Fill in the Blank'
                  : question.type === 'Matching'
                    ? 'Matching'
                    : 'Ordering'}
            </span>
            {question.timeLimit > 0 && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {question.timeLimit}s
              </span>
            )}
          </div>
          <p className="text-white text-base font-medium leading-snug">
            {question.text}
          </p>
        </div>

        {/* Answer area by type */}
        {question.type === 'MC' && (
          <MCAnswerArea
            options={shuffledOptions}
            selectedAnswer={selectedAnswer}
            question={question}
            showAnswer={showAnswer}
            onSelect={(ans) => {
              setSelectedAnswer(ans);
              setShowAnswer(true);
            }}
          />
        )}

        {question.type === 'FIB' && (
          <FIBAnswerArea
            correctAnswer={question.correctAnswer}
            showAnswer={showAnswer}
            onReveal={() => setShowAnswer(true)}
          />
        )}

        {(question.type === 'Matching' || question.type === 'Ordering') && (
          <StructuredAnswerArea
            question={question}
            showAnswer={showAnswer}
            onReveal={() => setShowAnswer(true)}
          />
        )}

        {/* Correct answer reveal */}
        {showAnswer && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
            <p className="text-xs text-emerald-400 font-semibold mb-1">
              Correct Answer:
            </p>
            <p className="text-sm text-emerald-300">{question.correctAnswer}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/8 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs rounded-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Prev
        </button>

        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex
                  ? 'bg-violet-500'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentIndex((i) => Math.min(quiz.questions.length - 1, i + 1))
          }
          disabled={currentIndex === quiz.questions.length - 1}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/8 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs rounded-xl transition-colors"
        >
          Next
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const MCAnswerArea: React.FC<{
  options: string[];
  selectedAnswer: string | null;
  question: QuizQuestion;
  showAnswer: boolean;
  onSelect: (ans: string) => void;
}> = ({ options, selectedAnswer, question, showAnswer, onSelect }) => (
  <div className="space-y-2">
    {options.map((opt) => {
      const isSelected = selectedAnswer === opt;
      const isCorrect = gradeAnswer(question, opt);
      let cls =
        'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all font-medium ';
      if (!showAnswer) {
        cls +=
          'bg-white/8 border-white/10 text-white hover:bg-white/15 hover:border-white/20';
      } else if (isCorrect) {
        cls += 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
      } else if (isSelected && !isCorrect) {
        cls += 'bg-red-500/20 border-red-500/40 text-red-300';
      } else {
        cls += 'bg-white/5 border-white/5 text-slate-500';
      }
      return (
        <button
          key={opt}
          onClick={() => !showAnswer && onSelect(opt)}
          className={cls}
        >
          <div className="flex items-center gap-3">
            {showAnswer && isCorrect && (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            {showAnswer && isSelected && !isCorrect && (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{opt}</span>
          </div>
        </button>
      );
    })}
  </div>
);

const FIBAnswerArea: React.FC<{
  correctAnswer: string;
  showAnswer: boolean;
  onReveal: () => void;
}> = ({ showAnswer, onReveal }) => (
  <div className="space-y-3">
    <input
      type="text"
      disabled={showAnswer}
      className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
      placeholder="Type your answer…"
    />
    {!showAnswer && (
      <button
        onClick={onReveal}
        className="text-xs text-slate-400 hover:text-white underline transition-colors"
      >
        Reveal answer
      </button>
    )}
  </div>
);

const StructuredAnswerArea: React.FC<{
  question: QuizQuestion;
  showAnswer: boolean;
  onReveal: () => void;
}> = ({ question, showAnswer, onReveal }) => {
  const pairs =
    question.type === 'Matching'
      ? question.correctAnswer.split('|').map((p) => {
          const [left, right] = p.split(':');
          return { left: left ?? '', right: right ?? '' };
        })
      : question.correctAnswer
          .split('|')
          .map((item, i) => ({ left: String(i + 1), right: item }));

  return (
    <div className="space-y-3">
      <div className="bg-white/5 rounded-xl p-3 space-y-2">
        {pairs.map((pair, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span
              className={`text-slate-300 ${question.type === 'Ordering' ? 'font-mono text-violet-400' : ''}`}
            >
              {question.type === 'Ordering' ? `${pair.left}.` : pair.left}
            </span>
            {question.type === 'Matching' && (
              <>
                <span className="text-slate-500">→</span>
                <span
                  className={
                    showAnswer
                      ? 'text-emerald-300'
                      : 'text-transparent bg-white/10 rounded select-none'
                  }
                >
                  {pair.right}
                </span>
              </>
            )}
            {question.type === 'Ordering' && (
              <span
                className={
                  showAnswer
                    ? 'text-emerald-300'
                    : 'text-transparent bg-white/10 rounded select-none'
                }
              >
                {pair.right}
              </span>
            )}
          </div>
        ))}
      </div>
      {!showAnswer && (
        <button
          onClick={onReveal}
          className="text-xs text-slate-400 hover:text-white underline transition-colors"
        >
          Reveal answer
        </button>
      )}
    </div>
  );
};
