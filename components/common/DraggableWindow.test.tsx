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

  it('updates position only on pointer up for standard widgets (optimization)', () => {
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

    // Mock capture methods on the handle itself since it's the currentTarget
    frontFace.setPointerCapture = vi.fn();
    frontFace.hasPointerCapture = vi.fn().mockReturnValue(true);
    frontFace.releasePointerCapture = vi.fn();

    // Start pointer at (110, 110)
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

    // Should NOT call updateWidget during drag (optimization)
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Clean up (Pointer Up)
    fireEvent.pointerUp(window, { pointerId: 1 });

    // New position should be (100 + (160 - 110), 100 + (160 - 110)) = (150, 150)
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        x: 150,
        y: 150,
      })
    );
  });

  it('updates position immediately during drag for position-aware widgets', () => {
    // 'catalyst' is in POSITION_AWARE_WIDGETS
    const catalystWidget = { ...mockWidget, type: 'catalyst' as const };
    const { container } = render(
      <DraggableWindow
        widget={catalystWidget}
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
    if (!frontFace) throw new Error('Front face not found');

    frontFace.setPointerCapture = vi.fn();
    frontFace.hasPointerCapture = vi.fn().mockReturnValue(true);
    frontFace.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(frontFace, {
      clientX: 110,
      clientY: 110,
      pointerId: 1,
    });

    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 160,
      pointerId: 1,
    });

    // Should call updateWidget immediately
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        x: 150,
        y: 150,
      })
    );
  });

  it('allows dragging from below the old 40px handle area (standard optimization)', () => {
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

    // Mock capture methods
    frontFace.setPointerCapture = vi.fn();
    frontFace.hasPointerCapture = vi.fn().mockReturnValue(true);
    frontFace.releasePointerCapture = vi.fn();

    // Start pointer at (110, 150)
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

    // Should NOT call updateWidget during drag
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Clean up
    fireEvent.pointerUp(window, { pointerId: 1 });

    // Should update on up
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        x: 150,
        y: 150,
      })
    );
  });

  it('updates size only on pointer up for standard widgets (optimization)', () => {
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

    // SE handle is typically the last one or indexed specifically
    const resizeHandles = document.querySelectorAll('.resize-handle');
    const seHandle = Array.from(resizeHandles).find((h) =>
      h.classList.contains('cursor-se-resize')
    ) as HTMLElementWithCapture;
    if (!seHandle) throw new Error('SE Resize handle not found');

    // Mock capture methods
    seHandle.setPointerCapture = vi.fn();
    seHandle.hasPointerCapture = vi.fn().mockReturnValue(true);
    seHandle.releasePointerCapture = vi.fn();

    // Start resize pointer at (300, 300)
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

    // Should NOT update during drag
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Clean up
    fireEvent.pointerUp(window, { pointerId: 1 });

    // New size should be w: 200 + (350 - 300) = 250, h: 200 + (400 - 300) = 300
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        w: 250,
        h: 300,
      })
    );
  });

  it('updates position and size only on pointer up on NW pointer resize (optimization)', () => {
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
    const nwHandle = Array.from(resizeHandles).find((h) =>
      h.classList.contains('cursor-nw-resize')
    ) as HTMLElementWithCapture;
    if (!nwHandle) throw new Error('NW Resize handle not found');

    nwHandle.setPointerCapture = vi.fn();
    nwHandle.hasPointerCapture = vi.fn().mockReturnValue(true);
    nwHandle.releasePointerCapture = vi.fn();

    // Start resize at handle position (conceptually 100, 100)
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

    // Should NOT update during drag
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    fireEvent.pointerUp(window, { pointerId: 1 });

    // New W: 200 - (-50) = 250, New X: 100 + (-50) = 50
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        w: 250,
        h: 250,
        x: 50,
        y: 50,
      })
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
});
