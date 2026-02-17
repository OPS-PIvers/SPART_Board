import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
  type MockInstance,
} from 'vitest';
import { DraggableWindow } from './DraggableWindow';
import { WidgetData, GlobalStyle } from '../../types';

// Mock dependencies
vi.mock('../../hooks/useScreenshot', () => ({
  useScreenshot: () => ({
    takeScreenshot: vi.fn(),
    isFlashing: false,
    isCapturing: false,
  }),
}));

vi.mock('../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

// Helper for JSDOM missing methods
interface HTMLElementWithCapture extends HTMLDivElement {
  setPointerCapture: (id: number) => void;
  hasPointerCapture: (id: number) => boolean;
  releasePointerCapture: (id: number) => void;
}

vi.mock('./GlassCard', () => {
  const GlassCard = React.forwardRef<
    HTMLDivElement,
    GlassCardProps & { tabIndex?: number }
  >(({ children, className, onPointerDown, onClick, style, tabIndex }, ref) => (
    <div
      ref={ref}
      tabIndex={tabIndex}
      data-testid="draggable-window"
      className={className}
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  ));
  GlassCard.displayName = 'GlassCard';
  return { GlassCard };
});

vi.mock('./AnnotationCanvas', () => ({
  AnnotationCanvas: () => <div data-testid="annotation-canvas" />,
}));

const mockWidget: WidgetData = {
  id: 'test-widget',
  type: 'clock',
  x: 100,
  y: 100,
  w: 200,
  h: 200,
  z: 1,
  flipped: false,
  config: {
    format24: true,
    showSeconds: true,
  },
};

const mockGlobalStyle: GlobalStyle = {
  fontFamily: 'sans',
  windowTransparency: 0.8,
  windowBorderRadius: '2xl',
  dockTransparency: 0.4,
  dockBorderRadius: 'full',
  dockTextColor: '#334155',
  dockTextShadow: false,
};

describe('DraggableWindow', () => {
  let mockUpdateWidget: Mock<
    (id: string, updates: Partial<WidgetData>) => void
  >;
  let mockRemoveWidget: Mock<(id: string) => void>;
  let mockDuplicateWidget: Mock<(id: string) => void>;
  let mockBringToFront: Mock<(id: string) => void>;
  let mockAddToast: Mock<
    (message: string, type?: 'info' | 'success' | 'error') => void
  >;
  let activeElementSpy: MockInstance;

  beforeEach(() => {
    mockUpdateWidget = vi.fn();
    mockRemoveWidget = vi.fn();
    mockDuplicateWidget = vi.fn();
    mockBringToFront = vi.fn();
    mockAddToast = vi.fn();
    vi.clearAllMocks();
    // Setup default spy to return null
    activeElementSpy = vi.spyOn(document, 'activeElement', 'get');
    activeElementSpy.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // Helper function to render DraggableWindow with common props
  const renderComponent = (
    widgetProps: Partial<WidgetData> = {},
    children: React.ReactNode = <div>Content</div>,
    settings: React.ReactNode = <div>Settings</div>
  ) => {
    const widget = { ...mockWidget, ...widgetProps };
    return render(
      <DraggableWindow
        widget={widget}
        title="Test Widget"
        settings={settings}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        {children}
      </DraggableWindow>
    );
  };

  it('conditionally loads settings only after flip (optimization)', async () => {
    const SettingsContent = () => (
      <div data-testid="settings-content">Settings Loaded</div>
    );

    const { rerender } = render(
      <DraggableWindow
        widget={mockWidget}
        title="Test Widget"
        settings={<SettingsContent />}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div>Widget Content</div>
      </DraggableWindow>
    );

    // Initially, settings should NOT be in the document because flipped is false
    expect(screen.queryByTestId('settings-content')).not.toBeInTheDocument();

    // Rerender with flipped = true
    const flippedWidget = { ...mockWidget, flipped: true };
    rerender(
      <DraggableWindow
        widget={flippedWidget}
        title="Test Widget"
        settings={<SettingsContent />}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div>Widget Content</div>
      </DraggableWindow>
    );

    // Now settings SHOULD be in the document
    await waitFor(() => {
      expect(screen.getByTestId('settings-content')).toBeInTheDocument();
    });
  });

  it('updates position on pointer drag (using direct DOM manipulation for standard widgets)', () => {
    render(
      <DraggableWindow
        widget={mockWidget}
        title="Test Widget"
        settings={<div>Settings</div>}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div data-testid="widget-content">Widget Content</div>
      </DraggableWindow>
    );

    const dragSurface = screen.getByTestId(
      'drag-surface'
    ) as unknown as HTMLElementWithCapture;
    const windowEl = screen.getByTestId('draggable-window');

    dragSurface.setPointerCapture = vi.fn();
    dragSurface.hasPointerCapture = vi.fn().mockReturnValue(true);
    dragSurface.releasePointerCapture = vi.fn();

    // Start pointer at (110, 110)
    fireEvent.pointerDown(dragSurface, {
      clientX: 110,
      clientY: 110,
      pointerId: 1,
    });

    // Move pointer to (160, 160)
    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 160,
      pointerId: 1,
    });

    // Standard widget: should NOT call updateWidget during drag
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // BUT should update DOM directly
    // New position: 100 + (160 - 110) = 150
    expect(windowEl.style.left).toBe('150px');
    expect(windowEl.style.top).toBe('150px');

    // Clean up (Pointer Up)
    fireEvent.pointerUp(window, { pointerId: 1 });

    // NOW updateWidget should be called with final position
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        x: 150,
        y: 150,
      })
    );
  });

  it('allows dragging from below the old 40px handle area', () => {
    render(
      <DraggableWindow
        widget={mockWidget}
        title="Test Widget"
        settings={<div>Settings</div>}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div data-testid="widget-content">Widget Content</div>
      </DraggableWindow>
    );

    const dragSurface = screen.getByTestId(
      'drag-surface'
    ) as unknown as HTMLElementWithCapture;
    const windowEl = screen.getByTestId('draggable-window');

    dragSurface.setPointerCapture = vi.fn();
    dragSurface.hasPointerCapture = vi.fn().mockReturnValue(true);
    dragSurface.releasePointerCapture = vi.fn();

    // Start pointer at (110, 150)
    fireEvent.pointerDown(dragSurface, {
      clientX: 110,
      clientY: 150,
      pointerId: 1,
    });

    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 200,
      pointerId: 1,
    });

    // Verify DOM update instead of updateWidget
    // dx = 160 - 110 = 50, dy = 200 - 150 = 50
    // newX = 100 + 50 = 150, newY = 100 + 50 = 150
    expect(windowEl.style.left).toBe('150px');
    expect(windowEl.style.top).toBe('150px');
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Clean up
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({ x: 150, y: 150 })
    );
  });

  it('updates size on pointer resize (SE corner)', () => {
    const { container } = render(
      <DraggableWindow
        widget={mockWidget}
        title="Test Widget"
        settings={<div>Settings</div>}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div data-testid="widget-content">Widget Content</div>
      </DraggableWindow>
    );

    // SE handle
    const resizeHandles = container.querySelectorAll('.resize-handle');
    const seHandle = Array.from(resizeHandles).find((h) =>
      h.classList.contains('cursor-se-resize')
    ) as HTMLElementWithCapture;
    const windowEl = screen.getByTestId('draggable-window');

    seHandle.setPointerCapture = vi.fn();
    seHandle.hasPointerCapture = vi.fn().mockReturnValue(true);
    seHandle.releasePointerCapture = vi.fn();

    // Start resize pointer at (300, 300) (approx corner)
    fireEvent.pointerDown(seHandle, {
      clientX: 300,
      clientY: 300,
      pointerId: 1,
    });

    // Move pointer to (350, 400)
    fireEvent.pointerMove(window, {
      clientX: 350,
      clientY: 400,
      pointerId: 1,
    });

    // DOM should update directly
    // w: 200 + (350 - 300) = 250
    // h: 200 + (400 - 300) = 300
    expect(windowEl.style.width).toBe('250px');
    expect(windowEl.style.height).toBe('300px');
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Clean up
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({ w: 250, h: 300 })
    );
  });

  it('updates position and size on NW pointer resize', () => {
    const { container } = render(
      <DraggableWindow
        widget={mockWidget}
        title="Test Widget"
        settings={<div>Settings</div>}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div data-testid="widget-content">Widget Content</div>
      </DraggableWindow>
    );

    const resizeHandles = container.querySelectorAll('.resize-handle');
    const nwHandle = Array.from(resizeHandles).find((h) =>
      h.classList.contains('cursor-nw-resize')
    ) as HTMLElementWithCapture;
    const windowEl = screen.getByTestId('draggable-window');

    nwHandle.setPointerCapture = vi.fn();
    nwHandle.hasPointerCapture = vi.fn().mockReturnValue(true);
    nwHandle.releasePointerCapture = vi.fn();

    // Start resize at handle position (100, 100)
    fireEvent.pointerDown(nwHandle, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    // Move UP and LEFT by 50px (to 50, 50)
    fireEvent.pointerMove(window, {
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });

    // DOM update
    // New W: 200 - (-50) = 250, New H: 200 - (-50) = 250
    // New X: 100 + (-50) = 50, New Y: 100 + (-50) = 50
    expect(windowEl.style.width).toBe('250px');
    expect(windowEl.style.height).toBe('250px');
    expect(windowEl.style.left).toBe('50px');
    expect(windowEl.style.top).toBe('50px');
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({ w: 250, h: 250, x: 50, y: 50 })
    );
  });

  it('triggers real-time updates for position-aware widgets (e.g. catalyst)', () => {
    const catalystWidget = {
      ...mockWidget,
      id: 'catalyst-1',
      type: 'catalyst' as const, // Force type
    };

    render(
      <DraggableWindow
        widget={catalystWidget}
        title="Catalyst"
        settings={<div>Settings</div>}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div>Content</div>
      </DraggableWindow>
    );

    const dragSurface = screen.getByTestId(
      'drag-surface'
    ) as unknown as HTMLElementWithCapture;
    dragSurface.setPointerCapture = vi.fn();
    dragSurface.hasPointerCapture = vi.fn().mockReturnValue(true);
    dragSurface.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(dragSurface, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    fireEvent.pointerMove(window, {
      clientX: 110,
      clientY: 110,
      pointerId: 1,
    });

    // Catalyst should trigger updateWidget immediately during drag
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'catalyst-1',
      expect.objectContaining({ x: 110, y: 110 })
    );
  });

  it('closes immediately on widget-escape-press if skipCloseConfirmation is true', async () => {
    render(
      <DraggableWindow
        widget={mockWidget}
        title="Test Widget"
        settings={<div>Settings</div>}
        skipCloseConfirmation={true}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div data-testid="widget-content">Widget Content</div>
      </DraggableWindow>
    );

    const event = new CustomEvent('widget-escape-press', {
      detail: { widgetId: 'test-widget' },
    });
    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(mockRemoveWidget).toHaveBeenCalledWith('test-widget');
    });
  });

  it('shows confirmation on widget-escape-press if skipCloseConfirmation is false', async () => {
    render(
      <DraggableWindow
        widget={mockWidget}
        title="Test Widget"
        settings={<div>Settings</div>}
        skipCloseConfirmation={false}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div data-testid="widget-content">Widget Content</div>
      </DraggableWindow>
    );

    const event = new CustomEvent('widget-escape-press', {
      detail: { widgetId: 'test-widget' },
    });
    act(() => {
      window.dispatchEvent(event);
    });

    // Should NOT call removeWidget yet
    expect(mockRemoveWidget).not.toHaveBeenCalled();

    // Should show confirmation
    await waitFor(() => {
      expect(
        screen.getByText(/Close widget\? Data will be lost\./i)
      ).toBeInTheDocument();
    });
  });

  it('settings button toggles flipped to true when closed', () => {
    renderComponent();

    // Click widget to show toolbar
    const widgetEl = screen.getByText('Content').closest('.widget');
    if (!widgetEl) throw new Error('Widget element not found');
    fireEvent.click(widgetEl);

    // Find settings button and click it
    const settingsBtn = screen.getByTitle('Settings');
    fireEvent.click(settingsBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      flipped: true,
    });
  });

  it('settings button toggles flipped to false when open', () => {
    renderComponent({ flipped: true });

    // Click widget to show toolbar
    const widgetEl = screen.getByText('Content').closest('.widget');
    if (!widgetEl) throw new Error('Widget element not found');
    fireEvent.click(widgetEl);

    // Find settings button (should show "Close Settings" when open)
    const settingsBtn = screen.getByTitle('Close Settings');
    fireEvent.click(settingsBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      flipped: false,
    });
  });

  it('minimize closes settings panel', () => {
    renderComponent({ flipped: true });

    // Click widget to show toolbar, then minimize
    const widgetEl = screen.getByText('Content').closest('.widget');
    if (!widgetEl) throw new Error('Widget element not found');
    fireEvent.click(widgetEl);

    const minimizeBtn = screen.getByTitle('Minimize');
    fireEvent.click(minimizeBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({ minimized: true, flipped: false })
    );
  });

  it('maximize closes settings panel', () => {
    renderComponent({ flipped: true });

    // Click widget to show toolbar, then maximize
    const widgetEl = screen.getByText('Content').closest('.widget');
    if (!widgetEl) throw new Error('Widget element not found');
    fireEvent.click(widgetEl);

    const maximizeBtn = screen.getByTitle('Maximize');
    fireEvent.click(maximizeBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({ maximized: true, flipped: false })
    );
  });

  it('drag start closes settings panel', () => {
    renderComponent({ flipped: true });

    const dragSurface = screen.getByTestId(
      'drag-surface'
    ) as unknown as HTMLElementWithCapture;
    dragSurface.setPointerCapture = vi.fn();
    dragSurface.hasPointerCapture = vi.fn().mockReturnValue(true);
    dragSurface.releasePointerCapture = vi.fn();

    // Start a drag
    fireEvent.pointerDown(dragSurface, {
      clientX: 110,
      clientY: 110,
      pointerId: 1,
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      flipped: false,
    });

    // Clean up
    fireEvent.pointerUp(window, { pointerId: 1 });
  });

  it('resize start closes settings panel', () => {
    renderComponent({ flipped: true });

    // Find a resize handle (SE corner)
    const handles = document.querySelectorAll('.resize-handle');
    const seHandle = handles[
      handles.length - 1
    ] as unknown as HTMLElementWithCapture;
    seHandle.setPointerCapture = vi.fn();
    seHandle.hasPointerCapture = vi.fn().mockReturnValue(true);
    seHandle.releasePointerCapture = vi.fn();

    // Start a resize
    fireEvent.pointerDown(seHandle, {
      clientX: 300,
      clientY: 300,
      pointerId: 1,
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      flipped: false,
    });

    // Clean up
    fireEvent.pointerUp(window, { pointerId: 1 });
  });
});
