import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LunchCountWidget } from './Widget';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { WidgetData, LunchCountConfig } from '../../../types';

// Mock dependencies
vi.mock('../../../context/useDashboard');
vi.mock('../../../context/useAuth');

const mockDashboardContext = {
  updateWidget: vi.fn(),
  addToast: vi.fn(),
  rosters: [
    {
      id: 'roster-1',
      name: 'Class 1A',
      students: [
        { id: 's1', firstName: 'John', lastName: 'Doe' },
        { id: 's2', firstName: 'Jane', lastName: 'Smith' },
      ],
    },
  ],
  activeRosterId: 'roster-1',
  activeDashboard: {
    id: 'dash-1',
    widgets: [
      {
        id: 'lunch-1',
        type: 'lunchCount',
        activeRoster: ['John Doe', 'Jane Smith'],
      },
    ],
  },
};

const mockAuthContext = {
  user: { displayName: 'Teacher' },
  featurePermissions: [],
};

const mockNutrisliceData = {
  days: [
    {
      date: new Date().toISOString().split('T')[0],
      menu_items: [
        {
          is_section_title: false,
          section_name: 'Entrees',
          food: { name: 'Pizza' },
        },
      ],
    },
  ],
};

describe('LunchCountWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockAuthContext
    );

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockNutrisliceData)),
      })
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createWidget = (config: Partial<LunchCountConfig> = {}): WidgetData => {
    return {
      id: 'lunch-1',
      type: 'lunchCount',
      x: 0,
      y: 0,
      w: 400,
      h: 300,
      z: 1,
      config: {
        schoolSite: 'schumann-elementary',
        rosterMode: 'class',
        assignments: {},
        // Pre-populate cachedMenu to prevent auto-sync loop in tests
        cachedMenu: {
          hotLunch: 'Pizza',
          bentoBox: 'Bento',
          date: new Date().toISOString(),
        },
        lastSyncDate: new Date().toISOString(),
        ...config,
      },
    } as WidgetData;
  };

  it('renders student chips from roster', async () => {
    render(<LunchCountWidget widget={createWidget()} />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('correctly shows students when activeRoster is missing from widget but present in context', async () => {
    // Override mock to remove activeRoster from widget
    const contextWithoutWidgetRoster = {
      ...mockDashboardContext,
      activeDashboard: {
        id: 'dash-1',
        widgets: [
          {
            id: 'lunch-1',
            type: 'lunchCount',
            // activeRoster is missing here
          },
        ],
      },
    };
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      contextWithoutWidgetRoster
    );

    render(<LunchCountWidget widget={createWidget()} />);

    // It should NOT show the empty state message anymore
    expect(
      screen.queryByText('All students accounted for!')
    ).not.toBeInTheDocument();

    // It should now show the students
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('allows dragging student chips', async () => {
    render(<LunchCountWidget widget={createWidget()} />);

    const chip = await screen.findByText('John Doe');

    expect(chip).toHaveAttribute('draggable', 'true');

    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    };

    fireEvent.dragStart(chip, {
      dataTransfer,
    });

    expect(dataTransfer.setData).toHaveBeenCalledWith('student', 'John Doe');
    expect(dataTransfer.effectAllowed).toBe('move');
  });

  it('updates assignments on drop', async () => {
    render(<LunchCountWidget widget={createWidget()} />);

    const hotLunchLabel = await screen.findByText('Hot Lunch');
    const hotLunchContainer = hotLunchLabel.closest('.group');
    expect(hotLunchContainer).toBeInTheDocument();

    if (!hotLunchContainer) throw new Error('Hot Lunch container not found');

    const dataTransfer = {
      getData: vi.fn().mockReturnValue('John Doe'),
    };

    fireEvent.drop(hotLunchContainer, { dataTransfer });

    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    expect(mockDashboardContext.updateWidget).toHaveBeenCalledWith(
      'lunch-1',
      expect.objectContaining({
        config: expect.objectContaining({
          assignments: expect.objectContaining({
            'John Doe': 'hot',
          }),
        }),
      })
    );
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  });

  it('should not clear persisted roster if global rosters are empty (loading state)', () => {
    // Roster is persisted on the widget
    const widgetWithRoster = {
      ...createWidget(),
      activeRoster: ['Persisted Student'],
    } as unknown as WidgetData;

    // Context has activeRosterId but rosters array is empty (loading)
    const contextLoading = {
      ...mockDashboardContext,
      rosters: [],
      activeDashboard: { id: 'dash-1', widgets: [] },
      activeRosterId: 'roster-1',
    };
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      contextLoading
    );

    render(<LunchCountWidget widget={widgetWithRoster} />);

    // Roster should still be visible (falling back to persisted data)
    expect(screen.getByText('Persisted Student')).toBeInTheDocument();

    // updateWidget should NOT have been called to clear it
    expect(mockDashboardContext.updateWidget).not.toHaveBeenCalledWith(
      'lunch-1',
      expect.objectContaining({ activeRoster: [] })
    );
  });
});
