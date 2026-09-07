import type { CustomField } from '@/components/settings/schema/types';
import { defineSettings } from '@/components/settings/schema/defineSettings';
import type { EmbedConfig } from '@/types';
import { EmbedModeControl } from './EmbedModeControl';
import { EmbedVerifyControl } from './EmbedVerifyControl';

const renderModeControl: CustomField<'mode'>['render'] = (ctx) => (
  <EmbedModeControl {...ctx} />
);

const renderVerifyControl: CustomField<'isEmbeddable'>['render'] = (ctx) => (
  <EmbedVerifyControl {...ctx} />
);

const isCodeMode = (mode: unknown): boolean => mode === 'code';

const schema = defineSettings<EmbedConfig>({
  groups: [
    {
      id: 'content',
      fields: [
        {
          key: 'url',
          type: 'text',
          label: 'urlLabel',
          help: 'urlHelp',
          placeholder: 'https://example.com...',
          visibleWhen: (ctx) => !isCodeMode(ctx.config.mode),
        },
        // schema-gap: asyncVerify — see EmbedVerifyControl.tsx.
        {
          key: 'isEmbeddable',
          type: 'custom',
          label: 'verifyLabel',
          visibleWhen: (ctx) => !isCodeMode(ctx.config.mode),
          render: renderVerifyControl,
        },
        {
          key: 'html',
          type: 'textarea',
          label: 'htmlLabel',
          help: 'htmlHelp',
          placeholder:
            '<html>\n  <style>body { background: #f0f; }</style>\n  <body><h1>Hello Class!</h1></body>\n</html>',
          rows: 8,
          visibleWhen: (ctx) => isCodeMode(ctx.config.mode),
        },
      ],
    },
    {
      id: 'behavior',
      fields: [
        // schema-gap: buildingGatedSegmented — see EmbedModeControl.tsx.
        {
          key: 'mode',
          type: 'custom',
          label: 'modeLabel',
          render: renderModeControl,
        },
        {
          key: 'refreshInterval',
          type: 'select',
          label: 'refreshIntervalLabel',
          options: [
            { value: 0, label: 'Disabled' },
            { value: 1, label: 'Every 1 Minute' },
            { value: 5, label: 'Every 5 Minutes' },
            { value: 15, label: 'Every 15 Minutes' },
            { value: 30, label: 'Every 30 Minutes' },
            { value: 60, label: 'Every 1 Hour' },
          ],
        },
      ],
    },
  ],
});

export default schema;
