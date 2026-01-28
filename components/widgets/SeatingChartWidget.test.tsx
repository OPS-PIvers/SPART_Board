/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SeatingChartWidget } from './SeatingChartWidget';
import { useDashboard } from '../../context/useDashboard';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { WidgetData, SeatingChartConfig } from '../../types';
import { DashboardContextValue } from '../../context/DashboardContextValue';

vi.mock('../../context/useDashboard');

const mockUpdateWidget = vi.fn();
const mockAddToast = vi.fn();

const mockDashboardContext: Partial<DashboardContextValue> = {
  updateWidget: mockUpdateWidget,
  addToast: mockAddToast,
  rosters: [
    {
      id: 'roster-1',
      name: 'Class A',
      createdAt: Date.now(),
      students: [
        { id: '1', firstName: 'Alice', lastName: 'A' },
        { id: '2', firstName: 'Bob', lastName: 'B' },
        { id: '3', firstName: 'Charlie', lastName: 'C' },
      ],
    },
  ],
  activeRosterId: 'roster-1',
};

// Mock window.confirm
const mockConfirm = vi.fn(() => true);

describe('SeatingChartWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboard).mockReturnValue(
      mockDashboardContext as DashboardContextValue
    );

    // Use spyOn for window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(mockConfirm);

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
    window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createWidget = (
    configOverrides: Partial<SeatingChartConfig> = {}
  ): WidgetData => ({
    id: 'test-widget-id',
    type: 'seating-chart',
    config: {
      furniture: [],
      assignments: {},
      gridSize: 20,
      rosterMode: 'class',
      ...configOverrides,
    } as SeatingChartConfig,
    x: 0,
    y: 0,
    w: 800,
    h: 600,
    z: 1,
    flipped: false,
  });

  it('Setup Mode: Adds furniture', () => {
    const widget = createWidget();
    render(<SeatingChartWidget widget={widget} />);

    // Switch to Setup
    fireEvent.click(screen.getByText('Setup'));

    // Find "Desk" button (by text or icon, text is cleaner here)
    fireEvent.click(screen.getByText('Desk'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-id', {
      config: expect.objectContaining({
        furniture: expect.arrayContaining([
          expect.objectContaining({ type: 'desk' }),
        ]),
      }),
    });
  });

  it('Setup Mode: Clears all furniture', () => {
    const widget = createWidget({
      furniture: [
        {
          id: 'f1',
          type: 'desk',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          rotation: 0,
        },
      ],
    });
    render(<SeatingChartWidget widget={widget} />);

    fireEvent.click(screen.getByText('Setup'));
    fireEvent.click(screen.getByText('Clear All'));

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-id', {
      config: expect.objectContaining({
        furniture: [],
        assignments: {},
      }),
    });
  });

  it('Setup Mode: Resizes furniture', () => {
    const widget = createWidget({
      furniture: [
        {
          id: 'f1',
          type: 'desk',
          x: 100,
          y: 100,
          width: 60,
          height: 50,
          rotation: 0,
        },
      ],
    });
    const { container } = render(<SeatingChartWidget widget={widget} />);

    fireEvent.click(screen.getByText('Setup'));

    // Select furniture
    const item = container.querySelector('div[style*="left: 100px"]');
    if (!item) throw new Error('Item not found');

    // Simulate selection
    fireEvent.pointerDown(item);
    fireEvent.pointerUp(window);
    fireEvent.click(item);

    // Find resize handle
    const handle = container.querySelector('.cursor-nwse-resize');
    if (!handle) throw new Error('Handle not found');

    // Drag handle
    fireEvent.pointerDown(handle, { clientX: 160, clientY: 150 }); // Current bottom-right
    fireEvent.pointerMove(window, { clientX: 180, clientY: 170 }); // Move +20, +20
    fireEvent.pointerUp(window);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-id', {
      config: expect.objectContaining({
        furniture: expect.arrayContaining([
          expect.objectContaining({ width: 80, height: 80 }),
        ]),
      }),
    });
  });

  it('Assign Mode: Assigns student via drag and drop', () => {
    const widget = createWidget({
      furniture: [
        {
          id: 'f1',
          type: 'desk',
          x: 100,
          y: 100,
          width: 60,
          height: 50,
          rotation: 0,
        },
      ],
    });
    const { container } = render(<SeatingChartWidget widget={widget} />);

    fireEvent.click(screen.getByText('Assign'));

    // Check unassigned students list
    expect(screen.getByText('Alice A')).toBeInTheDocument();

    const furnitureItem = container.querySelector('div[style*="left: 100px"]');
    if (!furnitureItem) throw new Error('Furniture not found');

    // Mock Drag Event data
    const mockDataTransfer = {
      getData: vi.fn(() => 'Alice A'),
      dropEffect: 'none',
    };

    // Drop
    fireEvent.drop(furnitureItem, {
      dataTransfer: mockDataTransfer,
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-id', {
      config: expect.objectContaining({
        assignments: { 'Alice A': 'f1' },
      }),
    });
  });

  it('Assign Mode: Add All Randomly', () => {
    const widget = createWidget({
      furniture: [
        {
          id: 'f1',
          type: 'desk',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          rotation: 0,
        },
        {
          id: 'f2',
          type: 'desk',
          x: 100,
          y: 0,
          width: 50,
          height: 50,
          rotation: 0,
        },
      ],
    });
    render(<SeatingChartWidget widget={widget} />);

    fireEvent.click(screen.getByText('Assign'));
    fireEvent.click(screen.getByText('Add All Random'));

    expect(mockUpdateWidget).toHaveBeenCalled();
    const lastCall = (mockUpdateWidget as Mock).mock.lastCall as [
      string,
      { config: SeatingChartConfig },
    ];
    const assignments = lastCall[1].config.assignments;

    // Should assign at least 2 students to 2 desks
    expect(Object.keys(assignments).length).toBeGreaterThanOrEqual(2);
  });

  it('Interact Mode: Pick Random', () => {
    const widget = createWidget({
      furniture: [
        {
          id: 'f1',
          type: 'desk',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          rotation: 0,
        },
      ],
      assignments: { 'Alice A': 'f1' },
    });
    render(<SeatingChartWidget widget={widget} />);

    // Verify Interact mode is default
    expect(screen.getByText('Interact')).toHaveClass('text-indigo-600');

    fireEvent.click(screen.getByText('Pick Random'));

    // Should start interval
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Eventually it stops
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // We can't easily check visual highlight without deeper inspection of state/classes,
    // but we can check no errors thrown and timers ran.
    // Ideally we'd check if `setRandomHighlight` was called, but it's internal state.
    // We can check if the furniture element receives a specific class (like bg-yellow-200) during animation.

    // Let's re-render or check screen after some time
    // Since `vi.advanceTimersByTime` runs synchronously in tests, the state update might be batched.
    // But testing library `act` handles this.
  });

  it('Removes assignment when clicking X', () => {
    const widget = createWidget({
      furniture: [
        {
          id: 'f1',
          type: 'desk',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          rotation: 0,
        },
      ],
      assignments: { 'Alice A': 'f1' },
    });
    render(<SeatingChartWidget widget={widget} />);

    fireEvent.click(screen.getByText('Assign'));

    // The student name should be visible in the desk
    const studentLabel = screen.getByText('Alice A');
    expect(studentLabel).toBeInTheDocument();

    // The X button should be next to it
    const removeBtn = studentLabel.parentElement?.querySelector('button');
    if (!removeBtn) throw new Error('Remove button not found');

    fireEvent.click(removeBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-id', {
      config: expect.objectContaining({
        assignments: {},
      }),
    });
  });
});
