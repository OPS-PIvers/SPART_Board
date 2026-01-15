import React, { useState, useRef, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
  ChevronRight,
  Star,
  GripVertical,
  Maximize,
  Minimize,
} from 'lucide-react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useStorage } from '../../hooks/useStorage';
import { Dashboard, GradeLevel, BackgroundPreset } from '../../types';
import { TOOLS } from '../../config/tools';
import { getWidgetGradeLevels } from '../../config/widgetGradeLevels';
import { AdminSettings } from '../admin/AdminSettings';
import { GlassCard } from '../common/GlassCard';

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

interface SortableDashboardItemProps {
  db: Dashboard;
  isActive: boolean;
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const SortableDashboardItem: React.FC<SortableDashboardItemProps> = ({
  db,
  isActive,
  onLoad,
  onRename,
  onDelete,
  onSetDefault,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: db.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
        isActive
          ? 'bg-white border-brand-blue-light shadow-md ring-1 ring-brand-blue-lighter'
          : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
      } ${isDragging ? 'opacity-50 shadow-2xl scale-105' : ''}`}
      onClick={() => onLoad(db.id)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div
          className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
            isActive
              ? 'bg-brand-blue-primary'
              : 'bg-slate-200 group-hover:bg-slate-300'
          }`}
        />
        <div className="truncate">
          <div className="flex items-center gap-2">
            <div
              className={`font-bold text-sm truncate ${
                isActive ? 'text-brand-blue-dark' : 'text-slate-700'
              }`}
            >
              {db.name}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            {new Date(db.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetDefault(db.id);
          }}
          className={`p-1.5 rounded-lg transition-all ${
            db.isDefault
              ? 'text-amber-500 bg-amber-50'
              : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
          }`}
          title={db.isDefault ? 'Default Board' : 'Set as Default'}
        >
          <Star className={`w-4 h-4 ${db.isDefault ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename(db.id, db.name);
          }}
          className="p-1.5 text-slate-300 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-lg transition-all"
          title="Rename"
        >
          <Pencil className="w-4 h-4" />
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
            className="p-1.5 text-slate-300 hover:text-brand-red-primary hover:bg-brand-red-lighter rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </label>
          <div className="peer-checked:flex hidden fixed inset-0 z-[11000] items-center justify-center bg-slate-900/40">
            <div
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-base font-semibold text-slate-900 mb-2">
                Delete board
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to delete “{db.name}”? This action cannot
                be undone.
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
                    onDelete(db.id);
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
  );
};

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'widgets' | 'design' | 'boards'>(
    'widgets'
  );

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
        distance: 8,
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

  const { user, signOut, isAdmin, featurePermissions } = useAuth();
  const { uploadBackgroundImage } = useStorage();
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
    reorderDashboards,
    setDefaultDashboard,
    saveCurrentDashboard,
    setBackground,
    addToast,
  } = useDashboard();

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
  const [managedBackgrounds, setManagedBackgrounds] = useState<
    BackgroundPreset[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const publicBgsRef = useRef<BackgroundPreset[]>([]);
  const betaBgsRef = useRef<BackgroundPreset[]>([]);

  // Fetch managed backgrounds from Firestore

  useEffect(() => {
    if (!user) return;

    const baseRef = collection(db, 'admin_backgrounds');

    const unsubscribes: (() => void)[] = [];

    if (isAdmin) {
      // Admins can query everything active without permission errors

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
      // Non-admins need separate queries to avoid reading restricted documents (admin-only)
      // Use refs to prevent race conditions when both queries update simultaneously

      const updateCombinedBackgrounds = () => {
        const all = [...publicBgsRef.current, ...betaBgsRef.current];
        const unique = Array.from(new Map(all.map((b) => [b.id, b])).values());
        setManagedBackgrounds(unique.sort((a, b) => b.createdAt - a.createdAt));
      };

      // Query 1: Public backgrounds

      const qPublic = query(
        baseRef,

        where('active', '==', true),

        where('accessLevel', '==', 'public')
      );

      // Query 2: Beta backgrounds where the user is authorized
      // Note: Beta backgrounds require user email for authorization
      if (user.email) {
        const qBeta = query(
          baseRef,
          where('active', '==', true),
          where('accessLevel', '==', 'beta'),
          where('betaUsers', 'array-contains', user.email.toLowerCase())
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
            (error) => {
              console.error('Error fetching beta backgrounds:', error);
            }
          )
        );
      } else {
        console.warn('Skipping beta background query: User has no email.');
      }

      // Public backgrounds are always available regardless of user email
      unsubscribes.push(
        onSnapshot(
          qPublic,
          (snapshot) => {
            publicBgsRef.current = snapshot.docs.map(
              (d) => d.data() as BackgroundPreset
            );
            updateCombinedBackgrounds();
          },
          (error) => {
            console.error('Error fetching public backgrounds:', error);
          }
        )
      );
    }

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user, isAdmin]);

  // Combine static and managed presets
  const presets = useMemo(() => {
    return managedBackgrounds.map((bg) => ({
      id: bg.url,
      thumbnailUrl: bg.thumbnailUrl,
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
      <GlassCard
        data-screenshot="exclude"
        className="fixed top-6 left-6 z-[1000] flex items-center gap-2 p-2 rounded-full transition-all"
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
                  onClick={() => setActiveTab('boards')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'boards'
                      ? 'bg-white shadow-sm text-brand-blue-primary'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" /> Boards
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
                      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                      const displayLabel = trimmedDisplayName
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
                          className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all bg-slate-100 ${
                            activeDashboard?.background === bg.id
                              ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter ring-offset-2'
                              : 'border-transparent hover:scale-[1.02]'
                          }`}
                        >
                          <img
                            src={bg.thumbnailUrl || bg.id}
                            alt={bg.label}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            loading="lazy"
                            decoding="async"
                            onLoad={(e) => {
                              (e.target as HTMLImageElement).style.opacity =
                                '1';
                            }}
                            style={{ opacity: 0 }}
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
                              <div className="bg-white/30 backdrop-blur-sm p-1.5 rounded-full">
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
                            <div className="absolute top-2 right-2 bg-white/30 backdrop-blur-md p-1 rounded-full">
                              <CheckSquare className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BOARDS TAB */}
              {activeTab === 'boards' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                      My Boards
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
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

              <div className="flex flex-col gap-5">
                {/* Board Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <button
                    onClick={() => {
                      saveCurrentDashboard();
                      setIsOpen(false);
                    }}
                    className="flex-1 bg-brand-blue-primary text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-blue-lighter hover:bg-brand-blue-dark hover:shadow-brand-blue-light active:scale-95 transition-all text-[10px] uppercase tracking-wider"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Board
                  </button>
                </div>

                <div className="h-px bg-slate-200/60 w-full" />

                {/* User Profile & Session Management */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user?.displayName ?? 'User'}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700"
                        aria-label={user?.displayName ?? 'User'}
                      >
                        {(user?.displayName ?? 'User').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-800 font-bold text-sm truncate leading-tight">
                        {user?.displayName}
                      </span>
                      <span className="text-slate-500 text-[10px] truncate">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={signOut}
                    className="p-2.5 text-slate-400 hover:text-brand-red-primary hover:bg-brand-red-lighter rounded-xl transition-all group"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
