import React from 'react';
import type { TimeToolConfig } from '@/types';
import { defineSettings } from '@/components/settings/schema/defineSettings';
import type {
  CustomRenderCtx,
  FieldCtx,
} from '@/components/settings/schema/types';
import { TIME_TOOL_SOUNDS } from '@/config/timeTool';
import { playTimerAlert, resumeAudio } from '@/utils/timeToolAudio';
import {
  TimeToolModeField,
  TimeToolNexusHints,
  TimeToolTrafficColorField,
  TimeToolVoiceLevelField,
} from './settingsFields';

const renderMode = (ctx: CustomRenderCtx) =>
  React.createElement(TimeToolModeField, { ctx });

const renderVoiceLevel = (ctx: CustomRenderCtx) =>
  React.createElement(TimeToolVoiceLevelField, { ctx });

const renderTrafficColor = (ctx: CustomRenderCtx) =>
  React.createElement(TimeToolTrafficColorField, { ctx });

const renderNexusHints = (ctx: CustomRenderCtx) =>
  React.createElement(TimeToolNexusHints, { ctx });

// Same synthesis the timer plays at zero; the context must be resumed from the click first.
export const previewTimerSound = (sound: string) => {
  void resumeAudio().then(() => playTimerAlert(sound));
};

const isTimerMode = (ctx: FieldCtx) => ctx.config.mode === 'timer';

export default defineSettings<TimeToolConfig>({
  groups: [
    {
      id: 'content',
      fields: [
        // schema-gap: segmentedWithReset
        {
          type: 'custom',
          key: 'mode',
          label: 'mode',
          render: renderMode,
        },
        {
          type: 'soundPicker',
          key: 'selectedSound',
          label: 'selectedSound',
          options: TIME_TOOL_SOUNDS.map((sound) => ({
            value: sound,
            label: `sound${sound}`,
          })),
          preview: previewTimerSound,
        },
      ],
    },
    {
      id: 'behavior',
      fields: [
        {
          type: 'number',
          key: 'adjustStepSeconds',
          label: 'adjustStepSeconds',
          help: 'adjustStepHint',
          min: 5,
          max: 60,
          step: 5,
          visibleWhen: isTimerMode,
        },
        // schema-gap: boardAwareHint
        {
          type: 'custom',
          key: 'startTime',
          label: 'connectedWidgets',
          render: renderNexusHints,
        },
        // schema-gap: segmentedNullable
        {
          type: 'custom',
          key: 'timerEndVoiceLevel',
          label: 'timerEndVoiceLevel',
          render: renderVoiceLevel,
        },
        // schema-gap: segmentedNullable
        {
          type: 'custom',
          key: 'timerEndTrafficColor',
          label: 'timerEndTrafficColor',
          render: renderTrafficColor,
        },
        {
          type: 'toggle',
          key: 'timerEndTriggerRandom',
          label: 'timerEndTriggerRandom',
          help: 'timerEndTriggerRandomHelp',
        },
        {
          type: 'toggle',
          key: 'timerEndTriggerNextUp',
          label: 'timerEndTriggerNextUp',
          help: 'timerEndTriggerNextUpHelp',
        },
        {
          type: 'toggle',
          key: 'timerEndTriggerStationsRotate',
          label: 'timerEndTriggerStationsRotate',
          help: 'timerEndTriggerStationsRotateHelp',
        },
      ],
    },
    {
      id: 'display',
      fields: [
        {
          type: 'segmented',
          key: 'visualType',
          label: 'visualType',
          options: [
            { value: 'digital', label: 'digital' },
            { value: 'visual', label: 'visualRing' },
          ],
        },
        {
          type: 'segmented',
          key: 'clockStyle',
          label: 'clockStyle',
          options: [
            { value: 'modern', label: 'styleDefault' },
            { value: 'lcd', label: 'styleLcd' },
            { value: 'minimal', label: 'styleMinimal' },
          ],
        },
        { type: 'accentColor', key: 'themeColor', label: 'themeColor' },
        { type: 'toggle', key: 'glow', label: 'glow' },
      ],
    },
  ],
  styleKeys: ['fontFamily'],
});
