import React, { useState, useRef, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useStorage } from '../../hooks/useStorage';
import { Dashboard, TOOLS, GradeLevel, GradeFilter } from '../../types';
import {
  getWidgetGradeLevels,
  widgetMatchesGradeFilter,
} from '../../config/widgetGradeLevels';
import { AdminSettings } from '../admin/AdminSettings';

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
  { value: 'universal', label: 'Universal' },
] as const;

// Helper to format grade level for display with proper capitalization
const formatGradeLevel = (level: GradeLevel): string => {
  if (level === 'universal') return 'Universal';
  return level.toUpperCase();
};

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'widgets' | 'design' | 'manage'>(
    'widgets'
  );
  // Sub-tab for design section
  const [designTab, setDesignTab] = useState<'presets' | 'colors' | 'grads'>(
    'presets'
  );

  const [uploading, setUploading] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load grade filter preference from localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem('spartboard_gradeFilter');
    const validValues = GRADE_FILTER_OPTIONS.map((opt) => opt.value);
    if (savedFilter && validValues.includes(savedFilter as GradeFilter)) {
      setGradeFilter(savedFilter as GradeFilter);
    }
  }, []);

  // Save grade filter preference to localStorage
  const handleGradeFilterChange = (newFilter: GradeFilter) => {
    setGradeFilter(newFilter);
    localStorage.setItem('spartboard_gradeFilter', newFilter);
  };

  const {
    dashboards,
    activeDashboard,
    visibleTools,
    toggleToolVisibility,
    setAllToolsVisibility,
    createNewDashboard,
    loadDashboard,
    deleteDashboard,
    saveCurrentDashboard,
    setBackground,
    addToast,
  } = useDashboard();

  const { user, signOut, isAdmin } = useAuth();
  const { uploadBackgroundImage } = useStorage();

  const presets = [
    {
      id: 'https://images.unsplash.com/photo-1531496681078-2742715e1c58?q=80&w=2000',
      label: 'Chalkboard',
    },
    {
      id: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=2000',
      label: 'Corkboard',
    },
    {
      id: 'https://images.unsplash.com/photo-1503387762-592dea58ef23?q=80&w=2000',
      label: 'Geometric',
    },
    {
      id: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000',
      label: 'Nature',
    },
    {
      id: 'https://images.unsplash.com/photo-1586075010620-2253017124f8?q=80&w=2000',
      label: 'Paper',
    },
    {
      id: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000',
      label: 'Tech',
    },
  ];

  const colors = [
    { id: 'bg-slate-900', color: '#0f172a' },
    { id: 'bg-indigo-950', color: '#1e1b4b' },
    { id: 'bg-emerald-950', color: '#064e3b' },
    { id: 'bg-rose-950', color: '#450a0a' },
    { id: 'bg-slate-50', color: '#f8fafc' },
    { id: 'bg-white', color: '#ffffff' },
    {
      id: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100',
      label: 'Dot Grid',
    },
  ];

  const gradients = [
    { id: 'bg-gradient-to-br from-slate-900 to-slate-700', label: 'Slate' },
    {
      id: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      label: 'Vibrant',
    },
    {
      id: 'bg-gradient-to-br from-emerald-400 to-cyan-500',
      label: 'Tropical',
    },
    { id: 'bg-gradient-to-br from-rose-400 to-orange-400', label: 'Sunset' },
  ];

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
  const filteredTools = useMemo(
    () =>
      TOOLS.filter((tool) => widgetMatchesGradeFilter(tool.type, gradeFilter)),
    [gradeFilter]
  );

  return (
    <>
      <div className="fixed top-6 left-6 z-[1000] flex items-center gap-2 p-2 bg-white/90 backdrop-blur shadow-xl rounded-full border border-slate-100/50 transition-all hover:scale-[1.02]">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
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
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
            title="Admin Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={signOut}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {showAdminSettings && (
        <AdminSettings onClose={() => setShowAdminSettings(false)} />
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-96 h-full bg-white shadow-2xl flex flex-col p-0 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-6 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Layout className="w-6 h-6" />
                  <span className="font-black text-lg tracking-tight">
                    SPARTBOARD
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black uppercase tracking-wide">
                <button
                  onClick={() => setActiveTab('widgets')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'widgets'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Widgets
                </button>
                <button
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'design'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" /> Design
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'manage'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Manage
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* WIDGETS TAB */}
              {activeTab === 'widgets' && (
                <div className="space-y-4">
                  {/* Grade Level Filter */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Grade Filter
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {GRADE_FILTER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleGradeFilterChange(option.value)}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                            gradeFilter === option.value
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Available Widgets
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAllToolsVisibility(true)}
                        className="text-[9px] font-bold text-indigo-600 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => setAllToolsVisibility(false)}
                        className="text-[9px] font-bold text-slate-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredTools.map((tool) => {
                      const gradeLevels = getWidgetGradeLevels(tool.type);
                      const showChips = !gradeLevels.includes('universal');
                      const isActive = visibleTools.includes(tool.type);

                      return (
                        <button
                          key={tool.type}
                          onClick={() => toggleToolVisibility(tool.type)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border-2 group ${
                            isActive
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
                              : 'bg-white border-transparent hover:border-slate-100 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2 rounded-lg ${isActive ? tool.color : 'bg-slate-100 group-hover:bg-slate-200'} ${isActive ? 'text-white' : 'text-slate-500'} transition-colors`}
                            >
                              <tool.icon className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-bold uppercase tracking-tight">
                                {tool.label}
                              </div>
                              {showChips && (
                                <div className="flex gap-1 mt-1">
                                  {gradeLevels.map((level) => (
                                    <span
                                      key={level}
                                      className="text-[7px] font-black px-1.5 py-0.5 rounded bg-white/50 text-slate-500 border border-slate-200"
                                    >
                                      {formatGradeLevel(level)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              isActive
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-slate-200'
                            }`}
                          >
                            {isActive && (
                              <CheckSquare className="w-3.5 h-3.5 text-white" />
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
                      className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                        designTab === 'presets'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      onClick={() => setDesignTab('colors')}
                      className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                        designTab === 'colors'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Colors
                    </button>
                    <button
                      onClick={() => setDesignTab('grads')}
                      className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                        designTab === 'grads'
                          ? 'border-indigo-600 text-indigo-600'
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
                              ? 'border-indigo-600 ring-2 ring-indigo-200 ring-offset-2'
                              : 'border-transparent hover:scale-[1.02]'
                          }`}
                        >
                          <img
                            src={bg.id}
                            alt={bg.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold uppercase tracking-wider">
                              {bg.label}
                            </span>
                          </div>
                          {activeDashboard?.background === bg.id && (
                            <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full">
                              <CheckSquare className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50"
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mb-2" />
                            <span className="text-[9px] font-black uppercase">
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
                          className={`aspect-square rounded-xl border-2 transition-all relative ${
                            activeDashboard?.background === bg.id
                              ? 'border-indigo-600 ring-2 ring-indigo-200 ring-offset-2'
                              : 'border-slate-100 hover:border-slate-300'
                          }`}
                          style={{ backgroundColor: bg.color }}
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

                  {designTab === 'grads' && (
                    <div className="grid grid-cols-2 gap-3">
                      {gradients.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setBackground(bg.id)}
                          className={`aspect-video rounded-xl border-2 transition-all relative ${
                            activeDashboard?.background === bg.id
                              ? 'border-indigo-600 ring-2 ring-indigo-200 ring-offset-2'
                              : 'border-transparent hover:scale-[1.02]'
                          }`}
                        >
                          <div
                            className={`w-full h-full rounded-lg ${bg.id}`}
                          />
                          <div className="absolute bottom-2 left-2 text-[9px] font-black uppercase text-white/90 drop-shadow-md">
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
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                      My Dashboards
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {dashboards.map((db) => (
                        <div
                          key={db.id}
                          className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                            activeDashboard?.id === db.id
                              ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50'
                              : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                          }`}
                          onClick={() => loadDashboard(db.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-10 rounded-full ${
                                activeDashboard?.id === db.id
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-200 group-hover:bg-slate-300'
                              }`}
                            />
                            <div>
                              <div
                                className={`font-bold text-sm ${
                                  activeDashboard?.id === db.id
                                    ? 'text-indigo-900'
                                    : 'text-slate-700'
                                }`}
                              >
                                {db.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {new Date(db.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  'Are you sure you want to delete this dashboard?'
                                )
                              ) {
                                deleteDashboard(db.id);
                              }
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const name = prompt('Enter dashboard name:');
                        if (name) createNewDashboard(name);
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase">
                        New Board
                      </span>
                    </button>
                    <button
                      onClick={handleImport}
                      className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Download className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase">
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

              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={() => {
                    saveCurrentDashboard();
                    setIsOpen(false);
                  }}
                  className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95 transition-all text-[10px] uppercase tracking-wider"
                >
                  <Save className="w-4 h-4" /> Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
