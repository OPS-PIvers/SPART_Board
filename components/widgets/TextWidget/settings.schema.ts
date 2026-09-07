import React from 'react';
import type { TextConfig } from '@/types';
import { defineSettings } from '@/components/settings/schema/defineSettings';
import { TemplateGrid } from './TemplateGrid';

export default defineSettings<TextConfig>({
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
