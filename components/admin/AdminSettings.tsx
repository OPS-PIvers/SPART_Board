import React, { useState } from 'react';
import {
  Settings,
  X,
  ArrowLeft,
  Shield,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { FeaturePermissionsManager } from './FeaturePermissionsManager';
import { BackgroundManager } from './BackgroundManager';

interface AdminSettingsProps {
  onClose: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onClose }) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'features' | 'backgrounds'>(
    'features'
  );

  // Close modal on Escape key press
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isAdmin) {
    return null;
  }

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-settings-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 pb-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              <h2 id="admin-settings-title" className="text-2xl font-bold">
                Admin Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
              aria-label="Close admin settings"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-3 rounded-t-xl font-bold text-sm uppercase tracking-wide flex items-center gap-2 transition-colors ${
                activeTab === 'features'
                  ? 'bg-white text-indigo-600'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              Feature Permissions
            </button>
            <button
              onClick={() => setActiveTab('backgrounds')}
              className={`px-4 py-3 rounded-t-xl font-bold text-sm uppercase tracking-wide flex items-center gap-2 transition-colors ${
                activeTab === 'backgrounds'
                  ? 'bg-white text-indigo-600'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Background Manager
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'features' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Feature Permissions
                </h3>
                <p className="text-slate-600">
                  Control widget availability and access levels for different
                  user groups. Set features to admin-only (alpha testing),
                  specific users (beta testing), or public access.
                </p>
              </div>
              <FeaturePermissionsManager />
            </div>
          )}

          {activeTab === 'backgrounds' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Background Management
                </h3>
                <p className="text-slate-600">
                  Upload and manage background presets available to users.
                  Control visibility and access permissions for each background.
                </p>
              </div>
              <BackgroundManager />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
