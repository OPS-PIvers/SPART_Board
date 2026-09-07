import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FieldRenderer } from '@/components/settings/renderer/FieldRenderer';
import {
  makeCtx,
  widget,
} from '@/components/settings/renderer/fields/testUtils';
import type { CustomField } from '@/components/settings/schema/types';
import { STANDARD_COLORS } from '@/config/colors';
import schema from './settings.schema';

const displayGroup = schema.groups.find((g) => g.id === 'display');
if (!displayGroup) throw new Error('clock schema is missing its display group');
const dateColorField = displayGroup.fields.find(
  (f) => f.key === 'dateColor'
) as CustomField<string>;

// dateColor's Custom render (schema-gap: accentColorNullable): falls back to
// the widget's current themeColor, dynamically, and re-clears to undefined
// via the "Match time" swatch — matching the legacy panel's behavior exactly
// (Widget.tsx: `dateColor ?? themeColor`).
describe('clock dateColor Custom field', () => {
  it('falls back to the current themeColor, not a fixed swatch', () => {
    const updateConfig = vi.fn();
    render(
      <FieldRenderer
        field={dateColorField}
        widget={widget}
        ctx={makeCtx({ themeColor: '#3b82f6' })}
        updateConfig={updateConfig}
      />
    );
    expect(
      screen.getByRole('radiogroup', { name: 'dateColor' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('dateColor hex value')).toHaveValue('#3b82f6');
    // The test `t` stub resolves an unknown leaf to itself, so the "match"
    // swatch's accessible name is the raw leaf key here, not real EN copy.
    screen.getByRole('radio', { name: 'matchTime' }).click();
    expect(updateConfig).toHaveBeenCalledWith({ dateColor: undefined });
  });

  it('defaults the fallback to STANDARD_COLORS.slate when themeColor is unset', () => {
    render(
      <FieldRenderer
        field={dateColorField}
        widget={widget}
        ctx={makeCtx({})}
        updateConfig={vi.fn()}
      />
    );
    expect(screen.getByLabelText('dateColor hex value')).toHaveValue(
      STANDARD_COLORS.slate
    );
  });

  it('writes a concrete hex value when a preset is chosen', () => {
    const updateConfig = vi.fn();
    render(
      <FieldRenderer
        field={dateColorField}
        widget={widget}
        ctx={makeCtx({ themeColor: '#3b82f6' })}
        updateConfig={updateConfig}
      />
    );
    screen.getByRole('radio', { name: /Brand red/i }).click();
    expect(updateConfig).toHaveBeenCalledWith({ dateColor: '#ad2122' });
  });
});
