import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('./GlassCard', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GlassCard: ({ children, className }: any) => (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    <div className={className}>{children}</div>
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
    // Since we switched to useEffect, we might need to wait for the effect to run
    await waitFor(() => {
      expect(screen.getByTestId('settings-content')).toBeInTheDocument();
    });

    // Rerender with flipped = false again
    const unflippedWidget = { ...mockWidget, flipped: false };
    rerender(
      <DraggableWindow
        widget={unflippedWidget}
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

    // Settings should REMAIN in the document (for animation/consistency) because they were already loaded
    // This confirms "lazy initialization" behavior
    expect(screen.getByTestId('settings-content')).toBeInTheDocument();
  });
});
