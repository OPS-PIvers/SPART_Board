import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleConfigurationPanel } from './ScheduleConfigurationPanel';
import { ScheduleGlobalConfig } from '@/types';

// Mock BUILDINGS
vi.mock('@/config/buildings', () => ({
  BUILDINGS: [
    { id: 'b1', name: 'Building 1' },
    { id: 'b2', name: 'Building 2' },
  ],
}));

describe('ScheduleConfigurationPanel', () => {
  const mockConfig: ScheduleGlobalConfig = {
    blockedDates: ['2026-01-01'],
    buildingDefaults: {
      b1: {
        buildingId: 'b1',
        items: [
          { id: 'item1', task: 'Task 1', startTime: '09:00', endTime: '10:00' },
        ],
        googleCalendarIds: ['cal1'],
      },
    },
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial config', () => {
    render(
      <ScheduleConfigurationPanel config={mockConfig} onChange={mockOnChange} />
    );

    expect(screen.getByText('Global Blocked Dates')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Task 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('cal1')).toBeInTheDocument();
  });

  it('adds a blocked date', () => {
    render(
      <ScheduleConfigurationPanel config={mockConfig} onChange={mockOnChange} />
    );

    const addButton = screen.getByText('Add Date');
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[0][0] as ScheduleGlobalConfig;
    expect(lastCall.blockedDates).toHaveLength(2);
    expect(lastCall.blockedDates).toContain('2026-01-01');
  });

  it('adds a default schedule item', () => {
    render(
      <ScheduleConfigurationPanel config={mockConfig} onChange={mockOnChange} />
    );

    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[0][0] as ScheduleGlobalConfig;
    expect(lastCall.buildingDefaults.b1.items).toHaveLength(2);
    expect(lastCall.buildingDefaults.b1.items[1].task).toBe('New Default Task');
  });

  it('adds a Google Calendar ID', () => {
    render(
      <ScheduleConfigurationPanel config={mockConfig} onChange={mockOnChange} />
    );

    const addButton = screen.getByText('Add Calendar');
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[0][0] as ScheduleGlobalConfig;
    expect(lastCall.buildingDefaults.b1.googleCalendarIds).toHaveLength(2);
    expect(lastCall.buildingDefaults.b1.googleCalendarIds).toContain('');
  });

  it('switches buildings', () => {
    render(
      <ScheduleConfigurationPanel config={mockConfig} onChange={mockOnChange} />
    );

    const b2Button = screen.getByText('Building 2');
    fireEvent.click(b2Button);

    expect(
      screen.getByText((_content, element) => {
        const hasText = (node: Element) =>
          node.textContent ===
          'These items will pre-populate the widget when a teacher in Building 2 instantiates it.';
        const nodeHasText = element ? hasText(element) : false;
        const childrenDontHaveText = Array.from(element?.children ?? []).every(
          (child) => !hasText(child)
        );
        return nodeHasText && childrenDontHaveText;
      })
    ).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Task 1')).not.toBeInTheDocument();
  });
});
