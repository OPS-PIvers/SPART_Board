import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FieldRenderer } from '../FieldRenderer';
import type { TextSizePresetField } from '../../schema/types';
import { makeCtx, widget } from './testUtils';

const field: TextSizePresetField<string> = {
  type: 'textSizePreset',
  key: 'textSizePreset',
  label: 'label',
};

describe('TextSizePreset field', () => {
  it('renders a radiogroup with the current preset selected', () => {
    const ctx = makeCtx({ textSizePreset: 'large' });
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={ctx}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByRole('radio', { name: /^Large$/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('calls updateConfig with the field key on selection', () => {
    const ctx = makeCtx({});
    const updateConfig = vi.fn();
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={ctx}
        updateConfig={updateConfig}
      />
    );
    screen.getByRole('radio', { name: /X-Large/i }).click();
    expect(updateConfig).toHaveBeenCalledWith({ textSizePreset: 'x-large' });
  });

  it('honours disabled', () => {
    const field2: TextSizePresetField<string> = {
      ...field,
      disabledWhen: () => true,
    };
    const ctx = makeCtx({});
    render(
      <FieldRenderer
        field={field2}
        widget={widget}
        ctx={ctx}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByRole('radio', { name: /Medium/i })).toBeDisabled();
  });
});
