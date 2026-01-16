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
  Copy,
  ArrowLeft,
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
import { Dashboard, BackgroundPreset } from '../../types';
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

interface SortableDashboardItemProps {
  db: Dashboard;
  isActive: boolean;
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShare: (db: Dashboard) => void;
}

const SortableDashboardItem: React.FC<SortableDashboardItemProps> = ({
  db,
  isActive,
  onLoad,
  onRename,
  onDelete,
  onSetDefault,
  onDuplicate,
  onShare,
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
      className={`group relative flex flex-col p-0 rounded-2xl cursor-pointer transition-all border overflow-hidden ${
        isActive
          ? 'bg-white border-brand-blue-primary shadow-md ring-1 ring-brand-blue-lighter'
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
      } ${isDragging ? 'opacity-50 shadow-2xl scale-105' : ''}`}
      onClick={() => onLoad(db.id)}
    >
      {/* Board Thumbnail Placeholder or Image */}
      <div className="aspect-video w-full bg-slate-100 relative group-hover:bg-slate-50 transition-colors">
        {db.background?.startsWith('bg-') ? (
          <div className={`w-full h-full ${db.background}`} />
        ) : (
          <img
            src={db.background}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

        {/* Drag handle overlay */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur rounded-lg text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Default star overlay */}
        {db.isDefault && (
          <div className="absolute top-2 right-2 p-1 bg-amber-500 text-white rounded-full shadow-sm">
            <Star className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 flex-1">
            <div
              className={`font-bold text-sm truncate ${
                isActive ? 'text-brand-blue-dark' : 'text-slate-700'
              }`}
            >
              {db.name}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {new Date(db.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 border-t border-slate-50 pt-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(db.id);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                db.isDefault
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
              title={db.isDefault ? 'Default Board' : 'Set as Default'}
            >
              <Star
                className={`w-3.5 h-3.5 ${db.isDefault ? 'fill-current' : ''}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(db.id, db.name);
              }}
              className="p-1.5 text-slate-400 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-lg transition-all"
              title="Rename"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(db.id);
              }}
              className="p-1.5 text-slate-400 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-lg transition-all"
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(db);
              }}
              className="p-1.5 text-slate-400 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-lg transition-all"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

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
              className="p-1.5 text-slate-400 hover:text-brand-red-primary hover:bg-brand-red-lighter rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </label>
            <div className="peer-checked:flex hidden fixed inset-0 z-[11000] items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 className="text-base font-semibold text-slate-900 mb-2">
                  Delete board
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Are you sure you want to delete “{db.name}”? This action
                  cannot be undone.
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
    </div>
  );
};

type MenuSection = 'main' | 'widgets' | 'backgrounds' | 'boards' | 'settings';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSection, setActiveSection] = useState<MenuSection>('main');

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
    duplicateDashboard,
    renameDashboard,
    reorderDashboards,
    setDefaultDashboard,
    saveCurrentDashboard,
    setBackground,
    updateDashboardSettings,
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

  const handleShare = (db?: Dashboard) => {
    const target = db ?? activeDashboard;
    if (!target) return;
    const data = JSON.stringify(target);
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
            <div className="p-6 border-b border-slate-100 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeSection !== 'main' && (
                    <button
                      onClick={() => setActiveSection('main')}
                      className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                      title="Back to Main Menu"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-brand-blue-primary">
                    <Layout className="w-6 h-6" />
                    <span className="font-black text-xl tracking-tight uppercase">
                      {activeSection === 'main'
                        ? 'School Boards'
                        : activeSection}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Content Area with Sliding Sections */}
            <div className="flex-1 relative overflow-hidden bg-slate-50/30">
              {/* MAIN MENU */}
              <div
                className={`absolute inset-0 p-6 flex flex-col gap-4 transition-all duration-300 ease-in-out ${
                  activeSection === 'main'
                    ? 'translate-x-0 opacity-100 visible'
                    : '-translate-x-full opacity-0 invisible'
                }`}
              >
                <button
                  onClick={() => setActiveSection('boards')}
                  className="group relative flex items-center gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-blue-primary hover:shadow-md transition-all text-left"
                >
                  <div className="p-4 rounded-xl bg-brand-blue-lighter text-brand-blue-primary group-hover:bg-brand-blue-primary group-hover:text-white transition-colors">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      Boards
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      Manage and switch between your boards
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 ml-auto text-slate-300 group-hover:text-brand-blue-primary transition-colors" />
                </button>

                <button
                  onClick={() => setActiveSection('backgrounds')}
                  className="group relative flex items-center gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-blue-primary hover:shadow-md transition-all text-left"
                >
                  <div className="p-4 rounded-xl bg-brand-blue-lighter text-brand-blue-primary group-hover:bg-brand-blue-primary group-hover:text-white transition-colors">
                    <Paintbrush className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      Backgrounds
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      Customize your board&apos;s appearance
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 ml-auto text-slate-300 group-hover:text-brand-blue-primary transition-colors" />
                </button>

                <button
                  onClick={() => setActiveSection('widgets')}
                  className="group relative flex items-center gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-blue-primary hover:shadow-md transition-all text-left"
                >
                  <div className="p-4 rounded-xl bg-brand-blue-lighter text-brand-blue-primary group-hover:bg-brand-blue-primary group-hover:text-white transition-colors">
                    <LayoutGrid className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      Widgets
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      Add tools and interactives to your board
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 ml-auto text-slate-300 group-hover:text-brand-blue-primary transition-colors" />
                </button>

                <button
                  onClick={() => setActiveSection('settings')}
                  className="group relative flex items-center gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-blue-primary hover:shadow-md transition-all text-left"
                >
                  <div className="p-4 rounded-xl bg-brand-blue-lighter text-brand-blue-primary group-hover:bg-brand-blue-primary group-hover:text-white transition-colors">
                    <Settings className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      Settings
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      Account and application preferences
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 ml-auto text-slate-300 group-hover:text-brand-blue-primary transition-colors" />
                </button>
              </div>

              {/* BOARDS SECTION */}
              <div
                className={`absolute inset-0 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
                  activeSection === 'boards'
                    ? 'translate-x-0 opacity-100 visible'
                    : 'translate-x-full opacity-0 invisible'
                }`}
              >
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setNewDashboardName('');
                      setShowNewDashboardModal(true);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-brand-blue-primary text-white rounded-2xl shadow-md hover:bg-brand-blue-dark transition-all"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      New Board
                    </span>
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl hover:border-brand-blue-primary hover:text-brand-blue-primary transition-all"
                  >
                    <Download className="w-6 h-6" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Import
                    </span>
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    My Boards
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
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
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </div>

              {/* BACKGROUNDS SECTION */}
              <div
                className={`absolute inset-0 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
                  activeSection === 'backgrounds'
                    ? 'translate-x-0 opacity-100 visible'
                    : 'translate-x-full opacity-0 invisible'
                }`}
              >
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-black uppercase tracking-widest">
                  <button
                    onClick={() => setDesignTab('presets')}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      designTab === 'presets'
                        ? 'bg-white shadow-sm text-brand-blue-primary'
                        : 'text-slate-500'
                    }`}
                  >
                    Presets
                  </button>
                  <button
                    onClick={() => setDesignTab('colors')}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      designTab === 'colors'
                        ? 'bg-white shadow-sm text-brand-blue-primary'
                        : 'text-slate-500'
                    }`}
                  >
                    Colors
                  </button>
                  <button
                    onClick={() => setDesignTab('gradients')}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      designTab === 'gradients'
                        ? 'bg-white shadow-sm text-brand-blue-primary'
                        : 'text-slate-500'
                    }`}
                  >
                    Gradients
                  </button>
                </div>

                {designTab === 'presets' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-brand-blue-primary hover:text-brand-blue-primary hover:bg-brand-blue-lighter transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-[10px] font-black uppercase">
                            Upload
                          </span>
                        </>
                      )}
                    </button>
                    {presets.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackground(bg.id)}
                        className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                          activeDashboard?.background === bg.id
                            ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={bg.thumbnailUrl ?? bg.id}
                          alt={bg.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[10px] font-black uppercase px-2 text-center">
                            {bg.label}
                          </span>
                        </div>
                      </button>
                    ))}
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
                            ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                            : 'border-slate-100'
                        }`}
                      >
                        {bg.label === 'Dot Grid' && (
                          <Grid className="w-6 h-6 absolute inset-0 m-auto text-slate-300" />
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
                            ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                            : 'border-transparent'
                        }`}
                      >
                        <div className={`w-full h-full rounded-lg ${bg.id}`} />
                        <div className="absolute bottom-2 left-2 text-[10px] font-black uppercase text-white drop-shadow-md">
                          {bg.label}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* WIDGETS SECTION */}
              <div
                className={`absolute inset-0 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
                  activeSection === 'widgets'
                    ? 'translate-x-0 opacity-100 visible'
                    : 'translate-x-full opacity-0 invisible'
                }`}
              >
                {/* Grade Level Filter */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Grade Filter
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {GRADE_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setGradeFilter(option.value)}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                          gradeFilter === option.value
                            ? 'bg-brand-blue-primary text-white shadow-sm'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Available Widgets
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAllToolsVisibility(true)}
                      className="text-[10px] font-black text-brand-blue-primary uppercase tracking-wider"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAllToolsVisibility(false)}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-wider"
                    >
                      None
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
                    const displayLabel =
                      permission?.displayName?.trim() ?? tool.label;

                    return (
                      <button
                        key={tool.type}
                        onClick={() => toggleToolVisibility(tool.type)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border-2 ${
                          isActive
                            ? 'bg-white border-brand-blue-primary text-brand-blue-dark shadow-sm'
                            : 'bg-white border-slate-100 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${isActive ? tool.color : 'bg-slate-100'} text-white`}
                          >
                            <tool.icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-black uppercase tracking-tight">
                              {displayLabel}
                            </div>
                            <div className="flex gap-1 mt-0.5">
                              {gradeLevels.map((level) => (
                                <span
                                  key={level}
                                  className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 uppercase"
                                >
                                  {level}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {isActive && (
                          <CheckSquare className="w-5 h-5 text-brand-blue-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SETTINGS SECTION */}
              <div
                className={`absolute inset-0 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
                  activeSection === 'settings'
                    ? 'translate-x-0 opacity-100 visible'
                    : 'translate-x-full opacity-0 invisible'
                }`}
              >
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="w-20 h-20 rounded-full border-4 border-brand-blue-lighter shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-brand-blue-primary flex items-center justify-center text-2xl font-black text-white shadow-md">
                        {user?.displayName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-md border border-slate-100">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                    {user?.displayName}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">{user?.email}</p>

                  <div className="w-full flex flex-col gap-2">
                    <button
                      onClick={() => {
                        saveCurrentDashboard();
                        addToast('Board saved manually');
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-brand-blue-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-blue-lighter hover:bg-brand-blue-dark transition-all"
                    >
                      <Save className="w-4 h-4" /> Save Current Board
                    </button>
                    <button
                      onClick={() => handleShare()}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:border-brand-blue-primary hover:text-brand-blue-primary transition-all"
                    >
                      <Share2 className="w-4 h-4" /> Share Board Data
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                    Widget Defaults
                  </h4>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-tight block mb-3">
                      Default Widget Transparency
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={
                          activeDashboard?.settings
                            ?.defaultWidgetTransparency ?? 0.2
                        }
                        onChange={(e) =>
                          updateDashboardSettings({
                            defaultWidgetTransparency: parseFloat(
                              e.target.value
                            ),
                          })
                        }
                        className="flex-1 accent-brand-blue-primary h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="min-w-[3ch] text-xs font-bold text-slate-500 text-right">
                        {Math.round(
                          (activeDashboard?.settings
                            ?.defaultWidgetTransparency ?? 0.2) * 100
                        )}
                        %
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      Applies to all new widgets added to this board.
                    </p>
                  </div>

                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                    Application
                  </h4>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAdminSettings(true)}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-blue-primary transition-all text-left"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                        <Settings className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-slate-700 uppercase">
                        Admin Console
                      </span>
                    </button>
                  )}
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-red-primary group transition-all text-left"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-brand-red-lighter group-hover:text-brand-red-primary transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-slate-700 uppercase group-hover:text-brand-red-primary">
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with subtle branding or version */}
            <div className="p-4 bg-slate-50 text-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => void handleFileUpload(e)}
              />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                SpartBoard v2.0
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
