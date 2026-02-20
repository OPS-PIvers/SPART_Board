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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <FileUp className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">
            Import Quiz Questions
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Format guide */}
        <button
          onClick={() => setShowFormat(!showFormat)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-xl text-blue-300 text-xs transition-colors"
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium">
            View required format (CSV or Sheet)
          </span>
          <span className="ml-auto">{showFormat ? '▲' : '▼'}</span>
        </button>

        {showFormat && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2 text-xs">
            <p className="text-slate-300 font-semibold">
              CSV/Sheet column layout (left to right):
            </p>
            <div className="space-y-1 text-slate-400 font-mono">
              <p>
                <span className="text-amber-400">A:</span> Time Limit (seconds;
                blank = no limit)
              </p>
              <p>
                <span className="text-amber-400">B:</span> Question Text
              </p>
              <p>
                <span className="text-amber-400">C:</span> Type:{' '}
                <span className="text-green-400">MC</span> /{' '}
                <span className="text-green-400">FIB</span> /{' '}
                <span className="text-green-400">Matching</span> /{' '}
                <span className="text-green-400">Ordering</span>
              </p>
              <p>
                <span className="text-amber-400">D:</span> Correct Answer
              </p>
              <p>
                <span className="text-amber-400">E–H:</span> Incorrect 1–4 (MC
                only)
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700 space-y-1 text-slate-400">
              <p className="text-slate-300 font-semibold">
                Special formats for D (Correct Answer):
              </p>
              <p>
                <span className="text-purple-400">Matching:</span>{' '}
                <code className="text-slate-300">term1:def1|term2:def2</code>
              </p>
              <p>
                <span className="text-purple-400">Ordering:</span>{' '}
                <code className="text-slate-300">step1|step2|step3</code>
              </p>
            </div>
            <p className="text-slate-500 text-xs pt-1">
              <strong>Tip:</strong> CSV is more secure as it doesn&apos;t
              require making your sheet public. Export any Sheet or Excel file
              as &ldquo;Comma Separated Values (.csv)&rdquo;.
            </p>
          </div>
        )}

        {/* Input fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Quiz Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 5 Vocabulary Quiz"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Option 1: Upload CSV File (Recommended)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={(e) => void handleFileUpload(e)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || !title.trim()}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
            >
              <FileUp className="w-5 h-5 text-violet-400" />
              <span className="text-xs font-medium text-slate-300">
                Click to select CSV file
              </span>
            </button>
          </div>

          <div className="relative py-2 flex items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Or
            </span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Option 2: Google Sheet URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={() => void handleParse()}
                disabled={loading || !sheetUrl.trim() || !title.trim()}
                className="px-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl text-white transition-colors"
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

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview of parsed questions */}
        {parsedQuiz && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {parsedQuiz.questions.length} questions imported
                </span>
              </div>
              <button
                onClick={() => setParsedQuiz(null)}
                className="p-1 hover:bg-white/10 rounded text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {parsedQuiz.questions.map((q, i) => (
                <QuestionPreviewRow key={q.id} index={i} question={q} />
              ))}
            </div>

            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save to Drive'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const BADGE_COLORS: Record<string, string> = {
  MC: 'bg-blue-500/30 text-blue-300',
  FIB: 'bg-amber-500/30 text-amber-300',
  Matching: 'bg-purple-500/30 text-purple-300',
  Ordering: 'bg-teal-500/30 text-teal-300',
};

const QuestionPreviewRow: React.FC<{
  index: number;
  question: QuizQuestion;
}> = ({ index, question }) => (
  <div className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
    <span className="text-xs text-slate-500 mt-0.5 w-5 shrink-0">
      {index + 1}.
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-300 truncate">{question.text}</p>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium ${BADGE_COLORS[question.type] ?? ''}`}
        >
          {question.type}
        </span>
        {question.timeLimit > 0 && (
          <span className="text-xs text-slate-500">{question.timeLimit}s</span>
        )}
      </div>
    </div>
  </div>
);
