import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('./GlassCard', () => ({
  GlassCard: ({
    children,
    className,
    onPointerDown,
    onClick,
    style,
  }: GlassCardProps) => (
    <div
      className={className}
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  ),
}));

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

const mockUpdateWidget = vi.fn();
const mockRemoveWidget = vi.fn();
const mockDuplicateWidget = vi.fn();
const mockBringToFront = vi.fn();
const mockAddToast = vi.fn();
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
  beforeEach(() => {
    vi.clearAllMocks();
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

    const widgetContent = screen.getByTestId('widget-content');
    const draggableArea = widgetContent.parentElement;
    if (!draggableArea) throw new Error('Draggable area not found');

    // Start pointer at (110, 110)
    fireEvent.pointerDown(draggableArea, {
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

    // New position should be (100 + (160 - 110), 100 + (160 - 110)) = (150, 150)
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        x: 150,
        y: 150,
      })
    );
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
    const frontResizeHandle = resizeHandles[0];

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

    // New size should be w: 200 + (350 - 300) = 250, h: 200 + (400 - 300) = 300
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        w: 250,
        h: 300,
      })
    );
  });
});
