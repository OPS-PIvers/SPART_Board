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
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Loading quizzes…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">My Quizzes</span>
          <span className="text-xs text-slate-400 ml-1">
            ({quizzes.length})
          </span>
        </div>
        <button
          onClick={onImport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Import from Sheet
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Quiz list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 py-12">
            <FileSpreadsheet className="w-12 h-12 opacity-30" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">
                No quizzes yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Import a Google Sheet to create your first quiz
              </p>
            </div>
            <button
              onClick={onImport}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import Google Sheet
            </button>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-3 transition-colors"
            >
              {/* Quiz info */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {quiz.questionCount} question
                    {quiz.questionCount !== 1 ? 's' : ''} ·{' '}
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              {confirmDelete === quiz.id ? (
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-red-300">
                    Delete this quiz?
                  </span>
                  <button
                    onClick={() => {
                      setConfirmDelete(null);
                      onDelete(quiz);
                    }}
                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ActionButton
                    icon={<Eye className="w-3 h-3" />}
                    label="Preview"
                    onClick={() => onPreview(quiz)}
                    color="slate"
                  />
                  <ActionButton
                    icon={<Edit2 className="w-3 h-3" />}
                    label="Edit"
                    onClick={() => onEdit(quiz)}
                    color="slate"
                  />
                  <ActionButton
                    icon={<BarChart3 className="w-3 h-3" />}
                    label="Results"
                    onClick={() => onResults(quiz)}
                    color="slate"
                  />
                  <ActionButton
                    icon={<Trash2 className="w-3 h-3" />}
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      Go Live
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
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
    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors ${
      color === 'red'
        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
        : 'bg-white/8 hover:bg-white/15 text-slate-300'
    }`}
  >
    {icon}
    {label}
  </button>
);
