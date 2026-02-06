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

    expect(screen.getByText('Custom Cat 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Cat 2')).toBeInTheDocument();
    expect(screen.queryByText('Attention')).not.toBeInTheDocument();
  });

  it('renders custom routines when category is active', () => {
    // Need a custom routine
    const customRoutines = [
      {
        id: 'custom-routine-1',
        title: 'My Custom Routine',
        category: 'Get Attention', // Uses default category
        icon: 'Zap',
        shortDesc: 'Short Desc',
        instructions: 'Instructions',
        associatedWidgets: [],
      },
    ];

    // Active category 'Get Attention'
    render(
      <CatalystWidget
        widget={createWidget({
          activeCategory: 'Get Attention',
          customRoutines,
        })}
      />
    );

    // Should see default routines for Get Attention + Custom Routine
    // 'Signal for Silence' is a default routine in 'Get Attention'
    expect(screen.getByText('Signal for Silence')).toBeInTheDocument();
    expect(screen.getByText('My Custom Routine')).toBeInTheDocument();
  });
});
