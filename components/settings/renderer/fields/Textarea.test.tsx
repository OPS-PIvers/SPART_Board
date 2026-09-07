import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WidgetData } from '@/types';
import type {
  FieldCtx,
  UpdateConfig,
  TextareaField as TextareaFieldType,
} from '@/components/settings/schema/types';
import { FieldRenderer } from '../FieldRenderer';

const t = (key: string, options?: Record<string, unknown>): string =>
  typeof options?.defaultValue === 'string' ? options.defaultValue : key;

const widget = {
  id: 'w1',
  type: 'clock',
  x: 0,
  y: 0,
  w: 200,
  h: 200,
  z: 1,
} as WidgetData;

function makeCtx(config: Record<string, unknown>): FieldCtx {
  return { config, widget, isAdmin: false, canAccessFeature: () => true, t };
}

const field: TextareaFieldType<string> = {
  type: 'textarea',
  key: 'notes',
  label: 'Notes',
  rows: 4,
};

describe('TextareaField', () => {
  it('renders the current value with an accessible label', () => {
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx({ notes: 'Hi there' })}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue(
      'Hi there'
    );
  });

  it('falls back to an empty string when value is missing', () => {
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx({})}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('calls onChange with the typed string', () => {
    const updateConfig = vi.fn() as UpdateConfig;
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx({ notes: '' })}
        updateConfig={updateConfig}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Updated' },
    });
    expect(updateConfig).toHaveBeenCalledWith({ notes: 'Updated' });
  });

  it('honours disabled', () => {
    const disabledField: TextareaFieldType<string> = {
      ...field,
      disabledWhen: () => true,
    };
    render(
      <FieldRenderer
        field={disabledField}
        widget={widget}
        ctx={makeCtx({ notes: '' })}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
