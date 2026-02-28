import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarWidget, CalendarSettings } from './CalendarWidget';
import { WidgetData, CalendarConfig } from '@/types';
import { useDashboard } from '@/context/useDashboard';
import { useAuth } from '@/context/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

// Mock useDashboard
const mockUpdateWidget = vi.fn();
const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
};

vi.mock('@/context/useDashboard');
vi.mock('@/context/useAuth');
vi.mock('@/hooks/useFeaturePermissions');
vi.mock('@/hooks/useGoogleCalendar');

describe('CalendarWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      customClaims: {},
      selectedBuildings: [],
    });
    (useFeaturePermissions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      subscribeToPermission: vi.fn(),
    });
    (useGoogleCalendar as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      calendarService: null,
      isConnected: false,
    });
  });

  const mockConfig: CalendarConfig = {
    events: [
      { title: 'Math Test', date: 'Monday' },
      { title: 'Field Trip', date: 'Friday' },
    ],
  };

  const mockWidget: WidgetData = {
    id: 'test-widget',
    type: 'calendar',
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    z: 1,
    flipped: false,
    config: mockConfig,
  };

  it('renders events correctly', () => {
    render(<CalendarWidget widget={mockWidget} />);
    expect(screen.getByText('Math Test')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Field Trip')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
  });

  it('renders empty state when no events exist', () => {
    const emptyWidget = {
      ...mockWidget,
      config: { events: [] },
    };
    render(<CalendarWidget widget={emptyWidget} />);
    expect(screen.getByText('No Events')).toBeInTheDocument();
    expect(
      screen.getByText('Flip to add local events or check building sync.')
    ).toBeInTheDocument();
  });
});

describe('CalendarSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      customClaims: {},
      selectedBuildings: [],
    });
    (useFeaturePermissions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      subscribeToPermission: vi.fn(),
    });
    (useGoogleCalendar as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      calendarService: null,
      isConnected: false,
    });
    // Mock window.prompt
    vi.spyOn(window, 'prompt').mockImplementation(() => null);
  });

  const mockConfig: CalendarConfig = {
    events: [{ title: 'Art Class', date: 'Tuesday' }],
  };

  const mockWidget: WidgetData = {
    id: 'test-widget',
    type: 'calendar',
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    z: 1,
    flipped: true,
    config: mockConfig,
  };

  it('renders existing events', () => {
    render(<CalendarSettings widget={mockWidget} />);
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Art Class')).toBeInTheDocument();
  });

  it('adds a new event', async () => {
    const user = userEvent.setup();
    render(<CalendarSettings widget={mockWidget} />);
    const addLocalEventBtn = screen.getByRole('button', {
      name: /add local event/i,
    });
    await user.click(addLocalEventBtn);

    const titleInput = screen.getByPlaceholderText(
      'Event title (e.g., Art, PE)'
    );
    const dateInput = screen.getByPlaceholderText(
      'Day/Date (e.g., Monday, 2024-10-12)'
    );
    const confirmAddBtn = screen.getByRole('button', { name: 'Add Event' });

    await user.type(titleInput, 'Science Fair');
    await user.type(dateInput, 'Wednesday');
    await user.click(confirmAddBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      config: {
        ...mockConfig,
        events: [
          ...mockConfig.events,
          { title: 'Science Fair', date: 'Wednesday' },
        ],
      },
    });
  });

  it('cancels adding a new event', async () => {
    const user = userEvent.setup();
    render(<CalendarSettings widget={mockWidget} />);
    const addLocalEventBtn = screen.getByRole('button', {
      name: /add local event/i,
    });
    await user.click(addLocalEventBtn);

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelBtn);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
    // The Add Local Event button should be visible again
    expect(
      screen.getByRole('button', { name: /add local event/i })
    ).toBeInTheDocument();
  });

  it('removes an event', async () => {
    const user = userEvent.setup();
    const { container } = render(<CalendarSettings widget={mockWidget} />);

    // In the CI structure, the event text is separated into day and title.
    // The trash icon is inside a button next to the event details.
    const removeButton = container
      .querySelector('svg.lucide-trash2')
      ?.closest('button');
    expect(removeButton).toBeInTheDocument();

    if (removeButton) {
      await user.click(removeButton);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
        config: {
          ...mockConfig,
          events: [], // Should be empty after removing the only event
        },
      });
    }
  });
});
