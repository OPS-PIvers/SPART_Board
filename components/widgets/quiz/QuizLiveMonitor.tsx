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
      <div
        className="border-b border-white/10"
        style={{ padding: 'min(12px, 2.5cqmin) min(16px, 4cqmin)' }}
      >
        <div className="flex items-center justify-between">
          <div
            className="flex items-center"
            style={{ gap: 'min(8px, 2cqmin)' }}
          >
            <div
              className="rounded-full bg-red-500 animate-pulse"
              style={{ width: 'min(8px, 2cqmin)', height: 'min(8px, 2cqmin)' }}
            />
            <span
              className="font-semibold text-white"
              style={{ fontSize: 'min(13px, 4.5cqmin)' }}
            >
              Live: {session.quizTitle}
            </span>
          </div>
          <button
            onClick={() => void handleEnd()}
            disabled={ending}
            className="flex items-center bg-red-600/80 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            style={{
              gap: 'min(6px, 1.5cqmin)',
              padding: 'min(6px, 1.5cqmin) min(10px, 2.5cqmin)',
              fontSize: 'min(11px, 3.5cqmin)',
            }}
          >
            {ending ? (
              <Loader2
                className="animate-spin"
                style={{
                  width: 'min(12px, 3.5cqmin)',
                  height: 'min(12px, 3.5cqmin)',
                }}
              />
            ) : (
              <Square
                style={{
                  width: 'min(12px, 3.5cqmin)',
                  height: 'min(12px, 3.5cqmin)',
                }}
              />
            )}
            End Session
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 'min(16px, 4cqmin)' }}
      >
        <div className="flex flex-col" style={{ gap: 'min(16px, 4cqmin)' }}>
          {/* Join code */}
          <div
            className="bg-white/5 border border-white/10 rounded-xl"
            style={{ padding: 'min(12px, 3cqmin)' }}
          >
            <p
              className="text-slate-400 font-medium"
              style={{
                fontSize: 'min(10px, 3.5cqmin)',
                marginBottom: 'min(8px, 2cqmin)',
              }}
            >
              Students join at:
            </p>
            <div
              className="flex items-center"
              style={{
                gap: 'min(8px, 2cqmin)',
                marginBottom: 'min(8px, 2cqmin)',
              }}
            >
              <span
                className="font-black tracking-widest text-white font-mono"
                style={{ fontSize: 'min(24px, 8cqmin)' }}
              >
                {session.code}
              </span>
            </div>
            <div className="flex" style={{ gap: 'min(8px, 2cqmin)' }}>
              <button
                onClick={handleCopy}
                className="flex items-center bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
                style={{
                  gap: 'min(6px, 1.5cqmin)',
                  padding: 'min(6px, 1.5cqmin) min(10px, 2.5cqmin)',
                  fontSize: 'min(11px, 3.5cqmin)',
                }}
              >
                {copied ? (
                  <CheckCircle2
                    className="text-green-400"
                    style={{
                      width: 'min(14px, 4cqmin)',
                      height: 'min(14px, 4cqmin)',
                    }}
                  />
                ) : (
                  <Copy
                    style={{
                      width: 'min(14px, 4cqmin)',
                      height: 'min(14px, 4cqmin)',
                    }}
                  />
                )}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
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
                Open join page
              </a>
            </div>
          </div>

          {/* Student summary */}
          <div className="grid grid-cols-3" style={{ gap: 'min(8px, 2cqmin)' }}>
            <StatBox
              label="Joined"
              value={joined + inProgress + completed}
              icon={
                <Users
                  style={{
                    width: 'min(14px, 4cqmin)',
                    height: 'min(14px, 4cqmin)',
                  }}
                />
              }
              color="blue"
            />
            <StatBox
              label="In Progress"
              value={inProgress}
              icon={
                <Clock
                  style={{
                    width: 'min(14px, 4cqmin)',
                    height: 'min(14px, 4cqmin)',
                  }}
                />
              }
              color="amber"
            />
            <StatBox
              label="Finished"
              value={completed}
              icon={
                <CheckCircle2
                  style={{
                    width: 'min(14px, 4cqmin)',
                    height: 'min(14px, 4cqmin)',
                  }}
                />
              }
              color="green"
            />
          </div>

          {/* Current question status */}
          {session.status === 'waiting' && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-center">
              <p
                className="text-amber-300 font-medium"
                style={{ fontSize: 'min(13px, 4.5cqmin)' }}
              >
                Lobby open
              </p>
              <p
                className="text-amber-400/70"
                style={{
                  fontSize: 'min(11px, 3.5cqmin)',
                  marginTop: 'min(4px, 1cqmin)',
                }}
              >
                Students can join. Press Start to show the first question.
              </p>
            </div>
          )}

          {session.status === 'active' && currentQ && (
            <div
              className="bg-white/5 border border-white/10 rounded-xl"
              style={{ padding: 'min(12px, 3cqmin)' }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 'min(8px, 2cqmin)' }}
              >
                <p
                  className="text-slate-400"
                  style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                >
                  Question {session.currentQuestionIndex + 1} of{' '}
                  {session.totalQuestions}
                </p>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center text-violet-400 hover:text-violet-300 transition-colors"
                  style={{
                    gap: 'min(4px, 1cqmin)',
                    fontSize: 'min(11px, 3.5cqmin)',
                  }}
                >
                  <BarChart3
                    style={{
                      width: 'min(12px, 3.5cqmin)',
                      height: 'min(12px, 3.5cqmin)',
                    }}
                  />
                  {showStats ? 'Hide stats' : 'Live stats'}
                </button>
              </div>
              <p
                className="text-white font-medium truncate"
                style={{ fontSize: 'min(13px, 4.5cqmin)' }}
              >
                {currentQ.text}
              </p>
              <div
                className="flex items-center justify-between text-slate-400"
                style={{
                  marginTop: 'min(8px, 2cqmin)',
                  fontSize: 'min(11px, 3.5cqmin)',
                }}
              >
                <span>
                  {answered} / {responses.length} answered
                </span>
                <div
                  className="h-1.5 bg-white/10 rounded-full overflow-hidden"
                  style={{ width: 'min(96px, 20cqmin)' }}
                >
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
              <CheckCircle2
                className="text-emerald-400 mx-auto"
                style={{
                  width: 'min(24px, 6cqmin)',
                  height: 'min(24px, 6cqmin)',
                  marginBottom: 'min(8px, 2cqmin)',
                }}
              />
              <p
                className="text-emerald-300 font-medium"
                style={{ fontSize: 'min(13px, 4.5cqmin)' }}
              >
                Session ended
              </p>
              <p
                className="text-emerald-400/70"
                style={{
                  fontSize: 'min(11px, 3.5cqmin)',
                  marginTop: 'min(4px, 1cqmin)',
                }}
              >
                {completed} of {responses.length} students completed the quiz
              </p>
            </div>
          )}

          {/* Student list */}
          {responses.length > 0 && (
            <div>
              <p
                className="text-slate-400 font-medium"
                style={{
                  fontSize: 'min(11px, 3.5cqmin)',
                  marginBottom: 'min(8px, 2cqmin)',
                }}
              >
                Students
              </p>
              <div
                className="max-h-48 overflow-y-auto"
                style={{
                  gap: 'min(6px, 1.5cqmin)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {responses
                  .slice()
                  .sort((a, b) => a.studentName.localeCompare(b.studentName))
                  .map((r) => (
                    <StudentRow
                      key={r.studentUid}
                      response={r}
                      totalQuestions={session.totalQuestions}
                      questions={quizData.questions}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advance button */}
      {(session.status === 'waiting' || session.status === 'active') && (
        <div
          className="border-t border-white/10"
          style={{ padding: 'min(16px, 4cqmin)' }}
        >
          <button
            onClick={() => void handleAdvance()}
            disabled={advancing}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition-colors"
            style={{
              padding: 'min(12px, 3cqmin)',
              gap: 'min(8px, 2cqmin)',
              fontSize: 'min(13px, 4.5cqmin)',
            }}
          >
            {advancing ? (
              <Loader2
                className="animate-spin"
                style={{
                  width: 'min(16px, 4.5cqmin)',
                  height: 'min(16px, 4.5cqmin)',
                }}
              />
            ) : (
              <>
                {session.status === 'waiting' && 'Start Quiz →'}
                {session.status === 'active' &&
                  (session.currentQuestionIndex + 1 >= session.totalQuestions
                    ? 'Finish Quiz'
                    : `Next Question (${session.currentQuestionIndex + 2}/${session.totalQuestions})`)}
                {session.status === 'active' && (
                  <ChevronRight
                    style={{
                      width: 'min(16px, 4.5cqmin)',
                      height: 'min(16px, 4.5cqmin)',
                    }}
                  />
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
    <div
      className={`${bg} rounded-xl text-center`}
      style={{ padding: 'min(10px, 2.5cqmin)' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 'min(4px, 1cqmin)',
        }}
      >
        {icon}
      </div>
      <p className="font-bold" style={{ fontSize: 'min(18px, 6cqmin)' }}>
        {value}
      </p>
      <p className="opacity-70" style={{ fontSize: 'min(10px, 3.5cqmin)' }}>
        {label}
      </p>
    </div>
  );
};

const StudentRow: React.FC<{
  response: QuizResponse;
  totalQuestions: number;
  questions: QuizQuestion[];
}> = ({ response, totalQuestions, questions }) => {
  const statusColor =
    response.status === 'completed'
      ? 'text-emerald-400'
      : response.status === 'in-progress'
        ? 'text-amber-400'
        : 'text-slate-400';

  const correctCount = response.answers.filter((a) => {
    const q = questions.find((qn) => qn.id === a.questionId);
    return q ? gradeAnswer(q, a.answer) : false;
  }).length;

  return (
    <div
      className="flex items-center bg-white/5 rounded-lg"
      style={{
        gap: 'min(12px, 3cqmin)',
        padding: 'min(8px, 2cqmin) min(10px, 2.5cqmin)',
      }}
    >
      <span
        className={`rounded-full shrink-0 ${
          response.status === 'completed'
            ? 'bg-emerald-500'
            : response.status === 'in-progress'
              ? 'bg-amber-500'
              : 'bg-slate-500'
        }`}
        style={{ width: 'min(8px, 2cqmin)', height: 'min(8px, 2cqmin)' }}
      />
      <span
        className="flex-1 text-slate-300 truncate"
        style={{ fontSize: 'min(11px, 3.5cqmin)' }}
      >
        {response.studentName}
      </span>
      <span
        className={`${statusColor}`}
        style={{ fontSize: 'min(11px, 3.5cqmin)' }}
      >
        {response.status === 'completed'
          ? `${Math.round((correctCount / Math.max(totalQuestions, 1)) * 100)}%`
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
    <div
      className="flex flex-col"
      style={{ marginTop: 'min(12px, 3cqmin)', gap: 'min(6px, 1.5cqmin)' }}
    >
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
            <div
              className="flex items-center justify-between"
              style={{
                marginBottom: 'min(2px, 0.5cqmin)',
                fontSize: 'min(11px, 3.5cqmin)',
              }}
            >
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
