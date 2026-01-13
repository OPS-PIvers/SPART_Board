import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { Target, UserCog } from 'lucide-react';

interface RosterModeControlProps {
  rosterMode: 'class' | 'custom';
  onModeChange: (mode: 'class' | 'custom') => void;
}

export const RosterModeControl: React.FC<RosterModeControlProps> = ({
  rosterMode,
  onModeChange,
}) => {
  const { activeRosterId, rosters } = useDashboard();
  const activeRoster = rosters.find((r) => r.id === activeRosterId);

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
        Student Roster Source
      </label>
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => onModeChange('class')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
            rosterMode === 'class'
              ? 'bg-white text-brand-blue-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Target className="w-3 h-3" />
          Class
        </button>
        <button
          type="button"
          onClick={() => onModeChange('custom')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
            rosterMode === 'custom'
              ? 'bg-white text-brand-blue-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCog className="w-3 h-3" />
          Custom
        </button>
      </div>

      {rosterMode === 'class' && (
        <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
              {activeRoster
                ? `Active: ${activeRoster.name}`
                : 'No Active Class'}
            </span>
          </div>
          {activeRoster && (
            <span className="text-[8px] font-black text-blue-400 bg-white px-1.5 py-0.5 rounded-md border border-blue-100">
              {activeRoster.students.length} Students
            </span>
          )}
        </div>
      )}
    </div>
  );
};
