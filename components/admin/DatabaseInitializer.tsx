import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { GlobalFeature } from '../../types';
import { Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const DatabaseInitializer: React.FC = () => {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const init = async () => {
    setStatus('loading');
    setError(null);

    const features = [
      { id: 'gemini-functions', dailyLimit: 20 },
      { id: 'live-session' },
      { id: 'dashboard-sharing' },
      { id: 'dashboard-import' },
    ];

    try {
      for (const feature of features) {
        await setDoc(
          doc(db, 'global_permissions', feature.id),
          {
            featureId: feature.id as GlobalFeature,
            enabled: true,
            accessLevel: 'public',
            betaUsers: [],
            config:
              feature.id === 'gemini-functions'
                ? { dailyLimit: feature.dailyLimit }
                : {},
          },
          { merge: true }
        );
      }
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Permission Denied');
    }
  };

  if (status === 'success') {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
        <CheckCircle2 size={16} />
        <span className="text-xs font-bold uppercase">
          DB Initialized! Refresh now.
        </span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={init}
        disabled={status === 'loading'}
        className="bg-brand-blue-primary hover:bg-brand-blue-dark text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
      >
        {status === 'loading' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === 'error' ? (
          <AlertCircle size={16} />
        ) : (
          <Play size={16} />
        )}
        <span className="text-xs font-bold uppercase">
          {status === 'error' ? 'Retry Init' : 'Force Init DB'}
        </span>
      </button>
      {error && (
        <div className="absolute bottom-full mb-2 right-0 bg-red-500 text-white text-[10px] p-2 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};
