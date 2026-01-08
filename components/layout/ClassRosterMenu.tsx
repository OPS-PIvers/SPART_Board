import React, { useRef, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { Star, Plus } from 'lucide-react';

interface Props {
  onClose: () => void;
  onOpenFullEditor: () => void;
}

const ClassRosterMenu: React.FC<Props> = ({ onClose, onOpenFullEditor }) => {
  const { rosters, activeRosterId, setActiveRoster } = useDashboard();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
        <span className="font-bold text-xs text-slate-500 uppercase">
          Quick Select
        </span>
        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">
          {rosters.length}
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto p-1">
        {rosters.length === 0 && (
          <div className="p-4 text-center text-slate-400 text-xs">
            No classes found.
          </div>
        )}

        {rosters.map((r) => (
          <div
            key={r.id}
            className={`flex items-center justify-between p-2 rounded hover:bg-slate-50 group ${activeRosterId === r.id ? 'bg-blue-50' : ''}`}
          >
            <div
              className="flex items-center gap-2 cursor-pointer flex-1"
              onClick={() =>
                setActiveRoster(activeRosterId === r.id ? null : r.id)
              }
            >
              <Star
                size={16}
                className={
                  activeRosterId === r.id
                    ? 'text-blue-500 fill-blue-500'
                    : 'text-slate-300 group-hover:text-blue-300 transition-colors'
                }
              />
              <span
                className={`text-sm ${activeRosterId === r.id ? 'font-semibold text-blue-700' : 'text-slate-700'}`}
              >
                {r.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t bg-slate-50">
        <button
          onClick={onOpenFullEditor}
          className="w-full bg-blue-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Open Full Editor
        </button>
      </div>

      {/* Little arrow at the bottom */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-50 border-r border-b border-slate-200 transform rotate-45"></div>
    </div>
  );
};
export default ClassRosterMenu;
