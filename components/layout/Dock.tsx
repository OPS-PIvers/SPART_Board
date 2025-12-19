
import React, { useState } from 'react';
import { 
  Clock, Timer, TrafficCone, Type, CheckSquare, 
  Users, Dices, Mic, Pencil, QrCode, Globe, BarChart2, Video,
  Trophy, AlertCircle, CloudSun, Calendar, LayoutGrid, ChevronDown, TimerReset
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetType } from '../../types';

const TOOLS: { type: WidgetType; icon: any; label: string; color: string }[] = [
  { type: 'clock', icon: Clock, label: 'Clock', color: 'bg-blue-500' },
  { type: 'timer', icon: Timer, label: 'Timer', color: 'bg-red-500' },
  { type: 'stopwatch', icon: TimerReset, label: 'Stop', color: 'bg-orange-600' },
  { type: 'traffic', icon: TrafficCone, label: 'Traffic', color: 'bg-amber-500' },
  { type: 'text', icon: Type, label: 'Note', color: 'bg-yellow-400' },
  { type: 'checklist', icon: CheckSquare, label: 'Tasks', color: 'bg-green-500' },
  { type: 'random', icon: Users, label: 'Random', color: 'bg-indigo-500' },
  { type: 'dice', icon: Dices, label: 'Dice', color: 'bg-purple-500' },
  { type: 'sound', icon: Mic, label: 'Noise', color: 'bg-pink-500' },
  { type: 'drawing', icon: Pencil, label: 'Draw', color: 'bg-cyan-500' },
  { type: 'qr', icon: QrCode, label: 'QR', color: 'bg-slate-700' },
  { type: 'embed', icon: Globe, label: 'Embed', color: 'bg-sky-600' },
  { type: 'poll', icon: BarChart2, label: 'Poll', color: 'bg-orange-500' },
  { type: 'webcam', icon: Video, label: 'Camera', color: 'bg-gray-800' },
  { type: 'scoreboard', icon: Trophy, label: 'Scores', color: 'bg-yellow-600' },
  { type: 'workSymbols', icon: AlertCircle, label: 'Expects', color: 'bg-emerald-600' },
  { type: 'weather', icon: CloudSun, label: 'Weather', color: 'bg-sky-400' },
  { type: 'schedule', icon: Calendar, label: 'Schedule', color: 'bg-teal-600' },
  { type: 'calendar', icon: Calendar, label: 'Events', color: 'bg-rose-500' },
];

export const Dock: React.FC = () => {
  const { addWidget } = useDashboard();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center">
      <div className="relative group/dock">
        {isExpanded ? (
          <>
            {/* The "little arrow" to minimize the toolbar */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 p-2 bg-white/80 backdrop-blur shadow-xl rounded-full text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover/dock:opacity-100 hover:scale-110 active:scale-90"
              title="Minimize Toolbar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Expanded Toolbar with hover-to-reveal titles */}
            <div className="bg-white/80 backdrop-blur-2xl px-4 py-3 rounded-[2rem] shadow-2xl border border-white/50 flex items-center gap-1.5 md:gap-3 max-w-[95vw] overflow-x-auto no-scrollbar animate-in zoom-in-95 fade-in duration-300">
              {TOOLS.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => addWidget(tool.type)}
                  className="group flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90"
                >
                  <div className={`${tool.color} p-2 md:p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-all duration-200`}>
                    <tool.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter opacity-0 group-hover/dock:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Compressed down to a single icon */
          <button
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:scale-110 active:scale-90 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] animate-in fade-in zoom-in duration-300"
            title="Open Tools"
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
