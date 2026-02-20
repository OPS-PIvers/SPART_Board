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
      <div
        className="flex items-center border-b border-white/10"
        style={{
          gap: 'min(12px, 3cqmin)',
          padding: 'min(12px, 2.5cqmin) min(16px, 4cqmin)',
        }}
      >
        <button
          onClick={onBack}
          className="hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white shrink-0"
          style={{ padding: 'min(6px, 1.5cqmin)' }}
        >
          <ArrowLeft
            style={{
              width: 'min(16px, 4.5cqmin)',
              height: 'min(16px, 4.5cqmin)',
            }}
          />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-white truncate"
            style={{ fontSize: 'min(13px, 4.5cqmin)' }}
          >
            Results: {quiz.title}
          </p>
          <p
            className="text-slate-400"
            style={{ fontSize: 'min(11px, 3.5cqmin)' }}
          >
            {completed.length} of {responses.length} completed
          </p>
        </div>
        {exportUrl ? (
          <a
            href={exportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors shrink-0"
            style={{
              gap: 'min(6px, 1.5cqmin)',
              padding: 'min(6px, 1.5cqmin) min(10px, 2.5cqmin)',
              fontSize: 'min(11px, 3.5cqmin)',
            }}
          >
            <ExternalLink
              style={{
                width: 'min(14px, 4cqmin)',
                height: 'min(14px, 4cqmin)',
              }}
            />
            Open Sheet
          </a>
        ) : (
          <button
            onClick={() => void handleExport()}
            disabled={exporting || responses.length === 0}
            className="flex items-center bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shrink-0"
            style={{
              gap: 'min(6px, 1.5cqmin)',
              padding: 'min(6px, 1.5cqmin) min(10px, 2.5cqmin)',
              fontSize: 'min(11px, 3.5cqmin)',
            }}
          >
            {exporting ? (
              <Loader2
                className="animate-spin"
                style={{
                  width: 'min(14px, 4cqmin)',
                  height: 'min(14px, 4cqmin)',
                }}
              />
            ) : (
              <Download
                style={{
                  width: 'min(14px, 4cqmin)',
                  height: 'min(14px, 4cqmin)',
                }}
              />
            )}
            Export
          </button>
        )}
      </div>

      {exportError && (
        <div
          className="bg-red-500/20 border border-red-500/40 rounded-lg text-red-300"
          style={{
            margin: 'min(8px, 2cqmin) min(16px, 4cqmin) 0',
            padding: 'min(8px, 2cqmin)',
            fontSize: 'min(11px, 3.5cqmin)',
          }}
        >
          {exportError}
        </div>
      )}

      {responses.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-full text-slate-400"
          style={{ gap: 'min(12px, 3cqmin)' }}
        >
          <BarChart3
            className="opacity-30"
            style={{
              width: 'min(40px, 10cqmin)',
              height: 'min(40px, 10cqmin)',
            }}
          />
          <p style={{ fontSize: 'min(13px, 4.5cqmin)' }}>
            No responses yet for this session.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div
            className="flex"
            style={{
              padding: 'min(12px, 3cqmin) min(16px, 4cqmin) 0',
              gap: 'min(4px, 1cqmin)',
            }}
          >
            {(['overview', 'questions', 'students'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-medium rounded-lg transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/8'
                }`}
                style={{
                  padding: 'min(6px, 1.5cqmin) min(12px, 3cqmin)',
                  fontSize: 'min(11px, 3.5cqmin)',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div
            className="flex-1 overflow-y-auto"
            style={{ padding: 'min(16px, 4cqmin)' }}
          >
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
    <div className="flex flex-col" style={{ gap: 'min(16px, 4cqmin)' }}>
      {/* Summary stats */}
      <div className="grid grid-cols-2" style={{ gap: 'min(12px, 3cqmin)' }}>
        <div
          className="bg-white/5 rounded-xl text-center"
          style={{ padding: 'min(12px, 3cqmin)' }}
        >
          <Trophy
            className="text-amber-400 mx-auto"
            style={{
              width: 'min(20px, 5.5cqmin)',
              height: 'min(20px, 5.5cqmin)',
              marginBottom: 'min(4px, 1cqmin)',
            }}
          />
          <p
            className="font-black text-white"
            style={{ fontSize: 'min(24px, 8cqmin)' }}
          >
            {avgScore !== null ? `${avgScore}%` : '—'}
          </p>
          <p
            className="text-slate-400"
            style={{ fontSize: 'min(11px, 3.5cqmin)' }}
          >
            Class Average
          </p>
        </div>
        <div
          className="bg-white/5 rounded-xl text-center"
          style={{ padding: 'min(12px, 3cqmin)' }}
        >
          <Users
            className="text-blue-400 mx-auto"
            style={{
              width: 'min(20px, 5.5cqmin)',
              height: 'min(20px, 5.5cqmin)',
              marginBottom: 'min(4px, 1cqmin)',
            }}
          />
          <p
            className="font-black text-white"
            style={{ fontSize: 'min(24px, 8cqmin)' }}
          >
            {completed.length}/{responses.length}
          </p>
          <p
            className="text-slate-400"
            style={{ fontSize: 'min(11px, 3.5cqmin)' }}
          >
            Completed
          </p>
        </div>
      </div>

      {/* Score distribution */}
      <div>
        <p
          className="text-slate-400 font-medium"
          style={{
            fontSize: 'min(11px, 3.5cqmin)',
            marginBottom: 'min(8px, 2cqmin)',
          }}
        >
          Score Distribution
        </p>
        <div className="flex flex-col" style={{ gap: 'min(8px, 2cqmin)' }}>
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
                <div
                  className="flex items-center justify-between"
                  style={{
                    marginBottom: 'min(4px, 1cqmin)',
                    fontSize: 'min(11px, 3.5cqmin)',
                  }}
                >
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
  <div className="flex flex-col" style={{ gap: 'min(12px, 3cqmin)' }}>
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
        <div
          key={q.id}
          className="bg-white/5 rounded-xl"
          style={{ padding: 'min(12px, 3cqmin)' }}
        >
          <p
            className="text-slate-400"
            style={{
              fontSize: 'min(10px, 3.5cqmin)',
              marginBottom: 'min(4px, 1cqmin)',
            }}
          >
            Q{i + 1} · {q.type}
          </p>
          <p
            className="text-white font-medium line-clamp-2"
            style={{
              fontSize: 'min(13px, 4.5cqmin)',
              marginBottom: 'min(8px, 2cqmin)',
            }}
          >
            {q.text}
          </p>
          <div
            className="flex items-center"
            style={{ gap: 'min(12px, 3cqmin)' }}
          >
            <div
              className="flex items-center text-emerald-400"
              style={{
                gap: 'min(4px, 1cqmin)',
                fontSize: 'min(11px, 3.5cqmin)',
              }}
            >
              <CheckCircle2
                style={{
                  width: 'min(14px, 4cqmin)',
                  height: 'min(14px, 4cqmin)',
                }}
              />
              {correct.length} correct
            </div>
            <div
              className="flex items-center text-red-400"
              style={{
                gap: 'min(4px, 1cqmin)',
                fontSize: 'min(11px, 3.5cqmin)',
              }}
            >
              <XCircle
                style={{
                  width: 'min(14px, 4cqmin)',
                  height: 'min(14px, 4cqmin)',
                }}
              />
              {answered.length - correct.length} wrong
            </div>
            <div
              className="ml-auto font-bold text-white"
              style={{ fontSize: 'min(11px, 3.5cqmin)' }}
            >
              {pct}%
            </div>
          </div>
          <div
            className="h-1.5 bg-white/10 rounded-full overflow-hidden"
            style={{ marginTop: 'min(8px, 2cqmin)' }}
          >
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
  <div className="flex flex-col" style={{ gap: 'min(8px, 2cqmin)' }}>
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
            className="flex items-center bg-white/5 rounded-xl"
            style={{ gap: 'min(12px, 3cqmin)', padding: 'min(12px, 3cqmin)' }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-white font-medium truncate"
                style={{ fontSize: 'min(13px, 4.5cqmin)' }}
              >
                {r.studentName}
              </p>
              <p
                className="text-slate-400 truncate"
                style={{ fontSize: 'min(10px, 3.5cqmin)' }}
              >
                {r.studentEmail}
              </p>
            </div>
            <div className="text-right shrink-0">
              {r.status === 'completed' ? (
                <>
                  <p
                    className="font-bold text-white"
                    style={{ fontSize: 'min(13px, 4.5cqmin)' }}
                  >
                    {getResponseScore(r, questions)}%
                  </p>
                  <p
                    className="text-slate-400"
                    style={{ fontSize: 'min(10px, 3.5cqmin)' }}
                  >
                    {correct}/{questions.length}
                  </p>
                </>
              ) : (
                <p
                  className="text-slate-500 italic capitalize"
                  style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                >
                  {r.status}
                </p>
              )}
            </div>
          </div>
        );
      })}
  </div>
);
