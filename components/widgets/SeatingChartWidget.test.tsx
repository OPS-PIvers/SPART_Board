import { render, screen, fireEvent, act } from '@testing-library/react';
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
const mockAddToast = vi.fn();

const mockRoster = {
  id: 'roster-1',
  name: 'Class 1',
  students: [
    { id: 's1', firstName: 'Alice', lastName: 'A' },
    { id: 's2', firstName: 'Bob', lastName: 'B' },
    { id: 's3', firstName: 'Charlie', lastName: 'C' },
    { id: 's4', firstName: 'David', lastName: 'D' },
    { id: 's5', firstName: 'Eve', lastName: 'E' },
  ],
};

const mockDashboardContext: Partial<DashboardContextValue> = {
  updateWidget: mockUpdateWidget,
  rosters: [mockRoster],
  activeRosterId: 'roster-1',
  addToast: mockAddToast,
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
      template: 'freeform',
      templateColumns: 6,
      ...configOverrides,
    } as SeatingChartConfig,
    x: 0,
    y: 0,
    w: 800,
    h: 600,
    z: 1,
    flipped: false,
  });

  describe('Setup Mode & Templates', () => {
    it('should switch to Setup mode when "Setup" is clicked', () => {
      const widget = createWidget();
      render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));
      expect(screen.getByText('Template')).toBeInTheDocument();
    });

    it('should apply "Rows" template', () => {
      let widget = createWidget();
      const { rerender } = render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));
      fireEvent.click(screen.getByText('Rows'));

      // Simulate prop update from parent
      widget = {
        ...widget,
        config: { ...widget.config, template: 'rows' } as SeatingChartConfig,
      };
      rerender(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Apply Layout'));

      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;
      expect(config.furniture.length).toBeGreaterThan(0);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Applied rows layout'),
        'success'
      );
    });

    it('should apply "Horseshoe" template', () => {
      let widget = createWidget();
      const { rerender } = render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));
      fireEvent.click(screen.getByText('Horseshoe'));

      // Simulate prop update
      widget = {
        ...widget,
        config: {
          ...widget.config,
          template: 'horseshoe',
        } as SeatingChartConfig,
      };
      rerender(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Apply Layout'));

      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;
      // Horseshoe layout is fixed at 23 desks
      expect(config.furniture).toHaveLength(23);
    });

    it('should apply "Pods" template', () => {
      let widget = createWidget();
      const { rerender } = render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));
      fireEvent.click(screen.getByText('Pods'));

      // Simulate prop update
      widget = {
        ...widget,
        config: { ...widget.config, template: 'pods' } as SeatingChartConfig,
      };
      rerender(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Apply Layout'));

      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;
      expect(config.furniture.length).toBeGreaterThan(0);
    });

    it('should update column count for Rows template', () => {
      const widget = createWidget({ template: 'rows' });
      render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));
      const colInput = screen.getByDisplayValue('6');
      fireEvent.change(colInput, { target: { value: '4' } });

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-id', {
        config: expect.objectContaining({
          templateColumns: 4,
        }),
      });
    });

    it('should disable Apply Layout button if no students and trying to apply rows', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...mockDashboardContext,
        rosters: [],
      } as unknown as DashboardContextValue);

      // Pre-select 'rows' template
      const widget = createWidget({ template: 'rows' });
      render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));

      const applyButton = screen.getByText('Apply Layout').closest('button');
      expect(applyButton).toBeDisabled();
    });
  });

  describe('Furniture Actions', () => {
    it('should add a desk manually', () => {
      const widget = createWidget();
      render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));

      // Find the 'Desk' button in the sidebar (it's an icon button with label)
      // The button contains the text 'Desk'
      const deskButton = screen.getByText('Desk').closest('button');
      fireEvent.click(deskButton!);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;
      expect(config.furniture).toHaveLength(1);
      expect(config.furniture[0].type).toBe('desk');
    });

    it('should rotate a selected item', () => {
      let widget = createWidget({
        furniture: [
          {
            id: 'desk-1',
            type: 'desk',
            x: 100,
            y: 100,
            width: 80,
            height: 65,
            rotation: 0,
          } as FurnitureItem,
        ],
      });
      const { container, rerender } = render(
        <SeatingChartWidget widget={widget} />
      );

      fireEvent.click(screen.getByText('Setup'));

      // Select the item
      const item = container.querySelector('div[style*="left: 100px"]');
      if (!item) throw new Error('Item not found');

      // Click to select
      fireEvent.pointerDown(item);
      fireEvent.pointerUp(window);
      fireEvent.click(item);

      // Verify selection ring
      expect(item.className).toContain('ring-2');

      // Click 'Rotate Right' button in floating menu
      const rotateBtn = screen.getByTitle('Rotate Right');
      fireEvent.click(rotateBtn);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;
      expect(config.furniture[0].rotation).toBe(45);

      // Verify Rotate Left
      // Simulate update
      widget = {
          ...widget,
          config: { ...widget.config, furniture: [{ ...widget.config.furniture[0], rotation: 45 }] } as SeatingChartConfig
      };
      rerender(<SeatingChartWidget widget={widget} />);

      // Re-select because rerender might reset local selection state if not handled carefully?
      // Actually state is preserved on rerender in React unless key changes.
      // But let's check if the floating menu is still there.
      // The floating menu depends on 'selectedId'. 'selectedIds' is local state.
      // Rerender preserves local state.

      const rotateLeftBtn = screen.getByTitle('Rotate Left');
      fireEvent.click(rotateLeftBtn);

      const lastCall2 = (mockUpdateWidget as Mock).mock.lastCall;
      const config2 = lastCall2[1].config as SeatingChartConfig;
      expect(config2.furniture[0].rotation).toBe(0); // 45 - 45 = 0
    });

    it('should duplicate a selected item', () => {
      const widget = createWidget({
        furniture: [
          {
            id: 'desk-1',
            type: 'desk',
            x: 100,
            y: 100,
            width: 80,
            height: 65,
            rotation: 0,
          } as FurnitureItem,
        ],
      });
      const { container } = render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));

      const item = container.querySelector('div[style*="left: 100px"]');
      if (!item) throw new Error('Item not found');

      // Select
      fireEvent.click(item);

      // Click Duplicate
      const duplicateBtn = screen.getByTitle('Duplicate');
      fireEvent.click(duplicateBtn);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;
      expect(config.furniture).toHaveLength(2);
      // The new item should be offset by 20px and snapped to grid
      expect(config.furniture[1].x).toBeGreaterThan(100);
      expect(config.furniture[1].y).toBeGreaterThan(100);
    });

    it('should delete a selected item', () => {
      const widget = createWidget({
        furniture: [
          {
            id: 'desk-1',
            type: 'desk',
            x: 100,
            y: 100,
            width: 80,
            height: 65,
            rotation: 0,
          } as FurnitureItem,
        ],
      });
      const { container } = render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));

      const item = container.querySelector('div[style*="left: 100px"]');
      if (!item) throw new Error('Item not found');

      // Select
      fireEvent.click(item);

      // Click Delete
      const deleteBtn = screen.getByTitle('Delete');
      fireEvent.click(deleteBtn);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;
      expect(config.furniture).toHaveLength(0);
    });
  });

  describe('Advanced Interactions', () => {

    it('should assign a student by clicking student then desk', () => {
      const widget = createWidget({
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
      });
      const { container } = render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Assign'));

      // Click a student in the sidebar
      const studentName = 'Alice A';
      const studentEl = screen.getByText(studentName);
      fireEvent.click(studentEl);

      // Verify student is selected (border-indigo-500)
      expect(studentEl.className).toContain('border-indigo-500');

      // Click the desk
      const desk = container.querySelector('div[style*="left: 100px"]');
      fireEvent.click(desk!);

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;
      expect(config.assignments['Alice A']).toBe('desk-1');
    });

    it('should randomly assign all students', () => {
      const widget = createWidget({
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
          {
            id: 'desk-2',
            type: 'desk',
            x: 200,
            y: 200,
            width: 60,
            height: 50,
            rotation: 0,
          } as FurnitureItem,
        ],
      });
      render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Assign'));
      fireEvent.click(screen.getByText('Add All Random'));

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const config = lastCall[1].config as SeatingChartConfig;

      // We have 5 students and 2 desks. 2 should be assigned.
      expect(Object.keys(config.assignments)).toHaveLength(2);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Assigned 2 students'),
        'info'
      );
    });

    it('should resize an item', () => {
      const widget = createWidget({
        furniture: [
          {
            id: 'desk-1',
            type: 'desk',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            rotation: 0,
          } as FurnitureItem,
        ],
      });
      const { container } = render(<SeatingChartWidget widget={widget} />);

      fireEvent.click(screen.getByText('Setup'));

      const item = container.querySelector('div[style*="left: 100px"]');
      if (!item) throw new Error('Item not found');

      // Select to show resize handle
      fireEvent.click(item);

      // Find resize handle (bottom-right)
      // It has cursor-nwse-resize class
      const handle = container.querySelector('.cursor-nwse-resize');
      if (!handle) throw new Error('Resize handle not found');

      // Start resize
      fireEvent.pointerDown(handle, { clientX: 200, clientY: 200 });

      // Move (expand)
      fireEvent(
        window,
        new PointerEvent('pointermove', { clientX: 220, clientY: 220 })
      );

      // Stop resize
      fireEvent(window, new PointerEvent('pointerup'));

      expect(mockUpdateWidget).toHaveBeenCalled();
      const lastCall = (mockUpdateWidget as Mock).mock.lastCall;
      const updates = lastCall[1];
      // Note: specific coordinate assertions depend on getCanvasScale which relies on offsetWidth.
      // In JSDOM, offsetWidth is 0 unless mocked.
      // However, the test should at least verify updateWidget was called for a resize action.
      // The implementation uses getCanvasScale which returns 1 if offsetWidth is 0.
      // (220-200) = 20px delta. New width = 100 + 20 = 120.
      // Snapped to grid (20): 120 is multiple of 20.

      // But updateFurniture is called with partial update.
      // The mock argument is checking arguments passed to updateFurniture -> updateWidget.
      // In SeatingChartWidget, updateFurniture calls updateWidget with partial furniture list.
      // Let's inspect the furniture update.
      const updatedItem = updates.config.furniture[0];
      expect(updatedItem.width).toBeGreaterThan(100);
      expect(updatedItem.height).toBeGreaterThan(100);
    });
  });

  describe('Interaction Logic', () => {
    it('should only call updateWidget on pointerUp, not on pointerMove', () => {
      const widget = createWidget({
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
      });
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

    it('should select an item on click and not deselect it immediately', () => {
      const widget = createWidget({
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
      });
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
      expect(screen.getByTitle('Rotate Left')).toBeTruthy();
    });

    it('should deselect an item when clicking the canvas', () => {
      const widget = createWidget({
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
      });
      const { container } = render(<SeatingChartWidget widget={widget} />);

      // 1. Switch to Setup mode
      fireEvent.click(screen.getByText('Setup'));

      // 2. Find the furniture item and canvas
      const furnitureItem = container.querySelector(
        'div[style*="left: 100px"]'
      );
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
