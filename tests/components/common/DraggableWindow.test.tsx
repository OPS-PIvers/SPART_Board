import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableWindow } from '../../../components/common/DraggableWindow';
import { WidgetData, GlobalStyle } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// Mock dependencies
vi.mock('../../../context/useDashboard');
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
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

  const mockGlobalStyle: GlobalStyle = {
    fontFamily: 'sans',
    windowTransparency: 1,
    background: 'bg-slate-100',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as Mock).mockReturnValue({
        activeDashboard: {
            background: 'bg-slate-100',
        }
    });
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

    const children = Array.from(container?.children || []);
    expect(children.indexOf(settingsBtn!)).toBeLessThan(children.indexOf(closeBtn!));
    expect(children.indexOf(closeBtn!)).toBeLessThan(children.indexOf(chevronBtn!));
  });
});
