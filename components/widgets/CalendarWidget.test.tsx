import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarWidget, CalendarSettings } from './CalendarWidget';
import { WidgetData, CalendarConfig } from '@/types';
import { useDashboard } from '@/context/useDashboard';

// Mock useDashboard
const mockUpdateWidget = vi.fn();
const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
};

vi.mock('@/context/useDashboard');

describe('CalendarWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
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
      screen.getByText('Flip to add calendar events.')
    ).toBeInTheDocument();
  });
});

describe('CalendarSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
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
    expect(screen.getByText('Tuesday: Art Class')).toBeInTheDocument();
  });

  it('adds a new event', async () => {
    const user = userEvent.setup();
    const promptSpy = vi
      .spyOn(window, 'prompt')
      .mockReturnValueOnce('Science Fair') // First prompt: Title
      .mockReturnValueOnce('Wednesday'); // Second prompt: Date

    render(<CalendarSettings widget={mockWidget} />);
    const addButton = screen.getByRole('button', { name: /add event/i });
    await user.click(addButton);

    expect(promptSpy).toHaveBeenCalledTimes(2);
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

  it('does not add event if prompt is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'prompt').mockReturnValue(null);

    render(<CalendarSettings widget={mockWidget} />);
    const addButton = screen.getByRole('button', { name: /add event/i });
    await user.click(addButton);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('removes an event', async () => {
    const user = userEvent.setup();
    render(<CalendarSettings widget={mockWidget} />);

    // Find the row containing the event text, then find the button within it
    const eventText = screen.getByText('Tuesday: Art Class');
    const eventRow = eventText.closest('div');
    expect(eventRow).toBeInTheDocument();

    if (eventRow) {
      // The delete button is the only button inside the event row
      const removeButton = within(eventRow).getByRole('button');
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
