import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WidgetRenderer } from '../../../components/widgets/WidgetRenderer';
import { WidgetData } from '../../../types';
import { useAuth } from '../../../context/useAuth';
import { useDashboard } from '../../../context/useDashboard';
import { useWindowSize } from '../../../hooks/useWindowSize';

// Mock dependencies
vi.mock('../../../context/useAuth');
vi.mock('../../../context/useDashboard');
vi.mock('../../../hooks/useWindowSize');

// Mock child components
vi.mock('../../../components/widgets/stickers/StickerItemWidget', () => ({
  StickerItemWidget: () => <div data-testid="sticker-widget">Sticker</div>,
}));

vi.mock('../../../components/common/DraggableWindow', () => ({
  DraggableWindow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="draggable-window">
      {children}
    </div>
  ),
}));

// Capture ScalableWidget props to verify optimization
// IMPORTANT: We mock the component but NOT memoize it here, so we can detect if it re-renders
const mockScalableWidget = vi.fn();
vi.mock('../../../components/common/ScalableWidget', () => ({
  ScalableWidget: (props: any) => {
    mockScalableWidget(props);
    // Execute children render prop to ensure it works
    if (typeof props.children === 'function') {
      return <div>{props.children({ internalW: 100, internalH: 100, scale: 1 })}</div>;
    }
    return <div>{props.children}</div>;
  },
}));

vi.mock('../../../components/widgets/WidgetRegistry', () => ({
  WIDGET_SETTINGS_COMPONENTS: {},
  WIDGET_SCALING_CONFIG: {
    'test-widget': { baseWidth: 200, baseHeight: 200, canSpread: true },
  },
  DEFAULT_SCALING_CONFIG: { baseWidth: 200, baseHeight: 200 },
}));

vi.mock('../../../components/widgets/WidgetLayoutWrapper', () => ({
  WidgetLayoutWrapper: () => <div data-testid="widget-content">Widget Content</div>,
}));

describe('WidgetRenderer', () => {
  const mockWidget: WidgetData = {
    id: 'w1',
    type: 'test-widget',
    x: 0,
    y: 0,
    w: 400,
    h: 400,
    z: 1,
    flipped: false,
    minimized: false,
    maximized: false,
    transparency: 1,
    config: {},
  };

  const mockProps = {
    widget: mockWidget,
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
    globalStyle: { windowTransparency: 1, fontFamily: 'sans', windowBorderRadius: 'md' } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { uid: 'u1' }, canAccessFeature: vi.fn() });
    (useDashboard as any).mockReturnValue({});
    (useWindowSize as any).mockReturnValue({ width: 1024, height: 768 });
  });

  it('renders content correctly', () => {
    render(<WidgetRenderer {...mockProps} />);
    expect(screen.getByTestId('draggable-window')).toBeInTheDocument();
    expect(screen.getByTestId('widget-content')).toBeInTheDocument();
  });

  it('passes stable children callback to ScalableWidget across re-renders', () => {
    const { rerender } = render(<WidgetRenderer {...mockProps} />);

    expect(mockScalableWidget).toHaveBeenCalledTimes(1);
    const firstRenderProps = mockScalableWidget.mock.calls[0][0];

    // Rerender with CHANGED prop that forces WidgetRenderer to update
    // but should NOT change the ScalableWidget children callback
    rerender(<WidgetRenderer {...mockProps} isLive={true} />);

    expect(mockScalableWidget).toHaveBeenCalledTimes(2);
    const secondRenderProps = mockScalableWidget.mock.calls[1][0];

    // The children prop (render callback) should be referentially equal
    expect(firstRenderProps.children).toBe(secondRenderProps.children);
  });
});
