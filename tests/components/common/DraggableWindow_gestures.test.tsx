import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableWindow } from '../../../components/common/DraggableWindow';
import { WidgetData, GlobalStyle } from '../../../types';
import {
  DashboardContext,
  DashboardContextValue,
} from '../../../context/DashboardContextValue';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Settings: () => <span data-testid="settings-icon">Settings</span>,
    X: () => <span data-testid="close-icon">Close</span>,
    ChevronRight: () => <span data-testid="chevron-icon">Chevron</span>,
  };
});

// Mock screenshot hook
vi.mock('../../../hooks/useScreenshot', () => ({
  useScreenshot: () => ({
    takeScreenshot: vi.fn(),
    isFlashing: false,
    isCapturing: false,
  }),
}));

describe('DraggableWindow Gestures', () => {
  const mockWidget: WidgetData = {
    id: 'test-widget',
    type: 'text',
    x: 100,
    y: 100,
    w: 200,
    h: 200,
    z: 1,
    flipped: false,
    minimized: false,
    maximized: false,
    transparency: 1,
    config: { content: 'test', bgColor: 'white', fontSize: 16 },
  };

  const mockGlobalStyle = {
    fontFamily: 'sans',
    windowTransparency: 1,
    windowBorderRadius: 'md',
    dockTransparency: 0.5,
    dockBorderRadius: 'full',
    dockTextColor: '#000000',
    dockTextShadow: false,
  } as GlobalStyle;

  const mockContext = {
    updateWidget: vi.fn(),
    removeWidget: vi.fn(),
    duplicateWidget: vi.fn(),
    bringToFront: vi.fn(),
    addToast: vi.fn(),
    resetWidgetSize: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.className = '';
  });

  it('prevents drag on scrollable elements', () => {
    render(
      <DashboardContext.Provider
        value={mockContext as unknown as DashboardContextValue}
      >
        <DraggableWindow
          widget={mockWidget}
          settings={<div>Settings</div>}
          title="Test Widget"
          globalStyle={mockGlobalStyle}
        >
          <div className="overflow-y-auto h-full" data-testid="scrollable-content">
            Scrollable Content
          </div>
        </DraggableWindow>
      </DashboardContext.Provider>
    );

    const scrollableContent = screen.getByTestId('scrollable-content');

    // Simulate pointer down on scrollable content
    fireEvent.pointerDown(scrollableContent, {
      clientX: 150,
      clientY: 150,
      pointerId: 1,
      bubbles: true,
    });

    // Check if dragging class is NOT added to body
    expect(document.body.classList.contains('is-dragging-widget')).toBe(false);
  });

  it('allows drag on non-scrollable elements', () => {
    render(
      <DashboardContext.Provider
        value={mockContext as unknown as DashboardContextValue}
      >
        <DraggableWindow
          widget={mockWidget}
          settings={<div>Settings</div>}
          title="Test Widget"
          globalStyle={mockGlobalStyle}
        >
          <div data-testid="non-scrollable-content">
            Non Scrollable Content
          </div>
        </DraggableWindow>
      </DashboardContext.Provider>
    );

    const content = screen.getByTestId('non-scrollable-content');

    // Simulate pointer down
    fireEvent.pointerDown(content, {
      clientX: 150,
      clientY: 150,
      pointerId: 1,
      bubbles: true,
    });

    // Check if dragging class IS added to body
    expect(document.body.classList.contains('is-dragging-widget')).toBe(true);
  });

  it('minimizes widget on two-finger swipe down', () => {
    render(
      <DashboardContext.Provider
        value={mockContext as unknown as DashboardContextValue}
      >
        <DraggableWindow
          widget={mockWidget}
          settings={<div>Settings</div>}
          title="Test Widget"
          globalStyle={mockGlobalStyle}
        >
          <div>Content</div>
        </DraggableWindow>
      </DashboardContext.Provider>
    );

    const widget = screen.getByText('Content').closest('.widget');
    if (!widget) throw new Error('Widget not found');

    // Simulate 2-finger touch start
    fireEvent.touchStart(widget, {
      touches: [
        { clientY: 100 },
        { clientY: 110 }
      ],
    });

    // Simulate touch end with movement down > 60px
    // Note: changedTouches should contain the touch that ended/moved.
    // Logic: deltaY = e.changedTouches[0].clientY - gestureStartRef.current.y
    // Start Y was 100 (first touch). We need new Y to be > 160.
    fireEvent.touchEnd(widget, {
      changedTouches: [
        { clientY: 170 }
      ],
      touches: [] // All touches ended
    });

    expect(mockContext.updateWidget).toHaveBeenCalledWith(mockWidget.id, {
      minimized: true,
      flipped: false,
    });
  });
});
