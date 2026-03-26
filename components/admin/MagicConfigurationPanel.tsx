import React from 'react';
import {
  SchemaDrivenConfigurationPanel,
  ConfigSchema,
} from './SchemaDrivenConfigurationPanel';

const MAGIC_SCHEMA: ConfigSchema = {
  dailyRateLimit: {
    type: 'number',
    label: 'Daily AI Rate Limit',
    description: 'Maximum number of requests per user per day.',
    default: 100,
  },
  promptSuggestions: {
    type: 'stringArray',
    label: 'Default Prompt Suggestions',
    description: 'One suggestion per line. These will appear for all users.',
    default: [
      'Create a reading comprehension quiz about the solar system',
      'Generate 5 math word problems for 3rd grade',
      'Write a lesson plan for introduction to fractions',
    ],
  },
};

interface MagicConfigurationPanelProps {
  config: Record<string, unknown>;
  onChange: (newConfig: Record<string, unknown>) => void;
}

export const MagicConfigurationPanel: React.FC<
  MagicConfigurationPanelProps
> = ({ config, onChange }) => {
  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">
        Magic (AI) Configuration
      </h3>
      <SchemaDrivenConfigurationPanel
        schema={MAGIC_SCHEMA}
        config={config}
        onChange={onChange}
      />
    </div>
  );
};
