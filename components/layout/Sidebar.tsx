
import React, { useState } from 'react';
import { Layout, Save, Plus, Trash2, Palette, X, Menu, Share2, Download } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    dashboards, activeDashboard, createNewDashboard, 
    loadDashboard, deleteDashboard, saveCurrentDashboard, setBackground, addToast 
  } = useDashboard();

  const backgrounds = [
    { id: 'bg-slate-900', color: '#0f172a' },
    { id: 'bg-indigo-900', color: '#312e81' },
    { id: 'bg-emerald-900', color: '#064e3b' },
    { id: 'bg-rose-900', color: '#881337' },
    { id: 'bg-gradient-to-br from-slate-900 to-slate-700', label: 'Dark Grad' },
    { id: 'bg-gradient-to-br from-indigo-500 to-purple-600', label: 'Vibrant' },
    { id: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100', label: 'Grid' },
  ];

  const handleShare = () => {
    if (!activeDashboard) return;
    const data = JSON.stringify(activeDashboard);
    navigator.clipboard.writeText(data);
    addToast('Board data copied to clipboard!', 'success');
  };

  const handleImport = () => {
    const data = prompt("Paste your board data here:");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        createNewDashboard(`Imported: ${parsed.name}`, parsed);
        addToast('Board imported successfully');
      } catch (e) {
        addToast('Invalid board data', 'error');
      }
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
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-2 mb-8 flex-1 overflow-y-auto pr-2">
              {dashboards.map((db) => (
                <div 
                  key={db.id}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    activeDashboard?.id === db.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                  onClick={() => loadDashboard(db.id)}
                >
                  <span className={`font-medium ${activeDashboard?.id === db.id ? 'text-blue-700' : 'text-slate-600'}`}>
                    {db.name}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteDashboard(db.id); }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  onClick={() => {
                    const name = prompt("Enter dashboard name:");
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

            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] hover:bg-slate-200"
                >
                  <Share2 className="w-4 h-4" /> SHARE BOARD
                </button>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Background
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {backgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setBackground(bg.id)}
                      className={`h-10 rounded-lg border-2 transition-all ${activeDashboard?.background === bg.id ? 'border-blue-600 scale-110 shadow-lg' : 'border-transparent'}`}
                      style={{ backgroundColor: bg.color }}
                      title={bg.label}
                    >
                      {bg.id.includes('gradient') && <div className={`w-full h-full rounded-md ${bg.id}`} />}
                      {bg.id.includes('radial') && <div className={`w-full h-full rounded-md ${bg.id}`} />}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => { saveCurrentDashboard(); setIsOpen(false); }}
                className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Save className="w-5 h-5" /> SAVE BOARD
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
