
import React from 'react';
import { 
  Clock, Timer, TrafficCone, Type, CheckSquare, 
  Users, Dices, Mic, Pencil, QrCode, Globe, BarChart2, Video
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetType } from '../../types';

const TOOLS: { type: WidgetType; icon: any; label: string; color: string }[] = [
  { type: 'clock', icon: Clock, label: 'Clock', color: 'bg-blue-500' },
  { type: 'timer', icon: Timer, label: 'Timer', color: 'bg-red-500' },
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
];

export const Dock: React.FC = () => {
  const { addWidget } = useDashboard();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
      <div className="bg-white/80 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl border border-white/50 flex items-center gap-1.5 md:gap-3 max-w-[95vw] overflow-x-auto no-scrollbar">
        {TOOLS.map((tool) => (
          <button
            key={tool.type}
            onClick={() => addWidget(tool.type)}
            className="group flex flex-col items-center gap-1 min-w-[50px]"
          >
            <div className={`${tool.color} p-2 md:p-3 rounded-xl text-white shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-200`}>
              <tool.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
              {tool.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
