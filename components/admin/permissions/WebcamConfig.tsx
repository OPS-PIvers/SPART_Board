import React from 'react';
import { WebcamGlobalConfig } from '../../../types';

interface WebcamConfigProps {
  config: WebcamGlobalConfig;
  onChange: (config: WebcamGlobalConfig) => void;
}

export const WebcamConfig: React.FC<WebcamConfigProps> = ({
  config,
  onChange,
}) => {
  return (
    <div>
      <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
        OCR Mode
      </label>
      <div className="flex bg-white rounded-lg border border-slate-200 p-1">
        <button
          onClick={() =>
            onChange({
              ...config,
              ocrMode: 'standard',
            })
          }
          className={`flex-1 py-1.5 text-xxs font-bold rounded transition-colors ${
            config.ocrMode === 'standard' || !config.ocrMode
              ? 'bg-brand-blue-primary text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Standard (Local)
        </button>
        <button
          onClick={() =>
            onChange({
              ...config,
              ocrMode: 'gemini',
            })
          }
          className={`flex-1 py-1.5 text-xxs font-bold rounded transition-colors ${
            config.ocrMode === 'gemini'
              ? 'bg-brand-blue-primary text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Gemini (AI)
        </button>
      </div>
      <p className="text-xxs text-slate-400 mt-1">
        <strong>Standard:</strong> Uses browser-local OCR (no API usage).
        <br />
        <strong>Gemini:</strong> Uses Gemini 3 Flash for higher accuracy (uses
        AI limits).
      </p>
    </div>
  );
};
