import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HorizonCommandPalette } from './HorizonCommandPalette';
import { TOOLS } from '../../config/tools';

// Mock Hooks
const mockAddWidget = vi.fn();
const mockLoadDashboard = vi.fn();
const mockClearAllWidgets = vi.fn();
const mockToggleGlobalFreeze = vi.fn();
const mockCreateNewDashboard = vi.fn();

vi.mock('../../context/useDashboard', () => ({
  useDashboard: () => ({
    addWidget: mockAddWidget,
    dashboards: [
      { id: 'db-1', name: 'Board 1' },
      { id: 'db-2', name: 'Board 2' },
    ],
    loadDashboard: mockLoadDashboard,
    clearAllWidgets: mockClearAllWidgets,
    activeDashboard: { id: 'db-1' },
    createNewDashboard: mockCreateNewDashboard,
  }),
}));

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid' },
    isAdmin: false,
  }),
}));

vi.mock('../../hooks/useLiveSession', () => ({
  useLiveSession: () => ({
    session: { isActive: true, frozen: false },
    toggleGlobalFreeze: mockToggleGlobalFreeze,
    startSession: vi.fn(),
    endSession: vi.fn(),
  }),
}));

describe('HorizonCommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('is hidden by default', () => {
    render(<HorizonCommandPalette />);
    expect(
      screen.queryByPlaceholderText('Type a command or search...')
    ).not.toBeInTheDocument();
  });

  it('opens on Cmd+K', async () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Type a command or search...')
      ).toBeInTheDocument();
    });
  });

  it('lists tools (default view)', async () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    await waitFor(() => {
      // Top items (Tools) should be visible
      expect(screen.getByText(TOOLS[0].label)).toBeInTheDocument();
    });
  });

  it('filters results based on query', async () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'freeze' } });

    await waitFor(() => {
      expect(screen.getByText('Freeze Students')).toBeInTheDocument();
      // Should filter out unrelated items (assuming 'Board 2' doesn't match 'freeze')
      expect(screen.queryByText('Board 2')).not.toBeInTheDocument();
    });
  });

  it('executes action on click', async () => {
    // Mock confirm for Clear Board action
    window.confirm = vi.fn(() => true);

    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'clear' } });

    const clearBtn = await screen.findByText('Clear Board');
    fireEvent.click(clearBtn);

    expect(mockClearAllWidgets).toHaveBeenCalled();
  });

  it('navigates and executes with keyboard', async () => {
    render(<HorizonCommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const input = screen.getByPlaceholderText('Type a command or search...');

    // Search for "New Board"
    fireEvent.change(input, { target: { value: 'New Board' } });

    await waitFor(() => screen.getByText('New Board'));

    // "New Board" should be the top result. Press Enter to select it.
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockCreateNewDashboard).toHaveBeenCalled();
  });
});
