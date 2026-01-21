import { render, screen, fireEvent } from '@testing-library/react';
import { SeatingChartWidget } from './SeatingChartWidget';
import { useDashboard } from '../../context/useDashboard';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { WidgetData, SeatingChartConfig, FurnitureItem } from '../../types';
import { DashboardContextValue } from '../../context/DashboardContextValue';

vi.mock('../../context/useDashboard');

const mockUpdateWidget = vi.fn();

const mockDashboardContext: Partial<DashboardContextValue> = {
  updateWidget: mockUpdateWidget,
  rosters: [],
  activeRosterId: null,
  addToast: vi.fn(),
};

describe('SeatingChartWidget Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboard).mockReturnValue(
      mockDashboardContext as DashboardContextValue
    );

    // Mock PointerEvent since JSDOM doesn't fully support it
    class MockPointerEvent extends Event {
      clientX: number;
      clientY: number;
      pointerId: number;
      constructor(type: string, props: PointerEventInit) {
        super(type, { bubbles: true, ...props });
        this.clientX = props.clientX ?? 0;
        this.clientY = props.clientY ?? 0;
        this.pointerId = props.pointerId ?? 1;
      }
    }
    // Using unknown first to safely cast to the incompatible window type if needed,
    // though typically this is accepted if shapes align.
    window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createWidget = (): WidgetData => ({
    id: 'test-widget-id',
    type: 'seating-chart',
    config: {
      furniture: [
        {
          id: 'desk-1',
          type: 'desk',
          x: 100,
          y: 100,
          width: 60,
          height: 50,
          rotation: 0,
        } as FurnitureItem,
      ],
      assignments: {},
      gridSize: 20,
      rosterMode: 'class',
    } as SeatingChartConfig,
    x: 0,
    y: 0,
    w: 800,
    h: 600,
    z: 1,
    flipped: false,
  });

  it('should only call updateWidget on pointerUp, not on pointerMove', () => {
    const widget = createWidget();
    const { container } = render(<SeatingChartWidget widget={widget} />);

    // 1. Switch to Setup mode
    const setupButton = screen.getByText('Setup');
    fireEvent.click(setupButton);

    // 2. Find the furniture item
    const furnitureItem = container.querySelector(
      'div[style*="left: 100px"][style*="top: 100px"]'
    );
    expect(furnitureItem).toBeTruthy();

    if (!furnitureItem) throw new Error('Furniture item not found');

    // 3. Start dragging (PointerDown)
    fireEvent.pointerDown(furnitureItem, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      bubbles: true,
    });

    // 4. Move (PointerMove)
    fireEvent(
      window,
      new PointerEvent('pointermove', {
        clientX: 120,
        clientY: 120,
        bubbles: true,
      })
    );

    // EXPECTATION: updateWidget should NOT be called yet (optimization)
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // 5. Stop dragging (PointerUp)
    fireEvent(
      window,
      new PointerEvent('pointerup', {
        bubbles: true,
      })
    );

    // 6. Now it SHOULD be called
    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);

    // Check arguments
    const lastCall = (mockUpdateWidget as Mock).mock.lastCall as [
      string,
      { config: SeatingChartConfig },
    ];
    expect(lastCall).toBeDefined();

    const [id, updates] = lastCall;
    expect(id).toBe('test-widget-id');

    const newFurniture = updates.config.furniture[0];
    expect(newFurniture.x).toBe(120);
    expect(newFurniture.y).toBe(120);
  });
});
