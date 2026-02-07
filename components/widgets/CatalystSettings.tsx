import React, { useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  CatalystConfig,
  CatalystCategory,
  CatalystRoutine,
  WidgetType,
  WidgetConfig,
} from '../../types';
import { CATALYST_ROUTINES } from '../../config/catalystRoutines';
import { DEFAULT_CATALYST_CATEGORIES } from '../../config/catalystDefaults';
import { TOOLS } from '../../config/tools';
import * as Icons from 'lucide-react';
import { Plus, Trash2, Edit2, X, AlertCircle } from 'lucide-react';

const COMMON_ICONS = [
  'LayoutGrid',
  'Brain',
  'Settings2',
  'HelpCircle',
  'Zap',
  'BookOpen',
  'Hand',
  'Megaphone',
  'Users',
  'ListTodo',
  'Smile',
  'Star',
  'Heart',
  'Music',
  'Video',
  'Image',
  'FileText',
  'Calendar',
  'Clock',
  'Bell',
  'CheckCircle',
  'AlertCircle',
  'Info',
];

const COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-slate-500',
];

// Derive widget types from TOOLS registry, excluding catalyst-related widgets
const WIDGET_TYPES: WidgetType[] = TOOLS.filter(
  (tool) =>
    !tool.type.startsWith('catalyst') && tool.type !== 'instructionalRoutines'
).map((tool) => tool.type);

interface CatalystSettingsProps {
  widget: WidgetData;
}

export const CatalystSettings: React.FC<CatalystSettingsProps> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as CatalystConfig;

  // Initialize state from config or defaults
  const [categories, setCategories] = useState<CatalystCategory[]>(
    config.customCategories ?? DEFAULT_CATALYST_CATEGORIES
  );

  const [routines, setRoutines] = useState<CatalystRoutine[]>(() => {
    const routinesMap = new Map<string, CatalystRoutine>();
    CATALYST_ROUTINES.forEach((r) => routinesMap.set(r.id, r));
    config.customRoutines?.forEach((r) => routinesMap.set(r.id, r));
    return Array.from(routinesMap.values());
  });

  const [activeTab, setActiveTab] = useState<'categories' | 'routines'>(
    'categories'
  );
  const [editingCategory, setEditingCategory] =
    useState<CatalystCategory | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<CatalystRoutine | null>(
    null
  );

  // Track JSON parsing errors and JSON text state by widget ID (stable identifier)
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
  const [jsonTexts, setJsonTexts] = useState<Record<string, string>>({});

  const saveConfig = (
    newCategories: CatalystCategory[],
    newRoutines: CatalystRoutine[]
  ) => {
    // Compute diffs: only save overrides/additions vs defaults
    const categoryDiffs = newCategories.filter((cat) => {
      const defaultCat = DEFAULT_CATALYST_CATEGORIES.find(
        (c) => c.id === cat.id
      );
      return !defaultCat || JSON.stringify(cat) !== JSON.stringify(defaultCat);
    });

    const routineDiffs = newRoutines.filter((routine) => {
      const defaultRoutine = CATALYST_ROUTINES.find((r) => r.id === routine.id);
      return (
        !defaultRoutine ||
        JSON.stringify(routine) !== JSON.stringify(defaultRoutine)
      );
    });

    updateWidget(widget.id, {
      config: {
        ...config,
        customCategories: categoryDiffs.length > 0 ? categoryDiffs : undefined,
        customRoutines: routineDiffs.length > 0 ? routineDiffs : undefined,
      },
    });
  };

  const handleSaveCategory = (category: CatalystCategory) => {
    let newCategories;
    if (categories.find((c) => c.id === category.id)) {
      newCategories = categories.map((c) =>
        c.id === category.id ? category : c
      );
    } else {
      newCategories = [...categories, category];
    }
    setCategories(newCategories);
    setEditingCategory(null);
    saveConfig(newCategories, routines);
  };

  const handleDeleteCategory = (id: string) => {
    const isCategoryInUse = routines.some((r) => r.category === id);
    if (isCategoryInUse) {
      alert(
        'This category is in use by one or more routines and cannot be deleted. Please re-assign or delete the routines first.'
      );
      return;
    }

    if (confirm('Delete this category?')) {
      const newCategories = categories.filter((c) => c.id !== id);
      setCategories(newCategories);
      saveConfig(newCategories, routines);
    }
  };

  const handleSaveRoutine = (routine: CatalystRoutine) => {
    // Prevent saving if there are JSON errors
    if (Object.keys(jsonErrors).length > 0) {
      alert('Please fix JSON errors before saving.');
      return;
    }

    let newRoutines;
    if (routines.find((r) => r.id === routine.id)) {
      newRoutines = routines.map((r) => (r.id === routine.id ? routine : r));
    } else {
      newRoutines = [...routines, routine];
    }
    setRoutines(newRoutines);
    setEditingRoutine(null);
    saveConfig(categories, newRoutines);
  };

  const handleDeleteRoutine = (id: string) => {
    if (confirm('Delete this routine?')) {
      const newRoutines = routines.filter((r) => r.id !== id);
      setRoutines(newRoutines);
      saveConfig(categories, newRoutines);
    }
  };

  // Helper to render icons consistently
  const renderIcon = (
    iconName: string,
    size: number = 20,
    className: string = ''
  ) => {
    if (iconName.startsWith('http') || iconName.startsWith('data:')) {
      return (
        <img
          src={iconName}
          className={`object-contain ${className}`}
          alt=""
          style={{ width: size, height: size }}
        />
      );
    }
    const IconComp =
      (Icons as unknown as Record<string, React.ElementType>)[iconName] ??
      Icons.Zap;
    return <IconComp size={size} className={className} />;
  };

  // --- Sub-components (Render Functions) ---

  const renderIconPicker = (value: string, onChange: (val: string) => void) => {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase text-slate-500">
          Icon (Lucide Name or URL)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
            placeholder="e.g. Zap or https://..."
          />
        </div>
        <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
          {COMMON_ICONS.map((name) => {
            const Icon = (
              Icons as unknown as Record<string, React.ElementType>
            )[name];
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                className={`p-1 rounded hover:bg-slate-200 ${
                  value === name ? 'bg-indigo-100 text-indigo-600' : ''
                }`}
                title={name}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCategoryEditor = () => {
    if (!editingCategory) return null;
    const isNew = !categories.find((c) => c.id === editingCategory.id);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="font-black text-lg text-slate-800 mb-4">
            {isNew ? 'New Category' : 'Edit Category'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Label
              </label>
              <input
                type="text"
                value={editingCategory.label}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    label: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>
            {renderIconPicker(editingCategory.icon, (val) =>
              setEditingCategory({ ...editingCategory, icon: val })
            )}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setEditingCategory({ ...editingCategory, color })
                    }
                    className={`w-8 h-8 rounded-full ${color} ${
                      editingCategory.color === color
                        ? 'ring-2 ring-offset-2 ring-slate-800'
                        : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-6 justify-end">
            <button
              onClick={() => setEditingCategory(null)}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveCategory(editingCategory)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRoutineEditor = () => {
    if (!editingRoutine) return null;
    const isNew = !routines.find((r) => r.id === editingRoutine.id);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-lg text-slate-800">
              {isNew ? 'New Routine' : 'Edit Routine'}
            </h3>
            <button
              onClick={() => {
                setEditingRoutine(null);
                setJsonErrors({});
                setJsonTexts({});
              }}
              className="p-1 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editingRoutine.title}
                onChange={(e) =>
                  setEditingRoutine({
                    ...editingRoutine,
                    title: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Category
              </label>
              <select
                value={editingRoutine.category}
                onChange={(e) =>
                  setEditingRoutine({
                    ...editingRoutine,
                    category: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={editingRoutine.shortDesc}
                onChange={(e) =>
                  setEditingRoutine({
                    ...editingRoutine,
                    shortDesc: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-2">
              {renderIconPicker(editingRoutine.icon, (val) =>
                setEditingRoutine({ ...editingRoutine, icon: val })
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Teacher Instructions
              </label>
              <textarea
                value={editingRoutine.instructions}
                onChange={(e) =>
                  setEditingRoutine({
                    ...editingRoutine,
                    instructions: e.target.value,
                  })
                }
                rows={4}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-2 border-t border-slate-200 pt-4 mt-2">
              <label className="block text-xs font-black uppercase text-indigo-600 mb-2">
                Associated Widgets (Go Mode)
              </label>
              <div className="space-y-3">
                {(editingRoutine.associatedWidgets ?? []).map((aw) => {
                  // Initialize JSON text state if not present
                  if (!jsonTexts[aw.id]) {
                    setJsonTexts((prev) => ({
                      ...prev,
                      [aw.id]: JSON.stringify(aw.config ?? {}, null, 2),
                    }));
                  }

                  return (
                    <div
                      key={aw.id}
                      className="flex flex-col gap-2 p-3 bg-slate-50 rounded border border-slate-200"
                    >
                      <div className="flex gap-2 items-center">
                        <select
                          value={aw.type}
                          onChange={(e) => {
                            const newType = e.target.value as WidgetType;
                            const newWidgets = (
                              editingRoutine.associatedWidgets ?? []
                            ).map((w) =>
                              w.id === aw.id
                                ? { id: w.id, type: newType, config: undefined }
                                : w
                            );
                            setEditingRoutine({
                              ...editingRoutine,
                              associatedWidgets: newWidgets,
                            });
                            // Reset JSON text and clear any errors
                            setJsonTexts((prev) => ({
                              ...prev,
                              [aw.id]: '{}',
                            }));
                            const newErrors = { ...jsonErrors };
                            delete newErrors[aw.id];
                            setJsonErrors(newErrors);
                          }}
                          className="border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                        >
                          {WIDGET_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const newWidgets = (
                              editingRoutine.associatedWidgets ?? []
                            ).filter((w) => w.id !== aw.id);
                            setEditingRoutine({
                              ...editingRoutine,
                              associatedWidgets: newWidgets,
                            });
                            // Clean up state
                            const newErrors = { ...jsonErrors };
                            delete newErrors[aw.id];
                            setJsonErrors(newErrors);
                            const newTexts = { ...jsonTexts };
                            delete newTexts[aw.id];
                            setJsonTexts(newTexts);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div>
                        <textarea
                          value={
                            jsonTexts[aw.id] ??
                            JSON.stringify(aw.config ?? {}, null, 2)
                          }
                          onChange={(e) => {
                            const newText = e.target.value;
                            setJsonTexts((prev) => ({
                              ...prev,
                              [aw.id]: newText,
                            }));

                            try {
                              const parsed = JSON.parse(
                                newText
                              ) as WidgetConfig;
                              const newWidgets = (
                                editingRoutine.associatedWidgets ?? []
                              ).map((w) =>
                                w.id === aw.id ? { ...w, config: parsed } : w
                              );
                              setEditingRoutine({
                                ...editingRoutine,
                                associatedWidgets: newWidgets,
                              });
                              // Clear error if success
                              if (jsonErrors[aw.id]) {
                                const newErrors = { ...jsonErrors };
                                delete newErrors[aw.id];
                                setJsonErrors(newErrors);
                              }
                            } catch (_err) {
                              // Set error state
                              setJsonErrors({
                                ...jsonErrors,
                                [aw.id]: 'Invalid JSON format',
                              });
                            }
                          }}
                          className={`w-full text-xs font-mono border rounded p-2 h-24 ${
                            jsonErrors[aw.id]
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-300'
                          }`}
                          placeholder="{}"
                        />
                        {jsonErrors[aw.id] && (
                          <div className="flex items-center gap-1 text-red-500 text-xs mt-1 font-bold">
                            <AlertCircle size={12} />
                            {jsonErrors[aw.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() =>
                    setEditingRoutine({
                      ...editingRoutine,
                      associatedWidgets: [
                        ...(editingRoutine.associatedWidgets ?? []),
                        {
                          id: crypto.randomUUID(),
                          type: 'time-tool',
                          config: { mode: 'timer' } as unknown as WidgetConfig,
                        },
                      ],
                    })
                  }
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Plus size={14} /> Add Widget
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6 justify-end">
            <button
              onClick={() => {
                setEditingRoutine(null);
                setJsonErrors({});
                setJsonTexts({});
              }}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveRoutine(editingRoutine)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Tab Nav */}
      <div className="flex gap-2 p-2 bg-white border-b border-slate-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 text-center text-sm font-bold uppercase rounded-lg transition-colors ${
            activeTab === 'categories'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('routines')}
          className={`flex-1 py-2 text-center text-sm font-bold uppercase rounded-lg transition-colors ${
            activeTab === 'routines'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Routines
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'categories' ? (
          <div className="space-y-4">
            <button
              onClick={() =>
                setEditingCategory({
                  id: crypto.randomUUID(),
                  label: 'New Category',
                  icon: 'LayoutGrid',
                  color: 'bg-indigo-500',
                  isCustom: true,
                })
              }
              className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
            >
              <Plus size={16} /> Add Category
            </button>

            <div className="grid grid-cols-1 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center text-white shrink-0`}
                  >
                    {renderIcon(cat.icon, 20)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-700 text-sm truncate">
                      {cat.label}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      aria-label="Edit Category"
                      onClick={() => setEditingCategory(cat)}
                      className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-indigo-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      aria-label="Delete Category"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() =>
                setEditingRoutine({
                  id: crypto.randomUUID(),
                  title: 'New Routine',
                  category: categories[0]?.id || '',
                  icon: 'Zap',
                  shortDesc: '',
                  instructions: '',
                  associatedWidgets: [],
                })
              }
              className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
            >
              <Plus size={16} /> Add Routine
            </button>

            <div className="space-y-6">
              {categories.map((cat) => {
                const catRoutines = routines.filter(
                  (r) => r.category === cat.id
                );
                if (catRoutines.length === 0) return null;

                return (
                  <div key={cat.id}>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                      {cat.label}
                    </h3>
                    <div className="space-y-2">
                      {catRoutines.map((routine) => (
                        <div
                          key={routine.id}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors"
                        >
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            {renderIcon(routine.icon, 18)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-700 text-sm truncate">
                              {routine.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {routine.shortDesc}
                            </div>
                          </div>
                          <button
                            aria-label="Edit Routine"
                            onClick={() => setEditingRoutine(routine)}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-indigo-600"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            aria-label="Delete Routine"
                            onClick={() => handleDeleteRoutine(routine.id)}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {renderCategoryEditor()}
      {renderRoutineEditor()}
    </div>
  );
};
