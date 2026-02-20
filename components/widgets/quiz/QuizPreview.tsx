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
  BookOpen,
} from 'lucide-react';
import { QuizData, QuizQuestion } from '@/types';
import { gradeAnswer } from '@/hooks/useQuizSession';
import { ScaledEmptyState } from '@/components/common/ScaledEmptyState';

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
      <ScaledEmptyState
        icon={BookOpen}
        title="No questions yet"
        subtitle="Import a Google Sheet to add questions."
        action={
          <button
            onClick={onBack}
            className="text-violet-400 hover:underline"
            style={{
              fontSize: 'min(11px, 3.5cqmin)',
              marginTop: 'min(8px, 2cqmin)',
            }}
          >
            ← Back
          </button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-white/10"
        style={{ padding: 'min(10px, 2.5cqmin) min(16px, 4cqmin)' }}
      >
        <button
          onClick={onBack}
          className="hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          style={{ padding: 'min(6px, 1.5cqmin)' }}
        >
          <ArrowLeft
            style={{
              width: 'min(16px, 4.5cqmin)',
              height: 'min(16px, 4.5cqmin)',
            }}
          />
        </button>
        <div className="text-center">
          <p
            className="text-slate-400"
            style={{ fontSize: 'min(11px, 3.5cqmin)' }}
          >
            Preview · {quiz.title}
          </p>
          <p
            className="text-slate-500"
            style={{ fontSize: 'min(10px, 3cqmin)' }}
          >
            {currentIndex + 1} / {quiz.questions.length}
          </p>
        </div>
        <div className="flex items-center" style={{ gap: 'min(8px, 2cqmin)' }}>
          {timeLeft !== null && !showAnswer && (
            <div
              className={`flex items-center font-mono ${timeLeft <= 5 ? 'text-red-400' : 'text-amber-400'}`}
              style={{
                gap: 'min(4px, 1cqmin)',
                fontSize: 'min(11px, 3.5cqmin)',
              }}
            >
              <Timer
                style={{
                  width: 'min(14px, 4cqmin)',
                  height: 'min(14px, 4cqmin)',
                }}
              />
              {timeLeft}s
            </div>
          )}
          <button
            onClick={reset}
            className="hover:bg-white/10 rounded-lg transition-colors text-slate-400"
            style={{ padding: 'min(6px, 1.5cqmin)' }}
            title="Reset question"
          >
            <RotateCcw
              style={{
                width: 'min(14px, 4cqmin)',
                height: 'min(14px, 4cqmin)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Question */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 'min(16px, 4cqmin)' }}
      >
        <div style={{ marginBottom: 'min(24px, 6cqmin)' }}>
          <div
            className="flex items-center"
            style={{
              gap: 'min(8px, 2cqmin)',
              marginBottom: 'min(12px, 3cqmin)',
            }}
          >
            <span
              className={`rounded font-medium ${
                question.type === 'MC'
                  ? 'bg-blue-500/20 text-blue-300'
                  : question.type === 'FIB'
                    ? 'bg-amber-500/20 text-amber-300'
                    : question.type === 'Matching'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-teal-500/20 text-teal-300'
              }`}
              style={{
                fontSize: 'min(11px, 3.5cqmin)',
                padding: 'min(2px, 0.5cqmin) min(8px, 2cqmin)',
              }}
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
              <span
                className="text-slate-500 flex items-center"
                style={{
                  fontSize: 'min(11px, 3.5cqmin)',
                  gap: 'min(4px, 1cqmin)',
                }}
              >
                <Timer
                  style={{
                    width: 'min(12px, 3.5cqmin)',
                    height: 'min(12px, 3.5cqmin)',
                  }}
                />
                {question.timeLimit}s
              </span>
            )}
          </div>
          <p
            className="text-white font-medium leading-snug"
            style={{ fontSize: 'min(16px, 6cqmin)' }}
          >
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
          <div
            className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl"
            style={{
              marginTop: 'min(16px, 4cqmin)',
              padding: 'min(12px, 3cqmin)',
            }}
          >
            <p
              className="text-emerald-400 font-semibold"
              style={{
                fontSize: 'min(11px, 3.5cqmin)',
                marginBottom: 'min(4px, 1cqmin)',
              }}
            >
              Correct Answer:
            </p>
            <p
              className="text-emerald-300"
              style={{ fontSize: 'min(13px, 4.5cqmin)' }}
            >
              {question.correctAnswer}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        className="flex items-center justify-between border-t border-white/10"
        style={{ padding: 'min(10px, 2.5cqmin) min(16px, 4cqmin)' }}
      >
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center bg-white/8 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          style={{
            gap: 'min(6px, 1.5cqmin)',
            padding: 'min(6px, 1.5cqmin) min(12px, 3cqmin)',
            fontSize: 'min(11px, 3.5cqmin)',
          }}
        >
          <ArrowLeft
            style={{
              width: 'min(14px, 4cqmin)',
              height: 'min(14px, 4cqmin)',
            }}
          />
          Prev
        </button>

        <div className="flex" style={{ gap: 'min(4px, 1cqmin)' }}>
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-colors ${
                i === currentIndex
                  ? 'bg-violet-500'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
              style={{
                width: 'min(8px, 2cqmin)',
                height: 'min(8px, 2cqmin)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentIndex((i) => Math.min(quiz.questions.length - 1, i + 1))
          }
          disabled={currentIndex === quiz.questions.length - 1}
          className="flex items-center bg-white/8 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          style={{
            gap: 'min(6px, 1.5cqmin)',
            padding: 'min(6px, 1.5cqmin) min(12px, 3cqmin)',
            fontSize: 'min(11px, 3.5cqmin)',
          }}
        >
          Next
          <ArrowRight
            style={{
              width: 'min(14px, 4cqmin)',
              height: 'min(14px, 4cqmin)',
            }}
          />
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
  <div className="flex flex-col" style={{ gap: 'min(8px, 2cqmin)' }}>
    {options.map((opt) => {
      const isSelected = selectedAnswer === opt;
      const isCorrect = gradeAnswer(question, opt);
      let cls =
        'w-full text-left rounded-xl border transition-all font-medium ';
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
          style={{
            padding: 'min(10px, 2.5cqmin) min(16px, 4cqmin)',
            fontSize: 'min(13px, 4.5cqmin)',
          }}
        >
          <div
            className="flex items-center"
            style={{ gap: 'min(12px, 3cqmin)' }}
          >
            {showAnswer && isCorrect && (
              <CheckCircle2
                className="shrink-0"
                style={{
                  width: 'min(16px, 4.5cqmin)',
                  height: 'min(16px, 4.5cqmin)',
                }}
              />
            )}
            {showAnswer && isSelected && !isCorrect && (
              <XCircle
                className="shrink-0"
                style={{
                  width: 'min(16px, 4.5cqmin)',
                  height: 'min(16px, 4.5cqmin)',
                }}
              />
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
  <div className="flex flex-col" style={{ gap: 'min(12px, 3cqmin)' }}>
    <input
      type="text"
      disabled={showAnswer}
      className="w-full bg-white/8 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
      style={{
        padding: 'min(10px, 2.5cqmin) min(16px, 4cqmin)',
        fontSize: 'min(13px, 4.5cqmin)',
      }}
      placeholder="Type your answer…"
    />
    {!showAnswer && (
      <button
        onClick={onReveal}
        className="text-slate-400 hover:text-white underline transition-colors text-left"
        style={{ fontSize: 'min(11px, 3.5cqmin)' }}
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
    <div className="flex flex-col" style={{ gap: 'min(12px, 3cqmin)' }}>
      <div
        className="bg-white/5 rounded-xl flex flex-col"
        style={{ padding: 'min(12px, 3cqmin)', gap: 'min(8px, 2cqmin)' }}
      >
        {pairs.map((pair, i) => (
          <div
            key={i}
            className="flex items-center"
            style={{
              gap: 'min(12px, 3cqmin)',
              fontSize: 'min(13px, 4.5cqmin)',
            }}
          >
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
          className="text-slate-400 hover:text-white underline transition-colors text-left"
          style={{ fontSize: 'min(11px, 3.5cqmin)' }}
        >
          Reveal answer
        </button>
      )}
    </div>
  );
};
