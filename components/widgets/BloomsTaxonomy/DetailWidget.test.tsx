import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BloomsDetailWidget } from './DetailWidget';
import { useDashboard } from '@/context/useDashboard';
import { useAuth } from '@/context/useAuth';
import { WidgetData, BloomsDetailConfig, BloomsTaxonomyConfig } from '@/types';

vi.mock('@/context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('@/context/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockRemoveWidget = vi.fn();
const mockAddWidget = vi.fn();
const mockAddToast = vi.fn();

const makePyramid = (id: string): WidgetData =>
  ({
    id,
    type: 'blooms-taxonomy',
    x: 0,
    y: 0,
    w: 450,
    h: 550,
    z: 1,
    config: {} satisfies BloomsTaxonomyConfig,
  }) as WidgetData;

const makeDetail = (id: string, parentWidgetId: string): WidgetData =>
  ({
    id,
    type: 'blooms-detail',
    x: 0,
    y: 0,
    w: 450,
    h: 300,
    z: 2,
    config: {
      parentWidgetId,
      level: 'remember',
    } satisfies BloomsDetailConfig,
  }) as WidgetData;

describe('BloomsDetailWidget orphan cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      featurePermissions: [],
      selectedBuildings: [],
    });
  });

  it('does NOT remove itself while its parent pyramid is still on the board', () => {
    const pyramid = makePyramid('pyramid-1');
    const detail = makeDetail('detail-1', 'pyramid-1');

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addWidget: mockAddWidget,
      removeWidget: mockRemoveWidget,
      addToast: mockAddToast,
      activeDashboard: { widgets: [pyramid, detail] },
    });

    render(<BloomsDetailWidget widget={detail} />);

    expect(mockRemoveWidget).not.toHaveBeenCalled();
  });

  // Regression: closing the pyramid used to strand its companion detail
  // panel on the board forever, with no pyramid to reopen or reconnect it.
  it('removes itself once its parent pyramid has been deleted', () => {
    const detail = makeDetail('detail-1', 'pyramid-1');

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addWidget: mockAddWidget,
      removeWidget: mockRemoveWidget,
      addToast: mockAddToast,
      // Pyramid is gone — only the orphaned detail widget remains.
      activeDashboard: { widgets: [detail] },
    });

    render(<BloomsDetailWidget widget={detail} />);

    expect(mockRemoveWidget).toHaveBeenCalledWith('detail-1');
  });
});
