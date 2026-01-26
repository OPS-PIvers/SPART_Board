import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WidgetRenderer } from '../../../components/widgets/WidgetRenderer';
import { WidgetData, GlobalStyle, WidgetType } from '../../../types';

// Mock hooks
vi.mock('../../../hooks/useWindowSize', () => ({
  useWindowSize: () => ({ width: 1024, height: 768 }),
}));

vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({
    canAccessFeature: () => true,
    user: { uid: 'test-user' },
  }),
}));

// Mock child components
vi.mock('../../../components/common/DraggableWindow', () => ({
  DraggableWindow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="draggable-window">{children}</div>
  ),
}));

vi.mock('../../../components/common/ScalableWidget', () => ({
  ScalableWidget: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scalable-widget">{children}</div>
  ),
}));

vi.mock('../../../components/widgets/LiveControl', () => ({
  LiveControl: () => <div data-testid="live-control" />,
}));

vi.mock('../../../components/widgets/stickers/StickerItemWidget', () => ({
  StickerItemWidget: () => <div data-testid="sticker-widget" />,
}));

// Mock WidgetRegistry
vi.mock('../../../components/widgets/WidgetRegistry', () => ({
  WIDGET_COMPONENTS: {
    'time-tool': ({ widget }: { widget: WidgetData }) => (
      <div data-testid="mock-widget">Mock Widget Content {widget.id}</div>
    ),
  },
  WIDGET_SETTINGS_COMPONENTS: {
    'time-tool': () => <div data-testid="mock-settings">Settings</div>,
  },
}));

describe('WidgetRenderer', () => {
  const mockUpdateSessionConfig = vi.fn();
  const mockUpdateSessionBackground = vi.fn();
  const mockStartSession = vi.fn();
  const mockEndSession = vi.fn();
  const mockRemoveStudent = vi.fn();
  const mockToggleFreezeStudent = vi.fn();
  const mockToggleGlobalFreeze = vi.fn();
  const mockUpdateWidget = vi.fn();
  const mockRemoveWidget = vi.fn();
  const mockDuplicateWidget = vi.fn();
  const mockBringToFront = vi.fn();
  const mockAddToast = vi.fn();

  const defaultWidget: WidgetData = {
    id: 'widget-1',
    type: 'time-tool' as WidgetType,
    x: 100,
    y: 100,
    w: 400,
    h: 400,
    z: 1,
    flipped: false,
    config: { some: 'config' },
  };

  const defaultGlobalStyle: GlobalStyle = {
    fontFamily: 'sans',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWidget = (
    props: Partial<React.ComponentProps<typeof WidgetRenderer>> = {}
  ) => {
    return render(
      <WidgetRenderer
        widget={defaultWidget}
        isStudentView={false}
        session={null}
        isLive={false}
        students={[]}
        updateSessionConfig={mockUpdateSessionConfig}
        updateSessionBackground={mockUpdateSessionBackground}
        startSession={mockStartSession}
        endSession={mockEndSession}
        removeStudent={mockRemoveStudent}
        toggleFreezeStudent={mockToggleFreezeStudent}
        toggleGlobalFreeze={mockToggleGlobalFreeze}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={defaultGlobalStyle}
        {...props}
      />
    );
  };

  it('renders widget content', () => {
    renderWidget();
    expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
  });

  it('does NOT call updateSessionConfig when NOT live', () => {
    renderWidget({ isLive: false });

    // Fast forward time to pass debounce
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockUpdateSessionConfig).not.toHaveBeenCalled();
  });

  it('calls updateSessionConfig when live', () => {
    renderWidget({ isLive: true });

    // Fast forward time to pass debounce
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockUpdateSessionConfig).toHaveBeenCalledWith(defaultWidget.config);
  });

  it('debounces updateSessionConfig calls', () => {
    const { rerender } = renderWidget({ isLive: true });

    // Initial render triggers effect

    // Update widget prop to simulate config change
    const newWidget = { ...defaultWidget, config: { some: 'new config' } };

    rerender(
      <WidgetRenderer
        widget={newWidget}
        isStudentView={false}
        session={null}
        isLive={true} // Still live
        students={[]}
        updateSessionConfig={mockUpdateSessionConfig}
        updateSessionBackground={mockUpdateSessionBackground}
        startSession={mockStartSession}
        endSession={mockEndSession}
        removeStudent={mockRemoveStudent}
        toggleFreezeStudent={mockToggleFreezeStudent}
        toggleGlobalFreeze={mockToggleGlobalFreeze}
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={defaultGlobalStyle}
      />
    );

    // Fast forward a bit, but not enough for debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Should not have been called yet
    expect(mockUpdateSessionConfig).not.toHaveBeenCalled();

    // Fast forward remaining time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now it should fire with the LATEST config
    expect(mockUpdateSessionConfig).toHaveBeenCalledWith(newWidget.config);
    expect(mockUpdateSessionConfig).toHaveBeenCalledTimes(1);
  });
});
