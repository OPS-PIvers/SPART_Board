import React from 'react';
import { useDashboard } from '@/context/useDashboard';
import { WidgetData, TextConfig } from '@/types';
import { sanitizeHtml } from '@/utils/security';

import { SettingsLabel } from '@/components/common/SettingsLabel';
import { TypographySettings } from '@/components/common/TypographySettings';
import { TEXT_WIDGET_COLORS, TEXT_WIDGET_TEMPLATES } from './constants';
import { Button } from '@/components/common/Button';
import { Download } from 'lucide-react';

export const TextSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, rosters, activeRosterId } = useDashboard();
  const config = widget.config as TextConfig;

  const applyTemplate = (content: string) => {
    updateWidget(widget.id, {
      config: { ...config, content: sanitizeHtml(content) } as TextConfig,
    });
  };

  const handleImportRoster = () => {
    if (!activeRosterId) return;
    const activeRoster = rosters.find(r => r.id === activeRosterId);
    if (!activeRoster || !activeRoster.students) return;

    const listHtml = `<ul>${activeRoster.students.map(s => `<li>${s.firstName} ${s.lastName}</li>`).join('')}</ul>`;
    const newContent = config.content ? `${config.content}<br>${listHtml}` : listHtml;

    updateWidget(widget.id, {
      config: { ...config, content: sanitizeHtml(newContent) } as TextConfig,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <SettingsLabel>Import Data</SettingsLabel>
        <Button
          variant="secondary"
          onClick={handleImportRoster}
          disabled={!activeRosterId || rosters.find(r => r.id === activeRosterId)?.students.length === 0}
          className="w-full flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Import Roster
        </Button>
      </div>
      <div>
        <SettingsLabel>Templates</SettingsLabel>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_WIDGET_TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => applyTemplate(t.content)}
              className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-all"
            >
              <t.icon className="w-3 h-3 text-indigo-600" />
              <span className="text-xxs  text-slate-800">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SettingsLabel>Background Color</SettingsLabel>
        <div className="flex gap-2">
          {TEXT_WIDGET_COLORS.map((c) => (
            <button
              key={c.hex}
              aria-label={`Select ${c.label} background`}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, bgColor: c.hex } as TextConfig,
                })
              }
              className={`w-8 h-8 rounded-full border-2 transition-all ${config.bgColor === c.hex ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent'}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <SettingsLabel>Font Size</SettingsLabel>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="12"
            max="48"
            value={config.fontSize}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  fontSize: parseInt(e.target.value),
                } as TextConfig,
              })
            }
            className="flex-1 accent-blue-600"
          />
          <span className="w-8 text-center font-mono  text-slate-700 text-xs">
            {config.fontSize}
          </span>
        </div>
      </div>

      <hr className="border-slate-100" />

      <TypographySettings
        config={config}
        updateConfig={(updates) =>
          updateWidget(widget.id, {
            config: { ...config, ...updates },
          })
        }
      />
    </div>
  );
};
