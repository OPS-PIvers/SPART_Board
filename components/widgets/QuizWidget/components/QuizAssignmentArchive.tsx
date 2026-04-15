/**
 * QuizAssignmentArchive — teacher's list of past and current quiz assignments.
 *
 * Each row represents a single assignment (one instance of a quiz being
 * assigned out to students). Actions available per row:
 *   - Copy join URL (if active/paused)
 *   - Monitor (re-opens the live session)
 *   - Results (review responses)
 *   - Edit settings (class label, PLC, session toggles)
 *   - Share (publishes as /share/assignment/{id})
 *   - Pause / Resume toggle
 *   - Make Inactive (kills URL, preserves responses)
 *   - Delete (hard delete, removes responses)
 */

import React, { useState } from 'react';
import {
  Link2,
  Monitor,
  BarChart3,
  Settings,
  Share2,
  Pause,
  Play,
  PowerOff,
  Trash2,
  Calendar,
  Loader2,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import type { QuizAssignment } from '@/types';

interface QuizAssignmentArchiveProps {
  assignments: QuizAssignment[];
  loading: boolean;
  onCopyUrl: (assignment: QuizAssignment) => void;
  onMonitor: (assignment: QuizAssignment) => void;
  onResults: (assignment: QuizAssignment) => void;
  onEditSettings: (assignment: QuizAssignment) => void;
  onShare: (assignment: QuizAssignment) => void;
  onPauseResume: (assignment: QuizAssignment) => void;
  onDeactivate: (assignment: QuizAssignment) => void;
  onDelete: (assignment: QuizAssignment) => void;
}

const STATUS_STYLES: Record<
  QuizAssignment['status'],
  { label: string; bg: string; fg: string; dot: string }
> = {
  active: {
    label: 'Active',
    bg: 'bg-emerald-100',
    fg: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  paused: {
    label: 'Paused',
    bg: 'bg-amber-100',
    fg: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  inactive: {
    label: 'Inactive',
    bg: 'bg-slate-200',
    fg: 'text-slate-600',
    dot: 'bg-slate-400',
  },
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const QuizAssignmentArchive: React.FC<QuizAssignmentArchiveProps> = ({
  assignments,
  loading,
  onCopyUrl,
  onMonitor,
  onResults,
  onEditSettings,
  onShare,
  onPauseResume,
  onDeactivate,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(
    null
  );

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center flex-1 text-brand-blue-primary/60"
        style={{ gap: 'min(12px, 3cqmin)' }}
      >
        <Loader2
          className="animate-spin"
          style={{ width: 'min(28px, 7cqmin)', height: 'min(28px, 7cqmin)' }}
        />
        <span style={{ fontSize: 'min(12px, 3.5cqmin)' }}>
          Loading assignments…
        </span>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center flex-1 text-center text-brand-blue-primary/60"
        style={{ padding: 'min(24px, 6cqmin)', gap: 'min(10px, 2.5cqmin)' }}
      >
        <Inbox
          className="opacity-40"
          style={{ width: 'min(40px, 10cqmin)', height: 'min(40px, 10cqmin)' }}
        />
        <p
          className="font-semibold text-brand-blue-dark"
          style={{ fontSize: 'min(14px, 4.5cqmin)' }}
        >
          No assignments yet
        </p>
        <p style={{ fontSize: 'min(12px, 3.5cqmin)', maxWidth: 320 }}>
          When you assign a quiz from the Library, it appears here so you can
          monitor, review results, or pause/resume it later.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto custom-scrollbar"
      style={{ padding: 'min(16px, 4cqmin)' }}
    >
      <div className="flex flex-col" style={{ gap: 'min(10px, 2.5cqmin)' }}>
        {assignments.map((a) => {
          const styles = STATUS_STYLES[a.status];
          const isActive = a.status === 'active';
          const isPaused = a.status === 'paused';
          const isInactive = a.status === 'inactive';
          const urlLive = isActive || isPaused;
          const isConfirmingDelete = confirmDelete === a.id;
          const isConfirmingDeactivate = confirmDeactivate === a.id;

          return (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-brand-blue-primary/15 shadow-sm hover:shadow transition-shadow"
              style={{ padding: 'min(12px, 3cqmin)' }}
            >
              {/* Row header: title + status pill */}
              <div
                className="flex items-start justify-between"
                style={{ gap: 'min(8px, 2cqmin)' }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-brand-blue-dark truncate"
                    style={{ fontSize: 'min(14px, 4.5cqmin)' }}
                  >
                    {a.quizTitle}
                  </div>
                  <div
                    className="flex items-center text-brand-blue-primary/70 mt-0.5"
                    style={{
                      gap: 'min(10px, 2.5cqmin)',
                      fontSize: 'min(11px, 3.5cqmin)',
                    }}
                  >
                    {a.className && (
                      <span className="font-semibold truncate">
                        {a.className}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar
                        style={{
                          width: 'min(11px, 3cqmin)',
                          height: 'min(11px, 3cqmin)',
                        }}
                      />
                      {formatDate(a.createdAt)}
                    </span>
                    <span className="font-mono tracking-wider">{a.code}</span>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1.5 rounded-full ${styles.bg} ${styles.fg} font-bold uppercase tracking-wide shrink-0`}
                  style={{
                    padding: 'min(3px, 0.75cqmin) min(10px, 2.5cqmin)',
                    fontSize: 'min(10px, 2.75cqmin)',
                  }}
                >
                  <span
                    className={`rounded-full ${styles.dot}`}
                    style={{
                      width: 'min(6px, 1.5cqmin)',
                      height: 'min(6px, 1.5cqmin)',
                    }}
                  />
                  {styles.label}
                </div>
              </div>

              {/* Inline delete confirmation */}
              {isConfirmingDelete && (
                <div
                  className="mt-2 flex items-center justify-between bg-brand-red-lighter/40 border border-brand-red-primary/30 rounded-lg"
                  style={{
                    padding: 'min(8px, 2cqmin) min(10px, 2.5cqmin)',
                    gap: 'min(8px, 2cqmin)',
                  }}
                >
                  <div
                    className="flex items-center gap-2 text-brand-red-dark"
                    style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                  >
                    <AlertTriangle
                      style={{
                        width: 'min(14px, 3.5cqmin)',
                        height: 'min(14px, 3.5cqmin)',
                      }}
                    />
                    Delete assignment and all student responses?
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-0.5 rounded bg-white text-brand-blue-dark font-semibold border border-brand-blue-primary/20"
                      style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDelete(null);
                        onDelete(a);
                      }}
                      className="px-2 py-0.5 rounded bg-brand-red-primary text-white font-bold"
                      style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Inline deactivate confirmation */}
              {isConfirmingDeactivate && (
                <div
                  className="mt-2 flex items-center justify-between bg-amber-50 border border-amber-300 rounded-lg"
                  style={{
                    padding: 'min(8px, 2cqmin) min(10px, 2.5cqmin)',
                    gap: 'min(8px, 2cqmin)',
                  }}
                >
                  <div
                    className="flex items-center gap-2 text-amber-900"
                    style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                  >
                    <AlertTriangle
                      style={{
                        width: 'min(14px, 3.5cqmin)',
                        height: 'min(14px, 3.5cqmin)',
                      }}
                    />
                    The join URL will stop working. Responses are preserved.
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmDeactivate(null)}
                      className="px-2 py-0.5 rounded bg-white text-brand-blue-dark font-semibold border border-brand-blue-primary/20"
                      style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDeactivate(null);
                        onDeactivate(a);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold"
                      style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                    >
                      Make Inactive
                    </button>
                  </div>
                </div>
              )}

              {/* Action row */}
              <div
                className="flex flex-wrap items-center mt-2"
                style={{ gap: 'min(6px, 1.5cqmin)' }}
              >
                <button
                  onClick={() => onCopyUrl(a)}
                  disabled={!urlLive}
                  className="flex items-center gap-1 rounded-lg bg-brand-blue-primary text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-blue-dark transition-colors"
                  style={{
                    padding: 'min(5px, 1.25cqmin) min(10px, 2.5cqmin)',
                    fontSize: 'min(11px, 3.25cqmin)',
                  }}
                  title={
                    urlLive ? 'Copy student join URL' : 'Assignment is inactive'
                  }
                >
                  <Link2
                    style={{
                      width: 'min(12px, 3cqmin)',
                      height: 'min(12px, 3cqmin)',
                    }}
                  />
                  Copy URL
                </button>
                <button
                  onClick={() => onMonitor(a)}
                  className="flex items-center gap-1 rounded-lg bg-white text-brand-blue-dark font-bold border border-brand-blue-primary/20 hover:bg-brand-blue-lighter/40 transition-colors"
                  style={{
                    padding: 'min(5px, 1.25cqmin) min(10px, 2.5cqmin)',
                    fontSize: 'min(11px, 3.25cqmin)',
                  }}
                >
                  <Monitor
                    style={{
                      width: 'min(12px, 3cqmin)',
                      height: 'min(12px, 3cqmin)',
                    }}
                  />
                  Monitor
                </button>
                <button
                  onClick={() => onResults(a)}
                  className="flex items-center gap-1 rounded-lg bg-white text-brand-blue-dark font-bold border border-brand-blue-primary/20 hover:bg-brand-blue-lighter/40 transition-colors"
                  style={{
                    padding: 'min(5px, 1.25cqmin) min(10px, 2.5cqmin)',
                    fontSize: 'min(11px, 3.25cqmin)',
                  }}
                >
                  <BarChart3
                    style={{
                      width: 'min(12px, 3cqmin)',
                      height: 'min(12px, 3cqmin)',
                    }}
                  />
                  Results
                </button>
                <button
                  onClick={() => onEditSettings(a)}
                  className="flex items-center gap-1 rounded-lg bg-white text-brand-blue-dark font-bold border border-brand-blue-primary/20 hover:bg-brand-blue-lighter/40 transition-colors"
                  style={{
                    padding: 'min(5px, 1.25cqmin) min(10px, 2.5cqmin)',
                    fontSize: 'min(11px, 3.25cqmin)',
                  }}
                >
                  <Settings
                    style={{
                      width: 'min(12px, 3cqmin)',
                      height: 'min(12px, 3cqmin)',
                    }}
                  />
                  Settings
                </button>
                <button
                  onClick={() => onShare(a)}
                  className="flex items-center gap-1 rounded-lg bg-white text-brand-blue-dark font-bold border border-brand-blue-primary/20 hover:bg-brand-blue-lighter/40 transition-colors"
                  style={{
                    padding: 'min(5px, 1.25cqmin) min(10px, 2.5cqmin)',
                    fontSize: 'min(11px, 3.25cqmin)',
                  }}
                >
                  <Share2
                    style={{
                      width: 'min(12px, 3cqmin)',
                      height: 'min(12px, 3cqmin)',
                    }}
                  />
                  Share
                </button>

                {/* Spacer pushes destructive actions to the right */}
                <div className="flex-1" />

                {urlLive && (
                  <button
                    onClick={() => onPauseResume(a)}
                    className={`flex items-center gap-1 rounded-lg font-bold transition-colors ${
                      isPaused
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                    style={{
                      padding: 'min(5px, 1.25cqmin) min(10px, 2.5cqmin)',
                      fontSize: 'min(11px, 3.25cqmin)',
                    }}
                  >
                    {isPaused ? (
                      <Play
                        style={{
                          width: 'min(12px, 3cqmin)',
                          height: 'min(12px, 3cqmin)',
                        }}
                      />
                    ) : (
                      <Pause
                        style={{
                          width: 'min(12px, 3cqmin)',
                          height: 'min(12px, 3cqmin)',
                        }}
                      />
                    )}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                )}

                {urlLive && (
                  <button
                    onClick={() => setConfirmDeactivate(a.id)}
                    className="flex items-center gap-1 rounded-lg bg-white text-amber-700 font-bold border border-amber-300 hover:bg-amber-50 transition-colors"
                    style={{
                      padding: 'min(5px, 1.25cqmin) min(10px, 2.5cqmin)',
                      fontSize: 'min(11px, 3.25cqmin)',
                    }}
                    title="Kill the join URL. Responses are kept."
                  >
                    <PowerOff
                      style={{
                        width: 'min(12px, 3cqmin)',
                        height: 'min(12px, 3cqmin)',
                      }}
                    />
                    Make Inactive
                  </button>
                )}

                <button
                  onClick={() => setConfirmDelete(a.id)}
                  className="flex items-center gap-1 rounded-lg text-brand-red-dark font-bold border border-brand-red-primary/30 hover:bg-brand-red-lighter/40 transition-colors"
                  style={{
                    padding: 'min(5px, 1.25cqmin) min(10px, 2.5cqmin)',
                    fontSize: 'min(11px, 3.25cqmin)',
                  }}
                  title={
                    isInactive
                      ? 'Delete assignment and responses'
                      : 'Delete assignment and all responses'
                  }
                >
                  <Trash2
                    style={{
                      width: 'min(12px, 3cqmin)',
                      height: 'min(12px, 3cqmin)',
                    }}
                  />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
