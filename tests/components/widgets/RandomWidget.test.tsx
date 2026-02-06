/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WidgetData } from '../../../types';
import { RandomWidget } from '../../../components/widgets/random/RandomWidget';

const mockUpdateWidget = vi.fn();

vi.mock('../../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: mockUpdateWidget,
    updateDashboard: vi.fn(),
    rosters: [],
    activeRosterId: null,
    activeDashboard: {
      widgets: [],
    },
  }),
}));

// Mock audioUtils to avoid errors during tests
vi.mock('../../../components/widgets/random/audioUtils', () => ({
  getAudioCtx: vi.fn(),
  playTick: vi.fn(),
  playWinner: vi.fn(),
}));

// Helper to render widget
const renderWidget = (widget: WidgetData) => {
  return render(<RandomWidget widget={widget} />);
};

describe('RandomWidget', () => {
  const mockWidget: WidgetData = {
    id: 'random-1',
    type: 'random',
    x: 0,
    y: 0,
    w: 400,
    h: 400,
    z: 1,
    flipped: false,
    config: {
      mode: 'single',
      firstNames: 'Alice\nBob\nCharlie',
      lastNames: '',
      remainingStudents: ['Alice', 'Bob'],
      lastResult: 'Charlie',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the remaining count when in single mode', () => {
    renderWidget(mockWidget);
    expect(screen.getByText('2 Left')).toBeInTheDocument();
  });

  it('renders the reset button when in single mode and there are remaining students or a last result', () => {
    renderWidget(mockWidget);
    const resetButton = screen.getByTitle('Reset student pool');
    expect(resetButton).toBeInTheDocument();
    expect(resetButton).not.toBeDisabled();
  });

  it('calls updateWidget and resets local state when reset button is clicked', () => {
    renderWidget(mockWidget);
    // Verify initial result is visible
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    const resetButton = screen.getByTitle('Reset student pool');
    fireEvent.click(resetButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith('random-1', {
      config: expect.objectContaining({
        remainingStudents: [],
        lastResult: null,
      }),
    });

    // Verify result is cleared in UI
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });

  it('does not render remaining count when in groups mode', () => {
    const groupWidget = {
      ...mockWidget,
      config: { ...mockWidget.config, mode: 'groups' },
    } as unknown as WidgetData;
    renderWidget(groupWidget);
    expect(screen.queryByText(/Left/)).not.toBeInTheDocument();
  });

  it('disables reset button when no students are remaining and no last result', () => {
    const emptyWidget = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        remainingStudents: [],
        lastResult: null,
      },
    } as unknown as WidgetData;
    renderWidget(emptyWidget);
    const resetButton = screen.getByTitle('Reset student pool');
    expect(resetButton).toBeDisabled();
  });
});
