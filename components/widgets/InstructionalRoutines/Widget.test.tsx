import { render, screen } from '@testing-library/react';
import { InstructionalRoutinesWidget } from './Widget';
import { InstructionalRoutinesSettings } from './Settings';
import { vi, describe, it, expect } from 'vitest';
import { WidgetData } from '../../../types';

vi.mock('../../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: vi.fn(),
    gradeFilter: 'all',
    addWidget: vi.fn(),
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
  config: {
      selectedRoutineId: null,
      customSteps: [],
      favorites: [],
      scaleMultiplier: 1
  }
};

describe('InstructionalRoutinesWidget', () => {
  it('renders correctly in library mode', () => {
    render(<InstructionalRoutinesWidget widget={mockWidget} />);
    expect(screen.getByText(/Library/i)).toBeInTheDocument();
  });
});

describe('InstructionalRoutinesSettings', () => {
  it('renders correctly', () => {
    render(<InstructionalRoutinesSettings widget={mockWidget} />);
    expect(screen.getByText(/Step Editor/i)).toBeInTheDocument();
  });
});
