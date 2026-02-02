import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
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

  it('updates position on pointer drag', () => {
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

    // The drag handle is now the .front div itself
    const frontFace = container.querySelector(
      '.front'
    ) as HTMLElementWithCapture;
    if (!frontFace) throw new Error('Front face not found');

    // Mock getBoundingClientRect for JSDOM
    frontFace.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      left: 100,
      width: 200,
      height: 200,
    });

    // Mock capture methods on the handle itself since it's the currentTarget
    frontFace.setPointerCapture = vi.fn();
    frontFace.hasPointerCapture = vi.fn().mockReturnValue(true);
    frontFace.releasePointerCapture = vi.fn();

    // Start pointer at (110, 110) - This is 10px from top, so it should drag
    fireEvent.pointerDown(frontFace, {
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

    // OPTIMIZATION CHECK: Ensure updateWidget is NOT called during drag
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Verify local state updated visual position
    const widgetElement = screen.getByTestId('draggable-window');
    // Original: 100, 100. Drag: +50, +50. New: 150, 150.
    expect(widgetElement.style.left).toBe('150px');
    expect(widgetElement.style.top).toBe('150px');

    // Clean up / Drop
    fireEvent.pointerUp(window, {
      clientX: 160,
      clientY: 160,
      pointerId: 1,
    });

    // NOW expect updateWidget
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        x: 150,
        y: 150,
      })
    );
  });

  it('does not drag if clicking below the 40px handle area', () => {
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

    const frontFace = container.querySelector(
      '.front'
    ) as HTMLElementWithCapture;

    frontFace.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      left: 100,
      width: 200,
      height: 200,
    });

    // Start pointer at (110, 150) - This is 50px from top, so it should NOT drag
    fireEvent.pointerDown(frontFace, {
      clientX: 110,
      clientY: 150,
      pointerId: 1,
    });

    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 200,
      pointerId: 1,
    });

    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Clean up
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('updates size on pointer resize', () => {
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

    const resizeHandles = document.querySelectorAll('.resize-handle');
    const frontResizeHandle = resizeHandles[0] as HTMLElementWithCapture;
    if (!frontResizeHandle) throw new Error('Resize handle not found');

    // Mock capture methods on the handle itself
    frontResizeHandle.setPointerCapture = vi.fn();
    frontResizeHandle.hasPointerCapture = vi.fn().mockReturnValue(true);
    frontResizeHandle.releasePointerCapture = vi.fn();

    // Start resize pointer at (300, 300)
    fireEvent.pointerDown(frontResizeHandle, {
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

    // OPTIMIZATION CHECK: Ensure updateWidget is NOT called during resize
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Verify local state updated visual size
    const widgetElement = screen.getByTestId('draggable-window');
    // Original: 200, 200. Resize: +50, +100. New: 250, 300.
    expect(widgetElement.style.width).toBe('250px');
    expect(widgetElement.style.height).toBe('300px');

    // Clean up / Drop
    fireEvent.pointerUp(window, {
      clientX: 350,
      clientY: 400,
      pointerId: 1,
    });

    // NOW expect updateWidget
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        w: 250,
        h: 300,
      })
    );
  });

  it('closes immediately on Escape if skipCloseConfirmation is true', () => {
    const { container } = render(
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

    const widgetElement = container.querySelector('.widget') as HTMLElement;
    if (!widgetElement) throw new Error('Widget element not found');

    // Mock activeElement using shared spy
    activeElementSpy.mockReturnValue(widgetElement);

    fireEvent.keyDown(widgetElement, { key: 'Escape' });

    expect(mockRemoveWidget).toHaveBeenCalledWith('test-widget');
  });

  it('shows confirmation on Escape if skipCloseConfirmation is false', () => {
    const { container } = render(
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

    const widgetElement = container.querySelector('.widget') as HTMLElement;
    if (!widgetElement) throw new Error('Widget element not found');

    // Mock activeElement using shared spy
    activeElementSpy.mockReturnValue(widgetElement);

    fireEvent.keyDown(widgetElement, { key: 'Escape' });

    // Should NOT call removeWidget yet
    expect(mockRemoveWidget).not.toHaveBeenCalled();
    // Should show confirmation
    expect(
      screen.getByText(/Close widget\? Data will be lost\./i)
    ).toBeInTheDocument();
  });
});
