import React, { useState, useRef, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  X,
  Settings,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  CheckSquare,
  Upload,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Share2,
  Download,
  Save,
} from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useStorage } from '../../hooks/useStorage';
import {
  TOOLS,
  GradeLevel,
  GradeFilter,
  BackgroundPreset,
  Dashboard,
} from '../../types';
import { getWidgetGradeLevels } from '../../config/widgetGradeLevels';
import { AdminSettings } from '../admin/AdminSettings';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
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

interface DashboardData {
  name: string;
  [key: string]: unknown;
}

export const Menu: React.FC<MenuProps> = ({ isOpen, onClose }) => {
  const [menuView, setMenuView] = useState<
    'main' | 'widgets' | 'background' | 'settings' | 'board-settings'
  >('main');

  // Sub-tab for design section
  const [designTab, setDesignTab] = useState<
    'presets' | 'colors' | 'gradients'
  >('presets');

  const [uploading, setUploading] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [managedBackgrounds, setManagedBackgrounds] = useState<
    BackgroundPreset[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const publicBgsRef = useRef<BackgroundPreset[]>([]);
  const betaBgsRef = useRef<BackgroundPreset[]>([]);

  const [editingDashboardName, setEditingDashboardName] = useState('');

  const { user, isAdmin, featurePermissions } = useAuth();
  const { uploadBackgroundImage } = useStorage();

  const {
    dashboards,
    activeDashboard,
    visibleTools,
    toggleToolVisibility,
    loadDashboard,
    setBackground,
    addToast,
    saveCurrentDashboard,
    deleteDashboard,
    renameDashboard,
    createNewDashboard,
  } = useDashboard();

  // Reset view when closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setMenuView('main'), 300);
    }
  }, [isOpen]);

  // Init editing name
  useEffect(() => {
    if (activeDashboard) {
      setEditingDashboardName(activeDashboard.name);
    }
  }, [activeDashboard]);

  // Load grade filter preference from localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem('spartboard_gradeFilter');
    const validValues = GRADE_FILTER_OPTIONS.map((opt) => opt.value);
    if (savedFilter && validValues.includes(savedFilter as GradeFilter)) {
      setGradeFilter(savedFilter as GradeFilter);
    }
  }, []);

  // Fetch managed backgrounds from Firestore
  useEffect(() => {
    if (!user) return;

    const baseRef = collection(db, 'admin_backgrounds');
    const unsubscribes: (() => void)[] = [];

    if (isAdmin) {
      const q = query(baseRef, where('active', '==', true));
      unsubscribes.push(
        onSnapshot(
          q,
          (snapshot) => {
            const backgrounds: BackgroundPreset[] = [];
            snapshot.forEach((doc) => {
              backgrounds.push(doc.data() as BackgroundPreset);
            });
            setManagedBackgrounds(
              backgrounds.sort((a, b) => b.createdAt - a.createdAt)
            );
          },
          (error) => {
            console.error('Error fetching admin backgrounds:', error);
          }
        )
      );
    } else {
      const updateCombinedBackgrounds = () => {
        const all = [...publicBgsRef.current, ...betaBgsRef.current];
        const unique = Array.from(new Map(all.map((b) => [b.id, b])).values());
        setManagedBackgrounds(unique.sort((a, b) => b.createdAt - a.createdAt));
      };

      const qPublic = query(
        baseRef,
        where('active', '==', true),
        where('accessLevel', '==', 'public')
      );

      const qBeta = query(
        baseRef,
        where('active', '==', true),
        where('accessLevel', '==', 'beta'),
        where('betaUsers', 'array-contains', (user.email ?? '').toLowerCase())
      );

      unsubscribes.push(
        onSnapshot(
          qPublic,
          (snapshot) => {
            publicBgsRef.current = snapshot.docs.map(
              (d) => d.data() as BackgroundPreset
            );
            updateCombinedBackgrounds();
          },
          (error) => console.error('Error fetching public backgrounds:', error)
        )
      );

      unsubscribes.push(
        onSnapshot(
          qBeta,
          (snapshot) => {
            betaBgsRef.current = snapshot.docs.map(
              (d) => d.data() as BackgroundPreset
            );
            updateCombinedBackgrounds();
          },
          (error) => console.error('Error fetching beta backgrounds:', error)
        )
      );
    }

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user, isAdmin]);

  const handleGradeFilterChange = (newFilter: GradeFilter) => {
    setGradeFilter(newFilter);
    localStorage.setItem('spartboard_gradeFilter', newFilter);
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
      addToast('Custom background uploaded', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      addToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

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
        onClose();
      } catch {
        addToast('Invalid board data', 'error');
      }
    }
  };

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      if (gradeFilter === 'all') return true;
      const permission = featurePermissions.find(
        (p) => p.widgetType === tool.type
      );
      const levels = permission?.gradeLevels ?? getWidgetGradeLevels(tool.type);
      return levels.includes(gradeFilter);
    });
  }, [gradeFilter, featurePermissions]);

  const presets = useMemo(() => {
    return managedBackgrounds.map((bg) => ({
      id: bg.url,
      label: bg.label,
    }));
  }, [managedBackgrounds]);

  const colors = [
    { id: 'bg-brand-gray-darkest' },
    { id: 'bg-brand-blue-dark' },
    { id: 'bg-emerald-950' },
    { id: 'bg-brand-red-dark' },
    { id: 'bg-brand-gray-lightest' },
    { id: 'bg-white' },
    {
      id: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100',
      label: 'Dot Grid',
    },
  ];

  const gradients = [
    { id: 'bg-gradient-to-br from-slate-900 to-slate-700', label: 'Slate' },
    {
      id: 'bg-gradient-to-br from-brand-blue-primary to-brand-blue-dark',
      label: 'Brand',
    },
    {
      id: 'bg-gradient-to-br from-emerald-400 to-cyan-500',
      label: 'Tropical',
    },
    { id: 'bg-gradient-to-br from-rose-400 to-orange-400', label: 'Sunset' },
  ];

  return (
    <>
      {showAdminSettings && (
        <AdminSettings onClose={() => setShowAdminSettings(false)} />
      )}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-80 bg-slate-900 text-white z-[1001] shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            {menuView !== 'main' && (
              <button
                onClick={() => setMenuView('main')}
                className="p-1 hover:bg-slate-800 rounded-full transition-colors mr-1"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <h2 className="text-xl font-bold tracking-tight">
              {menuView === 'main'
                ? 'Menu'
                : menuView === 'widgets'
                  ? 'Add Widgets'
                  : menuView === 'background'
                    ? 'Background'
                    : 'Board Settings'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {menuView === 'main' && (
            <div className="p-4 space-y-8">
              {/* Active Board Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 px-2">
                  <span className="w-2 h-2 rounded-full bg-brand-blue-primary"></span>
                  Active Board
                </div>
                <div className="px-2">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {activeDashboard?.name ?? 'Untitled'}
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setMenuView('widgets')}
                      className="w-full flex items-center justify-between p-4 bg-brand-blue-primary rounded-xl hover:bg-brand-blue-light transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-blue-dark/30 rounded-lg">
                          <LayoutGrid className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-sm">
                            Manage Widgets
                          </div>
                          <div className="text-xs text-brand-blue-lighter">
                            Add or remove tools
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-brand-blue-lighter group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setMenuView('background')}
                      className="w-full flex items-center justify-between p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all group border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-sm text-slate-200">
                            Background
                          </div>
                          <div className="text-xs text-slate-500">
                            Change wallpaper
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setMenuView('board-settings')}
                      className="w-full flex items-center justify-between p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all group border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
                          <Settings className="w-5 h-5 text-slate-300" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-sm text-slate-200">
                            Board Settings
                          </div>
                          <div className="text-xs text-slate-500">
                            Rename, share, delete
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Other Boards Section */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2">
                  Other Boards
                </div>
                <div className="space-y-1">
                  {dashboards
                    .filter((d) => d.id !== activeDashboard?.id)
                    .map((db) => (
                      <button
                        key={db.id}
                        onClick={() => {
                          loadDashboard(db.id);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-slate-600">
                          {/* Placeholder icon logic */}
                          <LayoutGrid className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm truncate">
                          {db.name}
                        </span>
                      </button>
                    ))}
                  {dashboards.filter((d) => d.id !== activeDashboard?.id)
                    .length === 0 && (
                    <div className="px-3 py-2 text-sm text-slate-600 italic">
                      No other boards
                    </div>
                  )}
                  <button
                    onClick={handleImport}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white group border-t border-slate-800 mt-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-slate-600">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm truncate">
                      Import Board
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {menuView === 'board-settings' && activeDashboard && (
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Rename Board
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingDashboardName}
                      onChange={(e) => setEditingDashboardName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-primary"
                    />
                    <button
                      onClick={() =>
                        renameDashboard(
                          activeDashboard.id,
                          editingDashboardName
                        )
                      }
                      className="p-2 bg-brand-blue-primary text-white rounded-lg hover:bg-brand-blue-light"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all text-slate-300 hover:text-white"
                  >
                    <Share2 className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase">Share</span>
                  </button>
                  <button
                    onClick={() => saveCurrentDashboard()}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all text-slate-300 hover:text-white"
                  >
                    <Save className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase">Save</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (
                      confirm('Are you sure you want to delete this board?')
                    ) {
                      deleteDashboard(activeDashboard.id);
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-red-900/20 border border-red-900/50 rounded-xl hover:bg-red-900/30 transition-all text-red-400 hover:text-red-300 mt-4"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-bold text-sm">Delete Board</span>
                </button>
              </div>
            </div>
          )}

          {menuView === 'widgets' && (
            <div className="p-4 space-y-6">
              {/* Filter */}
              <div className="flex gap-2 p-1 bg-slate-800 rounded-lg overflow-x-auto">
                {GRADE_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleGradeFilterChange(option.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase whitespace-nowrap transition-all ${
                      gradeFilter === option.value
                        ? 'bg-brand-blue-primary text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredTools.map((tool) => {
                  const permission = featurePermissions.find(
                    (p) => p.widgetType === tool.type
                  );
                  const displayName =
                    permission?.displayName?.trim() ?? tool.label;
                  const isActive = visibleTools.includes(tool.type);

                  return (
                    <div
                      key={tool.type}
                      className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isActive ? tool.color : 'bg-slate-700'} text-white`}
                        >
                          <tool.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {displayName}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            {permission?.gradeLevels
                              ? permission.gradeLevels
                                  .map(formatGradeLevel)
                                  .join(', ')
                              : 'Universal'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleToolVisibility(tool.type)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          isActive ? 'bg-brand-blue-primary' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                            isActive ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {menuView === 'background' && (
            <div className="p-4 space-y-6">
              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                {(['presets', 'colors', 'gradients'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDesignTab(tab)}
                    className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                      designTab === tab
                        ? 'border-brand-blue-primary text-brand-blue-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {designTab === 'presets' && (
                <div className="grid grid-cols-2 gap-3">
                  {presets.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setBackground(bg.id)}
                      className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        activeDashboard?.background === bg.id
                          ? 'border-brand-blue-primary'
                          : 'border-transparent hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={bg.id}
                        alt={bg.label}
                        className="w-full h-full object-cover"
                      />
                      {activeDashboard?.background === bg.id && (
                        <div className="absolute top-2 right-2 bg-brand-blue-primary text-white p-1 rounded-full shadow-md">
                          <CheckSquare className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-video rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:border-brand-blue-primary hover:text-brand-blue-primary hover:bg-slate-800 transition-all"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-2" />
                        <span className="text-xs font-bold uppercase">
                          Upload
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
                          ? 'border-brand-blue-primary'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {activeDashboard?.background === bg.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/20 backdrop-blur-sm p-1.5 rounded-full">
                            <CheckSquare className="w-4 h-4 text-white" />
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
                          ? 'border-brand-blue-primary'
                          : 'border-transparent hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-full h-full rounded-lg ${bg.id}`} />
                      <div className="absolute bottom-2 left-2 text-[10px] font-bold uppercase text-white/90 drop-shadow-md">
                        {bg.label}
                      </div>
                      {activeDashboard?.background === bg.id && (
                        <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-md p-1 rounded-full">
                          <CheckSquare className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={() => {
              /* Handle Account Settings */
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-brand-blue-primary flex items-center justify-center text-white font-bold">
              {user?.displayName?.[0] ?? 'U'}
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-sm text-white">
                Account Settings
              </div>
              <div className="text-xs text-slate-500">Manage profile & sub</div>
            </div>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAdminSettings(true);
                }}
                className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => void handleFileUpload(e)}
          />
        </div>
      </div>
    </>
  );
};
