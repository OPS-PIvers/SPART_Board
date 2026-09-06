import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import React from 'react';
import {
  selectDrawerSide,
  useSettingsDrawerPlacement,
  type SettingsDrawerPlacement,
} from '@/components/settings/useSettingsDrawerPlacement';

const DRAWER = 420;

describe('selectDrawerSide', () => {
  const base = { viewportWidth: 1280, drawerWidth: DRAWER };

  it('docks right when the widget fits left of a right drawer', () => {
    expect(
      selectDrawerSide({
        ...base,
        rect: { left: 40, top: 0, width: 400, height: 300 },
      })
    ).toEqual({ side: 'right', needsPan: false });
  });

  it('docks left when only the band right of a left drawer fits', () => {
    expect(
      selectDrawerSide({
        ...base,
        rect: { left: 900, top: 0, width: 340, height: 300 },
      })
    ).toEqual({ side: 'left', needsPan: false });
  });

  it('docks right and pans when neither side fits', () => {
    expect(
      selectDrawerSide({
        ...base,
        rect: { left: 300, top: 0, width: 900, height: 300 },
      })
    ).toEqual({ side: 'right', needsPan: true });
  });

  it('breaks a both-fit tie away from a side-anchored dock', () => {
    const rect = { left: 430, top: 0, width: 400, height: 300 };
    expect(
      selectDrawerSide({ ...base, rect, dockPosition: 'right' }).side
    ).toBe('left');
    expect(selectDrawerSide({ ...base, rect, dockPosition: 'left' }).side).toBe(
      'right'
    );
    expect(
      selectDrawerSide({ ...base, rect, dockPosition: 'bottom' }).side
    ).toBe('right');
  });
});

const FALLBACK: SettingsDrawerPlacement = {
  placement: 'right',
  needsPan: false,
  rect: null,
  announcementKey: null,
};

const Probe: React.FC<{
  widgetId: string | null;
  open: boolean;
  drawerWidth: number;
  onRender: (p: SettingsDrawerPlacement) => void;
}> = ({ widgetId, open, drawerWidth, onRender }) => {
  onRender(useSettingsDrawerPlacement({ widgetId, open, drawerWidth }));
  return null;
};

const mountWidget = (id: string, left: number, width: number): HTMLElement => {
  const el = document.createElement('div');
  el.setAttribute('data-widget-id', id);
  el.getBoundingClientRect = () =>
    ({ left, top: 100, width, height: 200 }) as DOMRect;
  document.body.appendChild(el);
  return el;
};

const setViewport = (width: number): void => {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('useSettingsDrawerPlacement', () => {
  beforeEach(() => setViewport(1280));
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('measures the live widget rect and chooses a side', () => {
    mountWidget('w1', 40, 400);
    let latest: SettingsDrawerPlacement = FALLBACK;
    render(
      <Probe
        widgetId="w1"
        open
        drawerWidth={DRAWER}
        onRender={(p) => {
          latest = p;
        }}
      />
    );
    expect(latest.placement).toBe('right');
    expect(latest.needsPan).toBe(false);
    expect(latest.rect).toEqual({
      left: 40,
      top: 100,
      width: 400,
      height: 200,
    });
    expect(latest.announcementKey).toBe('widgetSettings.common.dockedRight');
  });

  it('does not re-run side selection when the drawer is resized (D24)', () => {
    mountWidget('w1', 900, 340);
    let latest: SettingsDrawerPlacement = FALLBACK;
    const view = render(
      <Probe
        widgetId="w1"
        open
        drawerWidth={DRAWER}
        onRender={(p) => {
          latest = p;
        }}
      />
    );
    expect(latest.placement).toBe('left');
    view.rerender(
      <Probe
        widgetId="w1"
        open
        drawerWidth={560}
        onRender={(p) => {
          latest = p;
        }}
      />
    );
    expect(latest.placement).toBe('left');
  });

  it('renders as a bottom sheet below the 900px breakpoint', () => {
    mountWidget('w1', 40, 400);
    let latest: SettingsDrawerPlacement = FALLBACK;
    render(
      <Probe
        widgetId="w1"
        open
        drawerWidth={DRAWER}
        onRender={(p) => {
          latest = p;
        }}
      />
    );
    setViewport(820);
    expect(latest.placement).toBe('bottom');
    expect(latest.needsPan).toBe(false);
    expect(latest.announcementKey).toBeNull();
  });

  it('re-evaluates when the edited widget changes', () => {
    mountWidget('w1', 40, 400);
    mountWidget('w2', 900, 340);
    let latest: SettingsDrawerPlacement = FALLBACK;
    const view = render(
      <Probe
        widgetId="w1"
        open
        drawerWidth={DRAWER}
        onRender={(p) => {
          latest = p;
        }}
      />
    );
    expect(latest.placement).toBe('right');
    view.rerender(
      <Probe
        widgetId="w2"
        open
        drawerWidth={DRAWER}
        onRender={(p) => {
          latest = p;
        }}
      />
    );
    expect(latest.placement).toBe('left');
  });
});
