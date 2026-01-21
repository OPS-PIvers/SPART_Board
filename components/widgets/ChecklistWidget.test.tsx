/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ChecklistSettings } from './ChecklistWidget';
import { useDashboard } from '../../context/useDashboard';
import {
  InstructionalRoutinesConfig,
  WidgetData,
  ChecklistConfig,
} from '../../types';

// Mock dependencies
vi.mock('../../context/useDashboard');
vi.mock('../common/RosterModeControl', () => ({
  RosterModeControl: () => <div data-testid="roster-mode-control" />,
}));
vi.mock('lucide-react', () => ({
  CheckSquare: () => <div />,
  Square: () => <div />,
  ListPlus: () => <div />,
  Type: () => <div />,
  Users: () => <div />,
  RefreshCw: () => <div />,
  BookOpen: () => <div />,
}));

const mockUpdateWidget = vi.fn();
const mockAddToast = vi.fn();

const mockWidget: WidgetData = {
  id: 'checklist-1',
  type: 'checklist',
  x: 0,
  y: 0,
  w: 4,
  h: 4,
  z: 1,
  flipped: true,
  config: {
    items: [],
    mode: 'manual',
    scaleMultiplier: 1,
  } as ChecklistConfig,
};

const mockRoutineWidget: WidgetData = {
  id: 'routine-1',
  type: 'instructionalRoutines',
  x: 0,
  y: 0,
  w: 4,
  h: 4,
  z: 1,
  flipped: false,
  config: {
    selectedRoutineId: 'routine-1',
    customSteps: [
      { id: 'step-1', text: 'Step 1' },
      { id: 'step-2', text: 'Step 2' },
    ],
  } as InstructionalRoutinesConfig,
};

describe('ChecklistSettings Nexus Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      activeDashboard: {
        widgets: [mockWidget, mockRoutineWidget],
      },
    });
  });

  it('imports steps from active Instructional Routine', () => {
    render(<ChecklistSettings widget={mockWidget} />);

    const importButton = screen.getByText('Sync');
    fireEvent.click(importButton);

    expect(mockAddToast).toHaveBeenCalledWith(
      'Imported steps from Routine!',
      'success'
    );
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'checklist-1',
      expect.objectContaining({
        config: expect.objectContaining({
          mode: 'manual',
          items: expect.arrayContaining([
            expect.objectContaining({ text: 'Step 1', completed: false }),
            expect.objectContaining({ text: 'Step 2', completed: false }),
          ]),
        }),
      })
    );
  });

  it('shows error if no Instructional Routine widget exists', () => {
    (useDashboard as unknown as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      activeDashboard: {
        widgets: [mockWidget], // No routine widget
      },
    });

    render(<ChecklistSettings widget={mockWidget} />);

    const importButton = screen.getByText('Sync');
    fireEvent.click(importButton);

    expect(mockAddToast).toHaveBeenCalledWith(
      'No Instructional Routines widget found!',
      'error'
    );
    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('shows info if Instructional Routine has no steps', () => {
    const emptyRoutineWidget = {
      ...mockRoutineWidget,
      config: { ...mockRoutineWidget.config, customSteps: [] },
    };

    (useDashboard as unknown as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      activeDashboard: {
        widgets: [mockWidget, emptyRoutineWidget],
      },
    });

    render(<ChecklistSettings widget={mockWidget} />);
    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });
});
