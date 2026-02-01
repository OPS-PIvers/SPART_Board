import React, { useState } from 'react';
import { Bot, Wand2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { useAuth } from '../../context/useAuth';

export const JulesWidgetGenerator: React.FC = () => {
  const { isAdmin } = useAuth();
  const [widgetName, setWidgetName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');
  const [prLink, setPrLink] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!widgetName || !description) return;

    if (!isAdmin) {
      setStatus('error');
      setMessage('Access Denied: Only administrators can trigger Jules.');
      return;
    }

    setStatus('loading');
    setMessage(
      'Connecting to Jules Agent... This may take a few minutes as Jules implements the widget and creates a Pull Request.'
    );

    try {
      const triggerJules = httpsCallable(
        functions,
        'triggerJulesWidgetGeneration'
      );
      const result = await triggerJules({
        widgetName,
        description,
      });

      const data = result.data as {
        success: boolean;
        message: string;
        consoleUrl?: string;
      };

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        if (data.consoleUrl) setPrLink(data.consoleUrl);
      } else {
        throw new Error(data.message);
      }
    } catch (error: unknown) {
      setStatus('error');
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMessage(
        errorMsg ??
          'Failed to trigger Jules. Please check if the Jules API key is configured.'
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-brand-blue-lighter/30 p-4 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 bg-brand-blue-primary text-white rounded-lg">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">Jules Widget Architect</h4>
          <p className="text-xs text-slate-600">
            Asynchronously build and deploy new classroom tools via AI.
          </p>
        </div>
      </div>

      <div className="p-6">
        {status === 'idle' || status === 'loading' ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Widget Name
              </label>
              <input
                type="text"
                value={widgetName}
                onChange={(e) => setWidgetName(e.target.value)}
                placeholder="e.g., Vocabulary Matcher"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-primary focus:border-brand-blue-primary outline-none transition-all"
                disabled={status === 'loading'}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                What should this widget do?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the features, layout, and any specific logic needed..."
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-primary focus:border-brand-blue-primary outline-none transition-all resize-none"
                disabled={status === 'loading'}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !widgetName || !description}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                status === 'loading'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-blue-primary text-white hover:bg-brand-blue-dark shadow-md active:scale-[0.98]'
              }`}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Summon Jules to Implement
                </>
              )}
            </button>
          </form>
        ) : status === 'success' ? (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h5 className="text-lg font-bold text-slate-800">
              Task Assigned to Jules!
            </h5>
            <p className="text-slate-600 max-w-md mx-auto">{message}</p>
            {prLink && (
              <a
                href={prLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 bg-brand-blue-primary text-white font-bold rounded-lg hover:bg-brand-blue-dark transition-colors"
              >
                View Jules Session
              </a>
            )}
            <div className="pt-4">
              <button
                onClick={() => setStatus('idle')}
                className="text-brand-blue-primary font-bold hover:underline"
              >
                Create another widget
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-2">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h5 className="text-lg font-bold text-slate-800">
              Summoning Failed
            </h5>
            <p className="text-slate-600 max-w-md mx-auto">{message}</p>
            <div className="pt-4">
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-2 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 border-t border-slate-200">
        <h5 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-blue-primary" />
          How it works
        </h5>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
          <li>
            Jules will analyze the existing codebase to understand our design
            system and widget patterns.
          </li>
          <li>
            A new branch will be created on GitHub with the implementation.
          </li>
          <li>Jules will automatically open a Pull Request for review.</li>
          <li>You can monitor the progress in the Jules console.</li>
        </ul>
      </div>
    </div>
  );
};

const Shield: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);
