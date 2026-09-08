import { describe, expect, it, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import {
  useSettingsDrawerFocus,
  useSettingsTargetMarker,
} from '@/components/settings/useSettingsDrawerFocus';

const Probe: React.FC<{
  widgetId: string | null;
  open: boolean;
  openerRef?: React.RefObject<HTMLElement | null>;
}> = ({ widgetId, open, openerRef }) => {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  useSettingsDrawerFocus({ widgetId, open, headingRef, openerRef });
  return open ? (
    <h2 ref={headingRef} tabIndex={-1}>
      Settings
    </h2>
  ) : null;
};

const MarkerProbe: React.FC<{ widgetId: string | null; open: boolean }> = ({
  widgetId,
  open,
}) => {
  useSettingsTargetMarker(widgetId, open);
  return null;
};

const mountWidget = (id: string): HTMLElement => {
  const el = document.createElement('div');
  el.setAttribute('data-widget-id', id);
  document.body.appendChild(el);
  return el;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useSettingsDrawerFocus', () => {
  it('focuses the heading on open', () => {
    mountWidget('w1');
    render(<Probe widgetId="w1" open />);
    expect(document.activeElement?.textContent).toBe('Settings');
  });

  it('returns focus to the opener on close', () => {
    mountWidget('w1');
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    const openerRef = { current: opener };

    const view = render(<Probe widgetId="w1" open openerRef={openerRef} />);
    view.rerender(<Probe widgetId="w1" open={false} openerRef={openerRef} />);

    expect(document.activeElement).toBe(opener);
  });

  it('falls back to the widget root when the opener is gone', () => {
    const widget = mountWidget('w1');
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    const openerRef = { current: opener };

    const view = render(<Probe widgetId="w1" open openerRef={openerRef} />);
    opener.remove();
    view.rerender(<Probe widgetId="w1" open={false} openerRef={openerRef} />);

    expect(document.activeElement).toBe(widget);
  });

  it('does not steal focus to the next widget opener on a same-render, non-local swap', () => {
    const openerA = document.createElement('button');
    const openerB = document.createElement('button');
    document.body.appendChild(openerA);
    document.body.appendChild(openerB);
    const openerRef: React.RefObject<HTMLElement | null> = {
      current: openerA,
    };

    const view = render(<Probe widgetId="A" open openerRef={openerRef} />);
    expect(document.activeElement?.textContent).toBe('Settings');

    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();
    expect(document.activeElement).toBe(outside);

    // Mirrors the host's render-time reassignment on a widget swap, before A's effect cleanup runs.
    openerRef.current = openerB;
    view.rerender(<Probe widgetId="B" open={false} openerRef={openerRef} />);

    expect(document.activeElement).not.toBe(openerB);
  });
});

describe('useSettingsTargetMarker', () => {
  it('marks the edited widget whenever open, regardless of origin', () => {
    const widget = mountWidget('w1');
    render(<MarkerProbe widgetId="w1" open />);
    expect(widget.hasAttribute('data-settings-target')).toBe(true);
  });

  it('clears the marker on close', () => {
    const widget = mountWidget('w1');
    const view = render(<MarkerProbe widgetId="w1" open />);
    view.rerender(<MarkerProbe widgetId="w1" open={false} />);
    expect(widget.hasAttribute('data-settings-target')).toBe(false);
  });
});
