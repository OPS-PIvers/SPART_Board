import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetData, GlobalStyle } from '@/types';

// Mock dependencies
vi.mock('@/hooks/useWindowSize', () => ({
  useWindowSize: vi.fn((_enabled) => ({ width: 1000, height: 800 })),
}));

vi.mock('@/context/useAuth', () => ({
  useAuth: () => ({ canAccessFeature: () => true }),
}));

vi.mock('../common/DraggableWindow', () => ({
  DraggableWindow: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('./WidgetRegistry', () => ({
  WIDGET_COMPONENTS: {
    clock: () => <div>Clock Widget</div>,
  },
  WIDGET_SETTINGS_COMPONENTS: {},
  WIDGET_SCALING_CONFIG: {},
  DEFAULT_SCALING_CONFIG: { baseWidth: 200, baseHeight: 200 },
}));

// Mock useWindowSize to spy on arguments
import { useWindowSize } from '@/hooks/useWindowSize';

describe('WidgetRenderer', () => {
  const mockWidget: WidgetData = {
    id: 'test-1',
    type: 'clock',
    x: 0,
    y: 0,
    w: 200,
    h: 200,
    z: 1,
    flipped: false,
    config: {},
    maximized: false,
  };

  const mockProps = {
    widget: mockWidget,
    session: null,
    isLive: false,
    students: [],
    updateSessionConfig: vi.fn(),
    updateSessionBackground: vi.fn(),
    startSession: vi.fn(),
    endSession: vi.fn(),
    removeStudent: vi.fn(),
    toggleFreezeStudent: vi.fn(),
    toggleGlobalFreeze: vi.fn(),
    updateWidget: vi.fn(),
    removeWidget: vi.fn(),
    duplicateWidget: vi.fn(),
    bringToFront: vi.fn(),
    addToast: vi.fn(),
    globalStyle: {
      fontFamily: 'sans',
      windowTransparency: 0.8,
      windowBorderRadius: '2xl',
      dockTransparency: 0.4,
      dockBorderRadius: 'full',
      dockTextColor: '#334155',
      dockTextShadow: false,
    } as unknown as GlobalStyle,
  };

  it('should call useWindowSize with false when widget is not maximized', () => {
    render(<WidgetRenderer {...mockProps} />);
    expect(useWindowSize).toHaveBeenCalledWith(false);
  });

  it('should call useWindowSize with true when widget is maximized', () => {
    const maximizedWidget = { ...mockWidget, maximized: true };
    render(<WidgetRenderer {...mockProps} widget={maximizedWidget} />);
    expect(useWindowSize).toHaveBeenCalledWith(true);
  });
});
