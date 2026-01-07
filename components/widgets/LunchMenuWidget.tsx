import React, { useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, LunchMenuConfig } from '../../types';
import { Utensils, ExternalLink, School } from 'lucide-react';

type SchoolId = 'IS' | 'SE';

const SCHOOLS: Record<SchoolId, { label: string; url: string }> = {
  IS: {
    label: 'Orono Intermediate (3-5)',
    url: 'https://orono.nutrislice.com/menu/orono-intermediate-school/lunch',
  },
  SE: {
    label: 'Schumann Elementary (K-2)',
    url: 'https://orono.nutrislice.com/menu/schumann-elementary/lunch',
  },
};

export const LunchMenuWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as LunchMenuConfig;
  const { menuUrl = SCHOOLS.IS.url, schoolId = 'IS' } = config;

  // Sync menuUrl with schoolId if they don't match
  useEffect(() => {
    if (schoolId && SCHOOLS[schoolId].url !== menuUrl) {
      updateWidget(widget.id, {
        config: { ...config, menuUrl: SCHOOLS[schoolId].url },
      });
    }
  }, [schoolId, menuUrl, widget.id, updateWidget, config]);

  return (
    <div className="h-full flex flex-col p-3 bg-white gap-3 select-none">
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-50 shrink-0">
        <iframe
          src={menuUrl}
          className="w-full h-full border-0"
          title="Lunch Menu"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg shadow-sm hover:bg-white text-slate-600 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export const LunchMenuSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as LunchMenuConfig;
  const { menuUrl = SCHOOLS.IS.url, schoolId = 'IS' } = config;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <School className="w-3 h-3" /> School Menu
          </label>
          <select
            value={schoolId}
            onChange={(e) => {
              const newSchoolId = e.target.value as SchoolId;
              updateWidget(widget.id, {
                config: {
                  ...config,
                  schoolId: newSchoolId,
                  menuUrl: SCHOOLS[newSchoolId].url,
                },
              });
            }}
            className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            {Object.entries(SCHOOLS).map(([id, school]) => (
              <option key={id} value={id}>
                {school.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <Utensils className="w-3 h-3" /> Custom Menu URL (Optional)
          </label>
          <input
            type="url"
            value={menuUrl}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, menuUrl: e.target.value },
              })
            }
            placeholder="https://orono.nutrislice.com/..."
            className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <h4 className="text-[10px] font-black text-blue-700 uppercase mb-2">
          Instructions
        </h4>
        <p className="text-[9px] text-blue-600 leading-normal font-medium">
          Select your school to automatically load the correct lunch menu. You
          can also manually override the URL if needed.
        </p>
      </div>
    </div>
  );
};
