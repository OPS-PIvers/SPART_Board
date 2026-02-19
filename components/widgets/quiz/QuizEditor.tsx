/**
 * QuizEditor — inline editor for quiz questions.
 * Teachers can add, edit, reorder, and delete questions.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Loader2,
  AlertCircle,
  GripVertical,
} from 'lucide-react';
import { QuizData, QuizQuestion, QuizQuestionType } from '@/types';

interface QuizEditorProps {
  quiz: QuizData;
  onBack: () => void;
  onSave: (updatedQuiz: QuizData) => Promise<void>;
}

const QUESTION_TYPES: {
  value: QuizQuestionType;
  label: string;
  hint: string;
}[] = [
  {
    value: 'MC',
    label: 'Multiple Choice',
    hint: 'Provide one correct answer and up to 4 incorrect options.',
  },
  {
    value: 'FIB',
    label: 'Fill in the Blank',
    hint: 'Student types the correct word/phrase.',
  },
  {
    value: 'Matching',
    label: 'Matching',
    hint: 'Format: term1:definition1|term2:definition2 (pipe-separated pairs)',
  },
  {
    value: 'Ordering',
    label: 'Ordering',
    hint: 'Format: item1|item2|item3 in the correct sequence (pipe-separated)',
  },
];

const blankQuestion = (): QuizQuestion => ({
  id: crypto.randomUUID(),
  timeLimit: 0,
  text: '',
  type: 'MC',
  correctAnswer: '',
  incorrectAnswers: ['', ''],
});

export const QuizEditor: React.FC<QuizEditorProps> = ({
  quiz,
  onBack,
  onSave,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    quiz.questions.map((q) => ({ ...q }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(
    quiz.questions.length === 0 ? null : (quiz.questions[0]?.id ?? null)
  );

  // Auto-expand newly added questions
  useEffect(() => {
    if (questions.length > quiz.questions.length) {
      setExpandedId(questions[questions.length - 1].id);
    }
  }, [questions, quiz.questions.length]);

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const updateIncorrect = (id: string, index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const incorrect = [...q.incorrectAnswers];
        incorrect[index] = value;
        return { ...q, incorrectAnswers: incorrect };
      })
    );
  };

  const addIncorrect = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id && q.incorrectAnswers.length < 4
          ? { ...q, incorrectAnswers: [...q.incorrectAnswers, ''] }
          : q
      )
    );
  };

  const removeIncorrect = (id: string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const incorrect = q.incorrectAnswers.filter((_, i) => i !== index);
        return { ...q, incorrectAnswers: incorrect };
      })
    );
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQ = [...questions];
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= newQ.length) return;
    [newQ[index], newQ[swap]] = [newQ[swap], newQ[index]];
    setQuestions(newQ);
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleSave = async () => {
    const errors: string[] = [];
    questions.forEach((q, i) => {
      if (!q.text.trim()) errors.push(`Question ${i + 1}: text is required`);
      if (!q.correctAnswer.trim())
        errors.push(`Question ${i + 1}: correct answer is required`);
    });
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...quiz, questions, updatedAt: Date.now() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {quiz.title}
          </p>
          <p className="text-xs text-slate-400">{questions.length} questions</p>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Question list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
          >
            {/* Question header (collapsed) */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
            >
              <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-xs text-slate-500 w-4 shrink-0">
                {i + 1}.
              </span>
              <span className="flex-1 text-xs text-slate-300 truncate">
                {q.text || (
                  <span className="italic text-slate-500">
                    Untitled question
                  </span>
                )}
              </span>
              <span
                className={`text-xs px-1.5 rounded shrink-0 ${
                  q.type === 'MC'
                    ? 'bg-blue-500/20 text-blue-300'
                    : q.type === 'FIB'
                      ? 'bg-amber-500/20 text-amber-300'
                      : q.type === 'Matching'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-teal-500/20 text-teal-300'
                }`}
              >
                {q.type}
              </span>
              {/* Move buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveQuestion(i, 'up');
                }}
                disabled={i === 0}
                className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveQuestion(i, 'down');
                }}
                disabled={i === questions.length - 1}
                className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuestion(q.id);
                }}
                className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expanded form */}
            {expandedId === q.id && (
              <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                {/* Type + time limit */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Type
                    </label>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          type: e.target.value as QuizQuestionType,
                          incorrectAnswers:
                            e.target.value === 'MC' ? ['', ''] : [],
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Time Limit (s, 0 = none)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          timeLimit: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>

                {/* Hint for special formats */}
                {(q.type === 'Matching' || q.type === 'Ordering') && (
                  <p className="text-xs text-slate-500 bg-slate-800/60 px-2 py-1.5 rounded-lg">
                    {QUESTION_TYPES.find((t) => t.value === q.type)?.hint}
                  </p>
                )}

                {/* Question text */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Question *
                  </label>
                  <textarea
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(q.id, { text: e.target.value })
                    }
                    rows={2}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Enter your question here…"
                  />
                </div>

                {/* Correct answer */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Correct Answer *
                  </label>
                  <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={(e) =>
                      updateQuestion(q.id, { correctAnswer: e.target.value })
                    }
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder={
                      q.type === 'Matching'
                        ? 'term1:def1|term2:def2'
                        : q.type === 'Ordering'
                          ? 'item1|item2|item3'
                          : 'Enter the correct answer'
                    }
                  />
                </div>

                {/* Incorrect answers (MC only) */}
                {q.type === 'MC' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Incorrect Options ({q.incorrectAnswers.length}/4)
                    </label>
                    <div className="space-y-1.5">
                      {q.incorrectAnswers.map((ans, idx) => (
                        <div key={idx} className="flex gap-1.5">
                          <input
                            type="text"
                            value={ans}
                            onChange={(e) =>
                              updateIncorrect(q.id, idx, e.target.value)
                            }
                            placeholder={`Incorrect option ${idx + 1}`}
                            className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                          {q.incorrectAnswers.length > 1 && (
                            <button
                              onClick={() => removeIncorrect(q.id, idx)}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {q.incorrectAnswers.length < 4 && (
                        <button
                          onClick={() => addIncorrect(q.id)}
                          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add option
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add question button */}
        <button
          onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}
          className="w-full py-2.5 border-2 border-dashed border-white/20 hover:border-violet-500/50 hover:bg-violet-500/10 rounded-xl text-slate-400 hover:text-violet-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>
    </div>
  );
};
