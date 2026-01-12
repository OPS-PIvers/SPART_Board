import React, { useRef, useState } from 'react';
import { Menu, Bell, Plus, Star, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useDashboard } from '../../context/useDashboard';

interface HeaderProps {
  onMenuOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuOpen }) => {
  const { user } = useAuth();
  const { dashboards, activeDashboard, loadDashboard, createNewDashboard } =
    useDashboard();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const sortedDashboards = [...dashboards].sort((a, b) => {
    return b.createdAt - a.createdAt;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      createNewDashboard(newBoardName.trim());
      setNewBoardName('');
      setIsCreating(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] p-6 pointer-events-none flex items-start justify-between">
        {/* Left: User Profile / Menu Trigger */}
        <div className="pointer-events-auto">
          <button
            onClick={onMenuOpen}
            className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md text-white p-2 pr-6 rounded-full shadow-2xl border border-white/10 hover:bg-slate-700/90 transition-all group"
          >
            <div className="p-2 bg-slate-700 rounded-full group-hover:bg-slate-600 transition-colors">
              <Menu className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold leading-none">
                {user?.displayName ?? 'Guest User'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">
                {user?.email ?? 'Classroom'}
              </span>
            </div>
          </button>
        </div>

        {/* Center: Board Switcher */}
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[50vw]">
          <div className="flex items-center bg-slate-800/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-white/10 overflow-hidden">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-wider">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Favorites</span>
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <div
              ref={scrollContainerRef}
              className="flex items-center gap-1 overflow-x-auto max-w-[400px] no-scrollbar px-1"
            >
              {sortedDashboards.map((board) => {
                const isActive = activeDashboard?.id === board.id;
                return (
                  <button
                    key={board.id}
                    onClick={() => loadDashboard(board.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-brand-blue-primary text-white shadow-lg shadow-brand-blue-primary/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {board.name}
                  </button>
                );
              })}
            </div>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button
              onClick={() => setIsCreating(true)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Create New Board"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: Notifications */}
        <div className="pointer-events-auto">
          <button className="p-3 bg-slate-800/90 backdrop-blur-md text-slate-400 hover:text-white rounded-full shadow-2xl border border-white/10 hover:bg-slate-700/90 transition-all">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Create Dashboard Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                New Dashboard
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Dashboard Name"
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-brand-blue-primary focus:border-brand-blue-primary transition-all"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newBoardName.trim()}
                  className="px-4 py-2 text-sm font-bold text-white bg-brand-blue-primary hover:bg-brand-blue-dark rounded-xl transition-colors shadow-lg shadow-brand-blue-primary/30 disabled:opacity-50 disabled:shadow-none"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
