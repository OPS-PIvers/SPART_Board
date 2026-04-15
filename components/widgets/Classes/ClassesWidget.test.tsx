import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import ClassesWidget from './ClassesWidget';
import { useDashboard } from '@/context/useDashboard';

vi.mock('@/context/useDashboard');

describe('ClassesWidget (slim active-class selector)', () => {
  const defaultDashboardMock = {
    rosters: [] as Record<string, unknown>[],
    setActiveRoster: vi.fn() as Mock,
    activeRosterId: null as string | null,
  };

  const mockWidget = {
    id: '1',
    type: 'classes' as const,
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    z: 1,
    flipped: false,
    config: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as Mock).mockReturnValue(defaultDashboardMock);
  });

  it('renders empty state with CTA when no rosters exist', () => {
    render(<ClassesWidget widget={mockWidget} />);
    expect(screen.getByText(/no classes/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /manage classes/i })
    ).toBeInTheDocument();
  });

  it('empty-state CTA dispatches open-sidebar with section: classes', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<ClassesWidget widget={mockWidget} />);
    await user.click(screen.getByRole('button', { name: /manage classes/i }));

    const event = dispatchSpy.mock.calls
      .map(([e]) => e)
      .find((e) => e.type === 'open-sidebar');
    expect(event).toBeDefined();
    expect((event as CustomEvent<{ section?: string }>).detail?.section).toBe(
      'classes'
    );

    dispatchSpy.mockRestore();
  });

  it('renders active class hero and "Switch To" list for other rosters', () => {
    (useDashboard as Mock).mockReturnValue({
      ...defaultDashboardMock,
      rosters: [
        { id: 'r1', name: 'Period 3 Biology', students: new Array(24) },
        { id: 'r2', name: 'Period 5 Chemistry', students: new Array(19) },
      ],
      activeRosterId: 'r1',
    });

    render(<ClassesWidget widget={mockWidget} />);

    expect(screen.getByText(/active class/i)).toBeInTheDocument();
    expect(screen.getByText('Period 3 Biology')).toBeInTheDocument();
    expect(screen.getByText('24 Students')).toBeInTheDocument();

    // Other roster appears in the switch list
    expect(screen.getByText(/switch to/i)).toBeInTheDocument();
    expect(screen.getByText('Period 5 Chemistry')).toBeInTheDocument();
  });

  it('shows "No Class Selected" hero when activeRosterId is null', () => {
    (useDashboard as Mock).mockReturnValue({
      ...defaultDashboardMock,
      rosters: [{ id: 'r1', name: 'Homeroom', students: [] }],
      activeRosterId: null,
    });

    render(<ClassesWidget widget={mockWidget} />);
    expect(screen.getByText(/no class selected/i)).toBeInTheDocument();
    expect(screen.getByText(/pick a class below/i)).toBeInTheDocument();
  });

  it('clicking a row in "Switch To" sets that roster active', async () => {
    const user = userEvent.setup();
    const setActive = vi.fn();
    (useDashboard as Mock).mockReturnValue({
      ...defaultDashboardMock,
      rosters: [
        { id: 'r1', name: 'Class A', students: [] },
        { id: 'r2', name: 'Class B', students: [] },
      ],
      activeRosterId: 'r1',
      setActiveRoster: setActive,
    });

    render(<ClassesWidget widget={mockWidget} />);
    await user.click(screen.getByRole('button', { name: /class b/i }));
    expect(setActive).toHaveBeenCalledWith('r2');
  });

  it('footer "Manage Classes" dispatches open-sidebar', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (useDashboard as Mock).mockReturnValue({
      ...defaultDashboardMock,
      rosters: [{ id: 'r1', name: 'Class A', students: [] }],
      activeRosterId: 'r1',
    });

    render(<ClassesWidget widget={mockWidget} />);
    await user.click(screen.getByRole('button', { name: /manage classes/i }));

    const event = dispatchSpy.mock.calls
      .map(([e]) => e)
      .find((e) => e.type === 'open-sidebar');
    expect(event).toBeDefined();
    expect((event as CustomEvent<{ section?: string }>).detail?.section).toBe(
      'classes'
    );

    dispatchSpy.mockRestore();
  });
});
