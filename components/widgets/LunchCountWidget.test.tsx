import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { LunchCountWidget, LunchCountSettings } from './LunchCountWidget';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { WidgetData, LunchCountConfig } from '../../types';

// Mock dependencies
vi.mock('../../context/useDashboard');
vi.mock('../../context/useAuth');
vi.mock('../common/RosterModeControl', () => ({
  RosterModeControl: ({ onModeChange }: { onModeChange: (mode: string) => void }) => (
    <div data-testid="roster-mode-control">
      <button onClick={() => onModeChange('custom')}>Switch to Custom</button>
    </div>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="icon-users" />,
  RefreshCw: () => <div data-testid="icon-refresh" />,
  School: () => <div data-testid="icon-school" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Undo2: () => <div data-testid="icon-undo" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
  Box: () => <div data-testid="icon-box" />,
  X: () => <div data-testid="icon-x" />,
  FileSpreadsheet: () => <div data-testid="icon-file" />,
  Send: () => <div data-testid="icon-send" />,
}));

const mockUpdateWidget = vi.fn();
const mockAddToast = vi.fn();

const mockWidget: WidgetData = {
  id: 'lunch-1',
  type: 'lunchCount',
  x: 0,
  y: 0,
  w: 4,
  h: 4,
  z: 1,
  flipped: false,
  config: {
    schoolSite: 'schumann-elementary',
    cachedMenu: null,
    isManualMode: false,
    manualHotLunch: '',
    manualBentoBox: '',
    roster: ['Student A', 'Student B'],
    assignments: {},
    rosterMode: 'class',
  } as LunchCountConfig,
};

describe('LunchCountWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useDashboard as unknown as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      rosters: [
        { id: 'roster-1', name: 'Class 1', students: [{ firstName: 'John', lastName: 'Doe' }] }
      ],
      activeRosterId: 'roster-1',
    });

    (useAuth as unknown as Mock).mockReturnValue({
      user: { displayName: 'Teacher Test', email: 'teacher@test.com' },
      featurePermissions: [],
    });

    // Mock global fetch with a default failing response to prevent crash in useEffect
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found')
    });
  });

  it('renders correctly with default state', () => {
    render(<LunchCountWidget widget={mockWidget} />);

    expect(screen.getAllByText('Hot Lunch')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Bento Box')[0]).toBeInTheDocument();
    expect(screen.getByText('Home Lunch')).toBeInTheDocument();
    expect(screen.getAllByText('Loading...')[0]).toBeInTheDocument(); // Menu loading state
  });

  it('cycles student assignment on click', () => {
    const assignedWidget = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        rosterMode: 'custom',
        roster: ['Student A'],
        assignments: {},
      } as LunchCountConfig
    };

    render(<LunchCountWidget widget={assignedWidget} />);

    const student = screen.getByText('Student A');
    fireEvent.click(student);

    // Expect update to Hot
    expect(mockUpdateWidget).toHaveBeenCalledWith('lunch-1', {
      config: expect.objectContaining({
        assignments: { 'Student A': 'hot' }
      })
    });
  });

  it('opens submit report modal', () => {
    render(<LunchCountWidget widget={mockWidget} />);

    const submitBtn = screen.getByText('Submit Report');
    fireEvent.click(submitBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Submit Lunch Report')).toBeInTheDocument();
  });

  it('fetches nutrislice menu manually', async () => {
    const mockMenu = {
      days: [{
        date: new Date().toISOString().split('T')[0],
        menu_items: [
          {
            is_section_title: false,
            section_name: 'Entree',
            food: { name: 'Pizza' }
          }
        ]
      }]
    };

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockMenu)),
    });

    render(<LunchCountWidget widget={mockWidget} />);

    const refreshBtn = screen.getByTitle('Sync from Nutrislice');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Menu synced from Nutrislice', 'success');
    });
  });

  it('handles reset board', () => {
     render(<LunchCountWidget widget={mockWidget} />);

     const resetBtn = screen.getByText('Reset');
     fireEvent.click(resetBtn);

     expect(mockUpdateWidget).toHaveBeenCalledWith('lunch-1', {
        config: expect.objectContaining({
            assignments: {}
        })
     });
     expect(mockAddToast).toHaveBeenCalledWith('Board reset', 'info');
  });
});

describe('LunchCountSettings', () => {
   beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
    });
  });

  it('toggles manual mode', () => {
    render(<LunchCountSettings widget={mockWidget} />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(mockUpdateWidget).toHaveBeenCalledWith('lunch-1', {
      config: expect.objectContaining({
        isManualMode: true
      })
    });
  });

  it('updates manual lunch names when in manual mode', () => {
      const manualWidget = {
          ...mockWidget,
          config: { ...mockWidget.config, isManualMode: true }
      };

      render(<LunchCountSettings widget={manualWidget} />);

      const hotInput = screen.getByPlaceholderText('Hot Lunch Name');
      fireEvent.change(hotInput, { target: { value: 'Tacos' } });

      expect(mockUpdateWidget).toHaveBeenCalledWith('lunch-1', {
          config: expect.objectContaining({
              manualHotLunch: 'Tacos'
          })
      });
  });
});
