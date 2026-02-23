import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableWindow } from '../../../components/common/DraggableWindow';
import { WidgetData, GlobalStyle } from '../../../types';
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

describe('DraggableWindow (Tests folder)', () => {
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

  const mockActions = {
    updateWidget: vi.fn(),
    removeWidget: vi.fn(),
    duplicateWidget: vi.fn(),
    bringToFront: vi.fn(),
    addToast: vi.fn(),
    resetWidgetSize: vi.fn(),
    deleteAllWidgets: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders toolbar buttons in the correct order', () => {
    render(
      <DraggableWindow
        widget={mockWidget}
        settings={<div>Settings</div>}
        title="Test Widget"
        globalStyle={mockGlobalStyle}
        actions={mockActions}
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
    const settingsBtn = settingsIcon.closest('button');
    const closeBtn = closeIcon.closest('button');
    const chevronBtn = chevronIcon.closest('button');

    const container = settingsBtn?.parentElement;
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

  it('uses portal and correct z-index when maximized', () => {
    const maximizedWidget = { ...mockWidget, maximized: true };

    render(
      <div id="dashboard-root">
        <DraggableWindow
          widget={maximizedWidget}
          settings={<div>Settings</div>}
          title="Maximized Widget"
          globalStyle={mockGlobalStyle}
          actions={mockActions}
        >
          <div data-testid="maximized-content">Maximized Content</div>
        </DraggableWindow>
      </div>
    );

    // When maximized, it should NOT be inside #dashboard-root if it's portalled to body
    const dashboardRoot = document.getElementById('dashboard-root');
    const content = screen.getByTestId('maximized-content');

    expect(dashboardRoot).not.toContainElement(content);
    expect(document.body).toContainElement(content);

    // Check z-index (10500)
    const widgetCard = content.closest('.widget') as HTMLElement;
    expect(widgetCard.style.zIndex).toBe('10500');

    // Check dimensions
    expect(widgetCard.style.width).toBe('100vw');
    expect(widgetCard.style.height).toBe('100vh');
    expect(widgetCard.style.left).toBe('0px');
    expect(widgetCard.style.top).toBe('0px');
  });
});
