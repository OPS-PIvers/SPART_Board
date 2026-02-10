import React, { useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, ExpectationsConfig } from '../../types';
import {
  Volume2,
  Users,
  ArrowLeft,
  User,
  UsersRound,
  Ear,
  Heart,
  MessagesSquare,
  CheckCircle2,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';

// --- Constants & Data ---

const VOLUME_OPTIONS = [
  {
    id: 0,
    label: 'Silence',
    sub: 'Independent',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 1,
    label: 'Whisper',
    sub: 'Partner Talk',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    id: 2,
    label: 'Conversation',
    sub: 'Table Talk',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    id: 3,
    label: 'Presenter',
    sub: 'Speaking',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    id: 4,
    label: 'Outside',
    sub: 'Recess',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
];

const GROUP_OPTIONS: {
  id: ExpectationsConfig['workMode'];
  label: string;
  icon: typeof User;
  color: string;
  bg: string;
}[] = [
  {
    id: 'individual',
    label: 'Alone',
    icon: User,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    id: 'partner',
    label: 'Partner',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'group',
    label: 'Group',
    icon: UsersRound,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

const INTERACTION_OPTIONS: {
  id: ExpectationsConfig['interactionMode'];
  label: string;
  icon: typeof Heart;
  color: string;
  bg: string;
}[] = [
  {
    id: 'respectful',
    label: 'Respectful',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Ear,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 'productive',
    label: 'Productive',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 'discussion',
    label: 'Discussion',
    icon: MessagesSquare,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
];

import { WidgetLayout } from './WidgetLayout';

export const ExpectationsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ExpectationsConfig;
  const { voiceLevel = null, workMode = null, interactionMode = null } = config;

  const [activeCategory, setActiveCategory] = useState<
    'volume' | 'groups' | 'interaction' | null
  >(null);

  const updateConfig = (newConfig: Partial<ExpectationsConfig>) => {
    updateWidget(widget.id, {
      config: { ...config, ...newConfig },
    });
  };

  // --- Render Sub-views ---

  const renderSubViewHeader = (label: string) => (
    <div
      className="flex items-center shrink-0"
      style={{ padding: 'min(12px, 2.5cqmin)' }}
    >
      <button
        onClick={() => setActiveCategory(null)}
        className="hover:bg-slate-100 rounded-lg"
        style={{
          padding: 'min(4px, 0.8cqmin)',
          marginRight: 'min(8px, 1.5cqmin)',
        }}
      >
        <ArrowLeft
          style={{ width: 'min(18px, 5cqmin)', height: 'min(18px, 5cqmin)' }}
        />
      </button>
      <h3
        className="font-bold text-slate-800 uppercase tracking-tight"
        style={{ fontSize: 'min(14px, 3.5cqmin)' }}
      >
        {label}
      </h3>
    </div>
  );

  const renderVolumeView = () => (
    <WidgetLayout
      padding="p-0"
      header={renderSubViewHeader('Volume Level')}
      content={
        <div
          className="flex-1 overflow-y-auto flex flex-col custom-scrollbar w-full h-full animate-in slide-in-from-right duration-200"
          style={{ padding: 'min(12px, 2.5cqmin)', gap: 'min(8px, 1.5cqmin)' }}
        >
          {VOLUME_OPTIONS.map((v) => (
            <button
              key={v.id}
              onClick={() =>
                updateConfig({ voiceLevel: voiceLevel === v.id ? null : v.id })
              }
              className={`flex items-center rounded-xl border-2 transition-all ${
                voiceLevel === v.id
                  ? `${v.bg} border-current ${v.color} shadow-sm scale-[1.02]`
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
              style={{
                gap: 'min(16px, 3cqmin)',
                padding: 'min(12px, 2.5cqmin)',
              }}
            >
              <span
                className="font-black opacity-40"
                style={{
                  fontSize: 'min(24px, 6cqmin)',
                  width: 'min(24px, 6cqmin)',
                }}
              >
                {v.id}
              </span>
              <div className="text-left">
                <div
                  className="font-black uppercase leading-tight"
                  style={{ fontSize: 'min(14px, 3.5cqmin)' }}
                >
                  {v.label}
                </div>
                <div
                  className="font-bold opacity-60 uppercase"
                  style={{ fontSize: 'min(10px, 2.5cqmin)' }}
                >
                  {v.sub}
                </div>
              </div>
              {voiceLevel === v.id && (
                <CheckCircle2
                  className="ml-auto"
                  style={{
                    width: 'min(18px, 4.5cqmin)',
                    height: 'min(18px, 4.5cqmin)',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      }
    />
  );

  const renderGroupsView = () => (
    <WidgetLayout
      padding="p-0"
      header={renderSubViewHeader('Group Size')}
      content={
        <div
          className="flex-1 overflow-y-auto flex flex-col custom-scrollbar w-full h-full animate-in slide-in-from-right duration-200"
          style={{ padding: 'min(12px, 2.5cqmin)', gap: 'min(8px, 1.5cqmin)' }}
        >
          {GROUP_OPTIONS.map((g) => (
            <button
              key={g.id}
              onClick={() =>
                updateConfig({ workMode: workMode === g.id ? null : g.id })
              }
              className={`flex items-center rounded-xl border-2 transition-all ${
                workMode === g.id
                  ? `${g.bg} border-current ${g.color} shadow-sm scale-[1.02]`
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
              style={{ gap: 'min(16px, 3cqmin)', padding: 'min(16px, 3cqmin)' }}
            >
              <g.icon
                style={{
                  width: 'min(24px, 6cqmin)',
                  height: 'min(24px, 6cqmin)',
                }}
                strokeWidth={2.5}
              />
              <span
                className="font-black uppercase tracking-wide"
                style={{ fontSize: 'min(14px, 3.5cqmin)' }}
              >
                {g.label}
              </span>
              {workMode === g.id && (
                <CheckCircle2
                  className="ml-auto"
                  style={{
                    width: 'min(18px, 4.5cqmin)',
                    height: 'min(18px, 4.5cqmin)',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      }
    />
  );

  const renderInteractionView = () => (
    <WidgetLayout
      padding="p-0"
      header={renderSubViewHeader('Interaction')}
      content={
        <div
          className="flex-1 overflow-y-auto flex flex-col custom-scrollbar w-full h-full animate-in slide-in-from-right duration-200"
          style={{ padding: 'min(12px, 2.5cqmin)', gap: 'min(8px, 1.5cqmin)' }}
        >
          {INTERACTION_OPTIONS.map((i) => (
            <button
              key={i.id}
              onClick={() =>
                updateConfig({
                  interactionMode: interactionMode === i.id ? null : i.id,
                })
              }
              className={`flex items-center rounded-xl border-2 transition-all ${
                interactionMode === i.id
                  ? `${i.bg} border-current ${i.color} shadow-sm scale-[1.02]`
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
              style={{ gap: 'min(16px, 3cqmin)', padding: 'min(16px, 3cqmin)' }}
            >
              <i.icon
                style={{
                  width: 'min(24px, 6cqmin)',
                  height: 'min(24px, 6cqmin)',
                }}
                strokeWidth={2.5}
              />
              <span
                className="font-black uppercase tracking-wide"
                style={{ fontSize: 'min(14px, 3.5cqmin)' }}
              >
                {i.label}
              </span>
              {interactionMode === i.id && (
                <CheckCircle2
                  className="ml-auto"
                  style={{
                    width: 'min(18px, 4.5cqmin)',
                    height: 'min(18px, 4.5cqmin)',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      }
    />
  );

  // --- Main Category Picker ---

  if (activeCategory === 'volume') return renderVolumeView();
  if (activeCategory === 'groups') return renderGroupsView();
  if (activeCategory === 'interaction') return renderInteractionView();

  const selectedVolume = VOLUME_OPTIONS.find((v) => v.id === voiceLevel);
  const selectedGroup = GROUP_OPTIONS.find((g) => g.id === workMode);
  const selectedInteraction = INTERACTION_OPTIONS.find(
    (i) => i.id === interactionMode
  );

  const isElementary = config.layout === 'elementary';

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className={`h-full w-full bg-transparent p-3 gap-3 overflow-hidden animate-in fade-in duration-200 ${
            isElementary ? 'grid grid-cols-2' : 'flex flex-col'
          }`}
        >
          <button
            onClick={() => setActiveCategory('volume')}
            className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
              selectedVolume
                ? `${selectedVolume.bg} border-current ${selectedVolume.color} shadow-sm`
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
            } ${isElementary ? 'col-span-2' : ''}`}
          >
            <div
              className={`p-3 rounded-xl transition-colors ${selectedVolume ? 'bg-white' : 'bg-slate-50'}`}
              style={{
                width: 'min(15cqw, 15cqh)',
                height: 'min(15cqw, 15cqh)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Volume2
                style={{ width: '100%', height: '100%' }}
                strokeWidth={2.5}
              />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div
                className="font-black uppercase text-slate-400 leading-none mb-1 truncate"
                style={{ fontSize: 'min(3cqw, 3cqh)' }}
              >
                Volume
              </div>
              <div
                className="font-black uppercase tracking-tight truncate"
                style={{ fontSize: 'min(5cqw, 5cqh)' }}
              >
                {selectedVolume ? selectedVolume.label : 'Not Set'}
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveCategory('groups')}
            className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
              selectedGroup
                ? `${selectedGroup.bg} border-current ${selectedGroup.color} shadow-sm`
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div
              className={`p-3 rounded-xl transition-colors ${selectedGroup ? 'bg-white' : 'bg-slate-50'}`}
              style={{
                width: 'min(15cqw, 15cqh)',
                height: 'min(15cqw, 15cqh)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users
                style={{ width: '100%', height: '100%' }}
                strokeWidth={2.5}
              />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div
                className="font-black uppercase text-slate-400 leading-none mb-1 truncate"
                style={{ fontSize: 'min(3cqw, 3cqh)' }}
              >
                Group Size
              </div>
              <div
                className="font-black uppercase tracking-tight truncate"
                style={{ fontSize: 'min(5cqw, 5cqh)' }}
              >
                {selectedGroup ? selectedGroup.label : 'Not Set'}
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveCategory('interaction')}
            className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
              selectedInteraction
                ? `${selectedInteraction.bg} border-current ${selectedInteraction.color} shadow-sm`
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div
              className={`p-3 rounded-xl transition-colors ${selectedInteraction ? 'bg-white' : 'bg-slate-50'}`}
              style={{
                width: 'min(15cqw, 15cqh)',
                height: 'min(15cqw, 15cqh)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessagesSquare
                style={{ width: '100%', height: '100%' }}
                strokeWidth={2.5}
              />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div
                className="font-black uppercase text-slate-400 leading-none mb-1 truncate"
                style={{ fontSize: 'min(3cqw, 3cqh)' }}
              >
                Interaction
              </div>
              <div
                className="font-black uppercase tracking-tight truncate"
                style={{ fontSize: 'min(5cqw, 5cqh)' }}
              >
                {selectedInteraction ? selectedInteraction.label : 'Not Set'}
              </div>
            </div>
          </button>
        </div>
      }
    />
  );
};

const LAYOUTS: {
  id: 'secondary' | 'elementary';
  label: string;
  icon: typeof LayoutList;
}[] = [
  { id: 'secondary', label: 'Secondary', icon: LayoutList },
  { id: 'elementary', label: 'Elementary', icon: LayoutGrid },
];

export const ExpectationsSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ExpectationsConfig;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          Layout Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    layout: l.id,
                  },
                })
              }
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                (config.layout ?? 'secondary') === l.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
              }`}
            >
              <l.icon size={20} />
              <span className="text-xxs font-bold uppercase tracking-tight">
                {l.label}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xxxs text-slate-400 leading-relaxed">
          Secondary uses a single column list. Elementary uses a two-column
          grid.
        </p>
      </div>
    </div>
  );
};
