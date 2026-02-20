/**
 * QuizManager — teacher's quiz library view.
 * Lists all saved quizzes with actions: Preview, Edit, Go Live, Results, Delete.
 */

import React, { useState } from 'react';
import {
  Plus,
  FileSpreadsheet,
  Play,
  Edit2,
  Trash2,
  BarChart3,
  Eye,
  BookOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { QuizMetadata } from '@/types';

interface QuizManagerProps {
  quizzes: QuizMetadata[];
  loading: boolean;
  error: string | null;
  onImport: () => void;
  onEdit: (quiz: QuizMetadata) => void;
  onPreview: (quiz: QuizMetadata) => void;
  onGoLive: (quiz: QuizMetadata) => void;
  onResults: (quiz: QuizMetadata) => void;
  onDelete: (quiz: QuizMetadata) => void;
  hasActiveSession: boolean;
}

export const QuizManager: React.FC<QuizManagerProps> = ({
  quizzes,
  loading,
  error,
  onImport,
  onEdit,
  onPreview,
  onGoLive,
  onResults,
  onDelete,
  hasActiveSession,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-slate-400"
        style={{ gap: 'min(12px, 3cqmin)' }}
      >
        <Loader2
          className="animate-spin"
          style={{ width: 'min(32px, 8cqmin)', height: 'min(32px, 8cqmin)' }}
        />
        <span style={{ fontSize: 'min(13px, 4.5cqmin)' }}>
          Loading quizzes…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-white/10"
        style={{ padding: 'min(12px, 2.5cqmin) min(16px, 4cqmin)' }}
      >
        <div className="flex items-center" style={{ gap: 'min(8px, 2cqmin)' }}>
          <BookOpen
            className="text-violet-400"
            style={{
              width: 'min(16px, 4.5cqmin)',
              height: 'min(16px, 4.5cqmin)',
            }}
          />
          <span
            className="font-semibold text-white"
            style={{ fontSize: 'min(13px, 4.5cqmin)' }}
          >
            My Quizzes
          </span>
          <span
            className="text-slate-400"
            style={{ fontSize: 'min(11px, 3.5cqmin)' }}
          >
            ({quizzes.length})
          </span>
        </div>
        <button
          onClick={onImport}
          className="flex items-center bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors"
          style={{
            gap: 'min(6px, 1.5cqmin)',
            padding: 'min(6px, 1.5cqmin) min(12px, 3cqmin)',
            fontSize: 'min(11px, 3.5cqmin)',
          }}
        >
          <Plus
            style={{ width: 'min(14px, 4cqmin)', height: 'min(14px, 4cqmin)' }}
          />
          Import from Sheet
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center bg-red-500/20 border border-red-500/40 rounded-lg text-red-300"
          style={{
            margin: 'min(12px, 2.5cqmin) min(16px, 4cqmin) 0',
            padding: 'min(10px, 2.5cqmin)',
            gap: 'min(8px, 2cqmin)',
            fontSize: 'min(11px, 3.5cqmin)',
          }}
        >
          <AlertCircle
            className="shrink-0"
            style={{
              width: 'min(16px, 4.5cqmin)',
              height: 'min(16px, 4.5cqmin)',
            }}
          />
          {error}
        </div>
      )}

      {/* Quiz list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 'min(16px, 4cqmin)' }}
      >
        {quizzes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full text-slate-400 py-12"
            style={{ gap: 'min(16px, 4cqmin)' }}
          >
            <FileSpreadsheet
              className="opacity-30"
              style={{
                width: 'min(48px, 12cqmin)',
                height: 'min(48px, 12cqmin)',
              }}
            />
            <div className="text-center">
              <p
                className="font-medium text-slate-300"
                style={{ fontSize: 'min(13px, 4.5cqmin)' }}
              >
                No quizzes yet
              </p>
              <p
                className="text-slate-500"
                style={{
                  fontSize: 'min(11px, 3.5cqmin)',
                  marginTop: 'min(4px, 1cqmin)',
                }}
              >
                Import a Google Sheet to create your first quiz
              </p>
            </div>
            <button
              onClick={onImport}
              className="flex items-center bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
              style={{
                gap: 'min(8px, 2cqmin)',
                padding: 'min(8px, 2cqmin) min(16px, 4cqmin)',
                fontSize: 'min(13px, 4.5cqmin)',
              }}
            >
              <FileSpreadsheet
                style={{
                  width: 'min(16px, 4.5cqmin)',
                  height: 'min(16px, 4.5cqmin)',
                }}
              />
              Import Google Sheet
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl transition-colors"
                style={{ padding: 'min(12px, 3cqmin)' }}
              >
                {/* Quiz info */}
                <div
                  className="flex items-start justify-between"
                  style={{
                    gap: 'min(12px, 3cqmin)',
                    marginBottom: 'min(12px, 3cqmin)',
                  }}
                >
                  <div className="min-w-0">
                    <h3
                      className="font-semibold text-white truncate"
                      style={{ fontSize: 'min(13px, 4.5cqmin)' }}
                    >
                      {quiz.title}
                    </h3>
                    <p
                      className="text-slate-400"
                      style={{
                        fontSize: 'min(11px, 3.5cqmin)',
                        marginTop: 'min(2px, 0.5cqmin)',
                      }}
                    >
                      {quiz.questionCount} question
                      {quiz.questionCount !== 1 ? 's' : ''} ·{' '}
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                {confirmDelete === quiz.id ? (
                  <div
                    className="flex items-center justify-end"
                    style={{ gap: 'min(8px, 2cqmin)' }}
                  >
                    <span
                      className="text-red-300"
                      style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                    >
                      Delete this quiz?
                    </span>
                    <button
                      onClick={() => {
                        setConfirmDelete(null);
                        onDelete(quiz);
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                      style={{
                        padding: 'min(4px, 1cqmin) min(8px, 2cqmin)',
                        fontSize: 'min(11px, 3.5cqmin)',
                      }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      style={{
                        padding: 'min(4px, 1cqmin) min(8px, 2cqmin)',
                        fontSize: 'min(11px, 3.5cqmin)',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-center flex-wrap"
                    style={{ gap: 'min(6px, 1.5cqmin)' }}
                  >
                    <ActionButton
                      icon={
                        <Eye
                          style={{
                            width: 'min(12px, 3.5cqmin)',
                            height: 'min(12px, 3.5cqmin)',
                          }}
                        />
                      }
                      label="Preview"
                      onClick={() => onPreview(quiz)}
                      color="slate"
                    />
                    <ActionButton
                      icon={
                        <Edit2
                          style={{
                            width: 'min(12px, 3.5cqmin)',
                            height: 'min(12px, 3.5cqmin)',
                          }}
                        />
                      }
                      label="Edit"
                      onClick={() => onEdit(quiz)}
                      color="slate"
                    />
                    <ActionButton
                      icon={
                        <BarChart3
                          style={{
                            width: 'min(12px, 3.5cqmin)',
                            height: 'min(12px, 3.5cqmin)',
                          }}
                        />
                      }
                      label="Results"
                      onClick={() => onResults(quiz)}
                      color="slate"
                    />
                    <ActionButton
                      icon={
                        <Trash2
                          style={{
                            width: 'min(12px, 3.5cqmin)',
                            height: 'min(12px, 3.5cqmin)',
                          }}
                        />
                      }
                      label="Delete"
                      onClick={() => setConfirmDelete(quiz.id)}
                      color="red"
                    />
                    <div className="ml-auto">
                      <button
                        onClick={() => onGoLive(quiz)}
                        disabled={hasActiveSession}
                        title={
                          hasActiveSession
                            ? 'End the current live session first'
                            : ''
                        }
                        className="flex items-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                        style={{
                          gap: 'min(6px, 1.5cqmin)',
                          padding: 'min(6px, 1.5cqmin) min(12px, 3cqmin)',
                          fontSize: 'min(11px, 3.5cqmin)',
                        }}
                      >
                        <Play
                          style={{
                            width: 'min(12px, 3.5cqmin)',
                            height: 'min(12px, 3.5cqmin)',
                          }}
                        />
                        Go Live
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: 'slate' | 'red';
}> = ({ icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center rounded-lg transition-colors ${
      color === 'red'
        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
        : 'bg-white/8 hover:bg-white/15 text-slate-300'
    }`}
    style={{
      gap: 'min(4px, 1cqmin)',
      padding: 'min(4px, 1cqmin) min(8px, 2cqmin)',
      fontSize: 'min(11px, 3.5cqmin)',
    }}
  >
    {icon}
    {label}
  </button>
);
