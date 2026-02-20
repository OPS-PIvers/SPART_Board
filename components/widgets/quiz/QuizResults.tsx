/**
 * QuizResults — aggregated results view for a completed quiz session.
 * Shows score distribution, per-question accuracy, and per-student breakdown.
 * Allows exporting to Google Sheets.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  Trophy,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { QuizResponse, QuizData, QuizQuestion } from '@/types';
import { useAuth } from '@/context/useAuth';
import { QuizDriveService } from '@/utils/quizDriveService';
import { gradeAnswer } from '@/hooks/useQuizSession';

/**
 * Compute a student's percentage score by re-grading answers with gradeAnswer
 * so the result is always authoritative and cannot be forged by a student
 * writing a false isCorrect value.
 */
function getResponseScore(r: QuizResponse, questions: QuizQuestion[]): number {
  if (questions.length === 0) return 0;
  const correct = r.answers.filter((a) => {
    const q = questions.find((qn) => qn.id === a.questionId);
    return q ? gradeAnswer(q, a.answer) : false;
  }).length;
  return Math.round((correct / questions.length) * 100);
}

interface QuizResultsProps {
  quiz: QuizData;
  responses: QuizResponse[];
  onBack: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  responses,
  onBack,
}) => {
  const { googleAccessToken } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'questions' | 'students'
  >('overview');

  const completed = responses.filter((r) => r.status === 'completed');
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce(
            (sum, r) => sum + getResponseScore(r, quiz.questions),
            0
          ) / completed.length
        )
      : null;

  const handleExport = async () => {
    if (!googleAccessToken) {
      setExportError(
        'Google access token not available. Please sign in again.'
      );
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const svc = new QuizDriveService(googleAccessToken);
      const url = await svc.exportResultsToSheet(
        quiz.title,
        responses,
        quiz.questions
      );
      setExportUrl(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
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
            Results: {quiz.title}
          </p>
          <p className="text-xs text-slate-400">
            {completed.length} of {responses.length} completed
          </p>
        </div>
        {exportUrl ? (
          <a
            href={exportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Sheet
          </a>
        ) : (
          <button
            onClick={() => void handleExport()}
            disabled={exporting || responses.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export
          </button>
        )}
      </div>

      {exportError && (
        <div className="mx-4 mt-2 p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-xs">
          {exportError}
        </div>
      )}

      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
          <BarChart3 className="w-10 h-10 opacity-30" />
          <p className="text-sm">No responses yet for this session.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex px-4 pt-3 gap-1">
            {(['overview', 'questions', 'students'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/8'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'overview' && (
              <OverviewTab
                responses={responses}
                completed={completed}
                avgScore={avgScore}
                questions={quiz.questions}
              />
            )}
            {activeTab === 'questions' && (
              <QuestionsTab questions={quiz.questions} responses={responses} />
            )}
            {activeTab === 'students' && (
              <StudentsTab responses={responses} questions={quiz.questions} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  responses: QuizResponse[];
  completed: QuizResponse[];
  avgScore: number | null;
  questions: QuizQuestion[];
}> = ({ responses, completed, avgScore, questions }) => {
  // Score distribution buckets: 0-59, 60-79, 80-89, 90-100
  const buckets = [
    { label: '90-100%', min: 90, max: 100, color: 'bg-emerald-500' },
    { label: '80-89%', min: 80, max: 89, color: 'bg-green-500' },
    { label: '60-79%', min: 60, max: 79, color: 'bg-amber-500' },
    { label: '0-59%', min: 0, max: 59, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-white">
            {avgScore !== null ? `${avgScore}%` : '—'}
          </p>
          <p className="text-xs text-slate-400">Class Average</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-white">
            {completed.length}/{responses.length}
          </p>
          <p className="text-xs text-slate-400">Completed</p>
        </div>
      </div>

      {/* Score distribution */}
      <div>
        <p className="text-xs text-slate-400 font-medium mb-2">
          Score Distribution
        </p>
        <div className="space-y-2">
          {buckets.map((b) => {
            const count = completed.filter((r) => {
              const s = getResponseScore(r, questions);
              return s >= b.min && s <= b.max;
            }).length;
            const pct =
              completed.length > 0
                ? Math.round((count / completed.length) * 100)
                : 0;
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">{b.label}</span>
                  <span className="text-slate-400">
                    {count} students ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${b.color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const QuestionsTab: React.FC<{
  questions: QuizData['questions'];
  responses: QuizResponse[];
}> = ({ questions, responses }) => (
  <div className="space-y-3">
    {questions.map((q, i) => {
      const answered = responses.filter((r) =>
        r.answers.some((a) => a.questionId === q.id)
      );
      const correct = answered.filter((r) =>
        r.answers.some((a) => a.questionId === q.id && gradeAnswer(q, a.answer))
      );
      const pct =
        answered.length > 0
          ? Math.round((correct.length / answered.length) * 100)
          : 0;
      return (
        <div key={q.id} className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-slate-400 mb-1">
            Q{i + 1} · {q.type}
          </p>
          <p className="text-sm text-white font-medium mb-2 line-clamp-2">
            {q.text}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {correct.length} correct
            </div>
            <div className="flex items-center gap-1 text-xs text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              {answered.length - correct.length} wrong
            </div>
            <div className="ml-auto text-xs font-bold text-white">{pct}%</div>
          </div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 80
                  ? 'bg-emerald-500'
                  : pct >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

const StudentsTab: React.FC<{
  responses: QuizResponse[];
  questions: QuizQuestion[];
}> = ({ responses, questions }) => (
  <div className="space-y-2">
    {responses
      .slice()
      .sort((a, b) => {
        const scoreA =
          a.status === 'completed' ? getResponseScore(a, questions) : -1;
        const scoreB =
          b.status === 'completed' ? getResponseScore(b, questions) : -1;
        return scoreB - scoreA;
      })
      .map((r) => {
        const correct = r.answers.filter((a) => {
          const q = questions.find((qn) => qn.id === a.questionId);
          return q ? gradeAnswer(q, a.answer) : false;
        }).length;
        return (
          <div
            key={r.studentUid}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {r.studentName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {r.studentEmail}
              </p>
            </div>
            <div className="text-right shrink-0">
              {r.status === 'completed' ? (
                <>
                  <p className="text-sm font-bold text-white">
                    {getResponseScore(r, questions)}%
                  </p>
                  <p className="text-xs text-slate-400">
                    {correct}/{questions.length}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 italic capitalize">
                  {r.status}
                </p>
              )}
            </div>
          </div>
        );
      })}
  </div>
);
