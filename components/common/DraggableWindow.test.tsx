/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion, @typescript-eslint/require-await */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

vi.mock('./GlassCard', () => {
  const MockGlassCard = React.forwardRef(
    ({ children, className, style, onMouseDown, onClick }: any, ref: any) => (
      <div
        ref={ref}
        data-testid="glass-card"
        className={className}
        style={style}
        onMouseDown={onMouseDown}
        onClick={onClick}
      >
        {children}
      </div>
    )
  );
  MockGlassCard.displayName = 'GlassCard';
  return { GlassCard: MockGlassCard };
});

vi.mock('./AnnotationCanvas', () => ({
  AnnotationCanvas: () => <div data-testid="annotation-canvas" />,
}));

// Mock Lucide icons to make them easy to find
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Settings: () => <span data-testid="icon-settings">Settings</span>,
    X: () => <span data-testid="icon-close">Close</span>,
    Minus: () => <span data-testid="icon-minimize">Minimize</span>,
    Maximize: () => <span data-testid="icon-maximize">Maximize</span>,
    Minimize2: () => <span data-testid="icon-restore">Restore</span>,
    Copy: () => <span data-testid="icon-duplicate">Duplicate</span>,
    Camera: () => <span data-testid="icon-camera">Camera</span>,
    Highlighter: () => <span data-testid="icon-annotate">Annotate</span>,
    Pencil: () => <span data-testid="icon-pencil">Pencil</span>,
    ChevronRight: () => <span data-testid="icon-chevron">Chevron</span>,
  };
});

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

  it('renders correctly', () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    expect(screen.getByText('Widget Content')).toBeInTheDocument();
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveStyle({
      left: '100px',
      top: '100px',
      width: '200px',
      height: '200px',
    });
  });

  it('handles dragging', () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    const frontFace = screen.getByText('Widget Content').closest('.front');
    if (!frontFace) throw new Error('Front face not found');

    // Start Drag
    fireEvent.mouseDown(frontFace, { clientX: 110, clientY: 110 });
    expect(document.body.classList.contains('is-dragging-widget')).toBe(true);

    // Move
    fireEvent.mouseMove(window, { clientX: 120, clientY: 120 });
    // updateWidget should be called with new coordinates
    // startX = 110 - 100 = 10
    // startY = 110 - 100 = 10
    // newX = 120 - 10 = 110
    // newY = 120 - 10 = 110
    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      x: 110,
      y: 110,
    });

    // Stop Drag
    fireEvent.mouseUp(window);
    expect(document.body.classList.contains('is-dragging-widget')).toBe(false);
  });

  it('handles resizing', () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    const resizeHandle = container.querySelector('.resize-handle');
    if (!resizeHandle) throw new Error('Resize handle not found');

    // Start Resize
    fireEvent.mouseDown(resizeHandle, { clientX: 300, clientY: 300 });
    expect(document.body.classList.contains('is-dragging-widget')).toBe(true);

    // Move
    fireEvent.mouseMove(window, { clientX: 310, clientY: 310 });
    // startW = 200, startH = 200
    // startX = 300, startY = 300
    // dx = 10, dy = 10
    // newW = 210, newH = 210
    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      w: 210,
      h: 210,
    });

    // Stop Resize
    fireEvent.mouseUp(window);
    expect(document.body.classList.contains('is-dragging-widget')).toBe(false);
  });

  it('toggles tool menu on click', async () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    const card = screen.getByTestId('glass-card');
    fireEvent.click(card);

    // Menu is in a portal, so check document body or queryByText globally
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByTestId('icon-settings')).toBeInTheDocument();
  });

  it('handles maximizing', () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    // Open menu
    fireEvent.click(screen.getByTestId('glass-card'));

    // Expand toolbar
    const chevron = screen.getByTestId('icon-chevron');
    fireEvent.click(chevron.closest('button')!);

    // Find maximize button
    const maximizeBtn = screen.getByTestId('icon-maximize').closest('button');
    fireEvent.click(maximizeBtn!);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      maximized: true,
    });
    expect(mockBringToFront).toHaveBeenCalledWith('test-widget');
  });

  it('handles minimizing', () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    fireEvent.click(screen.getByTestId('glass-card'));
    fireEvent.click(screen.getByTestId('icon-chevron').closest('button')!);

    const minimizeBtn = screen.getByTestId('icon-minimize').closest('button');
    fireEvent.click(minimizeBtn!);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      minimized: true,
    });
  });

  it('handles duplication', () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    fireEvent.click(screen.getByTestId('glass-card'));
    fireEvent.click(screen.getByTestId('icon-chevron').closest('button')!);

    const duplicateBtn = screen.getByTestId('icon-duplicate').closest('button');
    fireEvent.click(duplicateBtn!);

    expect(mockDuplicateWidget).toHaveBeenCalledWith('test-widget');
  });

  it('handles closing with confirmation', () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    fireEvent.click(screen.getByTestId('glass-card'));

    const closeBtn = screen.getByTestId('icon-close').closest('button');
    fireEvent.click(closeBtn!);

    // Should show confirmation overlay
    expect(
      screen.getByText('Close widget? Data will be lost.')
    ).toBeInTheDocument();

    // Click Close in confirmation
    const confirmCloseBtn = screen.getByText('Close', { selector: 'button' });
    fireEvent.click(confirmCloseBtn);

    expect(mockRemoveWidget).toHaveBeenCalledWith('test-widget');
  });

  it('handles title editing', () => {
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
        <div>Widget Content</div>
      </DraggableWindow>
    );

    fireEvent.click(screen.getByTestId('glass-card'));

    // Click on title to edit
    const title = screen.getByText('Test Widget');
    fireEvent.click(title);

    const input = screen.getByDisplayValue('Test Widget');
    fireEvent.change(input, { target: { value: 'New Title' } });
    fireEvent.blur(input);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      customTitle: 'New Title',
    });
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

    expect(screen.queryByTestId('settings-content')).not.toBeInTheDocument();

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

    await waitFor(() => {
      expect(screen.getByTestId('settings-content')).toBeInTheDocument();
    });
  });
});
