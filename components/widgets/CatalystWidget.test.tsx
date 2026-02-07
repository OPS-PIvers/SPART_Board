import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CatalystConfig, CatalystCategory } from '../../types';
import { CatalystWidget } from './CatalystWidget';

// Mock useDashboard
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

const mockUpdateWidget = vi.fn();
const mockAddWidget = vi.fn();

const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
  addWidget: mockAddWidget,
};

describe('CatalystWidget', () => {
  beforeEach(() => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
    mockUpdateWidget.mockClear();
    mockAddWidget.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  const createWidget = (config: Partial<CatalystConfig> = {}): WidgetData => {
    return {
      id: 'catalyst-1',
      type: 'catalyst',
      x: 0,
      y: 0,
      w: 400,
      h: 400,
      z: 1,
      flipped: false,
      config: {
        activeCategory: null,
        activeStrategyId: null,
        ...config,
      },
    } as WidgetData;
  };

  it('renders default categories when no custom config provided', () => {
    render(<CatalystWidget widget={createWidget()} />);
    expect(screen.getByText('Attention')).toBeInTheDocument();
    expect(screen.getByText('Engage')).toBeInTheDocument();
    expect(screen.getByText('Set Up')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('renders custom categories when provided', () => {
    const customCategories: CatalystCategory[] = [
      {
        id: 'cat1',
        label: 'Custom Cat 1',
        icon: 'Zap',
        color: 'bg-red-500',
        isCustom: true,
      },
      {
        id: 'cat2',
        label: 'Custom Cat 2',
        icon: 'Star',
        color: 'bg-blue-500',
        isCustom: true,
      },
    ];

    render(<CatalystWidget widget={createWidget({ customCategories })} />);

    // With merge behavior, both custom and default categories should be present
    expect(screen.getByText('Custom Cat 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Cat 2')).toBeInTheDocument();
    expect(screen.getByText('Attention')).toBeInTheDocument(); // Default should still be there
  });

  it('overrides default category when custom has same ID', () => {
    const customCategories: CatalystCategory[] = [
      {
        id: 'Get Attention', // Same ID as default
        label: 'Modified Attention',
        icon: 'Zap',
        color: 'bg-red-500',
      },
    ];

    render(<CatalystWidget widget={createWidget({ customCategories })} />);

    // Should see modified version, not original
    expect(screen.getByText('Modified Attention')).toBeInTheDocument();
    expect(screen.queryByText('Attention')).not.toBeInTheDocument();
  });

  it('excludes removed category IDs from display', () => {
    render(
      <CatalystWidget
        widget={createWidget({
          removedCategoryIds: ['Get Attention', 'Engage'], // Remove two defaults
        })}
      />
    );

    // Should not see removed categories
    expect(screen.queryByText('Attention')).not.toBeInTheDocument();
    expect(screen.queryByText('Engage')).not.toBeInTheDocument();

    // Should still see remaining defaults
    expect(screen.getByText('Set Up')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('excludes removed routine IDs from display', () => {
    // Remove 'Signal for Silence' routine (default in 'Get Attention')
    render(
      <CatalystWidget
        widget={createWidget({
          activeCategory: 'Get Attention',
          removedRoutineIds: ['signal-silence'], // Remove a default routine
        })}
      />
    );

    // Should not see removed routine
    expect(screen.queryByText('Signal for Silence')).not.toBeInTheDocument();

    // Should still see other routines in 'Get Attention' category if they exist
    // (If there are no other routines, the widget would show empty state)
  });

  it('combines removed IDs with custom overrides correctly', () => {
    const customCategories: CatalystCategory[] = [
      {
        id: 'cat1',
        label: 'Custom Cat 1',
        icon: 'Zap',
        color: 'bg-red-500',
        isCustom: true,
      },
    ];

    render(
      <CatalystWidget
        widget={createWidget({
          customCategories,
          removedCategoryIds: ['Get Attention'], // Remove a default
        })}
      />
    );

    // Should see custom category
    expect(screen.getByText('Custom Cat 1')).toBeInTheDocument();

    // Should not see removed default
    expect(screen.queryByText('Attention')).not.toBeInTheDocument();

    // Should see other defaults
    expect(screen.getByText('Engage')).toBeInTheDocument();
    expect(screen.getByText('Set Up')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });
});
