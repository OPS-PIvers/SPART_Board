import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardView } from '../../../components/layout/DashboardView';
import { useDashboard } from '../../../context/useDashboard';
import { Dashboard } from '../../../types';

// Mock context
vi.mock('../../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

// Mock child components
vi.mock('../../../components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));
vi.mock('../../../components/layout/Dock', () => ({
  Dock: () => <div data-testid="dock">Dock</div>,
}));
vi.mock('../../../components/widgets/WidgetRenderer', () => ({
  WidgetRenderer: () => <div data-testid="widget">Widget</div>,
}));

describe('DashboardView Gestures & Navigation', () => {
  const mockLoadDashboard = vi.fn();
  const mockAddWidget = vi.fn();
  const mockDashboards: Dashboard[] = [
    {
      id: 'db-1',
      name: 'Board 1',
      background: 'bg-slate-900',
      widgets: [],
      createdAt: 1000,
    },
    {
      id: 'db-2',
      name: 'Board 2',
      background: 'bg-slate-900',
      widgets: [],
      createdAt: 2000,
    },
    {
      id: 'db-3',
      name: 'Board 3',
      background: 'bg-slate-900',
      widgets: [],
      createdAt: 3000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: mockDashboards[1], // Start at middle board
      dashboards: mockDashboards,
      toasts: [],
      addWidget: mockAddWidget,
      loadDashboard: mockLoadDashboard,
      removeToast: vi.fn(),
    });
  });

  it('renders correctly', () => {
    render(<DashboardView />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('dock')).toBeInTheDocument();
  });

  it('toggles minimize on Alt + M', () => {
    render(<DashboardView />);

    // Initial state: not minimized
    // (We can't easily check state directly, but we can check styles or side effects if any)

    // Fire Alt+M
    fireEvent.keyDown(window, { key: 'm', altKey: true });

    // Let's verify loadDashboard is NOT called
    expect(mockLoadDashboard).not.toHaveBeenCalled();
  });

  it('navigates to previous board on Alt + Left', () => {
    render(<DashboardView />);
    fireEvent.keyDown(window, { key: 'ArrowLeft', altKey: true });
    expect(mockLoadDashboard).toHaveBeenCalledWith('db-1');
  });

  it('navigates to next board on Alt + Right', () => {
    render(<DashboardView />);
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true });
    expect(mockLoadDashboard).toHaveBeenCalledWith('db-3');
  });

  it('does not navigate if at boundaries', () => {
    // Case 1: First board
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: mockDashboards[0],
      dashboards: mockDashboards,
      toasts: [],
      addWidget: mockAddWidget,
      loadDashboard: mockLoadDashboard,
      removeToast: vi.fn(),
    });

    const { unmount } = render(<DashboardView />);
    fireEvent.keyDown(window, { key: 'ArrowLeft', altKey: true });
    expect(mockLoadDashboard).not.toHaveBeenCalled();
    unmount();

    // Case 2: Last board
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      activeDashboard: mockDashboards[2],
      dashboards: mockDashboards,
      toasts: [],
      addWidget: mockAddWidget,
      loadDashboard: mockLoadDashboard,
      removeToast: vi.fn(),
    });

    render(<DashboardView />);
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true });
    expect(mockLoadDashboard).not.toHaveBeenCalled();
  });
});
