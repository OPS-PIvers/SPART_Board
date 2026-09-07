import React from 'react';
import type { TimeToolConfig, WidgetType } from '@/types';
import { useDashboard } from '@/context/useDashboard';
import { handleRadioGroupKeyDown } from '@/components/common/radioGroupKeyNav';
import { resolveLabel } from '@/components/settings/renderer/resolveLabel';
import type { CustomRenderCtx } from '@/components/settings/schema/types';
import { TIME_TOOL_MODES, type TimeToolMode } from '@/config/timeTool';

export type CustomFieldProps = { ctx: CustomRenderCtx };

type RadioOption<V> = { value: V; label: string };

type RadioGroupProps<V> = {
  id?: string;
  labelId?: string;
  name: string;
  options: ReadonlyArray<RadioOption<V>>;
  value: V;
  onSelect: (value: V) => void;
  selectedClass?: (value: V) => string;
  disabled?: boolean;
};

// Segmented-style radiogroup for Custom fields; labelId (from FieldRenderer) names it, falling back to aria-label only when no labelId arrives.
function TimeToolRadioGroup<V extends string | number | null>({
  id,
  labelId,
  name,
  options,
  value,
  onSelect,
  selectedClass,
  disabled = false,
}: RadioGroupProps<V>) {
  const values = options.map((option) => option.value);
  const selectedIndex = values.indexOf(value);
  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-label={labelId ? undefined : name}
      aria-disabled={disabled || undefined}
      onKeyDown={(e) => {
        if (disabled) return;
        handleRadioGroupKeyDown(e, values, onSelect);
      }}
      className="flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const tabbable = selected || (selectedIndex < 0 && index === 0);
        const activeClass = selectedClass
          ? selectedClass(option.value)
          : 'bg-white text-slate-900 shadow-sm font-semibold';
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={tabbable ? 0 : -1}
            disabled={disabled}
            onClick={() => onSelect(option.value)}
            className={`flex-1 flex items-center justify-center text-xs px-2 py-1.5 rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue-primary disabled:opacity-50 disabled:cursor-not-allowed ${
              selected ? activeClass : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const leafResolver = (ctx: CustomRenderCtx) => {
  const type: WidgetType = ctx.widget.type;
  return (leaf: string) => resolveLabel(ctx.t, type, leaf);
};

const MODE_LABEL_LEAF: Record<TimeToolMode, string> = {
  timer: 'modeTimer',
  stopwatch: 'modeStopwatch',
};

// Mode switch that also resets the runtime keys, exactly like the legacy panel's selectMode.
export const TimeToolModeField: React.FC<CustomFieldProps> = ({ ctx }) => {
  const leaf = leafResolver(ctx);
  const config = ctx.config as Partial<TimeToolConfig>;
  const mode = config.mode ?? 'timer';
  const select = (next: TimeToolMode) => {
    if (next === mode) return;
    if (next === 'timer') {
      ctx.updateConfig({
        mode: 'timer',
        duration: 600,
        elapsedTime: 600,
        isRunning: false,
        startTime: null,
      });
    } else {
      ctx.updateConfig({
        mode: 'stopwatch',
        elapsedTime: 0,
        isRunning: false,
        startTime: null,
      });
    }
  };
  return (
    <TimeToolRadioGroup
      id={ctx.id}
      labelId={ctx.labelId}
      name={leaf('mode')}
      options={TIME_TOOL_MODES.map((m) => ({
        value: m,
        label: leaf(MODE_LABEL_LEAF[m]),
      }))}
      value={mode}
      onSelect={select}
    />
  );
};

const VOICE_LEVELS: ReadonlyArray<number> = [0, 1, 2, 3, 4];

const TIP_CLASS =
  'text-xxs text-brand-blue-dark bg-brand-blue-lighter/20 border border-brand-blue-lighter/30 rounded-lg px-2.5 py-2 leading-snug';

// "None" writes null; the front face treats null and absent alike.
// Disabled (with an inline tip) when no Expectations widget is on the board, matching the legacy panel's gate.
export const TimeToolVoiceLevelField: React.FC<CustomFieldProps> = ({
  ctx,
}) => {
  const leaf = leafResolver(ctx);
  const config = ctx.config as Partial<TimeToolConfig>;
  const value = config.timerEndVoiceLevel ?? null;
  const { activeDashboard } = useDashboard();
  const hasExpectations = !!activeDashboard?.widgets.some(
    (w) => w.type === 'expectations'
  );
  return (
    <div className="flex flex-col gap-1.5">
      <TimeToolRadioGroup<number | null>
        id={ctx.id}
        labelId={ctx.labelId}
        name={leaf('timerEndVoiceLevel')}
        options={[
          { value: null, label: leaf('none') },
          ...VOICE_LEVELS.map((level) => ({
            value: level,
            label: `${leaf('level')} ${level}`,
          })),
        ]}
        value={value}
        onSelect={(level) => ctx.updateConfig({ timerEndVoiceLevel: level })}
        disabled={!hasExpectations}
      />
      {!hasExpectations && (
        <p className={TIP_CLASS}>{leaf('addExpectationsTip')}</p>
      )}
    </div>
  );
};

type TrafficColor = NonNullable<TimeToolConfig['timerEndTrafficColor']>;

const TRAFFIC_OPTIONS: ReadonlyArray<{ value: TrafficColor; leaf: string }> = [
  { value: 'red', leaf: 'trafficStop' },
  { value: 'yellow', leaf: 'trafficSlow' },
  { value: 'green', leaf: 'trafficGo' },
];

const trafficSelectedClass = (color: TrafficColor | null) => {
  switch (color) {
    case 'red':
      return 'bg-red-500 text-white font-semibold shadow-sm';
    case 'yellow':
      return 'bg-yellow-300 text-yellow-900 font-semibold shadow-sm';
    case 'green':
      return 'bg-green-500 text-white font-semibold shadow-sm';
    default:
      return 'bg-white text-slate-900 shadow-sm font-semibold';
  }
};

// Disabled (with an inline tip) when no Traffic Light widget is on the board, matching the legacy panel's gate.
export const TimeToolTrafficColorField: React.FC<CustomFieldProps> = ({
  ctx,
}) => {
  const leaf = leafResolver(ctx);
  const config = ctx.config as Partial<TimeToolConfig>;
  const value = config.timerEndTrafficColor ?? null;
  const { activeDashboard } = useDashboard();
  const hasTrafficLight = !!activeDashboard?.widgets.some(
    (w) => w.type === 'traffic'
  );
  return (
    <div className="flex flex-col gap-1.5">
      <TimeToolRadioGroup<TrafficColor | null>
        id={ctx.id}
        labelId={ctx.labelId}
        name={leaf('timerEndTrafficColor')}
        options={[
          { value: null, label: leaf('none') },
          ...TRAFFIC_OPTIONS.map((option) => ({
            value: option.value,
            label: leaf(option.leaf),
          })),
        ]}
        value={value}
        onSelect={(color) => ctx.updateConfig({ timerEndTrafficColor: color })}
        selectedClass={trafficSelectedClass}
        disabled={!hasTrafficLight}
      />
      {!hasTrafficLight && (
        <p className={TIP_CLASS}>{leaf('addTrafficLightTip')}</p>
      )}
    </div>
  );
};

const NEXUS_SIBLINGS: ReadonlyArray<{ type: WidgetType; tipLeaf: string }> = [
  { type: 'expectations', tipLeaf: 'addExpectationsTip' },
  { type: 'traffic', tipLeaf: 'addTrafficLightTip' },
  { type: 'random', tipLeaf: 'addRandomizerTip' },
  { type: 'stations', tipLeaf: 'addStationsTip' },
  { type: 'nextUp', tipLeaf: 'addNextUpTip' },
];

// Board-aware tips: one callout per timer-end partner widget missing from the active board.
export const TimeToolNexusHints: React.FC<CustomFieldProps> = ({ ctx }) => {
  const leaf = leafResolver(ctx);
  const { activeDashboard } = useDashboard();
  const present = new Set(activeDashboard?.widgets.map((w) => w.type) ?? []);
  const missing = NEXUS_SIBLINGS.filter((s) => !present.has(s.type));
  if (missing.length === 0) {
    return (
      <p id={ctx.id} className="text-xxs text-slate-600">
        {leaf('allConnected')}
      </p>
    );
  }
  return (
    <ul
      id={ctx.id}
      className="flex flex-col gap-1.5"
      data-testid="time-tool-nexus-hints"
    >
      {missing.map((sibling) => (
        <li key={sibling.type} className={TIP_CLASS}>
          {leaf(sibling.tipLeaf)}
        </li>
      ))}
    </ul>
  );
};
