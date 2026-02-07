import { render, screen, fireEvent } from '@testing-library/react';
import { InstructionalRoutinesWidget } from './Widget';
import { InstructionalRoutinesSettings } from './Settings';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WidgetData, InstructionalRoutinesConfig } from '../../../types';

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

const mockConfig: InstructionalRoutinesConfig = {
  selectedRoutineId: null,
  customSteps: [],
  favorites: [],
  scaleMultiplier: 1,
};

const mockWidget: WidgetData = {
  id: 'test-widget',
  type: 'instructionalRoutines',
  w: 400,
  h: 300,
  x: 0,
  y: 0,
  z: 0,
  flipped: false,
  config: mockConfig,
};

describe('InstructionalRoutinesWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in library mode', () => {
    render(<InstructionalRoutinesWidget widget={mockWidget} />);
    expect(screen.getByText(/Library/i)).toBeInTheDocument();
  });

  it('generates HTML with standardized classes when launching Blooms resource', () => {
    const bloomsConfig: InstructionalRoutinesConfig = {
      ...mockConfig,
      selectedRoutineId: 'blooms-analysis',
    };

    const bloomsWidget: WidgetData = {
      ...mockWidget,
      config: bloomsConfig,
    };

    render(<InstructionalRoutinesWidget widget={bloomsWidget} />);

    // Find the Key Words button
    const keyWordsBtn = screen.getByText(/Key Words/i);
    fireEvent.click(keyWordsBtn);

    expect(mocks.addWidget).toHaveBeenCalled();
    const callArgs = mocks.addWidget.mock.lastCall;

    expect(callArgs).toBeDefined();
    if (!callArgs) throw new Error('addWidget was not called');

    const [type, payload] = callArgs as [
      string,
      { config: { content: string } },
    ];

    expect(type).toBe('text');
    // Expect the standardized class
    expect(payload.config.content).toContain('text-brand-blue-primary');

    // Expect no inline styles or hardcoded hex values (Regression Check)
    expect(payload.config.content).not.toContain('style=');
    expect(payload.config.content).not.toContain('#2d3f89');
    expect(payload.config.content).not.toContain('font-weight:');
  });
});

describe('InstructionalRoutinesSettings', () => {
  it('renders correctly', () => {
    render(<InstructionalRoutinesSettings widget={mockWidget} />);
    expect(screen.getByText(/Step Editor/i)).toBeInTheDocument();
  });
});
