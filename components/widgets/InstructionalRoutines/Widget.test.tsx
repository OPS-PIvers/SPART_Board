import { render, screen, fireEvent } from '@testing-library/react';
import { InstructionalRoutinesWidget } from './Widget';
import { InstructionalRoutinesSettings } from './Settings';
import { vi, describe, it, expect } from 'vitest';
import { WidgetData } from '../../../types';

const mocks = vi.hoisted(() => ({
  addWidget: vi.fn(),
  updateWidget: vi.fn(),
  clearAllStickers: vi.fn(),
}));

vi.mock('../../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: mocks.updateWidget,
    gradeFilter: 'all',
    addWidget: mocks.addWidget,
    clearAllStickers: mocks.clearAllStickers,
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

  it('generates HTML with standardized classes when launching Blooms resource', () => {
    const bloomsWidget = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        selectedRoutineId: 'blooms-analysis',
      }
    };

    render(<InstructionalRoutinesWidget widget={bloomsWidget} />);

    // Find the Key Words button
    const keyWordsBtn = screen.getByText(/Key Words/i);
    fireEvent.click(keyWordsBtn);

    expect(mocks.addWidget).toHaveBeenCalled();
    const callArgs = mocks.addWidget.mock.lastCall;
    const type = callArgs![0];
    const config = callArgs![1].config;

    expect(type).toBe('text');
    // Expect the standardized class
    expect(config.content).toContain('text-brand-blue-primary');
  });
});

describe('InstructionalRoutinesSettings', () => {
  it('renders correctly', () => {
    render(<InstructionalRoutinesSettings widget={mockWidget} />);
    expect(screen.getByText(/Step Editor/i)).toBeInTheDocument();
  });
});
