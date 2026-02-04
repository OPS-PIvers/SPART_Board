import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableWindow } from '../../../components/common/DraggableWindow';
import { WidgetData, GlobalStyle } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// Mock dependencies
vi.mock('../../../context/useDashboard');
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

describe('DraggableWindow', () => {
  const mockUpdateWidget = vi.fn();
  const mockRemoveWidget = vi.fn();
  const mockDuplicateWidget = vi.fn();
  const mockBringToFront = vi.fn();
  const mockAddToast = vi.fn();

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

  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as Mock).mockReturnValue({
      activeDashboard: {
        background: 'bg-slate-100',
      },
    });

    // Mock Pointer Events methods not in JSDOM
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn();
  });

  it('renders toolbar buttons in the correct order', () => {
    render(
      <DraggableWindow
        widget={mockWidget}
        settings={<div>Settings</div>}
        title="Test Widget"
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

    // Simulate click to open toolbar
    const widget = screen.getByText('Content').closest('.widget');
    if (!widget) throw new Error('Widget not found');
    fireEvent.click(widget);

    // Check for icons
    const settingsIcon = screen.getByTestId('settings-icon');
    const chevronIcon = screen.getByTestId('chevron-icon');
    const closeIcon = screen.getByTestId('close-icon');

    expect(settingsIcon).toBeInTheDocument();
    expect(chevronIcon).toBeInTheDocument();
    expect(closeIcon).toBeInTheDocument();

    // Verify order: Settings -> Close -> Chevron
    // We can check their parent container and the order of children
    const settingsBtn = settingsIcon.closest('button');
    const closeBtn = closeIcon.closest('button');
    const chevronBtn = chevronIcon.closest('button');

    const container = settingsBtn?.parentElement;
    expect(container).toBe(chevronBtn?.parentElement);
    expect(container).toBe(closeBtn?.parentElement);

    const children = Array.from(container?.children ?? []);
    if (!settingsBtn || !closeBtn || !chevronBtn) {
      throw new Error('Buttons not found');
    }

    expect(children.indexOf(settingsBtn)).toBeLessThan(
      children.indexOf(closeBtn)
    );
    expect(children.indexOf(closeBtn)).toBeLessThan(
      children.indexOf(chevronBtn)
    );
  });

  it('updates DOM directly and skips updateWidget when dragging normal widget', () => {
    const normalWidget: WidgetData = {
      ...mockWidget,
      id: 'normal-widget',
      type: 'text', // Not in POSITION_AWARE_WIDGETS
    };

    render(
      <DraggableWindow
        widget={normalWidget}
        settings={<div>Settings</div>}
        title="Normal Widget"
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

    const widgetEl = screen
      .getByText('Content')
      .closest('.widget') as HTMLElement;
    const handle = widgetEl.querySelector('.front') as HTMLElement; // Drag handle is actually the front face

    // Drag Start
    fireEvent.pointerDown(handle, {
      clientX: 150,
      clientY: 150,
      pointerId: 1,
      buttons: 1,
    });

    // Drag Move
    fireEvent.pointerMove(handle, {
      clientX: 160, // Moved by 10px
      clientY: 160,
      pointerId: 1,
      buttons: 1,
    });

    // updateWidget should NOT be called during drag for normal widget
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // DOM should be updated directly
    // newX = 160 - (150 - 100) = 110
    // newY = 160 - (150 - 100) = 110
    expect(widgetEl.style.left).toBe('110px');
    expect(widgetEl.style.top).toBe('110px');

    // Drag End
    fireEvent.pointerUp(handle, {
      clientX: 160,
      clientY: 160,
      pointerId: 1,
      buttons: 1,
    });

    // updateWidget SHOULD be called on drag end
    expect(mockUpdateWidget).toHaveBeenCalledWith('normal-widget', {
      x: 110,
      y: 110,
    });
  });

  it('calls updateWidget when dragging position-aware widget', () => {
    const awareWidget: WidgetData = {
      ...mockWidget,
      id: 'aware-widget',
      type: 'catalyst', // In POSITION_AWARE_WIDGETS
    };

    render(
      <DraggableWindow
        widget={awareWidget}
        settings={<div>Settings</div>}
        title="Aware Widget"
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

    const widgetEl = screen
      .getByText('Content')
      .closest('.widget') as HTMLElement;
    const handle = widgetEl.querySelector('.front') as HTMLElement;

    // Drag Start
    fireEvent.pointerDown(handle, {
      clientX: 150,
      clientY: 150,
      pointerId: 1,
      buttons: 1,
    });

    // Drag Move
    fireEvent.pointerMove(handle, {
      clientX: 160,
      clientY: 160,
      pointerId: 1,
      buttons: 1,
    });

    // updateWidget SHOULD be called during drag for aware widget
    expect(mockUpdateWidget).toHaveBeenCalledWith('aware-widget', {
      x: 110,
      y: 110,
    });
  });
});
