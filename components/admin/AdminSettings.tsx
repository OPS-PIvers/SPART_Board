import React from 'react';
import { Settings, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FeaturePermissionsManager } from './FeaturePermissionsManager';

interface AdminSettingsProps {
  onClose: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onClose }) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Admin Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Feature Permissions
            </h3>
            <p className="text-slate-600">
              Control widget availability and access levels for different user
              groups. Set features to admin-only (alpha testing), specific users
              (beta testing), or public access.
            </p>
          </div>

          <FeaturePermissionsManager />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
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
