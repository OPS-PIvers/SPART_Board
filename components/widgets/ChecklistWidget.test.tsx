import { render, screen, fireEvent } from '@testing-library/react';
import { ChecklistSettings } from './ChecklistWidget';
import { useDashboard } from '../../context/useDashboard';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  WidgetData,
  ChecklistConfig,
  InstructionalRoutinesConfig,
  WidgetType,
} from '../../types';

vi.mock('../../context/useDashboard');

const mockUpdateWidget = vi.fn();
const mockAddToast = vi.fn();

const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
  addToast: mockAddToast,
  activeDashboard: {
    widgets: [],
  },
};

describe('ChecklistSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  it('imports steps from instructional routines widget', () => {
    const widget: WidgetData = {
      id: 'checklist-id',
      type: 'checklist',
      config: { items: [], mode: 'manual' } as ChecklistConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: true,
    };

    const routinesWidget: WidgetData = {
      id: 'routines-id',
      type: 'instructionalRoutines' as WidgetType,
      config: {
        customSteps: [
          { id: '1', text: 'Step One' },
          { id: '2', text: 'Step Two' },
        ],
      } as InstructionalRoutinesConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: false,
    };

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        widgets: [routinesWidget],
      },
    });

    render(<ChecklistSettings widget={widget} />);

    const importButton = screen.getByText('Import Steps');
    fireEvent.click(importButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'checklist-id',
      expect.objectContaining({
        config: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ text: 'Step One', completed: false }),
            expect.objectContaining({ text: 'Step Two', completed: false }),
          ]) as unknown,
          mode: 'manual',
        }) as unknown,
      })
    );
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Imported 2 steps'),
      'success'
    );
  });

  it('shows tip and disables button if no routine widget found', () => {
    const widget: WidgetData = {
      id: 'checklist-id',
      type: 'checklist',
      config: { items: [], mode: 'manual' } as ChecklistConfig,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      z: 1,
      flipped: true,
    };

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        widgets: [],
      },
    });

    render(<ChecklistSettings widget={widget} />);

    const importButton = screen.getByText('Import Steps');
    expect(importButton).toBeDisabled();

    expect(
      screen.getByText(
        'Tip: Add an Instructional Routines widget to import steps.'
      )
    ).toBeInTheDocument();
  });
});
