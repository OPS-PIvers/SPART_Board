import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  X,
  Menu,
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
  SquareSquare,
  ChevronRight,
  Star,
  Maximize,
  Minimize,
  ArrowLeft,
  Palette,
  Trash2,
  Cloud,
  CloudCheck,
  Save,
  AlertCircle,
} from 'lucide-react';
import { GoogleDriveIcon } from '../../common/GoogleDriveIcon';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { useStorage } from '../../../hooks/useStorage';
import { useBackgrounds } from '../../../hooks/useBackgrounds';
import { Dashboard } from '../../../types';
import { TOOLS } from '../../../config/tools';
import { getWidgetGradeLevels } from '../../../config/widgetGradeLevels';
import { AdminSettings } from '../../admin/AdminSettings';
import { GlassCard } from '../../common/GlassCard';
import { SortableDashboardItem } from './SortableDashboardItem';
import { StylePanel } from './StylePanel';

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

type MenuSection =
  | 'main'
  | 'boards'
  | 'backgrounds'
  | 'widgets'
  | 'style'
  | 'settings';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<MenuSection>('main');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    user,
    signOut,
    signInWithGoogle,
    isAdmin,
    featurePermissions,
    canAccessFeature,
  } = useAuth();
  const { uploadBackgroundImage } = useStorage();
  const {
    dashboards,
    activeDashboard,
    visibleTools,
    isSaving,
    gradeFilter,
    setGradeFilter,
    toggleToolVisibility,
    setAllToolsVisibility,
    createNewDashboard,
    loadDashboard,
    deleteDashboard,
    duplicateDashboard,
    renameDashboard,
    reorderDashboards,
    setDefaultDashboard,
    saveCurrentDashboard,
    setBackground,
    updateDashboardSettings,
    setGlobalStyle,
    clearAllWidgets,
    addToast,
    shareDashboard,
  } = useDashboard();

  const { isConnected: isDriveConnected } = useGoogleDrive();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err: unknown) => {
        if (err instanceof Error) {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        }
      });
    } else {
      if (document.exitFullscreen) {
        void document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Sub-tab for design section
  const [designTab, setDesignTab] = useState<
    'presets' | 'colors' | 'gradients'
  >('presets');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = dashboards.findIndex((d) => d.id === active.id);
      const newIndex = dashboards.findIndex((d) => d.id === over.id);

      const newOrder = arrayMove(dashboards, oldIndex, newIndex).map(
        (d) => d.id
      );
      reorderDashboards(newOrder);
    }
  };

  const [isBoardSwitcherExpanded, setIsBoardSwitcherExpanded] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    if (isBoardSwitcherExpanded) {
      // Small delay to allow transition to finish
      const timer = setTimeout(checkScroll, 500);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [isBoardSwitcherExpanded, dashboards]);

  const [uploading, setUploading] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showNewDashboardModal, setShowNewDashboardModal] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [editingDashboard, setEditingDashboard] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { presets, colors, gradients } = useBackgrounds();

  const handleShare = async (db?: Dashboard) => {
    if (!canAccessFeature('dashboard-sharing')) {
      addToast('Board sharing is currently disabled', 'error');
      return;
    }
    const target = db ?? activeDashboard;
    if (!target) return;

    addToast('Generating share link...', 'info');

    try {
      const shareId = await shareDashboard(target);
      const url = `${window.location.origin}/share/${shareId}`;

      // Try to copy immediately - if it fails due to focus/gesture,
      // we'll at least have told the user it's ready.
      try {
        await navigator.clipboard.writeText(url);
        addToast('Link copied to clipboard!', 'success');
      } catch (clipErr) {
        console.warn(
          'Initial clipboard write failed, likely focus issue:',
          clipErr
        );
        // Fallback: Just show the link or a success message
        addToast('Board is now shared! Link ready.', 'success');
      }
    } catch (err) {
      console.error('Share failed:', err);
      addToast('Failed to generate share link', 'error');
    }
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
      const message = error instanceof Error ? error.message : 'Upload failed';
      addToast(message, 'error');
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
      <GlassCard
        globalStyle={activeDashboard?.globalStyle}
        data-screenshot="exclude"
        className="fixed top-6 left-6 z-dock flex items-center gap-2 p-2 rounded-full transition-all"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-brand-blue-primary text-white rounded-full transition-colors shadow-md shadow-brand-blue-lighter"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {isAdmin && (
          <button
            onClick={() => setShowAdminSettings(true)}
            className="p-2 text-brand-blue-primary bg-brand-blue-lighter/50 hover:bg-brand-blue-primary hover:text-white rounded-full transition-all shadow-sm"
            title="Admin Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          className="p-2 text-brand-blue-primary bg-brand-blue-lighter/50 hover:bg-brand-blue-primary hover:text-white rounded-full transition-all shadow-sm"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => {
            if (
              window.confirm(
                'Are you sure you want to close ALL widget windows?'
              )
            ) {
              clearAllWidgets();
            }
          }}
          className="p-2 text-brand-red-primary bg-brand-red-lighter/50 hover:bg-brand-red-primary hover:text-white rounded-full transition-all shadow-sm"
          title="Clear All Windows"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsBoardSwitcherExpanded(!isBoardSwitcherExpanded)}
          className={`p-2 rounded-full transition-all duration-300 ${
            isBoardSwitcherExpanded
              ? 'bg-brand-blue-primary text-white shadow-md'
              : 'text-brand-blue-primary bg-brand-blue-lighter/50 hover:bg-brand-blue-lighter'
          }`}
          title={isBoardSwitcherExpanded ? 'Hide Boards' : 'Switch Boards'}
        >
          <ChevronRight
            className={`w-5 h-5 transition-transform duration-500 ${
              isBoardSwitcherExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {/* Board Switcher Sliding Toggle Bar */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out flex items-center gap-1 ${
            isBoardSwitcherExpanded
              ? 'max-w-[80vw] ml-2 opacity-100'
              : 'max-w-0 ml-0 opacity-0'
          }`}
        >
          <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0" />
          <div className="relative flex items-center min-w-0">
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth"
            >
              <div className="flex gap-1">
                {dashboards.map((db) => (
                  <button
                    key={db.id}
                    onClick={() => {
                      loadDashboard(db.id);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                      activeDashboard?.id === db.id
                        ? 'bg-brand-blue-primary text-white shadow-md'
                        : 'text-slate-500 hover:bg-slate-200/50'
                    }`}
                  >
                    {db.isDefault && (
                      <Star
                        className={`w-3 h-3 ${
                          activeDashboard?.id === db.id
                            ? 'fill-white text-white'
                            : 'fill-amber-400 text-amber-400'
                        }`}
                      />
                    )}
                    {db.name}
                  </button>
                ))}
              </div>
            </div>
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1 pointer-events-none">
                <div className="bg-gradient-to-l from-slate-100 to-transparent w-8 h-full rounded-r-full flex items-center justify-end">
                  <ChevronRight className="w-3 h-3 text-slate-400 animate-pulse mr-1" />
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {showAdminSettings && (
        <AdminSettings onClose={() => setShowAdminSettings(false)} />
      )}

      {editingDashboard && (
        <div className="fixed inset-0 z-popover flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
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
                className="px-3 py-2 text-xxs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
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
                className="px-3 py-2 text-xxs font-bold uppercase tracking-wider text-white bg-brand-blue-primary rounded-xl hover:bg-brand-blue-dark shadow-sm transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewDashboardModal && (
        <div className="fixed inset-0 z-popover flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
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
                className="px-3 py-2 text-xxs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
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
                className="px-3 py-2 text-xxs font-bold uppercase tracking-wider text-white bg-brand-blue-primary rounded-xl hover:bg-brand-blue-dark shadow-sm transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-modal flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setActiveSection('main');
            }}
          />
          <div className="relative w-full max-w-72 h-full bg-white shadow-2xl flex flex-col p-0 animate-in slide-in-from-left duration-300 border-r border-slate-200">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 shrink-0 bg-white z-10">
              <div className="flex items-center gap-2">
                {activeSection !== 'main' ? (
                  <button
                    onClick={() => setActiveSection('main')}
                    className="p-1.5 -ml-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    title="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-6 h-6 bg-brand-blue-primary rounded flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-xxs font-bold tracking-wider uppercase text-slate-500">
                  {activeSection === 'main'
                    ? 'Classroom Manager'
                    : activeSection.replace('-', ' ')}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveSection('main');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-white">
              {/* MAIN MENU */}
              <nav
                className={`absolute inset-0 pt-4 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out ${
                  activeSection === 'main'
                    ? 'translate-x-0 opacity-100 visible'
                    : '-translate-x-full opacity-0 invisible'
                }`}
              >
                <div className="px-3 mb-2">
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-[0.1em] px-3">
                    Workspace
                  </span>
                </div>
                <div className="flex flex-col">
                  <button
                    onClick={() => setActiveSection('boards')}
                    className="group flex items-center gap-3 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-left"
                  >
                    <SquareSquare className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-primary transition-colors" />
                    <span className="flex-grow">Boards</span>
                    <span className="text-xxs bg-brand-blue-lighter text-brand-blue-primary px-1.5 py-0.5 rounded font-bold">
                      {dashboards.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSection('backgrounds')}
                    className="group flex items-center gap-3 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Paintbrush className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-primary transition-colors" />
                    <span>Backgrounds</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('widgets')}
                    className="group flex items-center gap-3 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-left"
                  >
                    <LayoutGrid className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-primary transition-colors" />
                    <span>Widgets</span>
                  </button>
                </div>

                <div className="my-4 border-t border-slate-100"></div>

                <div className="px-3 mb-2">
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-[0.1em] px-3">
                    Configuration
                  </span>
                </div>
                <div className="flex flex-col">
                  <button
                    onClick={() => setActiveSection('style')}
                    className="group flex items-center gap-3 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Palette className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-primary transition-colors" />
                    <span>Global Style</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('settings')}
                    className="group flex items-center gap-3 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-primary transition-colors" />
                    <span>General Settings</span>
                  </button>
                </div>
              </nav>

              {/* BOARDS SECTION */}
              <div
                className={`absolute inset-0 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
                  activeSection === 'boards'
                    ? 'translate-x-0 opacity-100 visible'
                    : 'translate-x-full opacity-0 invisible'
                }`}
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setNewDashboardName('');
                      setShowNewDashboardModal(true);
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-brand-blue-primary text-white rounded-xl shadow-sm hover:bg-brand-blue-dark transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xxs font-bold uppercase tracking-wider">
                      New Board
                    </span>
                  </button>
                  {canAccessFeature('dashboard-import') && (
                    <button
                      onClick={handleImport}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-brand-blue-primary hover:text-brand-blue-primary transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-xxs font-bold uppercase tracking-wider">
                        Import
                      </span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-widest px-1">
                    My Boards
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={dashboards.map((d) => d.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {dashboards.map((db) => (
                          <SortableDashboardItem
                            key={db.id}
                            db={db}
                            isActive={activeDashboard?.id === db.id}
                            onLoad={loadDashboard}
                            onRename={(id, name) =>
                              setEditingDashboard({ id, name })
                            }
                            onDelete={deleteDashboard}
                            onSetDefault={setDefaultDashboard}
                            onDuplicate={duplicateDashboard}
                            onShare={handleShare}
                            canShare={canAccessFeature('dashboard-sharing')}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </div>

              {/* BACKGROUNDS SECTION */}
              <div
                className={`absolute inset-0 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
                  activeSection === 'backgrounds'
                    ? 'translate-x-0 opacity-100 visible'
                    : 'translate-x-full opacity-0 invisible'
                }`}
              >
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xxs font-bold uppercase tracking-widest">
                  <button
                    onClick={() => setDesignTab('presets')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      designTab === 'presets'
                        ? 'bg-white shadow-sm text-brand-blue-primary'
                        : 'text-slate-500'
                    }`}
                  >
                    Presets
                  </button>
                  <button
                    onClick={() => setDesignTab('colors')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      designTab === 'colors'
                        ? 'bg-white shadow-sm text-brand-blue-primary'
                        : 'text-slate-500'
                    }`}
                  >
                    Colors
                  </button>
                  <button
                    onClick={() => setDesignTab('gradients')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      designTab === 'gradients'
                        ? 'bg-white shadow-sm text-brand-blue-primary'
                        : 'text-slate-500'
                    }`}
                  >
                    Gradients
                  </button>
                </div>

                {designTab === 'presets' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="aspect-video rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-blue-primary hover:text-brand-blue-primary hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-xxs font-bold uppercase">
                            Upload
                          </span>
                        </>
                      )}
                    </button>
                    {presets.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackground(bg.id)}
                        className={`group relative aspect-video rounded-lg overflow-hidden border transition-all ${
                          activeDashboard?.background === bg.id
                            ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                            : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={bg.thumbnailUrl ?? bg.id}
                          alt={bg.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xxxs font-bold uppercase px-1 text-center">
                            {bg.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {designTab === 'colors' && (
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackground(bg.id)}
                        className={`aspect-square rounded-lg border transition-all relative ${bg.id} ${
                          activeDashboard?.background === bg.id
                            ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                            : 'border-slate-200'
                        }`}
                      >
                        {bg.label === 'Dot Grid' && (
                          <Grid className="w-4 h-4 absolute inset-0 m-auto text-slate-300" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {designTab === 'gradients' && (
                  <div className="grid grid-cols-2 gap-2">
                    {gradients.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackground(bg.id)}
                        className={`aspect-video rounded-lg border transition-all relative ${
                          activeDashboard?.background === bg.id
                            ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className={`w-full h-full rounded-md ${bg.id}`} />
                        <div className="absolute bottom-1.5 left-1.5 text-xxxs font-bold uppercase text-white drop-shadow-md">
                          {bg.label}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* WIDGETS SECTION */}
              <div
                className={`absolute inset-0 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
                  activeSection === 'widgets'
                    ? 'translate-x-0 opacity-100 visible'
                    : 'translate-x-full opacity-0 invisible'
                }`}
              >
                {/* Grade Level Filter */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xxs font-bold uppercase tracking-widest text-slate-400">
                      Grade Filter
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {GRADE_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setGradeFilter(option.value)}
                        className={`py-1.5 rounded-md text-xxs font-bold uppercase transition-all ${
                          gradeFilter === option.value
                            ? 'bg-brand-blue-primary text-white shadow-sm'
                            : 'bg-white text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-widest">
                    Available Widgets
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAllToolsVisibility(true)}
                      className="text-xxs font-bold text-brand-blue-primary uppercase"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAllToolsVisibility(false)}
                      className="text-xxs font-bold text-slate-400 uppercase"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {filteredTools.map((tool) => {
                    const permission = featurePermissions.find(
                      (p) => p.widgetType === tool.type
                    );
                    const gradeLevels =
                      permission?.gradeLevels ??
                      getWidgetGradeLevels(tool.type);
                    const isActive = visibleTools.includes(tool.type);
                    const displayLabel =
                      permission?.displayName?.trim() ?? tool.label;

                    return (
                      <button
                        key={tool.type}
                        onClick={() => toggleToolVisibility(tool.type)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all border ${
                          isActive
                            ? 'bg-white border-brand-blue-primary text-slate-900 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-md ${isActive ? tool.color : 'bg-slate-100'} text-white`}
                          >
                            <tool.icon className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="text-[11px] font-bold uppercase tracking-tight">
                              {displayLabel}
                            </div>
                            <div className="flex gap-1 mt-0.5">
                              {gradeLevels.map((level) => (
                                <span
                                  key={level}
                                  className="text-[7px] font-bold px-1 py-0.5 rounded bg-slate-50 text-slate-400 uppercase"
                                >
                                  {level}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {isActive && (
                          <CheckSquare className="w-4 h-4 text-brand-blue-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STYLE SECTION - REPLACED */}
              <StylePanel
                isVisible={activeSection === 'style'}
                activeDashboard={activeDashboard}
                setGlobalStyle={setGlobalStyle}
                addToast={addToast}
              />

              {/* SETTINGS SECTION */}
              <div
                className={`absolute inset-0 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
                  activeSection === 'settings'
                    ? 'translate-x-0 opacity-100 visible'
                    : 'translate-x-full opacity-0 invisible'
                }`}
              >
                <div className="space-y-6">
                  {/* Google Drive Connection Management */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <GoogleDriveIcon className="w-4 h-4" />
                      <label className="text-xxs font-bold text-slate-700 uppercase tracking-tight block">
                        Google Drive Integration
                      </label>
                    </div>

                    <p className="text-xxs text-slate-400 mb-4 px-1 leading-relaxed">
                      Your boards and assets are automatically backed up to your
                      &quot;School Boards&quot; folder in Drive.
                    </p>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2">
                        {isDriveConnected ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-xxs font-bold text-slate-600 uppercase">
                          {isDriveConnected
                            ? 'Connected & Synced'
                            : 'Disconnected'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (isDriveConnected) {
                            void signOut();
                          } else {
                            void signInWithGoogle();
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xxxs font-black uppercase tracking-widest transition-all ${
                          isDriveConnected
                            ? 'text-slate-400 hover:text-brand-red-primary bg-slate-50 hover:bg-brand-red-lighter'
                            : 'bg-brand-blue-primary text-white shadow-sm'
                        }`}
                      >
                        {isDriveConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-3 px-1">
                      <label className="text-xxs font-bold text-slate-700 uppercase tracking-tight block">
                        Quick Access Widgets
                      </label>
                      <span className="text-xxs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {activeDashboard?.settings?.quickAccessWidgets
                          ?.length ?? 0}
                        /2
                      </span>
                    </div>
                    <p className="text-xxs text-slate-400 mb-4 px-1 leading-relaxed">
                      Select up to 2 widgets to appear when the dock is
                      minimized.
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {TOOLS.map((tool) => {
                        const isSelected =
                          activeDashboard?.settings?.quickAccessWidgets?.includes(
                            tool.type
                          );
                        const isFull =
                          (activeDashboard?.settings?.quickAccessWidgets
                            ?.length ?? 0) >= 2;
                        const disabled = !isSelected && isFull;

                        return (
                          <div key={tool.type} className="group relative">
                            <button
                              onClick={() => {
                                const current =
                                  activeDashboard?.settings
                                    ?.quickAccessWidgets ?? [];
                                let next;
                                if (current.includes(tool.type)) {
                                  next = current.filter((t) => t !== tool.type);
                                } else if (current.length < 2) {
                                  next = [...current, tool.type];
                                } else {
                                  return;
                                }
                                updateDashboardSettings({
                                  quickAccessWidgets: next,
                                });
                              }}
                              disabled={disabled}
                              className={`w-full aspect-square flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-brand-blue-primary text-white shadow-sm scale-105'
                                  : disabled
                                    ? 'bg-white text-slate-200 cursor-not-allowed opacity-50'
                                    : 'bg-white text-slate-400 border border-slate-100 hover:border-brand-blue-lighter hover:text-brand-blue-primary'
                              }`}
                            >
                              <tool.icon className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xxxs font-bold uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-modal shadow-lg scale-95 group-hover:scale-100">
                              {tool.label}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        saveCurrentDashboard();
                        addToast('Settings saved successfully', 'success');
                      }}
                      className="w-full py-3 bg-brand-blue-primary text-white rounded-xl font-bold text-xxs uppercase tracking-widest shadow-sm hover:bg-brand-blue-dark transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save all changes
                    </button>
                    <button
                      onClick={() => setActiveSection('main')}
                      className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xxs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto border-t border-slate-200 bg-slate-50/50">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user?.displayName ?? ''}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-blue-primary flex items-center justify-center text-xxs font-bold text-white shadow-sm">
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex flex-col min-w-0 flex-grow">
                  <span className="text-[11px] font-bold text-slate-900 truncate">
                    {user?.displayName}
                  </span>
                  <span className="text-xxs text-slate-500 truncate">
                    {user?.email}
                  </span>
                </div>

                <div className="flex items-center gap-2 mr-1">
                  {/* Sync Status */}
                  <div
                    className={`transition-all duration-500 ${
                      isSaving ? 'text-amber-500' : 'text-emerald-500'
                    }`}
                    title={
                      isSaving ? 'Syncing changes...' : 'All changes saved'
                    }
                  >
                    {isSaving ? (
                      <Cloud className="w-4 h-4 animate-bounce" />
                    ) : (
                      <CloudCheck className="w-4 h-4" />
                    )}
                  </div>

                  {/* Drive Status */}
                  <div className="relative">
                    <div
                      className={`transition-all duration-500 ${
                        isDriveConnected ? '' : 'grayscale opacity-30'
                      }`}
                      title={
                        isDriveConnected
                          ? 'Google Drive Connected'
                          : 'Google Drive Disconnected'
                      }
                    >
                      <GoogleDriveIcon className="w-4 h-4" />
                    </div>
                    {!isDriveConnected && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full">
                        <AlertCircle className="w-2.5 h-2.5 text-brand-red-primary fill-white" />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => void signOut()}
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 pb-3 flex justify-between items-center">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-[0.2em]">
                  v2.0.4-stable
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => void handleFileUpload(e)}
                />
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};
