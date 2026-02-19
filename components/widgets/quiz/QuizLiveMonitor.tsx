/**
 * QuizLiveMonitor — teacher view during a live quiz session.
 * Shows join code, student progress, current question controls,
 * and real-time per-question answer distribution.
 */

import React, { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  Clock,
  Users,
  ChevronRight,
  Square,
  BarChart3,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { QuizSession, QuizResponse, QuizQuestion, QuizData } from '@/types';
import { gradeAnswer } from '@/hooks/useQuizSession';

interface QuizLiveMonitorProps {
  session: QuizSession;
  responses: QuizResponse[];
  quizData: QuizData;
  onAdvance: () => Promise<void>;
  onEnd: () => Promise<void>;
}

export const QuizLiveMonitor: React.FC<QuizLiveMonitorProps> = ({
  session,
  responses,
  quizData,
  onAdvance,
  onEnd,
}) => {
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [ending, setEnding] = useState(false);

  const joinUrl = `${window.location.origin}/quiz?code=${session.code}`;

  const handleCopy = () => {
    void navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await onAdvance();
    } finally {
      setAdvancing(false);
    }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await onEnd();
    } finally {
      setEnding(false);
    }
  };

  const currentQ: QuizQuestion | undefined =
    session.currentQuestionIndex >= 0
      ? quizData.questions[session.currentQuestionIndex]
      : undefined;

  const answered = currentQ
    ? responses.filter((r) =>
        r.answers.some((a) => a.questionId === currentQ.id)
      ).length
    : 0;

  const completed = responses.filter((r) => r.status === 'completed').length;
  const inProgress = responses.filter((r) => r.status === 'in-progress').length;
  const joined = responses.filter((r) => r.status === 'joined').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-white">
              Live: {session.quizTitle}
            </span>
          </div>
          <button
            onClick={() => void handleEnd()}
            disabled={ending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/80 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {ending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Square className="w-3 h-3" />
            )}
            End Session
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Join code */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-slate-400 mb-2 font-medium">
            Students join at:
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-black tracking-widest text-white font-mono">
              {session.code}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-xs text-white rounded-lg transition-colors"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-xs text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open join page
            </a>
          </div>
        </div>

        {/* Student summary */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox
            label="Joined"
            value={joined + inProgress + completed}
            icon={<Users className="w-3.5 h-3.5" />}
            color="blue"
          />
          <StatBox
            label="In Progress"
            value={inProgress}
            icon={<Clock className="w-3.5 h-3.5" />}
            color="amber"
          />
          <StatBox
            label="Finished"
            value={completed}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            color="green"
          />
        </div>

        {/* Current question status */}
        {session.status === 'waiting' && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-center">
            <p className="text-amber-300 text-sm font-medium">Lobby open</p>
            <p className="text-amber-400/70 text-xs mt-1">
              Students can join. Press Start to show the first question.
            </p>
          </div>
        )}

        {session.status === 'active' && currentQ && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">
                Question {session.currentQuestionIndex + 1} of{' '}
                {session.totalQuestions}
              </p>
              <button
                onClick={() => setShowStats(!showStats)}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                <BarChart3 className="w-3 h-3" />
                {showStats ? 'Hide stats' : 'Live stats'}
              </button>
            </div>
            <p className="text-sm text-white font-medium truncate">
              {currentQ.text}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>
                {answered} / {responses.length} answered
              </span>
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{
                    width: `${responses.length > 0 ? (answered / responses.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Live answer distribution */}
            {showStats && currentQ.type === 'MC' && (
              <MCDistribution question={currentQ} responses={responses} />
            )}
          </div>
        )}

        {session.status === 'ended' && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-300 text-sm font-medium">
              Session ended
            </p>
            <p className="text-emerald-400/70 text-xs mt-1">
              {completed} of {responses.length} students completed the quiz
            </p>
          </div>
        )}

        {/* Student list */}
        {responses.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2">Students</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {responses
                .slice()
                .sort((a, b) => a.studentName.localeCompare(b.studentName))
                .map((r) => (
                  <StudentRow
                    key={r.studentUid}
                    response={r}
                    totalQuestions={session.totalQuestions}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Advance button */}
      {(session.status === 'waiting' || session.status === 'active') && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => void handleAdvance()}
            disabled={advancing}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {advancing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {session.status === 'waiting' && 'Start Quiz →'}
                {session.status === 'active' &&
                  (session.currentQuestionIndex + 1 >= session.totalQuestions
                    ? 'Finish Quiz'
                    : `Next Question (${session.currentQuestionIndex + 2}/${session.totalQuestions})`)}
                {session.status === 'active' && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const StatBox: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'green';
}> = ({ label, value, icon, color }) => {
  const bg =
    color === 'blue'
      ? 'bg-blue-500/15 text-blue-400'
      : color === 'amber'
        ? 'bg-amber-500/15 text-amber-400'
        : 'bg-emerald-500/15 text-emerald-400';
  return (
    <div className={`${bg} rounded-xl p-2.5 text-center`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
};

const StudentRow: React.FC<{
  response: QuizResponse;
  totalQuestions: number;
}> = ({ response, totalQuestions }) => {
  const statusColor =
    response.status === 'completed'
      ? 'text-emerald-400'
      : response.status === 'in-progress'
        ? 'text-amber-400'
        : 'text-slate-400';

  return (
    <div className="flex items-center gap-3 px-2.5 py-2 bg-white/5 rounded-lg">
      <span
        className={`w-2 h-2 rounded-full ${
          response.status === 'completed'
            ? 'bg-emerald-500'
            : response.status === 'in-progress'
              ? 'bg-amber-500'
              : 'bg-slate-500'
        }`}
      />
      <span className="flex-1 text-xs text-slate-300 truncate">
        {response.studentName}
      </span>
      <span className={`text-xs ${statusColor}`}>
        {response.status === 'completed'
          ? `${Math.round((response.answers.filter((a) => a.isCorrect).length / Math.max(totalQuestions, 1)) * 100)}%`
          : `${response.answers.length}/${totalQuestions}`}
      </span>
    </div>
  );
};

const MCDistribution: React.FC<{
  question: QuizQuestion;
  responses: QuizResponse[];
}> = ({ question, responses }) => {
  const options = [
    question.correctAnswer,
    ...question.incorrectAnswers.filter(Boolean),
  ];
  const totalAnswered = responses.filter((r) =>
    r.answers.some((a) => a.questionId === question.id)
  ).length;

  return (
    <div className="mt-3 space-y-1.5">
      {options.map((opt) => {
        const count = responses.filter((r) =>
          r.answers.some(
            (a) => a.questionId === question.id && a.answer === opt
          )
        ).length;
        const pct =
          totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
        const isCorrect = gradeAnswer(question, opt);
        return (
          <div key={opt}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span
                className={isCorrect ? 'text-emerald-300' : 'text-slate-300'}
                title={opt}
              >
                {opt.length > 30 ? opt.substring(0, 30) + '…' : opt}
              </span>
              <span
                className={
                  isCorrect ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }
              >
                {count} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isCorrect ? 'bg-emerald-500' : 'bg-slate-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
