/**
 * QuizImporter — imports a quiz from a Google Sheet.
 * Shows field format instructions and previews the parsed questions before saving.
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileUp,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  X,
} from 'lucide-react';
import { QuizData, QuizQuestion } from '@/types';

interface QuizImporterProps {
  onBack: () => void;
  onSave: (quiz: QuizData) => Promise<void>;
  importFromSheet: (sheetUrl: string, title: string) => Promise<QuizData>;
  importFromCSV: (csvContent: string, title: string) => Promise<QuizData>;
}

export const QuizImporter: React.FC<QuizImporterProps> = ({
  onBack,
  onSave,
  importFromSheet,
  importFromCSV,
}) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [title, setTitle] = useState('');
  const [parsedQuiz, setParsedQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormat, setShowFormat] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleParse = async () => {
    if (!sheetUrl.trim()) {
      setError('Please enter a Google Sheet URL.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title for this quiz.');
      return;
    }
    setLoading(true);
    setError(null);
    setParsedQuiz(null);
    try {
      const quiz = await importFromSheet(sheetUrl.trim(), title.trim());
      setParsedQuiz(quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title.trim()) {
      setError('Please enter a title before uploading a CSV.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoading(true);
    setError(null);
    setParsedQuiz(null);

    try {
      const content = await file.text();
      const quiz = await importFromCSV(content, title.trim());
      setParsedQuiz(quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!parsedQuiz) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(parsedQuiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-sans">
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b border-brand-blue-primary/10 bg-brand-blue-lighter/30"
        style={{ padding: 'min(12px, 2.5cqmin) min(16px, 4cqmin)' }}
      >
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-brand-blue-primary/10 rounded-lg transition-colors text-brand-blue-primary"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="bg-brand-blue-primary text-white flex items-center justify-center rounded-lg"
            style={{ width: 'min(24px, 6cqmin)', height: 'min(24px, 6cqmin)' }}
          >
            <FileUp
              style={{
                width: 'min(14px, 3.5cqmin)',
                height: 'min(14px, 3.5cqmin)',
              }}
            />
          </div>
          <span
            className="font-bold text-brand-blue-dark"
            style={{ fontSize: 'min(14px, 4.5cqmin)' }}
          >
            Import Quiz
          </span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{ padding: 'min(16px, 4cqmin)' }}
      >
        <div className="space-y-4">
          {/* Format guide */}
          <button
            onClick={() => setShowFormat(!showFormat)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-brand-blue-primary/20 rounded-xl text-brand-blue-primary text-xs transition-all hover:bg-brand-blue-lighter/50 font-bold shadow-sm"
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">Required Template Format</span>
            <span className="ml-auto opacity-40">{showFormat ? '▲' : '▼'}</span>
          </button>

          {showFormat && (
            <div className="bg-brand-blue-lighter/40 border border-brand-blue-primary/10 rounded-xl p-3 space-y-2 text-xs">
              <p className="text-brand-blue-dark font-bold">
                Column layout (Left to Right):
              </p>
              <div className="space-y-1 text-brand-blue-primary font-mono bg-white/50 p-2 rounded-lg border border-brand-blue-primary/5">
                <p>
                  <span className="font-bold text-brand-red-primary">A:</span>{' '}
                  Time Limit (seconds)
                </p>
                <p>
                  <span className="font-bold text-brand-red-primary">B:</span>{' '}
                  Question Text
                </p>
                <p>
                  <span className="font-bold text-brand-red-primary">C:</span>{' '}
                  Type (MC, FIB, Matching, Ordering)
                </p>
                <p>
                  <span className="font-bold text-brand-red-primary">D:</span>{' '}
                  Correct Answer
                </p>
                <p>
                  <span className="font-bold text-brand-red-primary">E–H:</span>{' '}
                  Incorrect 1–4 (MC only)
                </p>
              </div>
              <p className="text-brand-gray-primary text-[10px] leading-relaxed italic">
                <strong>Tip:</strong> CSV is private and doesn&apos;t require
                public link sharing. Use it for sensitive assessments.
              </p>
            </div>
          )}

          {/* Input fields */}
          <div className="space-y-4">
            <div>
              <label
                className="block font-bold text-brand-blue-dark mb-1.5"
                style={{ fontSize: 'min(12px, 3.5cqmin)' }}
              >
                1. Quiz Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Unit 4 Review"
                className="w-full px-4 py-2 bg-white border-2 border-brand-blue-primary/10 rounded-xl text-brand-blue-dark font-medium placeholder-brand-gray-lighter focus:outline-none focus:border-brand-blue-primary transition-colors shadow-sm"
                style={{ fontSize: 'min(13px, 4cqmin)' }}
              />
            </div>

            <div className="bg-white border border-brand-blue-primary/10 rounded-2xl p-4 shadow-sm space-y-3">
              <label
                className="block font-bold text-brand-blue-dark"
                style={{ fontSize: 'min(12px, 3.5cqmin)' }}
              >
                2. Choose Import Method
              </label>

              <div className="grid grid-cols-1 gap-3">
                {/* CSV Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || !title.trim()}
                  className="w-full py-4 bg-brand-blue-lighter/30 hover:bg-brand-blue-lighter/60 disabled:opacity-40 border-2 border-dashed border-brand-blue-primary/30 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95"
                >
                  <FileUp className="w-6 h-6 text-brand-blue-primary group-hover:scale-110 transition-transform" />
                  <span
                    className="font-bold text-brand-blue-primary"
                    style={{ fontSize: 'min(12px, 3.5cqmin)' }}
                  >
                    Upload CSV File
                  </span>
                  <p
                    className="text-brand-blue-primary/60"
                    style={{ fontSize: 'min(10px, 3cqmin)' }}
                  >
                    Private & Secure
                  </p>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={(e) => void handleFileUpload(e)}
                  className="hidden"
                />

                <div className="relative py-1 flex items-center">
                  <div className="flex-grow border-t border-brand-blue-primary/10"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-black text-brand-blue-primary/30 uppercase tracking-widest">
                    OR
                  </span>
                  <div className="flex-grow border-t border-brand-blue-primary/10"></div>
                </div>

                {/* Google Sheet URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="Google Sheet URL..."
                    className="flex-1 px-4 py-2 bg-brand-gray-lightest/50 border border-brand-blue-primary/10 rounded-xl text-brand-blue-dark font-medium placeholder-brand-gray-lighter focus:outline-none focus:border-brand-blue-primary transition-colors"
                    style={{ fontSize: 'min(12px, 3.5cqmin)' }}
                  />
                  <button
                    onClick={() => void handleParse()}
                    disabled={loading || !sheetUrl.trim() || !title.trim()}
                    className="px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-brand-gray-lighter text-white font-bold rounded-xl transition-all shadow-sm active:scale-90"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-2 p-3 bg-brand-red-lighter/40 border border-brand-red-primary/20 rounded-xl text-brand-red-dark font-medium"
              style={{ fontSize: 'min(11px, 3.5cqmin)' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview of parsed questions */}
          {parsedQuiz && (
            <div className="space-y-3 pt-2 border-t border-brand-blue-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span
                    className="font-bold"
                    style={{ fontSize: 'min(13px, 4cqmin)' }}
                  >
                    {parsedQuiz.questions.length} questions ready
                  </span>
                </div>
                <button
                  onClick={() => setParsedQuiz(null)}
                  className="p-1 hover:bg-brand-gray-lightest rounded-lg text-brand-gray-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                {parsedQuiz.questions.map((q, i) => (
                  <QuestionPreviewRow key={q.id} index={i} question={q} />
                ))}
              </div>

              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="w-full py-3 bg-brand-blue-primary hover:bg-brand-blue-dark disabled:bg-brand-gray-lighter text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                style={{ fontSize: 'min(14px, 4.5cqmin)' }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    SAVE QUIZ TO LIBRARY
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BADGE_COLORS: Record<string, string> = {
  MC: 'bg-blue-100 text-blue-700 border-blue-200',
  FIB: 'bg-amber-100 text-amber-700 border-amber-200',
  Matching: 'bg-purple-100 text-purple-700 border-purple-200',
  Ordering: 'bg-teal-100 text-teal-700 border-teal-200',
};

const QuestionPreviewRow: React.FC<{
  index: number;
  question: QuizQuestion;
}> = ({ index, question }) => (
  <div className="flex items-start gap-3 p-3 bg-white border border-brand-blue-primary/5 rounded-xl shadow-sm">
    <span
      className="font-bold text-brand-blue-primary/40 shrink-0"
      style={{ fontSize: 'min(11px, 3.5cqmin)' }}
    >
      {index + 1}.
    </span>
    <div className="flex-1 min-w-0">
      <p
        className="font-bold text-brand-blue-dark truncate"
        style={{ fontSize: 'min(12px, 3.5cqmin)' }}
      >
        {question.text}
      </p>
      <div className="flex items-center gap-2 mt-1.5">
        <span
          className={`font-black rounded-md border tracking-wider ${BADGE_COLORS[question.type] ?? ''}`}
          style={{
            fontSize: 'min(9px, 2.5cqmin)',
            padding: 'min(1px, 0.2cqmin) min(5px, 1cqmin)',
            textTransform: 'uppercase',
          }}
        >
          {question.type}
        </span>
        {question.timeLimit > 0 && (
          <span
            className="font-bold text-brand-gray-primary"
            style={{ fontSize: 'min(10px, 3cqmin)' }}
          >
            ⏱ {question.timeLimit}s
          </span>
        )}
      </div>
    </div>
  </div>
);
