import React, { useState } from 'react';
import { Wifi, Snowflake, X } from 'lucide-react';
import { LiveStudent } from '../../types';

interface LiveControlProps {
  isLive: boolean;
  studentCount: number;
  students: LiveStudent[];
  code?: string;
  joinUrl?: string;
  onToggleLive: () => void;
  onFreezeStudent: (id: string, status: 'active' | 'frozen') => void;
  onFreezeAll: () => void;
}

export const LiveControl: React.FC<LiveControlProps> = ({
  isLive,
  studentCount,
  students,
  code,
  joinUrl,
  onToggleLive,
  onFreezeStudent,
  onFreezeAll,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-2 relative z-50">
      {/* GO LIVE BUTTON */}
      <button
        onClick={onToggleLive}
        aria-label={isLive ? 'End live session' : 'Start live session'}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
          ${
            isLive
              ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
              : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
          }
        `}
      >
        <Wifi size={12} /> {isLive ? 'LIVE' : 'GO LIVE'}
      </button>

      {/* STUDENT COUNT BADGE */}
      {isLive && (
        <button
          onClick={() => setShowMenu(!showMenu)}
          aria-label={`View ${studentCount} connected student${studentCount !== 1 ? 's' : ''}`}
          className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <span className="text-[10px] font-bold">{studentCount}</span>
        </button>
      )}

      {/* POPOUT MENU */}
      {showMenu && isLive && (
        <div className="absolute top-8 right-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Classroom ({studentCount})
            </span>
            <button onClick={() => setShowMenu(false)} aria-label="Close menu">
              <X size={14} className="text-slate-400 hover:text-slate-600" />
            </button>
          </div>

          {/* SESSION INFO */}
          {code && (
            <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex flex-col items-center gap-1">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Join Code
              </div>
              <div className="text-2xl font-black text-indigo-600 font-mono tracking-widest">
                {code}
              </div>
              <div className="text-[10px] text-indigo-400">
                {joinUrl?.replace(/^https?:\/\//, '')}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto p-1">
            {students.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                Waiting for students to join...
              </div>
            )}
            {students.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-blue-400'}`}
                  ></div>
                  <span
                    className={`text-xs font-medium truncate max-w-[100px] ${s.status === 'frozen' ? 'text-blue-400 line-through' : 'text-slate-700'}`}
                  >
                    {s.name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onFreezeStudent(s.id, s.status)}
                    className={`p-1 rounded hover:bg-blue-50 ${s.status === 'frozen' ? 'text-blue-600' : 'text-slate-300 hover:text-blue-500'}`}
                    aria-label={
                      s.status === 'frozen'
                        ? `Unfreeze ${s.name}`
                        : `Freeze ${s.name}`
                    }
                  >
                    <Snowflake size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <button
              onClick={onFreezeAll}
              aria-label="Toggle freeze for all students"
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase hover:bg-blue-200 transition-colors"
            >
              <Snowflake size={12} /> Freeze / Unfreeze All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
