import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WidgetData } from '@/types';
import type { CustomField, FieldCtx, UpdateConfig } from '../../schema/types';
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

function makeCtx(config: Record<string, unknown> = {}): FieldCtx {
  return {
    config,
    widget,
    isAdmin: false,
    canAccessFeature: () => true,
    t,
  };
}

describe('Custom field', () => {
  it('calls render with ctx plus a stable updateConfig', () => {
    const seen: UpdateConfig[] = [];
    const field: CustomField<string> = {
      type: 'custom',
      key: 'thing',
      label: 'title',
      render: (ctx) => {
        seen.push(ctx.updateConfig);
        return (
          <button onClick={() => ctx.updateConfig({ thing: 'set' })}>
            do it
          </button>
        );
      },
    };
    const updateConfig = vi.fn();
    const { rerender } = render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx()}
        updateConfig={updateConfig}
      />
    );

    fireEvent.click(screen.getByText('do it'));
    expect(updateConfig).toHaveBeenCalledWith({ thing: 'set' });

    rerender(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx()}
        updateConfig={updateConfig}
      />
    );

    expect(seen.length).toBeGreaterThanOrEqual(1);
    expect(seen[0]).toBe(updateConfig);
  });

  it('renders nothing when field type is not custom', () => {
    const field = { type: 'iconPicker', key: 'a', label: 'title' } as const;
    // Picker types still route to UnsupportedField, never to Custom.
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={makeCtx()}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByTestId('unsupported-field')).toBeInTheDocument();
  });
});
