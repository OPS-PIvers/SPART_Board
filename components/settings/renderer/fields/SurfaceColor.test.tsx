import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldRenderer } from '../FieldRenderer';
import type { SurfaceColorField } from '../../schema/types';
import type { WidgetData } from '@/types';
import { makeCtx, widget } from './testUtils';

const updateWidget =
  vi.fn<(id: string, updates: Partial<WidgetData>) => void>();
vi.mock('@/context/useDashboard', () => ({
  useDashboard: () => ({ updateWidget }),
}));

const field: SurfaceColorField<string> = {
  type: 'surfaceColor',
  key: 'cardColor',
  label: 'label',
};

describe('SurfaceColor field', () => {
  beforeEach(() => {
    updateWidget.mockClear();
  });

  it('renders the current color and opacity', () => {
    const ctx = makeCtx({ cardColor: '#ffffff', cardOpacity: 0.5 });
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={ctx}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByRole('radio', { name: /White/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('writes color changes through onChange (field.key)', () => {
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
    screen.getByRole('radio', { name: /Slate/i }).click();
    expect(updateConfig).toHaveBeenCalledWith({ cardColor: '#f8fafc' });
    expect(updateWidget).not.toHaveBeenCalled();
  });

  it('writes opacity changes to the resolved opacityKey via updateWidget', () => {
    const ctx = makeCtx({ cardColor: '#ffffff', cardOpacity: 1 });
    render(
      <FieldRenderer
        field={field}
        widget={widget}
        ctx={ctx}
        updateConfig={vi.fn()}
      />
    );
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.25' } });
    expect(updateWidget).toHaveBeenCalledTimes(1);
    const [calledId, calledUpdates] = updateWidget.mock.calls[0];
    expect(calledId).toBe('w1');
    expect(calledUpdates.config).toMatchObject({ cardOpacity: 0.25 });
  });

  it('uses a custom opacityKey when provided', () => {
    const custom: SurfaceColorField<string> = {
      ...field,
      opacityKey: 'surfaceOpacity',
    };
    const ctx = makeCtx({ cardColor: '#ffffff', surfaceOpacity: 0.75 });
    render(
      <FieldRenderer
        field={custom}
        widget={widget}
        ctx={ctx}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('honours disabled', () => {
    const field2: SurfaceColorField<string> = {
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
    expect(screen.getByRole('slider')).toBeDisabled();
  });
});
