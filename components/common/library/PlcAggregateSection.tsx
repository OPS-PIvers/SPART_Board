/**
 * PlcAggregateSection — one schema group's cross-teacher rollup (average,
 * distribution buckets, per-question stats). Rendered by `PlcAnalyticsBody`.
 */

import React from 'react';
import { Trophy, Users, Target, CheckCircle2, XCircle } from 'lucide-react';
import type { SchemaGroup } from './plcAnalyticsAggregate';

interface PlcAggregateSectionProps {
  group: SchemaGroup;
  showHeader: boolean;
  groupNumber: number;
}

export const PlcAggregateSection: React.FC<PlcAggregateSectionProps> = ({
  group,
  showHeader,
  groupNumber,
}) => {
  const { aggregate, questions, teachers } = group;
  return (
    <section className="flex flex-col" style={{ gap: 'min(16px, 4cqmin)' }}>
      {showHeader && (
        <header
          className="bg-white border border-brand-blue-primary/10 rounded-2xl p-3 shadow-sm"
          style={{ fontSize: 'min(12px, 4cqmin)' }}
        >
          <p
            className="font-black text-brand-blue-primary uppercase tracking-widest mb-1"
            style={{ fontSize: 'min(10px, 3.5cqmin)' }}
          >
            Version {groupNumber} · {questions.length} question
            {questions.length === 1 ? '' : 's'}
          </p>
          <p className="text-brand-blue-dark/80 font-bold">
            {teachers.map((t) => t.name).join(', ')}
          </p>
        </header>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border-2 border-brand-blue-primary/10 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
          <Trophy
            className="text-amber-400 mx-auto mb-1 group-hover:scale-110 transition-transform"
            style={{ width: 'min(24px, 6cqmin)', height: 'min(24px, 6cqmin)' }}
          />
          <p
            className="font-black text-brand-blue-dark leading-none"
            style={{ fontSize: 'min(28px, 9cqmin)' }}
          >
            {aggregate.averageScore !== null
              ? `${aggregate.averageScore}%`
              : '—'}
          </p>
          <p
            className="text-brand-blue-primary/60 font-black uppercase tracking-widest mt-1"
            style={{ fontSize: 'min(10px, 3cqmin)' }}
          >
            PLC Average
          </p>
        </div>
        <div className="bg-white border-2 border-brand-blue-primary/10 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue-primary"></div>
          <Users
            className="text-brand-blue-primary mx-auto mb-1 group-hover:scale-110 transition-transform"
            style={{ width: 'min(24px, 6cqmin)', height: 'min(24px, 6cqmin)' }}
          />
          <p
            className="font-black text-brand-blue-dark leading-none"
            style={{ fontSize: 'min(28px, 9cqmin)' }}
          >
            {aggregate.totalCompleted}
          </p>
          <p
            className="text-brand-blue-primary/60 font-black uppercase tracking-widest mt-1"
            style={{ fontSize: 'min(10px, 3cqmin)' }}
          >
            Students
          </p>
        </div>
        <div className="bg-white border-2 border-brand-blue-primary/10 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <Target
            className="text-emerald-500 mx-auto mb-1 group-hover:scale-110 transition-transform"
            style={{ width: 'min(24px, 6cqmin)', height: 'min(24px, 6cqmin)' }}
          />
          <p
            className="font-black text-brand-blue-dark leading-none"
            style={{ fontSize: 'min(28px, 9cqmin)' }}
          >
            {aggregate.totalTeachers}
          </p>
          <p
            className="text-brand-blue-primary/60 font-black uppercase tracking-widest mt-1"
            style={{ fontSize: 'min(10px, 3cqmin)' }}
          >
            {aggregate.totalTeachers === 1 ? 'Teacher' : 'Teachers'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-brand-blue-primary/10 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target
            className="text-brand-blue-primary"
            style={{ width: 'min(16px, 4cqmin)', height: 'min(16px, 4cqmin)' }}
          />
          <span
            className="font-black text-brand-blue-dark uppercase tracking-widest"
            style={{ fontSize: 'min(10px, 3.5cqmin)' }}
          >
            Score Distribution (PLC)
          </span>
        </div>
        <div className="space-y-4">
          {aggregate.buckets.map((b) => {
            const pct =
              aggregate.totalCompleted > 0
                ? Math.round((b.count / aggregate.totalCompleted) * 100)
                : 0;
            return (
              <div key={b.label}>
                <div
                  className="flex items-center justify-between mb-1.5 font-bold"
                  style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                >
                  <span className="text-brand-blue-dark">{b.label}</span>
                  <span className="text-brand-blue-primary/60">
                    {b.count} {b.count === 1 ? 'Student' : 'Students'} ({pct}%)
                  </span>
                </div>
                <div className="h-3 bg-brand-blue-lighter rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full ${b.color} rounded-full transition-all duration-1000 shadow-lg`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Target
            className="text-brand-blue-primary"
            style={{ width: 'min(16px, 4cqmin)', height: 'min(16px, 4cqmin)' }}
          />
          <span
            className="font-black text-brand-blue-dark uppercase tracking-widest"
            style={{ fontSize: 'min(10px, 3.5cqmin)' }}
          >
            Per-Question Accuracy (PLC)
          </span>
        </div>
        {questions.map((q, i) => {
          const stats = aggregate.perQuestion[i];
          return (
            <div
              key={q.id}
              className="bg-white border border-brand-blue-primary/10 rounded-2xl p-4 shadow-sm hover:border-brand-blue-primary/20 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="bg-brand-blue-lighter px-2 py-0.5 rounded text-brand-blue-primary font-black uppercase tracking-tighter"
                  style={{ fontSize: 'min(9px, 2.5cqmin)' }}
                >
                  Question {i + 1}
                </div>
                <div
                  className="font-black text-brand-blue-dark"
                  style={{ fontSize: 'min(12px, 4cqmin)' }}
                >
                  {stats.percent}% Accuracy
                </div>
              </div>
              <p
                className="font-bold text-brand-blue-dark leading-tight line-clamp-2"
                style={{ fontSize: 'min(13px, 4.5cqmin)' }}
              >
                {q.text}
              </p>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-brand-blue-primary/5">
                <div
                  className="flex items-center gap-1.5 text-emerald-600 font-bold"
                  style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                >
                  <CheckCircle2
                    style={{
                      width: 'min(14px, 4cqmin)',
                      height: 'min(14px, 4cqmin)',
                    }}
                  />
                  {stats.correct} Correct
                </div>
                <div
                  className="flex items-center gap-1.5 text-brand-red-primary font-bold"
                  style={{ fontSize: 'min(11px, 3.5cqmin)' }}
                >
                  <XCircle
                    style={{
                      width: 'min(14px, 4cqmin)',
                      height: 'min(14px, 4cqmin)',
                    }}
                  />
                  {stats.answered - stats.correct} Missed
                </div>
              </div>
              <div className="h-2 bg-brand-blue-lighter rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
