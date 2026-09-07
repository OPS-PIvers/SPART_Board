import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WidgetData } from '@/types';
import type {
  FieldCtx,
  UpdateConfig,
  NumberField as NumberFieldType,
} from '../../schema/types';
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

const field: NumberFieldType<string> = {
  type: 'number',
  key: 'count',
  label: 'Count',
  min: 0,
  max: 10,
  step: 1,
};

describe('NumberField', () => {
  it('renders the current value and honours min/max/step', () => {
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx({ count: 5 })}
        updateConfig={vi.fn()}
      />
    );
    const input = screen.getByRole('spinbutton', { name: 'Count' });
    expect(input).toHaveValue(5);
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('step', '1');
  });

  it('calls onChange with a number', () => {
    const updateConfig = vi.fn() as UpdateConfig;
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx({ count: 5 })}
        updateConfig={updateConfig}
      />
    );
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '7' },
    });
    expect(updateConfig).toHaveBeenCalledWith({ count: 7 });
  });

  it('guards against NaN and does not call onChange', () => {
    const updateConfig = vi.fn() as UpdateConfig;
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx({ count: 5 })}
        updateConfig={updateConfig}
      />
    );
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: 'abc' },
    });
    expect(updateConfig).not.toHaveBeenCalled();
  });

  it('clamps a value above max to field.max', () => {
    const clampedField: NumberFieldType<string> = {
      ...field,
      min: 5,
      max: 60,
    };
    const updateConfig = vi.fn() as UpdateConfig;
    render(
      <FieldRenderer
        field={clampedField}
        widget={widget}
        ctx={makeCtx({ count: 20 })}
        updateConfig={updateConfig}
      />
    );
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '9999' },
    });
    expect(updateConfig).toHaveBeenCalledWith({ count: 60 });
  });

  it('clamps a value below min to field.min', () => {
    const clampedField: NumberFieldType<string> = {
      ...field,
      min: 5,
      max: 60,
    };
    const updateConfig = vi.fn() as UpdateConfig;
    render(
      <FieldRenderer
        field={clampedField}
        widget={widget}
        ctx={makeCtx({ count: 20 })}
        updateConfig={updateConfig}
      />
    );
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '-3' },
    });
    expect(updateConfig).toHaveBeenCalledWith({ count: 5 });
  });

  it('keeps the previous value on blur when the draft is empty', () => {
    const updateConfig = vi.fn() as UpdateConfig;
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx({ count: 5 })}
        updateConfig={updateConfig}
      />
    );
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(5);
  });

  it('honours disabled', () => {
    const disabledField: NumberFieldType<string> = {
      ...field,
      disabledWhen: () => true,
    };
    render(
      <FieldRenderer
        field={disabledField}
        widget={widget}
        ctx={makeCtx({ count: 5 })}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });
});
