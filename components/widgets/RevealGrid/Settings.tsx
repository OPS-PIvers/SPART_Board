import React, { useState } from 'react';
import { useDashboard } from '@/context/useDashboard';
import {
  WidgetData,
  RevealGridConfig,
  RevealCard,
  GlobalFontFamily,
} from '@/types';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { SettingsLabel } from '@/components/common/SettingsLabel';

export const RevealGridSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as RevealGridConfig;
  const cards = config.cards ?? [];
  const columns = config.columns ?? 3;

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateCards = (updated: RevealCard[]) => {
    updateWidget(widget.id, { config: { ...config, cards: updated } });
  };

  const addCard = () => {
    const newCard: RevealCard = {
      id: crypto.randomUUID(),
      frontContent: '',
      backContent: '',
      isRevealed: false,
    };
    const updated = [...cards, newCard];
    updateCards(updated);
    setExpandedId(newCard.id);
  };

  const deleteCard = (id: string) => {
    updateCards(cards.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateCardField = (
    id: string,
    field: 'frontContent' | 'backContent',
    value: string
  ) => {
    updateCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  return (
    <div className="space-y-6">
      {/* Columns */}
      <div>
        <SettingsLabel>Columns</SettingsLabel>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {([2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, columns: n },
                })
              }
              className={`flex-1 py-1.5 text-xxs font-black rounded-lg transition-all ${
                columns === n
                  ? 'bg-white shadow-sm text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Reveal Mode */}
      <div>
        <SettingsLabel>Reveal Mode</SettingsLabel>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['flip', 'fade'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, revealMode: mode },
                })
              }
              className={`flex-1 py-1.5 text-xxs font-black uppercase rounded-lg transition-all ${
                (config.revealMode ?? 'flip') === mode
                  ? 'bg-white shadow-sm text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        <SettingsLabel>Cards ({cards.length})</SettingsLabel>

        {cards.map((card, i) => (
          <div
            key={card.id}
            className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="text-xxxs font-black text-slate-400 uppercase w-5 shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-xxs text-slate-700 truncate">
                {card.frontContent || (
                  <span className="italic text-slate-400">Empty card</span>
                )}
              </span>
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === card.id ? null : card.id)
                }
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {expandedId === card.id ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              <button
                type="button"
                onClick={() => deleteCard(card.id)}
                className="text-slate-300 hover:text-red-500 p-1 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {expandedId === card.id && (
              <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2 animate-in fade-in slide-in-from-top-1">
                <div>
                  <label className="text-xxxs font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Front (Question / Term)
                  </label>
                  <input
                    type="text"
                    value={card.frontContent}
                    onChange={(e) =>
                      updateCardField(card.id, 'frontContent', e.target.value)
                    }
                    placeholder="e.g. Photosynthesis"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xxxs font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Back (Answer / Definition)
                  </label>
                  <input
                    type="text"
                    value={card.backContent}
                    onChange={(e) =>
                      updateCardField(card.id, 'backContent', e.target.value)
                    }
                    placeholder="e.g. Converting sunlight to energy"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addCard}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-xxs uppercase"
        >
          <Plus className="w-4 h-4" /> Add Card
        </button>
      </div>
    </div>
  );
};

export const RevealGridAppearanceSettings: React.FC<{
  widget: WidgetData;
}> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as RevealGridConfig;

  return (
    <div className="space-y-6">
      {/* Font Family */}
      <div>
        <SettingsLabel>Font Family</SettingsLabel>
        <select
          value={config.fontFamily ?? 'global'}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: {
                ...config,
                fontFamily:
                  e.target.value === 'global'
                    ? undefined
                    : (e.target.value as GlobalFontFamily),
              },
            })
          }
          className="w-full p-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="global">Use Dashboard Default</option>
          <option value="sans">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
          <option value="comic">Comic</option>
          <option value="handwritten">Handwritten</option>
          <option value="rounded">Rounded</option>
          <option value="fun">Fun</option>
          <option value="slab">Slab</option>
          <option value="retro">Retro</option>
          <option value="marker">Marker</option>
        </select>
      </div>

      {/* Default Card Color */}
      <div>
        <SettingsLabel>Default Card Color</SettingsLabel>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">
              Applied to all new cards (per-card colors override this)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {config.defaultCardColor ?? '#dbeafe'}
            </span>
          </div>
          <input
            type="color"
            value={config.defaultCardColor ?? '#dbeafe'}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, defaultCardColor: e.target.value },
              })
            }
            className="w-full h-8 rounded cursor-pointer border border-slate-200"
          />
        </div>
      </div>
    </div>
  );
};
