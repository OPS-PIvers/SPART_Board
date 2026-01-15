import React, { useState, useRef, useMemo } from 'react';
import {
  Layout,
  Save,
  Plus,
  Trash2,
  X,
  Menu,
  Share2,
  Download,
  Upload,
  Grid,
  CheckSquare,
  Loader2,
  Filter,
  LogOut,
  Settings,
  LayoutGrid,
  Paintbrush,
  FolderOpen,
  Pencil,
} from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useStorage } from '../../hooks/useStorage';
import { Dashboard, GradeLevel } from '../../types';
import { TOOLS } from '../../config/tools';
import { getWidgetGradeLevels } from '../../config/widgetGradeLevels';
import { AdminSettings } from '../admin/AdminSettings';
import { useBackgrounds } from '../../hooks/useBackgrounds';

interface DashboardData {
  name: string;
  [key: string]: unknown;
}

// Grade filter options for consistent validation and rendering
const GRADE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'k-2', label: 'K-2' },
  { value: '3-5', label: '3-5' },
  { value: '6-8', label: '6-8' },
  { value: '9-12', label: '9-12' },
] as const;

// Helper to format grade level for display with proper capitalization
const formatGradeLevel = (level: GradeLevel): string => {
  return level.toUpperCase();
};

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'widgets' | 'design' | 'manage'>(
    'widgets'
  );
  // Sub-tab for design section
  const [designTab, setDesignTab] = useState<
    'presets' | 'colors' | 'gradients'
  >('presets');

  const { user, signOut, isAdmin, featurePermissions } = useAuth();
  const { uploadBackgroundImage } = useStorage();
  const { presets, colors, gradients } = useBackgrounds();
  const {
    dashboards,
    activeDashboard,
    visibleTools,
    gradeFilter,
    setGradeFilter,
    toggleToolVisibility,
    setAllToolsVisibility,
    createNewDashboard,
    loadDashboard,
    deleteDashboard,
    renameDashboard,
    saveCurrentDashboard,
    setBackground,
    addToast,
  } = useDashboard();

  const [uploading, setUploading] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showNewDashboardModal, setShowNewDashboardModal] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [editingDashboard, setEditingDashboard] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShare = () => {
    if (!activeDashboard) return;
    const data = JSON.stringify(activeDashboard);
    void navigator.clipboard.writeText(data);
    addToast('Board data copied to clipboard!', 'success');
  };

  const handleImport = () => {
    const data = prompt('Paste your board data here:');
    if (data) {
      try {
        const parsed = JSON.parse(data) as DashboardData;
        createNewDashboard(
          `Imported: ${parsed.name}`,
          parsed as unknown as Dashboard
        );
        addToast('Board imported successfully', 'success');
      } catch {
        addToast('Invalid board data', 'error');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image too large (Max 5MB)', 'error');
      return;
    }

    setUploading(true);
    try {
      const downloadURL = await uploadBackgroundImage(user.uid, file);
      setBackground(downloadURL);
      addToast('Custom background uploaded to cloud', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      addToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Memoize filtered tools to prevent unnecessary recalculations
  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      if (gradeFilter === 'all') return true;

      // Check for override in feature permissions
      const permission = featurePermissions.find(
        (p) => p.widgetType === tool.type
      );
      const levels = permission?.gradeLevels ?? getWidgetGradeLevels(tool.type);

      return levels.includes(gradeFilter);
    });
  }, [gradeFilter, featurePermissions]);

  return (
    <>
      <div
        data-screenshot="exclude"
        className="fixed top-6 left-6 z-[1000] flex items-center gap-2 p-2 bg-white/90 backdrop-blur shadow-xl rounded-full border border-slate-100/50 transition-all hover:scale-[1.02]"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-brand-blue-primary text-white rounded-full hover:bg-brand-blue-dark transition-colors shadow-md shadow-brand-blue-lighter"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-2 px-1">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user?.displayName ?? 'User'}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700"
              aria-label={user?.displayName ?? 'User'}
            >
              {(user?.displayName ?? 'User').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-slate-700 font-bold text-sm hidden sm:block">
            {user?.displayName}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {isAdmin && (
          <button
            onClick={() => setShowAdminSettings(true)}
            className="p-2 text-slate-400 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-full transition-all"
            title="Admin Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={signOut}
          className="p-2 text-slate-400 hover:text-brand-red-primary hover:bg-brand-red-lighter rounded-full transition-all"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {showAdminSettings && (
        <AdminSettings onClose={() => setShowAdminSettings(false)} />
      )}

      {editingDashboard && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">
              Rename Dashboard
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter a new name for your dashboard.
            </p>
            <input
              type="text"
              value={editingDashboard.name}
              onChange={(e) =>
                setEditingDashboard({
                  ...editingDashboard,
                  name: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editingDashboard.name.trim()) {
                    renameDashboard(
                      editingDashboard.id,
                      editingDashboard.name.trim()
                    );
                    setEditingDashboard(null);
                  }
                } else if (e.key === 'Escape') {
                  setEditingDashboard(null);
                }
              }}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-primary focus:border-brand-blue-primary mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingDashboard(null)}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingDashboard.name.trim()) {
                    renameDashboard(
                      editingDashboard.id,
                      editingDashboard.name.trim()
                    );
                    setEditingDashboard(null);
                  }
                }}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-blue-primary rounded-xl hover:bg-brand-blue-dark shadow-sm transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewDashboardModal && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">
              New Board
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter a name for your new board.
            </p>
            <input
              type="text"
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (newDashboardName.trim()) {
                    createNewDashboard(newDashboardName.trim());
                    setShowNewDashboardModal(false);
                  }
                } else if (e.key === 'Escape') {
                  setShowNewDashboardModal(false);
                }
              }}
              autoFocus
              placeholder="Board name"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-primary focus:border-brand-blue-primary mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewDashboardModal(false)}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newDashboardName.trim()) {
                    createNewDashboard(newDashboardName.trim());
                    setShowNewDashboardModal(false);
                  }
                }}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-blue-primary rounded-xl hover:bg-brand-blue-dark shadow-sm transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col p-0 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-6 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-brand-blue-primary">
                  <Layout className="w-6 h-6" />
                  <span className="font-black text-xl tracking-tight">
                    SCHOOL BOARDS
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-sm font-bold uppercase tracking-wide">
                <button
                  onClick={() => setActiveTab('widgets')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'widgets'
                      ? 'bg-white shadow-sm text-brand-blue-primary'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" /> Widgets
                </button>
                <button
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'design'
                      ? 'bg-white shadow-sm text-brand-blue-primary'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Paintbrush className="w-4 h-4" /> Design
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'manage'
                      ? 'bg-white shadow-sm text-brand-blue-primary'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" /> Manage
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* WIDGETS TAB */}
              {activeTab === 'widgets' && (
                <div className="space-y-4">
                  {/* Grade Level Filter */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                          Grade Filter
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {GRADE_FILTER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setGradeFilter(option.value)}
                          className={`py-2 px-1 rounded-lg text-xs sm:text-sm font-bold uppercase transition-all ${
                            gradeFilter === option.value
                              ? 'bg-brand-blue-primary text-white shadow-sm'
                              : 'bg-white text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">
                      Available Widgets
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAllToolsVisibility(true)}
                        className="text-sm font-bold text-brand-blue-primary hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => setAllToolsVisibility(false)}
                        className="text-sm font-bold text-slate-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredTools.map((tool) => {
                      const permission = featurePermissions.find(
                        (p) => p.widgetType === tool.type
                      );
                      const gradeLevels =
                        permission?.gradeLevels ??
                        getWidgetGradeLevels(tool.type);
                      const isActive = visibleTools.includes(tool.type);
                      const trimmedDisplayName =
                        permission?.displayName?.trim();
                      const displayLabel =
                        trimmedDisplayName && trimmedDisplayName !== ''
                          ? trimmedDisplayName
                          : tool.label;

                      return (
                        <button
                          key={tool.type}
                          onClick={() => toggleToolVisibility(tool.type)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 group ${
                            isActive
                              ? 'bg-brand-blue-lighter border-brand-blue-lighter text-brand-blue-dark'
                              : 'bg-white border-transparent hover:border-slate-100 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className={`p-3 rounded-lg ${isActive ? tool.color : 'bg-slate-100 group-hover:bg-slate-200'} ${isActive ? 'text-white' : 'text-slate-500'} transition-colors`}
                            >
                              <tool.icon className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <div className="text-base font-bold uppercase tracking-tight">
                                {displayLabel}
                              </div>
                              <div className="flex gap-1.5 mt-1">
                                {gradeLevels.map((level) => (
                                  <span
                                    key={level}
                                    className="text-xs font-bold px-2 py-0.5 rounded bg-white/50 text-slate-500 border border-slate-200"
                                  >
                                    {formatGradeLevel(level)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                              isActive
                                ? 'bg-brand-blue-primary border-brand-blue-primary'
                                : 'border-slate-200'
                            }`}
                          >
                            {isActive && (
                              <CheckSquare className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DESIGN TAB */}
              {activeTab === 'design' && (
                <div className="space-y-6">
                  {/* Design Sub-tabs */}
                  <div className="flex border-b border-slate-100 mb-4">
                    <button
                      onClick={() => setDesignTab('presets')}
                      className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                        designTab === 'presets'
                          ? 'border-brand-blue-primary text-brand-blue-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      onClick={() => setDesignTab('colors')}
                      className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                        designTab === 'colors'
                          ? 'border-brand-blue-primary text-brand-blue-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Colors
                    </button>
                    <button
                      onClick={() => setDesignTab('gradients')}
                      className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                        designTab === 'gradients'
                          ? 'border-brand-blue-primary text-brand-blue-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Gradients
                    </button>
                  </div>

                  {designTab === 'presets' && (
                    <div className="grid grid-cols-2 gap-3">
                      {presets.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setBackground(bg.id)}
                          className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                            activeDashboard?.background === bg.id
                              ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter ring-offset-2'
                              : 'border-transparent hover:scale-[1.02]'
                          }`}
                        >
                          <img
                            src={bg.id}
                            alt={bg.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-base font-bold uppercase tracking-wider">
                              {bg.label}
                            </span>
                          </div>
                          {activeDashboard?.background === bg.id && (
                            <div className="absolute top-2 right-2 bg-brand-blue-primary text-white p-1 rounded-full">
                              <CheckSquare className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-blue-light hover:text-brand-blue-light hover:bg-brand-blue-lighter transition-all disabled:opacity-50"
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mb-2" />
                            <span className="text-sm font-bold uppercase">
                              Upload Image
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {designTab === 'colors' && (
                    <div className="grid grid-cols-3 gap-3">
                      {colors.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setBackground(bg.id)}
                          className={`aspect-square rounded-xl border-2 transition-all relative ${bg.id} ${
                            activeDashboard?.background === bg.id
                              ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter ring-offset-2'
                              : 'border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {bg.id.includes('radial') && (
                            <div className={`w-full h-full ${bg.id}`} />
                          )}
                          {bg.label === 'Dot Grid' && (
                            <Grid className="w-6 h-6 absolute inset-0 m-auto text-slate-300" />
                          )}
                          {activeDashboard?.background === bg.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
                                <CheckSquare className="w-4 h-4 text-white drop-shadow-md" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {designTab === 'gradients' && (
                    <div className="grid grid-cols-2 gap-3">
                      {gradients.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setBackground(bg.id)}
                          className={`aspect-video rounded-xl border-2 transition-all relative ${
                            activeDashboard?.background === bg.id
                              ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter ring-offset-2'
                              : 'border-transparent hover:scale-[1.02]'
                          }`}
                        >
                          <div
                            className={`w-full h-full rounded-lg ${bg.id}`}
                          />
                          <div className="absolute bottom-3 left-3 text-xs font-bold uppercase text-white/90 drop-shadow-md">
                            {bg.label}
                          </div>
                          {activeDashboard?.background === bg.id && (
                            <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1 rounded-full">
                              <CheckSquare className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MANAGE TAB */}
              {activeTab === 'manage' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                      My Boards
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {dashboards.map((db) => (
                        <div
                          key={db.id}
                          className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                            activeDashboard?.id === db.id
                              ? 'bg-white border-brand-blue-light shadow-md ring-1 ring-brand-blue-lighter'
                              : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                          }`}
                          onClick={() => loadDashboard(db.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-10 rounded-full ${
                                activeDashboard?.id === db.id
                                  ? 'bg-brand-blue-primary'
                                  : 'bg-slate-200 group-hover:bg-slate-300'
                              }`}
                            />
                            <div>
                              <div
                                className={`font-bold text-base ${
                                  activeDashboard?.id === db.id
                                    ? 'text-brand-blue-dark'
                                    : 'text-slate-700'
                                }`}
                              >
                                {db.name}
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                {new Date(db.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDashboard({
                                  id: db.id,
                                  name: db.name,
                                });
                              }}
                              className="p-2 text-slate-300 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Rename"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <div className="relative">
                              <input
                                type="checkbox"
                                id={`delete-dashboard-${db.id}`}
                                className="peer hidden"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <label
                                htmlFor={`delete-dashboard-${db.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 text-slate-300 hover:text-brand-red-primary hover:bg-brand-red-lighter rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-5 h-5" />
                              </label>
                              <div className="peer-checked:flex hidden fixed inset-0 z-50 items-center justify-center bg-slate-900/40">
                                <div
                                  className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <h4 className="text-base font-semibold text-slate-900 mb-2">
                                    Delete board
                                  </h4>
                                  <p className="text-sm text-slate-600 mb-4">
                                    Are you sure you want to delete “{db.name}”?
                                    This action cannot be undone.
                                  </p>
                                  <div className="flex justify-end gap-2">
                                    <label
                                      htmlFor={`delete-dashboard-${db.id}`}
                                      className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                                    >
                                      Cancel
                                    </label>
                                    <button
                                      type="button"
                                      className="px-4 py-2 text-sm font-medium text-white bg-brand-red-primary hover:bg-brand-red-dark rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteDashboard(db.id);
                                        const checkbox =
                                          document.getElementById(
                                            `delete-dashboard-${db.id}`
                                          ) as HTMLInputElement | null;
                                        if (checkbox && checkbox.checked) {
                                          checkbox.click();
                                        }
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setNewDashboardName('');
                        setShowNewDashboardModal(true);
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-brand-blue-light hover:text-brand-blue-primary hover:bg-brand-blue-lighter transition-all"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-bold uppercase">
                        New Board
                      </span>
                    </button>
                    <button
                      onClick={handleImport}
                      className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-brand-blue-light hover:text-brand-blue-primary hover:bg-brand-blue-lighter transition-all"
                    >
                      <Download className="w-8 h-8" />
                      <span className="text-sm font-bold uppercase">
                        Import
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 backdrop-blur">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => void handleFileUpload(e)}
              />

              <div className="flex gap-4">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <Share2 className="w-5 h-5" /> Share
                </button>
                <button
                  onClick={() => {
                    saveCurrentDashboard();
                    setIsOpen(false);
                  }}
                  className="flex-1 bg-brand-blue-primary text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-blue-lighter hover:bg-brand-blue-dark hover:shadow-brand-blue-light active:scale-95 transition-all text-sm uppercase tracking-wider"
                >
                  <Save className="w-5 h-5" /> Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
