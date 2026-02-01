import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableWindow } from '../../../components/common/DraggableWindow';
import { WidgetData, GlobalStyle } from '../../../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('lucide-react', () => {
  return {
    Settings: () => <span>Settings</span>,
    X: () => <span>Close</span>,
    Minus: () => <span>Minimize</span>,
    Pencil: () => <span>Edit</span>,
    Camera: () => <span>Camera</span>,
    Maximize: () => <span>Maximize</span>,
    Minimize2: () => <span>Minimize2</span>,
    ChevronRight: () => <span>ChevronRight</span>,
    Copy: () => <span>Copy</span>,
    Eraser: () => <span>Eraser</span>,
    Undo2: () => <span>Undo2</span>,
    Trash2: () => <span>Trash2</span>,
    Highlighter: () => <span>Highlighter</span>,
  };
});

// Mock screenshot hook
vi.mock('../../../hooks/useScreenshot', () => ({
  useScreenshot: () => ({
    takeScreenshot: vi.fn(),
    isFlashing: false,
    isCapturing: false,
  }),
}));

describe('DraggableWindow Performance', () => {
  const mockUpdateWidget = vi.fn();
  const mockRemoveWidget = vi.fn();
  const mockDuplicateWidget = vi.fn();
  const mockBringToFront = vi.fn();
  const mockAddToast = vi.fn();

  const mockWidget: WidgetData = {
    id: 'test-widget',
    type: 'text',
    x: 100,
    y: 100,
    w: 200,
    h: 200,
    z: 1,
    flipped: false,
    minimized: false,
    maximized: false,
    transparency: 1,
    config: { content: 'test', bgColor: 'white', fontSize: 16 },
  };

  const mockGlobalStyle = {
    fontFamily: 'sans',
    windowTransparency: 1,
  } as GlobalStyle;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 200,
      height: 200,
      top: 100,
      left: 100,
      bottom: 300,
      right: 300,
      x: 100,
      y: 100,
      toJSON: () => null,
    })) as unknown as () => DOMRect;
  });

  it('updates widget position only on drag end (optimized behavior)', () => {
    render(
      <DraggableWindow
        widget={mockWidget}
        settings={<div>Settings</div>}
        title="Test Widget"
        updateWidget={mockUpdateWidget}
        removeWidget={mockRemoveWidget}
        duplicateWidget={mockDuplicateWidget}
        bringToFront={mockBringToFront}
        addToast={mockAddToast}
        globalStyle={mockGlobalStyle}
      >
        <div>Content</div>
      </DraggableWindow>
    );

    const widgetElement = screen.getByText('Content').closest('.widget');
    if (!widgetElement) throw new Error('Widget not found');

    // Simulate drag start on the front face (where drag handler is attached)
    const frontFace = widgetElement.querySelector('.front');
    if (!frontFace) throw new Error('Front face not found');

    // Drag start
    fireEvent.pointerDown(frontFace, {
      clientX: 110,
      clientY: 110,
      pointerId: 1,
      button: 0,
    });

    expect(mockBringToFront).toHaveBeenCalledWith(mockWidget.id);

    // Move 1
    fireEvent.pointerMove(window, {
      clientX: 120,
      clientY: 120,
      pointerId: 1,
    });

    // Should NOT call updateWidget yet
    expect(mockUpdateWidget).toHaveBeenCalledTimes(0);

    // Move 2
    fireEvent.pointerMove(window, {
      clientX: 130,
      clientY: 130,
      pointerId: 1,
    });

    // Should NOT call updateWidget yet
    expect(mockUpdateWidget).toHaveBeenCalledTimes(0);

    // End drag
    fireEvent.pointerUp(window, {
      clientX: 130,
      clientY: 130,
      pointerId: 1,
    });

    // Should call updateWidget once on pointerUp
    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);
    expect(mockUpdateWidget).toHaveBeenCalledWith(mockWidget.id, {
      x: 120, // 100 + (130 - 110) = 120
      y: 120, // 100 + (130 - 110) = 120
    });
  });
});
