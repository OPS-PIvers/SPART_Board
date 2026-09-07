import React from 'react';
import type { TextConfig } from '@/types';
import { defineSettings } from '@/components/settings/schema/defineSettings';
import type { WidgetSettingsSchema } from '@/components/settings/schema/types';
import { TemplateGrid } from './TemplateGrid';

const schema = defineSettings<TextConfig>({
  groups: [
    {
      id: 'content',
      fields: [
        // schema-gap: templateApply
        {
          key: 'content',
          type: 'custom',
          label: 'templates',
          render: (ctx) => React.createElement(TemplateGrid, { ctx }),
        },
      ],
    },
  ],
  styleKeys: ['fontFamily', 'fontColor', 'textSizePreset'],
});

// Widen from the TextConfig-checked shape to the generic schema the registry/drawer consume.
export default schema as unknown as WidgetSettingsSchema;
