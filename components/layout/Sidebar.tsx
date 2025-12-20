import React, { useState, useRef } from 'react';
import {
  Layout,
  Save,
  Plus,
  Trash2,
  Palette,
  X,
  Menu,
  Share2,
  Download,
  Upload,
  Grid,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { useStorage } from '../../hooks/useStorage';
import { TOOLS } from '../../types';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'presets' | 'colors' | 'gradients' | 'tools'
  >('presets');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { user } = useAuth();
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
    { id: 'bg-gradient-to-br from-indigo-500 to-purple-600', label: 'Vibrant' },
    { id: 'bg-gradient-to-br from-emerald-400 to-cyan-500', label: 'Tropical' },
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
        const parsed = JSON.parse(data);
        createNewDashboard(`Imported: ${parsed.name}`, parsed);
        addToast('Board imported successfully');
      } catch (_e) {
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 left-6 z-[1000] p-3 bg-white shadow-xl rounded-2xl hover:scale-110 transition-transform border border-slate-100"
      >
        <Menu className="w-6 h-6 text-slate-700" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-80 h-full bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Layout className="w-6 h-6 text-blue-600" />
                Dashboards
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-2 mb-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {dashboards.map((db) => (
                <div
                  key={db.id}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    activeDashboard?.id === db.id
                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                  onClick={() => loadDashboard(db.id)}
                >
                  <span
                    className={`font-semibold text-sm ${activeDashboard?.id === db.id ? 'text-blue-700' : 'text-slate-600'}`}
                  >
                    {db.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDashboard(db.id);
                    }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => {
                    const name = prompt('Enter dashboard name:');
                    if (name) createNewDashboard(name);
                  }}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all font-bold text-[10px]"
                >
                  <Plus className="w-3 h-3" /> NEW
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all font-bold text-[10px]"
                >
                  <Download className="w-3 h-3" /> IMPORT
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-500" /> Workspace
                </h3>
              </div>

              {/* Settings Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-[9px] font-black uppercase tracking-tighter mb-4">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'presets' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  BGs
                </button>
                <button
                  onClick={() => setActiveTab('colors')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'colors' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  Clrs
                </button>
                <button
                  onClick={() => setActiveTab('gradients')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'gradients' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  Grads
                </button>
                <button
                  onClick={() => setActiveTab('tools')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'tools' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  Apps
                </button>
              </div>

              <div className="h-48 overflow-y-auto pr-1 custom-scrollbar">
                {activeTab === 'presets' && (
                  <div className="grid grid-cols-4 gap-2">
                    {presets.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackground(bg.id)}
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${activeDashboard?.background === bg.id ? 'border-blue-600 scale-110 shadow-lg z-10' : 'border-transparent hover:scale-105'}`}
                        title={bg.label}
                      >
                        <img
                          src={bg.id}
                          alt={bg.label}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span className="text-[8px] font-bold mt-1">
                            UPLOAD
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {activeTab === 'colors' && (
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackground(bg.id)}
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${activeDashboard?.background === bg.id ? 'border-blue-600 scale-110 shadow-lg z-10' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: bg.color }}
                        title={bg.label}
                      >
                        {bg.id.includes('radial') && (
                          <div className={`w-full h-full ${bg.id}`} />
                        )}
                        {bg.label === 'Dot Grid' && (
                          <Grid className="w-4 h-4 absolute inset-0 m-auto text-slate-300" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'gradients' && (
                  <div className="grid grid-cols-4 gap-2">
                    {gradients.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackground(bg.id)}
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${activeDashboard?.background === bg.id ? 'border-blue-600 scale-110 shadow-lg z-10' : 'border-transparent hover:scale-105'}`}
                        title={bg.label}
                      >
                        <div className={`w-full h-full ${bg.id}`} />
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'tools' && (
                  <div className="space-y-1">
                    <div className="flex gap-1 mb-2">
                      <button
                        onClick={() => setAllToolsVisibility(true)}
                        className="flex-1 py-1 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase"
                      >
                        All
                      </button>
                      <button
                        onClick={() => setAllToolsVisibility(false)}
                        className="flex-1 py-1 bg-slate-50 text-slate-500 rounded-md text-[9px] font-black uppercase"
                      >
                        None
                      </button>
                    </div>
                    {TOOLS.map((tool) => (
                      <button
                        key={tool.type}
                        onClick={() => toggleToolVisibility(tool.type)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-all border ${
                          visibleTools.includes(tool.type)
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : 'bg-white border-transparent text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1 rounded ${tool.color} text-white`}
                          >
                            <tool.icon className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-tight">
                            {tool.label}
                          </span>
                        </div>
                        {visibleTools.includes(tool.type) ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] hover:bg-slate-200"
                >
                  <Share2 className="w-4 h-4" /> SHARE
                </button>
                <button
                  onClick={() => {
                    saveCurrentDashboard();
                    setIsOpen(false);
                  }}
                  className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-[10px]"
                >
                  <Save className="w-4 h-4" /> SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
