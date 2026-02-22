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
          <div
            className="overflow-y-auto h-full"
            data-testid="scrollable-content"
          >
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
          <div data-testid="non-scrollable-content">Non Scrollable Content</div>
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

    // Cleanup: simulate pointer up to remove global listeners
    fireEvent.pointerUp(window, { pointerId: 1 });
  });

  it('minimizes widget on two-finger swipe down using average Y', () => {
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
    // Using widely spaced touches to verify average calculation
    // Touch 1: 100, Touch 2: 200. Average Start Y = 150.
    fireEvent.touchStart(widget, {
      touches: [{ clientY: 100 }, { clientY: 200 }],
    });

    // Simulate touch end with movement down > 60px relative to average (150)
    // Target Delta > 60 => Target Y > 210.
    // Let's say one finger moved to 220.
    fireEvent.touchEnd(widget, {
      changedTouches: [{ clientY: 220 }],
      touches: [], // All touches ended
    });

    expect(mockContext.updateWidget).toHaveBeenCalledWith(mockWidget.id, {
      minimized: true,
      flipped: false,
    });
  });

  it('does not minimize if delta is insufficient', () => {
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

    // Average Start Y = 150
    fireEvent.touchStart(widget, {
      touches: [{ clientY: 100 }, { clientY: 200 }],
    });

    // Move to 180 (Delta = 30)
    fireEvent.touchEnd(widget, {
      changedTouches: [{ clientY: 180 }],
      touches: [],
    });

    expect(mockContext.updateWidget).not.toHaveBeenCalled();
  });

  it('clears gesture state on 3+ touches', () => {
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

    // 1. Start with 2 fingers (valid gesture state)
    fireEvent.touchStart(widget, {
      touches: [{ clientY: 100 }, { clientY: 100 }],
    });

    // 2. Add a 3rd finger (invalid gesture state)
    fireEvent.touchStart(widget, {
      touches: [{ clientY: 100 }, { clientY: 100 }, { clientY: 100 }],
    });

    // 3. End touch with valid movement (should NOT trigger because state was cleared)
    fireEvent.touchEnd(widget, {
      changedTouches: [{ clientY: 200 }],
      touches: [],
    });

    expect(mockContext.updateWidget).not.toHaveBeenCalled();
  });
});
