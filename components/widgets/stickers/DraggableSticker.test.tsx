import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableSticker } from './DraggableSticker';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WidgetData } from '@/types';

// Mock dependencies
const mockUpdateWidget = vi.fn();
const mockRemoveWidget = vi.fn();
const mockBringToFront = vi.fn();
const mockMoveWidgetLayer = vi.fn();

vi.mock('@/context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: mockUpdateWidget,
    removeWidget: mockRemoveWidget,
    bringToFront: mockBringToFront,
    moveWidgetLayer: mockMoveWidgetLayer,
  }),
}));

vi.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));

describe('DraggableSticker', () => {
  const mockWidget: WidgetData = {
    id: 'sticker-1',
    type: 'sticker',
    x: 100,
    y: 100,
    w: 200,
    h: 200,
    z: 1,
    flipped: false,
    config: {
      url: 'test.png',
      rotation: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows resize and rotate handles immediately when selected', () => {
    render(
      <DraggableSticker widget={mockWidget}>
        <div>Sticker Content</div>
      </DraggableSticker>
    );

    const sticker = screen.getByText('Sticker Content').closest('.absolute');
    if (!sticker) throw new Error('Sticker not found');

    // Select the sticker
    fireEvent.mouseDown(sticker);

    // Verify resize handle (corner)
    const resizeHandle = sticker.querySelector('.cursor-nwse-resize');
    expect(resizeHandle).toBeInTheDocument();

    // Verify rotate handle (top)
    const rotateHandle = sticker.querySelector('.cursor-grab');
    expect(rotateHandle).toBeInTheDocument();
  });

  it('shows the 3-dots menu button when selected and opens menu on click', () => {
    render(
      <DraggableSticker widget={mockWidget}>
        <div>Sticker Content</div>
      </DraggableSticker>
    );

    const sticker = screen.getByText('Sticker Content').closest('.absolute');
    if (!sticker) throw new Error('Sticker not found');

    // Select sticker
    fireEvent.mouseDown(sticker);

    // Find 3-dots menu button by title
    const menuButton = screen.getByTitle('Sticker Options');
    expect(menuButton).toBeInTheDocument();

    // Menu should not be open yet (options not visible)
    expect(screen.queryByText('Bring Forward')).not.toBeInTheDocument();

    // Click menu button
    fireEvent.click(menuButton);

    // Now options should be visible
    expect(screen.getByText('Bring Forward')).toBeInTheDocument();
    expect(screen.getByText('Send Backward')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();

    // Test delete action
    fireEvent.click(screen.getByText('Delete'));
    expect(mockRemoveWidget).toHaveBeenCalledWith('sticker-1');
  });
});
