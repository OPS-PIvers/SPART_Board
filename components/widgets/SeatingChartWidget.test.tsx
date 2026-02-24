import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeatingChartWidget } from './SeatingChartWidget';
import {
  generateColumnsLayout,
  generateHorseshoeLayout,
  generatePodsLayout,
} from './seatingChartLayouts';
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

describe('SeatingChartWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboard).mockReturnValue(
      mockDashboardContext as DashboardContextValue
    );
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
    const lastCall = (mockUpdateWidget as Mock).mock.calls[
      (mockUpdateWidget as Mock).mock.calls.length - 1
    ] as [string, { config: SeatingChartConfig }];
    expect(lastCall).toBeDefined();

    const [id, updates] = lastCall;
    expect(id).toBe('test-widget-id');

    const newFurniture = updates.config.furniture[0];
    expect(newFurniture.x).toBe(120);
    expect(newFurniture.y).toBe(120);
  });

  it('should select an item on click and not deselect it immediately', () => {
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

    // 3. Click the item (PointerDown + PointerUp + Click)
    fireEvent.pointerDown(furnitureItem);
    fireEvent.pointerUp(window);
    fireEvent.click(furnitureItem);

    // 4. Verify selection (the item should have a ring class or the floating menu should be visible)
    expect(furnitureItem.className).toContain('ring-2');
    expect(screen.getByTitle('Rotate Left')).toBeInTheDocument();
  });

  it('should deselect an item when clicking the canvas', () => {
    const widget = createWidget();
    const { container } = render(<SeatingChartWidget widget={widget} />);

    // 1. Switch to Setup mode
    fireEvent.click(screen.getByText('Setup'));

    // 2. Find the furniture item and canvas
    const furnitureItem = container.querySelector('div[style*="left: 100px"]');
    const canvas = container.querySelector('.flex-1.relative.bg-white');

    if (!furnitureItem || !canvas) throw new Error('Elements not found');

    // 3. Select the item
    fireEvent.pointerDown(furnitureItem);
    fireEvent.pointerUp(window);
    fireEvent.click(furnitureItem);
    expect(furnitureItem.className).toContain('ring-2');

    // 4. Click the canvas
    fireEvent.click(canvas);

    // 5. Verify deselection
    expect(furnitureItem.className).not.toContain('ring-2');
    expect(screen.queryByTitle('Rotate Left')).toBeNull();
  });

  describe('Roster & Assignments', () => {
    const rosterWidget = createWidget();
    const mockRoster = {
      id: 'roster-1',
      name: 'Class A',
      students: [
        { id: 's1', firstName: 'Alice', lastName: 'A' },
        { id: 's2', firstName: 'Bob', lastName: 'B' },
        { id: 's3', firstName: 'Charlie', lastName: 'C' },
      ],
    };

    beforeEach(() => {
      // Override the mock for these tests to include a roster
      vi.mocked(useDashboard).mockReturnValue({
        ...mockDashboardContext,
        rosters: [mockRoster],
        activeRosterId: 'roster-1',
      } as DashboardContextValue);
    });

    it('renders students from roster in Assign mode', () => {
      render(<SeatingChartWidget widget={rosterWidget} />);

      // Switch to Assign mode
      fireEvent.click(screen.getByText('Assign'));

      // Check if students are listed
      expect(screen.getByText('Alice A')).toBeInTheDocument();
      expect(screen.getByText('Bob B')).toBeInTheDocument();
      expect(screen.getByText('Charlie C')).toBeInTheDocument();
    });

    it('assigns a student to a desk on click', () => {
      const { container } = render(
        <SeatingChartWidget widget={rosterWidget} />
      );

      // Switch to Assign mode
      fireEvent.click(screen.getByText('Assign'));

      // Click a student
      fireEvent.click(screen.getByText('Alice A'));

      // Find a desk and click it
      const desk = container.querySelector('div[style*="left: 100px"]');
      if (!desk) throw new Error('Desk not found');

      fireEvent.click(desk);

      // Verify updateWidget was called with new assignment
      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;
      expect(config.assignments['Alice A']).toBe('desk-1');
    });

    it('removes assignment on click', () => {
      const widgetWithAssignment = {
        ...rosterWidget,
        config: {
          ...rosterWidget.config,
          assignments: { 'Alice A': 'desk-1' },
        },
      };
      render(<SeatingChartWidget widget={widgetWithAssignment} />);

      fireEvent.click(screen.getByText('Assign'));

      // Verify Alice is assigned (rendered on the desk)
      // The FurnitureItemRenderer renders the name
      expect(screen.getByText('Alice A')).toBeInTheDocument();

      // Click the remove button (x)
      const removeBtn = screen.getByText('×');
      fireEvent.click(removeBtn);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;
      expect(config.assignments['Alice A']).toBeUndefined();
    });

    it('randomly assigns students to desks', () => {
      // We need more desks for random assignment
      const widgetMoreDesks = {
        ...rosterWidget,
        config: {
          ...rosterWidget.config,
          furniture: [
            {
              id: 'd1',
              type: 'desk',
              x: 0,
              y: 0,
              width: 50,
              height: 50,
              rotation: 0,
            },
            {
              id: 'd2',
              type: 'desk',
              x: 50,
              y: 0,
              width: 50,
              height: 50,
              rotation: 0,
            },
            {
              id: 'd3',
              type: 'desk',
              x: 100,
              y: 0,
              width: 50,
              height: 50,
              rotation: 0,
            },
          ],
          assignments: {},
        } as SeatingChartConfig,
      };

      render(<SeatingChartWidget widget={widgetMoreDesks} />);
      fireEvent.click(screen.getByText('Assign'));

      fireEvent.click(screen.getByText('Add All Random'));

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;

      // All 3 students should be assigned
      expect(Object.keys(config.assignments)).toHaveLength(3);
      expect(config.assignments['Alice A']).toBeDefined();
      expect(config.assignments['Bob B']).toBeDefined();
      expect(config.assignments['Charlie C']).toBeDefined();
    });
  });

  describe('Furniture Operations', () => {
    // Use the base widget but ensure we are in Setup mode
    const furnitureWidget = createWidget();

    it('adds new furniture from Setup sidebar', () => {
      render(<SeatingChartWidget widget={furnitureWidget} />);
      fireEvent.click(screen.getByText('Setup'));

      // Click to add a Table (Rect)
      fireEvent.click(screen.getByText('Table (Rect)'));

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;

      // Should have 2 items now (original desk + new table)
      expect(config.furniture).toHaveLength(2);
      const newItem = config.furniture[1];
      expect(newItem.type).toBe('table-rect');
    });

    it('rotates furniture using floating menu', () => {
      const { container } = render(
        <SeatingChartWidget widget={furnitureWidget} />
      );
      fireEvent.click(screen.getByText('Setup'));

      const desk = container.querySelector('div[style*="left: 100px"]');
      if (!desk) throw new Error('Desk not found');

      // Select the desk
      fireEvent.click(desk);

      // Click Rotate Right button
      const rotateBtn = screen.getByTitle('Rotate Right');
      fireEvent.click(rotateBtn);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;

      expect(config.furniture[0].rotation).toBe(45);
    });

    it('duplicates furniture using floating menu', () => {
      const { container } = render(
        <SeatingChartWidget widget={furnitureWidget} />
      );
      fireEvent.click(screen.getByText('Setup'));

      const desk = container.querySelector('div[style*="left: 100px"]');
      if (!desk) throw new Error('Desk not found');

      // Select the desk
      fireEvent.click(desk);

      // Click Duplicate button
      const duplicateBtn = screen.getByTitle('Duplicate');
      fireEvent.click(duplicateBtn);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;

      expect(config.furniture).toHaveLength(2);
    });

    it('deletes furniture using floating menu', () => {
      const { container } = render(
        <SeatingChartWidget widget={furnitureWidget} />
      );
      fireEvent.click(screen.getByText('Setup'));

      const desk = container.querySelector('div[style*="left: 100px"]');
      if (!desk) throw new Error('Desk not found');

      // Select the desk
      fireEvent.click(desk);

      // Click Delete button
      const deleteBtn = screen.getByTitle('Delete');
      fireEvent.click(deleteBtn);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;

      expect(config.furniture).toHaveLength(0);
    });

    it('multi-selects and deletes group', async () => {
      const user = userEvent.setup();
      // Create widget with 2 desks
      const widget2Desks = {
        ...furnitureWidget,
        config: {
          ...furnitureWidget.config,
          furniture: [
            {
              id: 'd1',
              type: 'desk',
              x: 0,
              y: 0,
              width: 50,
              height: 50,
              rotation: 0,
            },
            {
              id: 'd2',
              type: 'desk',
              x: 100,
              y: 0,
              width: 50,
              height: 50,
              rotation: 0,
            },
          ],
        } as SeatingChartConfig,
      };

      const { container } = render(<SeatingChartWidget widget={widget2Desks} />);
      await user.click(screen.getByText('Setup'));

      const d1 = container.querySelector('div[style*="left: 0px"]');
      const d2 = container.querySelector('div[style*="left: 100px"]');
      if (!d1 || !d2) throw new Error('Desks not found');

      // Click first desk
      await user.click(d1);

      // Re-query d2 to ensure we have the fresh DOM node after re-render
      const d2Fresh = container.querySelector('div[style*="left: 100px"]');
      if (!d2Fresh) throw new Error('d2 not found');

      // Ctrl+Click second desk
      await user.keyboard('{Control>}');
      await user.click(d2Fresh);
      await user.keyboard('{/Control}');

      // Check for group action bar
      expect(screen.getByText('2 selected')).toBeInTheDocument();

      // Click delete all selected
      const deleteGroupBtn = screen.getByTitle('Delete all selected');
      await user.click(deleteGroupBtn);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;

      expect(config.furniture).toHaveLength(0);
    });

    it('resizes furniture', () => {
      const { container } = render(
        <SeatingChartWidget widget={furnitureWidget} />
      );
      fireEvent.click(screen.getByText('Setup'));

      const desk = container.querySelector('div[style*="left: 100px"]');
      if (!desk) throw new Error('Desk not found');

      // Click desk to select
      fireEvent.click(desk);

      // Find resize handle (bottom-right corner)
      // It has cursor-nwse-resize class
      const handle = container.querySelector('.cursor-nwse-resize');
      if (!handle) throw new Error('Resize handle not found');

      fireEvent.pointerDown(handle, { clientX: 160, clientY: 150 });

      fireEvent(
        window,
        new PointerEvent('pointermove', {
          clientX: 180, // Moved +20
          clientY: 170, // Moved +20
          bubbles: true,
        })
      );

      fireEvent(window, new PointerEvent('pointerup', { bubbles: true }));

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.calls[
        (mockUpdateWidget as Mock).mock.calls.length - 1
      ];
      const config = lastCall[1].config;

      // Original size 60x50. Grid 20.
      // New width: 60 + 20 = 80.
      // New height: 50 + 20 = 70 -> snapped to 80.
      expect(config.furniture[0].width).toBe(80);
      expect(config.furniture[0].height).toBe(80);
    });
  });
});

// ---------------------------------------------------------------------------
// Pure layout generator tests — no React rendering needed
// ---------------------------------------------------------------------------

const CANVAS_W = 400;
const CANVAS_H = 400;
const GRID = 20;

const allSnapped = (items: { x: number; y: number }[]) =>
  items.every((i) => i.x % GRID === 0 && i.y % GRID === 0);

const allUniqueIds = (items: { id: string }[]) =>
  new Set(items.map((i) => i.id)).size === items.length;

const allDesks = (items: { type: string }[]) =>
  items.every((i) => i.type === 'desk');

describe('generateColumnsLayout', () => {
  it('returns empty array for 0 students', () => {
    expect(generateColumnsLayout(0, 6, CANVAS_W, CANVAS_H, GRID)).toEqual([]);
  });

  it('returns correct desk count for 30 students in 6 columns', () => {
    expect(generateColumnsLayout(30, 6, CANVAS_W, CANVAS_H, GRID)).toHaveLength(
      30
    );
  });

  it('does not exceed student count when columns × desksPerColumn > students', () => {
    // 5 students, 3 columns → desksPerColumn=2 → 6 slots but only 5 filled
    expect(generateColumnsLayout(5, 3, CANVAS_W, CANVAS_H, GRID)).toHaveLength(
      5
    );
  });

  it('handles a single student', () => {
    expect(generateColumnsLayout(1, 1, CANVAS_W, CANVAS_H, GRID)).toHaveLength(
      1
    );
  });

  it('snaps all positions to the grid', () => {
    expect(
      allSnapped(generateColumnsLayout(15, 3, CANVAS_W, CANVAS_H, GRID))
    ).toBe(true);
  });

  it('all items are desks', () => {
    expect(
      allDesks(generateColumnsLayout(10, 2, CANVAS_W, CANVAS_H, GRID))
    ).toBe(true);
  });

  it('all items have unique IDs', () => {
    expect(
      allUniqueIds(generateColumnsLayout(12, 3, CANVAS_W, CANVAS_H, GRID))
    ).toBe(true);
  });
});

describe('generateHorseshoeLayout', () => {
  // The horseshoe generates a fixed 23-desk layout regardless of roster size:
  // outer U = 4 left + 6 bottom + 4 right (14), inner U = 3 left + 3 bottom + 3 right (9).
  const FIXED_DESK_COUNT = 23;

  it('always returns 23 desks regardless of student count', () => {
    expect(generateHorseshoeLayout(0, CANVAS_W, CANVAS_H, GRID)).toHaveLength(
      FIXED_DESK_COUNT
    );
    expect(generateHorseshoeLayout(30, CANVAS_W, CANVAS_H, GRID)).toHaveLength(
      FIXED_DESK_COUNT
    );
    expect(generateHorseshoeLayout(2, CANVAS_W, CANVAS_H, GRID)).toHaveLength(
      FIXED_DESK_COUNT
    );
  });

  it('side arm desks are rotated inward (90° or 270°), bottom rows are 0°', () => {
    const items = generateHorseshoeLayout(0, CANVAS_W, CANVAS_H, GRID);
    // All rotations should be 0, 90, or 270 only
    expect(items.every((i) => [0, 90, 270].includes(i.rotation))).toBe(true);
    // Some desks must be rotated (the arm desks)
    expect(items.some((i) => i.rotation !== 0)).toBe(true);
  });

  it('snaps all positions to the grid', () => {
    expect(
      allSnapped(generateHorseshoeLayout(20, CANVAS_W, CANVAS_H, GRID))
    ).toBe(true);
  });

  it('all items are desks', () => {
    expect(
      allDesks(generateHorseshoeLayout(15, CANVAS_W, CANVAS_H, GRID))
    ).toBe(true);
  });

  it('all items have unique IDs', () => {
    expect(
      allUniqueIds(generateHorseshoeLayout(10, CANVAS_W, CANVAS_H, GRID))
    ).toBe(true);
  });
});

describe('generatePodsLayout', () => {
  it('returns empty array for 0 students', () => {
    expect(generatePodsLayout(0, CANVAS_W, CANVAS_H, GRID)).toEqual([]);
  });

  it('returns correct desk count for 30 students (7 pods of 4 + 1 pod of 2)', () => {
    expect(generatePodsLayout(30, CANVAS_W, CANVAS_H, GRID)).toHaveLength(30);
  });

  it('returns correct desk count for an exact multiple of 4', () => {
    expect(generatePodsLayout(8, CANVAS_W, CANVAS_H, GRID)).toHaveLength(8);
  });

  it('handles a single student', () => {
    expect(generatePodsLayout(1, CANVAS_W, CANVAS_H, GRID)).toHaveLength(1);
  });

  it('snaps all positions to the grid', () => {
    expect(allSnapped(generatePodsLayout(12, CANVAS_W, CANVAS_H, GRID))).toBe(
      true
    );
  });

  it('all items are desks', () => {
    expect(allDesks(generatePodsLayout(9, CANVAS_W, CANVAS_H, GRID))).toBe(
      true
    );
  });

  it('all items have unique IDs', () => {
    expect(allUniqueIds(generatePodsLayout(16, CANVAS_W, CANVAS_H, GRID))).toBe(
      true
    );
  });
});
