import React from 'react';
import {
  SchemaDrivenConfigurationPanel,
  ConfigSchema,
} from './SchemaDrivenConfigurationPanel';

const RECORD_SCHEMA: ConfigSchema = {
  maxDurationMinutes: {
    type: 'number',
    label: 'Max Duration (Minutes)',
    description: 'Maximum allowed duration for screen recordings.',
    default: 15,
  },
  maxResolution: {
    type: 'string',
    label: 'Max Resolution Cap',
    description: 'Maximum resolution string (e.g. 1080p, 720p).',
    default: '1080p',
  },
};

interface RecordConfigurationPanelProps {
  config: Record<string, unknown>;
  onChange: (newConfig: Record<string, unknown>) => void;
}

export const RecordConfigurationPanel: React.FC<
  RecordConfigurationPanelProps
> = ({ config, onChange }) => {
  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">
        Record Configuration
      </h3>
      <SchemaDrivenConfigurationPanel
        schema={RECORD_SCHEMA}
        config={config}
        onChange={onChange}
      />
    </div>
  );
};
