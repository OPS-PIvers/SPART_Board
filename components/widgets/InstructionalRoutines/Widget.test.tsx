/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InstructionalRoutinesWidget } from './Widget';
import { InstructionalRoutinesSettings } from './Settings';
import { vi, describe, it, expect } from 'vitest';
import {
  WidgetData,
  RoutineStep,
  InstructionalRoutinesConfig,
  TimeToolConfig,
  WidgetConfig,
} from '../../../types';

const mockUpdateWidget = vi.fn();
const mockAddWidget = vi.fn();

vi.mock('../../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: mockUpdateWidget,
    gradeFilter: 'all',
    addWidget: mockAddWidget,
    clearAllStickers: vi.fn(),
  }),
}));

vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({
    isAdmin: false,
  }),
}));

vi.mock('../../../hooks/useInstructionalRoutines', () => ({
  useInstructionalRoutines: () => ({
    routines: [],
    saveRoutine: vi.fn(),
    deleteRoutine: vi.fn(),
  }),
}));

const mockWidget: WidgetData = {
  id: 'test-widget',
  type: 'instructionalRoutines',
  w: 400,
  h: 300,
  x: 0,
  y: 0,
  z: 0,
  flipped: false,
  config: {
    selectedRoutineId: null,
    customSteps: [],
    favorites: [],
    scaleMultiplier: 1,
  },
};

describe('InstructionalRoutinesWidget', () => {
  it('renders correctly in library mode', () => {
    render(<InstructionalRoutinesWidget widget={mockWidget} />);
    expect(screen.getByText(/Library/i)).toBeInTheDocument();
  });

  it('selects a routine and shows launch button if attached widgets exist', async () => {
    // 1. Render in Library Mode
    const { rerender } = render(
      <InstructionalRoutinesWidget widget={mockWidget} />
    );

    // 2. Click "Think-Pair-Share" to select it
    const routineCard = screen.getByText('Think-Pair-Share');
    fireEvent.click(routineCard);

    // Verify updateWidget was called with the new selection
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-widget',
      expect.objectContaining({
        config: expect.objectContaining({
          selectedRoutineId: 'think-pair-share',
        }),
      })
    );

    // 3. Simulate re-render with selected routine (since we mocked updateWidget)
    // We need to manually construct the steps that would have been created
    const timerConfig: Partial<TimeToolConfig> = { duration: 60 };
    const expectedSteps: RoutineStep[] = [
      {
        id: '1',
        text: 'Think',
        attachedWidget: {
          type: 'time-tool',
          label: '1 Min Timer',
          config: timerConfig as WidgetConfig,
        },
      },
    ];

    const newConfig: InstructionalRoutinesConfig = {
      ...(mockWidget.config as InstructionalRoutinesConfig),
      selectedRoutineId: 'think-pair-share',
      customSteps: expectedSteps,
    };

    const selectedWidget: WidgetData = {
      ...mockWidget,
      config: newConfig as unknown as WidgetConfig,
    };

    rerender(<InstructionalRoutinesWidget widget={selectedWidget} />);

    // 4. Check for Launch Button
    const launchBtn = screen.getByText(/Launch Tools/i);
    expect(launchBtn).toBeInTheDocument();

    // 5. Click Launch
    fireEvent.click(launchBtn);

    // 6. Verify addWidget calls
    // Wait for staggered timeouts
    await waitFor(
      () => {
        expect(mockAddWidget).toHaveBeenCalledWith(
          'time-tool',
          expect.objectContaining({
            config: expect.objectContaining({ duration: 60 }),
          })
        );
      },
      { timeout: 1000 }
    );
  });
});

describe('InstructionalRoutinesSettings', () => {
  it('renders correctly', () => {
    render(<InstructionalRoutinesSettings widget={mockWidget} />);
    expect(screen.getByText(/Step Editor/i)).toBeInTheDocument();
  });
});
